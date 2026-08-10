"""Router Assets — POST /assets/upload.

Upload gambar/file untuk laporan PKL (logo, foto dokumentasi, dll).
"""
from __future__ import annotations

import os
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models import User
from ..config import UPLOADS_DIR

router = APIRouter(prefix="/assets", tags=["assets"])

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ASSETS_DIR = UPLOADS_DIR / "assets"

class AssetInfo(BaseModel):
    id: str
    filename: str
    original_name: str
    type: str


def validate_image_magic_bytes(contents: bytes, ext: str) -> None:
    """Verifikasi bahwa file byte benar-benar gambar valid berdasarkan magic bytes header."""
    if len(contents) < 12:
        raise HTTPException(status_code=400, detail="File gambar terlalu kecil atau rusak.")

    header = contents[:12]
    if ext in ('.jpg', '.jpeg'):
        if not header.startswith(b'\xff\xd8\xff'):
            raise HTTPException(status_code=400, detail="File JPEG/JPG tidak valid (Magic bytes mismatch).")
    elif ext == '.png':
        if not header.startswith(b'\x89PNG\r\n\x1a\n'):
            raise HTTPException(status_code=400, detail="File PNG tidak valid (Magic bytes mismatch).")
    elif ext == '.gif':
        if not (header.startswith(b'GIF87a') or header.startswith(b'GIF89a')):
            raise HTTPException(status_code=400, detail="File GIF tidak valid (Magic bytes mismatch).")
    elif ext == '.webp':
        if not (header.startswith(b'RIFF') and header[8:12] == b'WEBP'):
            raise HTTPException(status_code=400, detail="File WEBP tidak valid (Magic bytes mismatch).")
    elif ext == '.bmp':
        if not header.startswith(b'BM'):
            raise HTTPException(status_code=400, detail="File BMP tidak valid (Magic bytes mismatch).")


@router.post("/upload", response_model=AssetInfo)
async def upload_asset(
    file: UploadFile = File(...),
    type: str = Form("foto"),
    user: User = Depends(get_current_user),
) -> AssetInfo:
    """Upload asset file (gambar logo, foto dokumentasi, dll)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nama file tidak boleh kosong.")

    # Sanitize original filename to prevent Path Traversal
    raw_filename = os.path.basename(file.filename).replace("\0", "").strip()
    if not raw_filename or ".." in raw_filename or "/" in raw_filename or "\\" in raw_filename:
        raise HTTPException(status_code=400, detail="Nama file tidak valid.")

    # Validate extension
    ext = Path(raw_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format file '{ext}' tidak didukung. Gunakan: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read file contents
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file terlalu besar (maks 10MB).")

    # Validate Magic Bytes (File Signature)
    validate_image_magic_bytes(contents, ext)

    # Generate unique filename with user ID owner scoping
    asset_id = f"A-{uuid.uuid4().hex[:8]}"
    safe_name = f"u{user.id}_{asset_id}{ext}"

    # Ensure assets directory exists
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Save file securely & verify path stays inside ASSETS_DIR
    filepath = (ASSETS_DIR / safe_name).resolve()
    if ASSETS_DIR.resolve() not in filepath.parents:
        raise HTTPException(status_code=400, detail="Jalur file tidak valid (Path Traversal).")

    with open(filepath, "wb") as f:
        f.write(contents)

    return AssetInfo(
        id=asset_id,
        filename=safe_name,
        original_name=raw_filename,
        type=type,
    )


@router.get("/list")
async def list_assets(
    user: User = Depends(get_current_user),
) -> list[AssetInfo]:
    """List assets uploaded by the authenticated user."""
    if not ASSETS_DIR.exists():
        return []

    owner_prefix = f"u{user.id}_"
    result = []
    for fname in os.listdir(ASSETS_DIR):
        if fname.startswith(owner_prefix):
            _, ext = os.path.splitext(fname)
            if ext.lower() in ALLOWED_EXTENSIONS:
                name_without_prefix = fname[len(owner_prefix):]
                asset_id = os.path.splitext(name_without_prefix)[0]
                result.append(AssetInfo(
                    id=asset_id,
                    filename=fname,
                    original_name=fname,
                    type="foto",
                ))
    return result


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str,
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Delete an uploaded asset owned by the authenticated user."""
    if not ASSETS_DIR.exists():
        raise HTTPException(status_code=404, detail="Asset tidak ditemukan.")

    # Sanitize asset_id to prevent Path Traversal
    safe_asset_id = os.path.basename(asset_id).replace("\0", "").strip()
    if not safe_asset_id or not re.match(r'^[A-Za-z0-9\-]+$', safe_asset_id):
        raise HTTPException(status_code=400, detail="Asset ID tidak valid.")

    owner_prefix = f"u{user.id}_"
    found_other_owner = False

    for fname in os.listdir(ASSETS_DIR):
        if safe_asset_id in fname:
            target_path = (ASSETS_DIR / fname).resolve()
            # Double check path stays strictly inside ASSETS_DIR
            if ASSETS_DIR.resolve() in target_path.parents:
                if fname.startswith(owner_prefix):
                    target_path.unlink()
                    return {"status": "deleted", "id": safe_asset_id}
                else:
                    found_other_owner = True

    if found_other_owner:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk menghapus asset ini.")

    raise HTTPException(status_code=404, detail="Asset tidak ditemukan.")
