export interface DataAngkaExample {
  label: string
  sebelum?: string
  sesudah?: string
  nilai?: string
  nilai_awal?: string
  nilai_akhir?: string
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

export interface ContohKegiatanExample {
  bidang: string
  deskripsi_umum: string
  tugas: { nama: string; detail: string }[]
}

export interface ContohPeralatanExample {
  nama: string
  deskripsi: string
}

export interface ContohKendalaExample {
  masalah: string
  solusi: string
}

export interface JurusanExample {
  jurusan_key: string
  label: string
  icon: string
  badge: string
  contohPelajaran: string[]
  contohCabang: ContohCabangExample
  contohJobDesc: JobDescItemExample[]
  contohKegiatan?: ContohKegiatanExample[]
  contohPeralatan?: ContohPeralatanExample[]
  contohKendala?: ContohKendalaExample[]
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
    contohKegiatan: [
      {
        bidang: 'Divisi Software Development / Tim Backend & Frontend',
        deskripsi_umum: 'Membantu tim pengembang software dalam merancang modul aplikasi web, merapikan antarmuka UI, dan mengelola basis data database.',
        tugas: [
          { nama: 'Membuat REST API', detail: 'Membuat endpoint API transaksi kasir menggunakan Express.js / Laravel' },
          { nama: 'Desain & Query Database', detail: 'Merancang tabel MySQL dan membuat query indexing rekap data' },
          { nama: 'Fixing Bug & Slicing UI', detail: 'Memperbaiki bug tampilan tombol dan penyesuaian CSS responsif' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Laptop / PC Workstation (RAM 16GB)', deskripsi: 'Digunakan untuk koding, running local server (Node.js/PHP), dan database manager.' },
      { nama: 'VS Code, Postman & Git', deskripsi: 'Digunakan untuk pengkodean program, testing endpoint API, dan version control repository.' },
    ],
    contohKendala: [
      { masalah: 'Query database lambat saat memuat puluhan ribu baris data transaksi.', solusi: 'Menambahkan composite index pada kolom created_at dan merapikan klausa INNER JOIN.' },
    ],
    studiKasus: {
      judul: 'Mempercepat Pemuatan Data Laporan pada Aplikasi Web Kasir',
      latar_belakang:
        'Halaman rekap laporan transaksi terasa sangat lambat saat dibuka karena baris data yang dipanggil sangat banyak dan belum di-indeks.',
      proses_atau_formula:
        '1. Cek perintah SQL query yang lambat.\n2. Tambahkan indeks pada kolom tanggal transaksi.\n3. Rapikan kodingan pemanggilan tabel database.\n4. Coba buka kembali aplikasi web kasir.',
      hasil:
        'Halaman laporan web kini terbuka sangat cepat (dari 4,5 detik menjadi 0,6 detik) dan tidak ada lag lagi.',
      data_angka: [
        { label: 'Waktu Pemuatan Aplikasi (Speed)', sebelum: '4,5 Detik', sesudah: '0,6 Detik', nilai: '0,6 Detik' },
        { label: 'Ukuran Bundle Website', sebelum: '12 MB', sesudah: '3,2 MB (Hemat 73%)', nilai: '3,2 MB' },
        { label: 'Kapasitas Pengunjung Bersamaan', sebelum: '20 User', sesudah: '60 User', nilai: '60 User' },
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
    contohKegiatan: [
      {
        bidang: 'Divisi IT Support & Network Operation Center (NOC)',
        deskripsi_umum: 'Memastikan kelancaran jaringan lokal LAN/WiFi kantor, melakukan crimping kabel, dan menangani gangguan komputer karyawan.',
        tugas: [
          { nama: 'Crimping & Testing Kabel UTP', detail: 'Membuat kabel LAN RJ-45 straight & cross untuk sambungan router ke switch' },
          { nama: 'Konfigurasi Router MikroTik', detail: 'Mengatur IP Address DHCP Pool, Bandwidth Queue Tree, dan VLAN ID' },
          { nama: 'Troubleshooting PC Karyawan', detail: 'Memperbaiki komputer tidak bisa terhubung internet dan instalasi driver' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Router MikroTik, Switch & LAN Tester', deskripsi: 'Digunakan untuk mengonfigurasi jaringan, membagi VLAN, dan menguji kelayakan sinyal kabel LAN.' },
      { nama: 'Crimping Tool & Tang Stripper Kabel', deskripsi: 'Digunakan untuk memotong, mengupas, dan menjepit konektor RJ-45 ke kabel UTP.' },
    ],
    contohKendala: [
      { masalah: 'Koneksi WiFi kantor sering lag dan bentrok IP (IP Conflict) antar komputer.', solusi: 'Mengatur pembagian IP Address otomatis via DHCP Server dan membatasi bandwidth per perangkat.' },
    ],
    studiKasus: {
      judul: 'Setting Pembagian Kecepatan Internet MikroTik & Jalur VLAN Kantor',
      latar_belakang:
        'Koneksi internet kantor sering lambat dan saling berebut karena belum ada pembagian kecepatan (bandwidth) per ruangan.',
      proses_atau_formula:
        '1. Buat jalur Wi-Fi terpisah untuk Staf dan Tamu.\n2. Atur IP Address otomatis di Router MikroTik.\n3. Batasi kecepatan internet agar adil per komputer.\n4. Tes kelancaran koneksi internet dengan Speedtest.',
      hasil:
        'Internet kantor jadi sangat lancar, tidak lag saat pakai barengan, dan kecepatannya terbagi merata.',
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
    contohKegiatan: [
      {
        bidang: 'Divisi Desain Grafis & Creative Media Studio',
        deskripsi_umum: 'Merancang materi publikasi visual, membuat konten media sosial, dan merapikan file siap cetak (pre-press layout).',
        tugas: [
          { nama: 'Desain Banner & Feed Sosmed', detail: 'Membuat aset promosi produk menggunakan Adobe Illustrator & Photoshop' },
          { nama: 'Persiapan Berkas Cetak Pre-Press', detail: 'Menyesuaikan format CMYK, garis bleed, dan resolusi 300 DPI untuk spanduk' },
          { nama: 'Editing Video Promosi', detail: 'Pemotongan klip video pendek dan pemberian motion graphics untuk Reels/TikTok' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Pen Tablet Wacom & PC Desain', deskripsi: 'Digunakan untuk menggambar ilustrasi vektor, retouching foto, dan penyesuaian garis desain.' },
      { nama: 'Adobe Creative Cloud (Illustrator, Photoshop, Premiere)', deskripsi: 'Software utama pemrosesan gambar vektor, layout cetak, dan editing video.' },
    ],
    contohKendala: [
      { masalah: 'Waktu render video promosi resolusi tinggi memakan waktu sangat lama dan terkadang crash.', solusi: 'Mengonversi aset raster bitmap menjadi vektor dan mengatur profil bit-rate Media Encoder.' },
    ],
    studiKasus: {
      judul: 'Desain Banner Promo Sosmed & Hemat Waktu Render Video Iklan',
      latar_belakang:
        'Ekspor (render) video promosi produk sering lama dan crash karena file gambar yang dipakai terlalu berat dan pecah.',
      proses_atau_formula:
        '1. Ubah file gambar ke format vektor agar tidak pecah.\n2. Atur warna dan huruf banner promo sesuai produk.\n3. Setting format ekspor video ringan H.264.\n4. Render dan upload video promo ke Instagram/TikTok.',
      hasil:
        'Proses render video jadi 4x lebih cepat (dari 3 jam jadi 45 menit) dengan hasil gambar tetap jernih dan tajam.',
      data_angka: [
        { label: 'Ukuran File Ekspor Desain', sebelum: '450 MB', sesudah: '35 MB (Tanpa Pecah)', nilai: '35 MB' },
        { label: 'Waktu Pembuatan & Render', sebelum: '3 Jam', sesudah: '45 Menit', nilai: '45 Menit' },
        { label: 'Jangkauan Penonton Konten (Reach)', sebelum: '1.200 Orang', sesudah: '3.500 Orang', nilai: '3.500 Orang' },
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
    contohKegiatan: [
      {
        bidang: 'Divisi Tour Planning & Travel Ticketing',
        deskripsi_umum: 'Menyusun jadwal paket wisata (itinerary), menghitung estimasi biaya tur (tour costing), dan melayani reservasi tiket/hotel.',
        tugas: [
          { nama: 'Penyusunan Itinerary Tour', detail: 'Menyusun alur perjalanan wisata 3D2N destinasi tur beserta estimasi durasi' },
          { nama: 'Perhitungan Tour Costing', detail: 'Menghitung rincian fixed cost bus, tiket masuk wisata, hotel, dan catering per pax' },
          { nama: 'Reservasi Armada & Hotel', detail: 'Melakukan konfirmasi ketersediaan kamar hotel dan armada bus turis' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Komputer & Sistem Reservasi Travel (E-Booking)', deskripsi: 'Digunakan untuk mencari rute perjalanan, memesan tiket, dan membandingkan harga hotel.' },
      { nama: 'Peta Destinasi & Database Vendor Mitra', deskripsi: 'Digunakan untuk mengukur jarak tempuh dan menghubungi pengelola destinasi wisata.' },
    ],
    contohKendala: [
      { masalah: 'Estimasi biaya paket wisata membengkak akibat lonjakan tarif armada bus di musim liburan.', solusi: 'Melakukan negosiasi kontrak rate jangka panjang dengan agen penyedia bus mitra.' },
    ],
    studiKasus: {
      judul: 'Membuat Jadwal & Rincian Biaya Paket Wisata 3D2N Bandung',
      latar_belakang:
        'Biaya paket wisata rombongan sering terlalu mahal karena belum ada negosiasi harga khusus dengan tempat makan dan sewa bus.',
      proses_atau_formula:
        '1. Susun rute dan jadwal jam kunjungan wisata.\n2. Kontak pengelola bus dan hotel untuk dapat harga khusus.\n3. Hitung total biaya tiket, makan, dan hotel per orang.\n4. Tentukan harga jual paket wisata yang murah & menguntungkan.',
      hasil:
        'Paket wisata 3 Hari 2 Malam berhasil dibuat dengan harga 21% lebih murah dan wisatawan sangat puas.',
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
    contohKegiatan: [
      {
        bidang: 'Divisi Housekeeping & Front Office Department',
        deskripsi_umum: 'Melayani penerimaan tamu check-in di Front Desk dan melaksanakan standar pembersihan kamar tamu hotel.',
        tugas: [
          { nama: 'Pembersihan Kamar Guest Room', detail: 'Mengganti bed sheet, menata amenities, dan mensterilkan area kamar mandi' },
          { nama: 'Pelayanan Front Desk Check-in', detail: 'Mencatat identitas tamu di sistem PMS hotel dan menyerahkan kartu kunci kamar' },
          { nama: 'Room Inspection Check-list', detail: 'Memeriksa kelengkapan fasilitas kamar sebelum dinyatakan ready untuk guest' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Housekeeping Trolley & Vacuum Cleaner', deskripsi: 'Digunakan untuk mengangkut linen bersih, perlengkapan mandi, dan membersihkan karpet kamar.' },
      { nama: 'Property Management System (PMS) Hotel', deskripsi: 'Sistem software untuk melihat status kamar (Ready/Dirty/Occupied) dan reservasi tamu.' },
    ],
    contohKendala: [
      { masalah: 'Antrean tamu check-in mengular akibat keterlambatan update status kesiapan kamar.', solusi: 'Melakukan inspeksi kamar secara digital via PMS dan meningkatkan koordinasi antar lantai.' },
    ],
    studiKasus: {
      judul: 'Pembersihan Kamar Hotel Cepat & Mengatasi Antrean Check-In Tamu',
      latar_belakang:
        'Tamu hotel sering menunggu lama saat check-in di resepsionis karena kamar belum selesai dibersihkan tim Housekeeping.',
      proses_atau_formula:
        '1. Pakai daftar cek pembersihan kamar di aplikasi hotel.\n2. Bagi tim penyiapan sprei dan sabun mandi per lantai.\n3. Laporkan kesiapan kamar langsung ke bagian resepsionis.\n4. Cek ulang kerapian kamar sebelum tamu masuk.',
      hasil:
        'Pembersihan kamar jadi 2x lebih cepat (dari 40 menit jadi 20 menit) dan antrean tamu di resepsionis langsung lancar.',
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
    contohKegiatan: [
      {
        bidang: 'Divisi Dapur Utama (Main Kitchen / Pastry Section)',
        deskripsi_umum: 'Melaksanakan persiapan bahan makanan (Mise en Place), mengolah masakan sesuai standar resep, dan menjaga kebersihan dapur.',
        tugas: [
          { nama: 'Persiapan Bahan (Mise en Place)', detail: 'Memotong sayuran, menimbang bumbu, dan menyiapkan portion control bahan daging' },
          { nama: 'Pengolahan Menu Main Course', detail: 'Memasak hidangan sesuai standar resep dan standar higienitas HACCP' },
          { nama: 'Plating & Presentation', detail: 'Menata hidangan di atas piring saji agar estetik dan menarik sebelum disajikan' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Chef Knife, Cutting Board Color Code & Scale', deskripsi: 'Peralatan memotong dan menimbang bumbu/bahan masakan secara presisi dan higienis.' },
      { nama: 'Combi Oven, Stove & Chiller Refrigerator', deskripsi: 'Digunakan untuk memasak, memanggang adonan, dan menyimpan bahan basah sesuai standar FIFO.' },
    ],
    contohKendala: [
      { masalah: 'Persentase sisa bahan makanan (food waste) melebihi batas toleransi efisiensi.', solusi: 'Menerapkan metode penimbangan porsi ketat dan penataan rotasi bahan baku di chiller (FIFO).' },
    ],
    studiKasus: {
      judul: 'Persiapan Bahan Masakan Dapur & Menekan Sisa Bahan Makanan',
      latar_belakang:
        'Banyak bahan makanan di dapur yang terbuang sia-sia saat masak menu pesta sehingga modal bahan dapur jadi boros.',
      proses_atau_formula:
        '1. Pakai bahan makanan yang lebih dulu dibeli (sistem FIFO).\n2. Timbang potongan daging dan bumbu secara pas sebelum dimasak.\n3. Masak makanan sesuai takaran resep standar.\n4. Jaga kebersihan alat dan meja dapur.',
      hasil:
        'Sisa bahan makanan terbuang berkurang dari 38% jadi 28,5% dan modal dapur jadi jauh lebih hemat.',
      data_angka: [
        { label: 'Persentase Food Waste (Sisa Bahan)', sebelum: '38%', sesudah: '28,5% (Sesuai Standar)', nilai: '28,5%' },
        { label: 'Waktu Persiapan Bahan (Mise en Place)', sebelum: '2 Jam', sesudah: '45 Menit', nilai: '45 Menit' },
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
    contohKegiatan: [
      {
        bidang: 'Divisi Workshop Produksi & Pembuatan Pola Custom',
        deskripsi_umum: 'Membuat pola busana sesuai ukuran pelanggan, melakukan pemotongan bahan kain, dan menjahit sampel pakaian.',
        tugas: [
          { nama: 'Pembuatan Pola Dasar Busana', detail: 'Merancang pola baju sistem Soen/Meyneke di atas kertas pola sesuai ukuran' },
          { nama: 'Pemotongan Kain (Cutting)', detail: 'Melakukan tata letak pola di atas kain dan memotong bahan dengan toleransi kampus jahitan' },
          { nama: 'Jahit Sampel & Fitting', detail: 'Menjahit potongan kain dengan mesin jahit industri dan melakukan fitting kelonggaran' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Mesin Jahit High-Speed Industri & Mesin Obras', deskripsi: 'Digunakan untuk menjahit setikan busana secara cepat dan merapikan tiras tepi kain.' },
      { nama: 'Gunting Kain, Meteran Badan & Penggaris Pola', deskripsi: 'Peralatan mengukur tubuh pelanggan, membuat garis lengkung pola, dan memotong kain.' },
    ],
    contohKendala: [
      { masalah: 'Pakaian mengalami kerutan pada bagian lengan akibat ketidaksesuaian ukuran lubang kerung lengan.', solusi: 'Melakukan pengecekan ulang ukuran kerung pola dasar dan menyusun sampel uji kain blacu (kain uji coba).' },
    ],
    studiKasus: {
      judul: 'Membuat Pola Baju Pas Badan & Kerapian Hasil Jahitan',
      latar_belakang:
        'Ukuran sampel pakaian sering tidak pas atau berkerut karena pemotongan bahan kain tidak sesuai garis pola.',
      proses_atau_formula:
        '1. Ukur badan pelanggan dan gambar pola dasar di kertas.\n2. Buat contoh baju uji coba pakai kain murah dulu untuk cek ukuran.\n3. Potong kain utama sesuai pola dengan memberi sisa jahitan 1,5 cm.\n4. Jahit kain pakai mesin jahit industri dan periksa kerapian benang.',
      hasil:
        'Pakaian pas sempurna di badan tanpa kerutan dan sisa kain terbuang berkurang hingga 18%.',
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
    contohKegiatan: [
      {
        bidang: 'Divisi Sekretariat & Administrasi Perkantoran',
        deskripsi_umum: 'Mengelola pengarsipan surat masuk dan keluar, melayani tamu pimpinan, serta menginput agenda kegiatan kantor.',
        tugas: [
          { nama: 'Pengelolaan Surat Masuk & Disposisi', detail: 'Mencatat nomor agenda surat, alih media scan PDF, dan membuat lembar disposisi' },
          { nama: 'Penerimaan Tamu & Layanan Telepon', detail: 'Menerima tamu kantor, memberikan buku tamu, dan mengarahkan ke divisi tujuan' },
          { nama: 'Digitalisasi Kearsipan (e-Office)', detail: 'Mengelompokkan berkas surat fisik ke dalam folder digital berdasarkan Kode Subjek' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Scanner High-Speed, Printer & PC Administrasi', deskripsi: 'Digunakan untuk memindai dokumen fisik menjadi PDF dan mencetak lembar disposisi.' },
      { nama: 'Folder Snelheker, Guide Arsip & Perforator', deskripsi: 'Digunakan untuk melubangi dan merapikan urutan dokumen surat fisik di ordner.' },
    ],
    contohKendala: [
      { masalah: 'Pencarian kembali (retrieval) dokumen fisik surat masuk memakan waktu hingga 15 menit.', solusi: 'Melakukan alih media pencatatan dari buku register manual ke sistem basis data e-Office.' },
    ],
    studiKasus: {
      judul: 'Rapikan Arsip Surat Masuk ke Komputer (Digitalisasi e-Office)',
      latar_belakang:
        'Mencari lembaran surat lama di lemari arsip butuh waktu lama (sampai 15 menit) karena masih dicatat manual di buku agenda.',
      proses_atau_formula:
        '1. Foto/scan surat fisik jadi file PDF di komputer.\n2. Kelompokkan file surat sesuai jenis dan kodenya.\n3. Simpan data surat ke dalam aplikasi e-Office kantor.\n4. Susun surat fisik ke dalam folder map arsip secara rapi.',
      hasil:
        'Mencari surat lama kini sangat cepat (kurang dari 1 menit) tinggal ketik nama surat di komputer.',
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
    contohKegiatan: [
      {
        bidang: 'Divisi Akuntansi & Keuangan Lembaga',
        deskripsi_umum: 'Pencatatan transaksi kas harian, rekonsiliasi kas kecil (petty cash), dan verifikasi kelengkapan bukti pembayaran.',
        tugas: [
          { nama: 'Pencatatan Jurnal Kas Harian', detail: 'Menginput kwitansi dan nota transaksi pengeluaran kantor ke dalam Jurnal Umum' },
          { nama: 'Rekonsiliasi Kas Kecil (Petty Cash)', detail: 'Menghitung s fisik kas kecil dan membandingkan dengan catatan saldo kasir' },
          { nama: 'Verifikasi Invoice & Faktur Pajak', detail: 'Memeriksa keabsahan dan kelengkapan tanda tangan nota tagihan dari supplier' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Kalkulator Finansial, PC & Ms. Excel / Accurate', deskripsi: 'Software dan alat hitung utama untuk mengolah rumus jurnal, neraca, dan posting kas.' },
      { nama: 'Buku Kas, Stempel Lunas & Ordner Faktur', deskripsi: 'Peralatan fisik untuk memberikan pengesahan bukti bayar dan pengarsipan kuitansi.' },
    ],
    contohKendala: [
      { masalah: 'Selisih saldo fisik kas kecil dengan saldo laporan akibat ada nota kecil yang terlambat disetorkan.', solusi: 'Menerapkan aturan batas waktu penyerahan nota klaim maksimal 1x24 jam dari pengeluaran.' },
    ],
    studiKasus: {
      judul: 'Pencatatan Jurnal Kas Harian & Rekonsiliasi Saldo Kas Kecil',
      latar_belakang:
        'Pencatatan transaksi kas harian dan verifikasi kuitansi sering membutuhkan waktu lama jika dilakukan secara manual tanpa rekap otomatis.',
      proses_atau_formula:
        '1. Cek formulir dan kuitansi transaksi pengeluaran harian.\n2. Verifikasi kelengkapan stempel lunas dan tanda tangan bukti transaksi.\n3. Catat uang masuk dan keluar ke Jurnal Kas Harian.\n4. Lakukan rekonsiliasi saldo kas kecil (petty cash) dengan fisik uang.',
      hasil:
        'Pencatatan jurnal kas harian selesai jauh lebih cepat (dari 2 hari menjadi 4 jam) dan saldo kasir cocok 100% balance.',
      data_angka: [
        { label: 'Waktu Pembuatan Jurnal & Rekonsiliasi Kas', sebelum: '2 Hari', sesudah: '4 Jam', nilai: '4 Jam' },
        { label: 'Ketelitian & Akurasi Pencatatan Kas', sebelum: 'Ada Selisih Nota', sesudah: '100% Balance Sesuai Bukti', nilai: 'Balance' },
        { label: 'Waktu Verifikasi Invoice & Kuitansi', sebelum: '1 Hari', sesudah: '2 Jam', nilai: '2 Jam' },
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
    contohKegiatan: [
      {
        bidang: 'Divisi Pemasaran Digital & Merchandising Toko',
        deskripsi_umum: 'Mengelola konten toko online, mendesain materi promosi digital, dan memajang stok barang di rak display.',
        tugas: [
          { nama: 'Pengelolaan Marketplace & Sosmed', detail: 'Mengunggah produk baru ke toko online, merespon chat pembeli, dan mengedit foto' },
          { nama: 'Visual Merchandising Display Rak', detail: 'Menata produk di rak toko sesuai prinsip POP (Point of Purchase) dan grouping' },
          { nama: 'Stock Opname & Cek Kadaluarsa', detail: 'Melakukan penghitungan fisik stok produk dan mencatat produk mendekati ED' },
        ],
      },
    ],
    contohPeralatan: [
      { nama: 'Barcode Scanner, Mesin Kasir POS & Printer Label', deskripsi: 'Digunakan untuk memindai kode barang saat transaksi dan mencetak label harga.' },
      { nama: 'Smartphone Promosi & Studio Mini Foto Produk', deskripsi: 'Peralatan foto produk toko online dan upload konten video promosi di Instagram/TikTok.' },
    ],
    contohKendala: [
      { masalah: 'Tingkat konversi penjualan produk baru di e-commerce masih rendah di minggu pertama.', solusi: 'Membuat konten video ulasan singkat produk (Reels) dan menambahkan voucer diskon promosi.' },
    ],
    studiKasus: {
      judul: 'Konten Promosi Sosmed & Pajangan Produk Menarik di Rak Toko',
      latar_belakang:
        'Produk baru di toko masih sepi pembeli karena belum ada video promosi di sosmed dan pajangan di rak kurang menarik.',
      proses_atau_formula:
        '1. Buat video singkat ulasan produk untuk Instagram Reels / TikTok.\n2. Pasang iklan digital yang mengincar calon pembeli anak muda.\n3. Tata produk di rak toko paling depan dengan lampu yang terang.\n4. Balas chat pertanyaan pembeli dengan ramah dan cepat.',
      hasil:
        'Pembeli harian naik dari 5 orang jadi 35 orang per hari dan hasil penjualan toko meningkat drastis.',
      data_angka: [
        { label: 'Jangkauan Iklan Promosi (Reach)', sebelum: '500 Orang / Hari', sesudah: '1.800 Orang / Hari', nilai: '1.800 Orang' },
        { label: 'Jumlah Pembeli Harian', sebelum: '5 Pembeli', sesudah: '22 Pembeli', nilai: '22 Pembeli' },
        { label: 'Total Omzet Penjualan Bulanan', sebelum: 'Rp 4.500.000', sesudah: 'Rp 7.200.000', nilai: 'Rp 7.200.000' },
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
