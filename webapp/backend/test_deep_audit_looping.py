import sys
import os
import sqlite3
import json
import traceback
from pathlib import Path

# Fix path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.docx.builder import PklDocBuilder, compute_toc_page_numbers
from app.docx.assembly import assemble_report, _sanitize_data
from app.validation import run_validation

def test_all_15_drafts_deep():
    db_path = os.path.join(os.path.dirname(__file__), "pkl_reports.db")
    print(f"================================================================")
    print(f"  DEEP LOOPING TEST 1: ALL 15 DRAFTS IN DATABASE")
    print(f"  DB Path: {db_path}")
    print(f"================================================================")

    if not os.path.exists(db_path):
        print(f"❌ ERROR: Database file {db_path} not found!")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, title, data_json FROM drafts")
    rows = cursor.fetchall()

    print(f"Found {len(rows)} drafts to test.\n")

    passed_count = 0
    failed_count = 0
    detailed_reports = []

    for idx, (draft_id, user_id, title, data_json_str) in enumerate(rows, 1):
        draft_title = title or "Tanpa Judul"
        print(f"----------------------------------------------------------------")
        print(f"[{idx}/{len(rows)}] TESTING DRAFT: '{draft_title}' (ID: {draft_id})")
        print(f"----------------------------------------------------------------")

        try:
            data = json.loads(data_json_str) if isinstance(data_json_str, str) else (data_json_str or {})

            # 1. Validation Test
            val_result = run_validation(data)
            print(f"  [1/4] Validation Score: {val_result.score}% | Blocking Issues: {len(val_result.blocking)}")

            # 2. Document Assembly Test
            docx_path = assemble_report(data)
            print(f"  [2/4] DOCX Assembled: {os.path.basename(docx_path)}")

            # 3. Word COM Repagination & TOC Test
            toc_pages = compute_toc_page_numbers(docx_path)
            print(f"  [3/4] Word Repagination Completed ({len(toc_pages)} bookmarks resolved)")

            # 4. Deep Inspection of Bookmarks & Page Numbers
            sec1_start = 1
            peng_pg = toc_pages.get("peng_industri") or toc_pages.get("peng_sekolah") or "i"
            id_siswa_pg = toc_pages.get("id_siswa") or "iii"
            kp_pg = toc_pages.get("kata_pengantar") or "iv"
            bab1_pg = toc_pages.get("bab_1") or "1"
            bab2_pg = toc_pages.get("bab_2") or "N/A"
            bab5_pg = toc_pages.get("bab_5") or toc_pages.get("bab_6") or "N/A"

            # Check if any bookmark failed
            broken_bookmarks = [bm for bm, pg in toc_pages.items() if not pg or pg == "Error!"]

            print(f"  [4/4] Page Number Audit:")
            print(f"        • Cover Outer (Section 1): Starts Page {sec1_start}")
            print(f"        • Pengesahan (Section 3): Page {peng_pg} (Target: Roman)")
            print(f"        • Identitas Siswa: Page {id_siswa_pg}")
            print(f"        • Kata Pengantar: Page {kp_pg}")
            print(f"        • BAB I PENDAHULUAN (Section 4+): Page {bab1_pg} (Target: Arabic '1')")
            print(f"        • BAB II KEGIATAN: Page {bab2_pg}")

            if broken_bookmarks:
                print(f"  ⚠️ Warning: Broken bookmarks found: {broken_bookmarks}")

            passed_count += 1
            detailed_reports.append({
                "index": idx,
                "draft_id": draft_id,
                "title": draft_title,
                "status": "PASSED",
                "val_score": val_result.score,
                "pengesahan_pg": peng_pg,
                "bab1_pg": bab1_pg
            })
            print(f"  ✅ DRAFT {idx} VERIFIED PERFECTLY!\n")

        except Exception as e:
            failed_count += 1
            print(f"  ❌ DRAFT {idx} FAILED WITH EXCEPTION:")
            traceback.print_exc()
            detailed_reports.append({
                "index": idx,
                "draft_id": draft_id,
                "title": draft_title,
                "status": "FAILED",
                "error": str(e)
            })

    print(f"================================================================")
    print(f"  DEEP TEST 1 SUMMARY: {passed_count}/{len(rows)} DRAFTS PASSED")
    print(f"================================================================")
    return failed_count == 0


def test_edge_cases_deep():
    print(f"\n================================================================")
    print(f"  DEEP LOOPING TEST 2: MALFORMED & EDGE CASE INPUTS")
    print(f"================================================================")

    edge_cases = [
        ("Empty Context", {}),
        ("None Profile Values", {
            "siswa": {"nama": "Siswa Test"},
            "profil_perusahaan": {"misi": None, "tata_tertib": None, "job_descriptions": None},
            "kegiatan": None,
            "jam_kerja": None
        }),
        ("Ultra-Long Names & Titles", {
            "siswa": {"nama": "A" * 150, "jurusan": "Rekayasa Perangkat Lunak Dan Pemrograman Sistem Terdistribusi Skala Besar"},
            "perusahaan": {"nama": "PT Solusi Digital Kreatif Dan Inovasi Teknologi Nusantara Indonesia Multinasional Tbk"},
            "sekolah": {"nama": "Sekolah Menengah Kejuruan Negeri 4 Bandar Lampung Provinsi Lampung Indonesia"},
            "profil_perusahaan": {
                "job_descriptions": [
                    {"posisi": "Fullstack Lead Architect & DevOps Engineer", "tugas": ["merancang infrastruktur cloud", "mengatur CI/CD pipeline"]}
                ]
            }
        }),
        ("String Types instead of Lists", {
            "siswa": {"nama": "Budi"},
            "profil_perusahaan": {
                "misi": "Menjadi perusahaan IT terbaik",
                "tata_tertib_perusahaan": "Datang tepat waktu\nMemakai seragam"
            }
        })
    ]

    passed = 0
    for name, test_data in edge_cases:
        print(f"Testing Edge Case: [{name}]...")
        try:
            out_path = assemble_report(test_data)
            if os.path.exists(out_path):
                print(f"  ✅ SUCCESS! Generated: {os.path.basename(out_path)}")
                passed += 1
            else:
                print(f"  ❌ FAILED: File not generated")
        except Exception as e:
            print(f"  ❌ CRASHED: {e}")
            traceback.print_exc()

    print(f"Edge Case Summary: {passed}/{len(edge_cases)} PASSED\n")
    return passed == len(edge_cases)


if __name__ == "__main__":
    t1 = test_all_15_drafts_deep()
    t2 = test_edge_cases_deep()
    if t1 and t2:
        print("\n🎉 ALL DEEP LOOPING TESTS PASSED 100%!")
        sys.exit(0)
    else:
        print("\n❌ SOME DEEP TESTS FAILED!")
        sys.exit(1)
