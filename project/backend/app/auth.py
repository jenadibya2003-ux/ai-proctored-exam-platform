"""
Password hashing + JWT helpers, and the FastAPI dependency that protects
routes by role. Read this file top to bottom once — it's the piece that
touches every other module.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*allowed_roles: UserRole):
    """Usage: Depends(require_role(UserRole.examiner, UserRole.admin))"""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return role_checker


from app.models import ExamSession


def create_exam_token(exam_id: str, student_id: str, session_id: str, expires_minutes: int) -> str:
    """Separate, short-lived token type — only for exam-taking endpoints.
    Deliberately has NO 'role' claim, so it can never be used on normal
    login-protected routes like /questions/.
    """
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "exam_id": exam_id,
        "student_id": student_id,
        "session_id": session_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def get_current_exam_session(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> ExamSession:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired exam session token",
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        session_id = payload.get("session_id")
        exam_id = payload.get("exam_id")
        student_id = payload.get("student_id")
        if session_id is None or exam_id is None or student_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if session is None:
        raise credentials_exception
    if session.is_revoked:
        raise HTTPException(status_code=401, detail="Exam session has been revoked")
    if session.exam_id != exam_id or session.student_id != student_id:
        raise HTTPException(status_code=401, detail="Exam session token is bound to a different student or exam")
    if session.token_expires_at and datetime.utcnow() > session.token_expires_at:
        raise HTTPException(status_code=401, detail="Exam session token has expired")

    return session