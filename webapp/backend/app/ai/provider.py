"""Abstraksi AI Provider.

Mendukung 9router, LM Studio, Ollama, dan endpoint OpenAI-compatible lainnya.
"""
from __future__ import annotations

import asyncio
import json
import httpx
from abc import ABC, abstractmethod
from ..debug_logger import add_debug_log


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, system: str, user: str) -> str:
        """Generate response based on system and user prompts."""
        pass

    async def generate_stream(self, system: str, user: str):
        """Generate streaming response yielding content chunks."""
        text = await self.generate(system, user)
        yield text


def parse_openai_response(resp_text: str) -> str:
    """Ekstrak teks konten dari respons API OpenAI (mendukung format JSON standar, delta stream, maupun SSE data lines)."""
    text = resp_text.strip()

    # 1. Coba parse direct JSON murni
    try:
        data = json.loads(text)
        choice = data.get("choices", [{}])[0]
        msg = choice.get("message", {}) or choice.get("delta", {})
        content = msg.get("content", "")
        if content:
            return content
    except Exception:
        pass

    # 2. Coba kumpulkan baris SSE streaming (data: {...}) jika endpoint merespons dalam format SSE
    accumulated = []
    for line in text.splitlines():
        line_str = line.strip()
        if not line_str or line_str.startswith(":") or line_str == "data: [DONE]":
            continue
        if line_str.startswith("data: "):
            raw_json = line_str[6:].strip()
            try:
                data = json.loads(raw_json)
                choice = data.get("choices", [{}])[0]
                msg = choice.get("message", {}) or choice.get("delta", {})
                chunk = msg.get("content", "")
                if chunk:
                    accumulated.append(chunk)
            except Exception:
                continue

    if accumulated:
        return "".join(accumulated)

    # 3. Fallback pembersihan kurung kurawal untuk JSON terpotong
    if "data: [DONE]" in text:
        text = text.split("data: [DONE]")[0].strip()
    if text.startswith("data: "):
        text = text[6:].strip()

    last_brace = text.rfind("}")
    first_brace = text.find("{")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace + 1]

    data = json.loads(text)
    choice = data.get("choices", [{}])[0]
    msg = choice.get("message", {}) or choice.get("delta", {})
    return msg.get("content", "")


class OpenAICompatibleProvider(AIProvider):
    def __init__(self, base_url: str, model: str, api_key: str = "not-needed", timeout: int = 120):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

        # Generate candidate base_urls for dynamic Docker-Host & Native loopback fallbacks
        self.candidate_urls = [self.base_url]
        ports = ["20128"]
        if ":" in self.base_url.split("//")[-1]:
            extracted_port = self.base_url.split(":")[-1].split("/")[0]
            if extracted_port not in ports:
                ports.insert(0, extracted_port)
        path = "/v1" if self.base_url.endswith("/v1") else ""

        for p in ports:
            for host_ip in ["127.0.0.1", "localhost", "host.docker.internal", "172.17.0.1", "172.18.0.1", "10.0.75.1"]:
                candidate = f"http://{host_ip}:{p}{path}"
                if candidate not in self.candidate_urls:
                    self.candidate_urls.append(candidate)

        headers = {}
        if self.api_key and self.api_key.strip():
            headers["Authorization"] = f"Bearer {self.api_key.strip()}"

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
                        content = parse_openai_response(resp.text)
                        if content:
                            return content
                        raise ValueError("Konten teks tidak ditemukan dalam respons OpenAI")
                    except Exception as json_err:
                        msg = f"[AI Provider Invalid Response] Endpoint {endpoint} tidak mengembalikan JSON OpenAI valid: {json_err}"
                        print(msg)
                        add_debug_log(
                            level="WARNING",
                            category="AI_PROVIDER",
                            message=msg,
                            detail={"endpoint": endpoint, "model": self.model, "response_snippet": resp.text[:200]},
                            source="provider.py:generate"
                        )
                        last_error = json_err
                        break

                except (httpx.ConnectError, httpx.ConnectTimeout, httpx.RequestError, httpx.TransportError) as e:
                    msg = f"[AI Provider Unreachable/DNS Error] Endpoint {endpoint} tidak dapat dihubungi (Percobaan {attempt}): {e}"
                    print(msg)
                    add_debug_log(
                        level="ERROR",
                        category="AI_PROVIDER",
                        message=msg,
                        detail={"endpoint": endpoint, "model": self.model, "attempt": attempt, "error": str(e)},
                        source="provider.py:generate"
                    )
                    last_error = e
                    # Break loop to try next candidate IP immediately
                    break

                except httpx.HTTPStatusError as e:
                    msg = f"[AI Provider Status Error {e.response.status_code}] URL: {endpoint}"
                    print(msg)
                    add_debug_log(
                        level="ERROR",
                        category="AI_PROVIDER",
                        message=msg,
                        detail={"endpoint": endpoint, "model": self.model, "status_code": e.response.status_code, "response_body": e.response.text[:300]},
                        source="provider.py:generate"
                    )
                    if e.response.status_code < 500:
                        raise RuntimeError(f"AI Provider client error ({e.response.status_code})")
                    last_error = e

                except httpx.TimeoutException as e:
                    last_error = e
                    msg = f"[AI Provider Timeout] URL: {endpoint} (Attempt {attempt}): {e}"
                    print(msg)
                    add_debug_log(
                        level="ERROR",
                        category="AI_PROVIDER",
                        message=msg,
                        detail={"endpoint": endpoint, "model": self.model, "attempt": attempt, "error": str(e)},
                        source="provider.py:generate"
                    )

                except Exception as e:
                    last_error = e
                    msg = f"[AI Provider Error] URL: {endpoint}: {e}"
                    print(msg)
                    add_debug_log(
                        level="ERROR",
                        category="AI_PROVIDER",
                        message=msg,
                        detail={"endpoint": endpoint, "model": self.model, "error": str(e)},
                        source="provider.py:generate"
                    )

                if attempt < max_retries:
                    await asyncio.sleep(retry_delay)

        err_msg = f"Gagal terhubung ke AI Provider di {self.base_url} (Port 20128): {last_error}"
        add_debug_log(
            level="ERROR",
            category="AI_PROVIDER",
            message=err_msg,
            detail={"base_url": self.base_url, "model": self.model, "last_error": str(last_error)},
            source="provider.py:generate"
        )
        raise RuntimeError(err_msg)

    async def generate_stream(self, system: str, user: str):
        """Call /chat/completions endpoint with stream=True and yield real-time token chunks."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.7,
            "stream": True,
        }

        last_error = None
        for base in self.candidate_urls:
            endpoint = f"{base}/chat/completions"
            try:
                async with self.client.stream("POST", endpoint, json=payload) as response:
                    if response.status_code != 200:
                        response.raise_for_status()

                    if base != self.base_url:
                        self.base_url = base

                    async for line in response.aiter_lines():
                        line_str = line.strip()
                        if not line_str or line_str.startswith(":") or line_str == "data: [DONE]":
                            continue
                        if line_str.startswith("data: "):
                            raw_json = line_str[6:].strip()
                            try:
                                parsed = json.loads(raw_json)
                                delta = parsed.get("choices", [{}])[0].get("delta", {})
                                chunk = delta.get("content", "")
                                if chunk:
                                    yield chunk
                            except Exception:
                                continue
                    return
            except Exception as e:
                print(f"[AI Provider Stream Error] URL: {endpoint}: {e}")
                last_error = e

        # Fallback to non-streaming if stream endpoint has issues
        full_text = await self.generate(system, user)
        yield full_text

