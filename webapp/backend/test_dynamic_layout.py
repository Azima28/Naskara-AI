import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report, _generate_sections_list, _sanitize_data, _normalize_modules, _auto_select_modules, ALL_BAB_MODULES, _build_front_matter, _build_bab_content
from app.docx.builder import PklDocBuilder

sample_ctx = {
    "siswa": {
        "nama": "ANISA RAHMAWATI",
        "nisn": "0068912345",
        "jurusan": "Teknik Komputer dan Jaringan",
        "tempat_lahir": "Bandar Lampung",
        "tanggal_lahir": "2007-05-14",
        "jenis_kelamin": "Perempuan",
        "golongan_darah": "O",
        "catatan_kesehatan": "Sehat",
        "no_telp": "081298765432",
        "nama_ortu": "Bambang Rahmadi",
        "alamat_ortu": "Jl. Teuku Umar No. 45, Bandar Lampung",
        "telp_ortu": "081298765400",
    },
    "sekolah": {
        "nama": "SMK Negeri 4 Bandar Lampung",
        "alamat": "Jl. HOS Cokroaminoto No.102",
        "telp": "(0721) 262637",
        "kepala_sekolah": {"nama": "HJ. Dewi Ningsih, S.Pd., M.Pd.", "nip": "196805121994032005"},
        "ketua_kk": {"nama": "Rizal Ahmad, S.T., M.Ti.", "nip": "198203152010011008"},
        "pembimbing_sekolah": {"nama": "Budi Santoso, S.Kom.", "nip": "198507202011011005"},
    },
    "perusahaan": {
        "nama": "PT Telkom Indonesia Witel Lampung",
        "alamat": "Jl. Majapahit No. 7, Enggal, Bandar Lampung",
        "bidang_usaha": "Telekomunikasi & Jaringan Fiber Optik",
        "status": "BUMN",
        "no_telp": "(0721) 482000",
        "email": "witel.lampung@telkom.co.id",
        "website": "www.telkom.co.id",
        "pimpinan": {"nama": "Hendra Wijaya", "jabatan": "General Manager Witel Lampung"},
        "pembimbing_industri": {"nama": "Agus Setiawan", "jabatan": "Senior Network Engineer"},
    },
    "pkl": {
        "durasi_bulan": 3,
    },
    "profil_perusahaan": {
        "sejarah": "PT Telkom Indonesia (Persero) Tbk merupakan badan usaha milik negara yang menyediakan jasa jaringan telekomunikasi serta teknologi informasi dan komunikasi (TIK). Perusahaan ini dikenal sebagai penyedia jasa telekomunikasi dan TIK terbesar di Indonesia. Dengan cakupan layanan yang luas, perusahaan melayani jutaan pelanggan di seluruh penjuru negeri.",
        "visi": "Menjadi perusahaan telekomunikasi digital yang bernilai tinggi dalam mendukung kemajuan bangsa.",
        "misi": [
            "Mempercepat pembangunan infrastruktur dan platform digital Smart Nusa.",
            "Mengembangkan talenta digital unggulan bangsa."
        ],
        "tata_tertib_perusahaan": [
            "Mematuhi aturan dan tata tertib yang berlaku di industri;",
            "Melaksanakan kegiatan PKL sesuai jam kerja yang berlaku di industri;",
            "Memberi tahu pembimbing jika sakit;",
            "Tidak mengaktifkan smartphone selama jam bekerja."
        ],
        "job_descriptions": [
            {
                "posisi": "Teknisi Jaringan & Access Network",
                "tugas": [
                    "Melakukan penyambungan kabel serat optik melalui proses splicing.",
                    "Melakukan pengujian redaman kabel serat optik menggunakan OTDR.",
                    "Melakukan konfigurasi perangkat ONT dan Router Mikrotik."
                ]
            }
        ]
    },
    "kegiatan": [
        {
            "bidang": "Access Network & Maintenance",
            "deskripsi_umum": "Melakukan konfigurasi jaringan LAN, MikroTik RouterBOARD, subnetting IP, serta perbaikan kabel Fiber Optik (splicing) pada jaringan pelanggan."
        }
    ],
    "lampiran": {
        "foto_kegiatan": [
            {"gambar": "", "keterangan": "Proses penyambungan serat optik dengan fusion splicer"},
            {"gambar": "", "keterangan": "Konfigurasi Winbox MikroTik RouterBOARD"}
        ]
    }
}

_sanitize_data(sample_ctx)
builder = PklDocBuilder()
bab_modules = _normalize_modules(sample_ctx.get("config", {}).get("bab_modules") or _auto_select_modules(sample_ctx))
bab_modules = [m for m in bab_modules if m in ALL_BAB_MODULES]

_build_front_matter(builder, sample_ctx, bab_modules)
_build_bab_content(builder, sample_ctx, bab_modules)

sec_list = _generate_sections_list(builder, sample_ctx)

print("=" * 70)
print("📊 HASIL KALKULASI HALAMAN DINAMIS UNTUK DOKUMEN SAMPLER USER:")
print("=" * 70)
for text, bm, level, pg in sec_list:
    prefix = "📍 " if level == 1 else "   - "
    print(f"{prefix}{text:<50} -> Halaman: {pg}")
print("=" * 70)
