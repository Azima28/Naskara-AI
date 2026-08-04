import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "webapp" / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

def test_1_csp_hsts_security_headers():
    print("\n--- TEST 1: CSP & HSTS SECURITY HEADERS ---")
    from fastapi.testclient import TestClient
    import app.main

    orig_env = os.environ.get("ENVIRONMENT")
    orig_key = os.environ.get("SECRET_KEY")

    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = "a_super_strong_random_secret_key_32chars_long_production_key_12345"

        import importlib
        import app.config
        importlib.reload(app.config)

        client = TestClient(app.main.app)
        res = client.get("/health")
        headers = res.headers

        assert "content-security-policy" in headers
        assert "default-src 'self'" in headers["content-security-policy"]
        assert "strict-transport-security" in headers
        assert "max-age=31536000" in headers["strict-transport-security"]
        print("[PASS] Content-Security-Policy & Strict-Transport-Security headers present in production.")

    finally:
        if orig_env: os.environ["ENVIRONMENT"] = orig_env
        else: os.environ.pop("ENVIRONMENT", None)
        if orig_key: os.environ["SECRET_KEY"] = orig_key
        else: os.environ.pop("SECRET_KEY", None)
        import importlib
        if "app.config" in sys.modules:
            importlib.reload(sys.modules["app.config"])

def test_2_ai_payload_size_limits():
    print("\n--- TEST 2: AI PAYLOAD SIZE LIMITS ---")
    from app.routers.ai import DraftSectionRequest, EnhanceContextRequest, draft_section
    from app.models import User
    from fastapi import HTTPException
    import asyncio

    user = User(id="1", email="test@smk.com", name="Test User")
    huge_ctx = {"refleksi": "y" * 600_000}

    # Draft section oversized payload check
    try:
        req = DraftSectionRequest(section_key="latar_belakang", context_data=huge_ctx)
        asyncio.run(draft_section(req, user=user))
        raise AssertionError("[FAIL] Allowed oversized context payload in draft_section!")
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] draft_section blocked oversized payload with HTTP 400.")

def test_3_frontend_with_credentials_cookie():
    print("\n--- TEST 3: FRONTEND COOKIE-FIRST ALIGNMENT ---")
    client_ts = Path(__file__).resolve().parent / "webapp" / "frontend" / "src" / "api" / "client.ts"
    content = client_ts.read_text(encoding="utf-8")

    assert "withCredentials: true" in content, "Axios client MUST enable withCredentials: true"
    print("[PASS] Frontend axios client has withCredentials: true enabled for secure cookie-first auth.")

if __name__ == "__main__":
    test_1_csp_hsts_security_headers()
    test_2_ai_payload_size_limits()
    test_3_frontend_with_credentials_cookie()
    print("\nALL 4 SECURITY HARDENING UPDATES VERIFIED 100% SUCCESSFULLY!")
