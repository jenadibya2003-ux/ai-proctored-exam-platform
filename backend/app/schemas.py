"""
Pydantic schemas: these define what shape of JSON the API accepts and
returns. Keep them separate from SQLAlchemy models (app/models.py) —
mixing the two is a common beginner mistake that causes confusing bugs.
"""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, EmailStr

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


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


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
    library_id: Optional[str] = None
    options: Optional[List[OptionCreate]] = None  # required for mcq / multi_select


class OptionOut(BaseModel):
    id: str
    text: str
    is_correct: bool = False

    class Config:
        from_attributes = True


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
    library_id: Optional[str] = None
    options: Optional[List[OptionOut]] = None

    class Config:
        from_attributes = True


class LibraryCreate(BaseModel):
    title: str
    purpose: Optional[str] = None


class LibraryOut(BaseModel):
    id: str
    title: str
    purpose: Optional[str] = None
    question_count: int = 0

    class Config:
        from_attributes = True


class AssignLibraryRequest(BaseModel):
    question_ids: List[str]
    library_id: str

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
    join_code: Optional[str] = None


class JoinExamRequest(BaseModel):
    code: str


class ExamOut(BaseModel):
    id: str
    title: str
    subject: str
    status: str
    total_marks: int
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


class StudentOut(BaseModel):
    id: str
    full_name: str
    email: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    phone: Optional[str] = None
    account_status: str
    assigned_count: int = 0
    active_count: int = 0
    submitted_count: int = 0
    not_started_count: int = 0
    violations_count: int = 0


class StudentsOverview(BaseModel):
    students_count: int
    assignments_count: int
    active_sessions_count: int
    submitted_count: int
    violations_count: int


class AssignExamRequest(BaseModel):
    exam_id: str


class ExamAssignmentStatus(BaseModel):
    assigned_student_ids: List[str]
    assigned_count: int
    started_count: int
    submitted_count: int


class BulkAssignRequest(BaseModel):
    student_ids: List[str]


class MonitoringOverview(BaseModel):
    all_sessions_count: int
    active_count: int
    online_count: int
    submitted_count: int
    terminated_count: int
    violations_count: int


class SessionListItem(BaseModel):
    id: str
    student_name: str
    student_roll: Optional[str] = None
    exam_title: str
    exam_subject: str
    status: str  # Active / Submitted / Terminated
    time_left_seconds: int
    questions_answered: int
    total_questions: int
    violations_count: int


class ViolationOut(BaseModel):
    event_type: str
    detail: Optional[dict] = None
    timestamp: datetime


class SessionDetail(BaseModel):
    id: str
    status: str
    student_name: str
    student_email: str
    student_roll: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    exam_title: str
    exam_subject: str
    time_left_seconds: int
    current_question: int
    questions_answered: int
    total_questions: int
    violations_count: int
    proctoring_enabled: bool
    webcam_monitoring_enabled: bool
    gaze_tracking_enabled: bool
    max_tab_switch_warnings: int
    termination_reason: Optional[str] = None
    violations: List[ViolationOut]


class EvaluationOverview(BaseModel):
    submissions_count: int
    manual_review_count: int
    evaluated_count: int
    published_count: int


class SubmissionItem(BaseModel):
    session_id: str
    student_name: str
    student_email: Optional[str] = None
    student_roll: Optional[str] = None
    exam_id: str
    exam_title: str
    exam_subject: str
    ai_score: int
    final_score: int
    total_marks: int
    pending_count: int
    total_questions: int
    status: str  # Pending / Manual Review / Evaluated / Published
    violations_count: int


class LibrarySubjectOut(BaseModel):
    subject: str
    question_count: int


class ExamSectionCreate(BaseModel):
    title: str
    library_id: str
    subject: str
    section_order: int = 1
    question_limit: int = 0
    total_marks: int = 0
    negative_marks: int = 0
    randomize_questions: bool = True


class ExamSectionOut(BaseModel):
    id: str
    exam_id: str
    title: str
    library_id: Optional[str] = None
    subject: Optional[str] = None
    section_order: int
    question_limit: int
    total_marks: int
    negative_marks: int
    randomize_questions: bool
    actual_question_count: int = 0


# ---------------------------------------------------------------------------
# Mock Exam Schemas
# ---------------------------------------------------------------------------

class MockExamConfigOut(BaseModel):
    id: str
    title: str
    guidelines: Optional[str] = None
    duration_minutes: int = 15
    camera_required: bool = True
    microphone_required: bool = True
    fullscreen_required: bool = True
    face_detection_required: bool = True
    max_tab_switch_warnings: int = 3

    model_config = ConfigDict(from_attributes=True)


class MockExamConfigUpdate(BaseModel):
    title: str = "Mock Exam"
    guidelines: str = ""
    duration_minutes: int = 15
    camera_required: bool = True
    microphone_required: bool = True
    fullscreen_required: bool = True
    face_detection_required: bool = True
    max_tab_switch_warnings: int = 3


class MockOptionItem(BaseModel):
    text: str
    is_correct: bool = False


class MockQuestionOut(BaseModel):
    id: str
    question_type: str
    difficulty: str = "easy"
    text: str
    marks: int = 1
    options: Optional[list] = None
    model_answer: Optional[str] = None
    display_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class MockQuestionStudentOut(BaseModel):
    """Same as MockQuestionOut but hides correct answers and model_answer."""
    id: str
    question_type: str
    difficulty: str = "easy"
    text: str
    marks: int = 1
    options: Optional[list] = None
    display_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class MockQuestionUpdate(BaseModel):
    difficulty: str = "easy"
    text: str
    marks: int = 1
    options: Optional[list[MockOptionItem]] = None
    model_answer: Optional[str] = None


class MockExamFullOut(BaseModel):
    config: MockExamConfigOut
    questions: list[MockQuestionOut]


class MockExamStudentOut(BaseModel):
    config: MockExamConfigOut
    questions: list[MockQuestionStudentOut]


class MockAttemptAnswerItem(BaseModel):
    question_type: str
    selected_options: Optional[list[str]] = None
    text_answer: Optional[str] = None
    image_uploaded: bool = False


class MockAttemptRequest(BaseModel):
    answers: list[MockAttemptAnswerItem]


class MockAttemptFeedbackItem(BaseModel):
    question_type: str
    auto_graded: bool = False
    correct: Optional[bool] = None
    marks_awarded: int = 0
    max_marks: int = 0
    note: str = ""


class MockAttemptResult(BaseModel):
    items: list[MockAttemptFeedbackItem]
    total_awarded: int = 0
    total_max: int = 0