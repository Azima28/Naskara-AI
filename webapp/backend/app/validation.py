"""Lapisan validasi — reuse persis scripts/validate_pkl_data.py yang sudah ada.

Skema sudah lengkap. Tapi ada satu kelonggaran: validator asli return tuple
(positional). Untuk dipakai web/API kita bungkus jadi dataclass + Pydantic
response yang jelas, tapi logika (20-poin skor, tier WAJIB/PENTING/OPSIONAL,
recommend_bab) TIDAK di-duplikasi — dipanggil langsung dari modul asli.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from pydantic import BaseModel

# Import validator asli dari project root (sumber kebenaran).
_PROJECT_ROOT = Path(__file__).resolve().parents[3]   # .../docx_skill_package
_SCRIPTS_DIR = _PROJECT_ROOT / "scripts"
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import validate_pkl_data as _validator  # noqa: E402  (path dimasukkan di atas)


# --------------------------------------------------------------------------- #
#  Deteksi jawaban vague ("gatau", "lupa", "-", "apa aja")                    #
# --------------------------------------------------------------------------- #
# Jawaban seperti ini lolos cek "field terisi" padahal isinya bukan data.
# Tanpa deteksi ini, "gatau" tercetak sampai ke cover dan judul sub-bab.
VAGUE_VALUES = {
    "gatau", "ga tau", "gak tau", "nggak tau", "ngga tau", "tidak tahu",
    "tidak tau", "lupa", "-", "?", "apa aja", "apa saja", "bebas",
    "terserah", "gak inget", "tidak ingat", "belum tau", "belum tahu",
}
# Frasa yang menandakan jawaban bukan data walau lebih panjang.
VAGUE_PATTERNS = ("lupa nama", "gatau ", " gatau", "tidak tahu ", "lupa ")


def is_vague(value: object) -> bool:
    """True jika nilai adalah jawaban mengelak, bukan data sungguhan."""
    if not isinstance(value, str):
        return False
    v = " ".join(value.lower().split())
    if not v:
        return False
    if v in VAGUE_VALUES:
        return True
    # Jawaban pendek yang mengandung frasa mengelak ("ibu ibu lupa namanya",
    # "gatau jalan apa"). Kalimat panjang (>60 char) dianggap konten sungguhan
    # walau mengandung kata itu — mis. cerita "awalnya saya tidak tahu...".
    if len(v) <= 60:
        return any(p in f" {v} " or v.startswith(p) or v.endswith(p.strip())
                   for p in VAGUE_PATTERNS)
    return False


# Field yang diperiksa vague + pertanyaan lanjutan untuk user.
# (path, ambil_nilai, pertanyaan, wajib)
_REQUESTION_CATALOG = [
    ("siswa.nama", lambda d: d.get("siswa", {}).get("nama"),
     "Siapa nama lengkap kamu? Masukkan nama sesuai kartu pelajar atau ijazah.", True),
    ("siswa.nis", lambda d: d.get("siswa", {}).get("nis"),
     "Berapa Nomor Induk Siswa (NIS) kamu? Nama ini akan tercetak di lembar identitas.", True),
    ("siswa.jurusan", lambda d: d.get("siswa", {}).get("jurusan"),
     "Jurusan/kompetensi keahlian kamu apa? (contoh: Akuntansi, TKJ, "
     "Bisnis Daring dan Pemasaran)", True),
    ("sekolah.nama", lambda d: d.get("sekolah", {}).get("nama"),
     "Apa nama sekolah kamu? (contoh: SMKN 4 Bandar Lampung)", True),
    ("pkl.tanggal_mulai", lambda d: d.get("pkl", {}).get("tanggal_mulai"),
     "Kapan tanggal mulai pelaksanaan PKL kamu?", True),
    ("perusahaan.nama", lambda d: d.get("perusahaan", {}).get("nama"),
     "Nama tempat PKL kamu apa? Tulis nama resminya ya (contoh: PT Reksa "
     "Finance, Kantor Pos Cabang Metro).", True),
    ("perusahaan.alamat", lambda d: d.get("perusahaan", {}).get("alamat"),
     "Alamat tempat PKL kamu di mana? Boleh lihat di Google Maps atau papan "
     "nama kantornya.", False),
    ("perusahaan.pimpinan.nama",
     lambda d: d.get("perusahaan", {}).get("pimpinan", {}).get("nama"),
     "Siapa nama pimpinan/kepala kantor tempat PKL? Kalau tidak yakin, bisa "
     "tanya pembimbing industrimu — nama ini muncul di halaman pengesahan.", False),
    ("perusahaan.pembimbing_industri.nama",
     lambda d: d.get("perusahaan", {}).get("pembimbing_industri", {}).get("nama"),
     "Siapa nama pembimbing kamu di tempat PKL? Nama ini tercetak di halaman "
     "pengesahan, jadi harus benar ejaannya.", False),
    ("sekolah.pembimbing_sekolah.nama",
     lambda d: d.get("sekolah", {}).get("pembimbing_sekolah", {}).get("nama"),
     "Siapa nama guru pembimbing PKL dari sekolah? (beserta gelar, contoh: "
     "Ibu Sari Utami, S.Pd.)", False),
    ("sekolah.ketua_kk.nama",
     lambda d: d.get("sekolah", {}).get("ketua_kk", {}).get("nama"),
     "Siapa nama ketua kompetensi keahlian (kajur) di sekolahmu?", False),
    ("profil_perusahaan.sejarah",
     lambda d: d.get("profil_perusahaan", {}).get("sejarah"),
     "Ceritakan sedikit sejarah perusahaan tempat PKL — biasanya ada di "
     "website perusahaan atau bisa tanya pembimbing industri. Kalau tidak "
     "ada, sub-bab sejarah akan dilewati.", False),
    ("profil_perusahaan.visi",
     lambda d: d.get("profil_perusahaan", {}).get("visi"),
     "Apa visi perusahaan tempat PKL? Biasanya terpajang di dinding kantor "
     "atau website. Kalau tidak ada, sub-bab visi-misi akan dilewati.", False),
]


class IssueItem(BaseModel):
    field: str
    message: str


class Requestion(BaseModel):
    """Satu pertanyaan lanjutan ke user karena jawabannya vague/kosong."""
    field: str
    current_value: str    # jawaban user sekarang ("gatau", "lupa", "")
    question: str         # pertanyaan yang ditampilkan kembali ke user
    wajib: bool           # True = harus dijawab sebelum generate


class ValidationResult(BaseModel):
    score: int
    max_score: int
    percent: int
    ready: bool                       # True jika tidak ada blocking issue
    blocking: list[IssueItem]         # WAJIB yang kosong
    warnings: list[str]               # PENTING / OPSIONAL / GAP
    requestions: list[Requestion] = []  # pertanyaan ulang untuk jawaban vague


class BabRecommendation(BaseModel):
    modules: list[str]
    reasons: list[str]


# --------------------------------------------------------------------------- #
#  Helpers                                                                    #
# --------------------------------------------------------------------------- #
def run_validation(data: dict[str, Any]) -> ValidationResult:
    """Bungkus _validator.validate() jadi response bertipe.

    Skor/tier persis sama dengan `python scripts/validate_pkl_data.py`.
    """
    score, max_score, issues, warnings = _validator.validate(data)

    # --- Deteksi jawaban vague → pertanyaan ulang -------------------------- #
    requestions: list[Requestion] = []
    for field, getter, question, wajib in _REQUESTION_CATALOG:
        try:
            value = getter(data)
        except Exception:
            value = None
        if is_vague(value):
            requestions.append(Requestion(
                field=field, current_value=str(value), question=question, wajib=wajib,
            ))
            if wajib:
                # Jawaban vague pada field WAJIB setara belum diisi → blocking.
                issues.append(
                    f"❌ WAJIB: {field} kosong — jawaban \"{value}\" belum bisa "
                    f"dipakai, mohon dijawab ulang"
                )

    # --- Lampiran: foto dokumentasi (disarankan, tidak memblokir download) -- #
    lampiran = data.get("lampiran", {}) or {}
    fotos = [
        f for f in lampiran.get("foto_kegiatan", [])
        if isinstance(f, dict) and f.get("gambar")
    ]
    fotos_assets = [
        a for a in data.get("assets", [])
        if isinstance(a, dict) and a.get("type") == "foto" and a.get("filename")
    ]
    if not fotos and not fotos_assets:
        warnings.append(
            "⚠️ PENTING: lampiran.foto_kegiatan belum diisi foto — halaman LAMPIRAN "
            "akan berisi teks dokumentasi terlampir standar"
        )
        requestions.append(Requestion(
            field="lampiran.foto_kegiatan",
            current_value="",
            question="Unggah minimal satu foto dokumentasi kegiatan PKL beserta "
                     "keterangannya (mis. \"Foto bersama karyawan\", \"Melakukan "
                     "kunjungan debitur\") — foto ini tampil di halaman LAMPIRAN.",
            wajib=False,
        ))
    else:
        tanpa_ket = sum(
            1 for f in fotos if not (f.get("keterangan") or "").strip()
        )
        if tanpa_ket:
            warnings.append(
                f"⚠️ PENTING: {tanpa_ket} foto lampiran belum punya keterangan — "
                f"akan diberi keterangan otomatis \"Dokumentasi kegiatan\""
            )

    blocking: list[IssueItem] = []
    for raw in issues:
        # Format asli: "❌ WAJIB: <field> kosong — <alasan>"
        body = raw
        for prefix in ("❌ WAJIB:", "❌ WAJIB ", "WAJIB:"):
            if body.startswith(prefix):
                body = body[len(prefix):].strip()
                break
        # Format asli: "❌ WAJIB: <field> kosong — <alasan>"
        # Bisa juga "❌ WAJIB: <field> kosong" (tanpa alasan).
        if " — " in body:
            field_part, msg_part = body.split(" — ", 1)
        else:
            field_part, msg_part = body, "kosong / belum diisi"
        # Bersihkan suffix " kosong" dari nama field → "siswa.nama kosong" → "siswa.nama".
        field_clean = field_part.strip().removesuffix(" kosong").strip()
        blocking.append(IssueItem(field=field_clean, message=msg_part.strip()))

    return ValidationResult(
        score=score,
        max_score=max_score,
        percent=round(score / max_score * 100) if max_score else 0,
        ready=len(issues) == 0,
        blocking=blocking,
        warnings=warnings,
        requestions=requestions,
    )


def recommend_bab(data: dict[str, Any]) -> BabRecommendation:
    """Bungkus _validator.recommend_bab()."""
    modules, reasons = _validator.recommend_bab(data)
    return BabRecommendation(modules=modules, reasons=reasons)
