from app.database import SessionLocal
from app.models import User, UserRole
from app.auth import hash_password

db = SessionLocal()

demo_users = [
    {"email": "student@example.com", "password": "password123", "full_name": "Demo Student", "role": UserRole.student},
    {"email": "examiner@example.com", "password": "password123", "full_name": "Demo Examiner", "role": UserRole.examiner},
    {"email": "admin@example.com", "password": "password123", "full_name": "Demo Admin", "role": UserRole.admin},
]

for item in demo_users:
    user = db.query(User).filter(User.email == item["email"]).first()
    if not user:
        user = User(
            email=item["email"],
            hashed_password=hash_password(item["password"]),
            full_name=item["full_name"],
            role=item["role"]
        )
        db.add(user)
    else:
        user.hashed_password = hash_password(item["password"])
        user.role = item["role"]
        user.full_name = item["full_name"]

db.commit()
db.close()
print("All demo users successfully created/updated!")
