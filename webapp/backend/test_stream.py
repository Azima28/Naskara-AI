"""Script Pengujian Real-Time Streaming AI (On-Stream Proof Test)

Menjalankan `provider.generate_stream()` dan mencetak setiap chunk token
beserta timestamp milidetik untuk membuktikan streaming berjalan real-time (on-stream).

Cara Jalankan di Server/Container:
  python test_stream.py
  (atau dengan custom URL):
  python test_stream.py http://localhost:20128/v1
"""
import asyncio
import time
import sys
import json
from pathlib import Path

# Fix python path untuk import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.ai.client import get_ai_provider
from app.ai.provider import OpenAICompatibleProvider

async def main():
    print("=" * 70)
    print("🚀 PENGUJIAN REAL-TIME SSE STREAMING AI (ON-STREAM PROOF TEST)")
    print("=" * 70)

    override_url = sys.argv[1] if len(sys.argv) > 1 else None

    if override_url:
        provider = OpenAICompatibleProvider(base_url=override_url, model="deepseek-opencode")
    else:
        provider = get_ai_provider()

    print(f"📍 Active Base URL : {provider.base_url}")
    print(f"🤖 Active Model    : {provider.model}")
    print("-" * 70)

    system_prompt = "Kamu adalah editor laporan PKL SMK. Jawab secara ringkas."
    user_prompt = "Tuliskan 3 poin tata tertib perusahaan dalam laporan PKL."

    print("📡 Memulai koneksi SSE stream ke LLM Provider...\n")
    start_time = time.time()
    chunk_count = 0
    total_text = ""
    first_token_time = None

    try:
        async for chunk in provider.generate_stream(system_prompt, user_prompt):
            now = time.time()
            elapsed_ms = (now - start_time) * 1000

            if chunk_count == 0:
                first_token_time = elapsed_ms
                print(f"⚡ [FIRST TOKEN RECEIVED] Time to First Token (TTFT): {first_token_time:.1f} ms\n")

            chunk_count += 1
            total_text += chunk

            # Tampilkan timestamp milidetik dan isi chunk token real-time
            print(f"[{elapsed_ms:7.1f} ms] Chunk #{chunk_count:02d}: {repr(chunk)}")
            sys.stdout.flush()

        total_elapsed = (time.time() - start_time) * 1000
        print("\n" + "=" * 70)
        print("✅ STREAMING SELESAI DENGAN SUKSES!")
        print(f"📊 Total Chunk Token Received : {chunk_count}")
        if first_token_time:
            print(f"⏱️ Time to First Token (TTFT) : {first_token_time:.1f} ms")
        print(f"⏱️ Total Waktu Eksekusi       : {total_elapsed:.1f} ms")
        print("=" * 70)
        print("\n📄 TEKS KELUARAN LENGKAP:\n")
        print(total_text)
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ ERROR saat pengujian streaming: {e}")

if __name__ == "__main__":
    asyncio.run(main())
