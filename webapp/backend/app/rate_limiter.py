"""Rate Limiter Middleware untuk proteksi L7 DDoS & Brute Force Attack.

Membatasi jumlah request per IP address berdasarkan endpoint tier:
- General endpoints: max 180 req/menit
- Auth / Login / Register: max 30 req/menit
- AI & DOCX Generate: max 60 req/menit
"""
from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


def _is_trusted_proxy(host: str) -> bool:
    if not host:
        return False
    return (
        host in ("127.0.0.1", "::1", "localhost")
        or host.startswith("172.")
        or host.startswith("10.")
        or host.startswith("192.168.")
    )


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, default_limit: int = 180, window_seconds: int = 60):
        super().__init__(app)
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        # Storage: ip -> list of timestamps
        self.requests: dict[str, list[float]] = defaultdict(list)

        # Limit per path prefix (dikendurkan agar tidak mengganggu penggunaan intensif)
        self.path_limits = {
            "/auth/login": (30, 60),      # 30 req/menit
            "/auth/register": (30, 60),   # 30 req/menit
            "/generate": (60, 60),        # 60 req/menit (DOCX generate)
            "/ai/": (180, 60),            # 180 req/menit (LLM API generation)
            "/assets/upload": (60, 60),   # 60 req/menit
            "/drafts": (180, 60),         # 180 req/menit
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        from .config import settings

        if not getattr(settings, "enable_rate_limit", True):
            return await call_next(request)

        direct_ip = request.client.host if request.client else "127.0.0.1"

        # Bypass rate limiter for localhost/127.0.0.1 in development environment
        if settings.environment.lower() == "development" and direct_ip in ("127.0.0.1", "::1", "localhost"):
            return await call_next(request)

        if _is_trusted_proxy(direct_ip):
            # CF-Connecting-IP: set by Cloudflare edge, not spoofable through tunnel
            # X-Real-IP: set by nginx ($remote_addr), useful when accessed without Cloudflare
            client_ip = (
                request.headers.get("cf-connecting-ip")
                or request.headers.get("x-real-ip")
                or direct_ip
            )
        else:
            client_ip = direct_ip

        now = time.time()
        path = request.url.path

        # Determine limit for this path
        max_requests = self.default_limit
        window = self.window_seconds
        for prefix, (p_limit, p_window) in self.path_limits.items():
            if path.startswith(prefix):
                max_requests = p_limit
                window = p_window
                break

        key = f"{client_ip}:{path}" if path in self.path_limits else client_ip
        timestamps = self.requests[key]

        # Filter out timestamps outside window
        cutoff = now - window
        timestamps = [t for t in timestamps if t > cutoff]
        self.requests[key] = timestamps

        if len(timestamps) >= max_requests:
            retry_after = int(window - (now - timestamps[0])) if timestamps else window
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Terlalu banyak permintaan (Rate limit exceeded). Silakan coba beberapa saat lagi.",
                    "retry_after_seconds": max(1, retry_after)
                },
                headers={"Retry-After": str(max(1, retry_after))}
            )

        timestamps.append(now)
        response = await call_next(request)
        return response
