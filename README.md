# AI-Proctored Online Examination Platform — Starter Skeleton

This is a **starting skeleton**, not a finished project. It gives you a
working login + question-bank flow so you have something real to build on
from Week 1, matching the official spec (FastAPI + PostgreSQL backend,
Next.js frontend).

## What's included

- `backend/` — FastAPI app with:
  - User model with roles (student / examiner / admin)
  - JWT login + register endpoints
  - Question bank model (MCQ, multi-select, short/long answer, image upload)
  - Exam, ExamSession, Answer, and ProctorEvent models (schema for later weeks)
  - Basic validation (e.g. MCQ must have exactly one correct option)
- `frontend/` — Next.js app with:
  - Login page wired to the backend
  - Exam page skeleton showing: countdown timer, copy/paste prevention,
    tab-switch detection, and a webcam preview (proctoring hook points)
- `docker-compose.yml` — runs Postgres + backend + frontend together

## Running it locally without Docker (recommended while learning)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit DATABASE_URL etc.
uvicorn app.main:app --reload
```
Visit `http://localhost:8000/docs` to see and test every endpoint.

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Visit `http://localhost:3000`.

You'll need a running PostgreSQL instance — either install it locally,
or run just the `db` service: `docker compose up db`.

## Running everything with Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
docker compose up --build
```

## What to build next (in order)

1. Add Alembic migrations (`alembic init alembic`) instead of relying on
   `Base.metadata.create_all` in `main.py`.
2. Add the `exams` router (create exam, select questions, set rules) —
   mirror the pattern in `routers/questions.py`.
3. Add exam session start/submit endpoints with server-side time tracking.
4. Add MCQ auto-grading logic on submission.
5. Add the WebSocket endpoint for proctoring heartbeats, and wire the
   frontend's `logProctorEvent` function to send to it.
6. Add face-api.js model loading in `app/exam/page.tsx` (see face-api.js
   docs for `loadSsdMobilenetv1Model` / `loadFaceLandmarkModel`).
7. Add the LLM subjective-grading module as a separate service function
   called after MCQ auto-grading completes.

## Notes

- Passwords are hashed with bcrypt — never store plain text.
- The exam timer must always be verified server-side; the frontend timer
  is just a UI display.
- Proctoring runs face detection **in the browser** — raw webcam frames
  are never sent to the server, only derived events (per the spec).
