"""Seed the single predefined administrator account from .env.

Run with: ./venv/bin/python -m scripts.seed_admin
Admins never self-register; this script is the only way an admin account is created.
"""

from app.auth import hash_password
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import User, UserRole


def main():
    settings = get_settings()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.admin_email).first()
        if existing:
            existing.password_hash = hash_password(settings.admin_password)
            existing.role = UserRole.admin
            existing.name = settings.admin_name
            db.commit()
            print(f"Updated existing admin: {settings.admin_email}")
            return

        admin = User(
            role=UserRole.admin,
            name=settings.admin_name,
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
        )
        db.add(admin)
        db.commit()
        print(f"Seeded admin: {settings.admin_email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
