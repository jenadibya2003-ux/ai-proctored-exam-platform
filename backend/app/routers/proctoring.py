"""
Proctoring pipeline.

- Students' browsers connect to the WebSocket below while taking an exam,
  and send a small JSON message every time something suspicious happens
  (tab switch, face not detected, etc). This endpoint saves each event and
  bumps the session's suspicion_score.
- Examiners use the two REST endpoints to see what's happening: which
  sessions are currently active, and the full event timeline for one.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel

from app.config import settings
from app.database import get_db, SessionLocal
from app.models import ExamSession, ProctorEvent, Exam, User, UserRole
from app.auth import require_role

router = APIRouter(prefix="/proctoring", tags=["proctoring"])

# How much each event type adds to a session's suspicion score (0-100).
EVENT_WEIGHTS = {
    "tab_switch": 10,
    "face_absent": 15,
    "multiple_faces": 20,
    "gaze_away": 5,
    "device_detected": 20,
}


def _resolve_session_from_token(token: str, db: Session) -> Optional[ExamSession]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    session_id = payload.get("session_id")
    if not session_id:
        return None
    return db.query(ExamSession).filter(ExamSession.id == session_id).first()


@router.websocket("/ws")
async def proctor_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Students connect here while taking an exam:
        ws://localhost:8000/proctoring/ws?token=<exam_session_token>

    Then send JSON messages like:
        {"event_type": "tab_switch", "detail": {"count": 1}}
    """
    db = SessionLocal()
    session = _resolve_session_from_token(token, db)
    if session is None or session.is_revoked:
        await websocket.close(code=4401)
        db.close()
        return

    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            event_type = payload.get("event_type")
            detail = payload.get("detail")

            if event_type not in EVENT_WEIGHTS:
                continue  # ignore anything we don't recognize instead of crashing

            event = ProctorEvent(
                session_id=session.id,
                event_type=event_type,
                detail=detail,
                timestamp=datetime.utcnow(),
            )
            db.add(event)

            session.suspicion_score = min(100, (session.suspicion_score or 0) + EVENT_WEIGHTS[event_type])
            db.add(session)
            db.commit()

            # Trigger Notification for Admin & Examiner on proctoring warning
            try:
                from app.models import Notification
                exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
                student = db.query(User).filter(User.id == session.student_id).first()
                exam_title = exam.title if exam else "Exam"
                student_name = student.full_name if student else "Candidate"
                v_type = event_type.replace("_", " ").title()

                db.add(Notification(
                    target_role="admin",
                    title="Proctoring Violation Warning",
                    message=f"Candidate {student_name} flagged for '{v_type}' during {exam_title} (Trust Score: {max(0, 100 - session.suspicion_score)}%).",
                    category="proctoring_alert",
                ))
                db.add(Notification(
                    target_role="examiner",
                    title="Proctoring Violation Warning",
                    message=f"Candidate {student_name} flagged for '{v_type}' during {exam_title} (Trust Score: {max(0, 100 - session.suspicion_score)}%).",
                    category="proctoring_alert",
                ))
                db.commit()
            except Exception:
                pass

            await websocket.send_json({"ok": True, "suspicion_score": session.suspicion_score})
    except WebSocketDisconnect:
        pass
    finally:
        db.close()


@router.get("/active-sessions")
def list_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    """Sessions that have started but not yet submitted — for the Live Monitor page."""
    sessions = (
        db.query(ExamSession)
        .filter(ExamSession.submitted_at.is_(None), ExamSession.is_revoked.is_(False))
        .all()
    )

    results = []
    for s in sessions:
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        student = db.query(User).filter(User.id == s.student_id).first()
        event_count = db.query(ProctorEvent).filter(ProctorEvent.session_id == s.id).count()
        results.append({
            "session_id": s.id,
            "exam_id": s.exam_id,
            "exam_title": exam.title if exam else "Unknown exam",
            "student_id": s.student_id,
            "student_name": student.full_name if student else "Unknown student",
            "student_email": student.email if student else "",
            "started_at": s.started_at,
            "suspicion_score": s.suspicion_score or 0,
            "event_count": event_count,
        })
    return results


@router.get("/sessions")
def list_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    """All proctoring sessions for live monitoring dashboard."""
    sessions = db.query(ExamSession).all()
    results = []
    for s in sessions:
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        student = db.query(User).filter(User.id == s.student_id).first()
        event_count = db.query(ProctorEvent).filter(ProctorEvent.session_id == s.id).count()
        status_str = "Submitted" if s.submitted_at else ("Active" if not s.is_revoked else "Terminated")
        results.append({
            "session_id": s.id,
            "exam_id": s.exam_id,
            "exam_title": exam.title if exam else "xzdvb",
            "exam_subject": exam.subject if exam else "fg",
            "student_id": s.student_id,
            "student_name": student.full_name if student else "Rick",
            "student_roll": getattr(student, "roll_number", None) or (student.email if student else "student1@example.com"),
            "student_email": student.email if student else "rick@gmail.com",
            "started_at": s.started_at,
            "submitted_at": s.submitted_at,
            "status": status_str,
            "time_left": "00:00" if s.submitted_at else "15:20",
            "total_questions": 5,
            "answered_questions": 5,
            "violations_count": event_count,
            "suspicion_score": s.suspicion_score or 0,
        })
    return results


@router.get("/events/{session_id}")
def list_session_events(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    """Full event timeline for one session — for the Proctoring Review page."""
    events = (
        db.query(ProctorEvent)
        .filter(ProctorEvent.session_id == session_id)
        .order_by(ProctorEvent.timestamp.asc())
        .all()
    )
    return [
        {"id": e.id, "event_type": e.event_type, "detail": e.detail, "timestamp": e.timestamp}
        for e in events
    ]
    


class ReviewDecision(BaseModel):
    decision: str  # "confirmed" or "dismissed"
    note: str = ""


@router.get("/flagged-sessions")
def list_flagged_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    """Sessions with at least one proctor event, regardless of whether they've
    finished — this is what feeds the Proctoring Review page."""
    session_ids_with_events = (
        db.query(ProctorEvent.session_id).distinct().all()
    )
    session_ids = [row[0] for row in session_ids_with_events]

    sessions = (
        db.query(ExamSession)
        .filter(ExamSession.id.in_(session_ids))
        .order_by(ExamSession.suspicion_score.desc())
        .all()
    )

    results = []
    for s in sessions:
        exam = db.query(Exam).filter(Exam.id == s.exam_id).first()
        student = db.query(User).filter(User.id == s.student_id).first()

        tab_switches = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == s.id, ProctorEvent.event_type == "tab_switch"
        ).count()
        face_absent = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == s.id, ProctorEvent.event_type == "face_absent"
        ).count()
        multiple_faces = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == s.id, ProctorEvent.event_type == "multiple_faces"
        ).count()

        results.append({
            "session_id": s.id,
            "exam_title": exam.title if exam else "Unknown exam",
            "student_name": student.full_name if student else "Unknown student",
            "student_email": student.email if student else "",
            "is_in_progress": s.submitted_at is None,
            "suspicion_score": s.suspicion_score or 0,
            "review_status": s.review_status or "pending",
            "review_note": s.review_note,
            "tab_switches": tab_switches,
            "face_absent": face_absent,
            "multiple_faces": multiple_faces,
        })
    return results


@router.post("/review/{session_id}")
def submit_review(
    session_id: str,
    payload: ReviewDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    """Examiner confirms or dismisses a flagged session."""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if session is None:
        return {"error": "Session not found"}, 404

    if payload.decision not in ("confirmed", "dismissed"):
        return {"error": "decision must be 'confirmed' or 'dismissed'"}, 400

    session.review_status = payload.decision
    session.review_note = payload.note
    db.add(session)
    db.commit()

    return {"session_id": session.id, "review_status": session.review_status}