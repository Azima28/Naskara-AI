"""Re-run hanya skenario sedang_bdp (lebih cepat dari full suite)."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from real_test_e2e import run_scenario, SCENARIOS, RESULTS
import json

async def main():
    ctx = SCENARIOS["sedang_bdp"]
    await run_scenario("sedang_bdp", ctx)
    out = Path(__file__).parent / "real_test_sedang_bdp.json"
    out.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDisimpan: {out}")

if __name__ == "__main__":
    asyncio.run(main())
