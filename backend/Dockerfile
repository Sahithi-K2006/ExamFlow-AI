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
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Runs pending Alembic migrations and syncs the admin account from env vars
# before starting the server, so a deploy is self-contained — see entrypoint.sh.
CMD ["./entrypoint.sh"]
