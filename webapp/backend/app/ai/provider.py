"""Abstraksi AI Provider.

Mendukung 9router, LM Studio, Ollama, dan endpoint OpenAI-compatible lainnya.
"""
from __future__ import annotations

import asyncio
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
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key != "not-needed" else {}
        self.client = httpx.AsyncClient(timeout=self.timeout, headers=headers)

    async def generate(self, system: str, user: str) -> str:
        """Call the /chat/completions endpoint with exponential backoff retries on network/server errors."""
        endpoint = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.7,
        }

        max_retries = 3
        retry_delay = 1.0
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                resp = await self.client.post(endpoint, json=payload)
                resp.raise_for_status()
                try:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                except Exception:
                    text = resp.text.strip()
                    if "data: [DONE]" in text:
                        text = text.split("data: [DONE]")[0].strip()
                    last_brace = text.rfind("}")
                    if last_brace != -1:
                        text = text[:last_brace + 1]
                    data = json.loads(text)
                    return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                # Client errors (4xx) should not be retried, but Server errors (5xx) should be retried
                if e.response.status_code < 500:
                    raise RuntimeError(f"AI Provider client error ({e.response.status_code}): {e}")
                last_error = e
                print(f"[AI Provider Retry] Attempt {attempt}/{max_retries} server error ({e.response.status_code}): {e}")

            except (httpx.ConnectError, httpx.TimeoutException, httpx.RequestError) as e:
                last_error = e
                print(f"[AI Provider Retry] Attempt {attempt}/{max_retries} connection error: {e}")

            except Exception as e:
                last_error = e
                print(f"[AI Provider Retry] Attempt {attempt}/{max_retries} unexpected error: {e}")

            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2.0

        raise RuntimeError(f"AI Provider error (gagal setelah {max_retries} percobaan): {last_error}")

