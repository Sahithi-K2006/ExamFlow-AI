from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import ActivityEventType, ActivityLog, User, UserRole
from app.schemas import LoginRequest, MessageResponse, StudentRegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

MIN_PASSWORD_LENGTH = 8


def _client_meta(request: Request) -> dict:
    return {
        "ip_address": request.client.host if request.client else None,
        "device": request.headers.get("sec-ch-ua-platform", "unknown"),
        "browser": request.headers.get("user-agent", "unknown")[:255],
    }


@router.post("/student/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def student_register(payload: StudentRegisterRequest, db: Session = Depends(get_db)):
    """Creates the account only — does not log the student in. The frontend sends them to
    the Login tab afterward so they authenticate with the credentials they just set,
    matching a standard register -> login -> dashboard flow."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists. Please log in instead.")
    existing_sid = db.query(User).filter(User.student_id == payload.student_id).first()
    if existing_sid:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This Student Enrollment ID is already registered.")
    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.")

    user = User(
        role=UserRole.student,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        student_id=payload.student_id,
        college=payload.college,
    )
    db.add(user)
    db.add(ActivityLog(event_type=ActivityEventType.opened_link, event_metadata={"via": "register", "email": payload.email}))
    db.commit()

    return {"message": "Registration successful. Please log in with your new credentials."}


@router.post("/student/login", response_model=TokenResponse)
def student_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.role == UserRole.student).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user)
    user.active_session_token = token
    db.add(ActivityLog(student_id=user.id, event_type=ActivityEventType.login, **_client_meta(request)))
    db.commit()

    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.role == UserRole.admin).first()
    if not user or not verify_password(payload.password, user.password_hash):
        # Deliberately generic: do not reveal whether the email exists.
        # If a student account was used here, this also reports Unauthorized Access.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized Access")

    token = create_access_token(user)
    user.active_session_token = token
    db.add(ActivityLog(student_id=user.id, event_type=ActivityEventType.login, **_client_meta(request)))
    db.commit()

    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout", response_model=dict)
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.active_session_token = None
    # student_id is really just "acting user" here — the FK covers both roles; it isn't
    # nulled out for admins, or an admin logout would be recorded with no actor at all.
    db.add(ActivityLog(student_id=user.id, event_type=ActivityEventType.logout, **_client_meta(request)))
    db.commit()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
