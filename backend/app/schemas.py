"""
Pydantic schemas: these define what shape of JSON the API accepts and
returns. Keep them separate from SQLAlchemy models (app/models.py) —
mixing the two is a common beginner mistake that causes confusing bugs.
"""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr

from app.models import UserRole, QuestionType


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.student


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Questions ----------

class OptionCreate(BaseModel):
    text: str
    is_correct: bool = False


class QuestionCreate(BaseModel):
    subject: str
    question_type: QuestionType
    difficulty: str = "medium"
    text: str
    model_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    tags: Optional[List[str]] = None
    marks: int = 1
    max_marks: Optional[int] = None
    negative_marks: int = 0
    options: Optional[List[OptionCreate]] = None  # required for mcq / multi_select


class QuestionOut(BaseModel):
    id: str
    subject: str
    question_type: QuestionType
    difficulty: str
    text: str
    model_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    tags: Optional[List[str]] = None
    marks: int
    max_marks: Optional[int] = None
    negative_marks: int

    class Config:
        from_attributes = True
class OptionForStudent(BaseModel):
    id: str
    text: str

    class Config:
        from_attributes = True


class QuestionForStudent(BaseModel):
    id: str
    question_type: QuestionType
    text: str
    marks: int
    options: List[OptionForStudent] = []

    class Config:
        from_attributes = True



# ---------- Exams ----------

class ExamCreate(BaseModel):
    title: str
    subject: str
    total_marks: int = 100
    passing_marks: int = 40
    status: str = "Draft"
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    randomize_questions: bool = True
    randomization_mode: str = "per_student"
    question_selection_rules: Optional[dict] = None
    negative_marking_enabled: bool = False
    proctoring_enabled: bool = True
    webcam_monitoring_enabled: bool = True
    gaze_tracking_enabled: bool = False
    gaze_tracking_sensitivity_threshold: int = 3
    max_tab_switch_warnings: int = 3
    question_ids: List[str]


class ExamOut(BaseModel):
    id: str
    title: str
    subject: str
    duration_minutes: int
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True


class ResultOut(BaseModel):
    id: str
    session_id: str
    student_id: str
    exam_id: str
    total_score: Optional[int] = None
    percentage: Optional[int] = None
    status: str

    class Config:
        from_attributes = True
