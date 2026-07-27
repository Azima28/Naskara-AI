"""Validator AI Output - validasi output AI sebelum disimpan ke generated_sections.

Tiga jenis pengecekan:
  1. Format  - apakah output punya struktur yang diharapkan (mis. [KESIMPULAN] tag)
  2. Content - apakah output masuk akal (panjang, bahasa, tidak ada heading palsu)
  3. Anchor  - apakah nama perusahaan disebut (untuk section yang wajib)
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional


class AIOutputError(Exception):
    """Raised ketika output AI tidak lolos validasi."""
    pass


# Section yang tidak dibatasi panjangnya (cerita user -> boleh panjang)
_UNLIMITED_SECTIONS = {"detail_kegiatan", "cerita_kegiatan", "full_story"}

# Word limit per section key (min, max)
_SECTION_WORD_LIMITS: dict[str, tuple[int, int]] = {
    "latar_belakang":    (80,  600),
    "tujuan_pkl":        (60,  400),
    "profil_sejarah":    (40,  500),
    "narasi_struktur":   (40,  300),
    "landasan_teori":    (80,  350),
    "pembahasan":        (80,  500),
    "kesimpulan_saran":  (80,  600),
    "hal_diperhatikan":  (60,  500),
    "daftar_pustaka":    (20,  400),
}
_DEFAULT_LIMITS = (30, 800)

_BI_KEYWORDS = {
    "dan", "atau", "yang", "di", "ke", "dari", "untuk", "dalam", "dengan",
    "pada", "adalah", "ini", "itu", "tidak", "juga", "sudah", "telah",
    "penulis", "siswa", "praktik", "kerja", "lapangan", "sekolah",
    "perusahaan", "jurusan", "kegiatan", "selama", "melalui", "dapat",
}
_EN_KEYWORDS = {
    "the", "and", "or", "is", "are", "was", "were", "has", "have", "had",
    "this", "that", "with", "from", "for", "internship", "student", "company",
}


def _word_count(text: str) -> int:
    return len(text.split())


def _is_bahasa_indonesia(text: str) -> bool:
    """Heuristik: cek apakah teks dominan Bahasa Indonesia."""
    words = set(text.lower().split())
    bi_score = len(words & _BI_KEYWORDS)
    en_score = len(words & _EN_KEYWORDS)
    return not (en_score > bi_score and en_score >= 3)


def _has_fake_headings(text: str) -> bool:
    """Deteksi heading palsu yang AI tambahkan sendiri."""
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        words = stripped.split()
        # Baris pendek diakhiri titik dua -> heading palsu
        if stripped.endswith(":") and len(words) <= 8:
            return True
        # Markdown header
        if re.match(r"^#{1,6}\s", stripped):
            return True
        # Bold-only line
        if re.match(r"^\*\*.+\*\*$", stripped) and len(words) <= 6:
            return True
    return False


def _check_kesimpulan_saran_tags(text: str) -> tuple[bool, str]:
    """Pastikan [KESIMPULAN] dan [SARAN] ada sebagai baris tersendiri."""
    lines = [l.strip() for l in text.split("\n")]
    has_k = "[KESIMPULAN]" in lines
    has_s = "[SARAN]" in lines
    if not has_k and not has_s:
        return False, "Tag [KESIMPULAN] dan [SARAN] tidak ditemukan"
    if not has_k:
        return False, "Tag [KESIMPULAN] tidak ditemukan"
    if not has_s:
        return False, "Tag [SARAN] tidak ditemukan"
    if lines.index("[KESIMPULAN]") >= lines.index("[SARAN]"):
        return False, "Tag [KESIMPULAN] harus sebelum [SARAN]"
    return True, "OK"


@dataclass
class ValidationResult:
    passed: bool
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)


def validate_ai_output(
    text: str,
    section_key: str,
    ctx: Optional[dict] = None,
) -> ValidationResult:
    """Validasi output AI sebelum disimpan ke generated_sections."""
    errors: list[str] = []
    warnings: list[str] = []
    ctx = ctx or {}

    # 1. Empty check
    if not text or not text.strip():
        errors.append("Output AI kosong")
        return ValidationResult(passed=False, errors=errors)

    # 2. Bahasa Indonesia check
    if not _is_bahasa_indonesia(text):
        errors.append("Output bukan Bahasa Indonesia (diduga campur/full English)")

    # 3. Word count check
    if section_key not in _UNLIMITED_SECTIONS:
        wmin, wmax = _SECTION_WORD_LIMITS.get(section_key, _DEFAULT_LIMITS)
        wc = _word_count(text)
        if wc < wmin:
            errors.append(f"Output terlalu pendek: {wc} kata (min {wmin})")
        if wc > wmax:
            warnings.append(f"Output melebihi batas: {wc} kata (max {wmax}) - akan dipotong")

    # 4. Fake headings check
    if _has_fake_headings(text):
        warnings.append("AI menambahkan heading/label di output - akan dibersihkan")

    # 5. Section-specific format check
    if section_key == "kesimpulan_saran":
        ok, msg = _check_kesimpulan_saran_tags(text)
        if not ok:
            errors.append(f"Format tag tidak valid: {msg}")

    # 6. Anchor check - nama perusahaan wajib disebut di section tertentu
    SECTIONS_NEED_COMPANY = {"latar_belakang", "profil_sejarah", "kesimpulan_saran"}
    if section_key in SECTIONS_NEED_COMPANY:
        nama_prsh = (ctx.get("perusahaan") or {}).get("nama", "")
        if nama_prsh:
            name_parts = [p for p in nama_prsh.split() if len(p) > 3]
            found = any(part.lower() in text.lower() for part in name_parts)
            if not found:
                warnings.append(
                    f"Nama perusahaan tidak ditemukan di output - AI mungkin tidak menyebut konteks"
                )

    return ValidationResult(
        passed=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )


def truncate_to_limit(text: str, section_key: str) -> str:
    """Potong output AI yang melebihi word limit untuk section ini."""
    if section_key in _UNLIMITED_SECTIONS:
        return text
    wmin, wmax = _SECTION_WORD_LIMITS.get(section_key, _DEFAULT_LIMITS)
    words = text.split()
    if len(words) <= wmax:
        return text
    truncated = " ".join(words[:wmax])
    last = max(truncated.rfind("."), truncated.rfind("!"), truncated.rfind("?"))
    if last > len(truncated) * 0.7:
        return truncated[:last + 1]
    return truncated + "."
