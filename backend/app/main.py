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
import app.models
from app.models import User, UserRole
from app.database import SessionLocal
from app.auth import hash_password
import os

# Ensure DB tables exist on startup without wiping user data

try:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    demo_users = [
        {"email": "student@example.com", "password": "password123", "full_name": "Demo Student", "role": UserRole.student},
        {"email": "examiner@example.com", "password": "password123", "full_name": "Demo Examiner", "role": UserRole.examiner},
        {"email": "admin@example.com", "password": "password123", "full_name": "Demo Admin", "role": UserRole.admin},
        {"email": "student1@example.com", "password": "password123", "full_name": "Student Candidate 1", "role": UserRole.student},
        {"email": "student2@test.com", "password": "password123", "full_name": "Student Candidate 2", "role": UserRole.student},
        {"email": "examiner2@test.com", "password": "password123", "full_name": "Examiner Lead 2", "role": UserRole.examiner},
        {"email": "admin1@test.com", "password": "password123", "full_name": "System Administrator 1", "role": UserRole.admin},
    ]
    for item in demo_users:
        user = db.query(User).filter(User.email == item["email"]).first()
        if not user:
            user = User(
                email=item["email"],
                hashed_password=hash_password(item["password"]),
                full_name=item["full_name"],
                role=item["role"],
                account_status="approved"
            )
            db.add(user)
        else:
            user.hashed_password = hash_password(item["password"])
            user.account_status = "approved"
    db.commit()
    db.close()
    print("Demo users successfully created and approved on startup.")
except Exception as e:
    print(f"Startup DB init warning: {e}")

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


from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/debug-routes")
def debug_routes():
    return [r.path for r in app.routes]