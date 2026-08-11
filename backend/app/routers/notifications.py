from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, User, UserRole
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = "all"  # student, examiner, admin, all
    user_id: Optional[str] = None
    category: Optional[str] = "announcement"


@router.get("/")
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    
    notifications = (
        db.query(Notification)
        .filter(
            (Notification.user_id == current_user.id)
            | (Notification.target_role == role_str)
            | (Notification.target_role == "all")
        )
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category or "announcement",
            "target_role": n.target_role or "all",
            "user_id": n.user_id,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if n.created_at else "",
        }
        for n in notifications
    ]


@router.put("/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"status": "success"}


@router.post("/admin/create")
def create_notification_broadcast(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    notif = Notification(
        title=payload.title,
        message=payload.message,
        target_role=payload.target_role or "all",
        user_id=payload.user_id,
        category=payload.category or "announcement",
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return {
        "status": "success",
        "notification": {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "target_role": notif.target_role,
            "created_at": notif.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        },
    }


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str != "admin" and notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

    db.delete(notif)
    db.commit()
    return {"status": "success"}
