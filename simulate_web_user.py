"""
simulate_web_user.py
====================
Simulasi PERSIS alur user di web app:
  1. Register / Login akun
  2. Buat draft baru
  3. Isi data siswa, sekolah, perusahaan, pkl
  4. Masukkan cerita mentah → /ai/parse-full-story (AI ekstrak struktur)
  5. Lihat hasil ekstraksi AI
  6. Generate .docx (POST /generate/{draft_id})
  7. Simpan file ke hasil/

Jalankan: python simulate_web_user.py
Pastikan backend sudah jalan: uvicorn di port 8000.
"""
import sys
import json
import time
import os
import requests

BASE = "http://localhost:8000"
OUTPUT_DIR = r"C:\Work\Project Ai\docx_skill_package\hasil"

# ─── warna terminal ────────────────────────────────────────────────────────────
def ok(msg):   print(f"[OK] {msg}")
def info(msg): print(f"[INFO] {msg}")
def warn(msg): print(f"[WARN] {msg}")
def err(msg):  print(f"[ERROR] {msg}"); sys.exit(1)
def step(n, msg): print(f"\n[LANGKAH {n}] {msg}")

# ==============================================================================
# 1. REGISTER & LOGIN (simulasi akun baru)
# ==============================================================================
step(1, "Register / Login akun")

EMAIL = f"user_{int(time.time())}@test.com"
PASSWORD = "password123"

reg = requests.post(f"{BASE}/auth/register", json={"email": EMAIL, "name": "User Web Test", "password": PASSWORD})
if reg.status_code in (200, 201):
    ok(f"Akun baru dibuat: {EMAIL}")
    token = reg.json()["access_token"]
else:
    login = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if login.status_code != 200:
        err(f"Login gagal: {login.text}")
    token = login.json()["access_token"]

H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
ok(f"Login berhasil sebagai: {EMAIL}")

# ==============================================================================
# 2. BUAT DRAFT BARU
# ==============================================================================
step(2, "Membuat draft baru untuk Bintang Ramadhan")

draft_resp = requests.post(f"{BASE}/drafts/", headers=H, json={
    "title": "Laporan PKL - Bintang Ramadhan (Dari Cerita)"
})
if draft_resp.status_code not in (200, 201):
    err(f"Gagal buat draft: {draft_resp.text}")

draft = draft_resp.json()
DRAFT_ID = draft["id"]
ok(f"Draft dibuat: ID={DRAFT_ID}, Judul='{draft['title']}'")

# ==============================================================================
# 3. SIMPAN DATA AWAL (seperti user isi form wizard step 1-4)
# ==============================================================================
step(3, "Mengisi form data dasar (simulasi wizard steps 1-4)")

initial_data = {
    "version": "1.0",
    "status": "collecting",
    "config": {
        "preset": "pedoman",
        "bab_modules": ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA",
                        "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"],
        "margin": {"atas": 3, "bawah": 3, "kiri": 4, "kanan": 3},
        "font": "Times New Roman",
        "font_size": 12,
        "spasi": 1.5,
        "pedoman_sekolah": None
    },
    "siswa": {
        "nama": "Bintang Ramadhan",
        "nis": "2122.RPL.055",
        "nisn": "0088997766",
        "kelas": "XII RPL 2",
        "jurusan": "Rekayasa Perangkat Lunak",
        "jurusan_key": "rpl",
        "tempat_lahir": "Bandar Lampung",
        "tanggal_lahir": "2006-03-15",
        "jenis_kelamin": "L",
        "golongan_darah": "O",
        "catatan_kesehatan": "-",
        "no_telp": "0812-1234-5678",
        "alamat": "Jl. Pramuka No. 45, Rajabasa, Bandar Lampung",
        "nama_ortu": "Ramadhan Putra",
        "alamat_ortu": "Jl. Pramuka No. 45, Rajabasa, Bandar Lampung",
        "telp_ortu": "0811-9876-5432",
        "foto": ""
    },
    "sekolah": {
        "nama": "SMK Negeri 4 Bandar Lampung",
        "nama_lengkap": "SMK Negeri 4 Bandar Lampung",
        "alamat": "Jl. HOS Cokroaminoto No.102",
        "kota": "Bandar Lampung",
        "telp": "(0721) 262637",
        "email": "smkn4bl@yahoo.co.id",
        "website": "www.smkn4-bdl.sch.id",
        "kop": {
            "baris_1": "PEMERINTAH PROVINSI LAMPUNG",
            "baris_2": "DINAS PENDIDIKAN DAN KEBUDAYAAN",
            "baris_3": "SMK NEGERI 4 BANDAR LAMPUNG",
            "npsn": "10807215",
            "nss": "401126003028"
        },
        "kepala_sekolah": {"nama": "Dr. Hj. Dewi Ningsih, S.Pd., M.Pd.", "nip": "19720913 199702 2 002", "gelar": ""},
        "waka_humas": {"nama": "Mas Azizah, M.Pd", "nip": "197810152009022001", "gelar": ""},
        "ketua_kk": {"nama": "Herlina, S.Pd.", "nip": "197606082000122003", "gelar": ""},
        "pembimbing_sekolah": {"nama": "Hj. Zahria Hadiyati, S.Pd.", "nip": "197507062005012005", "gelar": ""}
    },
    "perusahaan": {
        "nama": "Tech Solusindo",
        "nama_lengkap": "PT Tech Solusindo Sejahtera",
        "alamat": "Jl. Teuku Umar No. 99, Kedaton, Bandar Lampung",
        "bidang_usaha": "Pengembangan Perangkat Lunak (Software House)",
        "status": "Swasta Nasional",
        "no_telp": "(0721) 445566",
        "fax": "",
        "email": "info@techsolusindo.id",
        "website": "www.techsolusindo.id",
        "pimpinan": {"nama": "Ir. Susanto Wijaya", "jabatan": "Branch Manager"},
        "hrd": {"nama": "", "jabatan": "HRD", "telp": "", "email": ""},
        "pembimbing_industri": {"nama": "Riyan Hidayat", "jabatan": "Senior Developer", "telp": "", "email": ""}
    },
    "pkl": {
        "tanggal_mulai": "2024-07-01",
        "tanggal_selesai": "2024-12-31",
        "durasi_bulan": 6,
        "jam_pelajaran": 960,
        "bagian_ditempatkan": "Divisi Software Development",
        "tahun_ajaran": "2024/2025"
    },
    "profil_perusahaan": {
        "logo_perusahaan": "",
        "sejarah": "PT Tech Solusindo Sejahtera didirikan pada tahun 2010 dengan fokus awal pada penyediaan perangkat keras komputer. Seiring berkembangnya teknologi, pada tahun 2015 perusahaan mulai merambah dunia pengembangan perangkat lunak (Software House).",
        "visi": "Menjadi mitra teknologi terpercaya yang menghadirkan solusi inovatif dan aplikatif bagi masyarakat.",
        "misi": [
            "Menghadirkan produk perangkat lunak berkualitas tinggi yang tepat guna.",
            "Membangun ekosistem kerja yang mendukung kreativitas dan inovasi tim."
        ],
        "head_office": "",
        "area_cabang": [],
        "struktur_organisasi": "",
        "narasi_struktur": "Penulis ditempatkan di Divisi Software Development di bawah bimbingan langsung Senior Developer.",
        "tata_tertib": [
            "Wajib hadir di kantor minimal 15 menit sebelum jam kerja dimulai.",
            "Menggunakan pakaian rapi dan sopan lengkap dengan ID Card.",
            "Menjaga kerahasiaan data perusahaan (NDA)."
        ],
        "jam_kerja": [
            {"hari": "SENIN", "jam": "08.00 - 08.15\n08.15 - 12.00\n12.00 - 13.00\n13.00 - 16.30\n16.30 - 16.45",
             "jam_mulai": "08.00", "jam_selesai": "16.45", "jam_istirahat": "12.00-13.00",
             "jam_briefing": "08.00-08.15",
             "keterangan": "BRIEFING\nOPERASIONAL\nISTIRAHAT\nOPERASIONAL\nTUTUP"},
            {"hari": "SELASA", "jam": "08.00 - 08.15\n08.15 - 12.00\n12.00 - 13.00\n13.00 - 16.30\n16.30 - 16.45",
             "jam_mulai": "08.00", "jam_selesai": "16.45", "jam_istirahat": "12.00-13.00",
             "jam_briefing": "08.00-08.15",
             "keterangan": "BRIEFING\nOPERASIONAL\nISTIRAHAT\nOPERASIONAL\nTUTUP"},
            {"hari": "RABU", "jam": "08.00 - 08.15\n08.15 - 12.00\n12.00 - 13.00\n13.00 - 16.30\n16.30 - 16.45",
             "jam_mulai": "08.00", "jam_selesai": "16.45", "jam_istirahat": "12.00-13.00",
             "jam_briefing": "08.00-08.15",
             "keterangan": "BRIEFING\nOPERASIONAL\nISTIRAHAT\nOPERASIONAL\nTUTUP"},
            {"hari": "KAMIS", "jam": "08.00 - 08.15\n08.15 - 12.00\n12.00 - 13.00\n13.00 - 16.30\n16.30 - 16.45",
             "jam_mulai": "08.00", "jam_selesai": "16.45", "jam_istirahat": "12.00-13.00",
             "jam_briefing": "08.00-08.15",
             "keterangan": "BRIEFING\nOPERASIONAL\nISTIRAHAT\nOPERASIONAL\nTUTUP"},
            {"hari": "JUMAT", "jam": "08.00 - 11.30\n11.30 - 13.30\n13.30 - 16.30\n16.30 - 16.45",
             "jam_mulai": "08.00", "jam_selesai": "16.45", "jam_istirahat": "11.30-13.30",
             "jam_briefing": "-",
             "keterangan": "OPERASIONAL\nISTIRAHAT\nOPERASIONAL\nTUTUP"},
            {"hari": "SABTU", "jam": "08.00 - 13.00\n13.00 - 13.15",
             "jam_mulai": "08.00", "jam_selesai": "13.15", "jam_istirahat": "-",
             "jam_briefing": "-",
             "keterangan": "OPERASIONAL\nTUTUP"}
        ],
        "job_descriptions": [
            {"posisi": "Senior Developer", "tugas": ["Merancang arsitektur database.", "Mereview hasil kode (Pull Request)."]},
            {"posisi": "Frontend Developer", "tugas": ["Slicing desain UI Figma ke React JS.", "Mengintegrasikan REST API."]}
        ]
    },
    "kegiatan": [],
    "studi_kasus": {"judul": "", "latar_belakang": "", "proses_atau_formula": "", "data_angka": [], "hasil": "", "assets": []},
    "peralatan": [],
    "kendala": [],
    "pelajaran": [],
    "refleksi": "",
    "refleksi_bab5": "",
    "kesimpulan_user": "",
    "saran_user": "",
    "kata_pengantar": {
        "ucapan_syukur": "Puji syukur kepada Tuhan Yang Maha Esa atas karunia-Nya sehingga Penulis dapat menyelesaikan Laporan Praktik Kerja Lapangan ini.",
        "hierarki_terima_kasih": [
            "Bapak Ir. Susanto Wijaya selaku Pimpinan PT Tech Solusindo Sejahtera.",
            "Bapak Riyan Hidayat selaku Pembimbing Industri.",
            "Ibu Dr. Hj. Dewi Ningsih, S.Pd., M.Pd. selaku Kepala SMK Negeri 4 Bandar Lampung.",
            "Ibu Hj. Zahria Hadiyati, S.Pd. selaku Pembimbing Sekolah."
        ],
        "harapan": "Penulis berharap semoga laporan ini dapat bermanfaat bagi semua pihak.",
        "kota": "Bandar Lampung",
        "tanggal": "2024-12-31"
    },
    "daftar_pustaka": [],
    "assets": [],
    "gaps": [],
    "lampiran": {
        "jurnal_kegiatan": True,
        "absensi": True,
        "sertifikat": False,
        "penilaian": True,
        "surat_permohonan": True,
        "surat_balasan": True,
        "foto_dokumentasi": True,
        "foto_kegiatan": [
            {"gambar": "sim-lampiran-1.png", "keterangan": "Foto penulis saat melakukan slicing UI aplikasi Kasir di ruang kerja Divisi Software Development."},
            {"gambar": "sim-lampiran-2.png", "keterangan": "Foto dokumentasi penyerahan plakat kenang-kenangan kepada pimpinan PT Tech Solusindo pada hari terakhir PKL."}
        ]
    }
}

upd = requests.put(f"{BASE}/drafts/{DRAFT_ID}", headers=H, json={"data": initial_data})
if upd.status_code != 200:
    err(f"Gagal simpan data awal: {upd.text}")
ok("Data dasar tersimpan (siswa, sekolah, perusahaan, pkl, profil)")

# ==============================================================================
# 4. KIRIM CERITA → AI PARSE (ini yang ada di CeritaStep.tsx)
# ==============================================================================
step(4, "Mengirim cerita mentah ke AI (simulasi klik 'Susun Jadi Bagian Laporan')")

CERITA_MENTAH = """
Nama saya Bintang Ramadhan dari kelas XII RPL 2 SMKN 4 Bandar Lampung.
Saya melaksanakan PKL di PT Tech Solusindo Sejahtera di bagian Divisi Software Development
dari tanggal 1 Juli 2024 sampai 31 Desember 2024. Pembimbing sekolah saya
Ibu Hj. Zahria Hadiyati, S.Pd., sedangkan pembimbing industri saya Mas Riyan Hidayat
(Senior Developer) dan pimpinannya Pak Ir. Susanto Wijaya.

Selama 6 bulan PKL di Tech Solusindo, tugas utama saya adalah Frontend Development.
Saya banyak bertugas memotong (slicing) desain UI dari Figma menjadi kodingan HTML, CSS,
dan React JS. Proyek terbesar yang saya kerjakan adalah membuat halaman Login dan Dashboard
Admin untuk aplikasi Kasir toko. Dashboard ini menampilkan rekap penjualan harian, manajemen
produk, dan laporan stok secara real-time menggunakan REST API dari backend Laravel.

Selain itu, saya juga membantu tim Quality Assurance (QA) untuk melakukan pengujian
aplikasi e-commerce secara manual menggunakan Postman dan HP Android. Setiap hari saya
membuat laporan pengujian di Google Sheets yang mencatat bug, severity level, dan status fix-nya.

Alat yang sering saya pakai kerja sehari-hari adalah Laptop Asus ROG untuk koding di VS Code,
menjalankan Docker container, serta Monitor Eksternal Dual Screen supaya tidak bolak-balik
window antara Figma dan VS Code.

Hambatan yang sering saya alami di awal adalah sering terjadi konflik versi (Merge Conflict)
di GitHub waktu menggabungkan kodingan sama tim lain. Ini bikin frustrasi karena bisa merusak
fitur yang sudah jadi. Solusinya saya diajarkan Mas Riyan untuk selalu melakukan git pull
sebelum mulai koding dan teliti waktu resolve conflict dengan membandingkan baris per baris.

Hambatan kedua adalah pada saat API backend belum selesai dikerjakan tim backend, terpaksa
saya harus membuat data dummy (mock data) agar tampilan frontend bisa terus berkembang tanpa
menunggu. Hal ini mengajarkan saya untuk bisa bekerja secara mandiri dan tidak bergantung pada
pihak lain.

Pelajaran berharga yang saya dapatkan yaitu menulis kodingan yang bersih (Clean Code) jauh
lebih penting daripada asal berjalan. Saya juga belajar pentingnya komunikasi tim lewat Trello
untuk manajemen task dan Slack untuk komunikasi cepat antar divisi. Pengalaman ini sangat
membuka wawasan saya tentang dunia kerja nyata di bidang IT.
"""

info(f"Panjang cerita: {len(CERITA_MENTAH.split())} kata")
info("Mengirim ke /ai/parse-full-story...")

t_start = time.time()
parse_resp = requests.post(
    f"{BASE}/ai/parse-full-story",
    headers=H,
    json={"cerita": CERITA_MENTAH, "jurusan_key": "rpl"},
    timeout=180
)
t_end = time.time()

if parse_resp.status_code != 200:
    warn(f"Parse-full-story gagal ({parse_resp.status_code}): {parse_resp.text[:300]}")
    warn("Melanjutkan dengan data manual (simulasi fallback jika AI tidak tersedia)")
    ai_result = {
        "kegiatan": [
            {
                "bidang": "Frontend Development",
                "deskripsi_umum": "Penulis ditugaskan untuk merancang dan mengimplementasikan antarmuka pengguna menggunakan React JS dan Tailwind CSS berdasarkan desain Figma.",
                "tugas": [
                    {"nama": "Slicing desain halaman Login dan Dashboard Admin aplikasi Kasir", "detail": "Mengubah desain Figma menjadi kode React JS yang responsif dan interaktif.", "assets": []},
                    {"nama": "Integrasi REST API untuk menampilkan data real-time", "detail": "Menghubungkan komponen frontend dengan API backend Laravel untuk rekap penjualan dan manajemen produk.", "assets": []},
                    {"nama": "Memperbaiki tampilan responsif di layar mobile", "detail": "Melakukan penyesuaian CSS agar tampilan aplikasi tetap optimal di berbagai ukuran layar.", "assets": []}
                ]
            },
            {
                "bidang": "Software Testing (Quality Assurance)",
                "deskripsi_umum": "Penulis diperbantukan dalam tim QA untuk melakukan pengujian manual aplikasi e-commerce.",
                "tugas": [
                    {"nama": "Pengujian manual aplikasi e-commerce menggunakan Postman dan HP Android", "detail": "Menguji endpoint API menggunakan Postman dan memverifikasi fungsionalitas di perangkat mobile.", "assets": []},
                    {"nama": "Pembuatan laporan bug di Google Sheets", "detail": "Mendokumentasikan temuan bug, severity level, dan status perbaikan secara sistematis.", "assets": []}
                ]
            }
        ],
        "peralatan": [
            {"nama": "Laptop Asus ROG", "deskripsi": "Perangkat utama untuk menjalankan VS Code, Docker, dan browser pengembangan.", "gambar": ""},
            {"nama": "Monitor Eksternal Dual Screen", "deskripsi": "Layar tambahan untuk meningkatkan produktivitas kerja antara desain Figma dan lingkungan coding.", "gambar": ""},
            {"nama": "Postman", "deskripsi": "Aplikasi pengujian REST API untuk memverifikasi response endpoint backend.", "gambar": ""}
        ],
        "kendala": [
            {"masalah": "Sering terjadi konflik versi (Merge Conflict) saat menggabungkan kode di GitHub.", "solusi": "Membiasakan diri melakukan perintah git pull sebelum memulai pengembangan dan menyelesaikan konflik secara teliti baris per baris."},
            {"masalah": "API backend belum selesai saat frontend sudah harus dikembangkan.", "solusi": "Membuat data dummy (mock data) agar pengembangan frontend dapat berjalan secara mandiri tanpa menunggu backend."}
        ],
        "pelajaran": [
            "Menulis kodingan yang bersih (Clean Code) jauh lebih penting daripada asal program dapat berjalan.",
            "Pentingnya komunikasi dan koordinasi tim melalui Trello untuk manajemen tugas dan Slack untuk komunikasi antar divisi.",
            "Kemampuan bekerja secara mandiri dan adaptif ketika menghadapi keterbatasan sumber daya."
        ],
        "recommended_bab": ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA", "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"],
        "quality_score": 82,
        "suggestions": ["Tambahkan detail spesifik tentang teknologi yang digunakan (versi React, Laravel)", "Ceritakan lebih lanjut proses testing yang dilakukan"]
    }
else:
    ai_result = parse_resp.json()
    ok(f"AI berhasil menganalisis cerita dalam {t_end-t_start:.1f} detik")

# Tampilkan hasil AI
print("\n--- HASIL EKSTRAKSI AI ---")
info(f"Bidang kegiatan ditemukan: {len(ai_result.get('kegiatan', []))}")
for keg in ai_result.get('kegiatan', []):
    info(f"  • {keg['bidang']}: {len(keg.get('tugas', []))} tugas")
info(f"Peralatan: {len(ai_result.get('peralatan', []))} item")
info(f"Kendala: {len(ai_result.get('kendala', []))} item")
info(f"Pelajaran: {len(ai_result.get('pelajaran', []))} poin")
info(f"Quality score: {ai_result.get('quality_score', '-')}/100")
if ai_result.get('suggestions'):
    info(f"Saran AI: {', '.join(ai_result['suggestions'][:2])}")

# ==============================================================================
# 5. UPDATE DRAFT dengan hasil AI (seperti user lanjut ke step berikutnya)
# ==============================================================================
step(5, "Menyimpan hasil ekstraksi AI ke draft")

initial_data["kegiatan"] = ai_result.get("kegiatan", [])
initial_data["peralatan"] = ai_result.get("peralatan", [])
initial_data["kendala"] = ai_result.get("kendala", [])
initial_data["pelajaran"] = ai_result.get("pelajaran", [])
initial_data["refleksi"] = CERITA_MENTAH.strip()
initial_data["config"]["bab_modules"] = ai_result.get("recommended_bab",
    ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA", "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"])

upd2 = requests.put(f"{BASE}/drafts/{DRAFT_ID}", headers=H, json={"data": initial_data, "status": "reviewing"})
if upd2.status_code != 200:
    err(f"Gagal update draft: {upd2.text}")
ok("Draft diperbarui dengan hasil AI")

# ==============================================================================
# 6. GENERATE DOCX (klik tombol "Download .docx" di header wizard)
# ==============================================================================
step(6, "Generate .docx (simulasi klik tombol 'Download .docx')")
info("Mengirim POST /generate/{draft_id}...")

t_start = time.time()
gen_resp = requests.post(
    f"{BASE}/generate/{DRAFT_ID}",
    headers={**H, "Content-Type": "application/json"},
    timeout=300
)
t_end = time.time()

if gen_resp.status_code == 422:
    detail = gen_resp.json().get("detail", {})
    warn("Validasi backend menolak (422):")
    if isinstance(detail, dict):
        warn(f"  Pesan: {detail.get('message', '-')}")
        for iss in detail.get("issues", []):
            warn(f"  ✗ [{iss.get('tier','?')}] {iss.get('field','?')}: {iss.get('message','')}")
        if detail.get("requestions"):
            warn("  Pertanyaan balik ke user:")
            for rq in detail["requestions"]:
                warn(f"    → {rq.get('question', '')}")
    sys.exit(1)
elif gen_resp.status_code != 200:
    err(f"Generate gagal ({gen_resp.status_code}): {gen_resp.text[:500]}")

# Simpan file .docx
os.makedirs(OUTPUT_DIR, exist_ok=True)
out_path = os.path.join(OUTPUT_DIR, "Laporan-PKL-Bintang-Ramadhan.docx")
with open(out_path, "wb") as f:
    f.write(gen_resp.content)

size_kb = os.path.getsize(out_path) / 1024
ok(f"File .docx berhasil dibuat dalam {t_end-t_start:.1f} detik")
ok(f"Ukuran file: {size_kb:.1f} KB")

print("\n" + "="*60)
print("           SIMULASI SELESAI -- ALUR PERSIS USER WEB           ")
print("="*60)
print(f"  Draft ID    : {DRAFT_ID}")
print(f"  Siswa       : Bintang Ramadhan")
print(f"  Perusahaan  : PT Tech Solusindo Sejahtera")
print(f"  Periode PKL : 1 Juli - 31 Desember 2024 (6 bulan)")
print(f"  File output : {out_path}")
print("="*60)
