import csv
import io as io_module

from typing import List
from openai import OpenAI
import json
from app.config import settings

from fastapi import UploadFile, File
import io
from pypdf import PdfReader
from docx import Document as DocxDocument

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question, Option, QuestionType, UserRole, User
from app.schemas import QuestionCreate, QuestionOut
from app.auth import require_role

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/", response_model=QuestionOut)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    # Validation matching the spec: MCQ must have exactly one correct option
    if payload.question_type == QuestionType.mcq:
        if not payload.options:
            raise HTTPException(400, "MCQ questions require options")
        correct_count = sum(1 for o in payload.options if o.is_correct)
        if correct_count != 1:
            raise HTTPException(400, "MCQ must have exactly one correct option")

    if payload.question_type == QuestionType.multi_select:
        if not payload.options or not any(o.is_correct for o in payload.options):
            raise HTTPException(400, "multi_select requires at least one correct option")

    if payload.question_type == QuestionType.image_upload:
        if payload.max_marks is None or payload.max_marks <= 0:
            raise HTTPException(400, "image_upload questions must define a positive max_marks value")

    if payload.marks <= 0:
        raise HTTPException(400, "marks must be positive")

    question = Question(
        subject=payload.subject,
        question_type=payload.question_type,
        difficulty=payload.difficulty,
        text=payload.text,
        model_answer=payload.model_answer,
        expected_answer=payload.expected_answer,
        tags=payload.tags or [],
        marks=payload.marks,
        max_marks=payload.max_marks,
        negative_marks=payload.negative_marks,
        created_by=current_user.id,
    )
    db.add(question)
    db.flush()  # get question.id before adding options

    if payload.options:
        for opt in payload.options:
            db.add(Option(question_id=question.id, text=opt.text, is_correct=opt.is_correct))

    db.commit()
    db.refresh(question)
    return question


@router.get("/", response_model=List[QuestionOut])
def list_questions(
    subject: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject)
    return query.all()


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: str,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    question.subject = payload.subject
    question.question_type = payload.question_type
    question.difficulty = payload.difficulty
    question.text = payload.text
    question.model_answer = payload.model_answer
    question.expected_answer = payload.expected_answer
    question.tags = payload.tags or []
    question.marks = payload.marks
    question.max_marks = payload.max_marks
    question.negative_marks = payload.negative_marks

    db.query(Option).filter(Option.question_id == question_id).delete()
    if payload.options:
        for opt in payload.options:
            db.add(Option(question_id=question_id, text=opt.text, is_correct=opt.is_correct))

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}")
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    db.query(Option).filter(Option.question_id == question_id).delete()
    db.delete(question)
    db.commit()

    return {"message": "Question deleted successfully"}


@router.post("/extract-text")
async def extract_question_text(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    content = await file.read()
    filename = (file.filename or "").lower()
    extracted_text = ""

    try:
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)

        elif filename.endswith(".docx"):
            doc = DocxDocument(io.BytesIO(content))
            extracted_text = "\n".join(p.text for p in doc.paragraphs)

        elif filename.endswith(".txt"):
            extracted_text = content.decode("utf-8", errors="ignore")

        elif filename.endswith((".jpg", ".jpeg", ".png")):
            try:
                import pytesseract
                from PIL import Image
                image = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(image)
            except Exception:
                raise HTTPException(
                    400,
                    "Image text extraction is not available on this server yet. "
                    "Please type the question text manually.",
                )
        else:
            raise HTTPException(400, "Unsupported file type. Please upload a PDF, DOCX, TXT, or image file.")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Could not read this file. Please try a different format.")

    return {"extracted_text": extracted_text.strip()}

@router.post("/generate-ai")
def generate_ai_question(
    payload: dict,
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    subject = payload.get("subject", "General")
    topic = payload.get("topic", "")
    question_type = payload.get("question_type", "mcq")
    difficulty = payload.get("difficulty", "medium")

    if not settings.openai_api_key:
        raise HTTPException(
            400,
            "AI question generation is not configured on this server yet. "
            "An OpenAI API key needs to be added to continue.",
        )

    client = OpenAI(api_key=settings.openai_api_key)

    if question_type in ("mcq", "multi_select"):
        prompt = f"""Generate one {difficulty} difficulty {question_type} question about "{topic}" for the subject "{subject}".
Respond ONLY with valid JSON, no other text, in this exact shape:
{{
  "text": "the question text",
  "options": [
    {{"text": "option 1", "is_correct": true}},
    {{"text": "option 2", "is_correct": false}},
    {{"text": "option 3", "is_correct": false}}
  ]
}}"""
    else:
        prompt = f"""Generate one {difficulty} difficulty {question_type} (written answer) question about "{topic}" for the subject "{subject}".
Respond ONLY with valid JSON, no other text, in this exact shape:
{{
  "text": "the question text",
  "model_answer": "a concise model answer an examiner could use as reference"
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
    except Exception:
        raise HTTPException(500, "Could not generate a question right now. Please try again.")

    return result


@router.post("/bulk-import")
async def bulk_import_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io_module.StringIO(text))

    created_count = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            subject = row.get("subject", "").strip()
            question_type = row.get("question_type", "").strip()
            difficulty = row.get("difficulty", "medium").strip() or "medium"
            text_val = row.get("text", "").strip()
            marks = int(row.get("marks", "1") or "1")
            expected_answer = row.get("expected_answer", "").strip()
            model_answer = row.get("model_answer", "").strip()

            if not subject or not question_type or not text_val:
                errors.append(f"Row {row_num}: missing subject, question_type, or text")
                continue

            question = Question(
                subject=subject,
                question_type=question_type,
                difficulty=difficulty,
                text=text_val,
                model_answer=model_answer or None,
                expected_answer=expected_answer or None,
                tags=[],
                marks=marks,
                negative_marks=0,
                created_by=current_user.id,
            )
            db.add(question)
            db.flush()

            if question_type in ("mcq", "multi_select"):
                options_raw = row.get("options", "")
                option_texts = [o.strip() for o in options_raw.split(",") if o.strip()]
                for opt_text in option_texts:
                    is_correct = opt_text == expected_answer
                    db.add(Option(question_id=question.id, text=opt_text, is_correct=is_correct))

            created_count += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    db.commit()

    return {
        "created_count": created_count,
        "errors": errors,
    }    