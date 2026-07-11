from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin as admin_router
from app.routers import admin_questions as admin_questions_router
from app.routers import admin_students as admin_students_router
from app.routers import auth as auth_router
from app.routers import exams as exams_router
from app.routers import ws as ws_router

settings = get_settings()

app = FastAPI(title="ExamFlow AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(exams_router.router)
app.include_router(admin_router.router)
app.include_router(admin_questions_router.router)
app.include_router(admin_students_router.router)
app.include_router(ws_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
