import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import queue_engine
from app.auth import get_current_admin
from app.database import get_db
from app.exam_service import admit_as_many_as_possible, broadcast_admin_snapshot, broadcast_queue_positions, build_admin_queue
from app.models import (
    ActivityEventType,
    ActivityLog,
    AuditLog,
    Exam,
    ExamQuestion,
    ExamSession,
    ExamStatus,
    LogType,
    Question,
    SessionStatus,
    User,
)
from app.schemas import (
    AdminQueueStudent,
    AssignQuestionsRequest,
    CapacityUpdateRequest,
    ExamCreate,
    ExamOut,
    ExamUpdate,
    MessageResponse,
)
from app.websocket_manager import manager

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _get_exam_or_404(db: Session, exam_id: str) -> Exam:
    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    return exam


def _exam_out(exam: Exam) -> ExamOut:
    out = ExamOut.model_validate(exam)
    out.question_count = len(exam.questions)
    out.question_ids = [eq.question_id for eq in exam.questions]
    return out


def _slugify(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "exam"
    return base


def _unique_slug(db: Session, title: str) -> str:
    base = _slugify(title)
    slug = base
    suffix = 1
    while db.query(Exam).filter(Exam.slug == slug).first() is not None:
        suffix += 1
        slug = f"{base}-{suffix}"
    return slug


@router.get("/exams", response_model=list[ExamOut])
def list_exams(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    exams = db.query(Exam).order_by(Exam.created_at.desc()).all()
    return [_exam_out(e) for e in exams]


@router.post("/exams", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    slug = payload.slug.strip().lower() if payload.slug else _unique_slug(db, payload.title)
    if payload.slug and db.query(Exam).filter(Exam.slug == slug).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An exam with this slug already exists.")
    exam = Exam(**payload.model_dump(exclude={"slug"}), slug=slug, created_by=admin.id)
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin created exam: "{exam.title}"', type=LogType.success))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.get("/exams/{exam_id}", response_model=ExamOut)
def get_exam_detail(exam_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return _exam_out(_get_exam_or_404(db, exam_id))


@router.patch("/exams/{exam_id}", response_model=ExamOut)
def update_exam(exam_id: str, payload: ExamUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin updated exam: "{exam.title}"', type=LogType.info))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.delete("/exams/{exam_id}", response_model=MessageResponse)
def delete_exam(exam_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    db.delete(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin deleted exam: "{exam.title}"', type=LogType.danger))
    db.commit()
    return {"message": "Exam deleted"}


@router.post("/exams/{exam_id}/duplicate", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def duplicate_exam(exam_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    original = _get_exam_or_404(db, exam_id)
    copy = Exam(
        slug=_unique_slug(db, f"{original.title} copy"),
        title=f"{original.title} (copy)",
        description=original.description,
        instructions=original.instructions,
        duration_minutes=original.duration_minutes,
        passing_marks=original.passing_marks,
        negative_marking=original.negative_marking,
        random_question_order=original.random_question_order,
        random_option_order=original.random_option_order,
        max_active_students=original.max_active_students,
        queue_capacity=original.queue_capacity,
        programming_languages=original.programming_languages,
        browser_restrictions=original.browser_restrictions,
        status=ExamStatus.draft,
        created_by=admin.id,
    )
    db.add(copy)
    db.flush()  # assign copy.id before creating ExamQuestion rows that reference it
    for eq in original.questions:
        db.add(ExamQuestion(exam_id=copy.id, question_id=eq.question_id, order_index=eq.order_index))
    db.add(AuditLog(actor=admin.name, message=f'Admin duplicated exam: "{original.title}"', type=LogType.info))
    db.commit()
    db.refresh(copy)
    return _exam_out(copy)


@router.post("/exams/{exam_id}/publish", response_model=ExamOut)
def publish_exam(exam_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    if not exam.questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot publish an exam with no questions assigned.")
    exam.status = ExamStatus.published
    exam.published_at = datetime.utcnow()
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin published exam: "{exam.title}"', type=LogType.success))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.post("/exams/{exam_id}/unpublish", response_model=ExamOut)
def unpublish_exam(exam_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    exam.status = ExamStatus.unpublished
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin unpublished exam: "{exam.title}"', type=LogType.warning))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.post("/exams/{exam_id}/archive", response_model=ExamOut)
def archive_exam(exam_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    exam.status = ExamStatus.archived
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin archived exam: "{exam.title}"', type=LogType.warning))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.put("/exams/{exam_id}/questions", response_model=ExamOut)
def assign_questions(exam_id: str, payload: AssignQuestionsRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    found = db.query(Question.id).filter(Question.id.in_(payload.question_ids)).all()
    found_ids = {row[0] for row in found}
    missing = [qid for qid in payload.question_ids if qid not in found_ids]
    if missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown question id(s): {', '.join(missing)}")

    db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).delete()
    for index, question_id in enumerate(payload.question_ids):
        db.add(ExamQuestion(exam_id=exam.id, question_id=question_id, order_index=index))
    db.add(AuditLog(actor=admin.name, message=f'Admin updated question set for exam: "{exam.title}" ({len(payload.question_ids)} questions)', type=LogType.info))
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.get("/exams/{exam_id}/queue", response_model=list[AdminQueueStudent])
async def get_queue(exam_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    _get_exam_or_404(db, exam_id)
    return await build_admin_queue(db, exam_id)


@router.patch("/exams/{exam_id}/capacity", response_model=ExamOut)
async def update_capacity(exam_id: str, payload: CapacityUpdateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    exam = _get_exam_or_404(db, exam_id)
    exam.max_active_students = payload.max_active_students
    db.add(exam)
    db.add(AuditLog(actor=admin.name, message=f'Admin adjusted max concurrent slot capacity to: {payload.max_active_students}', type=LogType.warning))
    db.commit()
    db.refresh(exam)

    await admit_as_many_as_possible(db, exam)
    return _exam_out(exam)


@router.post("/exam-sessions/{session_id}/force-admit", response_model=MessageResponse)
async def force_admit(session_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    session = db.get(ExamSession, session_id)
    if not session or session.status != SessionStatus.waiting:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student is not currently waiting.")

    exam = _get_exam_or_404(db, session.exam_id)
    await queue_engine.leave_queue(exam.id, session.id)
    await queue_engine.admit_immediately(exam.id, session.id)

    session.status = SessionStatus.in_progress
    session.entered_exam_at = datetime.utcnow()
    session.time_remaining_seconds = exam.duration_minutes * 60
    session.queue_position = 0
    db.add(session)
    db.add(ActivityLog(student_id=session.student_id, exam_id=exam.id, session_id=session.id, event_type=ActivityEventType.exam_start))
    db.add(AuditLog(actor=admin.name, message="Admin OVERRIDE: force-admitted a waiting student into the exam.", type=LogType.warning))
    db.commit()

    await manager.send_to_session(session.id, {"type": "admitted", "session_id": session.id})
    await broadcast_queue_positions(db, exam.id)
    await broadcast_admin_snapshot(db, exam.id)
    return {"message": "Student admitted"}


@router.post("/exam-sessions/{session_id}/force-exit", response_model=MessageResponse)
async def force_exit(session_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    session = db.get(ExamSession, session_id)
    if not session or session.status not in (SessionStatus.waiting, SessionStatus.in_progress):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student is not currently active or waiting.")

    exam = _get_exam_or_404(db, session.exam_id)
    was_active = session.status == SessionStatus.in_progress
    if was_active:
        await queue_engine.release_slot(exam.id, session.id)
    else:
        await queue_engine.leave_queue(exam.id, session.id)

    session.status = SessionStatus.exited
    db.add(session)
    db.add(AuditLog(actor=admin.name, message="Admin OVERRIDE: removed a student from the queue/exam.", type=LogType.danger))
    db.commit()

    await manager.send_to_session(session.id, {"type": "exited"})

    if was_active:
        await admit_as_many_as_possible(db, exam)
    else:
        await broadcast_queue_positions(db, exam.id)
        await broadcast_admin_snapshot(db, exam.id)
    return {"message": "Student removed"}
