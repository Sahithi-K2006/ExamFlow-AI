import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def gen_uuid() -> str:
    return uuid.uuid4().hex


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    student_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    college: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    active_session_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ExamStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    unpublished = "unpublished"
    archived = "archived"


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    instructions: Mapped[str] = mapped_column(Text, default="")

    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    passing_marks: Mapped[int] = mapped_column(Integer, default=0)
    negative_marking: Mapped[bool] = mapped_column(Boolean, default=False)
    random_question_order: Mapped[bool] = mapped_column(Boolean, default=False)
    random_option_order: Mapped[bool] = mapped_column(Boolean, default=False)

    max_active_students: Mapped[int] = mapped_column(Integer, default=3)
    queue_capacity: Mapped[int] = mapped_column(Integer, default=500)

    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    programming_languages: Mapped[list] = mapped_column(JSON, default=list)
    browser_restrictions: Mapped[dict] = mapped_column(JSON, default=dict)

    status: Mapped[ExamStatus] = mapped_column(Enum(ExamStatus), default=ExamStatus.draft, index=True)

    created_by: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    questions: Mapped[list["ExamQuestion"]] = relationship(
        back_populates="exam", cascade="all, delete-orphan", order_by="ExamQuestion.order_index"
    )


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    multiple_correct = "multiple_correct"
    coding = "coding"
    sql = "sql"
    fill_blank = "fill_blank"
    short_answer = "short_answer"
    descriptive = "descriptive"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSON, default=list)
    correct_answer: Mapped[dict] = mapped_column(JSON, default=dict)  # {"value": ...} or {"values": [...]}
    initial_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_cases: Mapped[list] = mapped_column(JSON, default=list)

    difficulty: Mapped[str] = mapped_column(String(32), default="medium")
    marks: Mapped[int] = mapped_column(Integer, default=10)
    negative_marks: Mapped[int] = mapped_column(Integer, default=0)

    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    topic: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    programming_language: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_by: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    __table_args__ = (UniqueConstraint("exam_id", "question_id", name="uq_exam_question"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    exam_id: Mapped[str] = mapped_column(String(32), ForeignKey("exams.id"), index=True)
    question_id: Mapped[str] = mapped_column(String(32), ForeignKey("questions.id"))
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    exam: Mapped[Exam] = relationship(back_populates="questions")
    question: Mapped[Question] = relationship()


class SessionStatus(str, enum.Enum):
    waiting = "waiting"
    in_progress = "in_progress"
    submitted = "submitted"
    exited = "exited"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    exam_id: Mapped[str] = mapped_column(String(32), ForeignKey("exams.id"), index=True)
    student_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), index=True)

    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.waiting, index=True)
    queue_position: Mapped[int] = mapped_column(Integer, default=0)

    joined_queue_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    entered_exam_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    time_remaining_seconds: Mapped[int] = mapped_column(Integer, default=0)
    proctoring_violations: Mapped[int] = mapped_column(Integer, default=0)

    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_marks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False)

    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    device: Mapped[str | None] = mapped_column(String(255), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    answers: Mapped[list["Answer"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("session_id", "question_id", name="uq_session_question"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    session_id: Mapped[str] = mapped_column(String(32), ForeignKey("exam_sessions.id"), index=True)
    question_id: Mapped[str] = mapped_column(String(32), ForeignKey("questions.id"))
    answer_text: Mapped[str] = mapped_column(Text, default="")
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    marks_awarded: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session: Mapped[ExamSession] = relationship(back_populates="answers")


class ActivityEventType(str, enum.Enum):
    opened_link = "opened_link"
    login = "login"
    start_exam_click = "start_exam_click"
    queue_entry = "queue_entry"
    queue_exit = "queue_exit"
    exam_start = "exam_start"
    submission = "submission"
    logout = "logout"
    browser_refresh = "browser_refresh"
    disconnect = "disconnect"
    reconnect = "reconnect"
    practice_recommendation_click = "practice_recommendation_click"


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    student_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id"), nullable=True, index=True)
    exam_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("exams.id"), nullable=True, index=True)
    session_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    event_type: Mapped[ActivityEventType] = mapped_column(Enum(ActivityEventType), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    device: Mapped[str | None] = mapped_column(String(255), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class LogType(str, enum.Enum):
    info = "info"
    warning = "warning"
    success = "success"
    danger = "danger"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=gen_uuid)
    actor: Mapped[str] = mapped_column(String(255), default="system")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[LogType] = mapped_column(Enum(LogType), default=LogType.info)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
