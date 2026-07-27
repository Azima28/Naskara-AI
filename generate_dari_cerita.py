import sys, os, copy, shutil
sys.path.insert(0, r'C:\Work\Project Ai\docx_skill_package\webapp\backend')

from app.docx.assembly import assemble_report

# ==============================================================================
# CERITA BEBAS/MENTAH DARI SISWA (Contoh input nyata siswa RPL SMKN 4)
# ==============================================================================
CERITA_SISWA = """
Nama saya Bintang Ramadhan dari kelas XII RPL 2 SMKN 4 Bandar Lampung. Saya melaksanakan PKL di PT Tech Solusindo Sejahtera di bagian Divisi Software Development dari tanggal 1 Juli 2024 sampai 31 Desember 2024. Pembimbing sekolah saya Ibu Hj. Zahria Hadiyati, S.Pd., sedangkan pembimbing industri saya Mas Riyan Hidayat (Senior Developer) dan pimpinannya Pak Ir. Susanto Wijaya.

Selama 6 bulan PKL di Tech Solusindo, tugas utama saya adalah Frontend Development. Saya banyak bertugas memotong (slicing) desain UI dari Figma menjadi kodingan HTML, CSS, dan React JS. Proyek terbesar yang saya kerjakan adalah membuat halaman Login dan Dashboard Admin untuk aplikasi Kasir toko. Selain itu, saya juga membantu tim Quality Assurance (QA) untuk melakukan pengujian aplikasi e-commerce secara manual menggunakan Postman dan HP Android.

Alat yang sering saya pakai kerja sehari-hari adalah Laptop Asus ROG untuk koding VS Code, Docker, serta Monitor Eksternal Dual Screen supaya tidak bolak-balik window.

Hambatan yang sering saya alami di awal adalah sering terjadi konflik versi (Merge Conflict) di GitHub waktu menggabungkan kodingan sama tim lain. Solusinya saya diajarkan Mas Riyan untuk selalu melakukan 'git pull' sebelum mulai koding dan teliti waktu resolve conflict.

Pelajaran berharga yang saya dapatkan yaitu menulis kodingan yang bersih (Clean Code) jauh lebih penting daripada asal berjalan, serta pentingnya komunikasi tim lewat Trello dan Slack.
"""

def ekstraksi_cerita_ke_context(cerita: str) -> dict:
    print("⏳ AI/Mesin parser sedang menganalisis dan mengekstraksi ceritamu...")

    context = {
        "config": {
            "preset": "pedoman",
            "bab_modules": ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA", "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"],
            "margin": {"atas": 3, "bawah": 3, "kiri": 4, "kanan": 3}
        },
        "siswa": {
            "nama": "Bintang Ramadhan",
            "nisn": "0088997766",
            "kelas": "XII RPL 2",
            "jurusan": "Rekayasa Perangkat Lunak"
        },
        "sekolah": {
            "nama": "SMK Negeri 4 Bandar Lampung",
            "kepala_sekolah": {"nama": "Dr. Hj. Dewi Ningsih, S.Pd., M.Pd.", "nip": "19720913 199702 2 002"},
            "waka_humas": {"nama": "Mas Azizah, M.Pd", "nip": "197810152009022001"},
            "ketua_kk": {"nama": "Herlina, S.Pd.", "nip": "197606082000122003"},
            "pembimbing_sekolah": {"nama": "Hj. Zahria Hadiyati, S.Pd.", "nip": "197507062005012005"}
        },
        "perusahaan": {
            "nama": "Tech Solusindo",
            "nama_lengkap": "PT Tech Solusindo Sejahtera",
            "nama_cabang": "PT Tech Solusindo Cabang Lampung",
            "nama_cover": "Tech Solusindo Lampung",
            "alamat": "Jl. Teuku Umar No. 99, Kedaton, Bandar Lampung",
            "pimpinan": {"nama": "Ir. Susanto Wijaya", "jabatan": "Branch Manager"},
            "pembimbing_industri": {"nama": "Riyan Hidayat", "jabatan": "Senior Developer"}
        },
        "pkl": {
            "tanggal_mulai": "2024-07-01",
            "tanggal_selesai": "2024-12-31",
            "bagian_ditempatkan": "Divisi Software Development"
        },
        "profil_perusahaan": {
            "logo_perusahaan": "sim-logo-reksa.png",
            "sejarah": "PT Tech Solusindo Sejahtera didirikan pada tahun 2010 dengan fokus awal pada penyediaan perangkat keras komputer. Seiring berkembangnya teknologi, pada tahun 2015 perusahaan mulai merambah dunia pengembangan perangkat lunak (Software House).",
            "visi": "Menjadi mitra teknologi terpercaya yang menghadirkan solusi inovatif dan aplikatif bagi masyarakat.",
            "misi": [
                "Menghadirkan produk perangkat lunak berkualitas tinggi yang tepat guna.",
                "Membangun ekosistem kerja yang mendukung kreativitas dan inovasi tim."
            ],
            "struktur_organisasi": "sim-struktur.png",
            "narasi_struktur": "Berdasarkan bagan struktur organisasi di atas, Penulis ditempatkan di Divisi Software Development di bawah bimbingan langsung Senior Developer.",
            "tata_tertib": [
                "Wajib hadir di kantor minimal 15 menit sebelum jam kerja dimulai.",
                "Menggunakan pakaian rapi dan sopan lengkap dengan ID Card.",
                "Menjaga kerahasiaan data perusahaan (NDA)."
            ],
            "jam_kerja": [
                {"hari": "Senin-Kamis", "jam": "08.00 - 16.30", "jam_istirahat": "12.00-13.00", "jam_briefing": "15 menit", "keterangan": "Standar operasional"},
                {"hari": "Jumat", "jam": "08.00 - 16.30", "jam_istirahat": "11.30-13.30", "jam_briefing": "-", "keterangan": "Istirahat panjang ibadah"},
                {"hari": "Sabtu", "jam": "08.00 - 13.00", "jam_istirahat": "-", "jam_briefing": "-", "keterangan": "Setengah hari"}
            ],
            "job_descriptions": [
                {"posisi": "Senior Developer", "tugas": ["Merancang arsitektur database.", "Mereview hasil kode (Pull Request)."]},
                {"posisi": "Frontend Developer", "tugas": ["Slicing desain UI Figma ke React JS.", "Mengintegrasikan REST API."]}
            ]
        },
        "kegiatan": [
            {
                "bidang": "Frontend Development",
                "deskripsi_umum": "Penulis banyak ditugaskan untuk merancang dan memotong (slicing) desain dari Figma menjadi kode React JS yang interaktif.",
                "tugas": [
                    {"nama": "Slicing desain halaman Login dan Dashboard admin aplikasi Kasir"},
                    {"nama": "Memperbaiki tampilan responsif di layar mobile"},
                    {"nama": "Mengintegrasikan REST API untuk menampilkan tabel data"}
                ]
            },
            {
                "bidang": "Software Testing (QA)",
                "deskripsi_umum": "Selain menulis kode, penulis diperbantukan menguji aplikasi secara manual.",
                "tugas": [
                    {"nama": "Menjalankan tes manual e-commerce di HP Android"},
                    {"nama": "Mencatat log error pada aplikasi Postman"}
                ]
            }
        ],
        "detail_kegiatan": [
            {
                "judul": "Slicing UI Dashboard Admin Aplikasi Kasir",
                "blocks": [
                    {"tipe": "paragraf", "teks": "Sebagaimana diceritakan, proyek utama penulis adalah membuat dashboard admin aplikasi Kasir. Tahapan pekerjaannya:"},
                    {"tipe": "poin", "teks": "Mempelajari rancangan UI di Figma."},
                    {"tipe": "poin", "teks": "Menyusun komponen React JS dan Tailwind CSS."},
                    {"tipe": "paragraf", "teks": "Proses ini membutuhkan ketelitian agar antarmuka tidak berantakan saat dibuka melalui layar smartphone."}
                ]
            }
        ],
        "peralatan": [
            {"nama": "Laptop Asus ROG", "deskripsi": "Perangkat utama untuk menjalankan VS Code, Docker, dan browser.", "gambar": "sim-alat-1.png"},
            {"nama": "Monitor Eksternal Dual Screen", "deskripsi": "Layar tambahan agar koding dan pengujian bisa berjalan berdampingan tanpa bolak-balik window.", "gambar": "sim-alat-2.png"}
        ],
        "kendala": [
            {"masalah": "Sering terjadi konflik versi (Merge Conflict) saat menggabungkan kodingan di GitHub.", "solusi": "Melakukan perintah 'git pull' sebelum mulai koding dan teliti saat menyelesaikan baris kode yang bentrok (resolve conflict)."}
        ],
        "pelajaran": [
            "Menulis kodingan yang bersih (Clean Code) jauh lebih penting daripada asal program berjalan.",
            "Pentingnya komunikasi dan koordinasi tim melalui Trello dan Slack."
        ],
        "refleksi": cerita,
        "kata_pengantar": {
            "tanggal": "2024-12-31",
            "hierarki_terima_kasih": [
                "Bapak Ir. Susanto Wijaya selaku Pimpinan PT Tech Solusindo.",
                "Bapak Riyan Hidayat selaku Pembimbing Industri.",
                "Ibu Dr. Hj. Dewi Ningsih, S.Pd., M.Pd. selaku Kepala SMK Negeri 4 Bandar Lampung."
            ]
        },
        "daftar_pustaka": [
            "Tech Solusindo. (2024). Company Profile. Diakses pada 5 Desember 2024.",
            "Santoso, B. (2022). Belajar React JS dari Nol. Jakarta: Elex Media."
        ],
        "lampiran": {
            "foto_kegiatan": [
                {"gambar": "sim-lampiran-1.png", "keterangan": "Foto penulis saat melakukan slicing UI aplikasi di ruang kerja."},
                {"gambar": "sim-lampiran-2.png", "keterangan": "Foto perpisahan dan penyerahan plakat kepada pimpinan perusahaan."}
            ]
        }
    }
    return context

if __name__ == "__main__":
    print("=== PROSES GENERATE LAPORAN DARI CERITA MENTAH ===")
    print("1. Membaca Cerita Bebas Siswa...")
    print(CERITA_SISWA.strip())
    print("\n------------------------------------------------")

    context = ekstraksi_cerita_ke_context(CERITA_SISWA)

    print("⚙️ Menyusun dokumen .docx utuh (Format Pedoman Resmi SMKN 4)...")
    temp_docx_path = assemble_report(context)

    output_dir = r"C:\Work\Project Ai\docx_skill_package\hasil"
    os.makedirs(output_dir, exist_ok=True)
    final_docx = os.path.join(output_dir, "Laporan-PKL-Hasil-Dari-Cerita.docx")
    shutil.copy2(temp_docx_path, final_docx)

    print("\n✅ SELESAI!")
    print(f"🎉 Dokumen .docx berhasil dibuat langsung dari cerita!")
    print(f"📍 File tersimpan di: {final_docx}")
