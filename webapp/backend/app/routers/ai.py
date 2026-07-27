"""Router AI — POST /ai/draft-section dan /ai/regenerate.

Berkomunikasi dengan AI provider untuk menghasilkan teks laporan.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models import User
from ..ai.client import get_ai_provider
from ..prompts.base import SYSTEM_PROMPT_TEMPLATE
from ..prompts.jurusan_knowledge import get_jurusan_context
from ..prompts.validator import validate_ai_output, truncate_to_limit, AIOutputError
import json
from ..prompts import sections
from ..prompts import ai_sections

router = APIRouter(prefix="/ai", tags=["ai"])

class DraftSectionRequest(BaseModel):
    section_key: str
    context_data: dict

class ParseFullStoryRequest(BaseModel):
    cerita: str
    jurusan_key: str

class RegenerateRequest(BaseModel):
    old_text: str
    instruction: str

class EnhanceContextRequest(BaseModel):
    context_data: dict

@router.post("/draft-section")
async def draft_section(
    req: DraftSectionRequest,
    user: User = Depends(get_current_user)
) -> dict[str, str]:
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
                return {"content": draft, "warnings": result.warnings}
            else:
                last_error = result.errors
                print(f"[AI Validation Failed] section={key} attempt={attempt}: {result.errors}")
                # Jika masih ada attempt → retry
                continue

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Semua attempt gagal
    raise HTTPException(
        status_code=422,
        detail={
            "message": "AI output tidak valid setelah 2 percobaan. Coba generate ulang.",
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
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print("Parse error:", str(e), "Raw output:", text if 'text' in locals() else "N/A")
        raise HTTPException(status_code=500, detail="Gagal mengurai cerita kegiatan. Coba ceritakan lebih detail.")


@router.post("/enhance-context")
async def enhance_context(
    req: EnhanceContextRequest,
    user: User = Depends(get_current_user)
) -> dict:
    """Merapikan data mentah PKL menggunakan AI secara global (ubah 'gatau' -> kalimat formal)."""
    provider = get_ai_provider()
    
    system_prompt = """Kamu adalah editor profesional untuk laporan akademik siswa SMK.
Tugasmu adalah memeriksa seluruh data JSON mentah yang diisi siswa dan memperbaikinya.
Banyak siswa mengisi form dengan kata tidak baku, terlalu singkat, atau asal (misal: "gatau", "apa aja", "bongkar mesin").

ATURAN:
1. Ubah bahasa yang tidak baku/singkat/asal menjadi kalimat formal, profesional, dan relevan dengan laporan PKL.
2. Jika ada yang menjawab "gatau" atau sejenisnya di bagian solusi/hambatan, kembangkan menjadi alasan yang masuk akal secara akademik (misal: "Penulis masih membutuhkan adaptasi lebih lanjut di lapangan").
3. PERTAHANKAN semua struktur JSON (keys, tipe data, boolean, array, ID asset). JANGAN merusak struktur!
4. JANGAN mengubah `siswa`, `sekolah`, `config` kecuali sangat perlu dirapikan penulisannya (huruf kapital).
5. Fokus pada: `kegiatan` (nama tugas, detail), `studi_kasus` (latar_belakang, proses, hasil), `perusahaan` (sejarah, visi, misi, tata_tertib, job_descriptions).
6. OUTPUT HARUS BERUPA JSON MURNI TANPA MARKDOWN (tanpa ```json ... ```). Hanya bracket JSON."""

    user_prompt = f"Data Mentah JSON:\n{json.dumps(req.context_data)}"
    
    try:
        text = await provider.generate(system_prompt, user_prompt)
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        enhanced_ctx = json.loads(text)
        
        # Deep merge AI output into original context to prevent data loss 
        # if AI omits unmodified fields to save tokens.
        def deep_merge(orig, new):
            if isinstance(orig, dict) and isinstance(new, dict):
                merged = orig.copy()
                for k, v in new.items():
                    merged[k] = deep_merge(orig.get(k), v)
                return merged
            elif isinstance(orig, list) and isinstance(new, list):
                # Trust the AI's list if it's not empty, otherwise keep original
                return new if new else orig
            else:
                return new if new not in [None, ""] else orig
                
        final_ctx = deep_merge(req.context_data, enhanced_ctx)
        
        return {"context_data": final_ctx}
    except Exception as e:
        print("Enhance error:", str(e), "Raw output:", text if 'text' in locals() else "N/A")
        raise HTTPException(status_code=500, detail="Gagal merapikan data menggunakan AI. Silakan coba lagi nanti.")
