from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    UserRole,
    Exam,
    ExamAssignment,
    ExamSession,
    ProctorEvent,
)
from app.schemas import (
    StudentOut,
    StudentsOverview,
    AssignExamRequest,
    ExamAssignmentStatus,
    BulkAssignRequest,
)
from app.auth import require_role

router = APIRouter(prefix="/students", tags=["students"])


def _build_student_out(db: Session, student: User) -> StudentOut:
    assigned_count = (
        db.query(ExamAssignment).filter(ExamAssignment.student_id == student.id).count()
    )
    sessions = db.query(ExamSession).filter(ExamSession.student_id == student.id).all()
    started_count = len(sessions)
    submitted_count = sum(1 for s in sessions if s.submitted_at is not None)
    active_count = sum(
        1 for s in sessions if s.submitted_at is None and not s.is_revoked
    )
    not_started_count = max(assigned_count - started_count, 0)

    session_ids = [s.id for s in sessions]
    violations_count = (
        db.query(ProctorEvent).filter(ProctorEvent.session_id.in_(session_ids)).count()
        if session_ids
        else 0
    )

    return StudentOut(
        id=student.id,
        full_name=student.full_name,
        email=student.email,
        roll_number=student.roll_number,
        department=student.department,
        semester=student.semester,
        phone=student.phone,
        account_status=student.account_status,
        assigned_count=assigned_count,
        active_count=active_count,
        submitted_count=submitted_count,
        not_started_count=not_started_count,
        violations_count=violations_count,
    )


@router.get("/exam-assignments/{exam_id}", response_model=ExamAssignmentStatus)
def get_exam_assignment_status(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    assignments = db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id).all()
    assigned_student_ids = [a.student_id for a in assignments]

    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam_id).all()
    started_count = len(sessions)
    submitted_count = sum(1 for s in sessions if s.submitted_at is not None)

    return ExamAssignmentStatus(
        assigned_student_ids=assigned_student_ids,
        assigned_count=len(assigned_student_ids),
        started_count=started_count,
        submitted_count=submitted_count,
    )


@router.post("/exam-assignments/{exam_id}/bulk-assign")
def bulk_assign_exam(
    exam_id: str,
    payload: BulkAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    existing_ids = {
        row.student_id
        for row in db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id).all()
    }

    added = 0
    for student_id in payload.student_ids:
        if student_id in existing_ids:
            continue
        db.add(ExamAssignment(exam_id=exam_id, student_id=student_id))
        added += 1

    db.commit()
    return {"message": f"Assigned {added} student(s)", "added": added}


@router.get("/overview", response_model=StudentsOverview)
def get_students_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    students_count = db.query(User).filter(User.role == UserRole.student).count()
    assignments_count = db.query(ExamAssignment).count()
    active_sessions_count = (
        db.query(ExamSession)
        .filter(ExamSession.submitted_at.is_(None), ExamSession.is_revoked.is_(False))
        .count()
    )
    submitted_count = db.query(ExamSession).filter(ExamSession.submitted_at.isnot(None)).count()
    violations_count = db.query(ProctorEvent).count()

    return StudentsOverview(
        students_count=students_count,
        assignments_count=assignments_count,
        active_sessions_count=active_sessions_count,
        submitted_count=submitted_count,
        violations_count=violations_count,
    )


@router.get("/", response_model=list[StudentOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    students = db.query(User).filter(User.role == UserRole.student).all()
    return [_build_student_out(db, s) for s in students]


@router.get("/admin/pending-users")
def get_pending_users_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.examiner)),
):
    users = db.query(User).filter(User.account_status == "pending").all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "account_status": "pending",
            "created_at": u.created_at.strftime("%d/%m/%Y %H:%M") if u.created_at else "Just now",
        }
        for u in users
    ]


@router.get("/admin/all-users")
def get_all_users_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.examiner)),
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "account_status": getattr(u, "account_status", "approved") or "approved",
            "roll_number": u.roll_number,
            "created_at": u.created_at.strftime("%d/%m/%Y") if u.created_at else "01/01/2026",
        }
        for u in users
    ]


@router.post("/admin/users/{user_id}/status")
def update_user_status_by_admin(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    new_status = payload.get("account_status")
    if new_status:
        user.account_status = new_status
        db.commit()
        db.refresh(user)
    return {
        "message": f"User status updated to {user.account_status}",
        "id": user.id,
        "account_status": user.account_status,
    }


@router.post("/admin/users/{user_id}/approve")
def approve_user_by_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.account_status = "approved"
    db.commit()
    db.refresh(user)
    return {"message": f"User {user.full_name} ({user.email}) approved successfully!", "account_status": "approved"}


@router.post("/admin/users/{user_id}/reject")
def reject_user_by_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.account_status = "rejected"
    db.commit()
    db.refresh(user)
    return {"message": f"User {user.full_name} ({user.email}) registration rejected.", "account_status": "rejected"}


@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    student = (
        db.query(User)
        .filter(User.id == student_id, User.role == UserRole.student)
        .first()
    )
    if not student:
        raise HTTPException(404, "Student not found")
    return _build_student_out(db, student)


@router.post("/{student_id}/assign-exam")
def assign_exam_to_student(
    student_id: str,
    payload: AssignExamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.examiner, UserRole.admin)),
):
    student = (
        db.query(User)
        .filter(User.id == student_id, User.role == UserRole.student)
        .first()
    )
    if not student:
        raise HTTPException(404, "Student not found")

    exam = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    existing = (
        db.query(ExamAssignment)
        .filter(
            ExamAssignment.student_id == student_id,
            ExamAssignment.exam_id == payload.exam_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "This exam is already assigned to this student")

    assignment = ExamAssignment(exam_id=payload.exam_id, student_id=student_id)
    db.add(assignment)
    db.commit()
    return {"message": "Exam assigned successfully"}


