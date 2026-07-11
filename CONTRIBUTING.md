# Contributing to ExamFlow AI

Thanks for your interest in contributing! This document covers how to get a
local dev environment running and the conventions this project follows.

## Getting set up

See the [README](README.md#installation-guide) for full backend/frontend/Redis
setup instructions. In short:

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in local values
alembic upgrade head
python -m scripts.seed_admin
uvicorn app.main:app --reload

# Frontend (separate terminal)
cp .env.example .env
npm install
npm run dev
```

## Project conventions

- **Backend (FastAPI)**: routers live in `backend/app/routers/`, one file per
  resource area. Every endpoint declares an explicit `response_model` and uses
  `Depends(get_current_admin)` / `Depends(get_current_student)` for auth —
  never leave a route unprotected. Business logic belongs in
  `backend/app/exam_service.py` or a dedicated module (e.g. `heuristics.py`,
  `storage.py`), not inline in route handlers.
- **Frontend (React + TypeScript)**: API calls go through the typed wrappers in
  `src/api/*.ts` (built on the shared `apiFetch` in `src/api/client.ts`) —
  don't call `fetch` directly from components. Match the existing style: no
  UI framework beyond the hand-rolled components in `src/components/ui/`.
- **Database schema changes**: add an Alembic migration (`alembic revision -m
  "..."`) alongside any `models.py` change, and run it locally before opening
  a PR.
- **No placeholder/mock data in shipped code.** If a feature isn't wired to a
  real backend yet, say so in the code/PR description rather than faking it
  with local state.

## Before opening a PR

1. `cd backend && python -m py_compile app/*.py app/routers/*.py` — backend
   still imports cleanly.
2. `npm run lint && npm run build` — frontend lints and builds with zero
   warnings.
3. Describe what you tested manually (this project does not yet have an
   automated test suite — see the README roadmap).

## Reporting bugs / requesting features

Open a GitHub issue with steps to reproduce (for bugs) or the problem you're
trying to solve (for features). Security issues should follow
[SECURITY.md](SECURITY.md) instead of a public issue.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
