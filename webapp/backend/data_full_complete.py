"""DATA_FULL_COMPLETE — 100% semua field terisi tanpa ada yang dikosongkan/opsional dilewati."""
from __future__ import annotations

DATA_FULL: dict = {
    "version": "1.0",
    "status": "ready",
    "created_at": "2026-01-05T08:00:00Z",
    "updated_at": "2026-04-05T16:00:00Z",
    "config": {
        "preset": "pedoman",
        "cover_page_number": "none",
        "front_matter_format": "lowerRoman",
        "front_matter_start": 1,
        "body_matter_format": "arabic",
        "body_matter_start": 1,
        "jumlah_bab": 6,
        "bab_modules": [
            "PENDAHULUAN",
            "KEGIATAN_INDUSTRI",
            "TINJAUAN_PUSTAKA",
            "DATA_PENGAMATAN",
            "PEMBAHASAN",
            "KESIMPULAN_SARAN"
        ],
        "margin": {"atas": 3, "bawah": 3, "kiri": 4, "kanan": 3},
        "font": "Times New Roman",
        "font_size": 12,
        "spasi": 1.5,
        "auto_daftar_pustaka": True
    },
    "sekolah": {
        "nama": "SMK Negeri 4 Bandar Lampung",
        "nama_lengkap": "SMK Negeri 4 Bandar Lampung",
        "alamat": "Jl. HOS Cokroaminoto No. 102, Enggal, Bandar Lampung",
        "kota": "Bandar Lampung",
        "telp": "(0721) 262637",
        "email": "smkn4bl@yahoo.co.id",
        "website": "https://smkn4-bdl.sch.id",
        "kop": {
            "baris_1": "PEMERINTAH PROVINSI LAMPUNG",
            "baris_2": "DINAS PENDIDIKAN DAN KEBUDAYAAN",
            "baris_3": "SMK NEGERI 4 BANDAR LAMPUNG",
            "npsn": "10807215",
            "nss": "401126003028"
        },
        "kepala_sekolah": {
            "nama": "HJ. Dewi Ningsih, S.Pd., M.Pd.",
            "nip": "19750312 200312 2 004",
            "gelar": "M.Pd."
        },
        "ketua_kk": {
            "nama": "Rudi Hartono, S.Kom.",
            "nip": "19850514 201001 1 009",
            "gelar": "S.Kom."
        },
        "pembimbing_sekolah": {
            "nama": "Siti Rahma, S.Pd.",
            "nip": "19820101 200701 2 011",
            "gelar": "S.Pd."
        },
        "waka_humas": {
            "nama": "Mas Azizah, M.Pd",
            "nip": "19781015 200902 2 001",
            "gelar": "M.Pd."
        }
    },
    "siswa": {
        "nama": "Rizky Pratama",
        "nis": "10245",
        "nisn": "0067234512",
        "kelas": "XII RPL 1",
        "jurusan": "Rekayasa Perangkat Lunak",
        "jurusan_key": "rpl",
        "jenis_kelamin": "L",
        "tempat_lahir": "Bandar Lampung",
        "tanggal_lahir": "15 Mei 2008",
        "golongan_darah": "O",
        "catatan_kesehatan": "-",
        "no_telp": "0812-3456-7890",
        "alamat": "Jl. Kenanga No. 8, Bandar Lampung",
        "nama_ortu": "Budi Santoso",
        "alamat_ortu": "Jl. Kenanga No. 8, Bandar Lampung",
        "telp_ortu": "0813-9876-5432",
        "foto": "sim-lampiran-1.png"
    },
    "perusahaan": {
        "nama": "PT Solusi Digital Kreatif",
        "nama_lengkap": "PT Solusi Digital Kreatif Indonesia",
        "nama_cover": "PT SOLUSI DIGITAL KREATIF",
        "bidang_usaha": "Pengembangan Perangkat Lunak dan Layanan IT",
        "alamat": "Jl. Diponegoro No. 112, Bandar Lampung",
        "kota": "Bandar Lampung",
        "status": "Swasta",
        "no_telp": "(0721) 765432",
        "fax": "-",
        "email": "info@solusidigital.co.id",
        "website": "https://solusidigital.co.id",
        "pimpinan": {
            "nama": "Andi Wijaya, S.T.",
            "jabatan": "Direktur Utama"
        },
        "hrd": {
            "nama": "Maya Sari",
            "jabatan": "Manager HRD",
            "telp": "(0721) 765432 ext. 101",
            "email": "hrd@solusidigital.co.id"
        },
        "pembimbing_industri": {
            "nama": "Fajar Nugroho, S.Kom.",
            "jabatan": "Senior Developer",
            "telp": "(0721) 765432 ext. 205",
            "email": "fajar@solusidigital.co.id"
        },
        "pembimbing_industri_2": {
            "nama": "Lina Kusuma, S.Kom.",
            "jabatan": "System Analyst",
            "telp": "(0721) 765432 ext. 206",
            "email": "lina@solusidigital.co.id"
        }
    },
    "profil_perusahaan": {
        "logo_perusahaan": "sim-logo-reksa.png",
        "sejarah": "PT Solusi Digital Kreatif didirikan pada tahun 2015 di Bandar Lampung. Awalnya perusahaan ini hanya melayani pembuatan website sederhana untuk UMKM lokal. Seiring berjalannya waktu, perusahaan berkembang menjadi penyedia solusi perangkat lunak yang melayani berbagai klien mulai dari instansi pemerintah hingga perusahaan swasta di wilayah Lampung dan sekitarnya.",
        "visi": "Menjadi perusahaan pengembang software terpercaya dan terdepan di Provinsi Lampung.",
        "misi": [
            "Memberikan solusi software yang berkualitas tinggi dan inovatif.",
            "Melayani klien dengan profesional, transparan, dan tepat waktu.",
            "Mengembangkan SDM lokal yang kompeten di bidang Teknologi Informasi."
        ],
        "head_office": "Jl. Diponegoro No. 112, Enggal, Bandar Lampung, Lampung 35118",
        "area_cabang": [
            {
                "nama_area": "Area Lampung & Palembang",
                "cabang": [
                    {"nama": "Cabang Metro - Jl. AH Nasution No. 45, Kota Metro"},
                    {"nama": "Cabang Palembang - Jl. R. Sukamto No. 88, Kota Palembang"}
                ]
            }
        ],
        "struktur_organisasi": "sim-struktur.png",
        "narasi_struktur": "Struktur organisasi PT Solusi Digital Kreatif dirancang secara rasional dan efisien untuk mendukung koordinasi antar divisi pengembangan software.",
        "tata_tertib": [
            "Datang tepat waktu sesuai jam kerja pukul 08.00 WIB",
            "Menggunakan seragam rapi dan id-card perusahaan",
            "Dilarang menggunakan HP untuk keperluan pribadi saat jam kerja",
            "Meminta izin kepada Pembimbing Industri jika ada keperluan keluar ruangan"
        ],
        "tata_tertib_perusahaan": [
            "Datang tepat waktu sesuai jam kerja pukul 08.00 WIB",
            "Menggunakan seragam rapi dan id-card perusahaan",
            "Dilarang menggunakan HP untuk keperluan pribadi saat jam kerja",
            "Meminta izin kepada Pembimbing Industri jika ada keperluan keluar ruangan"
        ],
        "jam_kerja": [
            {"hari": "SENIN", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "SELASA", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "RABU", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "KAMIS", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
            {"hari": "JUMAT", "jam": "08.00 - 11.30\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "11.30 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"}
        ],
        "job_descriptions": [
            {
                "posisi": "Backend Developer",
                "tugas": [
                    "membangun dan memelihara API",
                    "mengelola database",
                    "memastikan keamanan sistem"
                ]
            },
            {
                "posisi": "Frontend Developer",
                "tugas": [
                    "membuat tampilan website",
                    "memastikan website responsif"
                ]
            },
            {
                "posisi": "QA Tester",
                "tugas": [
                    "melakukan pengujian aplikasi",
                    "mencatat bug dan melaporkannya"
                ]
            }
        ]
    },
    "pkl": {
        "tanggal_mulai": "2026-01-05",
        "tanggal_selesai": "2026-04-05",
        "durasi_bulan": 3,
        "jam_pelajaran": 500,
        "bagian_ditempatkan": "Backend Development",
        "tahun_ajaran": "2026/2027"
    },
    "jam_kerja": [
        {"hari": "SENIN", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "SELASA", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "RABU", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "KAMIS", "jam": "08.00 - 12.00\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "12.00 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"},
        {"hari": "JUMAT", "jam": "08.00 - 11.30\n13.00 - 16.00", "jam_mulai": "08.00", "jam_selesai": "16.00", "jam_istirahat": "11.30 - 13.00", "keterangan": "OPERASIONAL\nOPERASIONAL"}
    ],
    "kegiatan": [
        {
            "bidang": "Backend Development",
            "deskripsi_umum": "membangun dan memelihara sistem backend aplikasi",
            "tugas": [
                {"nama": "Membuat REST API", "nama_tugas": "Membuat REST API", "detail": "bikin endpoint API untuk aplikasi kasir pakai express js", "assets": ["sim-lampiran-1.png"]},
                {"nama": "Desain Database", "nama_tugas": "Desain Database", "detail": "merancang struktur tabel mysql sesuai kebutuhan aplikasi", "assets": ["sim-lampiran-2.png"]},
                {"nama": "Fixing Bug", "nama_tugas": "Fixing Bug", "detail": "memperbaiki bug yang dilaporkan tim QA", "assets": ["sim-lampiran-3.png"]}
            ]
        },
        {
            "bidang": "Dokumentasi Sistem",
            "deskripsi_umum": "menulis dokumentasi teknis aplikasi",
            "tugas": [
                {"nama": "Menulis Dokumentasi API", "nama_tugas": "Menulis Dokumentasi API", "detail": "mendokumentasikan endpoint yang sudah dibuat", "assets": ["sim-lampiran-4.png"]}
            ]
        }
    ],
    "studi_kasus": {
        "judul": "Optimasi Performance Query Database MySQL pada Aplikasi POS Kasir",
        "latar_belakang": "Waktu eksekusi query pencarian laporan penjualan mengalami penurunan performa saat jumlah transaksi mencapai 50.000 data.",
        "proses_atau_formula": "Penambahan indexing pada kolom transaksi_id dan tanggal_transaksi serta optimasi JOIN query.",
        "data_angka": [
            {"label": "Waktu Query Sebelum Optimasi", "nilai": "3.8 Detik"},
            {"label": "Waktu Query Setelah Optimasi", "nilai": "0.2 Detik"}
        ],
        "hasil": "Waktu komputasi laporan penjualan berhasil dipercepat hingga 94,7% dan beban CPU database berkurang drastis.",
        "assets": ["sim-lampiran-5.png"]
    },
    "peralatan": [
        {"nama": "Komputer PC", "deskripsi": "perangkat utama untuk ngoding dan menjalankan aplikasi", "gambar": "sim-alat-1.png"},
        {"nama": "VS Code", "deskripsi": "text editor yang dipakai untuk menulis kode program", "gambar": "sim-alat-2.png"},
        {"nama": "XAMPP", "deskripsi": "untuk menjalankan server mysql dan apache di lokal", "gambar": "sim-alat-3.png"},
        {"nama": "Postman", "deskripsi": "dipakai untuk mengetes endpoint API", "gambar": "sim-alat-4.png"}
    ],
    "kendala": [
        {
            "masalah": "Susah mengatur relasi tabel yang kompleks di database",
            "solusi": "Bertanya ke pembimbing dan membaca dokumentasi mysql"
        },
        {
            "masalah": "Penyesuaian workflow kerja Git dalam tim",
            "solusi": "Mempelajari git branching strategy dan melakukan code review sebelum merge"
        }
    ],
    "pelajaran": [
        "Membangun REST API dengan Express.js",
        "Merancang database MySQL yang efisien",
        "Bekerja dalam tim pengembang software"
    ],
    "refleksi": "Selama PKL saya belajar banyak tentang backend development yang sebenarnya. Ternyata ngoding di dunia kerja jauh berbeda dengan tugas di sekolah karena harus mengikuti standar tim.",
    "refleksi_bab5": "Proses PKL ini memberikan pengalaman langsung dalam memecahkan masalah sistem riil di industri.",
    "kesimpulan_user": "Berdasarkan hasil Praktik Kerja Lapangan yang dilaksanakan di PT Solusi Digital Kreatif, Penulis dapat menyimpulkan bahwa pengembangan backend menggunakan Express.js dan MySQL membutuhkan pemahaman yang baik tentang arsitektur REST API dan desain database terstruktur.",
    "saran_user": "Disarankan agar pihak sekolah meningkatkan porsi praktik ngoding di laboratorium, dan pihak industri memberikan dokumentasi API yang lebih detail kepada siswa PKL baru.",
    "kata_pengantar": {
        "ucapan_syukur": "Puji syukur kepada Tuhan Yang Maha Esa, karena karunia dan nikmat yang diberikan-Nya sehingga Penulis dapat menyusun dan menyelesaikan Laporan Praktik Kerja Lapangan ini.",
        "hierarki_terima_kasih": [
            "Ibu HJ. Dewi Ningsih, S.Pd., M.Pd. selaku Kepala SMK Negeri 4 Bandar Lampung.",
            "Bapak Andi Wijaya, S.T. selaku Direktur Utama PT Solusi Digital Kreatif.",
            "Bapak Rudi Hartono, S.Kom. selaku Ketua Kompetensi Keahlian Rekayasa Perangkat Lunak.",
            "Ibu Siti Rahma, S.Pd. selaku Pembimbing Sekolah.",
            "Bapak Fajar Nugroho, S.Kom. selaku Pembimbing Industri.",
            "Seluruh staf dan karyawan PT Solusi Digital Kreatif."
        ],
        "harapan": "Penulis berharap semoga hasil laporan yang Penulis susun ini dapat bermanfaat bagi pembaca dan siswa adik tingkat.",
        "kota": "Bandar Lampung",
        "tanggal": "5 April 2026"
    },
    "daftar_pustaka": [
        {"penulis": "Pressman, R. S.", "judul": "Software Engineering: A Practitioner's Approach", "tahun": "2020", "sumber": "McGraw-Hill Education", "url": "https://www.mheducation.com"},
        {"penulis": "Duckett, J.", "judul": "JavaScript and JQuery: Interactive Front-End Web Development", "tahun": "2019", "sumber": "John Wiley & Sons", "url": "https://www.wiley.com"},
        {"penulis": "Silberschatz, A., Korth, H. F., & Sudarshan, S.", "judul": "Database System Concepts", "tahun": "2021", "sumber": "McGraw-Hill", "url": "https://www.db-book.com"}
    ],
    "assets": [
        {"id": "ast-1", "filename": "sim-lampiran-1.png", "original_name": "diskusi.png", "type": "foto", "caption": "Diskusi perancangan API", "used_in_bab": 2, "path": "sim-lampiran-1.png"},
        {"id": "ast-2", "filename": "sim-lampiran-2.png", "original_name": "koding.png", "type": "foto", "caption": "Proses koding backend", "used_in_bab": 2, "path": "sim-lampiran-2.png"}
    ],
    "gaps": [],
    "lampiran": {
        "jurnal_kegiatan": True,
        "absensi": True,
        "sertifikat": True,
        "penilaian": True,
        "surat_permohonan": True,
        "surat_balasan": True,
        "foto_dokumentasi": True,
        "foto_kegiatan": [
            {"gambar": "sim-lampiran-1.png", "keterangan": "Diskusi perancangan API bersama Pembimbing Industri"},
            {"gambar": "sim-lampiran-2.png", "keterangan": "Proses koding backend di ruang kerja divisi development"},
            {"gambar": "sim-lampiran-3.png", "keterangan": "Pengujian API menggunakan Postman client"},
            {"gambar": "sim-lampiran-4.png", "keterangan": "Sesi presentasi hasil proyek PKL di hadapan tim pengembang"}
        ]
    },
    "generated_sections": {}
}
