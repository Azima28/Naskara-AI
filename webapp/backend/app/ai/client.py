"""AI Client Factory.

Membaca konfigurasi dari settings dan mengembalikan provider AI yang tepat.
"""
from __future__ import annotations

from functools import lru_cache

from ..config import settings
from .provider import AIProvider, OpenAICompatibleProvider


class DummyProvider(AIProvider):
    """Fallback if AI is disabled."""
    async def generate(self, system: str, user: str) -> str:
        return "[DUMMY AI DRAFT]\n\nFitur AI sedang dinonaktifkan (ai_enabled=False)."


def get_ai_provider(model: str | None = None) -> AIProvider:
    if not settings.ai_enabled:
        return DummyProvider()

    selected_model = model.strip() if model and model.strip() else settings.ai_model

    # Prioritas 1: URL Base spesifik per-model dari DB (ai_model_endpoints)
    resolved_base_url = None
    if hasattr(settings, "ai_model_endpoints") and isinstance(settings.ai_model_endpoints, dict):
        resolved_base_url = settings.ai_model_endpoints.get(selected_model)

    # Prioritas 2: URL Base global dari DB / .env (ai_base_url)
    if not resolved_base_url or not str(resolved_base_url).strip():
        resolved_base_url = getattr(settings, "ai_base_url", None)

    resolved_base_url = str(resolved_base_url).strip() if resolved_base_url else ""

    # Prioritas 3: Error jelas jika AI Base URL belum diatur (tanpa fallback tebak-tebak)
    if not resolved_base_url:
        raise ValueError(
            f"AI Base URL belum diatur untuk model '{selected_model}'. "
            "Silakan atur Endpoint Base URL di Web Admin Settings."
        )

    return OpenAICompatibleProvider(
        base_url=resolved_base_url,
        model=selected_model,
        api_key=settings.ai_api_key,
        timeout=settings.ai_timeout,
    )
