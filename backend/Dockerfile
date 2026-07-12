FROM python:3.13-slim

WORKDIR /app

# System deps for psycopg2/mysqlclient-style builds (kept minimal; both DB drivers
# used here are binary wheels, but libpq/mysql client headers cover edge cases).
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Shell form so $PORT (injected by the host platform, e.g. Railway) is expanded;
# falls back to 8000 for local `docker run` without that var set.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
