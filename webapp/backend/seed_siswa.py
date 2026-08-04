"""Seed script: Bikin akun admin & siswa dengan draft simulasi 100% LENGKAP tanpa ada field kosong."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import init_db, session_scope
from app.models import User, Draft
from app.security import hash_password
from data_full_complete import DATA_FULL

ACCOUNTS = [
    ("admin@pkl.com", "password123", "Admin PKL", "admin"),
    ("admin@smkn4.sch.id", "admin123", "Administrator SMKN 4", "admin"),
    ("siswa@smk.com", "password123", "Rizky Pratama", "siswa"),
    ("siswa@smk.id", "password123", "Siswa Demo", "siswa"),
]

def seed():
    init_db()
    with session_scope() as db:
        for email, password, name, role in ACCOUNTS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=name,
                    password_hash=hash_password(password),
                    role=role,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"[Seed] Created user: {email} ({role})")
            else:
                if user.role != role:
                    user.role = role
                    print(f"[Seed] Updated user role for {email} to {role}")
                print(f"[Seed] Existing user found: {email}")

            draft = db.query(Draft).filter(Draft.user_id == user.id).first()
            if not draft:
                draft = Draft(
                    user_id=user.id,
                    title=f"Laporan PKL - {name} (Full Simulation 100% Complete)",
                    status="ready",
                    data_json=DATA_FULL,
                )
                db.add(draft)
                print(f"[Seed] Created full draft for {email}")

if __name__ == "__main__":
    seed()
