from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class StudentRegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    # Length is enforced in the route handler (routers/auth.py) with a clear, user-facing
    # message rather than here, since Pydantic's own validation errors surface as a
    # non-obvious payload shape to the frontend.
    password: str = Field(min_length=1, max_length=128)
    student_id: str = Field(min_length=1, max_length=64)
    college: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    role: str
    name: str
    email: str
    student_id: str | None = None
    college: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageResponse(BaseModel):
    message: str


class QuestionOut(BaseModel):
    """Student-facing question view — deliberately omits `correct_answer` so the answer
    key is never sent over the wire during an active exam. See QuestionAdminOut for the
    admin/question-bank view, which does include it."""
    id: str
    type: str
    question_text: str
    options: list = []
    initial_code: str | None = None
    marks: int
    negative_marks: int
    programming_language: str | None = None

    model_config = {"from_attributes": True}


class QuestionAdminOut(BaseModel):
    id: str
    type: str
    question_text: str
    options: list = []
    correct_answer: dict = {}
    initial_code: str | None = None
    test_cases: list = []
    difficulty: str
    marks: int
    negative_marks: int
    subject: str | None = None
    topic: str | None = None
    tags: list = []
    explanation: str | None = None
    image_url: str | None = None
    attachments: list = []
    programming_language: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    type: str
    question_text: str = Field(min_length=1)
    options: list = []
    correct_answer: dict = {}
    initial_code: str | None = None
    test_cases: list = []
    difficulty: str = "medium"
    marks: int = Field(default=10, ge=0)
    negative_marks: int = Field(default=0, ge=0)
    subject: str | None = None
    topic: str | None = None
    tags: list = []
    explanation: str | None = None
    programming_language: str | None = None


class QuestionUpdate(BaseModel):
    type: str | None = None
    question_text: str | None = None
    options: list | None = None
    correct_answer: dict | None = None
    initial_code: str | None = None
    test_cases: list | None = None
    difficulty: str | None = None
    marks: int | None = Field(default=None, ge=0)
    negative_marks: int | None = Field(default=None, ge=0)
    subject: str | None = None
    topic: str | None = None
    tags: list | None = None
    explanation: str | None = None
    programming_language: str | None = None


class ExamOut(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    instructions: str
    duration_minutes: int
    passing_marks: int
    negative_marking: bool
    random_question_order: bool = False
    random_option_order: bool = False
    max_active_students: int
    queue_capacity: int
    programming_languages: list = []
    browser_restrictions: dict = {}
    status: str
    question_count: int = 0
    question_ids: list[str] = []
    start_date: datetime | None = None
    end_date: datetime | None = None
    created_at: datetime | None = None
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class ExamCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = None
    description: str = ""
    instructions: str = ""
    duration_minutes: int = Field(default=60, gt=0)
    passing_marks: int = Field(default=0, ge=0)
    negative_marking: bool = False
    random_question_order: bool = False
    random_option_order: bool = False
    max_active_students: int = Field(default=3, ge=1)
    queue_capacity: int = Field(default=500, ge=0)
    programming_languages: list = []
    browser_restrictions: dict = {}
    start_date: datetime | None = None
    end_date: datetime | None = None


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    instructions: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    passing_marks: int | None = Field(default=None, ge=0)
    negative_marking: bool | None = None
    random_question_order: bool | None = None
    random_option_order: bool | None = None
    max_active_students: int | None = Field(default=None, ge=1)
    queue_capacity: int | None = Field(default=None, ge=0)
    programming_languages: list | None = None
    browser_restrictions: dict | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class AssignQuestionsRequest(BaseModel):
    question_ids: list[str]


class StudentOut(BaseModel):
    id: str
    name: str
    email: str
    student_id: str | None = None
    college: str | None = None
    created_at: datetime
    exams_taken: int = 0
    avg_score: float | None = None

    model_config = {"from_attributes": True}


class PracticeQuestionOut(BaseModel):
    """Heuristic recommendation result — deliberately the same shape as the student-facing
    QuestionOut (no correct_answer): a recommended practice question is never an actual exam
    question, but it still shouldn't leak its own answer key."""
    id: str
    type: str
    question_text: str
    subject: str | None = None
    topic: str | None = None
    difficulty: str
    marks: int
    programming_language: str | None = None

    model_config = {"from_attributes": True}


class ActivityLogOut(BaseModel):
    id: str
    student_id: str | None = None
    student_name: str | None = None
    exam_id: str | None = None
    exam_title: str | None = None
    session_id: str | None = None
    event_type: str
    ip_address: str | None = None
    device: str | None = None
    browser: str | None = None
    event_metadata: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: str
    exam_id: str
    status: str
    queue_position: int
    estimated_wait_seconds: int | None = None
    time_remaining_seconds: int
    proctoring_violations: int
    score: int | None = None
    total_marks: int | None = None
    passed: bool | None = None
    needs_review: bool = False

    model_config = {"from_attributes": True}


class AnswerPayload(BaseModel):
    question_id: str
    answer_text: str


class SaveAnswersRequest(BaseModel):
    answers: list[AnswerPayload]


class SubmitRequest(BaseModel):
    answers: list[AnswerPayload] = []
    proctoring_violations: int | None = None


class SubmitResponse(BaseModel):
    session: SessionOut
    redirect_to: str


class CapacityUpdateRequest(BaseModel):
    max_active_students: int = Field(ge=0)


class AdminQueueStudent(BaseModel):
    session_id: str
    student_name: str
    student_email: str
    student_code: str | None
    status: str
    queue_position: int
    joined_queue_at: datetime | None = None
    entered_exam_at: datetime | None = None


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class AIChatResponse(BaseModel):
    reply: str


class FlashcardTopicRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)


class FlashcardOut(BaseModel):
    front: str
    back: str


class FlashcardsResponse(BaseModel):
    topic: str
    flashcards: list[FlashcardOut]
