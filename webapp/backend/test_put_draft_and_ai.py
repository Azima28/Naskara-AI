"""Test PUT /drafts validation with complex generated_sections and expanded schemas.
"""
import sys
from pathlib import Path

# Set path so backend app imports work
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.schemas import PklContext, empty_context, Status, Asset, DaftarPustaka
from app.routers.drafts import DraftUpdate

def test_schema_flexibility():
    print("--- 1. Testing PklContext with complex generated_sections ---")
    ctx_data = {
        "version": "1.0",
        "status": "completed",
        "generated_sections": {
            "latar_belakang": "Ini paragraf latar belakang yang dihasilkan oleh AI.",
            "tujuan_pkl": ["Tujuan 1: Memahami jaringan LAN", "Tujuan 2: Troubleshooting router"],
            "misi": ["Misi 1", "Misi 2", "Misi 3"],
            "tata_tertib_perusahaan_polished": ["Datang tepat waktu", "Memakai pakaian rapi"],
            "complex_nested": {"key": "value", "items": [1, 2, 3]}
        },
        "daftar_pustaka": [
            "Sitasi string biasa (Tulisanku, 2026)",
            {"penulis": "Budi", "judul": "Jaringan Komputer", "tahun": "2024", "sumber": "TeknoPress", "url": "https://example.com"},
            {"arbitrary_dict": True, "title": "Buku Lain"}
        ],
        "assets": [
            {"id": "ast-1", "filename": "foto1.jpg", "type": "foto", "caption": "Foto kegiatan"},
            {"id": "ast-2", "filename": "doc.pdf", "type": "application/pdf", "caption": "Dokumen PDF"}
        ],
        "detail_kegiatan": [
            {
                "judul": "Konfigurasi Mikrotik",
                "blocks": [
                    {"tipe": "paragraf", "teks": "Melakukan setup IP address."},
                    {"tipe": "tabel", "teks": "", "header": ["IP", "Subnet"], "rows": [["192.168.1.1", "255.255.255.0"]]}
                ]
            }
        ],
        "tujuan_pkl": ["Tujuan A", "Tujuan B"],
        "asas_pkl": [{"teks": "UU No. 20 Tahun 2003", "sub": ["Pasal 15"]}],
        "saran_intro": "Berikut adalah saran dari penulis:",
        "saran_items": ["Saran untuk sekolah", "Saran untuk industri"],
        "judul_override": {"BAB I": "PENDAHULUAN MODIFIKASI"}
    }

    # Validate with Pydantic
    ctx = PklContext.model_validate(ctx_data)
    print("✅ PklContext validation SUCCESSful!")
    print(f"Status: {ctx.status}")
    print(f"Generated sections keys count: {len(ctx.generated_sections)}")
    print(f"tujuan_pkl type: {type(ctx.generated_sections['tujuan_pkl'])}")

    # Test DraftUpdate model validation
    print("\n--- 2. Testing DraftUpdate Pydantic model validation ---")
    update_payload = {
        "title": "Laporan PKL Updated",
        "status": "completed",
        "data": ctx_data
    }
    draft_update = DraftUpdate.model_validate(update_payload)
    print("✅ DraftUpdate validation SUCCESSful!")
    print(f"DraftUpdate status: {draft_update.status}")
    print(f"DraftUpdate data title/siswa: {draft_update.data.siswa.nama}")

if __name__ == "__main__":
    test_schema_flexibility()
