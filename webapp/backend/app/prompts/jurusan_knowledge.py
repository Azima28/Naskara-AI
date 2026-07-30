"""Registry konteks jurusan untuk ditambahkan ke prompt.

Berisi istilah teknis dan penjelasan kompetensi keahlian berdasarkan
standar 10 Konsentrasi Keahlian SMKN 4 Bandung.
"""

JURUSAN_KNOWLEDGE = {
    "pplg": """Konteks Jurusan: Pemrograman Perangkat Lunak & Gim (PPLG / RPL)
Fokus kompetensi: Pengembangan aplikasi (web/mobile/desktop/game), desain database, REST API, coding, testing, dan deployment.
Istilah Teknis: Framework, API, Database, SQL, CRUD, ERD, Frontend, Backend, Deploy, Git, Repository, Debug, Testing, UI/UX, Responsive, Game Engine.
Fokus Analisis: Optimasi query database, alur logika program, penyelesaian bug (debugging), dan implementasi fitur baru sesuai requirement.
""",

    "tkj": """Konteks Jurusan: Teknik Komputer dan Jaringan (TKJ) / SIJA
Fokus kompetensi: Konfigurasi jaringan LAN/WAN, administrasi server, troubleshooting hardware/network, instalasi OS, dan manajemen MikroTik.
Istilah Teknis: IP Address, Subnetting, CIDR, VLAN, Mikrotik, Queue Tree, Bandwidth, Latency, Crimping, UTP, DHCP, DNS, Firewall, NAT, Topologi.
Fokus Analisis: Manajemen bandwidth, keamanan jaringan, efisiensi topologi, dan penanganan masalah koneksi (troubleshooting).
""",

    "dkv": """Konteks Jurusan: Desain Komunikasi Visual (DKV) / Animasi / Motion Graphics
Fokus kompetensi: Desain grafis (branding, logo, publikasi), editing video, motion graphics, fotografi, dan tata letak (layout).
Istilah Teknis: Resolution, Render, Frame, FPS, Vector, Raster, CMYK, RGB, Bleed, Trim, Mockup, Brief, Revisi, Typography, Motion Graphic.
Fokus Analisis: Konsep visual sesuai brief klien, optimasi waktu rendering, hierarki visual, dan kesesuaian output dengan media tayang/cetak.
""",

    "upw": """Konteks Jurusan: Usaha Perjalanan Wisata (UPW)
Fokus kompetensi: Penyusunan itinerary paket tour, travel costing, ticketing flight & hotel, tour guiding, dan penanganan customer travel.
Istilah Teknis: Itinerary, Time Table, Travel Costing, Fixed Cost, Variable Cost, Pax, Reservation, Ticket, GDS Sabre, Amadeus, Inbound/Outbound.
Fokus Analisis: Efisiensi susunan rute tour, akurasi perhitungan harga paket wisata per pax, dan tingkat kepuasan pelanggan tour.
""",

    "ph": """Konteks Jurusan: Perhotelan (PH)
Fokus kompetensi: Layanan kamar (housekeeping), front office check-in/out, laundry service, turndown service, dan pengelolaan guest relation.
Istilah Teknis: Room Inspection, Housekeeping, PMS Opera, Front Desk, Check-In, Check-Out, Amenities, Linen, Occupancy Rate, Guest Complaint.
Fokus Analisis: Kecepatan proses check-in, kerapian & kebersihan kamar sesuai SOP 21 poin, serta kepuasan tamu hotel.
""",

    "tb": """Konteks Jurusan: Tata Boga / Kuliner (Tabog)
Fokus kompetensi: Persiapan bahan (mise en place), pengolahan makanan/pastry, penyajian (plating), kebersihan dapur, dan perhitungan food cost.
Istilah Teknis: Mise en Place, Food Cost, Yield, Plating, Garnishing, FIFO, HACCP, Stock Opname, BEP, Pastry, Bakery, Tabog.
Fokus Analisis: Standardisasi rasa dan penyajian, penerapan HACCP (higienitas), dan perhitungan rasio persentase biaya bahan baku (food cost).
""",

    "busana": """Konteks Jurusan: Tata Busana / Fashion (Tabus)
Fokus kompetensi: Pembuatan pola dasar & custom, draping, teknik memotong bahan (cutting), menjahit pakaian industri (garment), dan quality control.
Istilah Teknis: Pola Dasar, Draping, Meyneke, Cutting, Seam Allowance, Stik Jahitan, Quality Control, Garment, Fitting, Anatomi Busana, Tabus.
Fokus Analisis: Akurasi presisi ukuran pola busana, kelancaran proses jahit high-speed, kerapatan stik jahitan, dan penghematan pemakaian bahan kain.
""",

    "mplb": """Konteks Jurusan: Manajemen Perkantoran dan Layanan Bisnis (MPLB)
Fokus kompetensi: Administrasi kantor, digital archiving system, korespondensi surat masuk/keluar, pengelolaan agenda rapat, dan resepsionis PABX.
Istilah Teknis: Disposisi, Agenda Surat, Filing System, Kartu Kendali, Retrieval, In/Out Mail, Tata Kelola Arsip, e-Office, PABX, MPLB.
Fokus Analisis: Efisiensi waktu temu kembali arsip (retrieval time), kerapian tata kelola dokumen, dan standar operasional prosedur pelayanan.
""",

    "akl": """Konteks Jurusan: Akuntansi dan Keuangan Lembaga (AKL)
Fokus kompetensi: Pencatatan transaksi, penyusunan laporan keuangan, rekonsiliasi bank, waive discount denda, dan administrasi pajak/kas kecil.
Istilah Teknis: Debitur, Kreditur, Angsuran, Denda, Waive Discount, Rekonsiliasi, Cash Opname, Rekening Koran, Jurnal Penyesuaian (Adjusting), Trial Balance.
Fokus Analisis: Akurasi data keuangan, perhitungan diskon/denda debitur, dan kerapian arsip bukti transaksi.
""",

    "bdp": """Konteks Jurusan: Bisnis Daring dan Pemasaran (BDP)
Fokus kompetensi: Pemasaran digital, social media ads management, e-commerce marketplace, content creation, analisis kampanye marketing.
Istilah Teknis: Conversion Rate, ROI, ROAS, Impression, CTR, Engagement, Leads, Funnel, Campaign, Content Marketing, Marketplace, Meta Ads.
Fokus Analisis: Efektivitas promosi ads digital, konversi penjualan e-commerce, engagement pelanggan, dan pengelolaan konten produk.
""",
}

def get_jurusan_context(jurusan_key: str) -> str:
    """Mengambil string konteks berdasarkan key jurusan. Jika tidak ketemu, return umum."""
    if not jurusan_key:
        return "Fokus kompetensi: Pelaksanaan praktik kerja sesuai keahlian bidang teknis terkait."

    key = jurusan_key.lower().strip()

    # Alias normalization mapping for backward compatibility
    alias_map = {
        "rpl": "pplg",
        "software": "pplg",
        "boga": "tb",
        "kuliner": "tb",
        "tabog": "tb",
        "ts": "busana",
        "fashion": "busana",
        "tabus": "busana",
        "otkp": "mplb",
        "perkantoran": "mplb",
        "administrasi": "mplb",
        "wisata": "upw",
        "travel": "upw",
        "hotel": "ph",
        "perhotelan": "ph",
        "tkro": "tkj", # fallback if legacy
    }

    resolved_key = alias_map.get(key, key)
    return JURUSAN_KNOWLEDGE.get(resolved_key, "Fokus kompetensi: Pelaksanaan praktik kerja sesuai dengan prosedur standar industri yang berlaku.")
