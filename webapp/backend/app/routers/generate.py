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
        text = await asyncio.wait_for(get_ai_provider().generate(system, user), timeout=25)
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

def _parse_visi_misi(text: str) -> dict:
    """Parse output [VISI]/[MISI] menjadi dict {visi, misi: []}."""
    result = {"visi": "", "misi": []}
    current = None
    for line in text.split("\n"):
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
            # Strip nomor di awal: "1. teks" → "teks"
            cleaned = re.sub(r"^\d+\.\s*", "", s)
            if cleaned:
                result["misi"].append(cleaned)
    return result


def _parse_numbered_list(text: str) -> list[str]:
    """Parse daftar bernomor menjadi list string."""
    items = []
    for line in text.split("\n"):
        s = line.strip()
        if not s:
            continue
        cleaned = re.sub(r"^\d+\.\s*", "", s)
        if cleaned:
            items.append(cleaned)
    return items


def _parse_job_descriptions(text: str) -> list[dict]:
    """Parse output [POSISI: ...] menjadi list {posisi, tugas: []}."""
    import re as _re
    jobs = []
    current_job = None
    for line in text.split("\n"):
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


def _parse_kegiatan_polished(text: str, original_kegiatan: list) -> list:
    """Parse output [BIDANG:]/[TUGAS:] dan merge ke struktur kegiatan asli."""
    import re as _re
    polished_map: dict[str, dict] = {}
    current_bidang = None
    current_tugas = None

    for line in text.split("\n"):
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


def _parse_peralatan_polished(text: str, original_peralatan: list) -> list:
    """Parse output [ALAT: ...] dan update deskripsi peralatan asli."""
    import re as _re
    desc_map: dict[str, str] = {}
    current_alat = None
    for line in text.split("\n"):
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


async def _auto_polish_on_generate(data: dict) -> dict:
    """Panggil semua AI polish secara paralel sebelum assemble.
    
    Mengisi/update data['generated_sections'] dan data mentah
    dengan versi yang sudah dirapikan AI.
    
    Jika AI gagal untuk satu section → skip section itu (fallback ke raw user input).
    """
    import asyncio

    provider = get_ai_provider()
    gen = data.get("generated_sections", {})
    system = SYSTEM_PROMPT_TEMPLATE

    # ── Kumpulkan tasks yang perlu dijalankan ─────────────────────────────
    tasks = {}

    p_visi = prompt_visi_misi(data)
    if p_visi and (data.get("profil_perusahaan", {}).get("visi") or data.get("profil_perusahaan", {}).get("misi")):
        tasks["visi_misi"] = provider.generate(system, p_visi)

    p_tt = prompt_tata_tertib_perusahaan(data)
    if p_tt:
        tasks["tata_tertib"] = provider.generate(system, p_tt)

    p_jd = prompt_job_descriptions(data)
    if p_jd:
        tasks["job_descriptions"] = provider.generate(system, p_jd)

    p_keg = prompt_detail_kegiatan(data)
    if p_keg and data.get("kegiatan"):
        tasks["kegiatan"] = provider.generate(system, p_keg)

    p_alat = prompt_peralatan_deskripsi(data)
    if p_alat and data.get("peralatan"):
        tasks["peralatan"] = provider.generate(system, p_alat)

    if not tasks:
        return data

    # ── Jalankan semua tasks paralel (timeout 40 detik total) ────────────
    keys = list(tasks.keys())
    coros = list(tasks.values())
    try:
        results = await asyncio.wait_for(
            asyncio.gather(*coros, return_exceptions=True),
            timeout=60,
        )
    except asyncio.TimeoutError:
        print("[AutoPolish] Timeout - menggunakan data asli")
        return data

    # ── Proses hasil tiap task ────────────────────────────────────────────
    for key, result in zip(keys, results):
        if isinstance(result, Exception) or not result:
            print(f"[AutoPolish] Skip '{key}': {result}")
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

        elif key == "tata_tertib":
            items = _parse_numbered_list(text)
            if items:
                # Simpan sebagai generated tata tertib perusahaan (terpisah dari SMKN4 resmi)
                gen["tata_tertib_perusahaan_polished"] = items

        elif key == "job_descriptions":
            jobs = _parse_job_descriptions(text)
            if jobs:
                profil = data.setdefault("profil_perusahaan", {})
                profil["job_descriptions"] = jobs

        elif key == "kegiatan":
            polished = _parse_kegiatan_polished(text, data.get("kegiatan", []))
            if polished:
                data["kegiatan"] = polished

        elif key == "peralatan":
            polished = _parse_peralatan_polished(text, data.get("peralatan", []))
            if polished:
                data["peralatan"] = polished

    data["generated_sections"] = gen
    return data




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
        Draft.user_id == user.id,
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
    data = await _auto_polish_on_generate(data)

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
    return FileResponse(
        path=output_path,
        filename=download_name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
