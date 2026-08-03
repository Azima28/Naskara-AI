"""Model SQLAlchemy: User & Draft.

`Draft.data_json` menyimpan PklContext utuh (18-key) sebagai JSON string.
Kita tidak menormalisasi ke puluhan tabel karena:
  - Bentuk context itu nested & dinamis (array nested kegiatan→tugas, dst).
  - Frontend mengirim/menerima context utuh per autosave.
  - Validasi/docx-gen bekerja pada dict utuh.
Penyimpanan sebagai JSON pada satu kolom cocok untuk local-first & fleksibel.
"""
from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), default="")
    # passlib hash (bcrypt).
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )

    drafts: Mapped[list["Draft"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), default="Laporan PKL")
    status: Mapped[str] = mapped_column(String(32), default="collecting")  # mirror PklContext.status
    # PklContext utuh (18-key) sebagai dict → JSON column.
    data_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=lambda: dt.datetime.now(dt.timezone.utc), onupdate=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="drafts")
