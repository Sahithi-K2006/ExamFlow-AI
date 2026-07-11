from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import ActivityLog, Exam, ExamSession, SessionStatus, User, UserRole
from app.schemas import ActivityLogOut, StudentOut

router = APIRouter(prefix="/api/admin", tags=["admin-students"])


def _student_out(db: Session, student: User) -> StudentOut:
    submitted = (
        db.query(ExamSession)
        .filter(ExamSession.student_id == student.id, ExamSession.status == SessionStatus.submitted)
        .all()
    )
    exams_taken = len(submitted)
    avg_score = None
    if submitted:
        percentages = [
            (s.score / s.total_marks) * 100 for s in submitted if s.total_marks
        ]
        if percentages:
            avg_score = round(sum(percentages) / len(percentages), 1)
    out = StudentOut.model_validate(student)
    out.exams_taken = exams_taken
    out.avg_score = avg_score
    return out


@router.get("/students", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    students = db.query(User).filter(User.role == UserRole.student).order_by(User.created_at.desc()).all()
    return [_student_out(db, s) for s in students]


@router.get("/students/{student_id}/activity", response_model=list[ActivityLogOut])
def get_student_activity(student_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    student = db.get(User, student_id)
    if not student or student.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    rows = (
        db.query(ActivityLog, User.name, Exam.title)
        .outerjoin(User, ActivityLog.student_id == User.id)
        .outerjoin(Exam, ActivityLog.exam_id == Exam.id)
        .filter(ActivityLog.student_id == student_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(500)
        .all()
    )
    return [_activity_out(log, student_name, exam_title) for log, student_name, exam_title in rows]


@router.get("/activity-log", response_model=list[ActivityLogOut])
def list_activity_log(limit: int = 200, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    limit = min(max(limit, 1), 1000)
    rows = (
        db.query(ActivityLog, User.name, Exam.title)
        .outerjoin(User, ActivityLog.student_id == User.id)
        .outerjoin(Exam, ActivityLog.exam_id == Exam.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_activity_out(log, student_name, exam_title) for log, student_name, exam_title in rows]


def _activity_out(log: ActivityLog, student_name: str | None, exam_title: str | None) -> ActivityLogOut:
    out = ActivityLogOut.model_validate(log)
    out.student_name = student_name
    out.exam_title = exam_title
    return out
