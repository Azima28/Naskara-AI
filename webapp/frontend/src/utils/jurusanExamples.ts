export interface DataAngkaExample {
  label: string
  sebelum: string
  sesudah: string
  nilai?: string
}

export interface ContohCabangExample {
  tipeBiasa: {
    namaTempat: string
    cabang: string
    penjelasan: string
  }
  tipeBesar: {
    namaPerusahaan: string
    area1: { namaArea: string; cabang: string[] }
    area2: { namaArea: string; cabang: string[] }
  }
}

export interface JobDescItemExample {
  posisi: string
  tugas: string[]
}

export interface JurusanExample {
  jurusan_key: string
  label: string
  icon: string
  badge: string
  contohPelajaran: string[]
  contohCabang: ContohCabangExample
  contohJobDesc: JobDescItemExample[]
  studiKasus: {
    judul: string
    latar_belakang: string
    proses_atau_formula: string
    hasil: string
    data_angka: DataAngkaExample[]
  }
}

export const JURUSAN_EXAMPLES: Record<string, JurusanExample> = {
  pplg: {
    jurusan_key: 'pplg',
    label: 'Pemrograman Perangkat Lunak & Gim (PPLG / RPL)',
    icon: '💻',
    badge: 'Perangkat Lunak & IT',
    contohPelajaran: [
      'Memahami pembuatan dan pengujian REST API',
      'Mengoptimalkan performa query database',
      'Bekerja secara kolaboratif dalam tim pengembang software',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Studio / Software House Local (1 Tempat PKL)',
        cabang: 'Kantor Utama Dev Studio - Jl. ZA Pagar Alam No. 45, Bandar Lampung',
        penjelasan: 'Bila studio/kantor tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Solusi Teknologi Indonesia (Banyak Cabang)',
        area1: { namaArea: 'Area Jakarta (Pusat)', cabang: ['Cabang Sudirman', 'Cabang Senayan'] },
        area2: { namaArea: 'Area Sumatra', cabang: ['Cabang Bandar Lampung', 'Cabang Palembang'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Junior Software / Backend Developer',
        tugas: [
          'Membangun dan memelihara modul fitur web/aplikasi (REST API)',
          'Mengelola database dan mengoptimalkan query SQL',
          'Melakukan pengujian (testing) dan debugging fitur software',
          'Membuat dokumentasi teknis struktur basis data & API',
        ],
      },
      {
        posisi: 'Frontend & UI Web Assistant',
        tugas: [
          'Merancang dan merapikan antarmuka halaman web yang responsif',
          'Mengintegrasikan komponen antarmuka dengan API backend',
        ],
      },
    ],
    studiKasus: {
      judul: 'Optimasi Speed & Performance Query Database pada Rekapitulasi Laporan Bulanan',
      latar_belakang:
        'Fitur rekapitulasi laporan bulanan mengalami kendala pemuatan lambat (timeout) saat memuat puluhan ribu baris data transaksi karena belum ada penciptaan indeks pada tabel database.',
      proses_atau_formula:
        '1. Melakukan profiling query menggunakan EXPLAIN ANALYZE.\n2. Menambahkan composite index pada kolom created_at dan status_id.\n3. Mengubah struktur subquery JOIN menjadi INNER JOIN ber-indeks.\n4. Melakukan testing beban dengan k6 / Apache JMeter.',
      hasil:
        'Waktu pemuatan halaman rekapitulasi berkurang drastis dari 4,5 detik menjadi 0,6 detik, dan penggunaan memori server berkurang hingga 82%.',
      data_angka: [
        { label: 'Waktu Pemuatan Aplikasi (Speed)', sebelum: '4,5 Detik', sesudah: '0,6 Detik', nilai: '0,6 Detik' },
        { label: 'Ukuran Memori & File Server', sebelum: '12 MB', sesudah: '2,1 MB (Hemat 82%)', nilai: '2,1 MB' },
        { label: 'Kapasitas Pengunjung Bersamaan', sebelum: '20 User', sesudah: '250 User', nilai: '250 User' },
      ],
    },
  },

  tkj: {
    jurusan_key: 'tkj',
    label: 'Teknik Komputer & Jaringan (TKJ)',
    icon: '🌐',
    badge: 'Jaringan & Server',
    contohPelajaran: [
      'Melakukan crimping kabel UTP dan testing koneksi jaringan LAN',
      'Mengonfigurasi IP Address, Router MikroTik, dan VLAN',
      'Melakukan instalasi dan troubleshooting perangkat komputer/jaringan',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Toko Komputer & Service Center (1 Tempat PKL)',
        cabang: 'Toko Utama & Service Center - Jl. Kartini No. 12, Bandar Lampung',
        penjelasan: 'Bila toko/tempat service kamu cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Telkom Indonesia / Provider Internet (Banyak Cabang)',
        area1: { namaArea: 'Witel Lampung & Bengkulu', cabang: ['Witel Bandar Lampung', 'Witel Metro'] },
        area2: { namaArea: 'Witel Sumsel', cabang: ['Witel Palembang Pusat'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Teknisi Jaringan & Network Support',
        tugas: [
          'Melakukan crimping kabel LAN UTP dan testing koneksi jaringan',
          'Mengonfigurasi IP Address, Router MikroTik, dan Access Point WiFi',
          'Monitoring kualitas bandwidth jaringan internet kantor',
          'Melakukan troubleshooting gangguan koneksi jaringan lokal',
        ],
      },
      {
        posisi: 'Teknisi Komputer & Hardware Support',
        tugas: [
          'Perakitan, maintenance, dan pembersihan unit PC/Laptop kantor',
          'Instalasi Sistem Operasi Windows/Linux dan aplikasi kerja',
        ],
      },
    ],
    studiKasus: {
      judul: 'Konfigurasi Manajemen Bandwidth Router MikroTik & Segmentation VLAN',
      latar_belakang:
        'Penggunaan koneksi internet di kantor sering mengalami lag akibat beberapa divisi menggunakan seluruh bandwidth tanpa pembagian kuota (queue tree) yang terorganisir.',
      proses_atau_formula:
        '1. Pembuatan VLAN ID 10 untuk Staf dan VLAN ID 20 untuk Tamu.\n2. Setting DHCP Server & IP Pool pada MikroTik RB750Gr3.\n3. Penerapan Queue Tree & PCQ (Per Connection Queue) untuk pembagian bandwidth adil.\n4. Uji kelajuan koneksi via Speedtest & iPerf.',
      hasil:
        'Lalu lintas data antar divisi menjadi terisolasi aman, latency koneksi stabil di angka 12ms, dan kecepatan internet merata 100 Mbps di seluruh divisi.',
      data_angka: [
        { label: 'Latency & Respon Koneksi', sebelum: '65 ms (Sering Lag)', sesudah: '12 ms (Stabil & Lancar)', nilai: '12 ms' },
        { label: 'Pembagian Bandwidth Komputer', sebelum: 'Acak (Saling Rebut)', sesudah: 'Rata 20 Mbps / PC', nilai: '20 Mbps' },
        { label: 'Waktu Pemasangan Kabel LAN', sebelum: '3 Jam', sesudah: '45 Menit', nilai: '45 Menit' },
      ],
    },
  },

  dkv: {
    jurusan_key: 'dkv',
    label: 'Desain Komunikasi Visual (DKV)',
    icon: '🎨',
    badge: 'Desain & Media',
    contohPelajaran: [
      'Mengoperasikan software desain grafis (Adobe Illustrator / Photoshop)',
      'Memahami hierarki tipografi dan komposisi tata letak media cetak/digital',
      'Membuat aset visual dan motion graphic untuk kebutuhan promosi',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Studio Foto & Digital Printing (1 Tempat PKL)',
        cabang: 'Studio Utama & Printing - Jl. Teuku Umar No. 88, Bandar Lampung',
        penjelasan: 'Bila studio/percetakan kamu cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Media Advertising & Printing (Banyak Cabang)',
        area1: { namaArea: 'Area Jabodetabek', cabang: ['Studio Kreatif Jakarta', 'Percetakan Bekasi'] },
        area2: { namaArea: 'Area Sumatra', cabang: ['Cabang Percetakan Bandar Lampung'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Graphic Designer & Content Creator',
        tugas: [
          'Membuat desain poster, banner, dan feed promosi media sosial',
          'Menyiapkan berkas cetak (spanduk, brosur, id card) sesuai standar percetakan',
          'Editing foto produk dan retouching gambar promosi',
          'Merancang identitas visual dan aset grafis klien',
        ],
      },
      {
        posisi: 'Junior Video Editor',
        tugas: [
          'Mengedit video pendek promosi untuk Reels dan TikTok',
          'Menyusun pemotongan klip (rough cut) dan pemberian efek transisi',
        ],
      },
    ],
    studiKasus: {
      judul: 'Perancangan Branding Visual & Optimasi Asset Rendering Motion Graphic',
      latar_belakang:
        'Waktu rendering video promosi resolusi 4K sering mengalami kegagalan karena ukuran aset grafis bitmap terlalu besar dan belum teroptimasi.',
      proses_atau_formula:
        '1. Mengubah aset gambar dari raster bitmap menjadi format vektor (SVG/AI).\n2. Pengaturan hierarki tipografi dan palet warna CMYK sesuai Brand Guidelines.\n3. Pengaturan Media Encoder H.264 profil target bit-rate 15 Mbps.\n4. Render final video iklan 60 FPS.',
      hasil:
        'Waktu komputasi render berkurang dari 3 jam menjadi 45 menit tanpa penurunan kualitas visual.',
      data_angka: [
        { label: 'Ukuran File Ekspor Desain', sebelum: '450 MB', sesudah: '35 MB (Tanpa Pecah)', nilai: '35 MB' },
        { label: 'Waktu Pembuatan & Render', sebelum: '3 Jam', sesudah: '45 Menit', nilai: '45 Menit' },
        { label: 'Jangkauan Penonton Konten (Reach)', sebelum: '1.200 Orang', sesudah: '15.500 Orang', nilai: '15.500 Orang' },
      ],
    },
  },

  upw: {
    jurusan_key: 'upw',
    label: 'Usaha Perjalanan Wisata (UPW)',
    icon: '🗺️',
    badge: 'Pariwisata & Tour',
    contohPelajaran: [
      'Menyusun paket itinerary dan perhitungan estimasi biaya tur (costing)',
      'Melakukan komunikasi dan reservasi dengan vendor armada & hotel',
      'Memberikan pelayanan panduan wisata (guiding) secara profesional',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Agen Tour & Travel Local (1 Tempat PKL)',
        cabang: 'Kantor Pusat Tour & Travel - Jl. Raden Intan No. 24, Bandar Lampung',
        penjelasan: 'Bila agen travel tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Panorama Travel Indonesia (Banyak Cabang)',
        area1: { namaArea: 'Area Jawa', cabang: ['Cabang Utama Jakarta', 'Cabang Bandung'] },
        area2: { namaArea: 'Area Sumatra', cabang: ['Cabang Bandar Lampung'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Staf Tour Planner & Ticketing',
        tugas: [
          'Melayani pemesanan tiket pesawat, kereta api, dan voucher hotel',
          'Menyusun rencana perjalanan wisata (itinerary tour) rombongan',
          'Menghitung estimasi rincian biaya paket wisata (tour costing)',
          'Menyiapkan dokumen perjalanan dan informasi panduan ke pelanggan',
        ],
      },
      {
        posisi: 'Customer Service & Travel Consultant',
        tugas: [
          'Menjawab konsultasi dan pertanyaan destinasi wisata calon pelanggan',
          'Mengelola reservasi dan konfirmasi rombongan wisata',
        ],
      },
    ],
    studiKasus: {
      judul: 'Penyusunan Paket Itinerary Tour Bandung-Lembang & Optimasi Travel Costing',
      latar_belakang:
        'Pembuatan paket tur wisata rombongan instansi sering mengalami estimasi biaya membengkak karena kurang presisinya perhitungan komponen transport, tiket masuk, dan catering.',
      proses_atau_formula:
        '1. Analisis rute perjalanan dan estimasi waktu tempuh (Time Table).\n2. Negosiasi kontrak rate dengan vendor armada bus dan restoran mitra.\n3. Perhitungan komponen Variable Cost dan Fixed Cost per pax.\n4. Simulasi Margin Keuntungan 15% pada harga jual paket tour.',
      hasil:
        'Paket wisata 3D2N berhasil disusun dengan efisiensi harga 21% dibanding kompetitor dan kepuasan peserta tour mencapai 98%.',
      data_angka: [
        { label: 'Total Biaya Paket Per Pax', sebelum: 'Rp 1.850.000', sesudah: 'Rp 1.450.000 (Hemat 21%)', nilai: 'Rp 1.450.000' },
        { label: 'Waktu Penyusunan Jadwal Tour', sebelum: '2 Hari', sesudah: '3 Jam', nilai: '3 Jam' },
        { label: 'Indeks Kepuasan Peserta Tur', sebelum: '78%', sesudah: '98%', nilai: '98%' },
      ],
    },
  },

  ph: {
    jurusan_key: 'ph',
    label: 'Perhotelan (PH)',
    icon: '🏨',
    badge: 'Hospitality & Hotel',
    contohPelajaran: [
      'Melakukan standar pembersihan dan inspeksi kamar (housekeeping)',
      'Melakukan prosedur check-in dan check-out tamu hotel di Front Desk',
      'Menjaga etika keramahan (hospitality) dan komunikasi profesional',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Hotel / Penginapan Local (1 Tempat PKL)',
        cabang: 'Hotel Utama - Jl. Wolter Monginsidi No. 15, Bandar Lampung',
        penjelasan: 'Bila hotel tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'Jaringan Hotel Santika / Aston (Banyak Cabang)',
        area1: { namaArea: 'Area Sumatra', cabang: ['Hotel Santika Premiere Bandar Lampung', 'Hotel Santika Palembang'] },
        area2: { namaArea: 'Area Jawa', cabang: ['Hotel Santika Jakarta'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Front Office Receptionist',
        tugas: [
          'Melayani proses check-in dan check-out tamu hotel secara profesional',
          'Menerima dan mencatat reservasi kamar melalui telepon dan sistem hotel',
          'Memberikan informasi fasilitas hotel dan destinasi sekitar kepada tamu',
          'Menangani pertanyaan dan koordinasi kebutuhan tamu hotel',
        ],
      },
      {
        posisi: 'Housekeeping Attendant',
        tugas: [
          'Membersihkan dan menata kerapian kamar tamu sesuai SOP hotel',
          'Mengatur ketersediaan linen, handuk, dan perlengkapan amenitas kamar',
        ],
      },
    ],
    studiKasus: {
      judul: 'Standardisasi Housekeeping Room Inspection & Optimasi Guest Check-In Speed',
      latar_belakang:
        'Tingginya antrean check-in guest pada jam sibuk (peak hour) akibat keterlambatan kesiapan kamar (room status ready) dari tim Housekeeping.',
      proses_atau_formula:
        '1. Penerapan Check-list digital Room Inspection 21 Poin via Property Management System (PMS).\n2. Pembagian zonasi penyiapan linenn dan amenities per lantai.\n3. Pelatihan koordinasi real-time antara Front Desk dan Floor Supervisor.\n4. Audit waktu rata-rata pembersihan kamar Deluxe Room.',
      hasil:
        'Waktu pembersihan dan inspeksi kamar turun dari 40 menit menjadi 20 menit, sehingga antrean check-in terurai 50% lebih cepat.',
      data_angka: [
        { label: 'Waktu Cleaning Kamar Deluxe', sebelum: '40 Menit', sesudah: '20 Menit', nilai: '20 Menit' },
        { label: 'Waktu Tunggu Check-In Tamu', sebelum: '15 Menit / Guest', sesudah: '3 Menit / Guest', nilai: '3 Menit' },
        { label: 'Tingkat Kesiapan Kamar VIP', sebelum: '80%', sesudah: '100% Ready', nilai: '100%' },
      ],
    },
  },

  tb: {
    jurusan_key: 'tb',
    label: 'Tata Boga (Tabog / Kuliner)',
    icon: '🍳',
    badge: 'Kuliner & Banquet',
    contohPelajaran: [
      'Melakukan persiapan bahan makanan (Mise en Place) dengan presisi',
      'Menerapkan standar higienitas dan sanitasi keselamatan kerja dapur (HACCP)',
      'Mengolah dan menyajikan hidangan sesuai standar resep restoran/hotel',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Restoran / Rumah Makan / Bakery (1 Tempat PKL)',
        cabang: 'Dapur Utama & Outlet - Jl. Antasari No. 30, Bandar Lampung',
        penjelasan: 'Bila rumah makan/bakery tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Restoran Boga Nusantara / Restaurant Chain (Banyak Cabang)',
        area1: { namaArea: 'Area Sumatra', cabang: ['Restoran Cabang Bandar Lampung', 'Cabang Palembang'] },
        area2: { namaArea: 'Area Jawa', cabang: ['Restoran Cabang Jakarta'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Kitchen Assistant / Commis Cook',
        tugas: [
          'Mempersiapkan bahan makanan (chopping, washing, portioning) sebelum memasak',
          'Memasak hidangan sesuai standar resep dan higienitas dapur (HACCP)',
          'Menjaga kebersihan area dapur, peralatan masak, dan meja kerja (mise en place)',
          'Menata dan menyajikan (plating) hidangan agar terlihat menarik',
        ],
      },
      {
        posisi: 'Pastry & Bakery Helper',
        tugas: [
          'Menimbang dan mengaduk adonan roti, kue, dan penutup (dessert)',
          'Memanggang dan menghias kue sesuai pesanan pelanggan',
        ],
      },
    ],
    studiKasus: {
      judul: 'Standardisasi Mise en Place & Efisiensi Food Cost Menu Banquet Event',
      latar_belakang:
        'Tingginya persentase sisa bahan baku makanan (food waste) pada pengolahan menu buffet banquet menyebabkan Food Cost melebihi standar target 30%.',
      proses_atau_formula:
        '1. Penerapan metode FIFO (First In First Out) pada penyimpanan chiller.\n2. Penimbangan porsi bahan (portion control) presisi saat Mise en Place.\n3. Perhitungan standar resep dan yield percentage bahan baku.\n4. Audit ketaatan prosedur higienitas sanitasi HACCP.',
      hasil:
        'Persentase Food Cost berhasil ditekan dari 38% menjadi 28,5%, sesuai standar efisiensi operasional hotel dan restoran.',
      data_angka: [
        { label: 'Persentase Food Waste (Sisa Bahan)', sebelum: '38%', sesudah: '28,5% (Sesuai Standar)', nilai: '28,5%' },
        { label: 'Waktu Persiapan (Mise en Place)', sebelum: '2 Jam', sesudah: '45 Menit', nilai: '45 Menit' },
        { label: 'Daya Tahan Bahan Chiller', sebelum: '1 Hari', sesudah: '4 Hari (Chiller FIFO)', nilai: '4 Hari' },
      ],
    },
  },

  busana: {
    jurusan_key: 'busana',
    label: 'Tata Busana (Tabus / Fashion)',
    icon: '✂️',
    badge: 'Fashion & Custom Making',
    contohPelajaran: [
      'Membaca dan merancang pola dasar busana (draping & flat pattern)',
      'Mengoperasikan mesin jahit industri dengan setikan presisi',
      'Melakukan pemotongan bahan (cutting) dan pengawasan kualitas jahitan',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Rumah Jahit & Tailor Custom (1 Tempat PKL)',
        cabang: 'Workshop Jahit - Jl. Pangeran Antasari No. 18, Bandar Lampung',
        penjelasan: 'Bila rumah jahit/boutique kamu cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Fashion Busana Indonesia (Banyak Cabang)',
        area1: { namaArea: 'Area Produksi', cabang: ['Pabrik Garmen Bandung', 'Studio Desain Jakarta'] },
        area2: { namaArea: 'Area Retail Boutique', cabang: ['Boutique Cabang Bandar Lampung'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Asisten Pembuat Pola Busana (Pattern Maker)',
        tugas: [
          'Membuat sketsa desain busana dan memilih sampel kain',
          'Membuat pola busana skala besar sesuai ukuran badan pelanggan',
          'Melakukan pemotongan bahan kain (cutting) dengan presisi',
          'Melakukan fitting dan penyesuaian kelonggaran pakaian',
        ],
      },
      {
        posisi: 'Quality Control & Finishing Busana',
        tugas: [
          'Memeriksa kerapian setikan jahitan, kancing, dan sisa benang',
          'Melakukan pengukusan (steaming/ironing) dan pengemasan pakaian',
        ],
      },
    ],
    studiKasus: {
      judul: 'Pembuatan Pola Busana Custom Draping & Quality Control Presisi Jahitan',
      latar_belakang:
        'Pembuatan sampel busana kerja wanita sering mengalami retur akibat penyimpangan ukuran pola saat proses pemotongan bahan (cutting error).',
      proses_atau_formula:
        '1. Pengukuran anatomi tubuh model dan pembuatan pola dasar sistem Soen/Meyneke.\n2. Pembuatan mock-up blus menggunakan kain blaco (draping sample).\n3. Pengaturan toleransi jahitan (seam allowance) 1.5 cm dan pemotongan bahan.\n4. Inspeksi kerapian setikan stik mesin las/jahit (8-10 stik per inci).',
      hasil:
        'Presisi ukuran pakaian mencapai 99,5% tanpa kelonggaran/kesempitan, dan waste sisa bahan kain berkurang hingga 18%.',
      data_angka: [
        { label: 'Sisa Potongan Kain (Waste Cut)', sebelum: 'Terganti 30%', sesudah: 'Hemat Sisa 12%', nilai: '12%' },
        { label: 'Presisi Ukuran Pola Baju', sebelum: 'Selisih ±1,5 cm', sesudah: 'Presisi ±0,2 cm', nilai: '±0,2 cm' },
        { label: 'Waktu Pembuatan Pola & Jahit', sebelum: '4 Jam', sesudah: '1,5 Jam', nilai: '1,5 Jam' },
      ],
    },
  },

  mplb: {
    jurusan_key: 'mplb',
    label: 'Manajemen Perkantoran & Layanan Bisnis (MPLB)',
    icon: '📁',
    badge: 'Administrasi & Perkantoran',
    contohPelajaran: [
      'Mengelola arsip fisik dan digitalisasi dokumen kantor',
      'Melakukan penanganan surat masuk, surat keluar, dan disposisi',
      'Melayani komunikasi telepon dan penerimaan tamu kantor secara ramah',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Kantor Notaris / CV Perkantoran / Instansi (1 Tempat PKL)',
        cabang: 'Kantor Utama - Jl. Diponegoro No. 112, Bandar Lampung',
        penjelasan: 'Bila kantor/instansi tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Pos Indonesia / BUMN (Banyak Cabang)',
        area1: { namaArea: 'Regional I (Lampung)', cabang: ['Kantor Pos Cabang Utama Bandar Lampung', 'Kantor Pos Metro'] },
        area2: { namaArea: 'Regional II (Sumsel)', cabang: ['Kantor Pos Palembang'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Staf Administrasi Perkantoran & Resepsionis',
        tugas: [
          'Mengelola, mencatat, dan mendokumentasikan surat masuk & surat keluar',
          'Menerima tamu kantor dan mengarahkan ke ruangan pimpinan/divisi yang dituju',
          'Menyusun agenda kegiatan, jadwal rapat, dan notulensi pertemuan',
          'Mengelola persediaan alat tulis kantor (ATK) dan kebutuhan harian kantor',
        ],
      },
      {
        posisi: 'Admin Input Data & Pengarsipan Digital',
        tugas: [
          'Menginput data transaksi dan dokumen ke spreadsheet/aplikasi e-Office',
          'Menata sistem kearsipan fisik dan alih media dokumen digital',
        ],
      },
    ],
    studiKasus: {
      judul: 'Digitalisasi & Digital Archiving System Surat Masuk/Keluar',
      latar_belakang:
        'Sistem temu kembali (retrieval) arsip fisik surat masuk sering memakan waktu lama karena pencatatan agenda masih menggunakan buku register manual.',
      proses_atau_formula:
        '1. Melakukan alih media (scanning) dokumen surat fisik ke format PDF.\n2. Mengelompokkan dokumen berdasarkan Sistem Subjek & Kode Klasifikasi.\n3. Menginput nomor disposisi dan indeks surat ke e-Office.\n4. Pengujian kecepatan pencarian dokumen (Retrieval Time Test).',
      hasil:
        'Waktu temu kembali dokumen arsip berkurang drastis dari 15 menit menjadi kurang dari 1 menit per dokumen.',
      data_angka: [
        { label: 'Waktu Temu Kembali Berkas Arsip', sebelum: '15 Menit', sesudah: '45 Detik (Via e-Office)', nilai: '45 Detik' },
        { label: 'Waktu Lembar Disposisi Surat', sebelum: '1 Hari', sesudah: '2 Jam', nilai: '2 Jam' },
        { label: 'Berkas Fisik Terdigitalisasi', sebelum: '0 Berkas', sesudah: '250 Berkas (PDF)', nilai: '250 Berkas' },
      ],
    },
  },

  akl: {
    jurusan_key: 'akl',
    label: 'Akuntansi & Keuangan Lembaga (AKL)',
    icon: '📊',
    badge: 'Akuntansi & Keuangan',
    contohPelajaran: [
      'Menginput dan merapikan catatan transaksi keuangan ke jurnal umum',
      'Melakukan penghitungan dan rekonsiliasi kas/bank',
      'Menyusun draf laporan keuangan sederhana dan verifikasi kuitansi',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Koperasi / Kantor Akuntan / BPR (1 Tempat PKL)',
        cabang: 'Kantor Koperasi - Jl. Gajah Mada No. 50, Bandar Lampung',
        penjelasan: 'Bila koperasi/kantor akuntan kamu cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Reksa Finance / Bank Lampung (Banyak Cabang)',
        area1: { namaArea: 'Area I (Lampung)', cabang: ['PT Reksa Finance Cabang Bandar Lampung', 'Cabang Metro'] },
        area2: { namaArea: 'Area II (Sumsel)', cabang: ['PT Reksa Finance Cabang Palembang'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Staf Akuntansi & Kasir',
        tugas: [
          'Mencatat transaksi penerimaan dan pengeluaran kas ke dalam jurnal',
          'Melakukan penghitungan dan rekonsiliasi kas kecil (petty cash)',
          'Memeriksa kelengkapan bukti transaksi (nota, invoice, kuitansi)',
          'Menyiapkan draf rekapitulasi laporan keuangan bulanan',
        ],
      },
      {
        posisi: 'Admin Keuangan & Tagihan',
        tugas: [
          'Membuat invoice/faktur penjualan dan mencatat tagihan ke pelanggan',
          'Melakukan pengecekan pembayaran dan pelaporan administrasi keuangan',
        ],
      },
    ],
    studiKasus: {
      judul: 'Pendataan & Penghitungan Waive Discount Debitur Macet serta Rekonsiliasi',
      latar_belakang:
        'Proses permohonan waive discount (potongan denda) oleh debitur membutuhkan penghitungan persentase potongan yang teliti agar perusahaan tidak mengalami kerugian berlebih namun debitur tetap dapat melunasi kewajibannya.',
      proses_atau_formula:
        '1. Mengumpulkan berkas KTP dan formulir permohonan debitur.\n2. Menhitung akumulasi denda harian (Total Angsuran x 0,5%).\n3. Melakukan negosiasi besaran diskon denda yang disetujui Head Collection.\n4. Menginput data persentase diskon ke sistem database.',
      hasil:
        'Debitur mendapatkan keringanan pembayaran denda sebesar 37,99% sehingga total tunggakan denda berkurang dari Rp 4.596.800,- menjadi Rp 2.851.000,- dan pembayaran pelunasan berhasil diproses.',
      data_angka: [
        { label: 'Total Denda Tagihan Debitur', sebelum: 'Rp 4.596.800', sesudah: 'Rp 2.851.000 (Diskon 37,99%)', nilai: 'Rp 2.851.000' },
        { label: 'Status Pelunasan Pembayaran', sebelum: 'Menunggak / Macet', sesudah: 'Lunas Terbayar', nilai: 'Lunas' },
        { label: 'Waktu Rekonsiliasi Kas & Denda', sebelum: '2 Hari', sesudah: '3 Jam', nilai: '3 Jam' },
      ],
    },
  },

  bdp: {
    jurusan_key: 'bdp',
    label: 'Bisnis Daring & Pemasaran (BDP)',
    icon: '🛍️',
    badge: 'Pemasaran & Bisnis',
    contohPelajaran: [
      'Membuat materi konten promosi digital dan riset produk',
      'Melayani transaksi penjualan dan pelayanan konsumen (customer service)',
      'Mengelola toko online (e-commerce) dan pencatatan stok barang',
    ],
    contohCabang: {
      tipeBiasa: {
        namaTempat: 'Toko Retail & Distro Local (1 Tempat PKL)',
        cabang: 'Toko Utama - Jl. Hayam Wuruk No. 7, Bandar Lampung',
        penjelasan: 'Bila toko tempat kamu PKL cuma ada 1 lokasi, kosongkan saja Nama Area!',
      },
      tipeBesar: {
        namaPerusahaan: 'PT Retail Mart Indonesia (Banyak Cabang)',
        area1: { namaArea: 'Area Lampung', cabang: ['Supermarket Cabang Kedaton', 'Cabang Teluk Betung'] },
        area2: { namaArea: 'Area Palembang', cabang: ['Supermarket Cabang Palembang'] },
      },
    },
    contohJobDesc: [
      {
        posisi: 'Staf Pemasaran Digital & Social Media Specialist',
        tugas: [
          'Mengelola akun media sosial toko/perusahaan dan mendesain konten promosi',
          'Melayani obrolan (chat/DM) calon pembeli secara ramah dan responsif',
          'Membuat teks penawaran promosi (copywriting) dan paket diskon',
          'Mengumpulkan data penjualan harian dan analisis tren produk terlaris',
        ],
      },
      {
        posisi: 'Staf Merchandising & Display Toko',
        tugas: [
          'Menata dan memajang (display) produk di rak sesuai standar visual merchandising',
          'Melakukan pengecekan fisik stok barang (stock opname) secara berkala',
        ],
      },
    ],
    studiKasus: {
      judul: 'Analisis Efektivitas Kampanye Social Media Ads & Conversion Rate E-Commerce',
      latar_belakang:
        'Kampanye produk baru melalui iklan digital membutuhkan evaluasi berjangka untuk memastikan Return on Ad Spend (ROAS) menguntungkan perusahaan.',
      proses_atau_formula:
        '1. Merancang materi konten video pendek (Reels/TikTok).\n2. Memasang Meta Ads dengan target audiens usia 18-35 tahun.\n3. Melakukan tracking Meta Pixel untuk pencatatan transaksi masuk.\n4. Evaluasi mingguan pada rasio konversi (CTR & Conversion Rate).',
      hasil:
        'Kampanye menghasilkan 1.250 leads prospektif dengan Conversion Rate naik sebesar 4,5% dan kenaikan total omzet bulanan sebesar Rp 18.500.000.',
      data_angka: [
        { label: 'Jangkauan Iklan Promosi (Reach)', sebelum: '500 Orang / Hari', sesudah: '8.500 Orang / Hari', nilai: '8.500 Orang' },
        { label: 'Jumlah Pembeli Harian', sebelum: '5 Pembeli', sesudah: '35 Pembeli', nilai: '35 Pembeli' },
        { label: 'Total Omzet Penjualan Bulanan', sebelum: 'Rp 4.500.000', sesudah: 'Rp 18.500.000', nilai: 'Rp 18.500.000' },
      ],
    },
  },
}

export function detectJurusanKey(input: string): string {
  if (!input) return 'mplb'
  const lower = input.toLowerCase().trim()
  if (lower.includes('akuntansi') || lower.includes('akl') || lower.includes('keuangan') || lower.includes('perbankan')) return 'akl'
  if (lower.includes('perangkat lunak') || lower.includes('rpl') || lower.includes('pplg') || lower.includes('software') || lower.includes('coding') || lower.includes('gim')) return 'pplg'
  if (lower.includes('jaringan') || lower.includes('tkj') || lower.includes('sija') || lower.includes('komputer') || lower.includes('network')) return 'tkj'
  if (lower.includes('pemasaran') || lower.includes('bdp') || lower.includes('bisnis digital') || lower.includes('marketing')) return 'bdp'
  if (lower.includes('perkantoran') || lower.includes('mplb') || lower.includes('otkp') || lower.includes('administrasi') || lower.includes('layanan bisnis')) return 'mplb'
  if (lower.includes('desain') || lower.includes('dkv') || lower.includes('animasi') || lower.includes('visual') || lower.includes('broadcasting')) return 'dkv'
  if (lower.includes('boga') || lower.includes('kuliner') || lower.includes('tabog') || lower.includes('tb')) return 'tb'
  if (lower.includes('hotel') || lower.includes('perhotelan') || lower.includes('ph') || lower.includes('housekeeping')) return 'ph'
  if (lower.includes('busana') || lower.includes('fashion') || lower.includes('tabus') || lower.includes('ts') || lower.includes('jahit') || lower.includes('pakaian')) return 'busana'
  if (lower.includes('wisata') || lower.includes('upw') || lower.includes('tour') || lower.includes('travel') || lower.includes('perjalanan')) return 'upw'
  if (lower.includes('otomotif') || lower.includes('tkro') || lower.includes('tbsm')) return 'mplb'
  if (lower.includes('farmasi') || lower.includes('kesehatan')) return 'mplb'

  // Aliasing fallback
  if (lower.includes('rpl')) return 'pplg'
  if (lower.includes('otkp')) return 'mplb'

  return 'mplb'
}

export function getJurusanExample(jurusanKey?: string): JurusanExample {
  if (!jurusanKey) return JURUSAN_EXAMPLES['mplb']
  const key = jurusanKey.toLowerCase().trim()
  const detectedKey = detectJurusanKey(key)
  return JURUSAN_EXAMPLES[key] || JURUSAN_EXAMPLES[detectedKey] || JURUSAN_EXAMPLES['mplb']
}
