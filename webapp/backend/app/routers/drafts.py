"""Router draft: CRUD + autosave.
"""
from __future__ import annotations

import datetime as dt
import html
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from ..db import get_db
from ..dependencies import get_current_user
from ..models import Draft, User
from ..schemas import PklContext

router = APIRouter(prefix="/drafts", tags=["drafts"])


# --------------------------------------------------------------------------- #
#  Schemas                                                                     #
# --------------------------------------------------------------------------- #
class DraftSummary(BaseModel):
    id: str
    title: str
    status: str
    data: PklContext | None = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class DraftOut(BaseModel):
    id: str
    title: str
    status: str
    data: PklContext
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class DraftCreate(BaseModel):
    title: str = Field(default="Laporan PKL", max_length=255)


class DraftUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    data: PklContext | None = None


# --------------------------------------------------------------------------- #
#  Helpers                                                                     #
# --------------------------------------------------------------------------- #
def sanitize_title(title: str | None) -> str:
    """Sanitize draft title against Stored XSS attacks using multi-pass re.sub and html.escape."""
    if not title:
        return "Laporan PKL"

    # Multi-pass HTML tag removal to prevent nested tag bypasses like <<script>script>
    clean = str(title)
    prev = None
    while prev != clean:
        prev = clean
        clean = re.sub(r'<[^>]*?>', '', clean)

    # Clean whitespace and truncate string length BEFORE escaping HTML entities
    clean_stripped = clean.strip()[:255]
    if not clean_stripped:
        return "Laporan PKL"

    # Escape special HTML characters (&, <, >, ", ')
    return html.escape(clean_stripped)


def _fmt(dt_obj: dt.datetime | None) -> str:
    if dt_obj is None:
        return ""
    return dt_obj.isoformat()


def _to_summary(d: Draft) -> DraftSummary:
    ctx = PklContext.model_validate(d.data_json) if d.data_json else PklContext()
    return DraftSummary(id=d.id, title=d.title, status=d.status, data=ctx,
                         created_at=_fmt(d.created_at), updated_at=_fmt(d.updated_at))


def _to_full(d: Draft) -> DraftOut:
    ctx = PklContext.model_validate(d.data_json) if d.data_json else PklContext()
    return DraftOut(id=d.id, title=d.title, status=d.status, data=ctx,
                    created_at=_fmt(d.created_at), updated_at=_fmt(d.updated_at))


# --------------------------------------------------------------------------- #
#  Endpoints                                                                   #
# --------------------------------------------------------------------------- #
@router.get("", response_model=list[DraftSummary])
def list_drafts(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Daftar semua draft milik user, terurut updated_at terbaru."""
    rows = (
        db.query(Draft)
        .filter(Draft.user_id == current.id)
        .order_by(Draft.updated_at.desc())
        .all()
    )
    return [_to_summary(d) for d in rows]


@router.post("", response_model=DraftOut, status_code=status.HTTP_201_CREATED)
def create_draft(payload: DraftCreate, current: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Buat draft baru. PklContext kosong (status=collecting)."""
    empty = PklContext().model_dump(mode="json")
    draft = Draft(
        user_id=current.id,
        title=sanitize_title(payload.title),
        data_json=empty,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return _to_full(draft)


@router.get("/{draft_id}", response_model=DraftOut)
def get_draft(draft_id: str, current: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    """Ambil satu draft (termasuk data_json utuh)."""
    draft = db.get(Draft, draft_id)
    if not draft or draft.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft tidak ditemukan.")
    return _to_full(draft)


@router.put("/{draft_id}", response_model=DraftOut)
def update_draft(draft_id: str, payload: DraftUpdate, current: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """Update draft (partial — autosave hanya kirim field yang berubah)."""
    draft = db.get(Draft, draft_id)
    if not draft or draft.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft tidak ditemukan.")

    if payload.title is not None:
        draft.title = sanitize_title(payload.title)
    if payload.status is not None:
        draft.status = payload.status
    if payload.data is not None:
        new_data = payload.data.model_dump(mode="json")
        existing_data = draft.data_json or {}

        # SMART MERGE: Gabungkan generated_sections lama & baru agar draf tulisan AI tidak terhapus
        existing_gen = existing_data.get("generated_sections") or {}
        new_gen = new_data.get("generated_sections") or {}
        merged_gen = {**existing_gen, **new_gen}
        new_data["generated_sections"] = merged_gen

        draft.data_json = new_data
        flag_modified(draft, "data_json")
        draft.updated_at = dt.datetime.now(dt.timezone.utc)

    db.commit()
    db.refresh(draft)
    return _to_full(draft)


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(draft_id: str, current: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """Hapus draft."""
    draft = db.get(Draft, draft_id)
    if not draft or draft.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft tidak ditemukan.")
    db.delete(draft)
    db.commit()
