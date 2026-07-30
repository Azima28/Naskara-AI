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


def get_ai_provider() -> AIProvider:
    if not settings.ai_enabled:
        return DummyProvider()

    # Saat ini hanya support OpenAICompatibleProvider (yang bisa digunakan untuk 9router, LM Studio, Ollama, dll)
    return OpenAICompatibleProvider(
        base_url=settings.ai_base_url,
        model=settings.ai_model,
        api_key=settings.ai_api_key,
        timeout=settings.ai_timeout,
    )
