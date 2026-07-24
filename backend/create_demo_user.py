from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

s = SessionLocal()
u = s.query(User).filter(User.email == "student@example.com").first()
if not u:
    u = User(
        email="student@example.com",
        hashed_password=hash_password("password123"),
        full_name="Student User",
        role="student",
    )
    s.add(u)
    s.commit()
    s.refresh(u)
print(u.email + "|" + u.role.value)
