"""Centralized Realtime System Debug Logger.

Menyimpan log debug real-time di memory buffer (circular deque max 1000 items)
dan menyediakan mekanisme streaming Server-Sent Events (SSE) & polling.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import json
import threading
import uuid
from collections import deque
from typing import Any, AsyncGenerator

# Maximum capacity in memory
MAX_LOG_ENTRIES = 1000

_log_counter = 0
_lock = threading.Lock()
_buffer: deque[dict[str, Any]] = deque(maxlen=MAX_LOG_ENTRIES)
_subscribers: set[asyncio.Queue] = set()
_loop: asyncio.AbstractEventLoop | None = None


def _get_loop() -> asyncio.AbstractEventLoop | None:
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        return None


def add_debug_log(
    level: str,
    category: str,
    message: str,
    detail: Any = None,
    source: str | None = None,
) -> dict[str, Any]:
    """Menambahkan log entry baru ke buffer memori dan menyiarkan ke subscriber SSE."""
    global _log_counter

    level_upper = level.upper().strip()
    if level_upper not in ("ERROR", "WARNING", "INFO", "DEBUG"):
        level_upper = "INFO"

    cat_upper = category.upper().strip()

    with _lock:
        _log_counter += 1
        entry_id = _log_counter
        timestamp = dt.datetime.now(dt.timezone.utc).isoformat()

        entry = {
            "id": entry_id,
            "timestamp": timestamp,
            "level": level_upper,
            "category": cat_upper,
            "message": message,
            "detail": detail if detail is not None else {},
            "source": source or "system",
        }

        _buffer.append(entry)

    # Standard console print for terminal readability
    tag = "🔴 [ERROR]" if level_upper == "ERROR" else "⚠️ [WARN]" if level_upper == "WARNING" else "ℹ️ [INFO]"
    print(f"{tag} [{cat_upper}] {message} (source: {source or 'system'})")

    # Broadcast to active SSE listeners if event loop is running
    loop = _get_loop()
    if loop and _subscribers:
        for q in list(_subscribers):
            try:
                loop.call_soon_threadsafe(q.put_nowait, entry)
            except Exception:
                pass

    return entry


def get_debug_logs(
    level: str | None = None,
    category: str | None = None,
    search: str | None = None,
    limit: int = 200,
    since_id: int = 0,
) -> list[dict[str, Any]]:
    """Mengambil daftar log debug yang terfilter berdasarkan parameter."""
    with _lock:
        entries = list(_buffer)

    result = []
    level_filter = level.upper().strip() if level and level.strip() and level.strip() != "ALL" else None
    cat_filter = category.upper().strip() if category and category.strip() and category.strip() != "ALL" else None
    search_lower = search.lower().strip() if search and search.strip() else None

    for item in entries:
        if item["id"] <= since_id:
            continue

        if level_filter:
            if level_filter == "ERROR" and item["level"] != "ERROR":
                continue
            elif level_filter == "WARNING" and item["level"] not in ("WARNING", "ERROR"):
                continue
            elif level_filter not in ("ERROR", "WARNING") and item["level"] != level_filter:
                continue

        if cat_filter and item["category"] != cat_filter:
            continue

        if search_lower:
            msg_match = search_lower in item["message"].lower()
            src_match = search_lower in item["source"].lower()
            det_match = search_lower in str(item["detail"]).lower()
            if not (msg_match or src_match or det_match):
                continue

        result.append(item)

    # Ambil log terbaru sebanyak limit, lalu urutkan secara kronologis (ID ascending: terlama di atas, terbaru di bawah)
    sliced = result[-limit:] if len(result) > limit else result
    sliced.sort(key=lambda x: x["id"])
    return sliced


def clear_debug_logs() -> None:
    """Membersihkan seluruh buffer log di memori."""
    with _lock:
        _buffer.clear()
    add_debug_log("INFO", "SYSTEM", "Buffer log debug berhasil dibersihkan oleh Administrator.", source="admin.py")


async def debug_stream_generator(request_active_check=None) -> AsyncGenerator[str, None]:
    """Generator Server-Sent Events (SSE) untuk live streaming log debug ke admin browser."""
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    _subscribers.add(q)

    try:
        # Send initial connection notice
        init_event = json.dumps({
            "type": "connected",
            "message": "Terhubung ke Live Stream Debug Naskara AI Console",
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()
        })
        yield f"data: {init_event}\n\n"

        while True:
            try:
                # Wait for new log entry with timeout for ping
                entry = await asyncio.wait_for(q.get(), timeout=15.0)
                event_data = json.dumps({"type": "log", "data": entry})
                yield f"data: {event_data}\n\n"
            except asyncio.TimeoutError:
                # Send SSE keep-alive ping
                ping = json.dumps({"type": "ping", "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()})
                yield f"data: {ping}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        _subscribers.discard(q)


# Insert initial boot log
add_debug_log("INFO", "SYSTEM", "Naskara AI Realtime Debug Engine Initialized.", detail={"max_buffer": MAX_LOG_ENTRIES}, source="debug_logger.py")
