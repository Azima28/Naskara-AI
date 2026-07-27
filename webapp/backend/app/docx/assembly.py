"""Assembler laporan PKL — kodifikasi referensi Niken LAPORAN PKL FIXED.docx.

Fungsi utama: `assemble_report(data)` menerima PklContext dict dan menghasilkan
file .docx utuh dengan urutan PERSIS dokumen Niken:
  Cover → Cover dalam → Pengesahan → Identitas → Kata Pengantar → BAB (arabic)

Struktur BAB mengikuti Niken:
  BAB I   PENDAHULUAN      (Latar Belakang, Tujuan, Sejarah Perusahaan, Visi Misi,
                             Profil Lokasi, Tata Tertib, Struktur Organisasi, Job Desc)
  BAB II  PROSES KEGIATAN  (ringkasan tugas per-divisi, singkat)
  BAB III TINJAUAN PUSTAKA (Sejarah SMKN 4, Landasan Hukum)
  BAB IV  DATA PENGAMATAN  (detail cerita kegiatan + Peralatan & Perlengkapan)
  BAB V   PEMBAHASAN       (Hambatan, Solusi, Pembelajaran)
  BAB VI  PENUTUP          (Kesimpulan, Saran)
"""
from __future__ import annotations

import logging
import os
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
#
# Nilai None = konsep valid tetapi tidak menghasilkan BAB terpisah.
# PROFIL_PERUSAHAAN isinya sudah menyatu di BAB I (sub-bab 1.3–1.8), mengikuti
# struktur dokumen Niken.
MODULE_ALIASES: dict[str, str | None] = {
    "PELAKSANAAN": "KEGIATAN_INDUSTRI",
    "PROSES_KEGIATAN": "KEGIATAN_INDUSTRI",
    "LANDASAN_TEORI": "TINJAUAN_PUSTAKA",
    "PENUTUP": "KESIMPULAN_SARAN",
    "KESIMPULAN": "KESIMPULAN_SARAN",
    "HAMBATAN": "PEMBAHASAN",
    "PROFIL_PERUSAHAAN": None,
}

# Roman numerals for BAB numbering.
_ROMANS = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII"}

# Judul default tiap modul BAB: (judul pedoman, judul legacy, key judul_override).
# Pedoman 1.7.1: "Kegiatan di Industri", "Kesimpulan dan Saran" — legacy meniru
# dokumen lama.
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
            penulis = r.get("penulis", "").strip()
            tahun = r.get("tahun", "").strip()
            judul = r.get("judul", "").strip()
            sumber = r.get("sumber", "").strip()
            url = r.get("url", "").strip()
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
            if not _try_image(builder, foto["gambar"], width_cm=14):
                continue
            keterangan = (foto.get("keterangan") or "").strip()
            p = builder.add_body(keterangan or f"Dokumentasi kegiatan {idx}.")
            # Target PAGEREF untuk Daftar Lampiran (preset pedoman).
            builder.attach_bookmark(p, f"lamp_{idx}")
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

    # Populate native TOC in docx with exact pre-calculated page numbers
    sec_list = _generate_sections_list(builder, data)
    builder.populate_native_toc(sec_list)

    builder.save(output_path)
    return output_path


def _generate_sections_list(builder: PklDocBuilder, data: dict) -> list[tuple[str, str, int]]:
    cfg = data.get("config", {})
    preset = cfg.get("preset") or "pedoman"
    start_num = cfg.get("front_matter_start") if cfg.get("front_matter_start") is not None else 1
    
    romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"]
    def get_roman(idx):
        return romans[idx - 1] if 1 <= idx <= len(romans) else str(idx)
        
    curr_r = start_num
    sek_nama = (data.get("sekolah", {}).get("nama") or "SMK NEGERI 4 BANDAR LAMPUNG").upper()
    perus_nama = (data.get("perusahaan", {}).get("nama") or "PT. NETWORK SOLUTION UTAMA BANDAR LAMPUNG").upper()
    
    sections: list[tuple[str, str, int]] = []
    sections.append(("PENGESAHAN", get_roman(curr_r), 1))
    sections.append((perus_nama, get_roman(curr_r), 1))
    curr_r += 1
    
    sections.append(("PENGESAHAN", get_roman(curr_r), 1))
    sections.append((sek_nama, get_roman(curr_r), 1))
    curr_r += 1
    
    sections.append(("IDENTITAS SISWA", get_roman(curr_r), 1))
    curr_r += 1
    
    sections.append(("IDENTITAS INDUSTRI / INSTANSI", get_roman(curr_r), 1))
    curr_r += 1
    
    sections.append(("KATA PENGANTAR", get_roman(curr_r), 1))
    curr_r += 2
    
    curr_r += 2  # DAFTAR ISI 2 halaman
    
    sections.append(("DAFTAR GAMBAR", get_roman(curr_r), 1))
    curr_r += 1
    
    sections.append(("DAFTAR LAMPIRAN", get_roman(curr_r), 1))
    
    sections.append(("BAB I PENDAHULUAN", "1", 1))
    sections.append(("1.1 Latar Belakang", "1", 2))
    sections.append(("1.2 Tujuan Kegiatan Praktik Kerja Lapangan", "1", 2))
    sections.append(("a) Profil Lokasi Praktik Kerja Lapangan", "2", 3))
    sections.append(("1.3 Tata Tertib Perusahaan", "2", 2))
    sections.append(("a) Waktu Kerja dan Istirahat Kerja", "2", 3))
    sections.append(("b) Tata Tertib dan Kewajiban Karyawan", "3", 3))
    
    sections.append(("BAB II KEGIATAN DI INDUSTRI", "4", 1))
    sections.append(("2.1 Proses Kegiatan Selama PKL", "4", 2))
    
    sections.append(("BAB III TINJAUAN PUSTAKA", "5", 1))
    sections.append(("3.1 Landasan Teori", "5", 2))
    sections.append(("3.2 Asas Praktik Kerja Lapangan", "5", 2))
    sections.append(("3.3 Sejarah " + sek_nama, "5", 2))
    
    sections.append(("BAB IV DATA PENGAMATAN", "7", 1))
    sections.append(("4.1 Pelaksanaan Kegiatan PKL di Tempat Kerja", "7", 2))
    sections.append(("4.2 Jenis Peralatan dan Perlengkapan Kantor", "7", 2))
    
    sections.append(("BAB V PEMBAHASAN", "10", 1))
    sections.append(("5.1 Hal-hal yang Perlu Diperhatikan", "10", 2))
    
    sections.append(("BAB VI KESIMPULAN DAN SARAN", "11", 1))
    sections.append(("6.1 Kesimpulan", "11", 2))
    sections.append(("6.2 Saran", "11", 2))
    
    sections.append(("DAFTAR PUSTAKA", "12", 1))
    sections.append(("LAMPIRAN", "13", 1))
    
    return sections


# ======================================================================== #
#  Sanitization & Helpers                                                   #
# ======================================================================== #

def _clean_markdown(text: str) -> str:
    """Bersihkan sintaks markdown yang sering di-output oleh AI seperti **Paragraf 1** atau ## Header."""
    if not text:
        return ""
    # Hapus penanda paragraf buatan AI seperti **Paragraf 1**
    text = re.sub(r'^\s*\*\*\s*Paragraf\s*\d+\s*\*\*\s*', '', text, flags=re.MULTILINE | re.IGNORECASE)
    # Hapus simbol header markdown ###
    text = re.sub(r'^\s*#{1,6}\s*', '', text, flags=re.MULTILINE)
    # Ubah **bold** menjadi teks biasa
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    # Ubah *italic* menjadi teks biasa
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    return text.strip()


def _write_paragraphs(builder: PklDocBuilder, text: str) -> None:
    """Tulis blok teks multi-baris sebagai beberapa paragraf body."""
    clean_text = _clean_markdown(text)
    for para in (clean_text or "").split("\n"):
        if para.strip():
            builder.add_body(para.strip())


def _try_image(builder: PklDocBuilder, filename: str, width_cm: float = 10) -> bool:
    """Sisipkan gambar dari uploads/assets atau smkn4_assets cadangan."""
    if not filename:
        return False
    candidates = [
        filename,
        str(UPLOADS_DIR / "assets" / filename),
        os.path.join(os.path.dirname(__file__), "smkn4_assets", filename),
        os.path.join(os.path.dirname(__file__), "smkn4_assets", f"image{abs(hash(filename)) % 15 + 1}.jpeg"),
        os.path.join(os.path.dirname(__file__), "smkn4_assets", "image10.jpeg"),
    ]
    for cand in candidates:
        if cand and os.path.exists(cand):
            try:
                builder.add_image(cand, width_cm=width_cm)
                return True
            except Exception:
                pass
    return False


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
                letter = _LETTERS[item_counter % 26] + ")"
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


def _sanitize_data(data: dict) -> None:
    # Buang jawaban vague & rapikan spasi di semua field.
    _scrub_vague(data)

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
    data["pelajaran"] = [p for p in data.get("pelajaran", []) if p and len(p) > 3]
    data["kendala"] = [
        k for k in data.get("kendala", [])
        if isinstance(k, dict) and len(k.get("masalah", "")) > 3
    ]
    if isinstance(data.get("profil_perusahaan"), dict):
        profil = data["profil_perusahaan"]
        profil["misi"] = [m for m in profil.get("misi", []) if m]
        profil["tata_tertib"] = [t for t in profil.get("tata_tertib", []) if t]

    # Kegiatan: buang tugas kosong; buang bidang yang tidak punya tugas DAN
    # tidak punya deskripsi (bidang disebut tapi tidak ada isinya → jangan
    # jadi sub-bab kosong).
    valid_kegiatan = []
    for k in data.get("kegiatan", []):
        if not isinstance(k, dict):
            continue
        k["tugas"] = [
            t for t in k.get("tugas", [])
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
    builder.add_cover(data)

    # Cover dalam (identik cover luar)
    builder.add_page_break()
    builder.add_cover(data)

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
    peralatan = [p for p in data.get("peralatan", []) if p.get("gambar")]
    foto_lampiran = [
        f for f in (data.get("lampiran", {}) or {}).get("foto_kegiatan", [])
        if isinstance(f, dict) and f.get("gambar")
    ]

    # Daftar Gambar — merujuk caption "Gambar <bab>. <n>" pada peralatan.
    if peralatan:
        bab_modules = data.get("config", {}).get("bab_modules") or list(ALL_BAB_MODULES)
        normalized = [m for m in _normalize_modules(bab_modules) if m in ALL_BAB_MODULES]
        bab_dp = (
            normalized.index("DATA_PENGAMATAN") + 1
            if "DATA_PENGAMATAN" in normalized else 4
        )
        builder.add_page_break()
        builder._heading("DAFTAR GAMBAR", bookmark="daftar_gambar")
        builder.add_spacing(1)
        for i, p in enumerate(peralatan, 1):
            nama_p = p.get("nama", f"Peralatan {i}")
            builder.add_toc_entry(f"Gambar {bab_dp}. {i} {nama_p}", f"gambar_{i}", 1)

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
    """Tulis semua BAB berurutan mengikuti struktur Niken."""
    writers = {
        "PENDAHULUAN": _write_pendahuluan,
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
#  BAB I — PENDAHULUAN + PROFIL PERUSAHAAN                               #
#  (Mengikuti struktur Niken: Latar Belakang, Tujuan,                    #
#   Sejarah Singkat, Visi&Misi, Profil Lokasi, Tata Tertib,             #
#   Bagan Struktur, Job Description)                                     #
# ---------------------------------------------------------------------- #
def _write_pendahuluan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(
        bab_num, _bab_title("PENDAHULUAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    siswa = data.get("siswa", {})
    perusahaan = data.get("perusahaan", {})
    profil = data.get("profil_perusahaan", {})
    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})

    # Nama perusahaan dipakai di banyak sub-bab di bawah, jadi diikat sekali di
    # sini. (Dulu hanya di-assign di cabang else latar belakang, sehingga
    # laporan dengan latar belakang hasil AI crash: UnboundLocalError.)
    nama_prsh = perusahaan.get("nama") or "[Perusahaan]"
    nama_prsh_full = perusahaan.get("nama_lengkap") or nama_prsh

    sub = 1

    # 1.1 Latar Belakang
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
        # Frasa jurusan hanya disebut kalau datanya ada.
        sebagai = f"sebagai siswa kompetensi keahlian {jurusan}" if jurusan else "sebagai siswa SMK"
        builder.add_body(
            f"Penulis melaksanakan Praktik Kerja Lapangan di {nama_prsh} "
            f"{sebagai}. Melalui kegiatan ini, Penulis "
            f"dapat menerapkan ilmu yang telah dipelajari di sekolah ke dalam praktik "
            f"kerja nyata di lingkungan industri yang sesungguhnya."
        )
    sub += 1

    # 1.2 Tujuan Kegiatan Praktik Kerja Lapangan
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

    # 1.3 Sejarah Singkat Perusahaan (+ Visi/Misi & Profil Lokasi sebagai sub-sub)
    sejarah = profil.get("sejarah", "")
    logo = profil.get("logo_perusahaan", "")
    if sejarah or logo:
        builder.add_sub_heading(bab_num, sub, f"Sejarah Singkat {nama_prsh_full}")
        if sejarah:
            _write_paragraphs(builder, sejarah)
        # Logo ditempatkan setelah narasi sejarah, tanpa caption — mengikuti
        # tata letak dokumen referensi.
        if logo:
            _try_image(builder, logo, width_cm=6)
        sub += 1

    sub3 = 0  # penomoran a) b) c) untuk sub-sub bab di bawah 1.3

    # a) Visi dan Misi
    visi = profil.get("visi", "")
    misi = profil.get("misi", [])
    if visi or misi:
        sub3 += 1
        builder.add_sub_heading_3(f"{_LETTERS[sub3 - 1]}) Visi dan Misi")
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

    # b) Profil Lokasi Praktik Kerja Lapangan (+ daftar area/cabang)
    alamat = perusahaan.get("alamat", "")
    area_cabang = profil.get("area_cabang", [])
    if alamat or area_cabang:
        sub3 += 1
        builder.add_sub_heading_3(
            f"{_LETTERS[sub3 - 1]}) Profil Lokasi Praktik Kerja Lapangan"
        )
        lokasi = profil.get("profil_lokasi")
        if lokasi:
            _write_paragraphs(builder, lokasi)
        elif alamat:
            builder.add_body(f"{nama_prsh_full} beralamat di {alamat}.")
        for idx_a, area in enumerate(area_cabang):
            nama_area = (area or {}).get("nama_area", "").strip()
            if nama_area:
                # Bersihkan karakter simbol aneh (seperti '' atau '□') di awal teks
                nama_area_clean = re.sub(r'^[^\w\s]+', '', nama_area).strip()
                if nama_area_clean:
                    marker = _LETTERS[idx_a % 26] + "."
                    builder.add_lettered(nama_area_clean, marker, indent_level=0, bold=True)
            for idx_c, cab in enumerate((area or {}).get("cabang", []), 1):
                nama_cab = cab.get("nama", "") if isinstance(cab, dict) else str(cab)
                if nama_cab.strip():
                    builder.add_numbered(nama_cab.strip(), idx_c, indent_level=1)

    # 1.4 Tata Tertib Perusahaan (Selalu gunakan 8 aturan resmi SMKN 4 dari referensi_PKL)
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
    tata_tertib = OFFICIAL_SMKN4_TATA_TERTIB
    jam_kerja = data.get("jam_kerja") or profil.get("jam_kerja") or []
    if tata_tertib or jam_kerja:
        builder.add_sub_heading(bab_num, sub, judul.get("tata_tertib", "Tata Tertib Perusahaan"))
        builder.add_body(profil.get("tata_tertib_intro") or (
            f"Tata Tertib {nama_prsh_full}, tata tertib yang diberikan perusahaan bertujuan "
            f"untuk menciptakan lingkungan kerja yang kondusif, efisien, dan profesional."
        ))
        tt_sub = 0
        if jam_kerja:
            tt_sub += 1
            builder.add_sub_heading_3(
                f"{_LETTERS[tt_sub - 1]}) Waktu Kerja dan Istirahat Kerja"
            )
            builder.add_body(
                profil.get("jam_kerja_intro") or f"Jadwal kerja yang ada di {nama_prsh}:"
            )
            builder.add_table(*_jam_kerja_table(jam_kerja))
            builder.add_spacing(1)

        if tata_tertib:
            tt_sub += 1
            builder.add_sub_heading_3(
                f"{_LETTERS[tt_sub - 1]}) Tata Tertib dan Kewajiban Karyawan"
            )
            builder.add_body(
                profil.get("tata_tertib_list_intro")
                or f"Berikut adalah tata tertib dan kewajiban karyawan {nama_prsh}:"
            )
            for i, tt in enumerate(tata_tertib, 1):
                builder.add_numbered(tt, i)
        sub += 1

    # 1.5 Bagan Struktur Organisasi
    struktur = profil.get("struktur_organisasi", "")
    if struktur:
        builder.add_sub_heading(bab_num, sub, f"Bagan Struktur {nama_prsh}")
        builder.add_body(
            profil.get("bagan_intro") or f"Berikut adalah struktur organisasi {nama_prsh}:"
        )
        if not _try_image(builder, struktur, width_cm=14):
            builder.add_body(f"[GAMBAR STRUKTUR ORGANISASI: {struktur}]")
        # Narasi manfaat struktur menyusul gambarnya.
        narasi = profil.get("narasi_struktur") or gen.get("narasi_struktur")
        if narasi:
            _write_paragraphs(builder, narasi)
        sub += 1

    # 1.6 Job Description
    job_descs = profil.get("job_descriptions", [])
    if job_descs:
        # Job desc menyebut unit kerja tempat PKL — nama badan hukum + cabang.
        nama_cabang = perusahaan.get("nama_cabang") or nama_prsh_full
        builder.add_sub_heading(bab_num, sub, f"Job Description {nama_cabang}")
        builder.add_body(f"Berikut tugas dan tanggung jawab karyawan {nama_cabang}:")
        for idx, jd in enumerate(job_descs):
            posisi = jd.get("posisi", "")
            if posisi:
                builder.add_lettered(posisi, _LETTERS[idx % 26] + ")")
            for i, t in enumerate([x for x in jd.get("tugas", []) if x.strip()], 1):
                builder.add_numbered(t.strip(), i, indent_level=1)
        sub += 1


# ---------------------------------------------------------------------- #
#  BAB II — PROSES KEGIATAN (ringkasan singkat per divisi)               #
# ---------------------------------------------------------------------- #
def _write_kegiatan_industri(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    """BAB II: ringkasan proses kegiatan per divisi (poin-poin singkat).

    Berbeda dengan BAB IV (detail cerita). Di sini hanya garis besar.
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
            builder.add_lettered(bidang, _LETTERS[idx % 26] + ")", bold=True)
            builder.add_body(
                k.get("deskripsi_umum")
                or f"Adapun tugas yang penulis kerjakan dalam bidang {bidang} adalah:"
            )

        n = 0
        for t in tugas_list:
            nama_tugas = t.get("nama_tugas") or t.get("nama") or ""
            if nama_tugas.strip():
                n += 1
                builder.add_numbered(nama_tugas.strip(), n, indent_level=1)


# ---------------------------------------------------------------------- #
#  BAB III — TINJAUAN PUSTAKA                                            #
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
#  BAB IV — DATA PENGAMATAN (detail + Peralatan & Perlengkapan)          #
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

    kegiatan = data.get("kegiatan", [])
    detail_kegiatan = data.get("detail_kegiatan", [])
    peralatan = data.get("peralatan", [])
    gen = data.get("generated_sections", {})
    judul = data.get("judul_override", {})

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

            desk = k.get("deskripsi_umum", "")
            if desk:
                builder.add_body(desk)

            tugas = k.get("tugas", [])
            if tugas:
                for j, t in enumerate(tugas):
                    nama = t.get("nama_tugas") or t.get("nama") or f"Tugas {j+1}"
                    detail = t.get("detail", "")
                    # Tugas ditulis sebagai sub-sub heading atau bold nama lalu narasi
                    if detail and len(detail) > 20:
                        builder.add_body(nama, bold=True)
                        builder.add_body(detail)
                    else:
                        line = f"{nama}"
                        if detail:
                            line += f": {detail}"
                        builder.add_lettered(line, _LETTERS[j % 26])
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
            if gambar_p and _try_image(builder, gambar_p, width_cm=10):
                # Nomor gambar mengikuti BAB: "Gambar 4. 1", "Gambar 4. 2", ...
                # Bookmark = target PAGEREF di Daftar Gambar (preset pedoman).
                builder.add_caption(f"Gambar {bab_num}. {idx}", bookmark=f"gambar_{idx}")
            if deskripsi_p:
                builder.add_body(deskripsi_p)
        sub += 1


# ---------------------------------------------------------------------- #
#  BAB V — PEMBAHASAN (Hambatan, Solusi, Pembelajaran)                   #
# ---------------------------------------------------------------------- #
def _write_pembahasan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(
        bab_num, _bab_title("PEMBAHASAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    judul = data.get("judul_override", {})
    sub = 1

    kendala = data.get("kendala", [])

    # Hambatan — hanya ditulis kalau memang ada kendala yang dicatat. Menulis
    # sub-bab "tidak ada hambatan" cuma menambah bab kosong.
    if kendala:
        builder.add_sub_heading(bab_num, sub, judul.get("hambatan", "Hambatan yang Dialami"))
        builder.add_body(
            "Dalam pelaksanaan Praktik Kerja Lapangan, Penulis menghadapi beberapa "
            "hambatan, antara lain:"
        )
        for i, k in enumerate(kendala, 1):
            m = k.get("masalah", "")
            if m:
                builder.add_numbered(m, i)
        sub += 1

        # Solusi / Pemecahan Masalah
        builder.add_sub_heading(bab_num, sub, judul.get("pemecahan", "Pemecahan Masalah"))
        builder.add_body(
            "Untuk mengatasi hambatan di atas, Penulis melakukan langkah-langkah "
            "sebagai berikut:"
        )
        for i, k in enumerate(kendala, 1):
            s = k.get("solusi", "")
            if s:
                builder.add_numbered(s, i)
        sub += 1

    # Pembelajaran / Refleksi
    gen_pembahasan = data.get("generated_sections", {}).get("pembahasan")
    builder.add_sub_heading(
        bab_num, sub, judul.get("pembahasan_utama", "Hal-hal yang Perlu Diperhatikan")
    )
    if gen_pembahasan:
        _write_paragraphs(builder, gen_pembahasan)
    else:
        pelajaran = data.get("pelajaran", [])
        refleksi = data.get("refleksi", "")
        if pelajaran:
            builder.add_body(
                "Melalui Praktik Kerja Lapangan ini, Penulis memperoleh pembelajaran "
                "sebagai berikut:"
            )
            for i, p in enumerate(pelajaran, 1):
                builder.add_numbered(p, i)
        if refleksi:
            builder.add_body(refleksi)
        if not pelajaran and not refleksi:
            builder.add_body(
                "Selama pelaksanaan Praktik Kerja Lapangan, Penulis memperoleh banyak "
                "pengalaman baru yang tidak diperoleh di bangku sekolah, terutama "
                "mengenai budaya kerja, ketelitian, dan tanggung jawab."
            )
    sub += 1


# ---------------------------------------------------------------------- #
#  BAB VI — PENUTUP (Kesimpulan & Saran)                                #
# ---------------------------------------------------------------------- #
def _write_kesimpulan_saran(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    judul = data.get("judul_override", {})
    builder.add_bab_heading(
        bab_num, _bab_title("KESIMPULAN_SARAN", data), bookmark=f"bab_{bab_num}"
    )
    builder.add_spacing(1)

    sub = 1

    # Kesimpulan & Saran from AI (format bertanda [KESIMPULAN] / [SARAN])
    gen_kesimpulan = data.get("generated_sections", {}).get("kesimpulan_saran")
    if gen_kesimpulan:
        for para in gen_kesimpulan.split("\n"):
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

    # --- Kesimpulan ---
    builder.add_sub_heading(bab_num, sub, judul.get("kesimpulan", "Kesimpulan"))
    kesimpulan_user = (data.get("kesimpulan_user") or "").strip()
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
    saran_user = (data.get("saran_user") or "").strip()
    if saran_items:
        builder.add_body(
            data.get("saran_intro") or "Adapun saran yang dapat Penulis sampaikan adalah:"
        )
        # Saran ditulis a. b. c. sesuai aturan enumerasi laporan.
        for i, s in enumerate(saran_items):
            if str(s).strip():
                builder.add_lettered(str(s).strip(), _LETTERS[i % 26] + ")")
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
