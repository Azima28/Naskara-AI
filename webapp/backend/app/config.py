"""Konfigurasi aplikasi. Semua nilai berasal dari environment / .env.

Naskara AI Engine - Version 1.2.0 (Multi-Model Endpoint Customization & DB-Runtime Sync)

Default formatting diambil dari references/formatting-defaults.md:
- Times New Roman 12pt, spasi 1.5, justify
- Margin default 4-4-3-3 (atas-bawah-kiri-kanan), left lebih lebar untuk jilid.
"""
from pathlib import Path
from pydantic import model_validator
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

INSECURE_SECRET_KEYS = {
    "ganti-saya-jadi-string-acak-panjang",
    "naskara-prod-secret-key-change-this-in-production",
    "naskara-prod-secret-key-smkn4-bandarlampung-2026",
    "dev_secret",
    "secret",
    "change_me_in_production",
    "supersecret",
    "naskara-secret-key",
    "default",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "Naskara AI"
    debug: bool = False
    environment: str = "development"
    frontend_origin: str = "http://localhost:5173"

    # Database
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'pkl_reports.db').as_posix()}"

    # Security
    secret_key: str = "naskara-prod-secret-key-smkn4-bandarlampung-2026-fixed-secure-key-64chars-prod"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 hari
    enable_rate_limit: bool = True

    # Maintenance
    enable_maintenance_mode: bool = False

    # AI provider (9router / OpenCode / OpenAI-compatible port 20128)
    ai_enabled: bool = True
    enable_ai_security_filter: bool = True
    ai_base_url: str = "http://127.0.0.1:20128/v1"
    ai_model: str = "deepseek-opencode"
    ai_available_models: list[str] = ["deepseek-opencode", "gemini"]
    ai_model_endpoints: dict[str, str] = {
        "deepseek-opencode": "http://127.0.0.1:20128/v1",
        "gemini": "http://127.0.0.1:20128/v1",
    }
    ai_api_key: str = "not-needed"
    ai_timeout: int = 120

    @model_validator(mode="after")
    def validate_security(self) -> "Settings":
        if self.environment.lower() in ("production", "prod"):
            if self.secret_key in INSECURE_SECRET_KEYS or len(self.secret_key) < 32:
                raise ValueError(
                    "FATAL [SECURITY]: Insecure or short SECRET_KEY configured in production environment! "
                    "Must be at least 32 characters long and not a standard default."
                )
        return self


settings = Settings()


def ensure_runtime_dirs() -> None:
    """Bikin folder uploads/ dan output/ kalau belum ada (dipanggil saat startup)."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
