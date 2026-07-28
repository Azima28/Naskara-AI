"""Seed script: Bikin user siswa@smk.com & draft simulasi FULL RPL terisi lengkap."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import init_db, session_scope
from app.models import User, Draft
from app.security import hash_password
from real_test_full_rpl import DATA_FULL

def seed():
    init_db()
    with session_scope() as db:
        user = db.query(User).filter(User.email == "siswa@smk.com").first()
        if not user:
            user = User(
                email="siswa@smk.com",
                name="Rizky Pratama",
                password_hash=hash_password("password123"),
            )
            db.add(user)
            db.flush()
            print("[Seed] Created user: siswa@smk.com / password123")
        else:
            print("[Seed] User siswa@smk.com already exists.")

        # Buat atau update draft FULL simulasi
        draft = db.query(Draft).filter(Draft.user_id == user.id).first()
        if not draft:
            draft = Draft(
                user_id=user.id,
                title="Laporan PKL - Rizky Pratama (Full RPL Simulation)",
                status="ready",
                data_json=DATA_FULL,
            )
            db.add(draft)
            print("[Seed] Created draft for siswa@smk.com")
        else:
            draft.title = "Laporan PKL - Rizky Pratama (Full RPL Simulation)"
            draft.data_json = DATA_FULL
            draft.status = "ready"
            print("[Seed] Updated existing draft for siswa@smk.com")

if __name__ == "__main__":
    seed()
