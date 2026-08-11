from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    UserRole,
    Exam,
    ExamQuestion,
    ExamSession,
    Answer,
    Question,
    Result,
    ProctorEvent,
)
from app.schemas import EvaluationOverview, SubmissionItem
from app.auth import require_role

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


def _submission_status(subjective_total: int, subjective_graded: int, published: bool) -> str:
    if published:
        return "Published"
    if subjective_total == 0:
        return "Evaluated"  # all MCQ, already auto-graded at submission time
    if subjective_graded == 0:
        return "Pending"
    if subjective_graded < subjective_total:
        return "Manual Review"
    return "Evaluated"


def _build_submission(db: Session, session: ExamSession) -> SubmissionItem | None:
    exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
    student = db.query(User).filter(User.id == session.student_id).first()
    if not exam or not student:
        return None

    answers = db.query(Answer).filter(Answer.session_id == session.id).all()
    total_questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).count()

    subjective_total = 0
    subjective_graded = 0
    ai_score_sum = 0
    final_score_sum = 0
    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        if question and question.question_type.value in ("short_answer", "long_answer"):
            subjective_total += 1
            if answer.final_score is not None:
                subjective_graded += 1
        ai_score_sum += answer.ai_score or 0
        final_score_sum += answer.final_score or 0

    result = db.query(Result).filter(Result.session_id == session.id).first()
    published = result is not None and result.status == "published"

    violations_count = db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).count()

    return SubmissionItem(
        session_id=session.id,
        student_name=student.full_name,
        student_email=student.email,
        student_roll=getattr(student, "roll_number", None) or student.email,
        exam_id=exam.id,
        exam_title=exam.title,
        exam_subject=exam.subject,
        ai_score=ai_score_sum,
        final_score=final_score_sum,
        total_marks=exam.total_marks,
        pending_count=subjective_total - subjective_graded,
        total_questions=total_questions,
        status=_submission_status(subjective_total, subjective_graded, published),
        violations_count=violations_count,
    )


@router.get("/overview", response_model=EvaluationOverview)
def get_evaluation_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    submitted_sessions = (
        db.query(ExamSession).filter(ExamSession.submitted_at.isnot(None)).all()
    )
    submissions = [s for s in (_build_submission(db, sess) for sess in submitted_sessions) if s]

    return EvaluationOverview(
        submissions_count=len(submissions),
        manual_review_count=sum(1 for s in submissions if s.status == "Manual Review"),
        evaluated_count=sum(1 for s in submissions if s.status == "Evaluated"),
        published_count=sum(1 for s in submissions if s.status == "Published"),
    )


@router.get("/submissions", response_model=list[SubmissionItem])
def list_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    submitted_sessions = (
        db.query(ExamSession)
        .filter(ExamSession.submitted_at.isnot(None))
        .order_by(ExamSession.submitted_at.desc())
        .all()
    )
    return [s for s in (_build_submission(db, sess) for sess in submitted_sessions) if s]


@router.post("/submissions/{session_id}/publish")
def publish_submission(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    submission = _build_submission(db, session)
    if not submission:
        raise HTTPException(404, "Related exam or student not found")

    if submission.status not in ("Evaluated",):
        raise HTTPException(
            400, "All subjective answers must be graded before publishing this result."
        )

    exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
    percentage = (
        round((submission.final_score / exam.total_marks) * 100) if exam.total_marks else 0
    )

    result = db.query(Result).filter(Result.session_id == session_id).first()
    if result:
        result.total_score = submission.final_score
        result.percentage = percentage
        result.status = "published"
    else:
        result = Result(
            session_id=session_id,
            student_id=session.student_id,
            exam_id=session.exam_id,
            total_score=submission.final_score,
            percentage=percentage,
            status="published",
        )
        db.add(result)

    db.commit()
    return {"message": "Result published successfully"}


def _analyze_keywords(model_ans: str | None, text_ans: str | None, max_marks: int):
    if not text_ans or not text_ans.strip():
        return {
            "matched_keywords": [],
            "missing_keywords": ["No answer submitted"],
            "suggested_score": 0,
            "match_ratio": 0,
            "justification": "Candidate submitted no response.",
        }

    raw_reference = model_ans or "computer science algorithms data structure programming python code function return logic"
    words = [w.strip(".,()[]{}!?\"'").lower() for w in raw_reference.split() if len(w.strip(".,()[]{}!?\"'")) > 3]
    stopwords = {"that", "with", "this", "from", "have", "were", "what", "which", "when", "where", "user", "your"}
    keywords = sorted(list(set([w for w in words if w not in stopwords])))[:6]

    if not keywords:
        keywords = ["data", "system", "process", "result"]

    ans_lower = text_ans.lower()
    matched = [kw for kw in keywords if kw in ans_lower]
    missing = [kw for kw in keywords if kw not in ans_lower]

    ratio = len(matched) / len(keywords) if keywords else 0
    match_percentage = round(ratio * 100)
    suggested_score = max(0, min(max_marks, round(ratio * max_marks)))

    justification = f"Conceptual Analysis ({match_percentage}% Match): Identified {len(matched)}/{len(keywords)} essential subject concepts ({', '.join(matched) if matched else 'None'}). Missing: ({', '.join(missing) if missing else 'None'}). Recommended AI Score: {suggested_score}/{max_marks} pts."

    return {
        "matched_keywords": matched,
        "missing_keywords": missing,
        "suggested_score": suggested_score,
        "match_ratio": match_percentage,
        "justification": justification,
    }


@router.get("/submissions/{session_id}/detail")
def get_submission_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Exam session not found")

    exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
    student = db.query(User).filter(User.id == session.student_id).first()

    answers = db.query(Answer).filter(Answer.session_id == session.id).all()
    items = []

    for ans in answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue

        analysis = _analyze_keywords(q.model_answer or q.expected_answer, ans.text_answer, q.marks)

        # Update AI score & matched keywords if not already calculated
        if ans.ai_score is None:
            ans.ai_score = analysis["suggested_score"]
            ans.ai_justification = analysis["justification"]
            ans.matched_keywords = analysis["matched_keywords"]
            db.commit()

        items.append({
            "answer_id": ans.id,
            "question_id": q.id,
            "question_text": q.text,
            "question_type": q.question_type.value,
            "marks": q.marks,
            "student_answer": ans.text_answer or (", ".join(ans.selected_option_ids) if ans.selected_option_ids else "No answer"),
            "ai_score": ans.ai_score if ans.ai_score is not None else analysis["suggested_score"],
            "ai_justification": ans.ai_justification or analysis["justification"],
            "matched_keywords": ans.matched_keywords or analysis["matched_keywords"],
            "missing_keywords": analysis["missing_keywords"],
            "match_ratio": analysis["match_ratio"],
            "final_score": ans.final_score if ans.final_score is not None else ans.ai_score,
            "examiner_remarks": ans.examiner_remarks or "",
        })

    return {
        "session_id": session.id,
        "student_name": student.full_name if student else "Candidate",
        "student_email": student.email if student else "",
        "exam_title": exam.title if exam else "Exam",
        "total_marks": exam.total_marks if exam else 100,
        "answers": items,
    }


@router.post("/answers/{answer_id}/grade")
def grade_individual_answer(
    answer_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(404, "Answer record not found")

    score = payload.get("final_score")
    remarks = payload.get("examiner_remarks", "")

    if score is not None:
        answer.final_score = int(score)
    answer.examiner_remarks = str(remarks)
    answer.graded_by = current_user.id

    db.commit()
    db.refresh(answer)

    return {
        "message": "Manual evaluation and examiner remarks saved successfully",
        "final_score": answer.final_score,
        "examiner_remarks": answer.examiner_remarks,
    }


@router.get("/proctoring-report/{session_id}")
def get_proctoring_report(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    student = db.query(User).filter(User.id == session.student_id).first()
    exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
    events = db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).all()

    violation_logs = []
    for ev in events:
        ev_lower = (ev.event_type or "").lower()
        if any(k in ev_lower for k in ["multiple", "phone", "device", "screenshot", "print"]):
            severity = "HIGH"
        elif any(k in ev_lower for k in ["gaze", "tab", "blur", "focus", "head"]):
            severity = "MEDIUM"
        else:
            severity = "LOW"

        violation_logs.append({
            "id": ev.id,
            "type": ev.event_type,
            "details": ev.details or "AI Proctoring suspicious flag",
            "timestamp": ev.timestamp.strftime("%H:%M:%S") if ev.timestamp else "12:00:00",
            "severity": severity,
        })

    trust_score = max(0, 100 - (len(events) * 12))

    return {
        "session_id": session.id,
        "student_name": student.full_name if student else "Candidate",
        "student_email": student.email if student else "",
        "exam_title": exam.title if exam else "Exam",
        "trust_score": trust_score,
        "total_violations": len(events),
        "status": "FLAGGED" if len(events) >= 3 else "CLEAN" if len(events) == 0 else "WARNING",
        "events": violation_logs,
    }