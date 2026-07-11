from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import heuristics, queue_engine
from app.auth import get_current_student
from app.database import get_db
from app.exam_service import admit_as_many_as_possible, broadcast_admin_snapshot, compute_time_remaining, get_exam_questions, grade_answer
from app.models import (
    ActivityEventType,
    ActivityLog,
    Answer,
    AuditLog,
    Exam,
    ExamSession,
    ExamStatus,
    LogType,
    SessionStatus,
    User,
    gen_uuid,
)
from app.schemas import (
    AnswerPayload,
    ExamOut,
    MessageResponse,
    PracticeQuestionOut,
    QuestionOut,
    SaveAnswersRequest,
    SessionOut,
    SubmitRequest,
    SubmitResponse,
)

router = APIRouter(prefix="/api/exams", tags=["exams"])


def _get_exam_or_404(db: Session, slug: str) -> Exam:
    exam = db.query(Exam).filter(Exam.slug == slug).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    return exam


def _client_meta(request: Request) -> dict:
    return {
        "ip_address": request.client.host if request.client else None,
        "device": request.headers.get("sec-ch-ua-platform", "unknown"),
        "browser": request.headers.get("user-agent", "unknown")[:255],
    }


def _session_out(db: Session, session: ExamSession, exam: Exam) -> SessionOut:
    out = SessionOut.model_validate(session)
    if session.status == SessionStatus.waiting:
        out.estimated_wait_seconds = heuristics.estimate_wait_seconds(db, exam, session.queue_position)
    return out


@router.get("/{slug}", response_model=ExamOut)
def get_exam(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    exam = _get_exam_or_404(db, slug)
    db.add(ActivityLog(student_id=user.id, exam_id=exam.id, event_type=ActivityEventType.opened_link))
    db.commit()
    return ExamOut.model_validate(exam)


@router.post("/{slug}/start", response_model=SessionOut)
async def start_exam(slug: str, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    exam = _get_exam_or_404(db, slug)

    if exam.status != ExamStatus.published:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam is not currently published.")

    now = datetime.utcnow()
    if exam.start_date and now < exam.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam has not started yet.")
    if exam.end_date and now > exam.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam has already ended.")

    # Session Restore / Duplicate Login Prevention: resume any existing non-terminal session instead of re-queueing.
    existing = (
        db.query(ExamSession)
        .filter(
            ExamSession.exam_id == exam.id,
            ExamSession.student_id == user.id,
            ExamSession.status.in_([SessionStatus.waiting, SessionStatus.in_progress]),
        )
        .first()
    )
    if existing:
        db.add(ActivityLog(student_id=user.id, exam_id=exam.id, session_id=existing.id, event_type=ActivityEventType.reconnect, **_client_meta(request)))
        db.commit()
        existing.time_remaining_seconds = compute_time_remaining(existing, exam)
        return _session_out(db, existing, exam)

    meta = _client_meta(request)
    # Generate the id upfront so the atomic Redis capacity-check-and-admit (below) can
    # reference it before the DB row exists — see queue_engine.try_admit_immediately for why
    # this replaced a separate "read active_count, then admit" pair of calls (a real race:
    # two concurrent arrivals could both read capacity as available and both get admitted).
    session_id = gen_uuid()
    admitted = await queue_engine.try_admit_immediately(exam.id, session_id, exam.max_active_students)

    session = ExamSession(id=session_id, exam_id=exam.id, student_id=user.id, **meta)

    if admitted:
        session.status = SessionStatus.in_progress
        session.entered_exam_at = now
        session.time_remaining_seconds = exam.duration_minutes * 60
        db.add(session)
        db.commit()
        db.refresh(session)
        db.add(ActivityLog(student_id=user.id, exam_id=exam.id, session_id=session.id, event_type=ActivityEventType.exam_start, **meta))
    else:
        queue_length = await queue_engine.get_queue_length(exam.id)
        if queue_length >= exam.queue_capacity:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="The waiting queue is full. Please try again later.")
        session.status = SessionStatus.waiting
        session.joined_queue_at = now
        db.add(session)
        db.commit()
        db.refresh(session)
        await queue_engine.join_queue(exam.id, session.id)
        session.queue_position = await queue_engine.get_queue_position(exam.id, session.id)
        db.add(session)
        db.add(ActivityLog(student_id=user.id, exam_id=exam.id, session_id=session.id, event_type=ActivityEventType.queue_entry, **meta))

    db.commit()
    db.refresh(session)
    await broadcast_admin_snapshot(db, exam.id)
    return _session_out(db, session, exam)


@router.get("/{slug}/my-session", response_model=SessionOut | None)
async def get_my_session(slug: str, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    """Refresh/reconnect recovery: lets the frontend silently resume a waiting or in-progress
    session after a browser refresh, instead of losing queue position or exam progress."""
    exam = _get_exam_or_404(db, slug)
    session = (
        db.query(ExamSession)
        .filter(
            ExamSession.exam_id == exam.id,
            ExamSession.student_id == user.id,
            ExamSession.status.in_([SessionStatus.waiting, SessionStatus.in_progress]),
        )
        .first()
    )
    if not session:
        return None
    if session.status == SessionStatus.waiting:
        session.queue_position = await queue_engine.get_queue_position(exam.id, session.id)
        db.commit()
        db.refresh(session)
    else:
        session.time_remaining_seconds = compute_time_remaining(session, exam)
    db.add(ActivityLog(student_id=user.id, exam_id=exam.id, session_id=session.id, event_type=ActivityEventType.reconnect, **_client_meta(request)))
    db.commit()
    return _session_out(db, session, exam)


@router.get("/{slug}/questions", response_model=list[QuestionOut])
def get_questions(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    exam = _get_exam_or_404(db, slug)
    session = (
        db.query(ExamSession)
        .filter(ExamSession.exam_id == exam.id, ExamSession.student_id == user.id, ExamSession.status == SessionStatus.in_progress)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have an active exam session.")
    return [QuestionOut.model_validate(q) for q in get_exam_questions(db, exam.id)]


@router.get("/{slug}/practice-questions", response_model=list[PracticeQuestionOut])
def get_practice_questions(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    """Heuristic recommendations for the Smart Waiting Lounge — subject/topic matches from
    the Question Bank, never this exam's own questions. See app/heuristics.py."""
    exam = _get_exam_or_404(db, slug)
    return [PracticeQuestionOut.model_validate(q) for q in heuristics.recommend_practice_questions(db, exam)]


@router.post("/{slug}/practice-questions/{question_id}/click", response_model=MessageResponse)
def log_practice_question_click(slug: str, question_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    """AI data-collection hook: records which recommendations students actually engage with,
    so a future trained model has real labels to learn from (see README AI/ML roadmap)."""
    exam = _get_exam_or_404(db, slug)
    db.add(ActivityLog(
        student_id=user.id, exam_id=exam.id, event_type=ActivityEventType.practice_recommendation_click,
        event_metadata={"question_id": question_id},
    ))
    db.commit()
    return {"message": "Recorded"}


def _get_own_session(db: Session, session_id: str, user: User) -> ExamSession:
    session = db.get(ExamSession, session_id)
    if not session or session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    session = _get_own_session(db, session_id, user)
    exam = db.get(Exam, session.exam_id)
    if session.status == SessionStatus.in_progress:
        session.time_remaining_seconds = compute_time_remaining(session, exam)
    return _session_out(db, session, exam)


@router.patch("/sessions/{session_id}/answers", response_model=MessageResponse)
def save_answers(session_id: str, payload: SaveAnswersRequest, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    session = _get_own_session(db, session_id, user)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam session is no longer editable.")

    for item in payload.answers:
        answer = (
            db.query(Answer).filter(Answer.session_id == session.id, Answer.question_id == item.question_id).first()
        )
        if answer:
            answer.answer_text = item.answer_text
        else:
            answer = Answer(session_id=session.id, question_id=item.question_id, answer_text=item.answer_text)
            db.add(answer)
    db.commit()
    return {"message": "Answers saved"}


@router.get("/sessions/{session_id}/answers", response_model=list[AnswerPayload])
def get_answers(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    session = _get_own_session(db, session_id, user)
    answers = db.query(Answer).filter(Answer.session_id == session.id).all()
    return [AnswerPayload(question_id=a.question_id, answer_text=a.answer_text) for a in answers]


@router.post("/sessions/{session_id}/leave", response_model=MessageResponse)
async def leave_queue(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    session = _get_own_session(db, session_id, user)
    if session.status != SessionStatus.waiting:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not currently waiting in a queue.")

    await queue_engine.leave_queue(session.exam_id, session.id)
    session.status = SessionStatus.exited
    db.add(session)
    db.add(ActivityLog(student_id=user.id, exam_id=session.exam_id, session_id=session.id, event_type=ActivityEventType.queue_exit))
    db.commit()

    exam = db.get(Exam, session.exam_id)
    await admit_as_many_as_possible(db, exam)
    return {"message": "Left the queue"}


@router.post("/sessions/{session_id}/submit", response_model=SubmitResponse)
async def submit_exam(session_id: str, payload: SubmitRequest, db: Session = Depends(get_db), user: User = Depends(get_current_student)):
    session = _get_own_session(db, session_id, user)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam has already been submitted or is not active.")

    exam = db.get(Exam, session.exam_id)
    questions = {q.id: q for q in get_exam_questions(db, exam.id)}

    # 2. Persist all answers (final sync on top of whatever was autosaved)
    for item in payload.answers:
        answer = db.query(Answer).filter(Answer.session_id == session.id, Answer.question_id == item.question_id).first()
        if answer:
            answer.answer_text = item.answer_text
        else:
            answer = Answer(session_id=session.id, question_id=item.question_id, answer_text=item.answer_text)
            db.add(answer)
    db.commit()

    # 6. Calculate score. total_marks is the full exam total (every question), not just answered ones,
    # so skipped questions correctly count against the student's percentage.
    total_score = 0
    total_marks = sum(q.marks for q in questions.values())
    needs_review = False
    existing_answers = {a.question_id: a for a in db.query(Answer).filter(Answer.session_id == session.id).all()}
    for question in questions.values():
        answer = existing_answers.get(question.id)
        answer_text = answer.answer_text if answer else ""
        if answer is None:
            answer = Answer(session_id=session.id, question_id=question.id, answer_text="")
        is_correct, marks_awarded, review_flag = grade_answer(question, answer_text)
        answer.is_correct = is_correct
        answer.marks_awarded = marks_awarded
        total_score += marks_awarded
        needs_review = needs_review or review_flag
        db.add(answer)

    # 3, 4, 5. Lock editing, timestamp, mark completed
    session.status = SessionStatus.submitted
    session.submitted_at = datetime.utcnow()
    session.score = max(0, total_score)
    session.total_marks = total_marks
    session.passed = total_score >= exam.passing_marks
    session.needs_review = needs_review
    if payload.proctoring_violations is not None:
        session.proctoring_violations = payload.proctoring_violations
    db.add(session)

    # 7. Submission log
    db.add(
        ActivityLog(
            student_id=user.id,
            exam_id=exam.id,
            session_id=session.id,
            event_type=ActivityEventType.submission,
            event_metadata={"score": session.score, "total_marks": total_marks, "passed": session.passed},
        )
    )
    db.add(
        AuditLog(
            actor=user.name,
            message=f'Student "{user.name}" submitted exam "{exam.title}". Score: {session.score}/{total_marks} ({"PASS" if session.passed else "FAIL"})',
            type=LogType.success if session.passed else LogType.danger,
        )
    )
    db.commit()
    db.refresh(session)

    # 8 & 9. Free the slot and auto-admit the next waiting student
    await queue_engine.release_slot(exam.id, session.id)
    await admit_as_many_as_possible(db, exam)  # also broadcasts admin snapshot + notifies the admitted student (10)

    return SubmitResponse(session=SessionOut.model_validate(session), redirect_to=f"/exam/{exam.slug}/completed")
