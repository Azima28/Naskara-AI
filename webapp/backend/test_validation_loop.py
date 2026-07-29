"""Iterative validation & E2E test script to analyze 'data belum lengkap' edge cases."""
import sys
import json
import sqlite3
from pathlib import Path

backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.validation import run_validation, is_vague
from app.schemas import PklContext

def run_tests():
    print("==========================================================")
    print("   TEST 1: VALIDASI DATA KOSONG (EMPTY PKL CONTEXT)")
    print("==========================================================")
    empty_ctx = PklContext().model_dump(mode="json")
    val_empty = run_validation(empty_ctx)
    print(f"Skor: {val_empty.score}/{val_empty.max_score} | Ready: {val_empty.ready}")
    print("Blocking Issues Kosong:")
    for b in val_empty.blocking:
        print(f"  ❌ [{b.field}] -> {b.message}")

    print("\n==========================================================")
    print("   TEST 2: UJI JAWABAN VAGUE ('gatau', '-', 'lupa')")
    print("==========================================================")
    vague_samples = ["gatau", "ga tau", "lupa", "-", "?", "apa aja", "tidak tahu"]
    for sample in vague_samples:
        print(f"Testing value '{sample}' -> is_vague: {is_vague(sample)}")

    vague_ctx = PklContext(
        siswa={"nama": "Siswa Test", "nis": "12345", "jurusan": "gatau"},
        sekolah={"nama": "SMK Test", "kota": "Jakarta"},
        perusahaan={"nama": "PT Test", "alamat": "lupa"},
        pkl={"tanggal_mulai": "2026-01-01", "tanggal_selesai": "2026-04-01"},
        assets=[{"id": "a1", "filename": "foto1.jpg", "type": "foto"}]
    ).model_dump(mode="json")

    val_vague = run_validation(vague_ctx)
    print(f"Skor: {val_vague.score}/{val_vague.max_score} | Ready: {val_vague.ready}")
    print("Blocking (karena vague pada siswa.jurusan):")
    for b in val_vague.blocking:
        print(f"  ❌ [{b.field}] -> {b.message}")
    print("Requestions:")
    for r in val_vague.requestions:
        print(f"  ❓ [{r.field}] value='{r.current_value}' -> {r.question}")

    print("\n==========================================================")
    print("   TEST 3: AUDIT SELURUH DRAF DI DATABASE")
    print("==========================================================")
    db_path = backend_dir / "pkl_reports.db"
    if not db_path.exists():
        print(f"Database tidak ditemukan di {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, data_json, status FROM drafts ORDER BY updated_at DESC")
    rows = cursor.fetchall()

    ready_count = 0
    incomplete_count = 0

    for draft_id, title, data_raw, status in rows:
        data = json.loads(data_raw) if isinstance(data_raw, str) else data_raw
        val = run_validation(data)
        if val.ready:
            ready_count += 1
            print(f"✅ READY (100%): ID {draft_id[:8]}.. | Status: '{status}' | Title: {title}")
        else:
            incomplete_count += 1
            print(f"⚠️ INCOMPLETE ({val.percent}%): ID {draft_id[:8]}.. | Status: '{status}' | Title: {title}")
            for b in val.blocking:
                print(f"     ❌ BLOCKING: [{b.field}] -> {b.message}")

    print(f"\nTotal Drafts: {len(rows)} | Ready: {ready_count} | Incomplete: {incomplete_count}")

if __name__ == "__main__":
    run_tests()
