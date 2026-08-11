from datetime import datetime, timedelta

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
    ProctorEvent,
)
from app.schemas import MonitoringOverview, SessionListItem, SessionDetail, ViolationOut
from app.auth import require_role

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


def _session_status(session: ExamSession) -> str:
    if session.is_revoked:
        return "Terminated"
    if session.submitted_at is not None:
        return "Submitted"
    return "Active"


def _time_left_seconds(session: ExamSession, exam: Exam) -> int:
    if session.submitted_at is not None or session.is_revoked:
        return 0
    now = datetime.utcnow()
    if session.token_expires_at:
        remaining = (session.token_expires_at - now).total_seconds()
    else:
        # Fall back to started_at + exam duration if no explicit token expiry.
        deadline = session.started_at + timedelta(minutes=exam.duration_minutes)
        remaining = (deadline - now).total_seconds()
    return max(int(remaining), 0)


@router.get("/overview", response_model=MonitoringOverview)
def get_monitoring_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    sessions = db.query(ExamSession).all()
    all_sessions_count = len(sessions)
    active_count = sum(1 for s in sessions if s.submitted_at is None and not s.is_revoked)
    submitted_count = sum(1 for s in sessions if s.submitted_at is not None)
    terminated_count = sum(1 for s in sessions if s.is_revoked)
    violations_count = db.query(ProctorEvent).count()

    return MonitoringOverview(
        all_sessions_count=all_sessions_count,
        active_count=active_count,
        # There's no separate presence/heartbeat tracking yet, so "online"
        # currently mirrors "active" (a session in progress, not submitted
        # or terminated). This is a simplification, not live socket presence.
        online_count=active_count,
        submitted_count=submitted_count,
        terminated_count=terminated_count,
        violations_count=violations_count,
    )


@router.get("/sessions", response_model=list[SessionListItem])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    sessions = db.query(ExamSession).order_by(ExamSession.started_at.desc()).all()
    results = []
    for session in sessions:
        exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
        student = db.query(User).filter(User.id == session.student_id).first()
        if not exam or not student:
            continue

        total_questions = (
            db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).count()
        )
        questions_answered = (
            db.query(Answer).filter(Answer.session_id == session.id).count()
        )
        violations_count = (
            db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).count()
        )

        results.append(
            SessionListItem(
                id=session.id,
                student_name=student.full_name,
                student_roll=student.roll_number,
                exam_title=exam.title,
                exam_subject=exam.subject,
                status=_session_status(session),
                time_left_seconds=_time_left_seconds(session, exam),
                questions_answered=questions_answered,
                total_questions=total_questions,
                violations_count=violations_count,
            )
        )
    return results


@router.get("/sessions/{session_id}", response_model=SessionDetail)
def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
    student = db.query(User).filter(User.id == session.student_id).first()
    if not exam or not student:
        raise HTTPException(404, "Related exam or student not found")

    total_questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).count()
    questions_answered = db.query(Answer).filter(Answer.session_id == session.id).count()

    violation_rows = (
        db.query(ProctorEvent)
        .filter(ProctorEvent.session_id == session.id)
        .order_by(ProctorEvent.timestamp.desc())
        .all()
    )
    violations = [
        ViolationOut(event_type=v.event_type, detail=v.detail, timestamp=v.timestamp)
        for v in violation_rows
    ]

    termination_reason = None
    if session.is_revoked:
        termination_reason = "Session revoked by examiner."
    elif session.auto_submitted:
        termination_reason = "Time expired — auto-submitted."

    return SessionDetail(
        id=session.id,
        status=_session_status(session),
        student_name=student.full_name,
        student_email=student.email,
        student_roll=student.roll_number,
        department=student.department,
        semester=student.semester,
        exam_title=exam.title,
        exam_subject=exam.subject,
        time_left_seconds=_time_left_seconds(session, exam),
        current_question=min(questions_answered + 1, max(total_questions, 1)),
        questions_answered=questions_answered,
        total_questions=total_questions,
        violations_count=len(violations),
        proctoring_enabled=exam.proctoring_enabled,
        webcam_monitoring_enabled=exam.webcam_monitoring_enabled,
        gaze_tracking_enabled=exam.gaze_tracking_enabled,
        max_tab_switch_warnings=exam.max_tab_switch_warnings,
        termination_reason=termination_reason,
        violations=violations,
    )