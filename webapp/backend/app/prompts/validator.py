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


# ── Grounding helpers ───────────────────────────────────────────────────── #
# Mencegah AI "keluar konteks": output harus menyebut entitas yang ADA di data,
# dan tidak menyebut entitas asing (nama perusahaan/jurusan lain) yang tidak
# ada di ground truth.
#
# Pendekatan: WHITELIST DINAMIS, bukan tebak nama diri.
# Ada 3 sumber whitelist yang digabung:
#   1. Entitas dari data user (nama perusahaan, sekolah, siswa, kota, divisi)
#   2. Istilah teknis jurusan (dari jurusan_knowledge.py) — berbeda per jurusan
#   3. Kata akademik baku laporan PKL (selalu aman dicapital)
# Token berkapital di output yang TIDAK ada di union 3 whitelist → flag asing.
# Ini akurat untuk banyak jurusan + banyak perusahaan tanpa false positive.

# Kata umum yang sering muncul sebagai token mirip nama perusahaan tapi sebenarnya
# kata biasa — jangan ditandai sebagai entitas asing.
_GROUNDING_STOPWORDS = {
    "perusahaan", "industri", "instansi", "sekolah", "lembaga", "kantor",
    "pemerintah", "daerah", "kota", "bandar", "lampung", "yang", "untuk",
    "dari", "pada", "dengan", "ini", "itu", "adalah", "akan", "telah",
    # Frasa baku laporan PKL (dikapital di tengah kalimat, bukan nama diri asing)
    "praktik", "kerja", "lapangan", "kegiatan", "penulis", "siswa", "bab",
    "pendahuluan", "pembahasan", "kesimpulan", "saran", "lamongan", "dudi",
    "smk", "smkn", "negeri", "indonesia", "tahun", "bulan", "hari", "jam",
    "tata", "tertib", "struktur", "organisasi", "visi", "misi", "sejarah",
    "profil", "latar", "belakang", "tujuan", "manfaat", "landasan", "teori",
}

# Whitelist kata akademik baku laporan PKL — selalu aman muncul di output
# walau tidak di-ground dari data. Termasuk istilah umum lintas jurusan.
_ACADEMIC_OK = {
    "penulis", "bab", "smk", "smkn", "bandar", "lampung", "indonesia",
    "pkl", "dudi", "data", "pengamatan", "gambar", "tabel", "lampiran",
    "pengesahan", "cover", "kata", "pengantar", "daftar", "isi", "pustaka",
    "pendahuluan", "pembahasan", "kesimpulan", "saran", "tinjauan",
    "jurnal", "siswa", "penulis", "sekolah", "industri", "instansi",
    "perusahaan", "lembaga", "kantor", "pemerintah", "dinas", "pendidikan",
    "kebudayaan", "provinsi", "kabupaten", "kecamatan", "kelurahan",
    "standar", "nasional", "kompetensi", "keahlian", "kurikulum",
    "teori", "praktik", "metode", "analisis", "hasil", "proses",
    "sistem", "aplikasi", "jaringan", "server", "database", "program",
    "metode", "kendaraan", "mesin", "perangkat", "peralatan", "alat",
    "transaksi", "administrasi", "pelanggan", "pelajar", "guru",
    # Kata umum yang sering dikapital oleh AI — bukan nama diri asing
    "menengah", "kejuruan", "atas", "negeri", "swasta", "teknik", "komputer",
    "mesin", "otomotif", "elektronika", "tata", "boga", "akuntansi", "perkantoran",
    "pemasaran", "perhotelan", "farmasi", "desain", "komunikasi", "visual",
    "rekayasa", "perangkat", "lunak", "bisnis", "daring", "kendaraan", "ringan",
    "teknik", "teknik", "listrik", "industri", "pelayanan", "logistik",
    "jurusan", "kompetensi", "keahlian", "program", "pendidikan",
}


def _extract_proper_nouns(text: str) -> set[str]:
    """Kandidat nama diri: kata berkapital yang BUKAN di awal kalimat.

    Awal kalimat selalu berkapital dalam EYD, jadi token kapital pertama setelah
    tanda baca akhir kalimat — ATAU setelah baris baru (paragraf baru) — ATAU
    setelah marker tag seperti [KESIMPULAN] — bukan nama diri. Kita ambil hanya
    yang muncul di tengah kalimat.

    Mengembalikan token mentah (belum difilter whitelist) — filtering dilakukan
    di _check_grounding supaya whitelist bisa dinamis per-request.
    """
    nouns: set[str] = set()
    # Pecah per kalimat. Sertakan baris-baru sebagai pembatas kalimat karena
    # paragraf baru juga dianggap awal kalimat baru (kata pertama berkapital).
    for sentence in re.split(r"[.!?]+[\"')\]]?\s+|\n+", text):
        sentence = sentence.strip()
        if not sentence:
            continue
        # Buang marker tag seperti [KESIMPULAN] / [SARAN] / [VISI] di awal kalimat
        # — kata sesudahnya tetap dianggap awal kalimat, bukan nama diri.
        sentence = re.sub(r"^\[[^\]]+\]\s*", "", sentence)
        words = sentence.split()
        for w in words[1:]:  # skip kata pertama (selalu berkapital di awal kalimat)
            m = re.match(r"^([A-Z][a-zA-Z]{2,})", w.rstrip(".,;:!?\"')\]"))
            if m:
                nouns.add(m.group(1))
    return nouns


def _jurusan_fullname(jurusan_key: str) -> str:
    """Nama lengkap jurusan dari jurusan_knowledge (mis. 'bdp' → 'Bisnis Daring dan Pemasaran').

    Data user sering hanya menyimpan SINGKATAN ('BDP'), padahal AI menulis
    KEPANJANGANNYA di output. Tanpa nama lengkap di ground-truth, kepanjangan
    itu salah ter-flag 'jurusan tidak disebut'. Ambil dari baris 'Konteks Jurusan:'.
    """
    if not jurusan_key:
        return ""
    try:
        from .jurusan_knowledge import get_jurusan_context
        ctx_str = get_jurusan_context(jurusan_key.strip().lower())
    except Exception:
        return ""
    m = re.search(r"Konteks Jurusan:\s*(.+)", ctx_str)
    if not m:
        return ""
    # 'Bisnis Daring dan Pemasaran (BDP) / Bisnis Digital' → ambil bagian sebelum '('
    full = m.group(1).split("(")[0].strip()
    return full


def _jurusan_terms(ctx: dict) -> set[str]:
    """Istilah teknis jurusan dari jurusan_knowledge.py — whitelist dinamis.

    Berbeda per jurusan: TKJ punya DHCP/DNS/VLAN, AKL punya Debitur/Rekening,
    DKV punya CMYK/RGB/Bleed, dst. Load lazy supaya tidak heavy saat import.
    Juga sertakan kata-kata nama lengkap jurusan ('Bisnis', 'Daring', 'Pemasaran')
    supaya AI yang menulis kepanjangan tidak dianggap menyebut entitas asing.
    """
    siswa = ctx.get("siswa") or {}
    jurusan_key = (siswa.get("jurusan_key") or "").strip().lower()
    if not jurusan_key:
        return set()
    try:
        from .jurusan_knowledge import get_jurusan_context
        ctx_str = get_jurusan_context(jurusan_key)
    except Exception:
        return set()
    terms: set[str] = set()
    # Kata-kata nama lengkap jurusan — sah dikapital di tengah kalimat.
    for w in _jurusan_fullname(jurusan_key).split():
        if len(w) >= 3 and w.lower() not in _GROUNDING_STOPWORDS and w.lower() not in ("dan", "yang"):
            terms.add(w)
    m = re.search(r"Istilah Teknis:\s*(.+)", ctx_str)
    if m:
        for w in m.group(1).split(","):
            w = w.strip()
            if w and w[0].isupper():
                # Ambil kata pertama dari setiap istilah (mis. "Queue Tree" → "Queue")
                first = w.split()[0].rstrip(".")
                if len(first) >= 2:
                    terms.add(first)
        # Juga ambil kata berkapital individual (mis. "DHCP, DNS, VLAN" tanpa koma)
        for w in m.group(1).split():
            w_clean = w.strip().rstrip(".,;:")
            if w_clean and w_clean[0].isupper() and len(w_clean) >= 2:
                terms.add(w_clean)
    return terms
    # Ambil kata berkapital dari baris 'Istilah Teknis:' (sumber paling andal).
    terms: set[str] = set()
    m = re.search(r"Istilah Teknis:\s*(.+)", ctx_str)
    if m:
        for w in m.group(1).split(","):
            w = w.strip()
            if w and w[0].isupper():
                # Ambil kata pertama dari setiap istilah (mis. "Queue Tree" → "Queue")
                first = w.split()[0].rstrip(".")
                if len(first) >= 2:
                    terms.add(first)
        # Juga ambil kata berkapital individual (mis. "DHCP, DNS, VLAN" tanpa koma)
        for w in m.group(1).split():
            w_clean = w.strip().rstrip(".,;:")
            if w_clean and w_clean[0].isupper() and len(w_clean) >= 2:
                terms.add(w_clean)
    return terms


def _ground_truth_entities(ctx: dict) -> dict[str, set[str]]:
    """Kumpulkan entitas sah dari data user — sumber kebenaran grounding."""
    siswa = ctx.get("siswa") or {}
    perusahaan = ctx.get("perusahaan") or {}
    sekolah = ctx.get("sekolah") or {}

    def parts(name: str) -> set[str]:
        return {p for p in (name or "").split() if len(p) > 3 and p.lower() not in _GROUNDING_STOPWORDS}

    jurusan = (siswa.get("jurusan") or "").strip()
    # Singkatan jurusan (TKJ, RPL, DKV, AKL) hanya 3 huruf → ter-saring len>3.
    # Sertakan singkatan utuh + semua kata (case di-whitelist saat dibandingkan).
    jurusan_key = (siswa.get("jurusan_key") or "").strip()
    jurusan_set: set[str] = {w for w in jurusan.split() if len(w) > 3}
    if jurusan:
        jurusan_set.add(jurusan)  # seluruh nama jurusan, termasuk singkatan
    if jurusan_key:
        jurusan_set.add(jurusan_key)
        # KEPANJANGAN jurusan juga sah disebut (AI sering menulis "Bisnis Daring
        # dan Pemasaran" walau data hanya menyimpan singkatan "BDP"). Tanpa ini,
        # kepanjangan itu salah ter-flag 'jurusan tidak disebut' / entitas asing.
        fullname = _jurusan_fullname(jurusan_key)
        if fullname:
            jurusan_set.add(fullname)
            for w in fullname.split():
                if len(w) > 3 and w.lower() not in _GROUNDING_STOPWORDS:
                    jurusan_set.add(w)
    # Divisi/bidang dari kegiatan — sering disebut di output, harus sah
    bidang_set: set[str] = set()
    for k in ctx.get("kegiatan", []) or []:
        b = (k.get("bidang") or "").strip() if isinstance(k, dict) else ""
        if b:
            for w in b.split():
                if len(w) > 3 and w.lower() not in _GROUNDING_STOPWORDS:
                    bidang_set.add(w)
    # Nama orang dari data (pembimbing, pimpinan) — sah disebut
    person_names: set[str] = set()
    for path in (("perusahaan", "pimpinan", "nama"),
                 ("perusahaan", "pembimbing_industri", "nama"),
                 ("perusahaan", "hrd", "nama"),
                 ("sekolah", "pembimbing_sekolah", "nama"),
                 ("sekolah", "ketua_kk", "nama"),
                 ("sekolah", "kepala_sekolah", "nama")):
        node = ctx
        try:
            for p in path:
                node = node.get(p) or {}
            nm = (node if isinstance(node, str) else "")
            for w in nm.split():
                if len(w) > 3 and w.lower() not in _GROUNDING_STOPWORDS:
                    person_names.add(w)
        except Exception:
            pass
    return {
        "perusahaan": parts(perusahaan.get("nama", "")) | parts(perusahaan.get("nama_lengkap", "")),
        "jurusan": jurusan_set,
        "sekolah": parts(sekolah.get("nama", "")),
        "kota": parts(perusahaan.get("kota", "") or sekolah.get("kota", "")),
        "bidang_usaha": parts(perusahaan.get("bidang_usaha", "")),
        "bidang_kegiatan": bidang_set,
        "orang": person_names,
    }


# Section yang wajib menyebut perusahaan dan/atau jurusan dari data.
_NEEDS_COMPANY = {"latar_belakang", "profil_sejarah", "kesimpulan_saran", "tujuan_pkl"}
_NEEDS_JURUSAN = {"latar_belakang", "tujuan_pkl", "pembahasan", "kesimpulan_saran"}

# Threshold jumlah entitas asing sebelum di-flag, per-section.
# Section dekat data (data-grounded) → 1 entitas asing sudah curiga.
# Section reflektif/teoretis → 2 entitas (lebih longgar, istilah teknis banyak).
_FOREIGN_THRESHOLD: dict[str, int] = {
    "latar_belakang": 1,
    "profil_sejarah": 1,
    "kesimpulan_saran": 1,
    "tujuan_pkl": 1,
    "pembahasan": 2,
    "landasan_teori": 2,
    "narasi_struktur": 2,
}
_DEFAULT_FOREIGN_THRESHOLD = 2


def _check_grounding(text: str, section_key: str, ctx: dict) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) soal grounding.

    Whitelist dinamis (3 sumber digabung):
      1. entitas dari data user (perusahaan, sekolah, jurusan, kota, bidang, orang)
      2. istilah teknis jurusan (dari jurusan_knowledge.py — berbeda per jurusan)
      3. kata akademik baku laporan PKL
    Token berkapital di output yang tidak ada di whitelist mana pun → flag asing.

    - warning: section wajib sebut konteks (perusahaan/jurusan) tapi tidak disebut.
    - warning: output menyebut nama diri asing (diduga halusinasi).
      Warning (bukan error) supaya tidak over-block — auto-retry sudah ada di router.

    Grounding check di-skip jika data user kosong (tidak fair mengharuskan AI
    menyebut entitas yang tidak ada datanya).
    """
    errors: list[str] = []
    warnings: list[str] = []
    gt = _ground_truth_entities(ctx)
    text_low = text.lower()

    # Cek positive grounding: section wajib sebut perusahaan/jurusan dari data.
    # Skip jika datanya kosong — tidak fair flag padahal data tidak ada.
    if section_key in _NEEDS_COMPANY and gt["perusahaan"]:
        if not any(p.lower() in text_low for p in gt["perusahaan"]):
            warnings.append(
                "Nama perusahaan dari data tidak disebut di output — AI mungkin keluar konteks"
            )

    if section_key in _NEEDS_JURUSAN and gt["jurusan"]:
        if not any(p.lower() in text_low for p in gt["jurusan"]):
            warnings.append(
                "Nama jurusan dari data tidak disebut di output — AI mungkin keluar konteks"
            )

    # Bangun whitelist lengkap: entitas data + istilah jurusan + akademik baku.
    jurusan_terms = _jurusan_terms(ctx)
    whitelist = (
        gt["perusahaan"] | gt["sekolah"] | gt["jurusan"]
        | gt["kota"] | gt["bidang_usaha"] | gt["bidang_kegiatan"]
        | gt["orang"] | jurusan_terms | _ACADEMIC_OK
    )
    whitelist_low = {w.lower() for w in whitelist}

    # Deteksi entitas asing: token berkapital di output yang tidak ada di whitelist.
    proper = _extract_proper_nouns(text)
    foreign = {
        p for p in proper
        if p.lower() not in whitelist_low
        and p.lower() not in _GROUNDING_STOPWORDS
    }
    threshold = _FOREIGN_THRESHOLD.get(section_key, _DEFAULT_FOREIGN_THRESHOLD)
    if len(foreign) >= threshold:
        warnings.append(
            f"Output menyebut nama diri yang tidak ada di data (diduga halusinasi): "
            f"{', '.join(sorted(foreign)[:5])}"
        )

    return errors, warnings


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

    # 6. Grounding check - output harus mengacu data, bukan entitas asing.
    #    Menggantikan anchor check lama (3 section) dengan cek yang lebih luas
    #    plus deteksi nama diri asing. Hasilnya warnings (non-blocking) supaya
    #    auto-retry di router tetap berlaku, tapi tetap tercatat untuk diagnosis.
    g_errs, g_warns = _check_grounding(text, section_key, ctx)
    errors.extend(g_errs)
    warnings.extend(g_warns)

    return ValidationResult(
        passed=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )


_SENTENCE_END = re.compile(r"[^.!?]*(?:[.!?]+[\"')\]]*|$)", re.DOTALL)


def _split_sentences(para: str) -> list[str]:
    """Pecah satu paragraf menjadi kalimat utuh (akhir . ! ? tetap terlampir)."""
    out = [m.group(0).strip() for m in _SENTENCE_END.finditer(para)]
    return [s for s in out if s]


def truncate_to_limit(text: str, section_key: str) -> str:
    """Potong output AI yang melebihi word limit — SELALU di batas kalimat utuh.

    Prinsip: jangan pernah memotong di tengah kalimat (cerita jadi "kepotong"
    padahal ada lanjutannya). Algoritma:
      1. Kumpulkan kalimat utuh satu per satu, pertahankan batas paragraf.
      2. Berhenti menambah kalimat tepat sebelum jumlah kata melebihi limit,
         SELAMA minimal 1 kalimat sudah terkumpul.
      3. Fallback (kalimat pertama saja sudah > limit): potong di tanda baca
         terakhir (,;:) atau spasi, TANPA menambah titik baru ke fragmen —
         fragmen yang ditambah titik adalah kalimat yang tata bahasanya rusak.
         Lebih baik biarkan fragmen apa adanya daripada berpura-pura utuh.
    """
    if section_key in _UNLIMITED_SECTIONS:
        return text
    wmin, wmax = _SECTION_WORD_LIMITS.get(section_key, _DEFAULT_LIMITS)
    words = text.split()
    if len(words) <= wmax:
        return text

    # Kumpulkan kalimat utuh, pertahankan struktur paragraf.
    kept_paras: list[list[str]] = []
    total = 0
    for para in text.split("\n"):
        if not para.strip():
            continue
        kept: list[str] = []
        for sent in _split_sentences(para):
            n = len(sent.split())
            if total + n > wmax and kept_paras:
                # Kalimat berikutnya melampaui limit dan kita sudah punya isi → berhenti.
                break
            kept.append(sent)
            total += n
            if total >= wmax:
                break
        if kept:
            kept_paras.append(kept)
        if total >= wmax:
            break

    if kept_paras:
        return "\n\n".join(" ".join(p) for p in kept_paras)

    # Fallback: kalimat pertama saja sudah melebihi limit (kasus langka —
    # satu kalimat raksasa). Potong di batas kata, prefer tanda baca terakhir.
    truncated = " ".join(words[:wmax])
    last = max(truncated.rfind(", "), truncated.rfind("; "), truncated.rfind(": "))
    if last > len(truncated) * 0.6:
        return truncated[:last + 1].rstrip()
    # Jangan tambahkan titik ke fragmen — biarkan apa adanya (tidak pura-pura utuh).
    return truncated.rstrip(".,;:!?")
