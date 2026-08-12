from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserOut, Token, UserUpdate
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Set account_status to pending for new registrants (Admin accounts default to approved if created directly)
    initial_status = "approved" if payload.role == UserRole.admin else "pending"

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password[:72]),
        full_name=payload.full_name,
        role=payload.role,
        account_status=initial_status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Notify Admin of new registration
    try:
        from app.models import Notification
        notif = Notification(
            target_role="admin",
            title="New User Registration",
            message=f"{user.full_name or user.email} registered as {user.role.value.capitalize()} and requires account review.",
            category="user_registration",
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password[:72], user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check approval status
    status_lower = (user.account_status or "approved").lower()
    if status_lower == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending Admin approval. Please wait for an administrator to approve your registration.",
        )
    elif status_lower == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration request was rejected by the system Administrator.",
        )

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()

    if payload.email is not None and payload.email.strip():
        existing = (
            db.query(User)
            .filter(User.email == payload.email.strip(), User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        current_user.email = payload.email.strip()

    if payload.password is not None and payload.password.strip():
        current_user.hashed_password = hash_password(payload.password.strip())

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user