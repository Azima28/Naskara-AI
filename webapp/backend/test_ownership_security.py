"""Regression test: Verifikasi perlindungan resource ownership (BOLA / IDOR defense).

Memastikan:
- User B TIDAK BISA membaca draf milik User A (GET /drafts/{id} -> 404)
- User B TIDAK BISA mengubah draf milik User A (PUT /drafts/{id} -> 404)
- User B TIDAK BISA menghapus draf milik User A (DELETE /drafts/{id} -> 404)
- User B TIDAK BISA meng-generate docx draf milik User A (POST /generate/{id} -> 404)
"""
import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.db import Base, engine, SessionLocal
from app.models import User, Draft
from app.security import hash_password, create_access_token


def run_security_test():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create User A & User B
        email_a = f"user_a_{uuid.uuid4().hex[:6]}@smkn4.test"
        email_b = f"user_b_{uuid.uuid4().hex[:6]}@smkn4.test"

        user_a = User(email=email_a, name="User A", password_hash=hash_password("password123"))
        user_b = User(email=email_b, name="User B", password_hash=hash_password("password123"))

        db.add_all([user_a, user_b])
        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)

        # Generate tokens
        token_a = create_access_token(subject=user_a.id, extra={"email": user_a.email})
        token_b = create_access_token(subject=user_b.id, extra={"email": user_b.email})

        # Create Draft belonging to User A
        draft_a = Draft(user_id=user_a.id, title="Laporan User A", data_json={"siswa": {"nama": "User A"}})
        db.add(draft_a)
        db.commit()
        db.refresh(draft_a)

        draft_id = draft_a.id
        print(f"✅ Created Draft '{draft_id}' owned by User A ('{user_a.id}')")

        client = TestClient(app)
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 1. Test GET /drafts/{id} by User B
        res = client.get(f"/drafts/{draft_id}", headers=headers_b)
        assert res.status_code == 404, f"Expected 404 on GET, got {res.status_code}"
        print("✅ PASS: GET /drafts/{id} by unauthorized User B returned 404 Not Found")

        # 2. Test PUT /drafts/{id} by User B
        res = client.put(f"/drafts/{draft_id}", json={"title": "Hacked Title"}, headers=headers_b)
        assert res.status_code == 404, f"Expected 404 on PUT, got {res.status_code}"
        print("✅ PASS: PUT /drafts/{id} by unauthorized User B returned 404 Not Found")

        # 3. Test POST /generate/{id} by User B
        res = client.post(f"/generate/{draft_id}", headers=headers_b)
        assert res.status_code == 404, f"Expected 404 on POST /generate, got {res.status_code}"
        print("✅ PASS: POST /generate/{id} by unauthorized User B returned 404 Not Found")

        # 4. Test DELETE /drafts/{id} by User B
        res = client.delete(f"/drafts/{draft_id}", headers=headers_b)
        assert res.status_code == 404, f"Expected 404 on DELETE, got {res.status_code}"
        print("✅ PASS: DELETE /drafts/{id} by unauthorized User B returned 404 Not Found")

        print("\n🎉 ALL RESOURCE OWNERSHIP & AUTHORIZATION SECURITY TESTS PASSED!")

    finally:
        db.close()


if __name__ == "__main__":
    run_security_test()
