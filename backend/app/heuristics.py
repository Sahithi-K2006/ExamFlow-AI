"""Rule-based (heuristic) engines for queue wait-time estimation and practice-question
recommendation. Deliberately NOT machine learning — no trained model, no offline training
step — but real, working logic that improves automatically as more sessions complete for
an exam. The architecture (this module's function signatures, called from exam_service.py
and routers/exams.py) is intentionally decoupled from the frontend/API contracts so a future
trained model can replace the body of these functions without any other code changing.
See README.md "AI & Machine Learning" section for the roadmap this is designed to support.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Exam, ExamSession, Question, SessionStatus


def average_completion_seconds(db: Session, exam: Exam, lookback: int = 20) -> float:
    """Average real wall-clock time students spent from admission to submission for this
    exam, over the most recent `lookback` completed sessions. Falls back to the exam's
    configured duration on cold start (no completions yet)."""
    rows = db.execute(
        select(ExamSession.entered_exam_at, ExamSession.submitted_at)
        .where(
            ExamSession.exam_id == exam.id,
            ExamSession.status == SessionStatus.submitted,
            ExamSession.entered_exam_at.is_not(None),
            ExamSession.submitted_at.is_not(None),
        )
        .order_by(ExamSession.submitted_at.desc())
        .limit(lookback)
    ).all()
    if not rows:
        return exam.duration_minutes * 60
    durations = [(submitted - entered).total_seconds() for entered, submitted in rows]
    return sum(durations) / len(durations)


def estimate_wait_seconds(db: Session, exam: Exam, queue_position: int) -> int:
    """Little's-Law-style approximation: with `max_active_students` slots running in
    parallel, slots free up at a combined rate of (active_slots / avg_completion_seconds).
    A student in position N needs N slots to free up ahead of them (strict FIFO), so:
        estimated_wait = N * avg_completion_seconds / active_slots
    Recomputed from live data on every call — not a static number, and not a trained model."""
    if queue_position <= 0:
        return 0
    avg_seconds = average_completion_seconds(db, exam)
    active_slots = max(1, exam.max_active_students)
    return int(round(queue_position * avg_seconds / active_slots))


def recommend_practice_questions(db: Session, exam: Exam, limit: int = 5) -> list[Question]:
    """Subject/topic match against the Question Bank, explicitly excluding this exam's own
    assigned question IDs — a recommendation can never surface an actual exam question,
    only other questions in the bank that share a subject or topic with it."""
    exam_question_ids = {eq.question_id for eq in exam.questions}
    exam_subjects = {eq.question.subject for eq in exam.questions if eq.question and eq.question.subject}
    exam_topics = {eq.question.topic for eq in exam.questions if eq.question and eq.question.topic}

    if not exam_subjects and not exam_topics:
        return []

    query = select(Question)
    if exam_question_ids:
        query = query.where(Question.id.not_in(exam_question_ids))
    candidates = db.execute(query).scalars().all()

    def score(q: Question) -> int:
        s = 0
        if q.subject and q.subject in exam_subjects:
            s += 2
        if q.topic and q.topic in exam_topics:
            s += 2
        return s

    scored = [(score(q), q) for q in candidates]
    scored = [(s, q) for s, q in scored if s > 0]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [q for _, q in scored[:limit]]
