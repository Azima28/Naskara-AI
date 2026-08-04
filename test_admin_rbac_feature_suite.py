import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "webapp" / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

def run_e2e_admin_rbac_tests():
    print("=========================================================")
    print("   NASKARA-AI: E2E ADMIN ROLE & RBAC SUITE VERIFICATION  ")
    print("=========================================================")

    # Set up test environment
    os.environ["ENVIRONMENT"] = "development"
    os.environ["SECRET_KEY"] = "a_super_strong_random_secret_key_32chars_long_production_key_12345"

    import importlib
    import app.config
    importlib.reload(app.config)

    from app.db import init_db, SessionLocal
    from app.models import User, Draft, AuditLog, SystemConfig
    from seed_siswa import seed

    print("\n--- TEST 1: DATABASE AUTO-MIGRATION & SEEDING ---")
    init_db()
    seed()

    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@pkl.com").first()
        siswa_user = db.query(User).filter(User.email == "siswa@smk.com").first()

        assert admin_user is not None, "Admin user must exist"
        assert admin_user.role == "admin", f"Admin user role must be 'admin', got '{admin_user.role}'"
        assert siswa_user is not None, "Siswa user must exist"
        assert siswa_user.role == "siswa", f"Siswa user role must be 'siswa', got '{siswa_user.role}'"

        print("[PASS] SQLite table auto-migration & admin/siswa user seeding verified 100%.")

    finally:
        db.close()

    print("\n--- TEST 2: RBAC SECURITY & 403 FORBIDDEN ENFORCEMENT ---")
    from fastapi.testclient import TestClient
    import app.main

    client = TestClient(app.main.app)

    # 1. Login as Siswa
    res_siswa_login = client.post("/auth/login", json={"email": "siswa@smk.com", "password": "password123"})
    assert res_siswa_login.status_code == 200, f"Siswa login failed: {res_siswa_login.text}"
    siswa_token = res_siswa_login.json()["access_token"]

    # Attempt to access admin endpoints with Siswa token -> MUST RETURN 403
    res_stats_blocked = client.get("/admin/stats", headers={"Authorization": f"Bearer {siswa_token}"})
    assert res_stats_blocked.status_code == 403, f"Expected 403 for Siswa accessing /admin/stats, got {res_stats_blocked.status_code}"

    res_users_blocked = client.get("/admin/users", headers={"Authorization": f"Bearer {siswa_token}"})
    assert res_users_blocked.status_code == 403, f"Expected 403 for Siswa accessing /admin/users, got {res_users_blocked.status_code}"

    print("[PASS] Siswa role access to /admin/* endpoints correctly rejected with HTTP 403 Forbidden.")

    print("\n--- TEST 3: ADMIN DASHBOARD STATS & USER MANAGEMENT ---")
    # 2. Login as Admin
    res_admin_login = client.post("/auth/login", json={"email": "admin@pkl.com", "password": "password123"})
    assert res_admin_login.status_code == 200, f"Admin login failed: {res_admin_login.text}"
    admin_token = res_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch Admin Stats
    res_stats = client.get("/admin/stats", headers=admin_headers)
    assert res_stats.status_code == 200, f"Failed to get admin stats: {res_stats.text}"
    stats_data = res_stats.json()
    assert "users" in stats_data and "drafts" in stats_data and "storage" in stats_data
    print("[PASS] Admin stats endpoint returned full metrics.")

    # Create new user by Admin
    test_guru_email = "test_guru_e2e@smkn4.sch.id"
    res_create_guru = client.post(
        "/admin/users",
        json={"email": test_guru_email, "name": "Guru E2E Test", "password": "password123", "role": "guru"},
        headers=admin_headers
    )
    assert res_create_guru.status_code == 201, f"Failed to create user: {res_create_guru.text}"
    guru_id = res_create_guru.json()["user_id"]
    print(f"[PASS] Admin created new user {test_guru_email} with role 'guru'.")

    # Update role for new user
    res_update_role = client.put(
        f"/admin/users/{guru_id}/role",
        json={"role": "siswa"},
        headers=admin_headers
    )
    assert res_update_role.status_code == 200
    print("[PASS] Admin updated user role.")

    # Self-demotion protection check
    admin_id = res_admin_login.json()["user"]["id"]
    res_self_demote = client.put(
        f"/admin/users/{admin_id}/role",
        json={"role": "siswa"},
        headers=admin_headers
    )
    assert res_self_demote.status_code == 400, "Self-demotion must be blocked with HTTP 400"
    print("[PASS] Self-demotion protection correctly blocked admin demotion.")

    # Toggle user active status (Ban user)
    res_ban = client.put(
        f"/admin/users/{guru_id}/status",
        json={"is_active": False},
        headers=admin_headers
    )
    assert res_ban.status_code == 200

    # Banned user login check
    res_banned_login = client.post("/auth/login", json={"email": test_guru_email, "password": "password123"})
    assert res_banned_login.status_code == 403, "Banned user login must return HTTP 403"
    print("[PASS] Banned user login attempt blocked with HTTP 403.")

    # Unban and Delete user
    client.put(f"/admin/users/{guru_id}/status", json={"is_active": True}, headers=admin_headers)
    res_del = client.delete(f"/admin/users/{guru_id}", headers=admin_headers)
    assert res_del.status_code == 200
    print("[PASS] Admin user deletion verified.")

    # Self-deletion protection check
    res_self_del = client.delete(f"/admin/users/{admin_id}", headers=admin_headers)
    assert res_self_del.status_code == 400, "Self-deletion must be blocked with HTTP 400"
    print("[PASS] Self-deletion protection correctly blocked admin self-delete.")

    print("\n--- TEST 4: DRAFT MODERATION & ASSET AUDIT ---")
    res_drafts = client.get("/admin/drafts", headers=admin_headers)
    assert res_drafts.status_code == 200
    assert "items" in res_drafts.json()
    print(f"[PASS] Admin drafts moderation listed {res_drafts.json()['total']} drafts.")

    res_assets = client.get("/admin/assets", headers=admin_headers)
    assert res_assets.status_code == 200
    assert "total_files" in res_assets.json()
    print("[PASS] Asset audit endpoint verified.")

    res_cleanup = client.post("/admin/assets/cleanup", headers=admin_headers)
    assert res_cleanup.status_code == 200
    print("[PASS] Orphaned asset cleanup endpoint verified.")

    print("\n--- TEST 5: SYSTEM SETTINGS & AUDIT LOGS ---")
    # Update system settings
    settings_payload = {
        "school_name": "SMK NEGERI 4 BANDAR LAMPUNG",
        "npsn": "10807066",
        "alamat": "Jl. Hos Cokroaminoto No. 102, Enggal, Bandar Lampung",
        "kepala_sekolah": "Dr. H. Alex Kuchel, M.Pd.",
        "nip_kepala_sekolah": "19720315 199802 1 002",
        "waka_humas": "Drs. Budi Santoso, M.T.",
        "nip_waka_humas": "19680512 199403 1 005",
        "pejabat_jurusan": {"rpl": {"nama": "Ketua RPL", "nip": "12345"}},
        "ai_model_default": "deepseek-opencode",
        "ai_max_tokens_per_req": 2048
    }
    res_save_cfg = client.put("/admin/settings", json=settings_payload, headers=admin_headers)
    assert res_save_cfg.status_code == 200

    res_get_cfg = client.get("/admin/settings", headers=admin_headers)
    assert res_get_cfg.status_code == 200
    assert res_get_cfg.json()["data"]["school_name"] == "SMK NEGERI 4 BANDAR LAMPUNG"
    print("[PASS] System settings update and retrieval verified.")

    # Audit logs list
    res_logs = client.get("/admin/logs", headers=admin_headers)
    assert res_logs.status_code == 200
    assert res_logs.json()["total"] > 0
    print(f"[PASS] Audit logs recorded {res_logs.json()['total']} admin actions.")

    # System Health detail
    res_health_detail = client.get("/admin/health-detail", headers=admin_headers)
    assert res_health_detail.status_code == 200
    assert "disk" in res_health_detail.json()
    print("[PASS] System health detail diagnostics verified.")

    print("\n=========================================================")
    print(" ALL ADMIN ROLE & RBAC SUITE TESTS VERIFIED 100% SUCCESS! ")
    print("=========================================================")

if __name__ == "__main__":
    run_e2e_admin_rbac_tests()
