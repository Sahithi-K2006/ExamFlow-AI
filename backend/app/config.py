from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Accepts either a mysql+pymysql:// URL (current local dev DB) or a
    # postgresql+psycopg2:// URL (Supabase, once a project is provisioned) —
    # both drivers are installed, so switching is a one-line env var change.
    database_url: str = "mysql+pymysql://examflow:examflow_dev_pw@127.0.0.1:3306/examflow_ai"
    redis_url: str = "redis://127.0.0.1:6379/0"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    admin_email: str = "admin@examflow.ai"
    admin_password: str = "ChangeMe123!"
    admin_name: str = "Root Administrator"

    # Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://app.examflow.ai"
    frontend_origin: str = "http://localhost:5173"

    # Supabase Storage — used for question images/attachments (and, later, report/PDF exports).
    # Left empty until a real Supabase project is connected; app must keep booting when unset,
    # see app/storage.py for the graceful-503 behavior.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "exam-attachments"

    # Waiting Lounge AI Assistant (Google Gemini) — left empty until a real key is provided;
    # app must keep booting when unset, see app/services/ai_service.py for the graceful-503
    # behavior.
    google_api_key: str = ""
    ai_model: str = "gemini-2.5-flash"
    temperature: float = 0.3
    max_tokens: int = 700

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
