"""Seed one published demo exam (DSA-101) with 3 questions, matching the original prototype's
mock data, so Phase 2/3 (queue + submit) can be exercised end-to-end before the admin
Question Bank / Exam Builder UI (Phase 4) exists.

Run with: ./venv/bin/python -m scripts.seed_exam
"""

from datetime import datetime

from app.config import get_settings
from app.database import SessionLocal
from app.models import Exam, ExamQuestion, ExamStatus, Question, QuestionType, User, UserRole


def main():
    settings = get_settings()
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.admin, User.email == settings.admin_email).first()
        if not admin:
            print("Run scripts.seed_admin first.")
            return

        existing = db.query(Exam).filter(Exam.slug == "dsa-101").first()
        if existing:
            print("Exam dsa-101 already exists.")
            return

        exam = Exam(
            slug="dsa-101",
            title="DSA-101: Data Structures and Algorithms Midterm",
            description="Standard midterm covering arrays, trees, binary search, and basic SQL query syntax.",
            instructions="Tab-switching is monitored. Do not refresh mid-exam. Answer all questions before the timer expires.",
            duration_minutes=15,
            passing_marks=25,
            negative_marking=False,
            max_active_students=2,
            queue_capacity=500,
            status=ExamStatus.published,
            created_by=admin.id,
            published_at=datetime.utcnow(),
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)

        q1 = Question(
            type=QuestionType.mcq,
            question_text="What is the worst-case time complexity of searching for an item in a balanced binary search tree or using binary search on a sorted array?",
            options=["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            correct_answer={"value": "O(log n)"},
            marks=10,
            negative_marks=0,
            subject="Algorithms",
            topic="Binary Search",
            difficulty="medium",
            created_by=admin.id,
        )
        q2 = Question(
            type=QuestionType.coding,
            question_text="Write a JavaScript/TypeScript function `isPalindrome(str)` that checks whether a given string is a palindrome. The function should ignore casing and non-alphanumeric characters. Return `true` if it is a palindrome, and `false` otherwise.",
            initial_code="function isPalindrome(str) {\n  // Write your code here\n\n  return false;\n}",
            marks=20,
            negative_marks=0,
            subject="Algorithms",
            topic="Strings",
            difficulty="medium",
            programming_language="javascript",
            created_by=admin.id,
        )
        q3 = Question(
            type=QuestionType.sql,
            question_text="Given a table `results` with columns `student_id` (INT), `exam_id` (INT), and `total_score` (INT), write a SQL query to retrieve the `student_id` and `total_score` of all students who scored 80 or above in `exam_id` = 101. Order by `total_score` descending.",
            initial_code="SELECT student_id, total_score \nFROM results \nWHERE ...",
            marks=15,
            negative_marks=0,
            subject="Databases",
            topic="SQL",
            difficulty="medium",
            created_by=admin.id,
        )
        db.add_all([q1, q2, q3])
        db.commit()
        db.refresh(q1)
        db.refresh(q2)
        db.refresh(q3)

        db.add_all(
            [
                ExamQuestion(exam_id=exam.id, question_id=q1.id, order_index=0),
                ExamQuestion(exam_id=exam.id, question_id=q2.id, order_index=1),
                ExamQuestion(exam_id=exam.id, question_id=q3.id, order_index=2),
            ]
        )
        db.commit()
        print(f"Seeded exam: /exam/{exam.slug}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
