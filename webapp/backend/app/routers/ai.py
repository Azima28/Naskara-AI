"""Router AI — POST /ai/draft-section dan /ai/regenerate.

Berkomunikasi dengan AI provider untuk menghasilkan teks laporan.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from typing import Any

from ..config import settings
from ..dependencies import get_current_user
from ..models import User
from ..ai.client import get_ai_provider
from ..prompts.base import SYSTEM_PROMPT_TEMPLATE
from ..prompts.jurusan_knowledge import get_jurusan_context
from ..prompts.validator import (
    validate_ai_output,
    truncate_to_limit,
    AIOutputError,
    check_prompt_injection,
    check_off_topic_or_meta,
)
import json
import re
from ..prompts import sections
from ..prompts import ai_sections

router = APIRouter(prefix="/ai", tags=["ai"])

LIST_POLISH_SYSTEM_PROMPT = """Kamu adalah editor profesional data Laporan PKL SMK.
Tugasmu HANYA merapikan tata bahasa (EYD/Baku) dari data mentah yang diisi siswa.

ATURAN UTAMA:
1. DILARANG MEMBUAT PARAGRAF NARASI/CERITA ATAU TEKS PENGANTAR LAPORAN.
2. DILARANG MEMBUAT KALIMAT PENGANTAR ATAU PENUTUP (misal: "Berikut adalah...", "Demikian...").
3. Setiap poin aturan/tugas WAJIB BERUPA 1 KALIMAT PENDEK RINGKAS (maksimal 10-15 kata per poin).
4. DILARANG MENGARANG FAKTA ATAU ATURAN/TUGAS BARU YANG TIDAK ADA DI INPUT USER.
5. HANYA kembalikan poin-poin ringkas sesuai format tag yang diminta."""

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

from pydantic import BaseModel, Field

class DraftSectionRequest(BaseModel):
    section_key: str = Field(..., max_length=100)
    context_data: dict
    model: str | None = Field(default=None, max_length=100)

class DraftSectionOut(BaseModel):
    content: str
    warnings: list[str] = []

class ParseFullStoryRequest(BaseModel):
    cerita: str = Field(..., max_length=20000)
    jurusan_key: str = Field(default="", max_length=100)
    model: str | None = Field(default=None, max_length=100)

class RegenerateRequest(BaseModel):
    old_text: str = Field(..., max_length=20000)
    instruction: str = Field(..., max_length=2000)
    model: str | None = Field(default=None, max_length=100)

class EnhanceContextRequest(BaseModel):
    context_data: dict
    model: str | None = Field(default=None, max_length=100)

class SetActiveModelRequest(BaseModel):
    model: str = Field(..., min_length=1, max_length=100)

class AddModelRequest(BaseModel):
    model: str = Field(..., min_length=1, max_length=100)

@router.get("/models")
async def get_models(user: User = Depends(get_current_user)):
    """Mengembalikan daftar model AI yang tersedia dan model aktif default."""
    return {
        "available_models": settings.ai_available_models,
        "active_model": settings.ai_model,
    }

@router.post("/models/active")
async def set_active_model(
    req: SetActiveModelRequest,
    user: User = Depends(get_current_user)
):
    """Mengubah model AI aktif bawaan sistem."""
    model_name = req.model.strip()
    if model_name not in settings.ai_available_models:
        settings.ai_available_models.append(model_name)
    settings.ai_model = model_name
    return {
        "status": "success",
        "message": f"Model AI aktif diubah menjadi '{model_name}'",
        "active_model": settings.ai_model,
        "available_models": settings.ai_available_models,
    }

@router.post("/models/add")
async def add_model(
    req: AddModelRequest,
    user: User = Depends(get_current_user)
):
    """Menambahkan model AI baru ke daftar opsi."""
    model_name = req.model.strip()
    if model_name not in settings.ai_available_models:
        settings.ai_available_models.append(model_name)
    return {
        "status": "success",
        "message": f"Model AI '{model_name}' berhasil ditambahkan.",
        "available_models": settings.ai_available_models,
    }

@router.post("/draft-section", response_model=DraftSectionOut)
async def draft_section(
    req: DraftSectionRequest,
    user: User = Depends(get_current_user)
) -> DraftSectionOut:
    """Generate draf awal untuk bagian tertentu dari laporan PKL.

    Validasi output AI sebelum dikembalikan ke frontend.
    Auto-retry 1x jika validasi gagal dengan sistem prompt lebih ketat.
    """
    if not isinstance(req.context_data, dict) or len(str(req.context_data)) > 100_000:
        raise HTTPException(status_code=400, detail="Data konteks terlalu besar (maksimal 100KB) atau format tidak valid.")
    provider = get_ai_provider(req.model)
    
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
    elif key == "data_pengamatan_intro":
        user_prompt = ai_sections.prompt_data_pengamatan_intro(ctx, jurusan_context)
    elif key == "landasan_teori":
        user_prompt = ai_sections.prompt_landasan_teori_paraphrase()
    elif key == "pembahasan":
        user_prompt = ai_sections.prompt_hal_diperhatikan(ctx)
    elif key == "kesimpulan_saran":
        # BAB VI = index 6 dalam struktur 6-BAB SMKN4
        user_prompt = ai_sections.prompt_kesimpulan_saran(ctx, bab_num=6)
    elif key in ["tujuan", "manfaat"]:
        user_prompt = sections.prompt_tujuan_manfaat(ctx)
    elif key == "profil_sejarah":
        user_prompt = sections.prompt_profil_perusahaan(ctx)
    elif key == "visi_misi":
        user_prompt = ai_sections.prompt_visi_misi(ctx)
    elif key == "tata_tertib_perusahaan":
        user_prompt = ai_sections.prompt_tata_tertib_perusahaan(ctx)
    elif key == "job_descriptions":
        user_prompt = ai_sections.prompt_job_descriptions(ctx)
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

    system = LIST_POLISH_SYSTEM_PROMPT if key in ["tata_tertib_perusahaan", "visi_misi", "job_descriptions"] else SYSTEM_PROMPT_TEMPLATE

    if not user_prompt.strip() and key in ["tata_tertib_perusahaan", "job_descriptions"]:
        return DraftSectionOut(content="")

    # ── Generate dengan validasi + auto-retry ──────────────────────────────
    last_error = None
    for attempt in range(2):  # attempt 0 = normal, attempt 1 = retry dengan sistem lebih ketat
        try:
            current_system = system
            if attempt == 1 and system == SYSTEM_PROMPT_TEMPLATE:
                # Retry: tambahkan penekanan ulang aturan keras di awal user prompt
                user_prompt = (
                    "[PERCOBAAN KEDUA — OUTPUT SEBELUMNYA DITOLAK]\n"
                    "Ikuti aturan keras berikut dengan SANGAT KETAT:\n"
                    "1. Output HANYA paragraf narasi. DILARANG menulis heading, label, atau tag selain yang diminta.\n"
                    "2. Jika diminta tag [KESIMPULAN] dan [SARAN], tuliskan PERSIS seperti itu sebagai baris tersendiri.\n"
                    "3. Output dalam Bahasa Indonesia formal.\n\n"
                ) + user_prompt

            draft = await provider.generate(current_system, user_prompt)
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
            # Provider gagal/error (500, timeout, mati)
            print(f"[AI Provider Error] section={key}: {type(e).__name__}")
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "Sistem AI mengalami kendala. Bagian lain yang telah berhasil dibuat tetap tersimpan aman — Anda dapat melanjutkan bagian ini nanti.",
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

@router.post("/draft-section-stream")
async def draft_section_stream(
    req: DraftSectionRequest,
    user: User = Depends(get_current_user)
):
    """Stream token/chunk respon AI secara realtime via Server-Sent Events (SSE)."""
    if not isinstance(req.context_data, dict) or len(str(req.context_data)) > 100_000:
        raise HTTPException(status_code=400, detail="Data konteks terlalu besar (maksimal 100KB) atau format tidak valid.")
    provider = get_ai_provider(req.model)

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
    elif key == "data_pengamatan_intro":
        user_prompt = ai_sections.prompt_data_pengamatan_intro(ctx, jurusan_context)
    elif key == "landasan_teori":
        user_prompt = ai_sections.prompt_landasan_teori_paraphrase()
    elif key == "pembahasan":
        user_prompt = ai_sections.prompt_hal_diperhatikan(ctx)
    elif key == "kesimpulan_saran":
        user_prompt = ai_sections.prompt_kesimpulan_saran(ctx, bab_num=6)
    elif key in ["tujuan", "manfaat"]:
        user_prompt = sections.prompt_tujuan_manfaat(ctx)
    elif key == "profil_sejarah":
        user_prompt = sections.prompt_profil_perusahaan(ctx)
    elif key == "visi_misi":
        user_prompt = ai_sections.prompt_visi_misi(ctx)
    elif key == "tata_tertib_perusahaan":
        user_prompt = ai_sections.prompt_tata_tertib_perusahaan(ctx)
    elif key == "job_descriptions":
        user_prompt = ai_sections.prompt_job_descriptions(ctx)
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

    system = LIST_POLISH_SYSTEM_PROMPT if key in ["tata_tertib_perusahaan", "visi_misi", "job_descriptions"] else SYSTEM_PROMPT_TEMPLATE

    async def event_generator():
        try:
            if not user_prompt.strip() and key in ["tata_tertib_perusahaan", "job_descriptions"]:
                yield "data: [DONE]\n\n"
                return

            async for chunk in provider.generate_stream(system, user_prompt):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"[SSE AI Stream Error]: {type(e).__name__}")
            err_payload = json.dumps({"error": "Terjadi kendala saat menghasilkan konten AI. Silakan coba beberapa saat lagi."})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/regenerate")
async def regenerate(
    req: RegenerateRequest,
    user: User = Depends(get_current_user)
) -> dict[str, str]:
    """Edit/tulis ulang bagian laporan berdasarkan instruksi (Revisi AI)."""
    # 1. Check prompt injection & off-topic meta questions
    combined_input = f"{req.old_text} {req.instruction}".strip()
    is_inj, inj_msg = check_prompt_injection(combined_input)
    if is_inj:
        raise HTTPException(
            status_code=400,
            detail="Teks terdeteksi mengandung instruksi manipulasi sistem (prompt injection). Silakan perbaiki input Anda."
        )

    is_off_old, _ = check_off_topic_or_meta(req.old_text)
    is_off_inst, _ = check_off_topic_or_meta(req.instruction)
    if is_off_old or is_off_inst:
        raise HTTPException(
            status_code=400,
            detail="Teks yang Anda masukkan terdeteksi sebagai pertanyaan/obrolan santai, bukan draf Laporan PKL. Silakan masukkan teks draf kegiatan PKL Anda."
        )

    provider = get_ai_provider(req.model)

    clean_old = req.old_text.replace("<", "&lt;").replace(">", "&gt;")
    clean_inst = req.instruction.replace("<", "&lt;").replace(">", "&gt;")

    system_prompt = (
        "Kamu adalah editor laporan. Revisi teks di dalam tag <teks_asal> sesuai instruksi di dalam tag <instruksi_revisi>.\n"
        "Pertahankan gaya formal, gunakan sudut pandang orang ketiga (Penulis), "
        "dan jangan gunakan bullet points kecuali diminta.\n\n"
        "ATURAN RELEVANSI UTAMA:\n"
        "Jika <teks_asal> atau <instruksi_revisi> BUKAN MERUPAKAN DATA LAPORAN PKL (misal: pertanyaan ke AI 'kamu dari model apa', obrolan santai, atau kalimat ngawur), "
        "JANGAN PAKSA MERUBAH JADI LAPORAN. KEMBALIKAN HANYA TEKS: [REJECT_OUT_OF_SCOPE]"
    )

    user_prompt = (
        f"<teks_asal>\n{clean_old}\n</teks_asal>\n\n"
        f"<instruksi_revisi>\n{clean_inst}\n</instruksi_revisi>"
    )

    try:
        text = await provider.generate(system_prompt, user_prompt)
        text_str = text.strip()
        if "[REJECT_OUT_OF_SCOPE]" in text_str or "[REJECT_INVALID]" in text_str:
            raise HTTPException(
                status_code=400,
                detail="Teks yang Anda masukkan terdeteksi sebagai pertanyaan/obrolan santai, bukan draf Laporan PKL. Silakan masukkan draf teks kegiatan PKL Anda."
            )
        return {"content": text_str}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI Regenerate Error]: {type(e).__name__}: {e}")
        model_name = req.model or settings.ai_model
        raise HTTPException(
            status_code=503,
            detail=f"Layanan AI ('{model_name}') sedang tidak dapat dihubungi atau mengalami kendala. Gunakan model 'deepseek-opencode' yang stabil atau periksa koneksi 9Router."
        )

@router.post("/parse-full-story")
async def parse_full_story(
    req: ParseFullStoryRequest,
    user: User = Depends(get_current_user)
) -> dict:
    """Menguraikan cerita bebas siswa menjadi seluruh field yang dibutuhkan secara komprehensif."""
    is_inj, _ = check_prompt_injection(req.cerita)
    if is_inj:
        raise HTTPException(
            status_code=400,
            detail="Cerita terdeteksi mengandung instruksi manipulasi sistem (prompt injection). Silakan perbaiki input cerita Anda."
        )

    is_off, _ = check_off_topic_or_meta(req.cerita)
    if is_off:
        raise HTTPException(
            status_code=400,
            detail="Teks yang Anda masukkan terdeteksi sebagai pertanyaan/obrolan santai, bukan cerita kegiatan PKL. Silakan tuliskan pengalaman PKL Anda."
        )

    provider = get_ai_provider(req.model)
    
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
    if not isinstance(req.context_data, dict) or len(str(req.context_data)) > 100_000:
        raise HTTPException(status_code=400, detail="Data konteks terlalu besar (maksimal 100KB) atau format tidak valid.")
    provider = get_ai_provider(req.model)

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
        "peralatan": ctx.get("peralatan", []),
        "studi_kasus": {
            "judul": ctx.get("studi_kasus", {}).get("judul", ""),
            "latar_belakang": ctx.get("studi_kasus", {}).get("latar_belakang", ""),
            "proses_atau_formula": ctx.get("studi_kasus", {}).get("proses_atau_formula", ""),
            "hasil": ctx.get("studi_kasus", {}).get("hasil", ""),
            "data_angka": ctx.get("studi_kasus", {}).get("data_angka", []),
        },
        "kendala": ctx.get("kendala", []),
        "pelajaran": ctx.get("pelajaran", []),
        "refleksi_bab5": ctx.get("refleksi_bab5", ""),
        "kesimpulan_user": ctx.get("kesimpulan_user", ""),
        "saran_user": ctx.get("saran_user", ""),
    }

    system_prompt = """Kamu adalah editor profesional untuk laporan akademik siswa SMK.
Tugasmu adalah merapikan seluruh teks mentah dari formulir wizard (Kegiatan & Poin Tugas Spesifik, Peralatan & Deskripsi Alat, Kendala & Solusi, Studi Kasus Teknis & Parameter Hasil Angka, Pelajaran, Refleksi, Kesimpulan, dan Saran) menjadi bahasa formal, akademis (KBBI), dan profesional.

Banyak siswa menggunakan bahasa santai, tidak baku, atau terlalu singkat (misal: "bongkar mesin", "benerin pc", "gatau", "apa aja").

ATURAN:
1. Perbaiki tata bahasa, ejaan, dan gunakan kata baku profesional (misal: "Membongkar dan melakukan perawatan mesin", "Melakukan perbaikan dan pengujian perangkat PC").
2. Merapikan seluruh poin tugas spesifik, deskripsi alat, parameter hasil (data angka), kendala, dan studi kasus.
3. PERTAHANKAN struktur keys JSON persis sama seperti input. JANGAN menghapus atau mengubah nama field key.
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
            detail="Gagal merapikan data menggunakan AI. Silakan periksa koneksi AI atau coba lagi."
        )


@router.get("/test")
async def test_ai_connection(
    user: User = Depends(get_current_user)
) -> dict:
    """Diagnostic endpoint to test connection to local AI 9router/OpenCode."""
    provider = get_ai_provider()
    try:
        await provider.generate("Kamu adalah asisten tes.", "Jawab kata 'OK'.")
        return {
            "status": "ok",
            "message": "Koneksi ke AI Provider Berhasil!",
        }
    except Exception as e:
        print("[AI Test Connection Error]:", type(e).__name__)
        return {
            "status": "error",
            "message": "Gagal terhubung ke AI Provider.",
        }
