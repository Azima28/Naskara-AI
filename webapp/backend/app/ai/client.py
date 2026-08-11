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

    # Cari Base URL spesifik model jika ada di dict ai_model_endpoints, fallback ke ai_base_url global jika kosong
    resolved_base_url = (
        settings.ai_model_endpoints.get(selected_model)
        if hasattr(settings, "ai_model_endpoints") and settings.ai_model_endpoints.get(selected_model)
        else settings.ai_base_url
    )

    return OpenAICompatibleProvider(
        base_url=resolved_base_url,
        model=selected_model,
        api_key=settings.ai_api_key,
        timeout=settings.ai_timeout,
    )
