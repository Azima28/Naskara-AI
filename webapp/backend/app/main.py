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

from pathlib import Path
from starlette.responses import Response, FileResponse

ALLOWED_STATIC_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}

class SecuredStaticFiles(StaticFiles):
    """StaticFiles wrapper hardened against path traversal and non-image payload execution."""

    async def get_response(self, path: str, scope) -> Response:
        resolved_uploads = Path(self.directory).resolve()
        try:
            target = (resolved_uploads / path).resolve()
        except Exception:
            return Response("Forbidden", status_code=403)

        # Prevent path traversal
        if resolved_uploads not in target.parents and target != resolved_uploads:
            return Response("Forbidden", status_code=403)

        # Restrict serving strictly to allowed image file extensions
        if target.suffix.lower() not in ALLOWED_STATIC_IMAGE_EXTENSIONS:
            return Response("Forbidden: Only image assets are served publicly", status_code=403)

        response = await super().get_response(path, scope)
        if isinstance(response, FileResponse):
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Content-Security-Policy"] = "default-src 'none'; img-src 'self' data: blob:;"
        return response

# File upload (foto lampiran, logo, dll) disajikan sebagai file statis yang telah diamankan
ensure_runtime_dirs()
app.mount("/uploads", SecuredStaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


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
