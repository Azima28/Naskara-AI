"""Assembler laporan PKL — mengikuti Panduan Resmi SMKN 4 Bandar Lampung TP 2026-2027.

Fungsi utama: `assemble_report(data)` menerima PklContext dict dan menghasilkan
file .docx utuh dengan urutan:
  Cover → Cover dalam → Pengesahan → Identitas → Kata Pengantar → BAB (arabic)

Struktur BAB mengikuti Panduan Resmi SMKN 4 Bandar Lampung TP 2026-2027 (6 BAB):
  BAB I   PENDAHULUAN      (Latar Belakang, Tujuan, Sejarah Perusahaan, Visi-Misi,
                             Profil Lokasi, Tata Tertib, Struktur Organisasi, Job Desc)
  BAB II  KEGIATAN INDUSTRI (ringkasan proses kegiatan per seksi/divisi)
  BAB III TINJAUAN PUSTAKA  (Landasan Teori, Asas PKL, Sejarah SMKN 4)
  BAB IV  DATA PENGAMATAN   (detail kegiatan + Peralatan & Perlengkapan)
  BAB V   PEMBAHASAN        (Hal-hal Perlu Diperhatikan — peningkatan kompetensi)
  BAB VI  KESIMPULAN & SARAN (Kesimpulan, Saran untuk Sekolah & Industri)
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
import re
import uuid
from typing import Any

from ..config import OUTPUT_DIR, REFERENCES_DIR, UPLOADS_DIR
from .builder import PklDocBuilder

logger = logging.getLogger(__name__)

# ======================================================================== #
#  Constants                                                                #
# ======================================================================== #

# Modul BAB yang dikenal (mapping key → writer function name).
# Ini urutan kanonik: BAB selalu ditulis dalam urutan ini, apa pun urutan
# yang dikirim frontend.
#
# Aturan resmi SMKN4 TP 2026-2027 (6 BAB):
#   I   PENDAHULUAN  (Latar Belakang, Tujuan, Sejarah, Struktur, Tata Tertib)
#   II  KEGIATAN_INDUSTRI
#   III TINJAUAN_PUSTAKA
#   IV  DATA_PENGAMATAN
#   V   PEMBAHASAN
#   VI  KESIMPULAN_SARAN
ALL_BAB_MODULES = [
    "PENDAHULUAN",
    "KEGIATAN_INDUSTRI",
    "TINJAUAN_PUSTAKA",
    "DATA_PENGAMATAN",
    "PEMBAHASAN",
    "KESIMPULAN_SARAN",
]

# Frontend, schemas.py, dan sample-pkl-data.json memakai nama modul lain untuk
# konsep yang sama. Tanpa pemetaan ini, `writers.get()` mengembalikan None dan
# BAB-nya hilang dari dokumen tanpa error apa pun.
MODULE_ALIASES: dict[str, str | None] = {
    # PROFIL_PERUSAHAAN tidak lagi berdiri sebagai BAB tersendiri.
    # Kontennya (Sejarah, Visi-Misi, Tata Tertib, Struktur, Job Desc)
    # sekarang menjadi sub-bab 1.3-1.5 di dalam BAB I PENDAHULUAN.
    "PROFIL_PERUSAHAAN": None,
    "PELAKSANAAN": "KEGIATAN_INDUSTRI",
    "PROSES_KEGIATAN": "KEGIATAN_INDUSTRI",
    "LANDASAN_TEORI": "TINJAUAN_PUSTAKA",
    "PENUTUP": "KESIMPULAN_SARAN",
    "KESIMPULAN": "KESIMPULAN_SARAN",
    "HAMBATAN": "PEMBAHASAN",
}

# Roman numerals for BAB numbering.
_ROMANS = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}

# Judul default tiap modul BAB: (judul pedoman, judul legacy, key judul_override).
# Aturan resmi SMKN4 TP 2026-2027 — 6 BAB, Profil Perusahaan masuk BAB I.
_BAB_TITLES = {
    "PENDAHULUAN": ("PENDAHULUAN", "PENDAHULUAN", "bab_pendahuluan"),
    "KEGIATAN_INDUSTRI": ("KEGIATAN DI INDUSTRI", "KEGIATAN INDUSTRI", "bab_kegiatan_industri"),
    "TINJAUAN_PUSTAKA": ("TINJAUAN PUSTAKA", "TINJAUAN PUSTAKA", "bab_tinjauan_pustaka"),
    "DATA_PENGAMATAN": ("DATA PENGAMATAN", "DATA PENGAMATAN", "bab_data_pengamatan"),
    "PEMBAHASAN": ("PEMBAHASAN", "PEMBAHASAN", "bab_pembahasan"),
    "KESIMPULAN_SARAN": ("KESIMPULAN DAN SARAN", "KESIMPULAN DAN SARAN", "bab_kesimpulan_saran"),
}


def _bab_title(module: str, data: dict) -> str:
    """Judul BAB efektif: judul_override > default sesuai preset."""
    pedoman_title, legacy_title, override_key = _BAB_TITLES.get(
        module, (module.replace("_", " "), module.replace("_", " "), "")
    )
    override = data.get("judul_override", {}).get(override_key)
    if override:
        return override
    preset = (data.get("config", {}) or {}).get("preset") or "pedoman"
    return pedoman_title if preset == "pedoman" else legacy_title

# Huruf untuk enumerasi a. b. c. ...
_LETTERS = "abcdefghijklmnopqrstuvwxyz"

# Tujuan PKL baku (dipakai kalau `data["tujuan_pkl"]` kosong).
DEFAULT_TUJUAN_PKL = [
    "Membekali siswa dengan pengalaman yang sebenarnya dalam dunia kerja sebagai "
    "persiapan guna menyesuaikan diri dengan dunia kerja dan masyarakat.",
    "Meningkatkan, memperluas, dan memantapkan keterampilan siswa-siswi yang "
    "diperoleh dari latihan praktek di sekolah.",
    "Menumbuh kembangkan sikap profesionalisme yang diperlukan siswa-siswi "
    "untuk memenuhi lapangan kerja yang sesuai dengan bidangnya.",
    "Memantapkan disiplin dan tanggung jawab siswa dalam melaksanakan tugasnya.",
    "Memberikan kesempatan kepada siswa-siswi untuk mengenal suasana/iklim "
    "lingkungan kerja yang sebenarnya.",
    "Mendorong siswa-siswi untuk berjiwa wiraswasta dan mandiri.",
    "Meningkatkan, memperluas, dan memantapkan proses penyerapan teknologi baru "
    "dari lapangan kerja ke sekolah.",
    "Mampu memahami, memantapkan, dan mengembangkan pelajaran yang diperoleh di "
    "sekolah dan penerapannya di dunia kerja.",
    "Memperoleh masukan & umpan balik dari dunia kerja untuk memperbaiki dan "
    "memantapkan Pendidikan Kejuruan.",
]

# Dasar hukum pelaksanaan PKL (fallback BAB Tinjauan Pustaka).
DEFAULT_ASAS_PKL = [
    "Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.",
    "Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan.",
    "Peraturan Menteri Pendidikan dan Kebudayaan Nomor 50 Tahun 2020 tentang "
    "Praktik Kerja Lapangan bagi Peserta Didik.",
]


# ======================================================================== #
#  Public API                                                               #
# ======================================================================== #

def assemble_report(data: dict) -> str:
    """Susun laporan PKL lengkap dari PklContext dict.

    Returns:
        Path absolut ke file .docx yang dihasilkan.
    """
    _sanitize_data(data)
    data["__all_gambar_list__"] = _scan_all_gambar(data)

    config = data.get("config", {})
    margin = config.get("margin", {})
    # Default pedoman resmi (1.7.2): kiri 4, kanan 3, atas 3, bawah 3.
    # Dokumen bergaya lain (mis. preset legacy Niken) mengirim margin eksplisit.
    margin_dict = {
        "atas": margin.get("atas", 3),
        "bawah": margin.get("bawah", 3),
        "kiri": margin.get("kiri", 4),
        "kanan": margin.get("kanan", 3),
    }

    heading_sizes = {
        1: config.get("h1_size") or 14,
        2: config.get("h2_size") or 12,
        3: config.get("h3_size") or 12,
    }
    preset = config.get("preset") or "pedoman"

    builder = PklDocBuilder(
        margin=margin_dict, heading_sizes=heading_sizes, preset=preset
    )

    # Modul BAB dinormalisasi di awal karena Daftar Isi (preset pedoman)
    # perlu tahu susunan BAB sebelum kontennya ditulis.
    bab_modules = _normalize_modules(
        config.get("bab_modules") or _auto_select_modules(data)
    )
    bab_modules = [m for m in bab_modules if m in ALL_BAB_MODULES]

    # --- 1. Front Matter ------------------------------------------------- #
    _build_front_matter(builder, data, bab_modules)

    # --- 2. Section break: switch ke body numbering ---------------------- #
    body_fmt = config.get("body_matter_format") or "arabic"
    body_start = config.get("body_matter_start") if config.get("body_matter_start") is not None else 1
    new_section = builder.add_section_break()
    builder.setup_page_numbering(new_section, fmt=body_fmt, start=body_start if body_start > 0 else 1)

    # --- 3. BAB content -------------------------------------------------- #
    _build_bab_content(builder, data, bab_modules)

    # --- 4. Daftar Pustaka ----------------------------------------------- #
    refs_raw = data.get("daftar_pustaka", [])
    # Auto-isi bila user tidak mengisi manual (router generate mungkin sudah
    # mengisinya lewat AI; blok ini fallback deterministik).
    if not refs_raw and config.get("auto_daftar_pustaka", True):
        refs_raw = default_daftar_pustaka(data)
    refs = []
    for r in refs_raw:
        if isinstance(r, str):
            refs.append(r)
        elif isinstance(r, dict):
            penulis = str(r.get("penulis", "") or "").strip()
            tahun = str(r.get("tahun", "") or "").strip()
            judul = str(r.get("judul", "") or "").strip()
            sumber = str(r.get("sumber", "") or "").strip()
            url = str(r.get("url", "") or "").strip()
            parts = []
            if penulis: parts.append(penulis)
            if tahun: parts.append(f"({tahun})")
            if judul: parts.append(f"\"{judul}\"")
            if sumber: parts.append(sumber)
            if url: parts.append(url)
            refs.append(". ".join(parts) + ".")
            
    if refs:
        # Pedoman 1.7.2.h: pustaka disusun menurut abjad, tanpa nomor.
        if preset == "pedoman":
            refs = sorted(refs, key=str.lower)
        builder.add_page_break()
        builder._heading("DAFTAR PUSTAKA", bookmark="daftar_pustaka")
        builder.outline.append((1, "DAFTAR PUSTAKA", "daftar_pustaka"))
        builder.add_spacing(1)
        builder.add_daftar_pustaka(refs)

    # --- 4.5 Lampiran ---------------------------------------------------- #
    # Dokumen Niken selalu punya halaman LAMPIRAN, jadi headingnya tetap
    # ditulis walau foto belum diunggah.
    # Foto lampiran diambil dari `lampiran.foto_kegiatan` (punya keterangan
    # sendiri per foto); `assets[]` dipakai sebagai cadangan untuk draft lama
    # yang belum memindahkan fotonya ke struktur baru.
    foto_kegiatan = [
        f for f in (data.get("lampiran", {}) or {}).get("foto_kegiatan", [])
        if isinstance(f, dict) and f.get("gambar")
    ]
    if not foto_kegiatan:
        foto_kegiatan = [
            {"gambar": a.get("filename"), "keterangan": a.get("caption", "")}
            for a in data.get("assets", [])
            if isinstance(a, dict) and a.get("type") == "foto" and a.get("filename")
        ]

    builder.add_page_break()
    builder._heading("LAMPIRAN", bookmark="lampiran")
    builder.outline.append((1, "LAMPIRAN", "lampiran"))
    builder.add_spacing(1)

    if foto_kegiatan:
        for idx, foto in enumerate(foto_kegiatan, 1):
            if _try_image(builder, foto["gambar"], width_cm=14):
                keterangan = (foto.get("keterangan") or "").strip() or f"Dokumentasi kegiatan {idx}"
                builder.add_caption(f"Lampiran {idx}. {keterangan.rstrip('.')}", bookmark=f"lamp_{idx}")
                builder.add_spacing(1)
    else:
        builder.add_body(
            "Dokumentasi kegiatan Praktik Kerja Lapangan terlampir pada halaman berikut."
        )

    # --- 5. Save --------------------------------------------------------- #
    siswa = data.get("siswa", {})
    nama = siswa.get("nama", "PKL").strip() or "PKL"
    safe_name = "".join(c if c.isalnum() or c in " -_" else "" for c in nama).strip()
    filename = f"Laporan-PKL-{safe_name}-{uuid.uuid4().hex[:6]}.docx"
    output_path = str(OUTPUT_DIR / filename)

    # Populate native TOC in docx dengan nomor halaman kalkulasi dinamis
    sec_list = _generate_sections_list(builder, data)
    # DAFTAR ISI hanya berisi entri utama — gambar & lampiran punya halaman sendiri
    toc_only = [s for s in sec_list if not s[1].startswith(("lamp_", "gambar_"))]
    builder.populate_native_toc(toc_only)

    # Tanam nomor halaman kalkulasi dinamis murni Python ke semua field PAGEREF
    # 100% Python Calculator — identik di Windows Laptop maupun Docker Linux
    dynamic_pages = {bm: pg for _, bm, _, pg in sec_list if bm}

    _toc_keys = ["bab_1","bab_2","bab_3","bab_4","bab_5","bab_6","daftar_pustaka","lampiran"]
    print("[TOC-CALC] Nomor halaman Python Calculator:")
    for k in _toc_keys:
        if k in dynamic_pages:
            print(f"  {k}: {dynamic_pages[k]}")

    # Simpan draft docx pertama (dengan fldSimple utuh) agar LibreOffice bisa mengekstrak halaman fisik
    builder.save(output_path)

    # Dapatkan exact_pages dari LibreOffice PDF Extractor (jika ada LibreOffice)
    final_pages = dict(dynamic_pages)
    try:
        from .builder import compute_toc_page_numbers
        exact_pages = compute_toc_page_numbers(output_path, sec_list=sec_list)
        if exact_pages:
            print(f"[TOC-SYNC] Merging {len(exact_pages)} exact LibreOffice page numbers into final TOC")
            final_pages.update(exact_pages)
    except Exception as e:
        logger.warning("[TOC-ENGINE] LibreOffice extractor failed: %s", e)

    # Tanam final_pages HANYA SATU KALI ke builder.doc
    builder.embed_toc_page_numbers(final_pages)
    builder.save(output_path)

    return output_path


def _roman_to_int(roman: str) -> int:
    rom_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
    return rom_map.get(roman.upper(), 1)


def _generate_sections_list(builder: PklDocBuilder, data: dict) -> list[tuple[str, str, int, str]]:
    """Bangun entri Daftar Isi dari heading yang BENAR-BENAR tertulis.

    Menggunakan kalkulator tata letak dinamis murni Python (tanpa butuh MS Word COM)
    sehingga nomor halaman di Daftar Isi & Daftar Lampiran 100% akurat di semua platform
    (termasuk Docker Linux) untuk data dengan panjang berapa pun.
    """
    import math

    sek_nama = (data.get("sekolah", {}).get("nama") or "SMK NEGERI 4 BANDAR LAMPUNG")
    perus_nama = (
        data.get("perusahaan", {}).get("nama_lengkap")
        or data.get("perusahaan", {}).get("nama")
        or "PERUSAHAAN"
    )

    sections: list[tuple[str, str, int, str]] = [
        ("PENGESAHAN", "peng_industri", 1, "i"),
        (f"dari {perus_nama}", "peng_industri", 2, "i"),
        ("PENGESAHAN", "peng_sekolah", 1, "ii"),
        (f"dari {sek_nama}", "peng_sekolah", 2, "ii"),
        ("IDENTITAS SISWA", "id_siswa", 1, "iii"),
        ("IDENTITAS INDUSTRI / INSTANSI", "id_industri", 1, "iv"),
        ("KATA PENGANTAR", "kata_pengantar", 1, "v"),
    ]

    # Kapasitas 1 halaman HVS / A4 (TNR 12pt, 1.5 spasi, margin 4-4-3-3cm) ≈ 35 baris
    LINES_PER_PAGE = 35.0

    # Kelompokkan estimasi tinggi/baris elemen di builder.doc per BAB
    bab_lines: dict[int | str, float] = {}
    current_bab_key: int | str | None = None  # None sebelum BAB I PENDAHULUAN

    # Lacak posisi offset baris kumulatif per bookmark heading!
    bookmark_offset_lines: dict[str, float] = {}
    bookmark_bab_key: dict[str, int | str] = {}

    def _norm(s: str) -> str:
        return re.sub(r"\s+", " ", str(s or "")).strip().upper()

    outline_map: dict[str, str] = {_norm(text): bm for _, text, bm in builder.outline}
    outline_bookmarks: set[str] = {bm for _, _, bm in builder.outline if bm}

    bab_lines: dict[int | str, float] = {}
    current_bab_key: int | str | None = None  # None sebelum BAB I PENDAHULUAN

    bookmark_offset_lines: dict[str, float] = {}
    bookmark_bab_key: dict[str, int | str] = {}

    # Kumpulkan semua elemen paragraph yang ada di dalam w:sdt (Table of Contents)
    # agar tidak ikut terhitung sebagai paragraf isi laporan.
    sdt_paras = set(
        p for sdt in builder.doc.element.body.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sdt")
        for p in sdt.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p")
    )

    for elem in builder.doc.element.body:
        if elem in sdt_paras:
            continue

        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag

        if tag == "p":
            text_raw = "".join(elem.itertext()).strip()
            if not text_raw:
                continue

            text_norm = _norm(text_raw)

            # Cari bookmark ID yang tertanam di elemen paragraph XML secara langsung
            bms_in_elem = [
                b.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}name") or b.get("name") or b.attrib.get("w:name")
                for b in elem.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bookmarkStart")
            ]
            bm_matched = None
            for b_candidate in bms_in_elem:
                if b_candidate in outline_bookmarks:
                    bm_matched = b_candidate
                    break
            if not bm_matched:
                bm_matched = outline_map.get(text_norm)

            m_bab = re.search(r"BAB\s+([IVXLCDM\d]+)", text_norm, re.IGNORECASE)
            if m_bab:
                bab_num = _roman_to_int(m_bab.group(1))
                current_bab_key = bab_num
                bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + 4.0
                bm = bm_matched or outline_map.get(text_norm)
                if bm:
                    bookmark_offset_lines[bm] = 0.0
                    bookmark_bab_key[bm] = current_bab_key
                continue
            elif "DAFTAR PUSTAKA" in text_norm:
                current_bab_key = "DAFTAR_PUSTAKA"
                bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + 3.0
                bm = bm_matched or outline_map.get(text_norm)
                if bm:
                    bookmark_offset_lines[bm] = 0.0
                    bookmark_bab_key[bm] = current_bab_key
                continue
            elif "LAMPIRAN" in text_norm and not "DAFTAR" in text_norm:
                current_bab_key = "LAMPIRAN"
                bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + 3.0
                bm = bm_matched or outline_map.get(text_norm)
                if bm:
                    bookmark_offset_lines[bm] = 0.0
                    bookmark_bab_key[bm] = current_bab_key
                continue

            if current_bab_key is not None:
                bm = bm_matched or outline_map.get(text_norm)
                if bm:
                    bookmark_offset_lines[bm] = bab_lines.get(current_bab_key, 0.0)
                    bookmark_bab_key[bm] = current_bab_key

                # Deteksi gambar (<w:drawing> / <w:pict>)
                drawings = elem.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing") + \
                           elem.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict")
                img_lines = len(drawings) * 15.0

                # Deteksi indentasi list (area teks menyempit)
                has_ind = elem.find(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ind") is not None
                chars_per_line = 60.0 if has_ind else 78.0

                lines = max(1.0, math.ceil(len(text_raw) / chars_per_line)) + img_lines
                bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + lines

                # Deteksi page break (<w:br w:type="page"/>)
                has_page_break = any(
                    b.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type") == "page"
                    or b.get("w:type") == "page"
                    for b in elem.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}br")
                )
                if has_page_break:
                    cur_l = bab_lines[current_bab_key]
                    bab_lines[current_bab_key] = math.ceil(cur_l / LINES_PER_PAGE) * LINES_PER_PAGE

        elif tag == "tbl" and current_bab_key is not None:
            # Tabel menghitung jumlah baris fisik
            rows_count = len(elem.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr"))
            bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + (rows_count * 1.3)

    # Kalkulasi nomor halaman awal tiap BAB / Section (Arab 1, 2, 3...)
    bab_start_pages: dict[int | str, int] = {}
    cur_page = 1

    # Urutan BAB kanonik (1 s/d 6)
    for b_idx in range(1, 7):
        bab_start_pages[b_idx] = cur_page
        b_lines = bab_lines.get(b_idx, 25.0)
        p_count = max(1, math.ceil(b_lines / LINES_PER_PAGE))
        print(f"[TOC-CALC] BAB {b_idx}: {b_lines:.1f} baris -> {p_count} halaman (mulai hal {cur_page})")
        cur_page += p_count

    # DAFTAR PUSTAKA
    bab_start_pages["DAFTAR_PUSTAKA"] = cur_page
    dp_lines = bab_lines.get("DAFTAR_PUSTAKA", 15.0)
    dp_pages = max(1, math.ceil(dp_lines / LINES_PER_PAGE))
    print(f"[TOC-CALC] DAFTAR_PUSTAKA: {dp_lines:.1f} baris -> {dp_pages} halaman (mulai hal {cur_page})")
    cur_page += dp_pages

    # LAMPIRAN
    bab_start_pages["LAMPIRAN"] = cur_page
    print(f"[TOC-CALC] LAMPIRAN: mulai hal {cur_page}")

    # Susun entri sections dengan nomor halaman presisi (BAB + offset sub-bab)
    front_roman_map = {
        "peng_industri": "i",
        "peng_sekolah": "ii",
        "id_siswa": "iii",
        "id_industri": "iv",
        "kata_pengantar": "v",
    }

    active_bab_num: int | str = 1
    for level, text, bookmark in builder.outline:
        if bookmark in front_roman_map:
            sections.append((text, bookmark, level, front_roman_map[bookmark]))
            continue
        elif bookmark and (bookmark.startswith("peng_") or bookmark.startswith("id_")):
            sections.append((text, bookmark, level, "i"))
            continue

        b_key = bookmark_bab_key.get(bookmark)
        if b_key is None:
            m_bab = re.search(r"BAB\s+([IVXLCDM\d]+)", text, re.IGNORECASE)
            if m_bab:
                active_bab_num = _roman_to_int(m_bab.group(1))
            elif "DAFTAR PUSTAKA" in text.upper():
                active_bab_num = "DAFTAR_PUSTAKA"
            elif "LAMPIRAN" in text.upper():
                active_bab_num = "LAMPIRAN"
            else:
                m_s = re.match(r"^(\d+)\.", text)
                if m_s:
                    active_bab_num = int(m_s.group(1))
            b_key = active_bab_num

        b_start = bab_start_pages.get(b_key, cur_page)
        off_lines = bookmark_offset_lines.get(bookmark, 0.0)
        off_pages = int(off_lines // LINES_PER_PAGE)
        pg = b_start + off_pages

        sections.append((text, bookmark, level, str(pg)))

    # Tambahkan kalkulasi halaman dinamis untuk bookmark Foto Lampiran & Gambar
    pg_lamp_base = bab_start_pages.get("LAMPIRAN", cur_page)
    foto_lampiran = [
        f for f in (data.get("lampiran", {}) or {}).get("foto_kegiatan", [])
        if isinstance(f, dict) and f.get("gambar")
    ]
    accumulated_lamp_pages = 0.0
    for i in range(1, len(foto_lampiran) + 1):
        f = foto_lampiran[i - 1]
        ket = (f.get("keterangan") or "").strip() or f"Dokumentasi kegiatan {i}"
        pg_lamp = pg_lamp_base + int(accumulated_lamp_pages)
        sections.append((ket.rstrip("."), f"lamp_{i}", 1, str(pg_lamp)))
        cost = _get_image_page_cost(f.get("gambar"), width_cm=14)
        accumulated_lamp_pages += cost

    gambar_list = data.get("__all_gambar_list__", [])
    for item in gambar_list:
        b_num = item["bab_num"]
        pg_base = bab_start_pages.get(b_num, cur_page)
        sections.append((item["text"], item["bookmark"], 1, str(pg_base)))

    return sections


# ======================================================================== #
#  Sanitization & Helpers                                                   #
# ======================================================================== #

def _clean_markdown(text: str) -> str:
    """Bersihkan sintaks markdown dari output AI."""
    return _sanitize_ai_output(text)


def _polish_task_detail(text: str) -> str:
    """Merasionalkan dan merapikan detail tugas harian siswa ke dalam kalimat akademis KBBI/EYD."""
    if not isinstance(text, str) or not text.strip():
        return ""

    t = text.strip()

    # Map istilah informal/slang ke Bahasa Indonesia akademis formal
    replacements = [
        (r'\bbikin\b', 'Membuat'),
        (r'\bpakai\b', 'menggunakan'),
        (r'\bngoding\b', 'melakukan pemrograman'),
        (r'\bngetes\b', 'melakukan pengujian'),
        (r'\bngedit\b', 'melakukan penyuntingan'),
        (r'\bbantu\b', 'membantu'),
        (r'\bfixing\b', 'memperbaiki'),
        (r'\bfix\b', 'memperbaiki'),
        (r'\bsetup\b', 'menyiapkan'),
        (r'\bhandling\b', 'penanganan'),
        (r'\bmasukkin\b', 'memasukkan'),
        (r"\bi'm\b", 'Penulis'),
    ]
    for pattern, replacement in replacements:
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)

    # Kapitalisasi huruf pertama
    if t and t[0].islower():
        t = t[0].upper() + t[1:]

    # Pastikan diakhiri titik jika merupakan kalimat utuh
    if t and not t.endswith(('.', '!', '?')):
        t += '.'

    return t


def _strip_markdown_formatting(text: str) -> str:
    """Strip bold/italic/backtick formatting symbols (*, **, `, _) from string."""
    if not isinstance(text, str) or not text:
        return text
    s = text
    s = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', s)
    s = re.sub(r'`([^`]+)`', r'\1', s)
    s = re.sub(r'_{1,3}([^_]+)_{1,3}', r'\1', s)
    return s


def _clean_all_markdown_in_obj(obj: Any) -> Any:
    """Bersihkan markdown formatting secara rekursif dari dict/list/str."""
    if isinstance(obj, str):
        return _strip_markdown_formatting(obj)
    elif isinstance(obj, dict):
        return {k: _clean_all_markdown_in_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_clean_all_markdown_in_obj(item) for item in obj]
    return obj


def _ensure_str(val: Any) -> str:
    """Konversi val (string, list of strings, dict, atau None) secara aman menjadi string tunggal ber-newline."""
    if val is None:
        return ""
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        return "\n".join(_ensure_str(item) for item in val if item is not None)
    if isinstance(val, dict):
        return "\n".join(f"{k}: {_ensure_str(v)}" for k, v in val.items())
    return str(val)


def _sanitize_ai_output(text: Any) -> str:
    """Sanitasi komprehensif output AI sebelum masuk ke dokumen.

    Menangani semua pola heading/label yang sering di-output AI:
    - **bold** dan *italic*
    - ## Markdown headers
    - Label baris: "Paragraf 1:", "A. Judul", "Kesimpulan:"
    - Baris pendek yang diakhiri titik dua (heading palsu)

    TIDAK menghapus:
    - [KESIMPULAN] dan [SARAN] tags (dibutuhkan oleh assembly parser)
    - Angka bernomor "1. 2. 3." (daftar yang valid)
    - Teks narasi normal
    """
    text_str = _ensure_str(text)
    if not text_str:
        return ""

    # 1. Hapus penanda paragraf buatan AI: **Paragraf 1** atau **Paragraf 1:**
    text_str = re.sub(r'^\s*\*\*\s*Paragraf\s*\d+\s*:?\s*\*\*\s*', '', text_str,
                  flags=re.MULTILINE | re.IGNORECASE)

    # 2. Hapus markdown headers ###
    text_str = re.sub(r'^\s*#{1,6}\s+', '', text_str, flags=re.MULTILINE)

    # 3. Ubah **bold** menjadi teks biasa (kecuali [TAG] yang sudah di strip-bold)
    text_str = re.sub(r'\*\*(.*?)\*\*', r'\1', text_str)

    # 4. Ubah *italic* menjadi teks biasa
    text_str = re.sub(r'\*(.*?)\*', r'\1', text_str)

    # 5. Hapus label huruf di awal baris: "A. Judul", "B. Judul" (jika hanya label, bukan poin daftar)
    def _strip_letter_label(m):
        content = m.group(1).strip()
        if content.endswith(':') and len(content.split()) <= 7:
            return ''
        return m.group(0)
    text_str = re.sub(r'^([A-Z])\.\s+(.+)$', _strip_letter_label, text_str, flags=re.MULTILINE)

    # 6. Hapus baris yang HANYA berisi label pendek diakhiri titik dua
    def _strip_fake_heading(line: str) -> str:
        stripped = line.strip()
        if stripped.startswith('[') and stripped.endswith(']'):
            return line  # preserve [TAG] lines
        if stripped.endswith(':') and 1 <= len(stripped.split()) <= 8:
            return ''  # hapus heading palsu
        return line
    lines = [_strip_fake_heading(l) for l in text_str.split('\n')]
    text_str = '\n'.join(lines)

    # 7. Collapse multiple blank lines menjadi satu
    text_str = re.sub(r'\n{3,}', '\n\n', text_str)

    return text_str.strip()


def _write_paragraphs(builder: PklDocBuilder, text: Any) -> None:
    """Tulis blok teks multi-baris sebagai beberapa paragraf body.

    Output AI disanitasi dulu sebelum ditulis ke dokumen.
    Baris [KESIMPULAN] dan [SARAN] dilewati karena ditangani
    oleh parser khusus di _write_kesimpulan_saran().
    """
    clean_text = _sanitize_ai_output(text)
    for para in (clean_text or "").split("\n"):
        stripped = para.strip()
        if not stripped:
            continue
        # Skip tag markers — ditangani oleh parser lain
        if stripped in ("[KESIMPULAN]", "[SARAN]"):
            continue
        builder.add_body(stripped)



def _sanitize_image_filename(filename: str) -> str:
    """Sanitasi nama file gambar untuk mencegah path traversal (misal ../../etc/passwd)."""
    if not isinstance(filename, str) or not filename.strip():
        return ""
    safe_name = os.path.basename(filename).strip()
    if ".." in safe_name or "/" in safe_name or "\\" in safe_name or "\0" in safe_name:
        return ""
    return safe_name


def _get_image_page_cost(filename: str, width_cm: float = 14.0) -> float:
    """Estimasi kontribusi halaman dari satu gambar lampiran.

    Foto portrait (tinggi > lebar) mengambil ~18.67cm + caption = ~21.5cm,
    sehingga mengisi 1 halaman penuh (1 foto per halaman).
    Foto landscape (lebar >= tinggi) mengambil ~10.5cm + caption = ~13cm,
    sehingga 2 foto dapat muat dalam 1 halaman (0.5 halaman per foto).
    """
    clean_name = _sanitize_image_filename(filename)
    if not clean_name:
        return 1.0

    smkn4_dir = Path(__file__).resolve().parent / "smkn4_assets"
    candidates = [
        str(UPLOADS_DIR / "assets" / clean_name),
        str(UPLOADS_DIR / clean_name),
        str(smkn4_dir / clean_name),
        str(smkn4_dir / f"image{abs(hash(clean_name)) % 15 + 1}.jpeg"),
        str(smkn4_dir / "image10.jpeg"),
    ]
    allowed_parents = [UPLOADS_DIR.resolve(), smkn4_dir.resolve()]

    for cand in candidates:
        if cand and os.path.exists(cand):
            try:
                cand_path = Path(cand).resolve()
                if not any(parent in cand_path.parents or cand_path == parent for parent in allowed_parents):
                    continue
                from PIL import Image
                with Image.open(cand_path) as img:
                    w, h = img.size
                    if h > w:
                        return 1.0
                    else:
                        return 0.5
            except Exception:
                pass
    return 1.0


def _image_file_exists(filename: str) -> bool:
    """Cek apakah file gambar benar-benar ada di direktori uploads atau smkn4_assets."""
    clean_name = _sanitize_image_filename(filename)
    if not clean_name:
        return False

    smkn4_dir = Path(__file__).resolve().parent / "smkn4_assets"
    candidates = [
        str(UPLOADS_DIR / "assets" / clean_name),
        str(UPLOADS_DIR / clean_name),
        str(smkn4_dir / clean_name),
    ]
    allowed_parents = [UPLOADS_DIR.resolve(), smkn4_dir.resolve()]

    for cand in candidates:
        if cand and os.path.exists(cand):
            try:
                cand_path = Path(cand).resolve()
                if any(parent in cand_path.parents or cand_path == parent for parent in allowed_parents):
                    return True
            except Exception:
                pass
    return False


def _try_image(builder: PklDocBuilder, filename: str, width_cm: float = 10) -> bool:
    """Sisipkan gambar dari uploads/assets atau smkn4_assets cadangan dengan proteksi path traversal."""
    clean_name = _sanitize_image_filename(filename)
    if not clean_name:
        return False

    smkn4_dir = Path(__file__).resolve().parent / "smkn4_assets"
    candidates = [
        str(UPLOADS_DIR / "assets" / clean_name),
        str(UPLOADS_DIR / clean_name),
        str(smkn4_dir / clean_name),
        str(smkn4_dir / f"image{abs(hash(clean_name)) % 15 + 1}.jpeg"),
        str(smkn4_dir / "image10.jpeg"),
    ]
    allowed_parents = [UPLOADS_DIR.resolve(), smkn4_dir.resolve()]

    for cand in candidates:
        if cand and os.path.exists(cand):
            try:
                cand_path = Path(cand).resolve()
                if not any(parent in cand_path.parents or cand_path == parent for parent in allowed_parents):
                    continue
                builder.add_image(str(cand_path), width_cm=width_cm)
                return True
            except Exception:
                pass
    return False


def _clean_caption_title(title: str) -> str:
    """Bersihkan & tingkatkan judul gambar secara akademis (hapus prefix 'Asset 1', rapikan nama software/tool)."""
    if not title:
        return ""
    t = str(title).strip()

    # 1. Hapus prefix nama file/asset mentah seperti "Asset 1 ", "asset_1 ", "image 1 ", "foto_1 "
    t = re.sub(r'^(?:asset|image|foto|gambar)[\s_]*\d*[\s_\-]*', '', t, flags=re.IGNORECASE).strip()

    # 2. Rapikan ejaan judul software pendek ke versi akademis deskriptif
    t_lower = t.lower()
    if t_lower in ("vs code", "vscode", "visual studio code"):
        return "Tampilan Visual Studio Code"
    elif t_lower in ("xampp", "xampp control panel"):
        return "Tampilan XAMPP Control Panel"
    elif t_lower in ("postman", "postman client"):
        return "Tampilan Postman Client"
    elif t_lower in ("komputer pc", "pc", "komputer"):
        return "Perangkat Komputer PC"

    # Capitalize first letter cleanly if title is not empty
    if t and t[0].islower():
        t = t[0].upper() + t[1:]
    return t or str(title).strip()


def _scan_all_gambar(data: dict) -> list[dict]:
    """Pre-scan seluruh gambar di dokumen untuk penomoran Gambar X.Y (Format 2 Berdasarkan Bab) & DAFTAR GAMBAR."""
    gambar_list: list[dict] = []
    bab_modules = data.get("config", {}).get("bab_modules") or list(ALL_BAB_MODULES)
    normalized = [m for m in _normalize_modules(bab_modules) if m in ALL_BAB_MODULES]

    def get_bab_num(module_name: str, default_num: int) -> int:
        return normalized.index(module_name) + 1 if module_name in normalized else default_num

    bab1_num = get_bab_num("PENDAHULUAN", 1)
    bab4_num = get_bab_num("DATA_PENGAMATAN", 4)

    perusahaan = data.get("perusahaan", {})
    nama_prsh = perusahaan.get("nama_lengkap") or perusahaan.get("nama") or "Perusahaan"
    profil = data.get("profil_perusahaan", {})

    # 1. BAB I: Logo Perusahaan
    logo = profil.get("logo_perusahaan")
    if logo and _image_file_exists(logo):
        img_idx = len([g for g in gambar_list if g["bab_num"] == bab1_num]) + 1
        bm = f"gambar_{bab1_num}_{img_idx}"
        title_clean = f"Logo {nama_prsh}"
        label = f"Gambar {bab1_num}.{img_idx} {title_clean}"
        gambar_list.append({
            "key": "logo_perusahaan",
            "filename": logo,
            "bab_num": bab1_num,
            "img_idx": img_idx,
            "bookmark": bm,
            "text": label,
            "title": title_clean,
            "width_cm": 6,
        })

    # 2. BAB I: Struktur Organisasi
    struktur = profil.get("struktur_organisasi")
    if struktur and _image_file_exists(struktur):
        img_idx = len([g for g in gambar_list if g["bab_num"] == bab1_num]) + 1
        bm = f"gambar_{bab1_num}_{img_idx}"
        title_clean = f"Struktur Organisasi {nama_prsh}"
        label = f"Gambar {bab1_num}.{img_idx} {title_clean}"
        gambar_list.append({
            "key": "struktur_organisasi",
            "filename": struktur,
            "bab_num": bab1_num,
            "img_idx": img_idx,
            "bookmark": bm,
            "text": label,
            "title": title_clean,
            "width_cm": 14,
        })

    # 3. BAB IV: Peralatan
    peralatan = data.get("peralatan", [])
    for idx, p in enumerate(peralatan, 1):
        g_file = p.get("gambar")
        if g_file and _image_file_exists(g_file):
            nama_raw = p.get("nama", f"Peralatan {idx}")
            title_clean = _clean_caption_title(nama_raw) or f"Peralatan {idx}"
            img_idx = len([g for g in gambar_list if g["bab_num"] == bab4_num]) + 1
            bm = f"gambar_{bab4_num}_{img_idx}"
            label = f"Gambar {bab4_num}.{img_idx} {title_clean}"
            gambar_list.append({
                "key": f"peralatan_{idx}",
                "filename": g_file,
                "bab_num": bab4_num,
                "img_idx": img_idx,
                "bookmark": bm,
                "text": label,
                "title": title_clean,
                "width_cm": 10,
            })

    # 4. BAB IV: Studi Kasus / Assets
    studi_kasus = data.get("studi_kasus", {})
    sk_assets = studi_kasus.get("assets", []) if isinstance(studi_kasus, dict) else []
    for idx, a_file in enumerate(sk_assets, 1):
        if isinstance(a_file, str) and a_file and _image_file_exists(a_file):
            raw_title = studi_kasus.get("judul", "") or f"Studi Kasus Asset {idx}"
            title_clean = _clean_caption_title(raw_title) or f"Hasil Studi Kasus {idx}"
            img_idx = len([g for g in gambar_list if g["bab_num"] == bab4_num]) + 1
            bm = f"gambar_{bab4_num}_{img_idx}"
            label = f"Gambar {bab4_num}.{img_idx} {title_clean}"
            gambar_list.append({
                "key": f"studi_kasus_{idx}",
                "filename": a_file,
                "bab_num": bab4_num,
                "img_idx": img_idx,
                "bookmark": bm,
                "text": label,
                "title": title_clean,
                "width_cm": 12,
            })

    return gambar_list


def _render_image_with_caption(builder: PklDocBuilder, data: dict, key_or_filename: str) -> bool:
    """Render gambar beserta caption-nya (Gambar X.Y Judul Gambar) yang telah diregistrasi."""
    gambar_list = data.get("__all_gambar_list__", [])
    item = next(
        (g for g in gambar_list if g.get("key") == key_or_filename or g.get("filename") == key_or_filename),
        None,
    )
    if item:
        inserted = _try_image(builder, item["filename"], width_cm=item.get("width_cm", 10))
        if inserted:
            builder.add_caption(item["text"], bookmark=item["bookmark"])
            return True
        return False
    else:
        return _try_image(builder, key_or_filename, width_cm=10)


def _write_blocks(builder: PklDocBuilder, blocks: list) -> None:
    """Render blok isi kegiatan detail (BAB IV).

    Tipe blok: `paragraf` (narasi), `poin` (sub-poin berurutan a), b), c)),
    `tabel` (rincian nominal tanpa header).
    """
    item_counter = 0
    for b in blocks or []:
        if not isinstance(b, dict):
            builder.add_body(str(b))
            item_counter = 0
            continue
        tipe = b.get("tipe", "paragraf")
        if tipe == "tabel":
            rows = b.get("rows") or []
            if b.get("header"):
                builder.add_table(b["header"], rows)
            else:
                builder.add_simple_table(rows)
            builder.add_spacing(1)
            item_counter = 0
        else:
            teks_raw = str(b.get("teks", "")).strip()
            if not teks_raw:
                continue

            # Cek apakah teks asli diawali karakter simbol bullet (seperti '', '□', '•', '-')
            is_bullet_item = bool(re.match(r"^[\uf0a7\uf0b7□▪•\-\d+\.\)]", teks_raw))
            # Bersihkan karakter simbol bullet di awal teks
            teks_clean = re.sub(r"^[\uf0a7\uf0b7□▪•\-\s]+", "", teks_raw).strip()

            if is_bullet_item:
                letter = _LETTERS[item_counter % 26] + "."
                if teks_clean:
                    teks_clean = teks_clean[0].upper() + teks_clean[1:]
                builder.add_lettered(teks_clean, letter, indent_level=1)
                item_counter += 1
            else:
                builder.add_body(teks_clean)
                item_counter = 0


# Urutan hari untuk meng-expand rentang ("Senin-Jumat" → 5 baris).
_DAY_ORDER = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"]
_DAY_RANGE = re.compile(r"^\s*(\w+)\s*(?:-|–|s\.?/?d\.?|sampai)\s*(\w+)\s*$", re.IGNORECASE)
_TIME_RANGE = re.compile(r"^\s*(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})\s*$")
_ISTIRAHAT_IN_KET = re.compile(
    r"istirahat\s*(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})", re.IGNORECASE
)
_DURASI_MENIT = re.compile(r"^\s*(\d{1,3})\s*menit", re.IGNORECASE)


def _add_minutes(time_str: str, minutes: int) -> str:
    """'08.30' + 30 menit → '09.00' (format jam Indonesia, titik)."""
    try:
        h, m = re.split(r"[.:]", time_str.strip())
        total = int(h) * 60 + int(m) + minutes
        return f"{(total // 60) % 24:02d}.{total % 60:02d}"
    except Exception:
        return time_str


def _jam_kerja_table(jam_kerja: list) -> tuple[list[str], list[list[str]]]:
    """Bentuk tabel jadwal kerja: HARI | JAM KERJA | KETERANGAN.

    Mengikuti gaya tabel referensi (Niken):
      - Rentang hari ("Senin-Jumat") di-expand jadi satu baris per hari.
      - Jika jam istirahat diketahui, satu hari dipecah jadi beberapa slot
        (OPERASIONAL / ISTIRAHAT / OPERASIONAL) dalam sel multi-baris.
    Data yang sudah berbentuk slot multi-baris (field `jam` ber-newline)
    diteruskan apa adanya.
    """
    headers = ["HARI", "JAM KERJA", "KETERANGAN"]

    # Pre-process: Group items where hari is empty ("") into the preceding day item
    grouped_items: list[dict] = []
    curr_item: dict | None = None
    for jk in jam_kerja:
        h_raw = (jk.get("hari") or "").strip()
        if not h_raw and curr_item is not None:
            j_prev = curr_item.get("jam", "")
            j_new = jk.get("jam", "")
            if not j_new:
                mulai, selesai = jk.get("jam_mulai", ""), jk.get("jam_selesai", "")
                j_new = f"{mulai} - {selesai}" if mulai and selesai else (mulai or selesai or "")
            if j_new:
                curr_item["jam"] = f"{j_prev}\n{j_new}" if j_prev else j_new
            k_prev = curr_item.get("keterangan", "")
            k_new = jk.get("keterangan", "")
            if k_new:
                curr_item["keterangan"] = f"{k_prev}\n{k_new}" if k_prev else k_new
        else:
            curr_item = dict(jk)
            grouped_items.append(curr_item)

    # 1. Expand rentang hari jadi baris per hari.
    expanded: list[dict] = []
    for jk in grouped_items:
        hari = (jk.get("hari") or "").strip()
        m = _DAY_RANGE.match(hari)
        if m and m.group(1).upper() in _DAY_ORDER and m.group(2).upper() in _DAY_ORDER:
            i1 = _DAY_ORDER.index(m.group(1).upper())
            i2 = _DAY_ORDER.index(m.group(2).upper())
            days = _DAY_ORDER[i1:i2 + 1] if i2 >= i1 else [hari.upper()]
        else:
            days = [hari.upper()]
        for d in days:
            expanded.append({**jk, "hari": d})

    # 2. Susun baris; pecah jadi slot bila jam istirahat bisa dikenali.
    rows: list[list[str]] = []
    for jk in expanded:
        hari = jk.get("hari", "")
        jam = jk.get("jam", "")
        if not jam:
            mulai, selesai = jk.get("jam_mulai", ""), jk.get("jam_selesai", "")
            jam = f"{mulai} - {selesai}" if mulai and selesai else (mulai or selesai or "-")
        ket = jk.get("keterangan", "")

        istirahat = (jk.get("jam_istirahat") or "").strip()
        if not istirahat:
            m_ist = _ISTIRAHAT_IN_KET.search(ket)
            if m_ist:
                istirahat = f"{m_ist.group(1)} - {m_ist.group(2)}"
        briefing = (jk.get("jam_briefing") or "").strip()

        m_jam = _TIME_RANGE.match(jam)
        m_ist = _TIME_RANGE.match(istirahat) if istirahat and istirahat != "-" else None
        m_brf = _TIME_RANGE.match(briefing) if briefing and briefing != "-" else None
        # Briefing boleh ditulis sebagai durasi ("30 menit") — dihitung
        # relatif dari jam masuk.
        if m_brf is None and m_jam is not None:
            m_dur = _DURASI_MENIT.match(briefing)
            if m_dur:
                mulai_b = m_jam.group(1)
                m_brf = _TIME_RANGE.match(
                    f"{mulai_b} - {_add_minutes(mulai_b, int(m_dur.group(1)))}"
                )

        if m_jam and (m_ist or m_brf):
            # Pecah jadi slot seperti tabel referensi:
            #   BRIEFING → OPERASIONAL → ISTIRAHAT → OPERASIONAL → TUTUP.
            mulai, selesai = m_jam.group(1), m_jam.group(2)
            jam_lines: list[str] = []
            ket_lines: list[str] = []
            cursor = mulai
            if m_brf:
                jam_lines.append(f"{m_brf.group(1)} - {m_brf.group(2)}")
                ket_lines.append("BRIEFING")
                cursor = m_brf.group(2)
            if m_ist:
                jam_lines.append(f"{cursor} - {m_ist.group(1)}")
                ket_lines.append("OPERASIONAL")
                jam_lines.append(f"{m_ist.group(1)} - {m_ist.group(2)}")
                ket_lines.append("ISTIRAHAT")
                cursor = m_ist.group(2)
            jam_lines.append(f"{cursor} - {selesai}")
            ket_lines.append("OPERASIONAL")
            jam_lines.append(selesai)
            ket_lines.append("TUTUP")
            jam = "\n".join(jam_lines)
            ket = "\n".join(ket_lines)
        elif istirahat and istirahat != "-" and "\n" not in jam:
            ket = f"{ket} (istirahat {istirahat})".strip()

        rows.append([hari, jam, ket])
    return headers, rows


def default_daftar_pustaka(data: dict) -> list[str]:
    """Susun daftar pustaka standar dari data yang benar-benar ada.

    Dipakai saat `config.auto_daftar_pustaka` aktif dan user tidak mengisi
    manual. Hanya sumber nyata yang dirujuk: website perusahaan/sekolah milik
    user sendiri + artikel & buku publik tentang PKL (pola sitasi mengikuti
    laporan referensi). Tidak mengarang buku/URL yang tidak ada.
    """
    import datetime as _dt

    perusahaan = data.get("perusahaan", {})
    sekolah = data.get("sekolah", {})

    selesai = (data.get("pkl", {}) or {}).get("tanggal_selesai", "")
    tahun = selesai[:4] if len(selesai) >= 4 and selesai[:4].isdigit() else str(_dt.date.today().year)
    akses = _format_indonesian_date(selesai) if selesai else _format_indonesian_date(
        _dt.date.today().isoformat()
    )

    def domain(url: str) -> str:
        return re.sub(r"^https?://", "", url).strip("/").split("/")[0]

    refs: list[str] = []

    web_prsh = (perusahaan.get("website") or "").strip()
    nama_prsh = perusahaan.get("nama_lengkap") or perusahaan.get("nama") or ""
    if web_prsh and web_prsh not in ("-",):
        refs.append(
            f"{domain(web_prsh)}. ({tahun} - {nama_prsh}). Profil dan Sejarah "
            f"Perusahaan. Diakses pada {akses}, dari {web_prsh}."
        )
        if data.get("profil_perusahaan", {}).get("visi"):
            refs.append(
                f"{domain(web_prsh)}. ({tahun} - {nama_prsh}). Visi Misi "
                f"Perusahaan. Diakses pada {akses}, dari {web_prsh}."
            )

    web_sek = (sekolah.get("website") or "").strip()
    nama_sek = sekolah.get("nama") or ""
    if web_sek:
        refs.append(
            f"{domain(web_sek)}. ({tahun} - {nama_sek.upper()}). Sejarah Sekolah. "
            f"Diakses pada {akses}, dari {web_sek}."
        )

    # Sumber publik tentang PKL — URL nyata, dipakai juga di laporan referensi.
    refs.append(
        f"www.kajianpustaka.com. (2021 - Kajian Pustaka). Praktik Kerja Lapangan "
        f"(Pengertian, Tujuan, Manfaat, dan Pelaksanaan). Diakses pada {akses}, "
        f"dari https://www.kajianpustaka.com/2021/03/praktik-kerja-lapangan.html."
    )
    refs.append(
        "Noris, Rahmatullah dkk. (2023). Praktik Kerja Lapangan Sebagai Mata "
        "Pelajaran. DKI Jakarta: Direktorat SMK."
    )
    return refs


def _format_indonesian_date(date_str: str) -> str:
    if not date_str or len(date_str) < 10:
        return date_str
    try:
        y, m, d = date_str.split("-")
        months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                  "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
        return f"{int(d)} {months[int(m)]} {y}"
    except Exception:
        return date_str


def _scrub_vague(node):
    """Kosongkan semua string vague di seluruh struktur data (rekursif).

    Jawaban "gatau"/"lupa"/"-" tidak boleh sampai tercetak di dokumen —
    field yang di-scrub jadi kosong sehingga jatuh ke fallback normal
    (sub-bab dilewati / kalimat default dipakai).
    """
    from ..validation import is_vague

    def clean(value: str) -> str:
        # Normalisasi spasi per baris ("smkn 5  bandar" → "smkn 5 bandar").
        # Newline dipertahankan — banyak field berisi beberapa paragraf.
        cleaned = "\n".join(
            " ".join(line.split()) for line in value.split("\n")
        ).strip("\n")
        # "-" sengaja dipertahankan: di tabel identitas artinya "tidak ada"
        # (fax: -, catatan kesehatan: -) dan memang dicetak begitu.
        if cleaned == "-":
            return cleaned
        return "" if is_vague(cleaned) else cleaned

    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str):
                node[key] = clean(value)
            else:
                _scrub_vague(value)
    elif isinstance(node, list):
        for i, item in enumerate(node):
            if isinstance(item, str):
                node[i] = clean(item)
            else:
                _scrub_vague(item)


def _merge_system_config(data: dict, sys_cfg: dict | None = None) -> None:
    """Suntikkan konfigurasi terpusat (Kop Surat, Kepala Sekolah, Waka Humas, Pembimbing Sekolah, Ketua KK Jurusan)
    ke dalam PklContext dict sebelum perakitan dokumen .docx.
    """
    if sys_cfg is None:
        try:
            from ..db import SessionLocal
            from ..models import SystemConfig
            with SessionLocal() as db:
                cfg_obj = db.get(SystemConfig, "global_settings")
                if cfg_obj and cfg_obj.value_json:
                    sys_cfg = cfg_obj.value_json
        except Exception:
            pass

    if sys_cfg is None:
        try:
            from ..routers.admin import SystemConfigIn
            sys_cfg = SystemConfigIn().model_dump()
        except Exception:
            sys_cfg = {}

    if not sys_cfg:
        return

    sekolah = data.setdefault("sekolah", {})
    kop = sekolah.setdefault("kop", {})

    # Isi identitas sekolah jika kosong atau bernilai default
    if not sekolah.get("nama") or sekolah.get("nama") == "SMK Negeri 4 Bandar Lampung":
        sekolah["nama"] = sys_cfg.get("school_name", sekolah.get("nama", "SMK Negeri 4 Bandar Lampung"))
    if not sekolah.get("nama_lengkap") or sekolah.get("nama_lengkap") == "SMK Negeri 4 Bandar Lampung":
        sekolah["nama_lengkap"] = sys_cfg.get("school_name_full", sekolah.get("nama_lengkap", "SMK Negeri 4 Bandar Lampung"))
    if not sekolah.get("alamat"):
        sekolah["alamat"] = sys_cfg.get("alamat", "Jl. HOS Cokroaminoto No. 102, Enggal, Bandar Lampung")
    if not sekolah.get("kota"):
        sekolah["kota"] = sys_cfg.get("kota", "Bandar Lampung")
    if not sekolah.get("telp"):
        sekolah["telp"] = sys_cfg.get("telp", "(0721) 262637")
    if not sekolah.get("email"):
        sekolah["email"] = sys_cfg.get("email", "smkn4bl@yahoo.co.id")
    if not sekolah.get("website"):
        sekolah["website"] = sys_cfg.get("website", "https://smkn4-bdl.sch.id")

    # Kop Surat
    if not kop.get("baris_1") or kop.get("baris_1") == "PEMERINTAH PROVINSI LAMPUNG":
        kop["baris_1"] = sys_cfg.get("kop_baris_1", "PEMERINTAH PROVINSI LAMPUNG")
    if not kop.get("baris_2") or kop.get("baris_2") == "DINAS PENDIDIKAN DAN KEBUDAYAAN":
        kop["baris_2"] = sys_cfg.get("kop_baris_2", "DINAS PENDIDIKAN DAN KEBUDAYAAN")
    if not kop.get("baris_3") or kop.get("baris_3") == "SMK NEGERI 4 BANDAR LAMPUNG":
        kop["baris_3"] = sys_cfg.get("kop_baris_3", "SMK NEGERI 4 BANDAR LAMPUNG")
    if not kop.get("npsn") or kop.get("npsn") in ("10807066", "10807215"):
        kop["npsn"] = sys_cfg.get("npsn", "10807215")
    if not kop.get("nss"):
        kop["nss"] = sys_cfg.get("nss", "401126003028")

    # Pejabat Utama
    kepsek = sekolah.setdefault("kepala_sekolah", {})
    if not kepsek.get("nama") or "Alex Kuchel" in kepsek.get("nama", ""):
        kepsek["nama"] = sys_cfg.get("kepala_sekolah", "HJ. Dewi Ningsih, S.Pd., M.Pd.")
    if not kepsek.get("nip") or "19720315" in kepsek.get("nip", ""):
        kepsek["nip"] = sys_cfg.get("nip_kepala_sekolah", "19750312 200312 2 004")

    waka = sekolah.setdefault("waka_humas", {})
    if not waka.get("nama") or "Budi Santoso" in waka.get("nama", ""):
        waka["nama"] = sys_cfg.get("waka_humas", "Mas Azizah, M.Pd")
    if not waka.get("nip") or "19680512" in waka.get("nip", ""):
        waka["nip"] = sys_cfg.get("nip_waka_humas", "19781015 200902 2 001")

    pemb = sekolah.setdefault("pembimbing_sekolah", {})
    if not pemb.get("nama"):
        pemb["nama"] = sys_cfg.get("pembimbing_sekolah", "Siti Rahma, S.Pd.")
    if not pemb.get("nip"):
        pemb["nip"] = sys_cfg.get("nip_pembimbing_sekolah", "19820101 200701 2 011")

    # Ketua KK Jurusan
    siswa = data.get("siswa", {})
    jurusan_key = (siswa.get("jurusan_key") or "").lower().strip()
    if not jurusan_key:
        j_str = (siswa.get("jurusan") or "").lower()
        if "rekayasa" in j_str or "rpl" in j_str:
            jurusan_key = "rpl"
        elif "komputer" in j_str or "tkj" in j_str:
            jurusan_key = "tkj"
        elif "pemasaran" in j_str or "bdp" in j_str or "bisnis" in j_str:
            jurusan_key = "bdp"
        elif "akuntansi" in j_str or "akl" in j_str:
            jurusan_key = "akl"
        elif "perkantoran" in j_str or "mp" in j_str or "mplb" in j_str:
            jurusan_key = "mp"
        elif "boga" in j_str or "tb" in j_str:
            jurusan_key = "tb"

    pejabat_j = sys_cfg.get("pejabat_jurusan", {})
    if jurusan_key and jurusan_key in pejabat_j:
        ketua = sekolah.setdefault("ketua_kk", {})
        info = pejabat_j[jurusan_key]
        if not ketua.get("nama") or ketua.get("nama") in ("Ketua RPL", "Ketua KK", "Nama Ketua KK"):
            ketua["nama"] = info.get("nama", "")
        if not ketua.get("nip") or ketua.get("nip") in ("12345", "NIP Ketua KK"):
            ketua["nip"] = info.get("nip", "")


def _sanitize_data(data: dict) -> None:
    # Suntikkan / selaraskan konfigurasi terpusat (Kop & Pejabat) dari Admin
    _merge_system_config(data)

    # Buang jawaban vague & rapikan spasi di semua field.
    _scrub_vague(data)

    # Bersihkan markdown formatting (*text*, **text**, `code`) dari field konten
    for key in ("peralatan", "kegiatan", "profil_perusahaan", "pelajaran", "kendala", "generated_sections"):
        if key in data and data[key]:
            data[key] = _clean_all_markdown_in_obj(data[key])

    # Normalize aliases for kegiatan & peralatan
    if not data.get("kegiatan") and data.get("kegiatan_harian"):
        data["kegiatan"] = [{
            "bidang": "Ringkasan Kegiatan Harian PKL",
            "deskripsi_umum": "Berikut adalah rincian kegiatan harian yang dilaksanakan oleh Penulis selama Praktik Kerja Lapangan:",
            "tugas": [
                {
                    "nama_tugas": f"Tanggal {item.get('tgl', '')}",
                    "detail": item.get("deskripsi", "")
                }
                for item in data["kegiatan_harian"]
                if isinstance(item, dict) and (item.get("deskripsi") or item.get("tgl"))
            ]
        }]
    if not data.get("peralatan") and data.get("peralatan_list"):
        data["peralatan"] = [
            {
                "nama": item.get("nama", ""),
                "deskripsi": f"{item.get('spesifikasi', '')}\nFungsi: {item.get('fungsi', '')}".strip(),
                "gambar": item.get("gambar", "")
            }
            for item in data["peralatan_list"]
            if isinstance(item, dict) and item.get("nama")
        ]

    # Format date in kata_pengantar; kalau kosong pakai tanggal selesai PKL.
    kp = data.setdefault("kata_pengantar", {})
    if not kp.get("tanggal"):
        kp["tanggal"] = data.get("pkl", {}).get("tanggal_selesai", "")
    if kp.get("tanggal"):
        kp["tanggal"] = _format_indonesian_date(kp["tanggal"])

    # Buang item list yang isinya sudah kosong akibat scrub.
    data["pelajaran"] = [p for p in (data.get("pelajaran") or []) if p and len(p) > 3]
    data["kendala"] = [
        k for k in (data.get("kendala") or [])
        if isinstance(k, dict) and len(k.get("masalah", "")) > 3
    ]
    if isinstance(data.get("profil_perusahaan"), dict):
        profil = data["profil_perusahaan"]
        profil["misi"] = [m for m in (profil.get("misi") or []) if m]
        profil["tata_tertib"] = [t for t in (profil.get("tata_tertib") or []) if t]
        # Migrasi field legacy: draft lama menyimpan tata tertib perusahaan di
        # `tata_tertib`; kode baru membacanya dari `tata_tertib_perusahaan`.
        # Tanpa ini, tata tertib khusus perusahaan hilang diam-diam dari dokumen.
        if not profil.get("tata_tertib_perusahaan") and profil["tata_tertib"]:
            profil["tata_tertib_perusahaan"] = list(profil["tata_tertib"])
        profil["tata_tertib_perusahaan"] = [
            t for t in (profil.get("tata_tertib_perusahaan") or []) if t
        ]

    # Kegiatan: buang tugas kosong; buang bidang yang tidak punya tugas DAN
    # tidak punya deskripsi (bidang disebut tapi tidak ada isinya → jangan
    # jadi sub-bab kosong).
    valid_kegiatan = []
    for k in (data.get("kegiatan") or []):
        if not isinstance(k, dict):
            continue
        k["tugas"] = [
            t for t in (k.get("tugas") or [])
            if isinstance(t, dict) and (t.get("nama_tugas") or t.get("nama"))
        ]
        if k.get("tugas") or (k.get("deskripsi_umum") and k.get("bidang")):
            valid_kegiatan.append(k)
    data["kegiatan"] = valid_kegiatan


# ======================================================================== #
#  Front Matter                                                             #
# ======================================================================== #

def _build_front_matter(
    builder: PklDocBuilder, data: dict, bab_modules: list[str]
) -> None:
    """Cover → Cover dalam → Pengesahan → Identitas → Kata Pengantar
    → (preset pedoman) Daftar Isi + Daftar Gambar + Daftar Lampiran.

    Penomoran halaman:
      - Cover: tanpa nomor
      - Pengesahan dst: lowercase Roman (i, ii, iii...)
    """
    # Foto siswa (kalau ada) di-resolve ke path absolut untuk builder.
    siswa = data.get("siswa", {})
    if siswa.get("foto"):
        foto_path = UPLOADS_DIR / "assets" / siswa["foto"]
        siswa["foto"] = str(foto_path) if foto_path.exists() else ""

    cfg = data.get("config", {})
    preset = cfg.get("preset") or "pedoman"
    cover_num_fmt = cfg.get("cover_page_number") or "none"
    front_fmt = cfg.get("front_matter_format") or "lowerRoman"
    front_start = cfg.get("front_matter_start") if cfg.get("front_matter_start") is not None else 1

    if cover_num_fmt != "none":
        builder.setup_page_numbering(builder.doc.sections[0], fmt=cover_num_fmt, start=1)

    # Cover luar
    builder.add_cover(data, is_cover_dalam=False)

    # Cover dalam (dengan margin standar pedoman 4cm kiri, 3cm kanan/atas/bawah)
    builder.add_section_break()
    builder.add_cover(data, is_cover_dalam=True)

    # Mulai section baru untuk Halaman Depan
    section_front = builder.add_section_break()
    builder.setup_page_numbering(section_front, fmt=front_fmt, start=front_start)

    # Pengesahan Industri
    builder.add_pengesahan_industri(data)

    # Pengesahan Sekolah
    builder.add_page_break()
    builder.add_pengesahan_sekolah(data)

    # Identitas Siswa
    builder.add_page_break()
    builder.add_identitas_siswa(data)

    # Identitas Industri
    builder.add_page_break()
    builder.add_identitas_industri(data)

    # Kata Pengantar
    builder.add_page_break()
    builder.add_kata_pengantar(data)

    # Daftar Isi — dokumen referensi (Niken) MEMILIKINYA sebagai field TOC
    # asli Word di dalam SDT, jadi kedua preset membuatnya. Word mengisi
    # entri (semua level heading) + nomor halaman saat dokumen dibuka.
    builder.add_page_break()
    builder.add_native_toc()

    # Daftar Gambar & Daftar Lampiran — tambahan pedoman resmi (1.7.1).
    if builder.preset == "pedoman":
        _build_daftar_gambar_lampiran(builder, data)


def _build_daftar_gambar_lampiran(builder: PklDocBuilder, data: dict) -> None:
    """Daftar Gambar & Daftar Lampiran (hanya bila ada isinya).

    Nomor halaman memakai field PAGEREF ke bookmark caption/keterangan,
    diisi Word bersamaan dengan update field TOC.
    """
    gambar_list = data.get("__all_gambar_list__", [])
    foto_lampiran = [
        f for f in (data.get("lampiran", {}) or {}).get("foto_kegiatan", [])
        if isinstance(f, dict) and f.get("gambar")
    ]

    # Daftar Gambar — merujuk caption "Gambar <bab>.<n> <judul>" pada seluruh gambar.
    if gambar_list:
        builder.add_page_break()
        builder._heading("DAFTAR GAMBAR", bookmark="daftar_gambar")
        builder.add_spacing(1)
        for item in gambar_list:
            builder.add_toc_entry(item["text"], item["bookmark"], 1)

    # Daftar Lampiran — merujuk keterangan foto dokumentasi.
    if foto_lampiran:
        builder.add_page_break()
        builder._heading("DAFTAR LAMPIRAN", bookmark="daftar_lampiran")
        builder.add_spacing(1)
        for i, f in enumerate(foto_lampiran, 1):
            ket = (f.get("keterangan") or "").strip() or f"Dokumentasi kegiatan {i}"
            builder.add_toc_entry(ket.rstrip("."), f"lamp_{i}", 1)


# ======================================================================== #
#  BAB Content Writers                                                      #
# ======================================================================== #
from .smkn4_sejarah import SEJARAH_SMKN4


def _build_bab_content(
    builder: PklDocBuilder, data: dict, bab_modules: list[str]
) -> None:
    """Tulis semua BAB berurutan mengikuti struktur resmi SMKN4 TP 2026-2027 (6 BAB)."""
    writers = {
        "PENDAHULUAN": _write_pendahuluan,
        # PROFIL_PERUSAHAAN telah diintegrasikan ke dalam _write_pendahuluan (sub-bab 1.3-1.6)
        "KEGIATAN_INDUSTRI": _write_kegiatan_industri,
        "TINJAUAN_PUSTAKA": _write_tinjauan_pustaka,
        "DATA_PENGAMATAN": _write_data_pengamatan,
        "PEMBAHASAN": _write_pembahasan,
        "KESIMPULAN_SARAN": _write_kesimpulan_saran,
    }

    # Nomor BAB dihitung dari BAB yang benar-benar ditulis, bukan dari posisi
    # di list. Kalau memakai enumerate() dan satu modul dilewati, nomornya
    # hilang bersamanya — dokumen bisa punya BAB I lalu langsung BAB III.
    bab_num = 0
    for module_key in _normalize_modules(bab_modules):
        writer = writers.get(module_key)
        if writer is None:
            logger.warning("Modul BAB tidak dikenal, dilewati: %r", module_key)
            continue
        bab_num += 1
        if bab_num > 1:
            builder.add_page_break()
        writer(builder, data, bab_num)


# ---------------------------------------------------------------------- #
#  BAB I — PENDAHULUAN (Panduan Resmi SMKN4 TP 2026-2027)               #
#  Sub-bab:                                                              #
#    1.1 Latar Belakang                                                  #
#    1.2 Tujuan Kegiatan PKL                                             #
#    1.3 Sejarah Singkat Perusahaan (+ Visi-Misi, Profil Lokasi)        #
#    1.4 Tata Tertib Perusahaan (+ Jam Kerja, Tata Tertib SMKN4)       #
#    1.5 Bagan Struktur Organisasi (opsional)                           #
#    1.6 Job Description (opsional)                                      #
# ---------------------------------------------------------------------- #
def _write_pendahuluan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    """BAB I PENDAHULUAN — 6 sub-bab sesuai Panduan Resmi SMKN4 TP 2026-2027.

    Profil perusahaan (Sejarah, Visi-Misi, Tata Tertib, Struktur, Job Desc)
    kini menjadi sub-bab 1.3–1.6 di dalam BAB I, bukan BAB tersendiri.

    Seluruh sub-bab bersifat DINAMIS:
    - Hadir jika datanya tersedia, dilewati jika tidak ada data.
    - Penomoran sub-bab otomatis mengikuti urutan data yang tersedia.
    """
    builder.add_bab_heading(
        bab_num, _bab_title("PENDAHULUAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    siswa = data.get("siswa", {})
    perusahaan = data.get("perusahaan", {})
    profil = data.get("profil_perusahaan", {})
    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})

    nama_prsh = perusahaan.get("nama") or "[Perusahaan]"
    nama_prsh_full = perusahaan.get("nama_lengkap") or nama_prsh

    sub = 1

    # ------------------------------------------------------------------ #
    # 1.1 Latar Belakang — dinamis: AI-generated atau fallback 2 paragraf
    # ------------------------------------------------------------------ #
    builder.add_sub_heading(bab_num, sub, judul.get("latar_belakang", "Latar Belakang"))
    gen_latar = gen.get("latar_belakang")
    if gen_latar:
        _write_paragraphs(builder, gen_latar)
    else:
        jurusan = (siswa.get("jurusan") or "").strip()
        builder.add_body(
            "Pelatihan Kerja Lapangan (PKL) merupakan bagian dari pembelajaran akademik "
            "yang dilalui oleh siswa aktif jenjang Sekolah Menengah Kejuruan (SMK). "
            "Program ini dirancang untuk memberikan pengalaman kerja secara langsung "
            "di dunia usaha dan industri (DUDI) sesuai dengan kompetensi keahlian yang "
            "dipelajari di sekolah."
        )
        sebagai = f"sebagai siswa kompetensi keahlian {jurusan}" if jurusan else "sebagai siswa SMK"
        builder.add_body(
            f"Penulis melaksanakan Praktik Kerja Lapangan di {nama_prsh} "
            f"{sebagai}. Melalui kegiatan ini, Penulis "
            f"dapat menerapkan ilmu yang telah dipelajari di sekolah ke dalam praktik "
            f"kerja nyata di lingkungan industri yang sesungguhnya."
        )
    sub += 1

    # ------------------------------------------------------------------ #
    # 1.2 Tujuan Kegiatan PKL — dinamis: poin tujuan bebas jumlahnya
    # ------------------------------------------------------------------ #
    builder.add_sub_heading(
        bab_num, sub, judul.get("tujuan", "Tujuan Kegiatan Praktik Kerja Lapangan")
    )
    kota_sekolah = data.get("sekolah", {}).get("kota", "daerah ini")
    builder.add_body(gen.get("tujuan_intro") or (
        f"Dalam rangka meningkatkan mutu Pendidikan Sekolah Menengah Kejuruan "
        f"di {kota_sekolah}, maka perlu adanya hubungan timbal balik antara Dunia "
        f"Usaha/Dunia Industri (DU/DI) dan dunia pendidikan. Adapun tujuan kegiatan "
        f"Praktik Kerja Lapangan (PKL) adalah:"
    ))
    for i, t in enumerate(data.get("tujuan_pkl") or DEFAULT_TUJUAN_PKL, 1):
        builder.add_numbered(t, i)
    sub += 1

    # ------------------------------------------------------------------ #
    # 1.3 Sejarah Singkat Perusahaan — opsional: muncul jika ada data
    #     Sub-sub: a) Visi dan Misi, b) Profil Lokasi PKL
    # ------------------------------------------------------------------ #
    sejarah = profil.get("sejarah", "")
    logo = profil.get("logo_perusahaan", "")
    if sejarah or logo:
        builder.add_sub_heading(
            bab_num, sub, judul.get("sejarah_perusahaan", f"Sejarah Singkat {nama_prsh_full}")
        )
        if sejarah:
            _write_paragraphs(builder, sejarah)
        if logo:
            _render_image_with_caption(builder, data, "logo_perusahaan")

        sub3 = 0

        # a) Visi dan Misi — opsional
        visi = profil.get("visi", "")
        misi = profil.get("misi", [])
        if visi or misi:
            sub3 += 1
            builder.add_sub_heading_3(f"{_LETTERS[sub3 - 1]}. Visi dan Misi")
            intro_vm = profil.get("visi_misi_intro")
            if intro_vm:
                builder.add_body(intro_vm)
            if visi:
                builder.add_body("VISI", bold=True)
                builder.add_numbered(visi, 1)
            if misi:
                builder.add_body("MISI", bold=True)
                for i, m in enumerate(misi, 1):
                    builder.add_numbered(m, i)

        # b) Profil Lokasi Praktik Kerja Lapangan — opsional
        alamat = perusahaan.get("alamat", "")
        area_cabang = profil.get("area_cabang", [])
        if alamat or area_cabang:
            sub3 += 1
            builder.add_sub_heading_3(
                f"{_LETTERS[sub3 - 1]}. Profil Lokasi Praktik Kerja Lapangan"
            )
            lokasi = profil.get("profil_lokasi")
            if lokasi:
                _write_paragraphs(builder, lokasi)
            elif alamat:
                builder.add_body(f"{nama_prsh_full} beralamat di {alamat}.")
            for idx_a, area in enumerate(area_cabang):
                nama_area = (area or {}).get("nama_area", "").strip()
                if nama_area:
                    nama_area_clean = re.sub(r'^[^\w\s]+', '', nama_area).strip()
                    if nama_area_clean:
                        marker = _LETTERS[idx_a % 26] + "."
                        builder.add_lettered(nama_area_clean, marker, indent_level=0, bold=True)
                for idx_c, cab in enumerate((area or {}).get("cabang", []), 1):
                    nama_cab = cab.get("nama", "") if isinstance(cab, dict) else str(cab)
                    if nama_cab.strip():
                        builder.add_numbered(nama_cab.strip(), idx_c, indent_level=1)

        sub += 1

    # ------------------------------------------------------------------ #
    # 1.4 Tata Tertib Perusahaan — 8 poin resmi SMKN4 + poin khusus
    #     Sub-sub: a) Waktu Kerja, b) Tata Tertib Karyawan, c) Khusus
    # ------------------------------------------------------------------ #
    OFFICIAL_SMKN4_TATA_TERTIB = [
        "Mematuhi aturan dan tata tertib yang berlaku di industri;",
        "Melaksanakan kegiatan PKL sesuai jam kerja yang berlaku di industri;",
        "Memberi tahu pembimbing jika sakit dan dibuktikan dengan surat keterangan sakit dari dokter;",
        "Tidak mengaktifkan \"handphone/smartphone\" selama jam bekerja;",
        "Tidak diperkenankan minta izin dengan alasan keperluan sekolah kecuali ada surat resmi dari sekolah;",
        "Pakaian rapi, rambut tidak gondrong. Jenis pakaian sesuai dengan ketentuan industri;",
        "Membawa alat keselamatan kerja (kecuali jika sudah disediakan oleh industri/instansi) dan senantiasa menerapkannya selama bekerja;",
        "Menerapkan etika dalam bersosialisasi dengan lingkungan kerja."
    ]
    jam_kerja = data.get("jam_kerja") or profil.get("jam_kerja") or []

    # Tata tertib perusahaan spesifik (dari input user yang sudah di-polish AI)
    tt_perusahaan = gen.get("tata_tertib_perusahaan_polished") or \
                    profil.get("tata_tertib_perusahaan") or []
    if isinstance(tt_perusahaan, str):
        tt_perusahaan = [t.strip() for t in tt_perusahaan.split("\n") if t.strip()]

    builder.add_sub_heading(bab_num, sub, judul.get("tata_tertib", "Tata Tertib Perusahaan"))
    builder.add_body(profil.get("tata_tertib_intro") or (
        f"Tata Tertib {nama_prsh_full}, tata tertib yang diberikan perusahaan bertujuan "
        f"untuk menciptakan lingkungan kerja yang kondusif, efisien, dan profesional."
    ))
    tt_sub = 0

    # a) Waktu Kerja dan Istirahat Kerja — dinamis: tabel jam kerja user
    if jam_kerja:
        tt_sub += 1
        builder.add_sub_heading_3(f"{_LETTERS[tt_sub - 1]}. Waktu Kerja dan Istirahat Kerja")
        builder.add_body(
            profil.get("jam_kerja_intro") or f"Jadwal kerja yang ada di {nama_prsh}:"
        )
        builder.add_table(*_jam_kerja_table(jam_kerja))
        builder.add_spacing(1)

    # b) Tata Tertib SMKN4 Resmi (selalu ada)
    tt_sub += 1
    builder.add_sub_heading_3(f"{_LETTERS[tt_sub - 1]}. Tata Tertib dan Kewajiban Karyawan")
    builder.add_body(
        profil.get("tata_tertib_list_intro")
        or f"Berikut adalah tata tertib dan kewajiban karyawan {nama_prsh}:"
    )
    for i, tt in enumerate(OFFICIAL_SMKN4_TATA_TERTIB, 1):
        clean_tt = tt.strip()
        if clean_tt:
            clean_tt = clean_tt[0].upper() + clean_tt[1:]
        builder.add_numbered(clean_tt, i)

    # c) Tata Tertib Perusahaan Spesifik (opsional — dari input user)
    if tt_perusahaan:
        tt_sub += 1
        builder.add_sub_heading_3(f"{_LETTERS[tt_sub - 1]}. Tata Tertib Khusus {nama_prsh}")
        for i, tt in enumerate(tt_perusahaan, 1):
            clean_tt = (_ensure_str(tt) if not isinstance(tt, str) else tt).strip()
            if clean_tt:
                clean_tt = clean_tt[0].upper() + clean_tt[1:]
            builder.add_numbered(clean_tt, i)

    sub += 1

    # ------------------------------------------------------------------ #
    # 1.5 Bagan Struktur Organisasi — opsional, gambar + narasi dinamis
    # ------------------------------------------------------------------ #
    struktur = profil.get("struktur_organisasi", "")
    if struktur:
        builder.add_sub_heading(bab_num, sub, f"Bagan Struktur {nama_prsh}")
        builder.add_body(
            profil.get("bagan_intro") or f"Berikut adalah struktur organisasi {nama_prsh}:"
        )
        if not _render_image_with_caption(builder, data, "struktur_organisasi"):
            builder.add_body(f"[GAMBAR STRUKTUR ORGANISASI: {struktur}]")
        narasi = profil.get("narasi_struktur") or gen.get("narasi_struktur")
        if narasi:
            _write_paragraphs(builder, narasi)
        sub += 1

    # ------------------------------------------------------------------ #
    # 1.6 Job Description — opsional, jumlah posisi & tugas bebas
    # ------------------------------------------------------------------ #
    job_descs = profil.get("job_descriptions", [])
    if job_descs:
        nama_cabang = perusahaan.get("nama_cabang") or nama_prsh_full
        builder.add_sub_heading(bab_num, sub, f"Job Description {nama_cabang}")
        builder.add_body(f"Berikut tugas dan tanggung jawab karyawan {nama_cabang}:")
        for idx, jd in enumerate(job_descs):
            if isinstance(jd, dict):
                posisi = _ensure_str(jd.get("posisi", ""))
                if posisi:
                    marker = _LETTERS[idx % 26] + "."
                    builder.add_lettered(posisi, marker, indent_level=0, bold=True)
                tugas_list = jd.get("tugas", [])
                if isinstance(tugas_list, str):
                    tugas_list = [t.strip() for t in tugas_list.split("\n") if t.strip()]
                for i, t in enumerate([_ensure_str(x).strip() for x in tugas_list if _ensure_str(x).strip()], 1):
                    clean_t = _ensure_str(t).strip()
                    if clean_t:
                        clean_t = _polish_task_detail(clean_t)
                    builder.add_numbered(clean_t, i, indent_level=1)
        sub += 1


# ---------------------------------------------------------------------- #
#  BAB II — KEGIATAN DI INDUSTRI (ringkasan singkat per divisi)          #
# ---------------------------------------------------------------------- #
def _write_kegiatan_industri(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    """BAB II KEGIATAN DI INDUSTRI: ringkasan proses kegiatan per divisi.

    Berbeda dengan BAB IV (detail cerita). Di sini hanya garis besar per divisi.
    """
    builder.add_bab_heading(
        bab_num, _bab_title("KEGIATAN_INDUSTRI", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    kegiatan = data.get("kegiatan", [])
    pkl = data.get("pkl", {})
    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})
    bagian = pkl.get("bagian_ditempatkan", "")

    sub = 1
    builder.add_sub_heading(
        bab_num, sub, judul.get("proses_kegiatan", "Proses Kegiatan Selama PKL")
    )

    intro = gen.get("kegiatan_industri_intro")
    if intro:
        _write_paragraphs(builder, intro)
    elif bagian:
        builder.add_body(
            f"Penulis ditempatkan pada bagian {bagian} selama melaksanakan "
            f"Praktik Kerja Lapangan. Adapun ringkasan kegiatan yang dilakukan:"
        )
    else:
        builder.add_body(
            "Adapun ringkasan kegiatan yang dilakukan selama Praktik Kerja Lapangan:"
        )

    if not kegiatan:
        builder.add_body("Penulis melaksanakan berbagai kegiatan administrasi dan operasional sesuai arahan pembimbing industri.")
        return

    for idx, k in enumerate(kegiatan):
        bidang = k.get("bidang", "").strip()
        tugas_list = k.get("tugas", [])

        if bidang:
            builder.add_lettered(bidang, _LETTERS[idx % 26] + ".", bold=True)
            builder.add_body(
                k.get("deskripsi_umum")
                or f"Adapun tugas yang penulis kerjakan dalam bidang {bidang} adalah:"
            )

        n = 0
        for t in tugas_list:
            nama_tugas = t.get("nama_tugas") or t.get("nama") or ""
            clean_t = nama_tugas.strip()
            if clean_t:
                clean_t = _polish_task_detail(clean_t)
                n += 1
                builder.add_numbered(clean_t, n, indent_level=1)


# ---------------------------------------------------------------------- #
#  BAB III — TINJAUAN PUSTAKA                                             #
# ---------------------------------------------------------------------- #
def _write_tinjauan_pustaka(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    """BAB III: Landasan Teori → Asas/dasar hukum PKL → Sejarah sekolah."""
    builder.add_bab_heading(
        bab_num, _bab_title("TINJAUAN_PUSTAKA", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})
    sekolah = data.get("sekolah", {})
    nama_sekolah = sekolah.get("nama", "sekolah")

    sub = 1

    # 3.1 Landasan Teori
    builder.add_sub_heading(bab_num, sub, judul.get("landasan_teori", "Landasan Teori"))
    gen_landasan = gen.get("landasan_teori")
    if gen_landasan:
        _write_paragraphs(builder, gen_landasan)
    else:
        builder.add_body(
            "Pelaksanaan Praktik Kerja Lapangan secara tidak langsung akan memberikan "
            "pengetahuan dan pengalaman kerja yang nyata kepada siswa, sekaligus "
            "menjembatani teori yang dipelajari di sekolah dengan praktik di dunia kerja."
        )
    sub += 1

    # 3.2 Asas / dasar hukum pelaksanaan PKL
    asas = data.get("asas_pkl") or DEFAULT_ASAS_PKL
    builder.add_sub_heading(
        bab_num, sub, judul.get("asas_pkl", "Asas Praktik Kerja Lapangan")
    )
    for i, item in enumerate(asas, 1):
        if isinstance(item, str):
            builder.add_numbered(item, i)
            continue
        teks = item.get("teks", "")
        if teks:
            builder.add_numbered(teks, i)
        for s in item.get("sub", []):
            if str(s).strip():
                builder.add_sub_item(str(s).strip(), indent_level=1)
    sub += 1

    # 3.3 Sejarah sekolah
    builder.add_sub_heading(
        bab_num, sub, judul.get("sejarah_sekolah", f"Sejarah {nama_sekolah}")
    )
    _write_paragraphs(
        builder, gen.get("sejarah_sekolah") or sekolah.get("sejarah") or SEJARAH_SMKN4
    )
    sub += 1


# ---------------------------------------------------------------------- #
#  BAB IV — DATA PENGAMATAN (detail + Peralatan & Perlengkapan)           #
# ---------------------------------------------------------------------- #
def _write_data_pengamatan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    """BAB IV: elaborasi detail setiap kegiatan + Peralatan & Perlengkapan Kantor.

    Ini BAB yang paling kaya konten — setiap kegiatan diceritakan secara naratif,
    boleh disertai tabel rincian dan sub-poin (lihat `detail_kegiatan`).
    """
    builder.add_bab_heading(
        bab_num, _bab_title("DATA_PENGAMATAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    siswa = data.get("siswa", {})
    perusahaan = data.get("perusahaan", {})
    kegiatan = data.get("kegiatan", [])
    detail_kegiatan = data.get("detail_kegiatan", [])
    peralatan = data.get("peralatan", [])
    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})

    # Paragraf Pengantar BAB IV DATA PENGAMATAN (Dinamis per Jurusan & Tempat PKL)
    intro_bab4 = gen.get("data_pengamatan_intro")
    if not intro_bab4:
        nama_prsh_full = perusahaan.get("nama_lengkap") or perusahaan.get("nama") or "perusahaan"
        jurusan_str = (siswa.get("jurusan") or "").strip()
        bidang_list = [k.get("bidang", "").strip() for k in kegiatan if isinstance(k, dict) and k.get("bidang")]
        aktivitas_str = ", ".join(bidang_list[:3]) if bidang_list else "aktivitas operasional harian"
        jurusan_phrase = f"bidang {jurusan_str}" if jurusan_str else "kompetensi keahlian kejuruan"
        intro_bab4 = (
            f"Bab ini menjelaskan hasil pengamatan dan pengalaman kerja yang diperoleh Penulis "
            f"selama pelaksanaan Praktik Kerja Lapangan (PKL) di {nama_prsh_full}. "
            f"Data pengamatan disusun berdasarkan seluruh aktivitas dan tugas kerja nyata yang dilaksanakan Penulis "
            f"dalam {jurusan_phrase}, meliputi {aktivitas_str}. "
            f"Seluruh temuan dan rincian pekerjaan tersebut menjadi dasar utama dalam penyusunan laporan ini."
        )
    _write_paragraphs(builder, intro_bab4)
    builder.add_spacing(1)

    sub = 1

    if detail_kegiatan:
        # Satu sub-bab naratif: tiap kegiatan jadi item bernomor dengan blok isi.
        builder.add_sub_heading(
            bab_num, sub,
            judul.get("pelaksanaan_kegiatan", "Pelaksanaan Kegiatan PKL di Tempat Kerja"),
        )
        intro = gen.get("pelaksanaan_intro")
        if intro:
            _write_paragraphs(builder, intro)
        for i, dk in enumerate(detail_kegiatan, 1):
            judul_dk = dk.get("judul", f"Kegiatan {i}")
            builder.add_numbered(judul_dk, i)
            _write_blocks(builder, dk.get("blocks", []))
        sub += 1
    elif not kegiatan:
        builder.add_body("Penulis belum mencatat kegiatan pengamatan secara spesifik.")
    else:
        for i, k in enumerate(kegiatan, 1):
            # Bidang bisa kosong (jawaban vague sudah di-scrub) → judul generik.
            bidang = (k.get("bidang") or f"Kegiatan {i}").title()
            builder.add_sub_heading(bab_num, sub, bidang)

            desk = k.get("deskripsi_umum", "").strip()
            if desk:
                desk_clean = _polish_task_detail(desk)
                builder.add_body(desk_clean)

            tugas = k.get("tugas", [])
            if tugas:
                for j, t in enumerate(tugas):
                    nama_raw = t.get("nama_tugas") or t.get("nama") or f"Tugas {j+1}"
                    clean_nama = re.sub(r"^[□▪•\-\d+\.\)\s]+", "", str(nama_raw)).strip()
                    nama = _polish_task_detail(clean_nama or str(nama_raw).strip())
                    if nama.endswith('.'):
                        nama = nama[:-1]  # Judul sub-poin bold tanpa titik di akhir
                    detail = (t.get("detail") or "").strip()
                    letter = _LETTERS[j % 26]

                    # Sub-poin a., b., c. (Bold)
                    builder.add_lettered(nama, letter, indent_level=0, bold=True)
                    if detail:
                        # Detail narasi sejajar di bawah huruf awal judul sub-poin (Indent 1.27 cm)
                        for para in detail.split("\n"):
                            p_clean = _polish_task_detail(para.strip())
                            if p_clean:
                                builder.add_sub_item(p_clean, indent_level=0)
            sub += 1

    # Sub-bab Studi Kasus / Pekerjaan Utama & Dokumentasi Asset
    studi_kasus = data.get("studi_kasus", {})
    if isinstance(studi_kasus, dict):
        sk_judul = (studi_kasus.get("judul") or "").strip()
        sk_assets = studi_kasus.get("assets", [])
        sk_proses = (gen.get("studi_kasus_proses") or studi_kasus.get("proses_atau_formula") or "").strip()
        sk_latar = (studi_kasus.get("latar_belakang") or "").strip()
        sk_hasil = (studi_kasus.get("hasil") or "").strip()

        if sk_judul or sk_assets or sk_proses or sk_latar or sk_hasil:
            sub_title = judul.get(
                "studi_kasus",
                f"Proses Penyelesaian Studi Kasus ({sk_judul})" if sk_judul else "Proses Penyelesaian Pekerjaan Utama"
            )
            builder.add_sub_heading(bab_num, sub, sub_title)

            if sk_latar:
                _write_paragraphs(builder, _polish_task_detail(sk_latar))

            if sk_proses:
                _write_paragraphs(builder, _polish_task_detail(sk_proses))

            if sk_hasil:
                _write_paragraphs(builder, _polish_task_detail(sk_hasil))

            # Render seluruh gambar asset studi kasus yang valid
            for idx, a_file in enumerate(sk_assets, 1):
                if isinstance(a_file, str) and a_file and _image_file_exists(a_file):
                    _render_image_with_caption(builder, data, f"studi_kasus_{idx}")

            sub += 1

    # Sub-bab Peralatan & Perlengkapan Kantor
    if peralatan:
        builder.add_sub_heading(
            bab_num, sub, judul.get("peralatan", "Jenis Peralatan dan Perlengkapan Kantor")
        )
        builder.add_body(gen.get("peralatan_intro") or (
            "Berikut adalah peralatan dan perlengkapan kantor yang digunakan "
            "selama pelaksanaan Praktik Kerja Lapangan:"
        ))
        for idx, p in enumerate(peralatan, 1):
            nama_p = p.get("nama", f"Peralatan {idx}")
            deskripsi_p = p.get("deskripsi", "")
            gambar_p = p.get("gambar", "")
            builder.add_numbered(nama_p, idx)
            if gambar_p:
                _render_image_with_caption(builder, data, f"peralatan_{idx}")
            if deskripsi_p:
                for para in deskripsi_p.split("\n"):
                    p_clean = para.strip()
                    if p_clean:
                        p_clean = _polish_task_detail(p_clean)
                        builder.add_sub_item(p_clean, indent_level=0)
        sub += 1


# ---------------------------------------------------------------------- #
#  BAB V — PEMBAHASAN (sesuai Panduan SMKN4 TP 2026-2027)                  #
#  Sub-bab tunggal: "Hal-hal yang Perlu Diperhatikan" — peningkatan        #
#  kompetensi yang dikuasai selama PKL, mengacu standar industri.          #
# ---------------------------------------------------------------------- #
def _write_pembahasan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(
        bab_num, _bab_title("PEMBAHASAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    judul = data.get("judul_override", {})
    sub = 1

    # Catatan: data kendala/solusi TIDAK ditampilkan di dokumen lagi.
    # Panduan SMKN4 Bandar Lampung hanya mendefinisikan BAB V sebagai
    # "hal-hal yang perlu diperhatikan dalam peningkatan kompetensi mengacu
    # standar industri" — tanpa sub-bab Hambatan/Solusi. Data kendala user
    # tetap tersimpan di DB (tidak dihapus), hanya tidak dicetak.

    # Satu-satunya sub-bab BAB V: Hal-hal yang Perlu Diperhatikan.
    gen_pembahasan = data.get("generated_sections", {}).get("pembahasan")
    builder.add_sub_heading(
        bab_num, sub, judul.get("pembahasan_utama", "Hal-hal yang Perlu Diperhatikan")
    )
    if gen_pembahasan:
        _write_paragraphs(builder, gen_pembahasan)
    else:
        # Fallback deterministik kalau AI belum generate / provider mati.
        siswa = data.get("siswa", {})
        perusahaan = data.get("perusahaan", {})
        jurusan = (siswa.get("jurusan") or "").strip()
        nama_prsh = perusahaan.get("nama", "perusahaan")
        sebagai = f"kompetensi keahlian {jurusan}" if jurusan else "kompetensi keahlian"
        builder.add_body(
            f"Selama pelaksanaan Praktik Kerja Lapangan di {nama_prsh}, Penulis "
            f"memperhatikan beberapa hal penting dalam proses peningkatan {sebagai} "
            f"yang dikuasai, dengan mengacu pada standar kerja yang ditetapkan oleh "
            f"{nama_prsh}. Hal-hal tersebut mencakup kedisiplinan, ketelitian dalam "
            f"menjalankan prosedur kerja, serta penerapan standar keamanan dan "
            f"kualitas yang berlaku di lingkungan industri."
        )
        builder.add_body(
            "Pengalaman ini menunjukkan bahwa peningkatan kompetensi tidak hanya "
            "bergantung pada penguasaan teknis, tetapi juga pada kesungguhan "
            "mengikuti standar yang berlaku di tempat kerja."
        )
    sub += 1


# ---------------------------------------------------------------------- #
#  BAB VI — KESIMPULAN DAN SARAN                                          #
# ---------------------------------------------------------------------- #
def _write_kesimpulan_saran(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    judul = data.get("judul_override", {})
    builder.add_bab_heading(
        bab_num, _bab_title("KESIMPULAN_SARAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    sub = 1

    # Kesimpulan & Saran from AI (format bertanda [KESIMPULAN] / [SARAN] atau list/string)
    gen_kesimpulan = data.get("generated_sections", {}).get("kesimpulan_saran")
    if gen_kesimpulan:
        gen_kesimpulan_str = _ensure_str(gen_kesimpulan)
        if "[KESIMPULAN]" in gen_kesimpulan_str or "[SARAN]" in gen_kesimpulan_str:
            for para in gen_kesimpulan_str.split("\n"):
                para_str = para.strip()
                if not para_str:
                    continue
                if para_str == "[KESIMPULAN]":
                    builder.add_sub_heading(bab_num, sub, judul.get("kesimpulan", "Kesimpulan"))
                    sub += 1
                elif para_str == "[SARAN]":
                    builder.add_sub_heading(bab_num, sub, judul.get("saran", "Saran"))
                    sub += 1
                else:
                    builder.add_body(para_str)
            return
        elif isinstance(gen_kesimpulan, list):
            builder.add_sub_heading(bab_num, sub, judul.get("kesimpulan", "Kesimpulan"))
            sub += 1
            # 2 item pertama = kesimpulan, sisanya = saran
            kes_items = [x for x in gen_kesimpulan if "disarankan" not in str(x).lower() and "saran" not in str(x).lower()]
            sar_items = [x for x in gen_kesimpulan if "disarankan" in str(x).lower() or "saran" in str(x).lower()]
            if not kes_items:
                kes_items = gen_kesimpulan[:2]
                sar_items = gen_kesimpulan[2:]

            for i, k in enumerate(kes_items, 1):
                clean_k = _sanitize_ai_output(k)
                if clean_k:
                    builder.add_numbered(clean_k, i)

            builder.add_sub_heading(bab_num, sub, judul.get("saran", "Saran"))
            sub += 1
            for i, s in enumerate(sar_items or gen_kesimpulan[2:], 1):
                clean_s = _sanitize_ai_output(s)
                if clean_s:
                    builder.add_lettered(clean_s, _LETTERS[(i - 1) % 26] + ".")
            return

    # --- Kesimpulan ---
    builder.add_sub_heading(bab_num, sub, judul.get("kesimpulan", "Kesimpulan"))
    kesimpulan_user = _ensure_str(data.get("kesimpulan_user")).strip()
    if kesimpulan_user:
        _write_paragraphs(builder, kesimpulan_user)
    else:
        builder.add_body(
            "Berdasarkan pelaksanaan Praktik Kerja Lapangan, dapat ditarik kesimpulan "
            "sebagai berikut:"
        )
        defaults_kesimpulan = [
            "Praktik Kerja Lapangan memberikan pengalaman nyata mengenai situasi kerja "
            "di dunia industri yang sesungguhnya.",
            "Penulis dapat menerapkan berbagai teori yang telah dipelajari di sekolah "
            "secara langsung dalam pekerjaan nyata.",
            "Kegiatan ini melatih kedisiplinan dan tanggung jawab Penulis dalam "
            "melaksanakan tugas-tugas yang diberikan.",
        ]
        for i, s in enumerate(defaults_kesimpulan, 1):
            builder.add_numbered(s, i)
    sub += 1

    # --- Saran ---
    builder.add_sub_heading(bab_num, sub, judul.get("saran", "Saran"))
    saran_items = data.get("saran_items") or []
    saran_user = _ensure_str(data.get("saran_user")).strip()
    if saran_items:
        builder.add_body(
            data.get("saran_intro") or "Adapun saran yang dapat Penulis sampaikan adalah:"
        )
        # Saran ditulis a. b. c. sesuai aturan enumerasi laporan.
        for i, s in enumerate(saran_items):
            clean_s = str(s).strip()
            if clean_s:
                clean_s = clean_s[0].upper() + clean_s[1:]
                builder.add_lettered(clean_s, _LETTERS[i % 26] + ".")
    elif saran_user:
        _write_paragraphs(builder, saran_user)
    else:
        builder.add_body("Adapun saran yang dapat Penulis sampaikan adalah:")
        defaults_saran = [
            "Bagi siswa yang akan melaksanakan PKL, persiapkan diri dengan mempelajari "
            "lebih dalam materi yang berkaitan dengan industri terkait.",
            "Bagi sekolah, agar terus menjalin hubungan baik dengan pihak industri demi "
            "kelancaran program PKL di masa mendatang.",
        ]
        for i, s in enumerate(defaults_saran, 1):
            builder.add_numbered(s, i)
    sub += 1


# ======================================================================== #
#  Helpers                                                                  #
# ======================================================================== #

def _normalize_modules(bab_modules: list[str] | None) -> list[str]:
    """Ubah daftar modul apa pun menjadi nama kanonik berurutan.

    Menangani tiga hal sekaligus:
      1. Alias — `PELAKSANAAN` → `KEGIATAN_INDUSTRI`, dst.
      2. Duplikat — dua alias bisa menunjuk modul yang sama.
      3. Urutan — BAB selalu mengikuti ALL_BAB_MODULES, sehingga urutan acak
         dari frontend tidak membuat BAB tertukar.

    Modul yang tidak dikenal tetap diteruskan agar pemanggil bisa mencatatnya
    di log, bukan dibuang diam-diam di sini.
    """
    if not bab_modules:
        return list(ALL_BAB_MODULES)

    canonical: set[str] = set()
    unknown: list[str] = []

    for raw in bab_modules:
        if not isinstance(raw, str):
            unknown.append(str(raw))
            continue

        key = raw.strip().upper().replace(" ", "_").replace("-", "_")

        if key in MODULE_ALIASES:
            mapped = MODULE_ALIASES[key]
            if mapped is None:
                # Konsep valid, tapi tidak menghasilkan BAB terpisah.
                logger.debug("Modul %r menyatu ke BAB lain, tidak ditulis sendiri", key)
                continue
            key = mapped

        if key in ALL_BAB_MODULES:
            canonical.add(key)
        else:
            unknown.append(raw)

    ordered = [m for m in ALL_BAB_MODULES if m in canonical]

    # PENDAHULUAN adalah syarat minimum sebuah laporan. Kalau tidak ada modul
    # yang bisa dikenali sama sekali, lebih baik pakai struktur lengkap
    # daripada menghasilkan dokumen kosong.
    if not ordered:
        logger.warning(
            "Tidak ada modul BAB yang dikenali dari %r — memakai struktur lengkap",
            bab_modules,
        )
        return list(ALL_BAB_MODULES)

    return ordered + unknown


def _auto_select_modules(data: dict) -> list[str]:
    """Default module order mengikuti struktur Niken."""
    modules = data.get("recommended_bab", [])
    if not modules:
        modules = list(ALL_BAB_MODULES)
    return modules
