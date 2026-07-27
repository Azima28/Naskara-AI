"""Registry konteks jurusan untuk ditambahkan ke prompt.

Berisi istilah teknis dan penjelasan kompetensi keahlian berdasarkan
`references/jurusan-knowledge.md`.
"""

JURUSAN_KNOWLEDGE = {
    "akl": """Konteks Jurusan: Akuntansi dan Keuangan Lembaga (AKL) / Perbankan
Fokus kompetensi: Pencatatan transaksi, penyusunan laporan keuangan, rekonsiliasi, administrasi keuangan.
Istilah Teknis: Debitur, Kreditur, Angsuran, Denda, Waive Discount, Rekonsiliasi, Cash Opname, Rekening Koran, Jurnal Penyesuaian (Adjusting), Trial Balance.
Fokus Analisis: Akurasi data keuangan, perhitungan diskon/denda, dan kerapian arsip bukti transaksi.
""",
    
    "tkj": """Konteks Jurusan: Teknik Komputer dan Jaringan (TKJ) / SIJA
Fokus kompetensi: Konfigurasi jaringan LAN/WAN, administrasi server, troubleshooting hardware/network, instalasi OS.
Istilah Teknis: IP Address, Subnetting, CIDR, VLAN, Mikrotik, Queue Tree, Bandwidth, Latency, Crimping, UTP, DHCP, DNS, Firewall, NAT, Topologi.
Fokus Analisis: Manajemen bandwidth, keamanan jaringan, efisiensi topologi, dan penanganan masalah koneksi (troubleshooting).
""",
    
    "rpl": """Konteks Jurusan: Rekayasa Perangkat Lunak (RPL) / PPLG
Fokus kompetensi: Pengembangan aplikasi (web/mobile/desktop), desain database, coding, testing, dan deployment.
Istilah Teknis: Framework, API, Database, SQL, CRUD, ERD, Frontend, Backend, Deploy, Git, Repository, Debug, Testing, UI/UX, Responsive.
Fokus Analisis: Optimasi query database, alur logika program, penyelesaian bug (debugging), dan implementasi fitur baru sesuai requirement.
""",
    
    "bdp": """Konteks Jurusan: Bisnis Daring dan Pemasaran (BDP) / Bisnis Digital
Fokus kompetensi: Pemasaran digital, social media management, content creation, analisis kampanye marketing, customer service.
Istilah Teknis: Conversion Rate, ROI, ROAS, Impression, CTR, Engagement, Leads, Funnel, Campaign, Content Marketing, SEO, SEM.
Fokus Analisis: Efektivitas promosi, konversi penjualan, engagement pelanggan, dan pengelolaan konten digital.
""",
    
    "mplb": """Konteks Jurusan: Manajemen Perkantoran dan Layanan Bisnis (MPLB)
Fokus kompetensi: Administrasi kantor, pengelolaan arsip (filing system), korespondensi, resepsionis, dan pelayanan pelanggan.
Istilah Teknis: Disposisi, Agenda Surat, Filing System, Kartu Kendali, Retrieval, In/Out Mail, Tata Kelola Arsip.
Fokus Analisis: Efisiensi waktu temu kembali arsip (retrieval time), kerapian tata kelola dokumen, dan standar operasional prosedur pelayanan.
""",
    
    "tkro": """Konteks Jurusan: Teknik Kendaraan Ringan Otomotif (TKRO) / TBSM
Fokus kompetensi: Servis berkala kendaraan (tune up), perbaikan engine, sistem kelistrikan, chasis, dan penggunaan alat ukur/diagnostic.
Istilah Teknis: DTC, Scantool, Fuel Injection, ECU, Tune Up, Spooring, Balancing, Overheat, Stall, Idle, Overhaul.
Fokus Analisis: Analisis masalah mesin (troubleshooting berdasarkan kode DTC), prosedur tune up yang sesuai SOP, dan estimasi perbaikan kendaraan.
""",
    
    "dkv": """Konteks Jurusan: Desain Komunikasi Visual (DKV) / Animasi / Broadcasting
Fokus kompetensi: Desain grafis (branding, logo, publikasi), editing video, motion graphics, fotografi, dan tata letak (layout).
Istilah Teknis: Resolution, Render, Frame, FPS, Vector, Raster, CMYK, RGB, Bleed, Trim, Mockup, Brief, Revisi, Typography.
Fokus Analisis: Konsep visual sesuai brief klien, optimasi waktu rendering, hierarki visual, dan kesesuaian output dengan media tayang/cetak.
""",
    
    "ph": """Konteks Jurusan: Tata Boga / Kuliner / Perhotelan (PH)
Fokus kompetensi: Persiapan bahan (mise en place), pengolahan makanan, penyajian (plating), kebersihan dapur, dan perhitungan biaya.
Istilah Teknis: Mise en Place, Food Cost, Yield, Plating, Garnishing, FIFO, HACCP, Stock Opname, BEP.
Fokus Analisis: Standardisasi rasa dan penyajian, penerapan HACCP (higienitas), dan perhitungan rasio persentase biaya bahan baku (food cost).
""",
    
    "farmasi": """Konteks Jurusan: Farmasi Klinis dan Komunitas
Fokus kompetensi: Peracikan obat, pelayanan resep dokter, manajemen stok obat di apotek/RS, dan edukasi informasi obat ke pasien.
Istilah Teknis: Resep, Racikan, Dosis, Sediaan, Generik, Paten, LASA, High Alert, Expired, Stock Opname, e-Resep.
Fokus Analisis: Ketepatan perhitungan dosis racikan, penerapan prinsip LASA/High Alert, dan alur penanganan resep.
""",
    
    "tei": """Konteks Jurusan: Teknik Elektronika Industri (TEI)
Fokus kompetensi: Pemeliharaan mesin produksi industri, troubleshooting panel kelistrikan, pemrograman PLC, perakitan (assembly) komponen elektronika, dan kalibrasi sensor.
Istilah Teknis: PLC, Ladder Diagram, Sensor, Actuator, PCB, Soldering, Multimeter, Oscilloscope, Panel Listrik, Kalibrasi.
Fokus Analisis: Logika pemrograman PLC (ladder diagram), efisiensi alur kendali mesin, dan akurasi pengukuran menggunakan instrumen uji.
"""
}

def get_jurusan_context(jurusan_key: str) -> str:
    """Mengambil string konteks berdasarkan key jurusan. Jika tidak ketemu, return umum."""
    if not jurusan_key:
        return "Fokus kompetensi: Pelaksanaan praktik kerja sesuai keahlian bidang teknis terkait."
    
    key = jurusan_key.lower().strip()
    return JURUSAN_KNOWLEDGE.get(key, "Fokus kompetensi: Pelaksanaan praktik kerja sesuai dengan prosedur standar industri yang berlaku.")
