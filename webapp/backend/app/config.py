"""Konfigurasi aplikasi. Semua nilai berasal dari environment / .env.

Default formatting diambil dari references/formatting-defaults.md:
- Times New Roman 12pt, spasi 1.5, justify
- Margin default 4-4-3-3 (atas-bawah-kiri-kanan), left lebih lebar untuk jilid.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Root webapp (satu tinggi di atas backend/) — dipakai untuk uploads/ & output/.
BACKEND_DIR = Path(__file__).resolve().parent.parent          # .../webapp/backend
WEBAPP_DIR = BACKEND_DIR.parent                               # .../webapp
PROJECT_DIR = WEBAPP_DIR.parent                               # .../docx_skill_package

# Aset kanonik dari skill (read-only source of truth).
REFERENCES_DIR = PROJECT_DIR / "references"
EXAMPLES_DIR = PROJECT_DIR / "examples"

# Penyimpanan runtime (di-ignore git).
UPLOADS_DIR = WEBAPP_DIR / "uploads"
OUTPUT_DIR = WEBAPP_DIR / "output"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "Naskara AI"
    debug: bool = False
    frontend_origin: str = "http://localhost:5173"

    # Database
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'pkl_reports.db').as_posix()}"

    # Security
    secret_key: str = "ganti-saya-jadi-string-acak-panjang"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 hari

    # AI provider (9router / OpenCode / OpenAI-compatible port 20128)
    ai_enabled: bool = True
    ai_base_url: str = "http://localhost:20128/v1"
    ai_model: str = "opencode"
    ai_api_key: str = "not-needed"
    ai_timeout: int = 120


settings = Settings()


def ensure_runtime_dirs() -> None:
    """Bikin folder uploads/ dan output/ kalau belum ada (dipanggil saat startup)."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
