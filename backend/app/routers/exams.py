import hashlib
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Exam, ExamQuestion, Question, UserRole, User, ExamSession, Answer, Option
from app.schemas import ExamCreate, ExamOut, QuestionForStudent
from app.auth import require_role, create_exam_token, get_current_exam_session
from app.config import settings

router = APIRouter(prefix="/exams", tags=["exams"])

@router.get("/admin/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)

    # Active sessions: started, not submitted, not revoked, token not expired
    active_sessions_q = db.query(ExamSession).filter(
        ExamSession.submitted_at.is_(None),
        ExamSession.is_revoked == False,
    )
    active_sessions_count = active_sessions_q.count()

    # Exams happening today
    exams_today = db.query(Exam).filter(
        Exam.start_time < today_end,
        Exam.end_time >= today_start,
    ).all()
    exams_today_count = len(exams_today)

    completed_today_count = db.query(ExamSession).filter(
        ExamSession.submitted_at >= today_start,
        ExamSession.submitted_at < today_end,
    ).count()

    # Flagged sessions: suspicion score above threshold
    flagged_count = db.query(ExamSession).filter(
        ExamSession.suspicion_score > 50
    ).count()

    # Grading queue: subjective answers not yet graded (graded_by is null)
    ungraded_answers = (
        db.query(Answer)
        .join(Question, Answer.question_id == Question.id)
        .filter(
            Question.question_type.in_(["short_answer", "long_answer", "image_upload"]),
            Answer.graded_by.is_(None),
        )
        .count()
    )

    # Average score across submitted sessions (sum of final_score per session / count)
    submitted_sessions = db.query(ExamSession).filter(
        ExamSession.submitted_at.isnot(None)
    ).all()

    avg_score_percent = 0
    if submitted_sessions:
        total_percent = 0
        counted = 0
        for s in submitted_sessions:
            answers = db.query(Answer).filter(Answer.session_id == s.id).all()
            if not answers:
                continue
            session_score = sum(a.final_score or 0 for a in answers)
            session_max = 0
            for a in answers:
                q = db.query(Question).filter(Question.id == a.question_id).first()
                if q:
                    session_max += q.marks
            if session_max > 0:
                total_percent += (session_score / session_max) * 100
                counted += 1
        if counted > 0:
            avg_score_percent = round(total_percent / counted)

    # Live sessions detail (limit to 10 most recent active)
    live_sessions_raw = active_sessions_q.order_by(ExamSession.started_at.desc()).limit(10).all()
    live_sessions = []
    for s in live_sessions_raw:
        student = db.query(User).filter(User.id == s.student_id).first()
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        answers = db.query(Answer).filter(Answer.session_id == s.id).all()
        current_score = sum(a.final_score or 0 for a in answers)
        live_sessions.append({
            "student_name": student.full_name if student else "Unknown",
            "exam_title": exam.title if exam else "Unknown",
            "answered_count": len(answers),
            "suspicion_score": s.suspicion_score,
            "current_score": current_score,
        })

    # Upcoming exams (start_time in the future)
    upcoming = db.query(Exam).filter(Exam.start_time > now).order_by(Exam.start_time).limit(5).all()
    upcoming_exams = [
        {"title": e.title, "start_time": e.start_time}
        for e in upcoming
    ]

    return {
        "active_sessions": active_sessions_count,
        "exams_today": exams_today_count,
        "exams_completed_today": completed_today_count,
        "flagged_sessions": flagged_count,
        "grading_queue": ungraded_answers,
        "avg_score_percent": avg_score_percent,
        "live_sessions": live_sessions,
        "upcoming_exams": upcoming_exams,
    }


@router.post("/", response_model=ExamOut)
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    if payload.start_time >= payload.end_time:
        raise HTTPException(400, "Exam end time must be after start time")

    if payload.duration_minutes <= 0:
        raise HTTPException(400, "duration_minutes must be positive")

    if payload.max_tab_switch_warnings < 0:
        raise HTTPException(400, "max_tab_switch_warnings cannot be negative")

    if payload.question_selection_rules:
        required_counts = payload.question_selection_rules.get("difficulty_counts") or {}
        if not isinstance(required_counts, dict):
            raise HTTPException(400, "difficulty_counts must be a dictionary")

    questions = []
    for qid in payload.question_ids:
        question = db.query(Question).filter(Question.id == qid).first()
        if not question:
            raise HTTPException(400, f"Question {qid} does not exist")
        questions.append(question)

    if payload.question_selection_rules:
        difficulty_counts = payload.question_selection_rules.get("difficulty_counts") or {}
        if difficulty_counts:
            actual_counts = {level: 0 for level in difficulty_counts}
            for question in questions:
                if question.difficulty in actual_counts:
                    actual_counts[question.difficulty] += 1
            for level, required in difficulty_counts.items():
                if actual_counts.get(level, 0) < required:
                    raise HTTPException(400, f"Not enough questions for difficulty {level}")

        type_distribution = payload.question_selection_rules.get("question_type_distribution") or {}
        if type_distribution:
            actual_types = {qtype: 0 for qtype in type_distribution}
            for question in questions:
                if question.question_type.value in actual_types:
                    actual_types[question.question_type.value] += 1
            for qtype, required in type_distribution.items():
                if actual_types.get(qtype, 0) < required:
                    raise HTTPException(400, f"Not enough questions for question type {qtype}")

    exam = Exam(
        title=payload.title,
        subject=payload.subject,
        total_marks=payload.total_marks,
        passing_marks=payload.passing_marks,
        status=payload.status,
        duration_minutes=payload.duration_minutes,
        start_time=payload.start_time,
        end_time=payload.end_time,
        randomize_questions=payload.randomize_questions,
        randomization_mode=payload.randomization_mode,
        question_selection_rules=payload.question_selection_rules,
        negative_marking_enabled=payload.negative_marking_enabled,
        proctoring_enabled=payload.proctoring_enabled,
        webcam_monitoring_enabled=payload.webcam_monitoring_enabled,
        gaze_tracking_enabled=payload.gaze_tracking_enabled,
        gaze_tracking_sensitivity_threshold=payload.gaze_tracking_sensitivity_threshold,
        max_tab_switch_warnings=payload.max_tab_switch_warnings,
        created_by=current_user.id,
    )
    db.add(exam)
    db.flush()

    for qid in payload.question_ids:
        db.add(ExamQuestion(exam_id=exam.id, question_id=qid))

    db.commit()
    db.refresh(exam)
    return exam


@router.get("/", response_model=List[ExamOut])
def list_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    return db.query(Exam).all()


@router.get("/student", response_model=List[ExamOut])
def list_available_exams_for_student(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.student)),
):
    now = datetime.utcnow()
    return (
        db.query(Exam)
        .filter(Exam.start_time <= now, Exam.end_time >= now)
        .order_by(Exam.start_time.asc())
        .all()
    )


@router.post("/{exam_id}/start")
def start_exam(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.student)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    now = datetime.utcnow()
    if now < exam.start_time or now > exam.end_time:
        raise HTTPException(400, "Exam is not currently open")

    existing = (
        db.query(ExamSession)
        .filter(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == current_user.id,
            ExamSession.is_revoked == False,
        )
        .order_by(ExamSession.started_at.desc())
        .first()
    )

    if existing:
        if existing.token_expires_at and existing.token_expires_at > now:
            return {
                "access_token": existing.session_token,
                "token_type": "bearer",
                "session_id": existing.id,
                "expires_at": existing.token_expires_at,
            }

        if existing.token_expires_at and existing.token_expires_at <= now:
            existing.is_revoked = True
            db.add(existing)

    session = ExamSession(
        exam_id=exam_id,
        student_id=current_user.id,
        session_token="",
    )
    db.add(session)
    db.flush()

    expires_minutes = settings.exam_session_token_expire_minutes
    token = create_exam_token(exam_id, current_user.id, session.id, expires_minutes)
    session.session_token = token
    session.token_expires_at = now + timedelta(minutes=expires_minutes)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "session_id": session.id,
        "expires_at": session.token_expires_at,
    }


@router.get("/{exam_id}/me")
def get_my_exam_session(
    exam_id: str,
    session: ExamSession = Depends(get_current_exam_session),
):
    if session.exam_id != exam_id:
        raise HTTPException(403, "This token is not valid for this exam")

    return {
        "session_id": session.id,
        "student_id": session.student_id,
        "started_at": session.started_at,
        "token_expires_at": session.token_expires_at,
    }


@router.get("/{exam_id}/questions", response_model=List[QuestionForStudent])
def get_exam_questions(
    exam_id: str,
    db: Session = Depends(get_db),
    session: ExamSession = Depends(get_current_exam_session),
):
    if session.exam_id != exam_id:
        raise HTTPException(403, "This token is not valid for this exam")

    links = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    question_ids = [link.question_id for link in links]
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()

    if not questions:
        return []

    if len(questions) > 1:
        seed = hashlib.sha256(f"{session.student_id}:{exam_id}".encode("utf-8")).hexdigest()
        order = [int(seed[i:i+2], 16) % len(questions) for i in range(0, 16, 2)]
        stable_order = []
        for index in order:
            if index not in stable_order:
                stable_order.append(index)
        while len(stable_order) < len(questions):
            stable_order.append(len(stable_order))
        questions = [questions[i] for i in stable_order[: len(questions)]]

    return questions


@router.post("/{exam_id}/submit")
def submit_exam(
    exam_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    session: ExamSession = Depends(get_current_exam_session),
):
    if session.exam_id != exam_id:
        raise HTTPException(403, "This token is not valid for this exam")

    if session.submitted_at is not None:
        raise HTTPException(400, "This exam has already been submitted")

    # payload expected shape: {"answers": {"question_id": "option_id_or_text", ...}}
    submitted_answers = payload.get("answers", {})

    total_score = 0
    max_score = 0

    for question_id, submitted_value in submitted_answers.items():
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            continue

        max_score += question.marks
        score_for_this_question = 0

        if question.question_type.value in ("mcq", "multi_select"):
            correct_option = (
                db.query(Option)
                .filter(Option.question_id == question_id, Option.is_correct == True)
                .first()
            )
            is_correct = correct_option is not None and correct_option.id == submitted_value
            if is_correct:
                score_for_this_question = question.marks
            else:
                score_for_this_question = -question.negative_marks

        answer = Answer(
            session_id=session.id,
            question_id=question_id,
            selected_option_ids=[submitted_value]
            if question.question_type.value in ("mcq", "multi_select")
            else None,
            text_answer=submitted_value
            if question.question_type.value not in ("mcq", "multi_select")
            else None,
            final_score=score_for_this_question,
        )
        db.add(answer)
        total_score += score_for_this_question

    session.submitted_at = datetime.utcnow()
    db.commit()

    return {
        "message": "Exam submitted successfully",
        "total_score": total_score,
        "max_score": max_score,
    }
@router.get("/{exam_id}/answers")
def get_exam_answers_for_grading(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam_id).all()
    session_ids = [s.id for s in sessions]

    answers = db.query(Answer).filter(Answer.session_id.in_(session_ids)).all()

    results = []
    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        student_session = next((s for s in sessions if s.id == answer.session_id), None)
        results.append({
            "answer_id": answer.id,
            "session_id": answer.session_id,
            "student_id": student_session.student_id if student_session else None,
            "question_id": answer.question_id,
            "question_text": question.text if question else "",
            "question_type": question.question_type.value if question else "",
            "text_answer": answer.text_answer,
            "selected_option_ids": answer.selected_option_ids,
            "final_score": answer.final_score,
            "max_marks": question.marks if question else 0,
        })

    return results


@router.post("/answers/{answer_id}/grade")
def grade_answer(
    answer_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(404, "Answer not found")

    score = payload.get("score")
    if score is None:
        raise HTTPException(400, "score is required")

    answer.final_score = score
    answer.graded_by = current_user.id
    db.commit()

    return {"message": "Answer graded successfully", "final_score": answer.final_score}

    
@router.get("/{exam_id}/my-result")
def get_my_result(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.student)),
):
    session = (
        db.query(ExamSession)
        .filter(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == current_user.id,
        )
        .order_by(ExamSession.started_at.desc())
        .first()
    )

    if not session:
        raise HTTPException(404, "No attempt found for this exam")

    if session.submitted_at is None:
        raise HTTPException(400, "You have not submitted this exam yet")

    answers = db.query(Answer).filter(Answer.session_id == session.id).all()

    breakdown = []
    total_score = 0
    max_score = 0

    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        if not question:
            continue
        score = answer.final_score or 0
        total_score += score
        max_score += question.marks
        breakdown.append({
            "question_text": question.text,
            "question_type": question.question_type.value,
            "marks": question.marks,
            "score": score,
        })

    return {
        "submitted_at": session.submitted_at,
        "total_score": total_score,
        "max_score": max_score,
        "breakdown": breakdown,
    }