"""Router Assets — POST /assets/upload.

Upload gambar/file untuk laporan PKL (logo, foto dokumentasi, dll).
"""
from __future__ import annotations

import os
import uuid

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


@router.post("/upload", response_model=AssetInfo)
async def upload_asset(
    file: UploadFile = File(...),
    type: str = Form("foto"),
    user: User = Depends(get_current_user),
) -> AssetInfo:
    """Upload asset file (gambar logo, foto dokumentasi, dll)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nama file tidak boleh kosong.")

    # Validate extension
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format file '{ext}' tidak didukung. Gunakan: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read file contents
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file terlalu besar (maks 10MB).")

    # Generate unique filename with user ID owner scoping
    asset_id = f"A-{uuid.uuid4().hex[:8]}"
    safe_name = f"u{user.id}_{asset_id}{ext}"

    # Ensure assets directory exists
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Save file
    filepath = ASSETS_DIR / safe_name
    with open(filepath, "wb") as f:
        f.write(contents)

    return AssetInfo(
        id=asset_id,
        filename=safe_name,
        original_name=file.filename,
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
                # Remove owner prefix and extension to get asset_id
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
    safe_asset_id = os.path.basename(asset_id).strip()
    if not safe_asset_id or ".." in safe_asset_id or "/" in safe_asset_id or "\\" in safe_asset_id:
        raise HTTPException(status_code=400, detail="Asset ID tidak valid.")

    owner_prefix = f"u{user.id}_"
    found_other_owner = False

    for fname in os.listdir(ASSETS_DIR):
        if safe_asset_id in fname:
            target_path = (ASSETS_DIR / fname).resolve()
            # Double check path stays inside ASSETS_DIR
            if ASSETS_DIR.resolve() in target_path.parents:
                if fname.startswith(owner_prefix):
                    target_path.unlink()
                    return {"status": "deleted", "id": safe_asset_id}
                else:
                    found_other_owner = True

    if found_other_owner:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk menghapus asset ini.")

    raise HTTPException(status_code=404, detail="Asset tidak ditemukan.")
