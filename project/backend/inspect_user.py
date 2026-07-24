from app.database import SessionLocal
from app.models import User

s = SessionLocal()
u = s.query(User).first()
if u is None:
    print('NONE')
else:
    print(f"{u.email}|{u.role.value}")
