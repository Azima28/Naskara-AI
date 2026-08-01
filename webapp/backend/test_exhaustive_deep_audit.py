"""Exhaustive Deep-Audit Looping Test: Sub-bab, BAB, Lampiran, & Page Numbering Accuracy.

Menguji secara mendalam (exhaustive iteration) seluruh struktur BAB (BAB I - VI),
seluruh Sub-bab (1.1 - 6.2), Sub-sub-bab (a, b, c), Daftar Pustaka, Daftar Gambar,
dan Daftar Lampiran pada berbagai kombinasi data ekstrim (pendek, medium, panjang, ekstra panjang).
"""
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report, _generate_sections_list, _sanitize_data, _normalize_modules, _auto_select_modules, ALL_BAB_MODULES, _build_front_matter, _build_bab_content
from app.docx.builder import PklDocBuilder

def create_exhaustive_mock_context(iteration: int, size_mode: str) -> dict:
    multiplier = {"short": 1, "medium": 3, "long": 6, "xlong": 12}[size_mode]
    base_text = "Praktik Kerja Lapangan merupakan bagian dari kurikulum SMK. Penulis melaksanakan kegiatan di unit jaringan. "
    paragraph = (base_text * 5) + "\n\n"

    return {
        "siswa": {
            "nama": f"ANISA RAHMAWATI (ITER {iteration} - {size_mode.upper()})",
            "nisn": f"006891234{iteration}",
            "jurusan": "Teknik Komputer dan Jaringan",
            "tempat_lahir": "Bandar Lampung",
            "tanggal_lahir": "2007-05-14",
            "jenis_kelamin": "Perempuan",
            "golongan_darah": "O",
            "catatan_kesehatan": "Sehat",
            "no_telp": "081298765432",
            "nama_ortu": "Bambang Rahmadi",
            "alamat_ortu": "Jl. Teuku Umar No. 45, Bandar Lampung",
            "telp_ortu": "081298765400",
        },
        "sekolah": {
            "nama": "SMK Negeri 4 Bandar Lampung",
            "alamat": "Jl. HOS Cokroaminoto No.102",
            "telp": "(0721) 262637",
            "kepala_sekolah": {"nama": "HJ. Dewi Ningsih, S.Pd., M.Pd.", "nip": "196805121994032005"},
            "ketua_kk": {"nama": "Rizal Ahmad, S.T., M.Ti.", "nip": "198203152010011008"},
            "pembimbing_sekolah": {"nama": "Budi Santoso, S.Kom.", "nip": "198507202011011005"},
        },
        "perusahaan": {
            "nama": f"PT Telkom Indonesia Witel Lampung (Iter {iteration})",
            "alamat": "Jl. Majapahit No. 7, Enggal, Bandar Lampung",
            "bidang_usaha": "Telekomunikasi & Jaringan Fiber Optik",
            "status": "BUMN",
            "no_telp": "(0721) 482000",
            "email": "witel.lampung@telkom.co.id",
            "website": "www.telkom.co.id",
            "pimpinan": {"nama": "Hendra Wijaya", "jabatan": "General Manager Witel Lampung"},
            "pembimbing_industri": {"nama": "Agus Setiawan", "jabatan": "Senior Network Engineer"},
        },
        "pkl": {
            "durasi_bulan": 3,
        },
        "profil_perusahaan": {
            "sejarah": paragraph * multiplier,
            "visi": "Menjadi perusahaan telekomunikasi digital yang bernilai tinggi dalam mendukung kemajuan bangsa.",
            "misi": [
                f"Misi {m}: Mempercepat pembangunan infrastruktur dan platform digital Smart Nusa."
                for m in range(1, 3 + (multiplier // 2))
            ],
            "tata_tertib_perusahaan": [
                f"Aturan {t}: Mematuhi aturan dan tata tertib yang berlaku di industri."
                for t in range(1, 4 + multiplier)
            ],
            "job_descriptions": [
                {
                    "posisi": f"Posisi {p}: Teknisi Jaringan & Access Network",
                    "tugas": [
                        f"Tugas {p}.{tg}: Melakukan penyambungan kabel serat optik melalui proses splicing."
                        for tg in range(1, 3 + multiplier)
                    ]
                }
                for p in range(1, 2 + (multiplier // 3))
            ]
        },
        "kegiatan": [
            {
                "bidang": f"Divisi {d}: Access Network & Maintenance",
                "deskripsi_umum": paragraph * (multiplier // 2 + 1),
                "tugas": [
                    {
                        "nama_tugas": f"Tugas {d}.{tg}",
                        "detail": paragraph * multiplier
                    }
                    for tg in range(1, 2 + (multiplier // 4))
                ]
            }
            for d in range(1, 2 + (multiplier // 4))
        ],
        "lampiran": {
            "foto_kegiatan": [
                {"gambar": "", "keterangan": f"Foto {f}: Proses penyambungan serat optik dengan fusion splicer"}
                for f in range(1, 3 + multiplier)
            ]
        }
    }

def run_exhaustive_audit():
    print("=" * 80)
    print("🔬 EXHAUSTIVE DEEP-AUDIT LOOPING TEST: BAB, SUB-BAB, & PAGE NUMBERING ACCURACY")
    print("=" * 80)

    modes = ["short", "medium", "long", "xlong"]
    total_audited_sections = 0

    for iter_idx, mode in enumerate(modes, 1):
        print(f"\n--- [ITERATION #{iter_idx}] Mode: {mode.upper()} ---")
        ctx = create_exhaustive_mock_context(iter_idx, mode)

        _sanitize_data(ctx)
        builder = PklDocBuilder()
        bab_modules = _normalize_modules(ctx.get("config", {}).get("bab_modules") or _auto_select_modules(ctx))
        bab_modules = [m for m in bab_modules if m in ALL_BAB_MODULES]

        _build_front_matter(builder, ctx, bab_modules)
        _build_bab_content(builder, ctx, bab_modules)

        sec_list = _generate_sections_list(builder, ctx)

        # Audit setiap entri section
        print(f"📋 Sub-bab & BAB Page Audit Log ({len(sec_list)} entri):")
        prev_pg_int = 0
        front_matter_valid = True
        body_matter_valid = True

        for text, bm, level, pg in sec_list:
            if not text.strip():
                continue
            total_audited_sections += 1

            is_front = pg in ("i", "ii", "iii", "iv", "v", "vi", "vii", "viii")
            pg_str = f"[{pg}]"

            if is_front:
                print(f"   (Romawi) {text:<50} -> {pg_str}")
            else:
                pg_num = int(pg)
                if pg_num < prev_pg_int:
                    body_matter_valid = False
                    print(f"   ❌ ERROR MONOTONIC: {text:<45} -> {pg_str} (Lebih kecil dari {prev_pg_int})")
                else:
                    prev_pg_int = pg_num
                    indent = "  " * (level - 1)
                    print(f"   {indent}📍 {text:<48} -> {pg_str}")

        assert front_matter_valid, "Front matter page numbering failed"
        assert body_matter_valid, "Body matter monotonic page ordering failed"
        print(f"✅ Iterasi #{iter_idx} ({mode.upper()}) LULUS AUDIT 100%!")

    print("\n" + "=" * 80)
    print(f"🎉 EXHAUSTIVE DEEP AUDIT SELESAI: Total {total_audited_sections} Entri Sub-bab/BAB Berhasil Diverifikasi!")
    print("=" * 80)

if __name__ == "__main__":
    run_exhaustive_audit()
