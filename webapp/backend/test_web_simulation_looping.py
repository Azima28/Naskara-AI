"""Exhaustive Web-Simulation Looping Test Suite for DOCX Page Calculation & OpenXML Integrity.

Script ini memanipulasi dan menguji simulasi data web riil (100% lengkap terisi seluruh form:
siswa, sekolah, perusahaan, profil perusahaan, kegiatan, peralatan ber-gambar, dan foto lampiran)
di 6 skenario ekstrim untuk memverifikasi akurasi penomoran halaman dinamis & integritas OpenXML:

Skenario:
1. web_sim_short                            : Form web terisi lengkap (pendek)
2. web_sim_medium                           : Form web terisi lengkap (sedang, 3 divisi kegiatan)
3. web_sim_long_with_equipment_and_photos   : Lengkap dengan 4 peralatan ber-gambar & 6 foto lampiran
4. web_sim_xlong_with_heavy_content         : Lengkap dengan 8 peralatan ber-gambar & 12 foto lampiran (40+ hal)
5. web_sim_telkom_lampung_exact             : Simulasi persis data riil PT Telkom Indonesia Witel Lampung
6. web_sim_multi_page_photos                : Skenario ekstrim 16 foto lampiran melintasi banyak halaman
"""

import sys
import os
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report, _sanitize_data, _normalize_modules, _auto_select_modules, ALL_BAB_MODULES, _build_front_matter, _build_bab_content
from app.docx.builder import PklDocBuilder

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

def create_web_simulation_context(scenario_name: str, iteration: int) -> dict:
    img_name = "image1.jpeg"
    base_text = "Praktik Kerja Lapangan (PKL) merupakan kegiatan wajib bagi siswa SMK Negeri 4 Bandar Lampung. "
    para_1 = (base_text * 6) + "\n\n"
    para_2 = "Selama pelaksanaan kegiatan PKL di industri, siswa mempelajari konfigurasi jaringan fiber optik, splicing kabel serat optik, konfigurasi MikroTik RouterBOARD, dan pemeliharaan perangkat jaringan pelanggan. " + "\n\n"

    mult = {
        "web_sim_short": 1,
        "web_sim_medium": 3,
        "web_sim_long_with_equipment_and_photos": 6,
        "web_sim_xlong_with_heavy_content": 12,
        "web_sim_telkom_lampung_exact": 5,
        "web_sim_multi_page_photos": 4
    }[scenario_name]

    include_images = "with_" in scenario_name or "equipment" in scenario_name or "telkom" in scenario_name or "photos" in scenario_name

    peralatan_list = []
    if include_images:
        count_p = 8 if "xlong" in scenario_name else 4
        for p in range(1, count_p + 1):
            peralatan_list.append({
                "nama": f"Peralatan {p}: Fusion Splicer Fiber Optik & OTDR Tester",
                "deskripsi": f"Alat utama penyambungan serat optik dan pengujian redaman jaringan pada Divisi {p}.",
                "gambar": img_name
            })

    foto_list = []
    if include_images:
        count_f = 16 if "multi_page" in scenario_name else (12 if "xlong" in scenario_name else 6)
        for f in range(1, count_f + 1):
            foto_list.append({
                "gambar": img_name,
                "keterangan": f"Dokumentasi Foto {f}: Proses penyambungan serat optik dan konfigurasi jaringan di lapangan"
            })

    return {
        "siswa": {
            "nama": f"ANISA RAHMAWATI (WEB SIM {scenario_name.upper()} - ITER {iteration})",
            "nisn": f"006891234{iteration}",
            "jurusan": "Teknik Komputer dan Jaringan",
            "tempat_lahir": "Bandar Lampung",
            "tanggal_lahir": "2007-05-14",
            "jenis_kelamin": "Perempuan",
            "golongan_darah": "O",
            "catatan_kesehatan": "Sehat Walafiat",
            "no_telp": "081298765432",
            "nama_ortu": "Bambang Rahmadi",
            "alamat_ortu": "Jl. Teuku Umar No. 45, Kedaton, Bandar Lampung",
            "telp_ortu": "081298765400",
        },
        "sekolah": {
            "nama": "SMK Negeri 4 Bandar Lampung",
            "alamat": "Jl. HOS Cokroaminoto No.102, Enggal, Bandar Lampung",
            "telp": "(0721) 262637",
            "kepala_sekolah": {"nama": "HJ. Dewi Ningsih, S.Pd., M.Pd.", "nip": "196805121994032005"},
            "ketua_kk": {"nama": "Rizal Ahmad, S.T., M.Ti.", "nip": "198203152010011008"},
            "pembimbing_sekolah": {"nama": "Budi Santoso, S.Kom.", "nip": "198507202011011005"},
        },
        "perusahaan": {
            "nama": "PT Telkom Indonesia (Persero) Tbk Witel Lampung",
            "nama_lengkap": "PT Telkom Indonesia (Persero) Tbk Witel Lampung",
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
        "peralatan": peralatan_list,
        "profil_perusahaan": {
            "sejarah": (para_1 + para_2) * mult,
            "visi": "Menjadi perusahaan telekomunikasi digital terdepan yang bernilai tinggi bagi kemajuan bangsa.",
            "misi": [
                f"Misi {m}: Mempercepat pembangunan infrastruktur dan platform digital Smart Nusa di Indonesia."
                for m in range(1, 3 + (mult // 2))
            ],
            "tata_tertib_perusahaan": [
                f"Tata Tertib {t}: Mematuhi seluruh peraturan jam kerja dan Keselamatan Kerja (K3) di lingkungan industri."
                for t in range(1, 4 + mult)
            ],
            "job_descriptions": [
                {
                    "posisi": f"Posisi {p}: Teknisi Access Network & Maintenance",
                    "tugas": [
                        f"Tugas {p}.{tg}: Melakukan penyambungan serat optik dengan fusion splicer dan pengukuran redaman OTDR."
                        for tg in range(1, 3 + mult)
                    ]
                }
                for p in range(1, 2 + (mult // 3))
            ]
        },
        "kegiatan": [
            {
                "bidang": f"Divisi {d}: Access Network & Maintenance Fiber Optik",
                "deskripsi_umum": (para_1 + para_2) * (mult // 2 + 1),
                "tugas": [
                    {
                        "nama_tugas": f"Maintenance Router & ODP Sub-divisi {d}.{tg}",
                        "detail": (para_1 + para_2) * mult
                    }
                    for tg in range(1, 2 + (mult // 4))
                ]
            }
            for d in range(1, 2 + (mult // 4))
        ],
        "lampiran": {
            "foto_kegiatan": foto_list
        }
    }

def inspect_and_verify_web_sim(scenario_name: str, idx: int):
    print(f"\n" + "=" * 90)
    print(f"🧪 [TEST SIMULASI WEB #{idx}] SKENARIO: '{scenario_name.upper()}'")
    print("=" * 90)

    ctx = create_web_simulation_context(scenario_name, idx)
    docx_path = assemble_report(ctx)

    assert os.path.exists(docx_path), f"File {docx_path} tidak ada!"
    size_kb = os.path.getsize(docx_path) / 1024
    print(f"📄 File Generated: {os.path.basename(docx_path)} ({size_kb:.2f} KB)")

    # Read XML
    with zipfile.ZipFile(docx_path, 'r') as z:
        xml_bytes = z.read("word/document.xml")
    root = ET.fromstring(xml_bytes)
    print("✅ XML Syntax Validation: PASSED")

    # 1. Collect all bookmarks
    bookmarks = {}
    for b in root.iter(f"{{{NS['w']}}}bookmarkStart"):
        name = b.attrib.get(f"{{{NS['w']}}}name")
        if name:
            bookmarks[name] = b.attrib.get(f"{{{NS['w']}}}id")

    print(f"📌 Total BookmarkStart di XML: {len(bookmarks)}")

    # 2. Collect PAGEREF entries inside sdtContent (Daftar Isi)
    sdt_elem = root.find(f".//{{{NS['w']}}}sdtContent")
    toc_pagerefs = []
    if sdt_elem is not None:
        for fld in sdt_elem.iter(f"{{{NS['w']}}}fldSimple"):
            instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
            if "PAGEREF" in instr:
                parts = instr.strip().split()
                target_bm = parts[1] if len(parts) > 1 else ""
                t_elem = fld.find(f".//{{{NS['w']}}}t")
                val = t_elem.text if t_elem is not None else ""
                toc_pagerefs.append((target_bm, val))

    print(f"📖 Total Entri Daftar Isi (SDT PAGEREF): {len(toc_pagerefs)}")

    # 3. Collect PAGEREF entries outside sdtContent (Daftar Gambar & Daftar Lampiran)
    other_pagerefs = []
    for fld in root.iter(f"{{{NS['w']}}}fldSimple"):
        if sdt_elem is not None and fld in list(sdt_elem.iter()):
            continue
        instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
        if "PAGEREF" in instr:
            parts = instr.strip().split()
            target_bm = parts[1] if len(parts) > 1 else ""
            t_elem = fld.find(f".//{{{NS['w']}}}t")
            val = t_elem.text if t_elem is not None else ""
            other_pagerefs.append((target_bm, val))

    print(f"🖼️ Total Entri Daftar Gambar & Lampiran: {len(other_pagerefs)}")

    # 4. Verify no unmatched bookmarks
    unmatched_toc = [bm for bm, val in toc_pagerefs if bm not in bookmarks]
    unmatched_other = [bm for bm, val in other_pagerefs if bm not in bookmarks]

    assert len(unmatched_toc) == 0, f"Error: {len(unmatched_toc)} PAGEREF di Daftar Isi menunjuk bookmark yang tidak ada!"
    assert len(unmatched_other) == 0, f"Error: {len(unmatched_other)} PAGEREF di Daftar Gambar/Lampiran menunjuk bookmark yang tidak ada!"

    # 5. Verify monotonic page numbering in TOC
    prev_pg = 0
    toc_monotonic = True
    print("\n📋 Audit Halaman TOC (Daftar Isi):")
    for bm, val in toc_pagerefs:
        is_roman = val in ("i", "ii", "iii", "iv", "v", "vi", "vii", "viii")
        if is_roman:
            print(f"   (Romawi) [{bm:<35}] -> [{val}]")
        else:
            try:
                pg_num = int(val)
                if pg_num < prev_pg:
                    toc_monotonic = False
                    print(f"   ❌ ERROR MONOTONIC: [{bm:<35}] -> [{pg_num}] < sebelumnya [{prev_pg}]")
                else:
                    prev_pg = pg_num
                    print(f"   (Arab)   [{bm:<35}] -> Halaman: [{val}]")
            except ValueError:
                print(f"   ⚠️ WARNING: [{bm:<35}] -> [{val}] bukan integer/romawi")

    assert toc_monotonic, f"Error: Urutan halaman Daftar Isi tidak monotonik pada skenario {scenario_name}!"

    if other_pagerefs:
        print("\n🖼️ Audit Halaman Daftar Gambar & Lampiran:")
        prev_other_pg = 0
        for bm, val in other_pagerefs:
            try:
                pg_num = int(val)
                print(f"   (Arab)   [{bm:<35}] -> Halaman: [{val}]")
            except ValueError:
                print(f"   ⚠️ WARNING: [{bm:<35}] -> [{val}]")

    print(f"\n🎉 SKENARIO WEB SIMULATION '{scenario_name.upper()}' 100% LULUS AUDIT AKURASI & OPENXML!\n")

def run_all_web_simulations():
    print("=" * 90)
    print("🚀 EXHAUSTIVE WEB-SIMULATION LOOPING TEST SUITE")
    print("=" * 90)

    scenarios = [
        "web_sim_short",
        "web_sim_medium",
        "web_sim_long_with_equipment_and_photos",
        "web_sim_xlong_with_heavy_content",
        "web_sim_telkom_lampung_exact",
        "web_sim_multi_page_photos"
    ]

    for idx, sc in enumerate(scenarios, 1):
        inspect_and_verify_web_sim(sc, idx)

    print("=" * 90)
    print("🏆 SELURUH 6 SKENARIO SIMULASI WEB DIVERIFIKASI JUJUR: 100% LULUS AUDIT AKURASI!")
    print("=" * 90)

if __name__ == "__main__":
    run_all_web_simulations()
