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
    """Bikin semua tabel. Dipanggil saat startup (idempotent). Set WAL mode untuk SQLite & jalankan auto-migrasi kolom."""
    from . import models  # noqa: F401  (register models di metadata)

    Base.metadata.create_all(bind=engine)
    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            except Exception as e:
                print(f"⚠️ Warning: Gagal set WAL mode SQLite ({e}), fallback ke mode default.")

            try:
                result = conn.exec_driver_sql("PRAGMA table_info(users);").fetchall()
                columns = [row[1] for row in result]
                if "role" not in columns:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'siswa' NOT NULL;")
                    print("✅ Migrasi SQLite: Kolom 'role' berhasil ditambahkan ke tabel users.")
                if "is_active" not in columns:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL;")
                    print("✅ Migrasi SQLite: Kolom 'is_active' berhasil ditambahkan ke tabel users.")
                if "last_login" not in columns:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login DATETIME;")
                    print("✅ Migrasi SQLite: Kolom 'last_login' berhasil ditambahkan ke tabel users.")

                result_drafts = conn.exec_driver_sql("PRAGMA table_info(drafts);").fetchall()
                draft_columns = [row[1] for row in result_drafts]
                if "version_id" not in draft_columns:
                    conn.exec_driver_sql("ALTER TABLE drafts ADD COLUMN version_id INTEGER DEFAULT 1 NOT NULL;")
                    print("✅ Migrasi SQLite: Kolom 'version_id' berhasil ditambahkan ke tabel drafts.")
                conn.commit()
            except Exception as e:
                print(f"⚠️ Warning: Auto-migration SQLite error: {e}")
