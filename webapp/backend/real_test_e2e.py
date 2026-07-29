"""Real end-to-end AI test — simulasi alur web tanpa server.

Memanggil prompt_* → provider.generate → validate_ai_output → truncate_to_limit
untuk berbagai kualitas data (bagus / sedang / kurang), lalu mencatat:
  - apakah AI keluar konteks (grounding warning terdeteksi)
  - apakah validasi lolos / gagal / perlu retry
  - apa fallback yang terjadi (truncate, retry, 422, default)
  - struktur BAB/sub-bab tetap terkunci (cek dokumen akhir)

Jalankan:  PYTHONIOENCODING=utf-8 python -X utf8 real_test_e2e.py
Butuh provider AI lokal hidup (config.settings: localhost:20128/v1, model opencode).
"""
from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.ai.client import get_ai_provider
from app.prompts.base import SYSTEM_PROMPT_TEMPLATE
from app.prompts import sections, ai_sections
from app.prompts.jurusan_knowledge import get_jurusan_context
from app.prompts.validator import validate_ai_output, truncate_to_limit
from app.docx.assembly import assemble_report
from docx import Document

RESULTS: list[dict] = []


# --------------------------------------------------------------------------- #
#  Skenario data                                                                #
# --------------------------------------------------------------------------- #
BASE = {
    "sekolah": {"nama": "SMK Negeri 4 Bandar Lampung", "kota": "Bandar Lampung",
                "website": "https://smkn4-bdl.sch.id", "kepala_sekolah": {"nama": "Dewi"}},
    "pkl": {"tanggal_mulai": "2026-01-01", "tanggal_selesai": "2026-04-01", "durasi_bulan": 3},
    "config": {"preset": "pedoman"},
}

SCENARIOS = {
    "bagus_tkj": {
        **BASE,
        "siswa": {"nama": "Bagus Siswa", "nis": "1001", "jurusan": "TKJ", "jurusan_key": "tkj"},
        "perusahaan": {"nama": "PT Jaya Network", "bidang_usaha": "Layanan Jaringan",
                       "alamat": "Jl. Telekomunikasi No. 1, Bandar Lampung", "website": "https://jayanetwork.co.id"},
        "profil_perusahaan": {"sejarah": "PT Jaya Network berdiri tahun 2010, fokus layanan jaringan komputer.",
                              "visi": "Menjadi penyedia jaringan terpercaya", "misi": ["Melayani klien dengan andal"]},
        "kegiatan": [{"bidang": "IT Support", "deskripsi_umum": "Menangani konfigurasi dan perawatan jaringan",
                      "tugas": [{"nama_tugas": "Konfigurasi DHCP", "detail": "Mengatur alokasi IP otomatis pada Mikrotik"},
                                {"nama_tugas": "Setup VLAN", "detail": "Membagi segmen jaringan kantor"}]}],
        "kendala": [{"masalah": "Koneksi sering putus di ruang server", "solusi": "Mengganti kabel dan konfigurasi ulang"}],
        "pelajaran": ["Manajemen bandwidth", "Troubleshooting jaringan"],
        "refleksi": "Banyak pengalaman baru tentang jaringan nyata.",
        "peralatan": [{"nama": "Mikrotik RB941", "deskripsi": "Router untuk manajemen jaringan"}],
    },
    "sedang_bdp": {
        **BASE,
        "siswa": {"nama": "Sedang Siswa", "nis": "1002", "jurusan": "BDP", "jurusan_key": "bdp"},
        "perusahaan": {"nama": "Marketly Digital", "bidang_usaha": "Pemasaran Digital"},
        "kegiatan": [{"bidang": "Marketing", "deskripsi_umum": "Membuat konten promosi",
                      "tugas": [{"nama_tugas": "Bikin konten IG", "detail": "Desain dan caption"}]}],
        "pelajaran": ["Mengelola campaign"],
    },
    "kurang_akl": {
        **BASE,
        "siswa": {"nama": "Kurang Siswa", "nis": "1003", "jurusan": "Akuntansi", "jurusan_key": "akl"},
        "perusahaan": {"nama": "PT Reksa Finance"},
        # banyak field kosong / minimal — menguji fallback
    },
}

# section_key yang diuji per skenario + builder prompt-nya (sama seperti ai.py)
def _build_prompts(ctx: dict) -> dict[str, str]:
    jurusan_key = ctx["siswa"].get("jurusan_key", "")
    jctx = get_jurusan_context(jurusan_key)
    return {
        "latar_belakang": sections.prompt_latar_belakang(ctx, jctx),
        "tujuan_pkl": ai_sections.prompt_tujuan_pkl(ctx),
        "pembahasan": ai_sections.prompt_hal_diperhatikan(ctx),
        "kesimpulan_saran": ai_sections.prompt_kesimpulan_saran(ctx, bab_num=6),
    }


async def gen_and_validate(provider, key, prompt, ctx) -> dict:
    """Sama dengan alur ai.py draft_section: generate → validate → truncate,
    dengan 1 retry (prompt lebih ketat) jika validasi gagal. Tunggu AI selesai."""
    last_errors = []
    for attempt in range(2):
        p = prompt
        if attempt == 1:
            p = ("[PERCOBAAN KEDUA — OUTPUT SEBELUMNYA DITOLAK]\n"
                 "Ikuti aturan keras: output HANYA paragraf narasi Bahasa Indonesia formal.\n\n") + prompt
        t0 = time.time()
        draft = await provider.generate(SYSTEM_PROMPT_TEMPLATE, p)
        dt = time.time() - t0
        draft = draft.strip()
        res = validate_ai_output(draft, key, ctx)
        truncated = truncate_to_limit(draft, key)
        fallback = []
        if truncated != draft:
            fallback.append("TRUNCATED (dipotong ke word limit)")
        if res.passed:
            return {"passed": True, "attempt": attempt + 1, "dt": round(dt, 1),
                    "warnings": res.warnings, "fallback": fallback,
                    "preview": draft[:120].replace("\n", " "),
                    "grounding_warn": any("asing" in w or "halusinasi" in w or "tidak disebut" in w for w in res.warnings)}
        last_errors = res.errors
        fallback.append(f"RETRY (attempt {attempt+1} gagal: {res.errors})")
    # Dua-duanya gagal → 422 di web, fallback minta user generate ulang
    return {"passed": False, "attempt": 2, "dt": round(dt, 1),
            "errors": last_errors, "fallback": ["422 — user diminta generate ulang"],
            "preview": draft[:120].replace("\n", " ")}


async def run_scenario(name: str, ctx: dict) -> None:
    print(f"\n{'='*70}\nSKENARIO: {name}  (jurusan={ctx['siswa'].get('jurusan')}, perusahaan={ctx['perusahaan'].get('nama')})")
    provider = get_ai_provider()
    prompts = _build_prompts(ctx)
    rows = {}
    for key, prompt in prompts.items():
        print(f"  -> {key} ... ", end="", flush=True)
        try:
            r = await gen_and_validate(provider, key, prompt, ctx)
        except Exception as e:
            r = {"passed": False, "error": str(e), "fallback": ["PROVIDER ERROR → DummyProvider/fallback"]}
        rows[key] = r
        flag = "OK " if r.get("passed") else "GAGAL"
        gw = " [GROUND-WARN]" if r.get("grounding_warn") else ""
        fb = " | fallback: " + "; ".join(r.get("fallback", [])) if r.get("fallback") else ""
        print(f"{flag}{gw}{fb}  ({r.get('dt','?')}s, attempt {r.get('attempt','-')})")
    RESULTS.append({"scenario": name, "rows": rows})

    # Simpan generated_sections dari yang passed, lalu generate docx untuk cek struktur BAB
    gen_sections = {k: v["preview"] for k, v in rows.items() if v.get("passed")}
    ctx2 = json.loads(json.dumps(ctx))
    ctx2.setdefault("generated_sections", {})
    # pakai hasil AI (preview dipotong — hanya untuk smoke struktur, bukan konten final)
    for k, v in rows.items():
        if v.get("passed"):
            ctx2["generated_sections"][k if k != "pembahasan" else "pembahasan"] = v["preview"]
    ctx2["config"]["bab_modules"] = ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA",
                                     "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"]
    try:
        path = assemble_report(ctx2)
        d = Document(path)
        text = "\n".join(p.text.strip() for p in d.paragraphs if p.text.strip())
        import re as _re
        bab_v = [l for l in text.split("\n") if _re.match(r"^5\.\d", l)]
        bab_heads = [l for l in text.split("\n") if _re.match(r"^BAB\s+[IVX]+", l)]
        print(f"  STRUKTUR: {len(bab_heads)} BAB | BAB V sub-bab={bab_v} | Hambatan={'Hambatan' in text} Pemecahan={'Pemecahan' in text}")
        RESULTS[-1]["struktur"] = {"bab_count": len(bab_heads), "bab_v_subs": bab_v,
                                   "hambatan_present": "Hambatan" in text}
    except Exception as e:
        print(f"  STRUKTUR GAGAL: {e}")
        RESULTS[-1]["struktur_error"] = str(e)


async def main():
    print("REAL E2E TEST — provider:", type(get_ai_provider()).__name__)
    for name, ctx in SCENARIOS.items():
        await run_scenario(name, ctx)

    print("\n" + "="*70 + "\nRINGKASAN")
    for r in RESULTS:
        print(f"\n[{r['scenario']}]")
        for key, row in r.get("rows", {}).items():
            gw = " GROUND-WARN" if row.get("grounding_warn") else ""
            print(f"   {key:18} passed={row.get('passed')}{gw} fallback={row.get('fallback', [])}")
        if "struktur" in r:
            s = r["struktur"]
            print(f"   STRUKTUR: {s['bab_count']} BAB, BAB V subs={s['bab_v_subs']}, hambatan={s['hambatan_present']}")

    # Simpan hasil mentah untuk inspeksi
    out = Path(__file__).parent / "real_test_e2e_result.json"
    out.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nHasil mentah disimpan ke: {out}")


if __name__ == "__main__":
    asyncio.run(main())
