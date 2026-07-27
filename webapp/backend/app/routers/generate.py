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


async def _ai_daftar_pustaka(data: dict) -> list[str]:
    """Minta AI menyusun daftar pustaka; kembalikan [] bila gagal/dummy.

    AI hanya boleh merujuk sumber yang disebut di data user (website
    perusahaan/sekolah) + sumber publik umum tentang PKL — bukan mengarang
    buku/URL fiktif.
    """
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
    # Hasil masuk akal minimal 3 sitasi; kalau tidak, pakai fallback standar.
    return refs if len(refs) >= 3 else []


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

    # 2.5 Daftar pustaka otomatis (config.auto_daftar_pustaka, default aktif):
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
