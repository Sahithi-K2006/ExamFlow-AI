# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Immersive marketing landing page (Hero, Features, How It Works, AI Engine,
  Waiting Lounge, Queue Management, Admin/Student Portal sections, Security,
  Tech Stack, Testimonials, FAQ) with a Portal Selection screen gating entry
  into the Student and Admin portals.
- Full student authentication: registration, login, logout, Remember Me,
  session persistence across refresh, forgot/reset-password UI (backend
  endpoints not yet implemented).
- Separate, fully isolated admin authentication with role-based route guards.
- Question Bank: real backend CRUD (create/update/delete/duplicate/search/
  filter) with optional image upload to Supabase Storage.
- Exam Builder: real backend CRUD, question assignment, publish/unpublish/
  archive/duplicate.
- Student Management: real registered-student roster with computed stats,
  backed by the existing `ActivityLog` audit trail (login history, queue
  events, exam activity all recorded).
- Shareable exam links: real per-exam deep link (`/exam/:slug`), a genuinely
  scannable QR code, working native share/email/WhatsApp share actions.
- Smart FIFO queue engine (Redis-backed) with an atomic Lua-script admission
  path — closes a real over-admission race condition under concurrent load
  (verified with a 30-way concurrency test).
- Heuristic (rule-based, non-ML) wait-time estimation and practice-question
  recommendation engines, with recommendation-click logging for future model
  training.
- Production deployment scaffolding: Dockerfiles, docker-compose, deployment
  checklist, production env template.

### Fixed
- Queue engine over-admission race condition (`queue_engine.try_admit_next`
  and the `start_exam` admission path were non-atomic check-then-act; both
  now use a single atomic Redis `EVAL`).

### Known Gaps (tracked, not hidden)
- No automated test suite yet (unit/integration/E2E).
- Live Supabase Postgres/Storage cutover is configuration-ready but not yet
  connected — awaiting real project credentials.
- No trained ML models — only the heuristic engines described above. See the
  README's AI/ML roadmap.
- Several admin screens (Analytics, Reports, Simulation Mode, Settings,
  Profile, Help Center) are still UI-only pending backend wiring.
