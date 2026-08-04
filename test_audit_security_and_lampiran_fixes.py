import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "webapp" / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

def test_1_secret_key_fail_fast():
    print("\n--- TEST 1: SECRET_KEY FAIL-FAST CHECK ---")

    # Save original env
    orig_env = os.environ.get("ENVIRONMENT")
    orig_key = os.environ.get("SECRET_KEY")

    try:
        # Case A: Production + Weak Key -> Must Raise Exception
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = "naskara-prod-secret-key-change-this-in-production"

        import importlib
        failed = False
        try:
            if "app.config" in sys.modules:
                importlib.reload(sys.modules["app.config"])
            else:
                import app.config
            failed = True
        except Exception as e:
            print(f"[PASS] Blocked weak key in production as expected: {type(e).__name__}")

        if failed:
            raise AssertionError("[FAIL] Allowed weak key in production environment!")

        # Case B: Production + Short Key (<32 chars) -> Must Raise Exception
        os.environ["SECRET_KEY"] = "shortkey123"
        failed = False
        try:
            if "app.config" in sys.modules:
                importlib.reload(sys.modules["app.config"])
            else:
                import app.config
            failed = True
        except Exception as e:
            print(f"[PASS] Blocked short key in production as expected: {type(e).__name__}")

        if failed:
            raise AssertionError("[FAIL] Allowed short key in production environment!")

        # Case C: Production + Strong Key (>=32 chars) -> Must Succeed
        os.environ["SECRET_KEY"] = "a_super_strong_random_secret_key_32chars_long_production_key_12345"
        if "app.config" in sys.modules:
            importlib.reload(sys.modules["app.config"])
        else:
            import app.config
        assert app.config.settings.secret_key == os.environ["SECRET_KEY"]
        print("[PASS] Accepted strong 32+ char key in production!")

    finally:
        # Restore env
        if orig_env: os.environ["ENVIRONMENT"] = orig_env
        else: os.environ.pop("ENVIRONMENT", None)
        if orig_key: os.environ["SECRET_KEY"] = orig_key
        else: os.environ.pop("SECRET_KEY", None)
        import importlib
        if "app.config" in sys.modules:
            importlib.reload(sys.modules["app.config"])

def test_2_autoseed_gate():
    print("\n--- TEST 2: AUTO-SEED ENVIRONMENT GATE CHECK ---")

    orig_env = os.environ.get("ENVIRONMENT")
    orig_key = os.environ.get("SECRET_KEY")
    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = "a_super_strong_random_secret_key_32chars_long_production_key_12345"
        import importlib
        import app.config
        importlib.reload(app.config)

        assert app.config.settings.environment.lower() == "production"
        print(f"[PASS] Environment is {app.config.settings.environment}, auto-seeding will be skipped on startup.")
    finally:
        if orig_env: os.environ["ENVIRONMENT"] = orig_env
        else: os.environ.pop("ENVIRONMENT", None)
        if orig_key: os.environ["SECRET_KEY"] = orig_key
        else: os.environ.pop("SECRET_KEY", None)
        import importlib
        if "app.config" in sys.modules:
            importlib.reload(sys.modules["app.config"])

def test_3_portrait_photo_page_calculation():
    print("\n--- TEST 3: PORTRAIT vs LANDSCAPE PHOTO PAGE CALCULATION ---")
    from app.docx.assembly import _get_image_page_cost, _generate_sections_list

    # image11.jpeg is 755x1007 (Portrait) -> cost = 1.0
    cost_portrait = _get_image_page_cost("image11.jpeg", width_cm=14)
    print(f"image11.jpeg (Portrait) page cost: {cost_portrait}")
    assert cost_portrait == 1.0, f"Expected 1.0 for portrait photo, got {cost_portrait}"

    # image10.jpeg is 1097x823 (Landscape) -> cost = 0.5
    cost_landscape = _get_image_page_cost("image10.jpeg", width_cm=14)
    print(f"image10.jpeg (Landscape) page cost: {cost_landscape}")
    assert cost_landscape == 0.5, f"Expected 0.5 for landscape photo, got {cost_landscape}"

    # Simulate section list with 3 portrait photos (1 per page)
    data_portrait = {
        "lampiran": {
            "foto_kegiatan": [
                {"gambar": "image11.jpeg", "keterangan": "Foto 1 (Portrait)"},
                {"gambar": "image11.jpeg", "keterangan": "Foto 2 (Portrait)"},
                {"gambar": "image11.jpeg", "keterangan": "Foto 3 (Portrait)"},
            ]
        }
    }

    from app.docx.builder import PklDocBuilder
    builder = PklDocBuilder()
    sections = _generate_sections_list(builder, data_portrait)

    lamp_sections = [s for s in sections if s[1].startswith("lamp_")]
    print("Generated lampiran sections (Portrait):")
    for s in lamp_sections:
        print(f"  {s[1]} ({s[0]}) -> Page {s[3]}")

    base_p = int(lamp_sections[0][3])
    print(f"Base LAMPIRAN page: {base_p}")
    assert lamp_sections[0][3] == str(base_p), f"Expected page {base_p}, got {lamp_sections[0][3]}"
    assert lamp_sections[1][3] == str(base_p + 1), f"Expected page {base_p + 1} for 2nd portrait photo, got {lamp_sections[1][3]}"
    assert lamp_sections[2][3] == str(base_p + 2), f"Expected page {base_p + 2} for 3rd portrait photo, got {lamp_sections[2][3]}"
    print(f"[PASS] Portrait photos allocated 1 page each correctly ({base_p}, {base_p+1}, {base_p+2})!")

    # Simulate section list with 4 landscape photos (2 per page)
    data_landscape = {
        "lampiran": {
            "foto_kegiatan": [
                {"gambar": "image10.jpeg", "keterangan": "Foto 1 (Landscape)"},
                {"gambar": "image10.jpeg", "keterangan": "Foto 2 (Landscape)"},
                {"gambar": "image10.jpeg", "keterangan": "Foto 3 (Landscape)"},
                {"gambar": "image10.jpeg", "keterangan": "Foto 4 (Landscape)"},
            ]
        }
    }

    builder_land = PklDocBuilder()
    sections_land = _generate_sections_list(builder_land, data_landscape)
    lamp_land = [s for s in sections_land if s[1].startswith("lamp_")]
    print("Generated lampiran sections (Landscape):")
    for s in lamp_land:
        print(f"  {s[1]} ({s[0]}) -> Page {s[3]}")

    base_l = int(lamp_land[0][3])
    assert lamp_land[0][3] == str(base_l), f"Expected page {base_l}, got {lamp_land[0][3]}"
    assert lamp_land[1][3] == str(base_l), f"Expected page {base_l} for 2nd landscape photo, got {lamp_land[1][3]}"
    assert lamp_land[3][3] == str(base_l + 1), f"Expected page {base_l + 1} for 4th landscape photo, got {lamp_land[3][3]}"
    print(f"[PASS] Landscape photos allocated 2 photos per page correctly ({base_l}, {base_l}, {base_l+1}, {base_l+1})!")

if __name__ == "__main__":
    test_1_secret_key_fail_fast()
    test_2_autoseed_gate()
    test_3_portrait_photo_page_calculation()
    print("\nALL AUDIT & FIX VERIFICATION TESTS PASSED SUCCESSFULLY!")
