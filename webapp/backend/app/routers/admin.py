"""Router Administrasi (Admin & RBAC).

Endpoint terproteksi khusus role `admin` (dan `guru` untuk sebagian fitur moderasi).
"""
from __future__ import annotations

import datetime as dt
import os
import shutil
import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import UPLOADS_DIR, settings
from ..db import get_db
from ..dependencies import require_admin, require_staff
from ..models import AuditLog, Draft, SystemConfig, User
from ..security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


def log_admin_action(
    db: Session,
    actor: User,
    action: str,
    target: str | None = None,
    details: dict | None = None,
    request: Request | None = None,
) -> None:
    """Helper untuk mencatat jejak audit (AuditLog) secara transaksional."""
    ip_addr = request.client.host if request and request.client else None
    audit = AuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        action=action,
        target=target,
        details=details or {},
        ip_address=ip_addr,
    )
    db.add(audit)
    db.commit()


# --------------------------------------------------------------------------- #
#  Schemas                                                                     #
# --------------------------------------------------------------------------- #
class UserCreateIn(BaseModel):
    email: EmailStr
    name: str = Field(..., max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="siswa", pattern="^(admin|guru|siswa)$")


class UserRoleUpdateIn(BaseModel):
    role: str = Field(..., pattern="^(admin|guru|siswa)$")


class UserStatusUpdateIn(BaseModel):
    is_active: bool


class PasswordResetIn(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


def default_pejabat_jurusan() -> dict[str, dict[str, str]]:
    return {
        "rpl": {"nama": "Rudi Hartono, S.Kom.", "nip": "19850514 201001 1 009"},
        "tkj": {"nama": "Ahmad Fauzi, S.T.", "nip": "19830311 200801 1 005"},
        "bdp": {"nama": "Siti Maryam, S.E.", "nip": "19810722 200604 2 003"},
        "akl": {"nama": "Dra. Nurhayati", "nip": "19760415 200212 2 002"},
        "mp": {"nama": "Hendra Wijaya, S.Pd.", "nip": "19840910 200903 1 007"},
        "tb": {"nama": "Dewi Sartika, S.Pd.", "nip": "19871105 201101 2 008"},
    }


class SystemConfigIn(BaseModel):
    school_name: str = "SMK Negeri 4 Bandar Lampung"
    school_name_full: str = "SMK Negeri 4 Bandar Lampung"
    alamat: str = "Jl. HOS Cokroaminoto No. 102, Enggal, Bandar Lampung"
    kota: str = "Bandar Lampung"
    telp: str = "(0721) 262637"
    email: str = "smkn4bl@yahoo.co.id"
    website: str = "https://smkn4-bdl.sch.id"
    kop_baris_1: str = "PEMERINTAH PROVINSI LAMPUNG"
    kop_baris_2: str = "DINAS PENDIDIKAN DAN KEBUDAYAAN"
    kop_baris_3: str = "SMK NEGERI 4 BANDAR LAMPUNG"
    npsn: str = "10807215"
    nss: str = "401126003028"
    kepala_sekolah: str = "HJ. Dewi Ningsih, S.Pd., M.Pd."
    nip_kepala_sekolah: str = "19750312 200312 2 004"
    waka_humas: str = "Mas Azizah, M.Pd"
    nip_waka_humas: str = "19781015 200902 2 001"
    pembimbing_sekolah: str = "Siti Rahma, S.Pd."
    nip_pembimbing_sekolah: str = "19820101 200701 2 011"
    pejabat_jurusan: dict[str, dict[str, str]] = Field(default_factory=default_pejabat_jurusan)
    ai_model_default: str = "deepseek-opencode"
    ai_max_tokens_per_req: int = 2048


# --------------------------------------------------------------------------- #
# 1. Dashboard Overview & Statistics                                          #
# --------------------------------------------------------------------------- #
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Mengembalikan statistik ringkasan sistem untuk Dashboard Admin."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    users_by_role = {
        "admin": db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0,
        "guru": db.query(func.count(User.id)).filter(User.role == "guru").scalar() or 0,
        "siswa": db.query(func.count(User.id)).filter(User.role == "siswa").scalar() or 0,
    }

    total_drafts = db.query(func.count(Draft.id)).scalar() or 0
    drafts_by_status = {
        "collecting": db.query(func.count(Draft.id)).filter(Draft.status == "collecting").scalar() or 0,
        "reviewing": db.query(func.count(Draft.id)).filter(Draft.status == "reviewing").scalar() or 0,
        "ready": db.query(func.count(Draft.id)).filter(Draft.status == "ready").scalar() or 0,
    }

    # Hitung total ukuran folder uploads/
    uploads_bytes = 0
    uploads_file_count = 0
    if UPLOADS_DIR.exists():
        for p in UPLOADS_DIR.rglob("*"):
            if p.is_file():
                uploads_bytes += p.stat().st_size
                uploads_file_count += 1

    # Database file size
    db_file = Path(settings.database_url.replace("sqlite:///", ""))
    db_size_bytes = db_file.stat().st_size if db_file.exists() else 0

    return {
        "users": {
            "total": total_users,
            "by_role": users_by_role,
        },
        "drafts": {
            "total": total_drafts,
            "by_status": drafts_by_status,
        },
        "storage": {
            "uploads_bytes": uploads_bytes,
            "uploads_mb": round(uploads_bytes / (1024 * 1024), 2),
            "uploads_files": uploads_file_count,
            "db_bytes": db_size_bytes,
            "db_mb": round(db_size_bytes / (1024 * 1024), 2),
        },
        "system": {
            "ai_enabled": settings.ai_enabled,
            "ai_model": settings.ai_model,
            "environment": settings.environment,
        },
    }


# --------------------------------------------------------------------------- #
# 2. User Management                                                         #
# --------------------------------------------------------------------------- #
@router.get("/users")
def list_users(
    search: str | None = None,
    role: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menampilkan daftar seluruh user dengan fitur pencarian dan filter role."""
    query = db.query(User)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(s)) | (User.email.ilike(s)))
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for u in users:
        draft_count = db.query(func.count(Draft.id)).filter(Draft.user_id == u.id).scalar() or 0
        items.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat(),
            "draft_count": draft_count,
        })

    return {"total": total, "items": items}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateIn,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Membuat akun user baru secara manual oleh Admin."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar.")

    new_user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_admin_action(db, admin, "USER_CREATE", target=new_user.email, details={"role": new_user.role}, request=req)
    return {
        "status": "success",
        "message": f"User {new_user.email} berhasil dibuat dengan role {new_user.role}.",
        "user_id": new_user.id,
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateIn,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Mengubah role user (dengan proteksi self-demotion untuk admin)."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan.")

    if target_user.id == admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menurunkan role akun admin Anda sendiri.",
        )

    old_role = target_user.role
    target_user.role = payload.role
    db.commit()

    log_admin_action(db, admin, "USER_ROLE_UPDATE", target=target_user.email, details={"from": old_role, "to": payload.role}, request=req)
    return {"status": "success", "message": f"Role user {target_user.email} diubah dari {old_role} ke {payload.role}."}


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdateIn,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menonaktifkan / Mengaktifkan kembali akun user (Ban / Unban)."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan.")

    if target_user.id == admin.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menonaktifkan akun admin Anda sendiri.",
        )

    target_user.is_active = payload.is_active
    db.commit()

    act = "USER_ACTIVATE" if payload.is_active else "USER_DEACTIVATE"
    log_admin_action(db, admin, act, target=target_user.email, request=req)
    return {"status": "success", "message": f"Status user {target_user.email} diubah menjadi {'Aktif' if payload.is_active else 'Non-Aktif'}."}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: PasswordResetIn,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menyetel ulang kata sandi user oleh Admin."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan.")

    target_user.password_hash = hash_password(payload.new_password)
    db.commit()

    log_admin_action(db, admin, "USER_PASSWORD_RESET", target=target_user.email, request=req)
    return {"status": "success", "message": f"Password untuk user {target_user.email} berhasil diperbarui."}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menghapus permanen user beserta seluruh draft & filenya."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan.")

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menghapus akun admin Anda sendiri.",
        )

    target_email = target_user.email
    db.delete(target_user)
    db.commit()

    log_admin_action(db, admin, "USER_DELETE", target=target_email, request=req)
    return {"status": "success", "message": f"User {target_email} beserta seluruh data draftnya telah dihapus."}


# --------------------------------------------------------------------------- #
# 3. Draft Moderation                                                         #
# --------------------------------------------------------------------------- #
@router.get("/drafts")
def list_all_drafts(
    status_filter: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff),
) -> dict[str, Any]:
    """Menampilkan seluruh draft laporan milik siswa lintas jurusan (khusus Admin & Guru)."""
    query = db.query(Draft).join(User, Draft.user_id == User.id)
    if status_filter:
        query = query.filter(Draft.status == status_filter)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((Draft.title.ilike(s)) | (User.name.ilike(s)) | (User.email.ilike(s)))

    total = query.count()
    drafts = query.order_by(Draft.updated_at.desc()).offset(skip).limit(limit).all()

    items = []
    for d in drafts:
        items.append({
            "id": d.id,
            "user_id": d.user_id,
            "user_name": d.user.name if d.user else "Unknown",
            "user_email": d.user.email if d.user else "Unknown",
            "title": d.title,
            "status": d.status,
            "jurusan": d.data_json.get("siswa", {}).get("jurusan", "-"),
            "created_at": d.created_at.isoformat(),
            "updated_at": d.updated_at.isoformat(),
        })

    return {"total": total, "items": items}


@router.get("/drafts/{draft_id}")
def inspect_draft_detail(
    draft_id: str,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff),
) -> dict[str, Any]:
    """Melihat detail lengkap PklContext suatu draft (khusus Admin & Guru)."""
    draft = db.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft tidak ditemukan.")

    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "user_email": draft.user.email if draft.user else "",
        "user_name": draft.user.name if draft.user else "",
        "title": draft.title,
        "status": draft.status,
        "data_json": draft.data_json,
        "created_at": draft.created_at.isoformat(),
        "updated_at": draft.updated_at.isoformat(),
    }


@router.delete("/drafts/{draft_id}")
def force_delete_draft(
    draft_id: str,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menghapus paksa draft siswa bermasalah (khusus Admin)."""
    draft = db.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft tidak ditemukan.")

    title = draft.title
    db.delete(draft)
    db.commit()

    log_admin_action(db, admin, "DRAFT_FORCE_DELETE", target=draft_id, details={"title": title}, request=req)
    return {"status": "success", "message": f"Draft '{title}' (ID: {draft_id}) telah dihapus."}


# --------------------------------------------------------------------------- #
# 4. Asset & Storage Audit                                                   #
# --------------------------------------------------------------------------- #
@router.get("/assets")
def audit_assets(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Mengaudit seluruh file terunggah di uploads/ dan mendeteksi file orphaned (tidak terpakai)."""
    if not UPLOADS_DIR.exists():
        return {"total_files": 0, "total_bytes": 0, "orphaned_count": 0, "items": []}

    # Kumpulkan seluruh nama file yang saat ini dirujuk di DB drafts
    referenced_filenames: set[str] = set()
    all_drafts = db.query(Draft).all()
    for d in all_drafts:
        raw_str = str(d.data_json)
        # Ekstrak kata berpola gambar/file
        import re
        matches = re.findall(r'[\w\-]+\.(?:png|jpg|jpeg|webp)', raw_str, re.IGNORECASE)
        for m in matches:
            referenced_filenames.add(m.lower())

    files = []
    orphaned_count = 0
    total_bytes = 0

    for p in UPLOADS_DIR.rglob("*"):
        if p.is_file():
            size = p.stat().st_size
            total_bytes += size
            fname = p.name
            is_orphaned = fname.lower() not in referenced_filenames
            if is_orphaned:
                orphaned_count += 1

            rel_path = str(p.relative_to(UPLOADS_DIR)).replace("\\", "/")
            files.append({
                "filename": fname,
                "relative_path": rel_path,
                "size_bytes": size,
                "size_kb": round(size / 1024, 1),
                "is_orphaned": is_orphaned,
            })

    return {
        "total_files": len(files),
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 2),
        "orphaned_count": orphaned_count,
        "items": files[:200],  # Limit to 200 items for view
    }


@router.post("/assets/cleanup")
def cleanup_orphaned_assets(
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Membersihkan otomatis seluruh file gambar yang tidak lagi terikat pada draft mana pun."""
    audit_res = audit_assets(db=db, admin=admin)
    cleaned_count = 0
    freed_bytes = 0

    referenced_filenames: set[str] = set()
    all_drafts = db.query(Draft).all()
    for d in all_drafts:
        import re
        matches = re.findall(r'[\w\-]+\.(?:png|jpg|jpeg|webp)', str(d.data_json), re.IGNORECASE)
        for m in matches:
            referenced_filenames.add(m.lower())

    if UPLOADS_DIR.exists():
        for p in UPLOADS_DIR.rglob("*"):
            if p.is_file():
                if p.name.lower() not in referenced_filenames:
                    try:
                        sz = p.stat().st_size
                        p.unlink()
                        cleaned_count += 1
                        freed_bytes += sz
                    except Exception as e:
                        print(f"⚠️ Failed to remove orphaned file {p}: {e}")

    log_admin_action(
        db, admin, "ASSET_CLEANUP_ORPHANS",
        details={"cleaned_files": cleaned_count, "freed_bytes": freed_bytes},
        request=req
    )
    return {
        "status": "success",
        "message": f"Berhasil menghapus {cleaned_count} file orphaned, membebaskan {round(freed_bytes / (1024*1024), 2)} MB ruang penyimpanan.",
        "cleaned_count": cleaned_count,
        "freed_bytes": freed_bytes,
    }


# --------------------------------------------------------------------------- #
# 5. System Configuration                                                    #
# --------------------------------------------------------------------------- #
@router.get("/settings")
def get_system_settings(
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff),
) -> dict[str, Any]:
    """Mengambil konfigurasi identitas sekolah dan AI default dari database."""
    cfg = db.get(SystemConfig, "global_settings")
    if not cfg:
        default_val = SystemConfigIn().model_dump()
        return {"key": "global_settings", "data": default_val}
    return {"key": "global_settings", "data": cfg.value_json}


@router.put("/settings")
def update_system_settings(
    payload: SystemConfigIn,
    req: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Memperbarui konfigurasi Kop Sekolah & AI secara terpusat oleh Admin."""
    cfg = db.get(SystemConfig, "global_settings")
    val_json = payload.model_dump()

    if not cfg:
        cfg = SystemConfig(key="global_settings", value_json=val_json)
        db.add(cfg)
    else:
        cfg.value_json = val_json

    db.commit()
    log_admin_action(db, admin, "SYSTEM_SETTINGS_UPDATE", details=val_json, request=req)
    return {"status": "success", "message": "Konfigurasi terpusat berhasil diperbarui."}


# --------------------------------------------------------------------------- #
# 6. System Logs & Diagnostics                                               #
# --------------------------------------------------------------------------- #
@router.get("/logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Menampilkan riwayat jejak audit (AuditLog) aktivitas administrator."""
    total = db.query(func.count(AuditLog.id)).scalar() or 0
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_email": l.actor_email,
            "action": l.action,
            "target": l.target,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat(),
        })

    return {"total": total, "items": items}


@router.get("/health-detail")
def get_system_health_detail(
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    """Pemeriksaan diagnostik mendalam untuk environment & binary pendukung."""
    # Check LibreOffice executable
    soffice_path = shutil.which("soffice") or shutil.which("libreoffice")

    # Disk usage
    disk_total, disk_used, disk_free = shutil.disk_usage("/")

    return {
        "status": "healthy",
        "python_version": sys.version,
        "os_platform": sys.platform,
        "libreoffice_available": bool(soffice_path),
        "libreoffice_path": soffice_path or "Not Found (Falling back to python-docx page estimate)",
        "disk": {
            "total_gb": round(disk_total / (1024**3), 2),
            "used_gb": round(disk_used / (1024**3), 2),
            "free_gb": round(disk_free / (1024**3), 2),
        },
        "env_settings": {
            "environment": settings.environment,
            "ai_enabled": settings.ai_enabled,
            "ai_base_url": settings.ai_base_url,
            "ai_model": settings.ai_model,
        },
    }
