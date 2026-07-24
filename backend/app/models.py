"""
Core database models. This is a starting skeleton, not the final schema —
you WILL need to add columns/tables as you build out each module
(e.g. proctor_events will grow once you decide the exact heartbeat payload
shape). Keep it under Alembic migrations from the very first change.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    student = "student"
    examiner = "examiner"
    admin = "admin"


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    multi_select = "multi_select"
    short_answer = "short_answer"
    long_answer = "long_answer"
    image_upload = "image_upload"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    created_at = Column(DateTime, default=datetime.utcnow)


class Question(Base):
    __tablename__ = "question_bank"

    id = Column(String, primary_key=True, default=gen_uuid)
    subject = Column(String, index=True, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    difficulty = Column(String, default="medium")  # easy / medium / hard
    text = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=True)   # for subjective grading
    expected_answer = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    marks = Column(Integer, nullable=False, default=1)
    max_marks = Column(Integer, nullable=True)
    negative_marks = Column(Integer, nullable=False, default=0)
    created_by = Column(String, ForeignKey("users.id"))

    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")


class Option(Base):
    __tablename__ = "options"

    id = Column(String, primary_key=True, default=gen_uuid)
    question_id = Column(String, ForeignKey("question_bank.id"), nullable=False)
    text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    total_marks = Column(Integer, nullable=False, default=100)
    passing_marks = Column(Integer, nullable=False, default=40)
    status = Column(String, nullable=False, default="Draft")
    duration_minutes = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    randomize_questions = Column(Boolean, default=True)
    randomization_mode = Column(String, default="per_student")
    question_selection_rules = Column(JSON, nullable=True)
    negative_marking_enabled = Column(Boolean, default=False)
    proctoring_enabled = Column(Boolean, default=True)
    webcam_monitoring_enabled = Column(Boolean, default=True)
    gaze_tracking_enabled = Column(Boolean, default=False)
    gaze_tracking_sensitivity_threshold = Column(Integer, default=3)
    max_tab_switch_warnings = Column(Integer, default=3)
    created_by = Column(String, ForeignKey("users.id"))


class ExamQuestion(Base):
    """Links an exam to the specific questions selected for it."""
    __tablename__ = "exam_questions"

    id = Column(String, primary_key=True, default=gen_uuid)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=False)
    question_id = Column(String, ForeignKey("question_bank.id"), nullable=False)


class ExamSession(Base):
    """One row per student attempt at an exam."""
    __tablename__ = "exam_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_token = Column(String, unique=True, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    auto_submitted = Column(Boolean, default=False)
    suspicion_score = Column(Integer, default=0)
    is_revoked = Column(Boolean, default=False)
    token_expires_at = Column(DateTime, nullable=True)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), nullable=False)
    question_id = Column(String, ForeignKey("question_bank.id"), nullable=False)
    selected_option_ids = Column(JSON, nullable=True)   # for mcq / multi_select
    text_answer = Column(Text, nullable=True)           # for short/long answer
    image_path = Column(String, nullable=True)          # for image_upload
    ai_score = Column(Integer, nullable=True)
    ai_justification = Column(Text, nullable=True)
    final_score = Column(Integer, nullable=True)
    graded_by = Column(String, ForeignKey("users.id"), nullable=True)


class Result(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=False)
    total_score = Column(Integer, nullable=True)
    percentage = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)   # face_absent, multiple_faces, gaze_away, tab_switch
    detail = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
