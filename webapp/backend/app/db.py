"""Database layer — SQLAlchemy. SQLite untuk local-first, ganti ke Postgres
cukup ubah DATABASE_URL (model sama persis).
"""
from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


# connect_args untuk SQLite: allow cross-thread access (FastAPI threadpool).
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


@contextmanager
def session_scope() -> Iterator[Session]:
    """Context manager transaksional: commit otomatis kalau sukses, rollback kalau error."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Iterator[Session]:
    """Dependency FastAPI: satu session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Bikin semua tabel. Dipanggil saat startup (idempotent)."""
    from . import models  # noqa: F401  (register models di metadata)

    Base.metadata.create_all(bind=engine)
