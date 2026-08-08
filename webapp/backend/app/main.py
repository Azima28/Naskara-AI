"""FastAPI app — entrypoint.

Fase 0: /health + /validate + /recommend-bab.
Router lain (auth, drafts, generate, ai, uploads) didaftarkan di fase berikutnya.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import INSECURE_SECRET_KEYS, UPLOADS_DIR, ensure_runtime_dirs, settings
from .db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    ensure_runtime_dirs()
    init_db()

    # Auto-seed initial demo accounts & 100% complete simulation draft if database is fresh
    try:
        import sys
        from pathlib import Path
        backend_dir = Path(__file__).resolve().parent.parent
        if str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))
        from seed_siswa import seed
        seed()
    except Exception as e:
        print(f"⚠️ Auto-seed status: {e}")

    is_prod = settings.environment.lower() in ("production", "prod")
    is_weak = settings.secret_key in INSECURE_SECRET_KEYS or len(settings.secret_key) < 32

    if is_prod and is_weak:
        raise RuntimeError(
            "FATAL [SECURITY]: Insecure or short SECRET_KEY configured in production environment! "
            "Please set a strong SECRET_KEY (min 32 characters) in .env."
        )
    elif is_weak:
        print("⚠️ WARNING [SECURITY]: secret_key menggunakan nilai default atau terlalu pendek! Ubah SECRET_KEY di .env untuk lingkungan produksi.")
    yield
    # Shutdown: tidak ada yang perlu dibersihkan (SQLite file-based).


from .rate_limiter import RateLimiterMiddleware

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    debug=settings.debug,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob: http: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' ws: wss: http: https:; "
        "frame-ancestors 'none';"
    )
    if settings.environment.lower() in ("production", "prod"):
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Proteksi DDoS L7 & Brute Force Rate Limiter (dikendurkan untuk pemakaian intensif)
app.add_middleware(RateLimiterMiddleware, default_limit=180, window_seconds=60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
#  Routers (Fase 1+)                                                          #
# --------------------------------------------------------------------------- #
from .routers import admin, ai, assets, auth, drafts, generate  # noqa: E402

app.include_router(auth.router)
app.include_router(drafts.router)
app.include_router(generate.router)
app.include_router(ai.router)
app.include_router(assets.router)
app.include_router(admin.router)

# File upload (foto lampiran, logo, dll) disajikan sebagai file statis agar
# frontend bisa menampilkan pratinjau gambarnya.
ensure_runtime_dirs()
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "app": settings.app_name, "ai_enabled": settings.ai_enabled}


# --------------------------------------------------------------------------- #
#  Validate + recommend (di-import inline agar /validate tetap jalan walau     #
#  dependensi fase berikutnya belum lengkap).                                 #
# --------------------------------------------------------------------------- #
from .dependencies import get_current_user
from .models import User
from .validation import (  # noqa: E402
    BabRecommendation,
    ValidationResult,
    recommend_bab,
    run_validation,
)


@app.post("/validate", response_model=ValidationResult)
def validate_endpoint(
    ctx: dict,
    user: User = Depends(get_current_user),
) -> ValidationResult:
    """Validasi kelengkapan data PKL (20-poin skor, tier WAJIB/PENTING/OPSIONAL).

    Menerima PklContext sebagai dict; logika sama persis dengan
    `python scripts/validate_pkl_data.py`.
    """
    if not isinstance(ctx, dict) or len(str(ctx)) > 500_000:
        raise HTTPException(status_code=400, detail="Payload data terlalu besar atau format tidak valid.")
    return run_validation(ctx)


@app.post("/recommend-bab", response_model=BabRecommendation)
def recommend_bab_endpoint(
    ctx: dict,
    user: User = Depends(get_current_user),
) -> BabRecommendation:
    """Rekomendasi modul BAB berdasarkan kedalaman data."""
    if not isinstance(ctx, dict) or len(str(ctx)) > 500_000:
        raise HTTPException(status_code=400, detail="Payload data terlalu besar atau format tidak valid.")
    return recommend_bab(ctx)
