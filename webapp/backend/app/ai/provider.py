"""Abstraksi AI Provider.

Mendukung 9router, LM Studio, Ollama, dan endpoint OpenAI-compatible lainnya.
"""
from __future__ import annotations

import json
import httpx
from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, system: str, user: str) -> str:
        """Generate response based on system and user prompts."""
        pass


class OpenAICompatibleProvider(AIProvider):
    def __init__(self, base_url: str, model: str, api_key: str = "not-needed", timeout: int = 120):
        self.base_url = base_url
        self.model = model
        self.api_key = api_key
        self.timeout = timeout
        
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key != "not-needed" else {}
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout, headers=headers)

    async def generate(self, system: str, user: str) -> str:
        """Call the /chat/completions endpoint."""
        try:
            resp = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": 0.7,
                }
            )
            resp.raise_for_status()
            text = resp.text.strip()
            if "data: [DONE]" in text:
                text = text.split("data: [DONE]")[0].strip()
            data = json.loads(text)
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"AI Provider error: {e}")

