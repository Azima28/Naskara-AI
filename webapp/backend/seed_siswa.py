"""Seed script: Bikin user siswa@smk.com & siswa@smk.id (Siswa Demo) dengan draft simulasi 100% LENGKAP tanpa ada field kosong."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import init_db, session_scope
from app.models import User, Draft
from app.security import hash_password
from data_full_complete import DATA_FULL

def seed():
    init_db()
    with session_scope() as db:
        # 1. User siswa@smk.com
        user1 = db.query(User).filter(User.email == "siswa@smk.com").first()
        if not user1:
            user1 = User(
                email="siswa@smk.com",
                name="Rizky Pratama",
                password_hash=hash_password("password123"),
            )
            db.add(user1)
            db.flush()
            print("[Seed] Created user: siswa@smk.com / password123")

        draft1 = db.query(Draft).filter(Draft.user_id == user1.id).first()
        if not draft1:
            draft1 = Draft(
                user_id=user1.id,
                title="Laporan PKL - Rizky Pratama (Full RPL Simulation 100% Complete)",
                status="ready",
                data_json=DATA_FULL,
            )
            db.add(draft1)
        else:
            draft1.title = "Laporan PKL - Rizky Pratama (Full RPL Simulation 100% Complete)"
            draft1.data_json = DATA_FULL
            draft1.status = "ready"
        print("[Seed] Updated draft for siswa@smk.com")

        # 2. User siswa@smk.id (Siswa Demo)
        user2 = db.query(User).filter(User.email == "siswa@smk.id").first()
        if user2:
            for d in user2.drafts:
                d.data_json = DATA_FULL
                d.status = "ready"
            print(f"[Seed] Updated all {len(user2.drafts)} drafts for Siswa Demo (siswa@smk.id)")

if __name__ == "__main__":
    seed()
