from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, MockExamConfig, MockQuestion, QuestionType
from app.schemas import (
    MockExamFullOut,
    MockExamStudentOut,
    MockExamConfigOut,
    MockExamConfigUpdate,
    MockQuestionOut,
    MockQuestionStudentOut,
    MockQuestionUpdate,
    MockAttemptRequest,
    MockAttemptResult,
    MockAttemptFeedbackItem,
)
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/mock", tags=["mock-exam"])

DEFAULT_QUESTIONS = [
    {
        "question_type": QuestionType.mcq,
        "difficulty": "easy",
        "text": "Which of the following best describes the purpose of this mock exam?",
        "marks": 1,
        "options": [
            {"text": "To help you get familiar with the exam interface and rules", "is_correct": True},
            {"text": "To count toward your final grade", "is_correct": False},
            {"text": "To test advanced subject knowledge", "is_correct": False},
            {"text": "To replace the real exam entirely", "is_correct": False},
        ],
        "model_answer": None,
        "display_order": 1,
    },
    {
        "question_type": QuestionType.multi_select,
        "difficulty": "easy",
        "text": "Which of the following are typically required to attend a proctored exam? (Select all that apply)",
        "marks": 2,
        "options": [
            {"text": "A working camera", "is_correct": True},
            {"text": "A stable internet connection", "is_correct": True},
            {"text": "A second monitor", "is_correct": False},
            {"text": "A quiet, well-lit room", "is_correct": True},
        ],
        "model_answer": None,
        "display_order": 2,
    },
    {
        "question_type": QuestionType.short_answer,
        "difficulty": "medium",
        "text": "In one or two sentences, describe what you should do if you lose your internet connection during the real exam.",
        "marks": 2,
        "options": None,
        "model_answer": "Try to reconnect as quickly as possible, and contact the examiner or support team if the issue persists.",
        "display_order": 3,
    },
    {
        "question_type": QuestionType.long_answer,
        "difficulty": "medium",
        "text": "Describe, in your own words, the steps you would take to prepare for a proctored online exam.",
        "marks": 3,
        "options": None,
        "model_answer": "A strong answer mentions testing camera/microphone/internet beforehand, finding a quiet well-lit room, keeping ID ready, reading the guidelines, and closing unnecessary applications/tabs.",
        "display_order": 4,
    },
    {
        "question_type": QuestionType.image_upload,
        "difficulty": "easy",
        "text": "This is a practice image upload question. Please upload any test image to confirm your upload process works correctly.",
        "marks": 1,
        "options": None,
        "model_answer": "Practice question only, used to confirm the upload mechanism works. No correct content is graded.",
        "display_order": 5,
    },
]

DEFAULT_GUIDELINES = (
    "Welcome to the Mock Exam. This practice run uses the exact same interface, "
    "timer, and proctoring checks as a real exam, so you can get comfortable "
    "before the real thing.\n\n"
    "Before you begin, you will be asked to grant camera, microphone, and "
    "fullscreen permissions, exactly like a real exam. Nothing you submit here "
    "counts toward your grade.\n\n"
    "Guidelines:\n"
    "- Ensure you are in a quiet, well-lit room with a stable internet connection.\n"
    "- Keep your face visible to the camera at all times.\n"
    "- Do not switch tabs or exit fullscreen mode once the exam starts.\n"
    "- Answer each question type at least once so you know what to expect: "
    "MCQ, multi-select, short answer, long answer, and image upload.\n"
    "- When you're done, submit to see instant feedback on the auto-graded questions."
)


def _ensure_seeded(db: Session):
    config = db.query(MockExamConfig).first()
    if not config:
        config = MockExamConfig(title="Mock Exam", guidelines=DEFAULT_GUIDELINES)
        db.add(config)
        db.commit()
        db.refresh(config)

    existing_types = {q.question_type for q in db.query(MockQuestion).all()}
    for default in DEFAULT_QUESTIONS:
        if default["question_type"] not in existing_types:
            db.add(MockQuestion(**default))
    db.commit()
    return config


@router.get("/", response_model=MockExamFullOut)
def get_mock_exam_examiner(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    config = _ensure_seeded(db)
    questions = db.query(MockQuestion).order_by(MockQuestion.display_order.asc()).all()
    return MockExamFullOut(
        config=MockExamConfigOut.model_validate(config),
        questions=[MockQuestionOut.model_validate(q) for q in questions],
    )


@router.get("/student", response_model=MockExamStudentOut)
def get_mock_exam_student(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = _ensure_seeded(db)
    questions = db.query(MockQuestion).order_by(MockQuestion.display_order.asc()).all()
    return MockExamStudentOut(
        config=MockExamConfigOut.model_validate(config),
        questions=[MockQuestionStudentOut.model_validate(q) for q in questions],
    )


@router.put("/settings", response_model=MockExamConfigOut)
def update_mock_settings(
    payload: MockExamConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    config = _ensure_seeded(db)
    config.title = payload.title
    config.guidelines = payload.guidelines
    config.duration_minutes = payload.duration_minutes
    config.camera_required = payload.camera_required
    config.microphone_required = payload.microphone_required
    config.fullscreen_required = payload.fullscreen_required
    config.face_detection_required = payload.face_detection_required
    config.max_tab_switch_warnings = payload.max_tab_switch_warnings
    db.commit()
    db.refresh(config)
    return MockExamConfigOut.model_validate(config)


@router.put("/questions/{question_type}", response_model=MockQuestionOut)
def update_mock_question(
    question_type: str,
    payload: MockQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    _ensure_seeded(db)
    question = db.query(MockQuestion).filter(MockQuestion.question_type == question_type).first()
    if not question:
        raise HTTPException(404, "Mock question of this type not found")

    question.difficulty = payload.difficulty
    question.text = payload.text
    question.marks = payload.marks
    question.options = [o.model_dump() for o in payload.options] if payload.options else None
    question.model_answer = payload.model_answer
    db.commit()
    db.refresh(question)
    return MockQuestionOut.model_validate(question)


@router.post("/attempt", response_model=MockAttemptResult)
def submit_mock_attempt(
    payload: MockAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stateless practice grading — nothing here is persisted anywhere, so
    mock attempts never affect real Results, Students, or Live Monitoring
    stats. It just gives the student instant feedback."""
    _ensure_seeded(db)
    questions = {q.question_type: q for q in db.query(MockQuestion).all()}

    items = []
    total_awarded = 0
    total_max = 0

    for answer in payload.answers:
        question = questions.get(answer.question_type)
        if not question:
            continue
        total_max += question.marks

        if question.question_type in (QuestionType.mcq, QuestionType.multi_select):
            correct_texts = {o["text"] for o in (question.options or []) if o.get("is_correct")}
            submitted = set(answer.selected_options or [])
            is_correct = submitted == correct_texts
            awarded = question.marks if is_correct else 0
            total_awarded += awarded
            items.append(MockAttemptFeedbackItem(
                question_type=question.question_type.value,
                auto_graded=True,
                correct=is_correct,
                marks_awarded=awarded,
                max_marks=question.marks,
                note="Correct!" if is_correct else "Not quite — review the question and try again.",
            ))
        elif question.question_type == QuestionType.image_upload:
            uploaded = bool(answer.image_uploaded)
            items.append(MockAttemptFeedbackItem(
                question_type=question.question_type.value,
                auto_graded=False,
                correct=None,
                marks_awarded=0,
                max_marks=question.marks,
                note="Upload received — in a real exam this would be reviewed by your examiner."
                if uploaded else "No file uploaded for this practice question.",
            ))
        else:  # short_answer / long_answer
            answered = bool((answer.text_answer or "").strip())
            items.append(MockAttemptFeedbackItem(
                question_type=question.question_type.value,
                auto_graded=False,
                correct=None,
                marks_awarded=0,
                note="Answer recorded — in a real exam this would be manually graded by your examiner."
                if answered else "No answer entered for this practice question.",
                max_marks=question.marks,
            ))

    return MockAttemptResult(items=items, total_awarded=total_awarded, total_max=total_max)