import sys
from pathlib import Path
import asyncio

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal, init_db
from app.models import User
from app.security import hash_password

def create_user():
    init_db()
    email = "admin@pkl.com"
    password = "password123"
    
    with SessionLocal() as session:
        from sqlalchemy import select
        user = session.execute(select(User).where(User.email == email)).scalars().first()
        
        if not user:
            new_user = User(email=email, name="Admin PKL", password_hash=hash_password(password))
            session.add(new_user)
            session.commit()
            print(f"User created: {email} / {password}")
        else:
            print(f"User already exists: {email} / {password}")

if __name__ == "__main__":
    create_user()

