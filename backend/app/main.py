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
from app.routers import auth, questions, exams

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
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(exams.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
