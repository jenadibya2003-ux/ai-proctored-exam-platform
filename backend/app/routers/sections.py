import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    UserRole,
    Exam,
    ExamSection,
    ExamQuestion,
    Question,
)
from app.schemas import ExamSectionCreate, ExamSectionOut
from app.auth import require_role

router = APIRouter(prefix="/sections", tags=["sections"])


def _section_out(db: Session, section: ExamSection) -> ExamSectionOut:
    actual_count = (
        db.query(ExamQuestion).filter(ExamQuestion.section_id == section.id).count()
    )
    return ExamSectionOut(
        id=section.id,
        exam_id=section.exam_id,
        title=section.title,
        library_id=section.library_id,
        subject=section.subject,
        section_order=section.section_order,
        question_limit=section.question_limit,
        total_marks=section.total_marks,
        negative_marks=section.negative_marks,
        randomize_questions=section.randomize_questions,
        actual_question_count=actual_count,
    )


@router.get("/{exam_id}", response_model=list[ExamSectionOut])
def list_sections(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    sections = (
        db.query(ExamSection)
        .filter(ExamSection.exam_id == exam_id)
        .order_by(ExamSection.section_order.asc())
        .all()
    )
    return [_section_out(db, s) for s in sections]


@router.post("/{exam_id}", response_model=ExamSectionOut)
def create_section(
    exam_id: str,
    payload: ExamSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    # Don't reuse a question already attached to this exam in another section.
    already_used_ids = {
        row.question_id
        for row in db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    }

    pool = (
        db.query(Question)
        .filter(Question.library_id == payload.library_id, Question.subject == payload.subject)
        .all()
    )
    available_pool = [q for q in pool if q.id not in already_used_ids]

    if len(available_pool) < payload.question_limit:
        raise HTTPException(
            400,
            f"Only {len(available_pool)} unused question(s) available in that library/subject, "
            f"but {payload.question_limit} were requested.",
        )

    section = ExamSection(
        exam_id=exam_id,
        title=payload.title,
        library_id=payload.library_id,
        subject=payload.subject,
        section_order=payload.section_order,
        question_limit=payload.question_limit,
        total_marks=payload.total_marks,
        negative_marks=payload.negative_marks,
        randomize_questions=payload.randomize_questions,
    )
    db.add(section)
    db.flush()

    selected = (
        random.sample(available_pool, payload.question_limit)
        if payload.randomize_questions
        else available_pool[: payload.question_limit]
    )
    for question in selected:
        db.add(ExamQuestion(exam_id=exam_id, question_id=question.id, section_id=section.id))

    db.commit()
    db.refresh(section)
    return _section_out(db, section)


@router.delete("/{section_id}")
def delete_section(
    section_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    section = db.query(ExamSection).filter(ExamSection.id == section_id).first()
    if not section:
        raise HTTPException(404, "Section not found")

    db.query(ExamQuestion).filter(ExamQuestion.section_id == section_id).delete()
    db.delete(section)
    db.commit()
    return {"message": "Section deleted successfully"}