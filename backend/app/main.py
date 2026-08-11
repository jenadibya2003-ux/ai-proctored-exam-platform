"""
App entrypoint. Run locally with:
    uvicorn app.main:app --reload
Then open http://localhost:8000/docs for the auto-generated Swagger UI —
this is the fastest way to test endpoints while you build the frontend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app.routers import auth, questions, exams, students, monitoring, evaluation, sections, proctoring, notifications, mock

# Creates tables directly from models on startup.
# In local development and tests this is resilient even when the DB is not
# yet available. Alembic migrations are still available for structured schema changes.
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError:
    pass

app = FastAPI(title="AI-Proctored Online Examination Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production Vercel frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(students.router)
app.include_router(monitoring.router)
app.include_router(evaluation.router)
app.include_router(sections.router)
app.include_router(proctoring.router)
app.include_router(notifications.router)
app.include_router(mock.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/debug-routes")
def debug_routes():
    return [r.path for r in app.routes]