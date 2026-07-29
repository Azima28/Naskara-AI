"""Router generate — POST /generate/{draft_id} → stream .docx.

Workflow:
1. Ambil draft dari DB
2. Validasi (harus lolos WAJIB gate)
3. Assemble via assembly.py
4. Return FileResponse
5. Cleanup file temp setelah send
"""
from __future__ import annotations

import os
import re
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_user
from ..models import Draft, User
from ..validation import run_validation
from ..docx.assembly import assemble_report, default_daftar_pustaka
from ..ai.client import get_ai_provider

router = APIRouter(prefix="/generate", tags=["generate"])

# Label ramah-user untuk section yang dipolish (dipakai di pesan notifikasi).
_POLISH_LABELS = {
    "visi_misi": "visi & misi",
    "tata_tertib": "tata tertib perusahaan",
    "job_descriptions": "job description",
    "kegiatan": "detail kegiatan",
    "peralatan": "deskripsi peralatan",
}


from ..prompts.ai_sections import (
    prompt_visi_misi,
    prompt_tata_tertib_perusahaan,
    prompt_job_descriptions,
    prompt_detail_kegiatan,
    prompt_peralatan_deskripsi,
)
from ..prompts.base import SYSTEM_PROMPT_TEMPLATE


async def _ai_daftar_pustaka(data: dict) -> list[str]:
    """Minta AI menyusun daftar pustaka; kembalikan [] bila gagal/dummy."""
    import asyncio

    perusahaan = data.get("perusahaan", {})
    sekolah = data.get("sekolah", {})
    system = (
        "Kamu penyusun daftar pustaka laporan PKL SMK. Balas HANYA daftar "
        "sitasi, satu sitasi per baris, tanpa nomor, tanpa penjelasan. Format "
        "mengikuti contoh: 'domain.com. (2024 - Nama Perusahaan). Judul "
        "Halaman. Diakses pada 20 Desember 2024, dari https://...'. "
        "DILARANG mengarang buku, penulis, atau URL yang tidak disebut di "
        "data. Gunakan hanya website yang diberikan + artikel publik umum "
        "tentang Praktik Kerja Lapangan."
    )
    user = (
        f"Data laporan:\n"
        f"- Perusahaan: {perusahaan.get('nama_lengkap') or perusahaan.get('nama', '')}\n"
        f"- Website perusahaan: {perusahaan.get('website', '-')}\n"
        f"- Sekolah: {sekolah.get('nama', '')}\n"
        f"- Website sekolah: {sekolah.get('website', '-')}\n"
        f"- Jurusan: {data.get('siswa', {}).get('jurusan', '')}\n"
        f"- Selesai PKL: {data.get('pkl', {}).get('tanggal_selesai', '')}\n"
        f"Susun 4-7 sitasi."
    )
    try:
        text = await asyncio.wait_for(get_ai_provider().generate(system, user), timeout=3.0)
    except Exception:
        return []
    if not text or "[DUMMY" in text.upper():
        return []
    refs = [
        line.strip().lstrip("-•0123456789. ").strip()
        for line in text.split("\n") if len(line.strip()) > 20
    ]
    return refs if len(refs) >= 3 else []


# ── Parser helpers untuk output AI polish ────────────────────────────────── #

def _ensure_str(val: Any) -> str:
    """Konversi input secara aman menjadi string tunggal ber-newline."""
    if val is None:
        return ""
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        return "\n".join(_ensure_str(item) for item in val if item is not None)
    if isinstance(val, dict):
        return "\n".join(f"{k}: {_ensure_str(v)}" for k, v in val.items())
    return str(val)


def _parse_visi_misi(text: Any) -> dict:
    """Parse output [VISI]/[MISI] menjadi dict {visi, misi: []}."""
    result = {"visi": "", "misi": []}
    current = None
    text_str = _ensure_str(text)
    for line in text_str.split("\n"):
        s = line.strip()
        if s == "[VISI]":
            current = "visi"
            continue
        elif s == "[MISI]":
            current = "misi"
            continue
        if not s:
            continue
        if current == "visi" and not result["visi"]:
            result["visi"] = s
        elif current == "misi":
            cleaned = re.sub(r"^\d+\.\s*", "", s)
            if cleaned:
                result["misi"].append(cleaned)
    return result


def _parse_numbered_list(text: Any) -> list[str]:
    """Parse daftar bernomor menjadi list string."""
    items = []
    text_str = _ensure_str(text)
    for line in text_str.split("\n"):
        s = line.strip()
        if not s:
            continue
        cleaned = re.sub(r"^\d+\.\s*", "", s)
        if cleaned:
            items.append(cleaned)
    return items


def _parse_job_descriptions(text: Any) -> list[dict]:
    """Parse output [POSISI: ...] menjadi list {posisi, tugas: []}."""
    import re as _re
    jobs = []
    current_job = None
    text_str = _ensure_str(text)
    for line in text_str.split("\n"):
        s = line.strip()
        posisi_match = _re.match(r"\[POSISI:\s*(.+?)\]", s)
        if posisi_match:
            if current_job:
                jobs.append(current_job)
            current_job = {"posisi": posisi_match.group(1).strip(), "tugas": []}
            continue
        if current_job and s:
            cleaned = re.sub(r"^\d+\.\s*", "", s)
            if cleaned:
                current_job["tugas"].append(cleaned)
    if current_job:
        jobs.append(current_job)
    return jobs


def _parse_kegiatan_polished(text: Any, original_kegiatan: list) -> list:
    """Parse output [BIDANG:]/[TUGAS:] dan merge ke struktur kegiatan asli."""
    import re as _re
    polished_map: dict[str, dict] = {}
    current_bidang = None
    current_tugas = None
    text_str = _ensure_str(text)

    for line in text_str.split("\n"):
        s = line.strip()
        bidang_m = _re.match(r"\[BIDANG:\s*(.+?)\]", s)
        tugas_m = _re.match(r"\[TUGAS:\s*(.+?)\]", s)
        if bidang_m:
            current_bidang = bidang_m.group(1).strip()
            current_tugas = None
            if current_bidang not in polished_map:
                polished_map[current_bidang] = {"deskripsi": "", "tugas": {}}
            continue
        elif tugas_m and current_bidang:
            current_tugas = tugas_m.group(1).strip()
            continue
        elif s and current_bidang:
            if current_tugas:
                polished_map[current_bidang]["tugas"][current_tugas] = s
                current_tugas = None
            elif not polished_map[current_bidang]["deskripsi"]:
                polished_map[current_bidang]["deskripsi"] = s

    # Merge ke struktur kegiatan asli
    result = []
    for k in original_kegiatan:
        k_copy = dict(k)
        bidang = k_copy.get("bidang", "")
        if bidang in polished_map:
            p = polished_map[bidang]
            if p["deskripsi"]:
                k_copy["deskripsi_umum"] = p["deskripsi"]
            tugas_updated = []
            for t in k_copy.get("tugas", []):
                t_copy = dict(t)
                nama_t = t_copy.get("nama_tugas") or t_copy.get("nama") or ""
                if nama_t in p["tugas"]:
                    t_copy["detail"] = p["tugas"][nama_t]
                tugas_updated.append(t_copy)
            k_copy["tugas"] = tugas_updated
        result.append(k_copy)
    return result


def _parse_peralatan_polished(text: Any, original_peralatan: list) -> list:
    """Parse output [ALAT: ...] dan update deskripsi peralatan asli."""
    import re as _re
    desc_map: dict[str, str] = {}
    current_alat = None
    text_str = _ensure_str(text)
    for line in text_str.split("\n"):
        s = line.strip()
        alat_m = _re.match(r"\[ALAT:\s*(.+?)\]", s)
        if alat_m:
            current_alat = alat_m.group(1).strip()
            continue
        if current_alat and s:
            if current_alat not in desc_map:
                desc_map[current_alat] = s
            current_alat = None

    result = []
    for p in original_peralatan:
        p_copy = dict(p)
        nama = p_copy.get("nama", "")
        if nama in desc_map:
            p_copy["deskripsi"] = desc_map[nama]
        result.append(p_copy)
    return result


async def _auto_polish_on_generate(data: dict) -> tuple[dict, bool]:
    """Panggil semua AI polish secara paralel sebelum assemble.

    Mengisi/update data['generated_sections'] dan data mentah
    dengan versi yang sudah dirapikan AI.

    Jika AI gagal untuk satu section → skip section itu (fallback ke raw user input),
    sementara section yang BERHASIL tetap dipakai. Return (data, changed) — `changed`
    True bila ada polish yang berhasil diterapkan, supaya pemanggil bisa menyimpan
    hasilnya ke draft (tidak perlu di-polish ulang dari awal pada download berikutnya).
    """
    import asyncio
    from ..config import settings

    provider = get_ai_provider()
    gen = data.get("generated_sections", {})
    system = SYSTEM_PROMPT_TEMPLATE
    changed = False

    # ── Kumpulkan prompts yang perlu dijalankan ───────────────────────────
    prompts: dict[str, str] = {}

    p_visi = prompt_visi_misi(data)
    if p_visi and (data.get("profil_perusahaan", {}).get("visi") or data.get("profil_perusahaan", {}).get("misi")):
        prompts["visi_misi"] = p_visi

    p_tt = prompt_tata_tertib_perusahaan(data)
    if p_tt:
        prompts["tata_tertib"] = p_tt

    p_jd = prompt_job_descriptions(data)
    if p_jd:
        prompts["job_descriptions"] = p_jd

    p_keg = prompt_detail_kegiatan(data)
    if p_keg and data.get("kegiatan"):
        prompts["kegiatan"] = p_keg

    p_alat = prompt_peralatan_deskripsi(data)
    if p_alat and data.get("peralatan"):
        prompts["peralatan"] = p_alat

    if not prompts:
        return data, False

    # ── Cek konektivitas AI Provider terlebih dahulu ─────────────────────────
    # Jika server AI lokal offline/unreachable, langsung skip auto-polish dalam 1.5 detik
    # agar proses download tidak menggantung atau menyebabkan Network Error di frontend.
    try:
        await asyncio.wait_for(provider.generate(system, "test connectivity"), timeout=1.5)
    except Exception as e:
        print(f"[AutoPolish] AI provider offline ({e}) — menggunakan data asli")
        return data, False

    # ── Jalankan dengan konkurensi terbatas ───────────────────────────────
    # Provider lokal (LM Studio/9router) memproses SATU request pada satu waktu,
    # jadi menembak semua prompt sekaligus membuat mereka saling antre dan mudah
    # kehabisan timeout. Batasi ke 2 bersamaan dan beri total waktu yang cukup:
    # tiap panggilan boleh memakai sampai settings.ai_timeout detik.
    keys = list(prompts.keys())
    sem = asyncio.Semaphore(2)

    async def _run(prompt_text: str):
        async with sem:
            return await provider.generate(system, prompt_text)

    # Total: ceil(n/2) panggilan × timeout per-panggilan + margin.
    per_call = max(30, int(settings.ai_timeout))
    total_timeout = ((len(keys) + 1) // 2) * per_call + 20
    try:
        results = await asyncio.wait_for(
            asyncio.gather(*(_run(p) for p in prompts.values()), return_exceptions=True),
            timeout=total_timeout,
        )
    except asyncio.TimeoutError:
        print(f"[AutoPolish] Timeout ({total_timeout}s) - menggunakan data asli")
        return data, False

    # ── Proses hasil tiap task ────────────────────────────────────────────
    failed: list[str] = []
    for key, result in zip(keys, results):
        if isinstance(result, Exception) or not result:
            print(f"[AutoPolish] Skip '{key}': {result}")
            failed.append(key)
            continue

        text = str(result).strip()

        if key == "visi_misi":
            parsed = _parse_visi_misi(text)
            if parsed["visi"] or parsed["misi"]:
                profil = data.setdefault("profil_perusahaan", {})
                if parsed["visi"] and parsed["visi"] != "(tidak tersedia)":
                    profil["visi"] = parsed["visi"]
                if parsed["misi"]:
                    profil["misi"] = parsed["misi"]
                changed = True

        elif key == "tata_tertib":
            items = _parse_numbered_list(text)
            if items:
                # Simpan sebagai generated tata tertib perusahaan (terpisah dari SMKN4 resmi)
                gen["tata_tertib_perusahaan_polished"] = items
                changed = True

        elif key == "job_descriptions":
            jobs = _parse_job_descriptions(text)
            if jobs:
                profil = data.setdefault("profil_perusahaan", {})
                profil["job_descriptions"] = jobs
                changed = True

        elif key == "kegiatan":
            polished = _parse_kegiatan_polished(text, data.get("kegiatan", []))
            if polished:
                data["kegiatan"] = polished
                changed = True

        elif key == "peralatan":
            polished = _parse_peralatan_polished(text, data.get("peralatan", []))
            if polished:
                data["peralatan"] = polished
                changed = True

    data["generated_sections"] = gen
    # Catat section yang gagal dipolish agar bisa dilaporkan ke user (dan
    # tidak ditandai sebagai berhasil dipolish saat disimpan ke draft).
    data["_polish_failed"] = failed
    return data, changed




@router.post("/{draft_id}")
async def generate_docx(
    draft_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Generate laporan PKL .docx dari draft yang tersimpan.

    Returns: FileResponse (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
    """
    # 1. Get draft
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
    ).first()

    if not draft:
        raise HTTPException(status_code=404, detail="Draft tidak ditemukan")

    data: dict = draft.data_json or {}

    # 2. Validate — minimal harus lolos WAJIB gate
    validation = run_validation(data)
    if validation.blocking:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Data belum lengkap. Isi field WAJIB terlebih dahulu.",
                "issues": [i.model_dump() if hasattr(i, "model_dump") else str(i) for i in validation.blocking],
                # Pertanyaan ulang untuk jawaban vague — frontend menampilkan
                # ini ke user, bukan sekadar "field kosong".
                "requestions": [r.model_dump() for r in validation.requestions],
                "score": validation.score,
            },
        )

    # 2.5 Auto-polish dengan AI — rapikan teks mentah user sebelum assemble
    # Dijalankan paralel (asyncio.gather), timeout 60 detik.
    # Jika AI offline/timeout → fallback ke raw user input, generate tetap jalan.
    data, polished = await _auto_polish_on_generate(data)

    # Simpan hasil polish yang BERHASIL ke draft — jadi kalau sebagian section gagal
    # (provider error) user tidak perlu mengulang dari awal saat download berikutnya;
    # polish yang sudah jadi dipertahankan dan hanya sisanya yang dicoba lagi.
    # PENTING: section yang GAGAL dipolish TIDAK menimpa data asli user — kita hanya
    # menimpa field yang memang berhasil dirapikan AI.
    polish_failed = data.pop("_polish_failed", [])
    if polished:
        try:
            stored = draft.data_json or {}
            if "job_descriptions" not in polish_failed and "visi_misi" not in polish_failed:
                # profil_perusahaan hanya berubah bila visi_misi/job_descriptions sukses
                if data.get("profil_perusahaan") is not None:
                    stored["profil_perusahaan"] = data["profil_perusahaan"]
            if "kegiatan" not in polish_failed and data.get("kegiatan") is not None:
                stored["kegiatan"] = data["kegiatan"]
            if "peralatan" not in polish_failed and data.get("peralatan") is not None:
                stored["peralatan"] = data["peralatan"]
            gen = data.get("generated_sections") or {}
            if gen:
                stored.setdefault("generated_sections", {}).update(gen)
            draft.data_json = stored
            db.commit()
        except Exception as e:
            print(f"[AutoPolish] Gagal simpan hasil polish ke draft (lanjut generate): {e}")
            db.rollback()

    # 2.6 Daftar pustaka otomatis (config.auto_daftar_pustaka, default aktif):
    # coba AI dulu; kalau provider mati/dummy, penyusun standar yang mengisi.
    if not data.get("daftar_pustaka") and \
            (data.get("config", {}) or {}).get("auto_daftar_pustaka", True):
        refs = await _ai_daftar_pustaka(data)
        data["daftar_pustaka"] = refs or default_daftar_pustaka(data)

    # 3. Assemble
    try:
        output_path = assemble_report(data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal generate dokumen: {str(e)}",
        )

    # 4. Determine filename
    siswa = data.get("siswa", {})
    nama = siswa.get("nama", "PKL").strip() or "PKL"
    safe_name = "".join(c if c.isalnum() or c in " -_" else "" for c in nama).strip()
    download_name = f"Laporan-PKL-{safe_name}.docx"

    # Save a permanent copy to 'hasil' folder for evaluation
    try:
        project_root = Path(os.getcwd())
        if project_root.name == "app":
            project_root = project_root.parent.parent.parent
        elif project_root.name == "backend":
            project_root = project_root.parent.parent
        
        hasil_dir = project_root / "hasil"
        hasil_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        eval_filename = f"[{timestamp}] Laporan PKL - {safe_name}.docx"
        eval_path = hasil_dir / eval_filename
        shutil.copy2(output_path, eval_path)
    except Exception as e:
        print(f"Warning: Gagal menyimpan salinan ke folder hasil: {e}")

    # 5. Return file
    response = FileResponse(
        path=output_path,
        filename=download_name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    # Beri tahu user bila ada bagian yang gagal dipolish AI (sistem AI bermasalah).
    # Dokumen tetap dihasilkan dari data asli; bagian yang sudah berhasil dipolish
    # sudah tersimpan di draft sehingga download berikutnya tinggal melanjutkan.
    if polish_failed:
        labels = ", ".join(_POLISH_LABELS.get(k, k) for k in polish_failed)
        msg = (
            "Sistem AI sedang mengalami masalah, sehingga sebagian teks "
            f"({labels}) belum dirapikan otomatis. Dokumen tetap dibuat dari "
            "data asli. Bagian yang berhasil dirapikan sudah tersimpan — coba "
            "download lagi nanti untuk melengkapi sisanya."
        )
        from urllib.parse import quote
        response.headers["X-Polish-Partial"] = ",".join(polish_failed)
        response.headers["X-Polish-Message"] = quote(msg)
        # Izinkan frontend membaca header kustom dari respons blob.
        response.headers["Access-Control-Expose-Headers"] = (
            "X-Polish-Partial, X-Polish-Message, Content-Disposition"
        )
    return response
