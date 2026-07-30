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

        # Generate candidate base_urls for Docker-to-Host fallback
        self.candidate_urls = [self.base_url]
        if "host.docker.internal" in self.base_url:
            port = "20128"
            if ":" in self.base_url.split("//")[-1]:
                port = self.base_url.split(":")[-1].split("/")[0]
            path = "/v1" if self.base_url.endswith("/v1") else ""

            for host_ip in ["172.17.0.1", "172.18.0.1", "10.0.75.1", "127.0.0.1", "localhost"]:
                candidate = f"http://{host_ip}:{port}{path}"
                if candidate not in self.candidate_urls:
                    self.candidate_urls.append(candidate)

        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key != "not-needed" else {}
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout, connect=10.0),
            headers=headers
        )

    async def generate(self, system: str, user: str) -> str:
        """Call the /chat/completions endpoint with exponential backoff & URL candidate fallback."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.7,
        }

        last_error = None

        # Try active base_url first, then fallback candidates if connection refused
        for base in self.candidate_urls:
            endpoint = f"{base}/chat/completions"

            max_retries = 2
            retry_delay = 0.5

            for attempt in range(1, max_retries + 1):
                try:
                    resp = await self.client.post(endpoint, json=payload)
                    if resp.status_code != 200:
                        print(f"[AI Provider HTTP Error {resp.status_code}] URL: {endpoint} Body: {resp.text[:300]}")
                    resp.raise_for_status()

                    # Connection successful, pin this working base_url
                    if base != self.base_url:
                        print(f"[AI Provider Fallback Success] Switched active base_url to {base}")
                        self.base_url = base

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

                except (httpx.ConnectError, httpx.ConnectTimeout) as e:
                    print(f"[AI Provider Unreachable] {endpoint} unreachable (Attempt {attempt}): {e}")
                    last_error = e
                    # Break loop to try next candidate IP immediately
                    break

                except httpx.HTTPStatusError as e:
                    print(f"[AI Provider Status Error {e.response.status_code}] URL: {endpoint} Text: {e.response.text}")
                    if e.response.status_code < 500:
                        raise RuntimeError(f"AI Provider client error ({e.response.status_code}): {e.response.text[:200]}")
                    last_error = e

                except httpx.TimeoutException as e:
                    last_error = e
                    print(f"[AI Provider Timeout] URL: {endpoint} (Attempt {attempt}): {e}")

                except Exception as e:
                    last_error = e
                    print(f"[AI Provider Error] URL: {endpoint}: {e}")

                if attempt < max_retries:
                    await asyncio.sleep(retry_delay)

        raise RuntimeError(f"Gagal terhubung ke 9router di {self.base_url} (Port 20128): {last_error}")

