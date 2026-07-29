"""Router AI — POST /ai/draft-section dan /ai/regenerate.

Berkomunikasi dengan AI provider untuk menghasilkan teks laporan.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from typing import Any

from ..dependencies import get_current_user
from ..models import User
from ..ai.client import get_ai_provider
from ..prompts.base import SYSTEM_PROMPT_TEMPLATE
from ..prompts.jurusan_knowledge import get_jurusan_context
from ..prompts.validator import validate_ai_output, truncate_to_limit, AIOutputError
import json
import re
from ..prompts import sections
from ..prompts import ai_sections

router = APIRouter(prefix="/ai", tags=["ai"])

def extract_json_from_llm(text: str) -> dict:
    """Ekstrak JSON dari output LLM yang mungkin berisi markdown atau teks pembuka."""
    text = text.strip()
    # 1. Coba cari di dalam code block ```json ... ```
    code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text, re.IGNORECASE)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except Exception:
            pass

    # 2. Coba cari kurung kurawal pertama '{' hingga kurung kurawal terakhir '}'
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_candidate = text[first_brace:last_brace + 1]
        try:
            return json.loads(json_candidate)
        except Exception:
            pass

    # 3. Direct load sebagai fallback
    return json.loads(text)


def repair_truncated_json(text: str) -> dict:
    """Ekstrak dan perbaiki JSON dari output AI jika terpotong atau berisi markdown."""
    text = text.strip()
    try:
        return extract_json_from_llm(text)
    except Exception:
        pass

    # Coba perbaiki string JSON yang terpotong di akhir karena token limit
    first_brace = text.find('{')
    if first_brace != -1:
        candidate = text[first_brace:]
        if candidate.count('"') % 2 != 0:
            candidate += '"'
        open_curly = candidate.count('{') - candidate.count('}')
        open_square = candidate.count('[') - candidate.count(']')
        candidate += ']' * max(0, open_square)
        candidate += '}' * max(0, open_curly)
        try:
            return json.loads(candidate)
        except Exception:
            pass

    raise ValueError(f"Output AI tidak valid JSON: {text[:100]}...")

class DraftSectionRequest(BaseModel):
    section_key: str
    context_data: dict

class DraftSectionOut(BaseModel):
    content: str
    warnings: list[str] = []

class ParseFullStoryRequest(BaseModel):
    cerita: str
    jurusan_key: str

class RegenerateRequest(BaseModel):
    old_text: str
    instruction: str

class EnhanceContextRequest(BaseModel):
    context_data: dict

@router.post("/draft-section", response_model=DraftSectionOut)
async def draft_section(
    req: DraftSectionRequest,
    user: User = Depends(get_current_user)
) -> DraftSectionOut:
    """Generate draf awal untuk bagian tertentu dari laporan PKL.
    
    Validasi output AI sebelum dikembalikan ke frontend.
    Auto-retry 1x jika validasi gagal dengan sistem prompt lebih ketat.
    """
    provider = get_ai_provider()
    
    ctx = req.context_data
    siswa = ctx.get("siswa", {})
    jurusan_key = siswa.get("jurusan_key", "")
    jurusan_context = get_jurusan_context(jurusan_key)
    
    key = req.section_key
    if key == "latar_belakang":
        user_prompt = sections.prompt_latar_belakang(ctx, jurusan_context)
    elif key == "tujuan_pkl":
        user_prompt = ai_sections.prompt_tujuan_pkl(ctx)
    elif key == "narasi_struktur":
        user_prompt = ai_sections.prompt_narasi_struktur(ctx)
    elif key == "landasan_teori":
        user_prompt = ai_sections.prompt_landasan_teori_paraphrase()
    elif key == "pembahasan":
        user_prompt = ai_sections.prompt_hal_diperhatikan(ctx)
    elif key == "kesimpulan_saran":
        # BAB VII = index 7 dalam struktur 7-BAB SMKN4
        user_prompt = ai_sections.prompt_kesimpulan_saran(ctx, bab_num=7)
    elif key in ["tujuan", "manfaat"]:
        user_prompt = sections.prompt_tujuan_manfaat(ctx)
    elif key == "profil_sejarah":
        user_prompt = sections.prompt_profil_perusahaan(ctx)
    elif key.startswith("kegiatan_") and key.endswith("_intro"):
        bidang = key.replace("kegiatan_", "").replace("_intro", "").replace("_", " ").title()
        deskripsi = ""
        for keg in ctx.get("kegiatan", []):
            if isinstance(keg, dict) and keg.get("bidang", "").lower() == bidang.lower():
                deskripsi = keg.get("deskripsi_umum", "")
                break
        user_prompt = sections.prompt_pelaksanaan(ctx, bidang, deskripsi)
    elif key == "studi_kasus_proses":
        studi = ctx.get("studi_kasus", {})
        user_prompt = f"Buat paragraf naratif proses penyelesaian studi kasus/masalah berjudul '{studi.get('judul', '')}'. {jurusan_context}. Hindari penomoran list, gunakan gaya bercerita akademik."
    else:
        user_prompt = f"Buat narasi untuk bagian {key.replace('_', ' ')}. Ingat: Jangan pakai bullet point."

    # ── Generate dengan validasi + auto-retry ──────────────────────────────
    last_error = None
    for attempt in range(2):  # attempt 0 = normal, attempt 1 = retry dengan sistem lebih ketat
        try:
            system = SYSTEM_PROMPT_TEMPLATE
            if attempt == 1:
                # Retry: tambahkan penekanan ulang aturan keras di awal user prompt
                user_prompt = (
                    "[PERCOBAAN KEDUA — OUTPUT SEBELUMNYA DITOLAK]\n"
                    "Ikuti aturan keras berikut dengan SANGAT KETAT:\n"
                    "1. Output HANYA paragraf narasi. DILARANG menulis heading, label, atau tag selain yang diminta.\n"
                    "2. Jika diminta tag [KESIMPULAN] dan [SARAN], tuliskan PERSIS seperti itu sebagai baris tersendiri.\n"
                    "3. Output dalam Bahasa Indonesia formal.\n\n"
                ) + user_prompt

            draft = await provider.generate(system, user_prompt)
            draft = draft.strip()

            # Validasi output
            result = validate_ai_output(draft, key, ctx)

            if result.passed:
                # Truncate jika melebihi word limit
                draft = truncate_to_limit(draft, key)
                # Log warnings jika ada (tidak blokir output)
                if result.warnings:
                    print(f"[AI Warning] section={key}: {'; '.join(result.warnings)}")
                return DraftSectionOut(content=draft, warnings=result.warnings)
            else:
                last_error = result.errors
                print(f"[AI Validation Failed] section={key} attempt={attempt}: {result.errors}")
                # Jika masih ada attempt → retry
                continue

        except Exception as e:
            # Provider gagal/error (500, timeout, mati) → jangan tampilkan error
            # teknis mentah ke user. Beri tahu bahwa SISTEM yang bermasalah dan
            # hasil yang sudah berhasil tetap tersimpan (user tidak kehilangan
            # section lain yang sudah jadi — cukup lanjutkan bagian ini nanti).
            print(f"[AI Provider Error] section={key}: {e}")
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "Sistem AI sedang mengalami masalah. Bagian lain yang sudah berhasil digenerate tetap tersimpan — Anda bisa melanjutkan bagian ini nanti tanpa mengulang dari awal.",
                    "section_key": key,
                    "retryable": True,
                },
            )

    # Semua attempt gagal — sistem AI tidak menghasilkan output yang lolos validasi.
    raise HTTPException(
        status_code=422,
        detail={
            "message": "Sistem AI sedang mengalami masalah sehingga bagian ini belum bisa dibuat. Bagian lain yang sudah berhasil tetap tersimpan — Anda bisa melanjutkan bagian ini nanti.",
            "section_key": key,
            "retryable": True,
            "validation_errors": last_error or [],
        }
    )

@router.post("/regenerate")
async def regenerate(
    req: RegenerateRequest,
    user: User = Depends(get_current_user)
) -> dict[str, str]:
    """Edit/tulis ulang bagian laporan berdasarkan instruksi (Revisi AI)."""
    provider = get_ai_provider()
    
    system_prompt = (
        "Kamu adalah editor laporan. Revisi teks berikut sesuai instruksi. "
        "Pertahankan gaya formal, gunakan sudut pandang orang ketiga (Penulis), "
        "dan jangan gunakan bullet points kecuali diminta.\n\n"
        f"Teks Lama:\n{req.old_text}"
    )
    
    text = await provider.generate(system_prompt, req.instruction)
    return {"content": text}

@router.post("/parse-full-story")
async def parse_full_story(
    req: ParseFullStoryRequest,
    user: User = Depends(get_current_user)
) -> dict:
    """Menguraikan cerita bebas siswa menjadi seluruh field yang dibutuhkan secara komprehensif."""
    provider = get_ai_provider()
    
    system_prompt = """Kamu adalah asisten pengurai data laporan PKL SMK.
Tugasmu adalah mengubah cerita kegiatan PKL siswa menjadi struktur JSON yang lengkap.

Aturan:
1. Kelompokkan pekerjaan ke dalam beberapa "bidang".
2. Di dalam "bidang", buat daftar "tugas" yang dikerjakan.
3. Ekstrak peralatan/perlengkapan yang digunakan.
4. Ekstrak masalah dan solusi jika diceritakan.
5. Ekstrak hal-hal yang dipelajari dan refleksi pribadi siswa.
6. Berikan skor kualitas cerita (0-100) dan saran perbaikan.
7. Rekomendasikan BAB yang cocok berdasarkan cerita (misal: jika ada cerita rinci alat & kendala, sertakan "DATA_PENGAMATAN" dan "PEMBAHASAN").
8. OUTPUT HARUS BERUPA JSON MURNI TANPA MARKDOWN (tanpa ```json ... ```). Hanya bracket JSON.
9. Format output:
{
  "kegiatan": [
    {
      "bidang": "Nama Bidang",
      "deskripsi_umum": "Deskripsi singkat tentang bidang ini di tempat PKL",
      "tugas": [
        {
          "nama": "Nama Tugas",
          "detail": "Penjelasan detail mengenai tugas tersebut",
          "assets": []
        }
      ]
    }
  ],
  "peralatan": [
    {"nama": "Nama Alat", "deskripsi": "Fungsi alat", "gambar": ""}
  ],
  "kendala": [
    {"masalah": "Deskripsi masalah", "solusi": "Cara mengatasi masalah"}
  ],
  "pelajaran": ["Pelajaran 1", "Pelajaran 2"],
  "refleksi": "Satu paragraf tentang refleksi siswa",
  "recommended_bab": ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA", "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"],
  "quality_score": 85,
  "suggestions": ["Saran 1", "Saran 2"]
}"""

    user_prompt = f"Jurusan Siswa: {req.jurusan_key}\n\nCerita Siswa:\n{req.cerita}"
    
    try:
        text = await provider.generate(system_prompt, user_prompt)
        parsed = extract_json_from_llm(text)
        return parsed
    except Exception as e:
        print("[Parse Full Story Error]:", str(e), "Raw output:", text if 'text' in locals() else "N/A")
        if "AI Provider error" in str(e) or "Connect" in str(e) or "Timeout" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Sistem AI (LLM Provider) sedang offline atau tidak dapat dihubungi. Pastikan server AI Anda aktif."
            )
        raise HTTPException(
            status_code=500,
            detail="Gagal mengurai cerita kegiatan menggunakan AI. Silakan coba lagi nanti."
        )


@router.post("/enhance-context")
async def enhance_context(
    req: EnhanceContextRequest,
    user: User = Depends(get_current_user)
) -> dict:
    """Merapikan data mentah PKL menggunakan AI secara global (ubah 'gatau' -> kalimat formal)."""
    provider = get_ai_provider()

    ctx = req.context_data
    # Filter payload so we don't send huge non-text fields (images, kop, assets, config)
    text_payload = {
        "profil_perusahaan": {
            "sejarah": ctx.get("profil_perusahaan", {}).get("sejarah", ""),
            "visi": ctx.get("profil_perusahaan", {}).get("visi", ""),
            "misi": ctx.get("profil_perusahaan", {}).get("misi", []),
            "tata_tertib_perusahaan": ctx.get("profil_perusahaan", {}).get("tata_tertib_perusahaan", []),
            "job_descriptions": ctx.get("profil_perusahaan", {}).get("job_descriptions", []),
        },
        "kegiatan": ctx.get("kegiatan", []),
        "studi_kasus": {
            "judul": ctx.get("studi_kasus", {}).get("judul", ""),
            "latar_belakang": ctx.get("studi_kasus", {}).get("latar_belakang", ""),
            "proses_atau_formula": ctx.get("studi_kasus", {}).get("proses_atau_formula", ""),
            "hasil": ctx.get("studi_kasus", {}).get("hasil", ""),
        },
        "kendala": ctx.get("kendala", []),
        "pelajaran": ctx.get("pelajaran", []),
        "refleksi_bab5": ctx.get("refleksi_bab5", ""),
        "kesimpulan_user": ctx.get("kesimpulan_user", ""),
        "saran_user": ctx.get("saran_user", ""),
    }

    system_prompt = """Kamu adalah editor profesional untuk laporan akademik siswa SMK.
Tugasmu adalah merapikan teks mentah berikut menjadi bahasa formal, akademis (KBBI), dan profesional.
Banyak siswa menggunakan bahasa tidak baku, terlalu singkat, atau kata tidak pasti (misal: "gatau", "apa aja", "bongkar mesin").

ATURAN:
1. Perbaiki tata bahasa, ejaan, dan gunakan sudut pandang formal (Penulis).
2. Jika ada kata "gatau" / "apa saja", kembangkan menjadi deskripsi akademis yang masuk akal.
3. PERTAHANKAN struktur keys JSON persis sama seperti input. JANGAN menghapus field.
4. HANYA kembalikan JSON murni tanpa markdown (tanpa ```json)."""

    user_prompt = f"Teks Laporan Mentah (JSON):\n{json.dumps(text_payload, ensure_ascii=False)}"

    try:
        text = await provider.generate(system_prompt, user_prompt)
        enhanced_ctx = repair_truncated_json(text)

        # Deep merge AI output into original context to prevent data loss
        def deep_merge(orig, new):
            if isinstance(orig, dict) and isinstance(new, dict):
                merged = orig.copy()
                for k, v in new.items():
                    merged[k] = deep_merge(orig.get(k), v)
                return merged
            elif isinstance(orig, list) and isinstance(new, list):
                return new if new else orig
            else:
                return new if new not in [None, ""] else orig

        final_ctx = deep_merge(req.context_data, enhanced_ctx)

        return {"context_data": final_ctx}
    except Exception as e:
        print("[Enhance Context Error]:", str(e), "Raw output:", text if 'text' in locals() else "N/A")
        if "AI Provider error" in str(e) or "Connect" in str(e) or "Timeout" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Sistem AI (LLM Provider) sedang offline atau tidak dapat dihubungi. Pastikan server AI Anda aktif (port 1234/Ollama/9router)."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Gagal merapikan data menggunakan AI ({str(e)}). Silakan periksa koneksi AI atau coba lagi."
        )
