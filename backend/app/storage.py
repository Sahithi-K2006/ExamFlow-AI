from functools import lru_cache

from fastapi import HTTPException, status

from app.config import get_settings


@lru_cache
def _client():
    """Lazily construct the Supabase client. Not called at import time, so the app keeps
    booting fine with empty credentials — only an actual upload attempt fails, with a clear
    503 rather than a crash."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def upload_file(path: str, content: bytes, content_type: str) -> str:
    """Upload bytes to the configured Supabase Storage bucket and return a public URL.
    Raises 503 if Supabase Storage isn't configured yet (expected until real credentials
    are supplied — see backend/.env SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."""
    client = _client()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is not configured yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable uploads.",
        )
    settings = get_settings()
    bucket = client.storage.from_(settings.supabase_storage_bucket)
    bucket.upload(path, content, {"content-type": content_type, "upsert": "true"})
    return bucket.get_public_url(path)
