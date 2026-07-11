from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import storage
from app.auth import get_current_admin
from app.database import get_db
from app.models import AuditLog, LogType, Question, User
from app.schemas import QuestionAdminOut, QuestionCreate, QuestionUpdate

router = APIRouter(prefix="/api/admin/questions", tags=["admin-questions"])


def _get_question_or_404(db: Session, question_id: str) -> Question:
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


@router.get("", response_model=list[QuestionAdminOut])
def list_questions(
    search: str | None = None,
    type: str | None = None,
    subject: str | None = None,
    difficulty: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    query = db.query(Question)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Question.question_text.ilike(like), Question.subject.ilike(like), Question.topic.ilike(like)))
    if type:
        query = query.filter(Question.type == type)
    if subject:
        query = query.filter(Question.subject == subject)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    questions = query.order_by(Question.created_at.desc()).all()
    return [QuestionAdminOut.model_validate(q) for q in questions]


@router.post("", response_model=QuestionAdminOut, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    question = Question(**payload.model_dump(), created_by=admin.id)
    db.add(question)
    db.add(AuditLog(actor=admin.name, message=f'Admin created question: "{question.question_text[:80]}"', type=LogType.success))
    db.commit()
    db.refresh(question)
    return QuestionAdminOut.model_validate(question)


@router.get("/{question_id}", response_model=QuestionAdminOut)
def get_question(question_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return QuestionAdminOut.model_validate(_get_question_or_404(db, question_id))


@router.patch("/{question_id}", response_model=QuestionAdminOut)
def update_question(question_id: str, payload: QuestionUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    question = _get_question_or_404(db, question_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.add(question)
    db.add(AuditLog(actor=admin.name, message=f'Admin updated question: "{question.question_text[:80]}"', type=LogType.info))
    db.commit()
    db.refresh(question)
    return QuestionAdminOut.model_validate(question)


@router.delete("/{question_id}", response_model=dict)
def delete_question(question_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    question = _get_question_or_404(db, question_id)
    db.delete(question)
    db.add(AuditLog(actor=admin.name, message=f'Admin deleted question: "{question.question_text[:80]}"', type=LogType.danger))
    db.commit()
    return {"message": "Question deleted"}


@router.post("/{question_id}/duplicate", response_model=QuestionAdminOut, status_code=status.HTTP_201_CREATED)
def duplicate_question(question_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    original = _get_question_or_404(db, question_id)
    copy = Question(
        type=original.type,
        question_text=f"{original.question_text} (copy)",
        options=original.options,
        correct_answer=original.correct_answer,
        initial_code=original.initial_code,
        test_cases=original.test_cases,
        difficulty=original.difficulty,
        marks=original.marks,
        negative_marks=original.negative_marks,
        subject=original.subject,
        topic=original.topic,
        tags=original.tags,
        explanation=original.explanation,
        image_url=original.image_url,
        attachments=original.attachments,
        programming_language=original.programming_language,
        created_by=admin.id,
    )
    db.add(copy)
    db.add(AuditLog(actor=admin.name, message=f'Admin duplicated question: "{original.question_text[:80]}"', type=LogType.info))
    db.commit()
    db.refresh(copy)
    return QuestionAdminOut.model_validate(copy)


@router.post("/{question_id}/image", response_model=QuestionAdminOut)
async def upload_question_image(question_id: str, file: UploadFile, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    question = _get_question_or_404(db, question_id)
    content = await file.read()
    path = f"questions/{question_id}/{file.filename}"
    url = storage.upload_file(path, content, file.content_type or "application/octet-stream")
    question.image_url = url
    db.add(question)
    db.add(AuditLog(actor=admin.name, message=f'Admin uploaded an image for question: "{question.question_text[:80]}"', type=LogType.info))
    db.commit()
    db.refresh(question)
    return QuestionAdminOut.model_validate(question)
