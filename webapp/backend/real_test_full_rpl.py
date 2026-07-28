"""Real E2E test — SKENARIO FULL (data terisi lengkap), SMKN4, jurusan RPL.

Simulasi alur web PERSIS seperti user asli (bukan Niken):
  1. Draft sections (latar_belakang, tujuan_pkl, narasi_struktur, landasan_teori,
     pembahasan, kesimpulan_saran)  — sama seperti ai.py draft_section.
  2. Auto-polish (visi_misi, tata_tertib, job_descriptions, kegiatan, peralatan)
     — sama seperti generate.py _auto_polish_on_generate.
  3. Daftar pustaka (AI → fallback deterministik).
  4. assemble_report → .docx, lalu laporkan FULL PATH hasilnya.

Jalankan:  PYTHONIOENCODING=utf-8 python -X utf8 real_test_full_rpl.py
Butuh provider AI lokal hidup (config.settings).
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
from app.docx.assembly import assemble_report, default_daftar_pustaka
from app.routers.generate import (
    _auto_polish_on_generate,
    _ai_daftar_pustaka,
)
from docx import Document

# --------------------------------------------------------------------------- #
#  DATA FULL — semua field diisi (kualitas "sedang": kalimatnya masih kasar,    #
#  supaya auto-polish benar-benar ada kerja). Nama & perusahaan baru (RPL).    #
# --------------------------------------------------------------------------- #
DATA_FULL: dict = {
    "sekolah": {
        "nama": "SMK Negeri 4 Bandar Lampung",
        "kota": "Bandar Lampung",
        "alamat": "Jl. P. Antasari No. 51, Bandar Lampung",
        "telp": "(0721) 123456",
        "website": "https://smkn4-bdl.sch.id",
        "kepala_sekolah": {"nama": "Dewi Anggraini, M.Pd.", "nip": "19750312 200312 2 004"},
        "ketua_kk": {"nama": "Rudi Hartono, S.Kom.", "nip": "19850514 201001 1 009"},
        "pembimbing_sekolah": {"nama": "Siti Rahma, S.Pd.", "nip": "19820101 200701 2 011"},
    },
    "siswa": {
        "nama": "Rizky Pratama",
        "nis": "10245",
        "nisn": "0067234512",
        "jurusan": "Rekayasa Perangkat Lunak",
        "jurusan_key": "rpl",
        "jenis_kelamin": "L",
        "tempat_lahir": "Bandar Lampung",
        "tanggal_lahir": "15 Mei 2008",
        "golongan_darah": "O",
        "catatan_kesehatan": "-",
        "no_telp": "0812-3456-7890",
        "nama_ortu": "Budi Santoso",
        "alamat_ortu": "Jl. Kenanga No. 8, Bandar Lampung",
        "telp_ortu": "0813-9876-5432",
    },
    "perusahaan": {
        "nama": "PT Solusi Digital Kreatif",
        "nama_lengkap": "PT Solusi Digital Kreatif Indonesia",
        "nama_cover": "PT SOLUSI DIGITAL KREATIF",
        "bidang_usaha": "Pengembangan Perangkat Lunak dan Layanan IT",
        "alamat": "Jl. Diponegoro No. 112, Bandar Lampung",
        "kota": "Bandar Lampung",
        "status": "Swasta",
        "no_telp": "(0721) 765432",
        "fax": "-",
        "email": "info@solusidigital.co.id",
        "website": "https://solusidigital.co.id",
        "pimpinan": {"nama": "Andi Wijaya, S.T.", "jabatan": "Direktur Utama"},
        "hrd": {"nama": "Maya Sari", "telp": "(0721) 765432 ext. 101", "email": "hrd@solusidigital.co.id"},
        "pembimbing_industri": {"nama": "Fajar Nugroho, S.Kom.", "jabatan": "Senior Developer",
                                "telp": "(0721) 765432 ext. 205", "email": "fajar@solusidigital.co.id"},
        "pembimbing_industri_2": {"nama": "Lina Kusuma, S.Kom."},
    },
    "profil_perusahaan": {
        # kalimat "sedang" — masih agak kasar, auto-polish harus merapikannya
        "sejarah": "PT Solusi Digital Kreatif didirikan pada tahun 2015 di Bandar Lampung. Awalnya perusahaan ini hanya melayani pembuatan website sederhana untuk UMKM lokal. Seiring berjalannya waktu, perusahaan berkembang menjadi penyedia solusi perangkat lunak yang melayani berbagai klien mulai dari instansi pemerintah hingga perusahaan swasta di wilayah Lampung dan sekitarnya.",
        "visi": "menjadi perusahaan pengembang software terpercaya di lampung",
        "misi": [
            "memberikan solusi software yang berkualitas",
            "melayani klien dengan profesional dan tepat waktu",
            "mengembangkan SDM yang kompeten di bidang IT",
        ],
        "profil_lokasi": "PT Solusi Digital Kreatif berlokasi di Jl. Diponegoro No. 112, Bandar Lampung, yang mudah dijangkau dari pusat kota.",
        "tata_tertib": [
            "datang tepat waktu sesuai jam kerja pukul 08.00 WIB",
            "pake seragam sesuai hari yang ditentukan",
            "dilarang main hp saat jam kerja",
            "minta izin dulu kalau mau keluar ruangan",
        ],
        "tata_tertib_perusahaan": [
            "datang tepat waktu sesuai jam kerja pukul 08.00 WIB",
            "pake seragam sesuai hari yang ditentukan",
            "dilarang main hp saat jam kerja",
            "minta izin dulu kalau mau keluar ruangan",
        ],
        "jam_kerja": [
            {"hari": "SENIN", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "SELASA", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "RABU", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "KAMIS", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "JUMAT", "jam": "08.00 - 11.30\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "11.30 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        ],
        "job_descriptions": [
            {"posisi": "Backend Developer",
             "tugas": ["membangun dan memelihara API", "mengelola database",
                       "memastikan keamanan sistem"]},
            {"posisi": "Frontend Developer",
             "tugas": ["membuat tampilan website", "memastikan website responsif"]},
            {"posisi": "QA Tester",
             "tugas": ["melakukan pengujian aplikasi", "mencatat bug dan melaporkannya"]},
        ],
    },
    "pkl": {
        "tanggal_mulai": "2026-01-05",
        "tanggal_selesai": "2026-04-05",
        "durasi_bulan": 3,
        "bagian_ditempatkan": "Backend Development",
    },
    "jam_kerja": [
        {"hari": "SENIN", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "SELASA", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "RABU", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "KAMIS", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "JUMAT", "jam": "08.00 - 11.30\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "11.30 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
    ],
    "kegiatan": [
        {"bidang": "Backend Development",
         "deskripsi_umum": "membangun dan memelihara sistem backend aplikasi",
         "tugas": [
             {"nama_tugas": "Membuat REST API", "detail": "bikin endpoint API untuk aplikasi kasir pakai express js"},
             {"nama_tugas": "Desain Database", "detail": "merancang struktur tabel mysql sesuai kebutuhan aplikasi"},
             {"nama_tugas": "Fixing Bug", "detail": "memperbaiki bug yang dilaporkan tim QA"},
         ]},
        {"bidang": "Dokumentasi Sistem",
         "deskripsi_umum": "menulis dokumentasi teknis aplikasi",
         "tugas": [
             {"nama_tugas": "Menulis Dokumentasi API", "detail": "mendokumentasikan endpoint yang sudah dibuat"},
         ]},
    ],
    "peralatan": [
        {"nama": "Komputer PC", "deskripsi": "perangkat utama untuk ngoding dan menjalankan aplikasi"},
        {"nama": "VS Code", "deskripsi": "text editor yang dipakai untuk menulis kode program"},
        {"nama": "XAMPP", "deskripsi": "untuk menjalankan server mysql dan apache di lokal"},
        {"nama": "Postman", "deskripsi": "dipakai untuk mengetes endpoint API"},
    ],
    "kendala": [
        {"masalah": "Susah mengatur relasi tabel yang kompleks di database",
         "solusi": "Bertanya ke pembimbing dan membaca dokumentasi mysql"},
    ],
    "pelajaran": [
        "Membangun REST API dengan Express.js",
        "Merancang database MySQL yang efisien",
        "Bekerja dalam tim pengembang software",
    ],
    "refleksi": "Selama PKL saya belajar banyak tentang backend development yang sebenarnya. Ternyata ngoding di dunia kerja jauh berbeda dengan tugas di sekolah karena harus mengikuti standar tim.",
    "kesimpulan_user": "Berdasarkan hasil Praktik Kerja Lapangan yang dilaksanakan di PT Solusi Digital Kreatif, Penulis dapat menyimpulkan bahwa pengembangan backend menggunakan Express.js dan MySQL membutuhkan pemahaman yang baik tentang arsitektur REST API dan desain database terstruktur.",
    "saran_user": "Disarankan agar pihak sekolah meningkatkan porsi praktik ngoding di laboratorium, dan pihak industri memberikan dokumentasi API yang lebih detail kepada siswa PKL baru.",
    "config": {
        "preset": "pedoman",
        "bab_modules": ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA",
                        "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"],
        "auto_daftar_pustaka": True,
    },
    "generated_sections": {},
    "kata_pengantar": {},
}

RESULTS: dict = {"sections": {}, "polish": {}, "warnings": []}


async def _gen_section(provider, key, prompt, ctx):
    """Alur ai.py draft_section: generate → validate → truncate, 1 retry.

    Provider error (timeout/500/provider mati) ditangkap seperti ai.py →
    return "" (web: 503 ke user; dokumen memakai fallback deterministik)."""
    for attempt in range(2):
        p = prompt
        if attempt == 1:
            p = ("[PERCOBAAN KEDUA — OUTPUT SEBELUMNYA DITOLAK]\n"
                 "Ikuti aturan keras: output HANYA narasi Bahasa Indonesia formal.\n\n") + prompt
        t0 = time.time()
        try:
            draft = (await provider.generate(SYSTEM_PROMPT_TEMPLATE, p)).strip()
        except Exception as e:
            dt = time.time() - t0
            RESULTS["sections"][key] = {"passed": False, "dt": round(dt, 1),
                                        "provider_error": str(e)}
            print(f"    [PROVIDER-ERROR] {key}: {e}  (web → 503; doc pakai fallback)")
            return ""
        dt = time.time() - t0
        res = validate_ai_output(draft, key, ctx)
        if res.passed:
            draft = truncate_to_limit(draft, key)
            RESULTS["sections"][key] = {
                "passed": True, "attempt": attempt + 1, "dt": round(dt, 1),
                "warnings": res.warnings, "kata": len(draft.split()),
            }
            print(f"    [OK] {key} ({dt:.1f}s, attempt {attempt+1}, {len(draft.split())} kata)")
            return draft
        RESULTS["warnings"].append(f"{key} attempt {attempt+1}: {res.errors}")
        print(f"    [RETRY] {key} attempt {attempt+1} gagal: {res.errors}")
    RESULTS["sections"][key] = {"passed": False, "dt": round(dt, 1)}
    print(f"    [GAGAL] {key} — pakai fallback deterministik")
    return ""


async def main():
    print("=" * 72)
    print("REAL E2E TEST — SKENARIO FULL (data lengkap), SMKN4, jurusan RPL")
    print("provider:", type(get_ai_provider()).__name__)
    print("=" * 72)

    provider = get_ai_provider()
    ctx = json.loads(json.dumps(DATA_FULL))  # deep copy

    # ── 1. Draft sections (persis ai.py) ───────────────────────────────────
    print("\n[1] Generate draft sections ...")
    jctx = get_jurusan_context(ctx["siswa"].get("jurusan_key", ""))
    gen = ctx.setdefault("generated_sections", {})

    gen["latar_belakang"] = await _gen_section(
        provider, "latar_belakang", sections.prompt_latar_belakang(ctx, jctx), ctx)
    gen["tujuan_pkl"] = await _gen_section(
        provider, "tujuan_pkl", ai_sections.prompt_tujuan_pkl(ctx), ctx)
    gen["narasi_struktur"] = await _gen_section(
        provider, "narasi_struktur", ai_sections.prompt_narasi_struktur(ctx), ctx)
    gen["landasan_teori"] = await _gen_section(
        provider, "landasan_teori", ai_sections.prompt_landasan_teori_paraphrase(), ctx)
    gen["pembahasan"] = await _gen_section(
        provider, "pembahasan", ai_sections.prompt_hal_diperhatikan(ctx), ctx)
    gen["kesimpulan_saran"] = await _gen_section(
        provider, "kesimpulan_saran", ai_sections.prompt_kesimpulan_saran(ctx, bab_num=6), ctx)

    # ── 2. Auto-polish (persis generate.py) ────────────────────────────────
    print("\n[2] Auto-polish (visi/misi, tata tertib, job desc, kegiatan, peralatan) ...")
    t0 = time.time()
    ctx, polished = await _auto_polish_on_generate(ctx)
    polish_failed = ctx.pop("_polish_failed", [])
    RESULTS["polish"] = {"changed": polished, "failed": polish_failed,
                         "dt": round(time.time() - t0, 1)}
    print(f"    changed={polished}  failed={polish_failed}  ({time.time()-t0:.1f}s)")

    # ── 3. Daftar pustaka ──────────────────────────────────────────────────
    print("\n[3] Daftar pustaka ...")
    refs = await _ai_daftar_pustaka(ctx)
    ctx["daftar_pustaka"] = refs or default_daftar_pustaka(ctx)
    print(f"    {len(ctx['daftar_pustaka'])} sitasi ({'AI' if refs else 'deterministik'})")

    # ── 4. Assemble .docx ──────────────────────────────────────────────────
    print("\n[4] Assemble .docx ...")
    output_path = assemble_report(ctx)
    RESULTS["output_path"] = output_path
    print(f"\n>>> FULL PATH: {output_path}")

    # ── Verifikasi struktur ────────────────────────────────────────────────
    d = Document(output_path)
    text = "\n".join(p.text.strip() for p in d.paragraphs if p.text.strip())
    import re as _re
    bab_heads = [l for l in text.split("\n") if _re.match(r"^BAB\s+[IVX]+", l)]
    bab_v = [l for l in text.split("\n") if _re.match(r"^5\.\d", l)]
    print(f"\nSTRUKTUR: {len(bab_heads)} BAB | BAB V sub={bab_v} | "
          f"Hambatan={'Hambatan' in text} | Pemecahan={'Pemecahan' in text}")
    RESULTS["struktur"] = {"bab_count": len(bab_heads), "bab_v_subs": bab_v,
                           "hambatan": "Hambatan" in text, "pemecahan": "Pemecahan" in text}

    out_json = Path(__file__).parent / "real_test_full_rpl_result.json"
    out_json.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nHasil JSON: {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
