"""Real E2E test — SKENARIO FULL (data terisi lengkap), SMKN4, jurusan RPL.

Simulasi alur web PERSIS seperti user asli (bukan Niken):
  1. Draft sections (latar_belakang, tujuan_pkl, narasi_struktur, landasan_teori,
     pembahasan, kesimpulan_saran)  — sama seperti ai.py draft_section.
  2. Auto-polish (visi_misi, tata_tertib, job_descriptions, kegiatan, peralatan)
     — sama seperti generate.py _auto_polish_on_generate.
  3. Daftar pustaka (AI → fallback deterministik).
  4. assemble_report → .docx, lalu laporkan FULL PATH hasilnya.

Jalankan:  PYTHONIOENCODING=utf-8 python -X utf8 real_test_full_rpl.py
Butuh provider AI lokal hidup (config.settings).
"""
from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.ai.client import get_ai_provider
from app.prompts.base import SYSTEM_PROMPT_TEMPLATE
from app.prompts import sections, ai_sections
from app.prompts.jurusan_knowledge import get_jurusan_context
from app.prompts.validator import validate_ai_output, truncate_to_limit
from app.docx.assembly import assemble_report, default_daftar_pustaka
from app.routers.generate import (
    _auto_polish_on_generate,
    _ai_daftar_pustaka,
)
from docx import Document

from data_full_complete import DATA_FULL

RESULTS: dict = {"sections": {}, "polish": {}, "warnings": []}


async def _gen_section(provider, key, prompt, ctx):
    """Alur ai.py draft_section: generate → validate → truncate, 1 retry.

    Provider error (timeout/500/provider mati) ditangkap seperti ai.py →
    return "" (web: 503 ke user; dokumen memakai fallback deterministik)."""
    for attempt in range(2):
        p = prompt
        if attempt == 1:
            p = ("[PERCOBAAN KEDUA — OUTPUT SEBELUMNYA DITOLAK]\n"
                 "Ikuti aturan keras: output HANYA narasi Bahasa Indonesia formal.\n\n") + prompt
        t0 = time.time()
        try:
            draft = (await provider.generate(SYSTEM_PROMPT_TEMPLATE, p)).strip()
        except Exception as e:
            dt = time.time() - t0
            RESULTS["sections"][key] = {"passed": False, "dt": round(dt, 1),
                                        "provider_error": str(e)}
            print(f"    [PROVIDER-ERROR] {key}: {e}  (web → 503; doc pakai fallback)")
            return ""
        dt = time.time() - t0
        res = validate_ai_output(draft, key, ctx)
        if res.passed:
            draft = truncate_to_limit(draft, key)
            RESULTS["sections"][key] = {
                "passed": True, "attempt": attempt + 1, "dt": round(dt, 1),
                "warnings": res.warnings, "kata": len(draft.split()),
            }
            print(f"    [OK] {key} ({dt:.1f}s, attempt {attempt+1}, {len(draft.split())} kata)")
            return draft
        RESULTS["warnings"].append(f"{key} attempt {attempt+1}: {res.errors}")
        print(f"    [RETRY] {key} attempt {attempt+1} gagal: {res.errors}")
    RESULTS["sections"][key] = {"passed": False, "dt": round(dt, 1)}
    print(f"    [GAGAL] {key} — pakai fallback deterministik")
    return ""


async def main():
    print("=" * 72)
    print("REAL E2E TEST — SKENARIO FULL (data lengkap), SMKN4, jurusan RPL")
    print("provider:", type(get_ai_provider()).__name__)
    print("=" * 72)

    provider = get_ai_provider()
    ctx = json.loads(json.dumps(DATA_FULL))  # deep copy

    # ── 1. Draft sections (persis ai.py) ───────────────────────────────────
    print("\n[1] Generate draft sections ...")
    jctx = get_jurusan_context(ctx["siswa"].get("jurusan_key", ""))
    gen = ctx.setdefault("generated_sections", {})

    gen["latar_belakang"] = await _gen_section(
        provider, "latar_belakang", sections.prompt_latar_belakang(ctx, jctx), ctx)
    gen["tujuan_pkl"] = await _gen_section(
        provider, "tujuan_pkl", ai_sections.prompt_tujuan_pkl(ctx), ctx)
    gen["narasi_struktur"] = await _gen_section(
        provider, "narasi_struktur", ai_sections.prompt_narasi_struktur(ctx), ctx)
    gen["landasan_teori"] = await _gen_section(
        provider, "landasan_teori", ai_sections.prompt_landasan_teori_paraphrase(), ctx)
    gen["pembahasan"] = await _gen_section(
        provider, "pembahasan", ai_sections.prompt_hal_diperhatikan(ctx), ctx)
    gen["kesimpulan_saran"] = await _gen_section(
        provider, "kesimpulan_saran", ai_sections.prompt_kesimpulan_saran(ctx, bab_num=6), ctx)

    # ── 2. Auto-polish (persis generate.py) ────────────────────────────────
    print("\n[2] Auto-polish (visi/misi, tata tertib, job desc, kegiatan, peralatan) ...")
    t0 = time.time()
    ctx, polished = await _auto_polish_on_generate(ctx)
    polish_failed = ctx.pop("_polish_failed", [])
    RESULTS["polish"] = {"changed": polished, "failed": polish_failed,
                         "dt": round(time.time() - t0, 1)}
    print(f"    changed={polished}  failed={polish_failed}  ({time.time()-t0:.1f}s)")

    # ── 3. Daftar pustaka ──────────────────────────────────────────────────
    print("\n[3] Daftar pustaka ...")
    refs = await _ai_daftar_pustaka(ctx)
    ctx["daftar_pustaka"] = refs or default_daftar_pustaka(ctx)
    print(f"    {len(ctx['daftar_pustaka'])} sitasi ({'AI' if refs else 'deterministik'})")

    # ── 4. Assemble .docx ──────────────────────────────────────────────────
    print("\n[4] Assemble .docx ...")
    output_path = assemble_report(ctx)
    RESULTS["output_path"] = output_path
    print(f"\n>>> FULL PATH: {output_path}")

    # ── Verifikasi struktur ────────────────────────────────────────────────
    d = Document(output_path)
    text = "\n".join(p.text.strip() for p in d.paragraphs if p.text.strip())
    import re as _re
    bab_heads = [l for l in text.split("\n") if _re.match(r"^BAB\s+[IVX]+", l)]
    bab_v = [l for l in text.split("\n") if _re.match(r"^5\.\d", l)]
    print(f"\nSTRUKTUR: {len(bab_heads)} BAB | BAB V sub={bab_v} | "
          f"Hambatan={'Hambatan' in text} | Pemecahan={'Pemecahan' in text}")
    RESULTS["struktur"] = {"bab_count": len(bab_heads), "bab_v_subs": bab_v,
                           "hambatan": "Hambatan" in text, "pemecahan": "Pemecahan" in text}

    out_json = Path(__file__).parent / "real_test_full_rpl_result.json"
    out_json.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nHasil JSON: {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
