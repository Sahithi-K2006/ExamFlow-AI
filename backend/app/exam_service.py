from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import heuristics, queue_engine
from app.models import (
    ActivityEventType,
    ActivityLog,
    Exam,
    ExamQuestion,
    ExamSession,
    Question,
    QuestionType,
    SessionStatus,
    User,
)
from app.schemas import ExamOut
from app.websocket_manager import manager


def exam_out(exam: Exam) -> ExamOut:
    out = ExamOut.model_validate(exam)
    out.question_count = len(exam.questions)
    out.question_ids = [eq.question_id for eq in exam.questions]
    return out


def compute_time_remaining(session: ExamSession, exam: Exam) -> int:
    """Derived from entered_exam_at + exam duration rather than trusting a stored counter,
    so refreshing the page can never reset a student's clock back to the full duration."""
    if session.status != SessionStatus.in_progress or not session.entered_exam_at:
        return session.time_remaining_seconds
    elapsed = (datetime.utcnow() - session.entered_exam_at).total_seconds()
    remaining = exam.duration_minutes * 60 - int(elapsed)
    return max(0, remaining)


def grade_answer(question: Question, answer_text: str) -> tuple[bool | None, int, bool]:
    """Returns (is_correct, marks_awarded, needs_review)."""
    answer_text = (answer_text or "").strip()

    if question.type == QuestionType.mcq:
        correct = question.correct_answer.get("value")
        is_correct = answer_text == correct
        return is_correct, (question.marks if is_correct else -question.negative_marks), False

    if question.type == QuestionType.multiple_correct:
        correct_values = set(question.correct_answer.get("values", []))
        given = set(v.strip() for v in answer_text.split("|") if v.strip())
        is_correct = given == correct_values
        return is_correct, (question.marks if is_correct else -question.negative_marks), False

    if question.type == QuestionType.fill_blank:
        correct = (question.correct_answer.get("value") or "").strip().lower()
        is_correct = answer_text.strip().lower() == correct
        return is_correct, (question.marks if is_correct else -question.negative_marks), False

    # coding / sql / short_answer / descriptive: no execution sandbox in scope.
    # Best-effort heuristic score (kept from the original prototype's approach) and flagged for manual review.
    if not answer_text:
        return None, 0, True
    heuristic_marks = max(1, question.marks // 2)
    return None, heuristic_marks, True


async def admit_as_many_as_possible(db: Session, exam: Exam) -> None:
    """Pull waiting students into free slots (FIFO) until capacity is exhausted, updating DB + Redis + WS."""
    while True:
        next_session_id = await queue_engine.try_admit_next(exam.id, exam.max_active_students)
        if not next_session_id:
            break
        session = db.get(ExamSession, next_session_id)
        if not session:
            continue
        session.status = SessionStatus.in_progress
        session.entered_exam_at = datetime.utcnow()
        session.time_remaining_seconds = exam.duration_minutes * 60
        session.queue_position = 0
        db.add(session)
        db.add(ActivityLog(student_id=session.student_id, exam_id=exam.id, session_id=session.id, event_type=ActivityEventType.exam_start))
        db.commit()

        await manager.send_to_session(session.id, {"type": "admitted", "session_id": session.id})

    await broadcast_queue_positions(db, exam.id)
    await broadcast_admin_snapshot(db, exam.id)


async def broadcast_queue_positions(db: Session, exam_id: str) -> None:
    exam = db.get(Exam, exam_id)
    waiting_ids = await queue_engine.get_waiting_session_ids(exam_id)
    for idx, session_id in enumerate(waiting_ids, start=1):
        session = db.get(ExamSession, session_id)
        if session and session.queue_position != idx:
            session.queue_position = idx
            db.add(session)
        estimated_wait = heuristics.estimate_wait_seconds(db, exam, idx) if exam else 0
        await manager.send_to_session(session_id, {
            "type": "queue_position",
            "position": idx,
            "total_waiting": len(waiting_ids),
            "estimated_wait_seconds": estimated_wait,
        })
    db.commit()


async def broadcast_admin_snapshot(db: Session, exam_id: str) -> None:
    snapshot = await build_admin_snapshot(db, exam_id)
    await manager.broadcast_admin(exam_id, {"type": "snapshot", **snapshot})


async def build_admin_snapshot(db: Session, exam_id: str) -> dict:
    active_count = await queue_engine.get_active_count(exam_id)
    waiting_count = await queue_engine.get_queue_length(exam_id)

    completed_total = len(
        db.execute(
            select(ExamSession.id).where(ExamSession.exam_id == exam_id, ExamSession.status == SessionStatus.submitted)
        ).all()
    )

    return {
        "active_count": active_count,
        "waiting_count": waiting_count,
        "completed_count": completed_total,
    }


async def build_admin_queue(db: Session, exam_id: str) -> list[dict]:
    sessions = db.execute(
        select(ExamSession, User)
        .join(User, User.id == ExamSession.student_id)
        .where(ExamSession.exam_id == exam_id, ExamSession.status.in_([SessionStatus.waiting, SessionStatus.in_progress]))
        .order_by(ExamSession.queue_position)
    ).all()

    result = []
    for session, student in sessions:
        result.append(
            {
                "session_id": session.id,
                "student_name": student.name,
                "student_email": student.email,
                "student_code": student.student_id,
                "status": session.status.value,
                "queue_position": session.queue_position,
                "joined_queue_at": session.joined_queue_at,
                "entered_exam_at": session.entered_exam_at,
            }
        )
    return result


def get_exam_questions(db: Session, exam_id: str) -> list[Question]:
    rows = db.execute(
        select(Question)
        .join(ExamQuestion, ExamQuestion.question_id == Question.id)
        .where(ExamQuestion.exam_id == exam_id)
        .order_by(ExamQuestion.order_index)
    ).scalars().all()
    return list(rows)
