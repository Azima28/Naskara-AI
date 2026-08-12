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

export interface StudiKasusExample {
  judul: string
  latar_belakang: string
  proses_atau_formula: string
  hasil: string
  data_angka: DataAngkaExample[]
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
  studiKasus: StudiKasusExample
  studiKasusByJenis?: Record<string, StudiKasusExample>
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Mempercepat Pemuatan Data Laporan pada Aplikasi Web Kasir',
        latar_belakang: 'Halaman rekap laporan transaksi terasa sangat lambat saat dibuka karena data yang dipanggil belum di-indeks.',
        proses_atau_formula: '1. Cek perintah SQL query yang lambat.\n2. Tambahkan indeks pada kolom tanggal transaksi.\n3. Rapikan kodingan pemanggilan tabel database.\n4. Coba buka kembali aplikasi web kasir.',
        hasil: 'Halaman laporan web kini terbuka sangat cepat (dari 4,5 detik menjadi 0,6 detik) dan tidak ada lag lagi.',
        data_angka: [
          { label: 'Waktu Pemuatan Aplikasi (Speed)', sebelum: '4,5 Detik', sesudah: '0,6 Detik', nilai: '0,6 Detik' },
          { label: 'Ukuran Bundle Website', sebelum: '12 MB', sesudah: '3,2 MB', nilai: '3,2 MB' },
          { label: 'Kapasitas Pengunjung Bersamaan', sebelum: '20 User', sesudah: '60 User', nilai: '60 User' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Pengembangan Endpoint REST API POS Kasir',
        latar_belakang: 'Tim pengembang menetapkan target pembuatan endpoint API transaksi dan pengujian unit testing.',
        proses_atau_formula: '1. Rancang skema database transaksi.\n2. Buat controller API checkout dan payment.\n3. Jalankan pengujian unit testing dengan Jest/Postman.',
        hasil: 'Seluruh target endpoint API berhasil diselesaikan tepat waktu dengan coverage testing di atas target.',
        data_angka: [
          { label: 'Pembuatan Endpoint REST API', sebelum: '10 Endpoint (Target)', sesudah: '12 Endpoint (Realisasi)', nilai: '12 Endpoint' },
          { label: 'Coverage Unit Testing Code', sebelum: '80% Code (Target)', sesudah: '92% Code (Realisasi)', nilai: '92% Code' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Standar Coding Style & Dokumentasi API',
        latar_belakang: 'Evaluasi penerapan standar penulisan kodingan (SOP ESLint/Prettier) dan dokumentasi Postman.',
        proses_atau_formula: '1. Jalankan linter ESLint pada seluruh berkas project.\n2. Format ulang kodingan sesuai aturan Clean Code.\n3. Tuliskan dokumentasi API di Postman Collection.',
        hasil: 'Kodingan 100% rapi sesuai standar perusahaan dan siap digunakan oleh tim pengembang frontend.',
        data_angka: [
          { label: 'Standard Code Formatting (ESLint)', sebelum: 'Wajib 100% Lolos Rule', sesudah: '100% Clean Code', nilai: '100% Clean Code' },
          { label: 'Dokumentasi Postman Collection', sebelum: 'Lengkap Per Endpoint', sesudah: 'Terstruktur Per Divisi', nilai: 'Terstruktur' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Memory Leak Server & Database Timeout',
        latar_belakang: 'Server backend sering mengalami crash saat jumlah permintaan bersamaan meningkat.',
        proses_atau_formula: '1. Analisis log error pada server Express.js.\n2. Hapus event listener yang menumpuk di memori.\n3. Atur ulang konfigurasi connection pool MySQL.',
        hasil: 'Server backend berjalan stabil tanpa pernah crash lagi walaupun menerima beban trafik tinggi.',
        data_angka: [
          { label: 'Memory Leak Server Express.js', sebelum: 'Penggunaan RAM > 90%', sesudah: 'Normal (RAM 35%)', nilai: 'RAM 35%' },
          { label: 'Koneksi Pool Database Timeout', sebelum: 'Max Connection Error', sesudah: 'Pool Stabil & Responsif', nilai: 'Stabil' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Bandwidth & Performa Jaringan Wi-Fi Kantor',
        latar_belakang: 'Koneksi internet kantor sering terputus dan lambat di jam kerja sibuk.',
        proses_atau_formula: '1. Cek pemakaian bandwidth per ruangan.\n2. Buat aturan Simple Queue di MikroTik.\n3. Batasi kecepatan download pengguna Wi-Fi tamu.',
        hasil: 'Koneksi internet menjadi sangat stabil dan lancar di seluruh divisi kantor.',
        data_angka: [
          { label: 'Kecepatan Internet Per User', sebelum: '1 Mbps (Lambat)', sesudah: '10 Mbps (Lancar)', nilai: '10 Mbps' },
          { label: 'Packet Loss Jaringan Wi-Fi', sebelum: '15% Packet Loss', sesudah: '0% (Sangat Stabil)', nilai: '0%' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Pemasangan Kabel LAN & Access Point',
        latar_belakang: 'Perusahaan menargetkan peremajaan jaringan kabel LAN dan instalasi Router MikroTik di gedung baru.',
        proses_atau_formula: '1. Tarik kabel UTP dari server room ke tiap meja kerja.\n2. Pasang konektor RJ45 dan tes dengan LAN Tester.\n3. Pasang dan konfigurasi Access Point Wi-Fi.',
        hasil: 'Seluruh titik jaringan berhasil terpasang rapi dan aktif sebelum batas waktu yang ditentukan.',
        data_angka: [
          { label: 'Instalasi Titik Kabel LAN', sebelum: '20 Titik (Target)', sesudah: '24 Titik (Realisasi)', nilai: '24 Titik' },
          { label: 'Konfigurasi Router & Access Point', sebelum: '5 Unit (Target)', sesudah: '5 Unit (Realisasi)', nilai: '5 Unit' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Urutan Kabel Crimping & Labeling Server Rack',
        latar_belakang: 'Pemeriksaan kerapian kabel jaringan sesuai standar internasional T568B.',
        proses_atau_formula: '1. Kupas dan urutkan 8 warna kabel UTP sesuai standar T568B.\n2. Crimp dengan tang crimping hingga kuat.\n3. Beri label nama pada tiap ujung kabel sesuai port switch.',
        hasil: 'Seluruh sambungan kabel 100% lolos uji LAN tester dan teridentifikasi dengan jelas pada rack server.',
        data_angka: [
          { label: 'Standar Urutan Warna Crimping (T568B)', sebelum: 'Standar T568B Wajib 100%', sesudah: '100% Lolos Tester', nilai: '100% Lolos' },
          { label: 'Labeling Kabel Patch Cord Rack', sebelum: 'Tercatat di Dokumen Rack', sesudah: 'Sesuai Kode Port Switch', nilai: 'Sesuai Port' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Masalah IP Conflict & Network Loop',
        latar_belakang: 'Sejumlah komputer tidak bisa terhubung ke printer jaringan karena tabrakan IP Address.',
        proses_atau_formula: '1. Scan seluruh alamat IP aktif di jaringan local.\n2. Ubah pengaturan IP statis komputer bermasalah ke DHCP Server.\n3. Lakukan DHCP Lease Binding pada MikroTik.',
        hasil: 'Seluruh komputer dan printer kini dapat saling terhubung tanpa ada konflik IP lagi.',
        data_angka: [
          { label: 'Masalah IP Conflict Komputer', sebelum: '8 PC Terisolasi', sesudah: 'DHCP Binding Aktif', nilai: 'DHCP Binding' },
          { label: 'Loop Jaringan pada Switch', sebelum: 'Broadcast Storming', sesudah: 'STP Loop Protect On', nilai: 'STP On' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Durasi Rendering & Ukuran File Video Promosi',
        latar_belakang: 'File video promosi berukuran sangat besar sehingga proses ekspor dan upload ke sosmed sangat lama.',
        proses_atau_formula: '1. Atur ulang bitrate ekspor di Adobe Premiere Pro.\n2. Pakai codec H.264 / HEVC yang lebih efisien.\n3. Ekspor ulang video proyek.',
        hasil: 'Durasi rendering jauh lebih cepat dan ukuran file berkurang drastis tanpa menurunkan kualitas.',
        data_angka: [
          { label: 'Waktu Rendering Video 4K', sebelum: '45 Menit', sesudah: '8 Menit', nilai: '8 Menit' },
          { label: 'Ukuran File Video (MP4)', sebelum: '2,5 GB', sesudah: '350 MB (Kualitas Jernih)', nilai: '350 MB' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Desain Feed Instagram & Banner Spanduk',
        latar_belakang: 'Klien menargetkan pembuatan aset visual promosi mingguan untuk campaign produk baru.',
        proses_atau_formula: '1. Buat moodboard dan sketsa konsep visual.\n2. Desain postingan carousel Instagram di Adobe Illustrator.\n3. Cetak spanduk x-banner untuk display promosi toko.',
        hasil: 'Target desain konten mingguan berhasil diselesaikan melebihi kuota target klien.',
        data_angka: [
          { label: 'Desain Feed Instagram (Post)', sebelum: '15 Konten (Target)', sesudah: '18 Konten (Realisasi)', nilai: '18 Konten' },
          { label: 'Desain X-Banner & Spanduk', sebelum: '3 Banner (Target)', sesudah: '4 Banner (Realisasi)', nilai: '4 Banner' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Desain dengan Brand Guideline Klien',
        latar_belakang: 'Pemeriksaan keselarasan warna (CMYK/RGB) dan tipografi sesuai buku panduan brand.',
        proses_atau_formula: '1. Cek kode warna Hex dan CMYK dari buku brand guideline.\n2. Pakai font resmi perusahaan pada setiap desain visual.\n3. Periksa jarak aman (safezone) penempatan logo.',
        hasil: 'Seluruh karya desain 100% sesuai dengan standar indentitas visual perusahaan.',
        data_angka: [
          { label: 'Kesesuaian Warna Kode Hex/CMYK', sebelum: 'Sesuai Palette Brand', sesudah: '100% Akurat Hasil Cetak', nilai: '100% Akurat' },
          { label: 'Penggunaan Font & Logo Safezone', sebelum: 'Aturan Brand Guideline', sesudah: 'Sesuai Standar Klien', nilai: 'Sesuai Standar' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Perubahan Warna Cetak Buram (CMYK vs RGB)',
        latar_belakang: 'Brosur yang dicetak mengalami perubahan warna pucat dibanding tampilan di monitor.',
        proses_atau_formula: '1. Cek profil warna berkas dari RGB ke CMYK.\n2. Sesuaikan tingkat kepekatan tinta di Adobe Photoshop.\n3. Lakukan cetak coba (proof print) sebelum dicetak masal.',
        hasil: 'Hasil cetakan brosur memiliki warna yang cerah dan persis sesuai dengan tampilan layar.',
        data_angka: [
          { label: 'Distorsi Warna Brosur Cetak', sebelum: 'Warna Pucat Beda > 30%', sesudah: 'Konversi CMYK Akurat', nilai: 'CMYK Akurat' },
          { label: 'Penyelesaian Gambar Pecah (DPI)', sebelum: '72 DPI (Pecah)', sesudah: 'Vector / 300 DPI Jernih', nilai: '300 DPI Jernih' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Alokasi Waktu Rencana Perjalanan Wisata (Itinerary)',
        latar_belakang: 'Peserta wisata sering kelelahan karena jadwal kunjungan antar tempat wisata terlalu padat.',
        proses_atau_formula: '1. Evaluasi rute perjalanan dan jam kemacetan jalan.\n2. Kelompokkan objek wisata yang lokasinya berdekatan.\n3. Susun ulang durasi kunjungan di tiap lokasi.',
        hasil: 'Peserta dapat menikmati tempat wisata dengan santai tanpa terburu-buru lagi.',
        data_angka: [
          { label: 'Waktu Terbuang di Kemacetan', sebelum: '3 Jam / Hari', sesudah: '45 Menit / Hari', nilai: '45 Menit' },
          { label: 'Jumlah Destinasi Terkunjungi', sebelum: '3 Tempat (Terburu-buru)', sesudah: '5 Tempat (Sangat Nyaman)', nilai: '5 Tempat' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Penjualan Paket Tour Rombongan',
        latar_belakang: 'Target pemasaran paket tour sekolah dan studi banding perusahaan semester ini.',
        proses_atau_formula: '1. Sebar brosur paket wisata ke sekolah dan kantor.\n2. Presentasi program wisata menarik di hadapan panitia.\n3. Lakukan reservasi armada bus dan penginapan.',
        hasil: 'Target penjualan bus pariwisata tercapai melampaui target yang ditetapkan perusahaan.',
        data_angka: [
          { label: 'Penjualan Paket Tour Rombongan', sebelum: '5 Bus (Target)', sesudah: '7 Bus (Realisasi)', nilai: '7 Bus' },
          { label: 'Kepuasan Peserta Wisata (CSAT)', sebelum: '85% (Target)', sesudah: '96% (Realisasi)', nilai: '96%' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Standar Pelayanan Pemandu Wisata (SOP Tour Guiding)',
        latar_belakang: 'Pemeriksaan kelengkapan dokumen perjalanan dan kenyamanan pemanduan turis.',
        proses_atau_formula: '1. Periksa kelengkapan tiket masuk dan voucher makan.\n2. Lakukan sambutan hangat dan briefing keselamatan di bus.\n3. Dampingi peserta di setiap destinasi wisata.',
        hasil: 'Seluruh rangkaian tur berjalan lancar dan sesuai dengan standar Kementerian Pariwisata.',
        data_angka: [
          { label: 'Checklist Kelengkapan Tiket/Voucher', sebelum: 'Wajib 100% Siap H-1', sesudah: '100% Terverifikasi', nilai: '100% Terverifikasi' },
          { label: 'Penyampaian Briefing Keselamatan', sebelum: 'SOP Pemanduan Wisata', sesudah: 'Sesuai Standar Kemenparekraf', nilai: 'Sesuai SOP' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Keterlambatan Armada Bus & Perubahan Destinasi',
        latar_belakang: 'Bus pariwisata mengalami kendala mogok saat perjalanan menuju lokasi wisata.',
        proses_atau_formula: '1. Hubungi garasi bus untuk mengirim armada pengganti.\n2. Berikan makanan ringan tambahan agar peserta tetap tenang.\n3. Alihkan rute sementara ke destinasi terdekat yang menarik.',
        hasil: 'Peserta wisata tetap merasa puas dan perjalanan dapat dilanjutkan dengan aman.',
        data_angka: [
          { label: 'Penanganan Bus Wisata Mogok', sebelum: 'Potensi Delay 4 Jam', sesudah: 'Bus Pengganti Tiba 30 Mnt', nilai: 'Tiba 30 Mnt' },
          { label: 'Kompensasi Perubahan Destinasi', sebelum: 'Keluhan Peserta Tinggi', sesudah: 'Voucher Kuliner & Tiket Bonus', nilai: 'Tiket Bonus' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Durasi Pembersihan Kamar Hotel (Housekeeping)',
        latar_belakang: 'Tamu hotel sering menunggu lama saat check-in karena kamar belum selesai dibersihkan.',
        proses_atau_formula: '1. Rapikan alur kerja penataan perlengkapan kebersihan di trolley.\n2. Terapkan metode pembersihan kamar dari area atas ke bawah.\n3. Periksa kembali kebersihan kamar mandi dengan checklist cepat.',
        hasil: 'Kamar hotel siap digunakan lebih cepat dan tamu dapat langsung masuk tanpa menunggu lama.',
        data_angka: [
          { label: 'Waktu Cleaning 1 Kamar Deluxe', sebelum: '45 Menit', sesudah: '20 Menit', nilai: '20 Menit' },
          { label: 'Ketersediaan Kamar Ready Check-in', sebelum: '60% Tepat Waktu', sesudah: '98% Ready Tepat Waktu', nilai: '98% Ready' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Tingkat Okupansi Kamar & Penjualan F&B',
        latar_belakang: 'Pencapaian target tingkat hunian kamar hotel pada musim liburan (peak season).',
        proses_atau_formula: '1. Tawarkan paket kamar promo termasuk sarapan pagi.\n2. Tingkatkan kecepatan pelayanan saat proses check-in tamu.\n3. Berikan rekomendasi menu restoran hotel kepada tamu.',
        hasil: 'Tingkat hunian kamar hotel mencapai target tertinggi dalam semester ini.',
        data_angka: [
          { label: 'Tingkat Okupansi Kamar Hotel', sebelum: '75% (Target)', sesudah: '88% (Realisasi)', nilai: '88%' },
          { label: 'Review Positif Tamu (Online Rating)', sebelum: '4.5 / 5.0 (Target)', sesudah: '4.8 / 5.0 (Realisasi)', nilai: '4.8 / 5.0' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Standar Penataan Tempat Tidur (Bed Making SOP)',
        latar_belakang: 'Pemeriksaan kerapian seprai (sheet), pillow case, dan duvet cover sesuai standar hotel bintang 4.',
        proses_atau_formula: '1. Pasang bed sheet dengan lipatan sudut 45 derajat yang rapi.\n2. Masukkan duvet ke dalam cover tanpa ada yang menggumpal.\n3. Susun bantal dengan posisi tegak dan simetris.',
        hasil: 'Penataan kamar tidur tampak sangat rapi dan memenuhi standar pemeriksaan supervisor.',
        data_angka: [
          { label: 'Kerapian Lipatan Sudut Bed (45°)', sebelum: 'Standar Bintang 4 Wajib', sesudah: '100% Rapi Tanpa Kerutan', nilai: '100% Rapi' },
          { label: 'Sanitasi & Kerapian Kamar Mandi', sebelum: 'Checklist SOP Kerapian', sesudah: 'Sesuai Standar Hygiene', nilai: 'Sesuai Standar' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan AC Kamar Bocor & Penanganan Keluhan Tamu',
        latar_belakang: 'Tamu kamar 304 melaporkan pendingin ruangan (AC) meneteskan air pada malam hari.',
        proses_atau_formula: '1. Sampaikan permohonan maaf dan kirim petugas teknisi dalam 5 menit.\n2. Bersihkan saluran pembuangan air AC yang tersumbat.\n3. Tawarkan pindah kamar atau berikan sarapan gratis sebagai kompensasi.',
        hasil: 'Keluhan tamu tertangani dengan sangat baik dan tamu memberikan ulasan yang memuaskan.',
        data_angka: [
          { label: 'Respon Waktu Penanganan Komplain', sebelum: 'Lebih dari 30 Menit', sesudah: 'Teknisi Tiba dalam 5 Menit', nilai: 'Tiba 5 Mnt' },
          { label: 'Penyelesaian Masalah Tamu', sebelum: 'Tamu Minta Move Kamar', sesudah: 'Upgraded ke Executive Suite', nilai: 'Upgraded Suite' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Waktu Penyajian Makanan (Kitchen Cooking Speed)',
        latar_belakang: 'Pelanggan restoran mengeluh karena makanan pesanan keluar terlalu lama dari dapur.',
        proses_atau_formula: '1. Siapkan potongan bahan makanan (mise en place) sebelum jam buka restoran.\n2. Atur tata letak alat masak agar mudah dijangkau juru masak.\n3. Bagi tugas memasak berdasarkan spesialisasi menu.',
        hasil: 'Makanan dapat disajikan hangat ke meja pelanggan jauh lebih cepat.',
        data_angka: [
          { label: 'Waktu Memasak Main Course', sebelum: '25 Menit', sesudah: '10 Menit', nilai: '10 Menit' },
          { label: 'Tingkat Sisa Bahan Makanan (Food Waste)', sebelum: '18%', sesudah: '4%', nilai: '4%' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Porsi Catering & Prasmanan Acara',
        latar_belakang: 'Target pembuatan dan penyajian porsi catering acara pernikahan 500 undangan.',
        proses_atau_formula: '1. Hitung kebutuhan bahan baku masakan secara akurat.\n2. Lakukan proses memasak sekala besar secara bertahap.\n3. Kemas masakan ke dalam pemanas prasmanan dengan rapi.',
        hasil: 'Seluruh porsi masakan tersaji tepat waktu dengan cita rasa yang lezat.',
        data_angka: [
          { label: 'Jumlah Porsi Catering Siap Saji', sebelum: '500 Porsi (Target)', sesudah: '530 Porsi (Realisasi)', nilai: '530 Porsi' },
          { label: 'Ketepatan Waktu Delivery Food', sebelum: 'Jam 10.00 (Target)', sesudah: 'Jam 09.30 (Realisasi)', nilai: 'Jam 09.30' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Standar Resep & Hygiene Sanitasi Dapur',
        latar_belakang: 'Pemeriksaan takaran bumbu resep baku dan kebersihan peralatan masak.',
        proses_atau_formula: '1. Timbang setiap bumbu masakan sesuai timbangan resep standar.\n2. Pakai celemek, penutup kepala, dan sarung tangan saat mengolah makanan.\n3. Cuci peralatan masak dengan air panas dan sabun sanitasi.',
        hasil: 'Rasa masakan selalu konsisten dan dapur lolos pemeriksaan kebersihan hygiene.',
        data_angka: [
          { label: 'Penimbangan Gramasi Bumbu Resep', sebelum: 'Akurat Sesuai Standar', sesudah: '100% Konsistensi Rasa', nilai: '100% Konsisten' },
          { label: 'APD & Hygiene Juru Masak', sebelum: 'Masker, Celemek, Sarung Tangan', sesudah: '100% Lolos Audit Hygiene', nilai: '100% Lolos' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Stok Bahan Baku Utama Habis di Dapur',
        latar_belakang: 'Bahan daging ayam segar mendadak habis saat restoran ramai di akhir pekan.',
        proses_atau_formula: '1. Lakukan pemesanan darurat ke pemasok langganan terdekat.\n2. Tawarkan menu masakan alternatif berbahan dasar ikan/sapi kepada pelanggan.\n3. Perbaiki sistem pencatatan stok bahan di dapur.',
        hasil: 'Pesanan pelanggan tetap terpenuhi tanpa ada kekecewaan.',
        data_angka: [
          { label: 'Stok Out Bahan Daging Ayam', sebelum: 'Pesanan Tertunda 1 Jam', sesudah: 'Emergency Order 15 Menit', nilai: 'Order 15 Mnt' },
          { label: 'Penyesuaian Suhu Storage Freezer', sebelum: 'Suhu Naik (Daging Mencair)', sesudah: 'Reset Thermostat Ke -18°C', nilai: '-18°C' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Efisiensi Pemotongan Kain (Pattern Layout Optimization)',
        latar_belakang: 'Banyak sisa perca kain terbuang saat proses pemotongan pola baju pesanan.',
        proses_atau_formula: '1. Susun ulang tata letak pola pakaian di atas kain sampel.\n2. Manfaatkan sisa sela kain untuk membuat pola saku dan kerah.\n3. Potong kain menggunakan mesin pemotong kain presisi.',
        hasil: 'Penggunaan bahan kain menjadi sangat hemat dan sisa kain sisa berkurang drastis.',
        data_angka: [
          { label: 'Efisiensi Penggunaan Kain', sebelum: '65% (Banyak Sisa)', sesudah: '90% (Sangat Hemat)', nilai: '90%' },
          { label: 'Waktu Menjahit 1 Kemeja', sebelum: '4 Jam', sesudah: '1,5 Jam', nilai: '1,5 Jam' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Produksi Seragam Batik Sekolah',
        latar_belakang: 'Target pemenuhan order seragam batik sekolah sebanyak 100 stel baju.',
        proses_atau_formula: '1. Buat pola standar ukuran S, M, L, dan XL.\n2. Lakukan penjahitan masal dengan sistem pembagian kerja.\n3. Lakukan pemeriksaan kerapian jahitan dan penyetrikaan.',
        hasil: 'Seluruh seragam selesai dibuat tepat waktu dengan kualitas jahitan yang rapi.',
        data_angka: [
          { label: 'Produksi Stel Seragam Jadi', sebelum: '100 Stel (Target)', sesudah: '105 Stel (Realisasi)', nilai: '105 Stel' },
          { label: 'Kesesuaian Ukuran S/M/L/XL', sebelum: '95% (Target)', sesudah: '100% (Realisasi)', nilai: '100%' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Ukuran Pola & Kerapian Jahitan Sub-Part',
        latar_belakang: 'Pemeriksaan kerapian setikan jahit (SPI) dan presisi kerah baju.',
        proses_atau_formula: '1. Atur kerapatan setikan benang mesin jahit ke 12 setikan per inci.\n2. Pasang kain keras pada kerah baju agar berdiri tegak.\n3. Ukur simetri bagian kiri dan kanan kemeja.',
        hasil: 'Pakaian jadi memiliki potongan yang sangat presisi dan nyaman dipakai.',
        data_angka: [
          { label: 'Kerapian Kepadatan Jahitan (SPI)', sebelum: '12 Setikan Per Inci SOP', sesudah: '100% Rapi & Kuat', nilai: '100% Rapi' },
          { label: 'Presisi Simetri Kerah Baju', sebelum: 'Toleransi Kesalahan < 1mm', sesudah: 'Sesuai Standar Quality Control', nilai: 'Sesuai QC' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Jahitan Kerut & Jarum Mesin Jahit Patah',
        latar_belakang: 'Mesin jahit high-speed menghasilkan jahitan berkerut pada kain bahan sutra/sifon.',
        proses_atau_formula: '1. Kendurkan tegangan benang atas pada mesin jahit.\n2. Ganti jarum mesin jahit dengan nomor lebih kecil (ukuran 9).\n3. Coba jahit pada kain sampel hingga hasil jahitan mulus.',
        hasil: 'Kain tipis dapat dijahit dengan sangat halus tanpa ada kerutan lagi.',
        data_angka: [
          { label: 'Masalah Jahitan Kain Berkerut', sebelum: 'Kain Rusak & Berkerut', sesudah: 'Setel Tension Benang Rapi', nilai: 'Tension Rapi' },
          { label: 'Jarum Mesin Jahit Sering Patah', sebelum: 'Ganti Jarum 4x / Hari', sesudah: 'Pakai Jarum No. 9 Mulus', nilai: 'Jarum No. 9' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Waktu Pencarian Berkas Arsip Surat (Sistem Kearsipan)',
        latar_belakang: 'Petugas kesulitan menemukan dokumen berkas lama karena arsip belum ditata sistematis.',
        proses_atau_formula: '1. Sortir surat berdasarkan tanggal dan kode klasifikasi masalah.\n2. Masukkan berkas ke dalam folder ordner yang diberi label jelas.\n3. Pindai surat ke format digital PDF dan simpan di Google Drive.',
        hasil: 'Pencarian dokumen surat kini dapat dilakukan hanya dalam hitungan detik.',
        data_angka: [
          { label: 'Waktu Pencarian 1 Berkas Surat', sebelum: '25 Menit', sesudah: '1 Menit', nilai: '1 Menit' },
          { label: 'Digitalisasi Arsip Dokumen', sebelum: '20% Tergandakan', sesudah: '100% Ter-scan & Ter-indeks', nilai: '100% Ter-scan' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Pengelolaan Surat Masuk & Keluar',
        latar_belakang: 'Target pencatatan lembar disposisi dan pengagendaan surat dinas bulan ini.',
        proses_atau_formula: '1. Catat nomor dan perihal surat masuk di buku agenda.\n2. Buat lembar disposisi untuk diserahkan ke pimpinan.\n3. Ketik dan kirim surat balasan dinas resmi.',
        hasil: 'Seluruh administrasi surat dinas tercatat dengan sangat rapi tanpa ada yang tertunda.',
        data_angka: [
          { label: 'Pencatatan Agenda Surat Masuk', sebelum: '150 Surat (Target)', sesudah: '165 Surat (Realisasi)', nilai: '165 Surat' },
          { label: 'Pengiriman Surat Balasan Dinas', sebelum: '100% H+1 (Target)', sesudah: '100% Tepat Waktu', nilai: '100% Tepat Waktu' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Format Surat Resmi (SOP Tata Naskah Dinas)',
        latar_belakang: 'Pemeriksaan kesesuaian nomor surat, kop naskah, dan kelengkapan stempel.',
        proses_atau_formula: '1. Gunakan templat kop surat resmi perusahaan.\n2. Periksa nomor surat, tanggal, dan alamat tujuan surat.\n3. Minta tanda tangan pimpinan dan cap stempel basah.',
        hasil: 'Surat dinas yang diterbitkan 100% sesuai dengan tata naskah dinas resmi.',
        data_angka: [
          { label: 'Kesesuaian Format Kop & Margin', sebelum: 'Wajib Standar Naskah Dinas', sesudah: '100% Sesuai SOP Surat', nilai: '100% Sesuai' },
          { label: 'Kelengkapan Lampiran & Tanda Tangan', sebelum: 'Verifikasi Sekretaris', sesudah: 'Rapi & Terstruktur', nilai: 'Terstruktur' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Berkas Arsip Hilang / Salah Selip Folder',
        latar_belakang: 'Dokumen kontrak kerja penting tidak ditemukan di ordner tempat penyimpanan biasa.',
        proses_atau_formula: '1. Periksa buku peminjaman arsip kantor.\n2. Cari folder terkait menggunakan kartu tunjuk silang.\n3. Kumpulkan dokumen dan kembalikan ke ordner yang benar.',
        hasil: 'Berkas kontrak berhasil ditemukan kembali dan sistem kearsipan dirapikan.',
        data_angka: [
          { label: 'Pencarian Berkas Salah Selip', sebelum: 'Dokumen Hilang 2 Hari', sesudah: 'Ketemu via Kartu Tunjuk Silang', nilai: 'Ditemukan' },
          { label: 'Penataan Ulang Kategori Arsip', sebelum: 'Arsip Menumpuk Acak', sesudah: 'Sesuai Kode Sub-sub Masalah', nilai: 'Rapi Sub-kode' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Waktu Penyusunan Laporan Rekonsiliasi Bank',
        latar_belakang: 'Proses pencocokan saldo kas perusahaan dan rekening koran bank dilakukan manual dan memakan waktu.',
        proses_atau_formula: '1. Unduh mutasi rekening koran dari internet banking.\n2. Gunakan rumus VLOOKUP / IF di Microsoft Excel untuk mencocokkan transaksi.\n3. Susun laporan rekonsiliasi kas dan buat jurnal penyesuaian.',
        hasil: 'Proses rekonsiliasi bank dapat diselesaikan jauh lebih cepat dengan akurasi tinggi.',
        data_angka: [
          { label: 'Waktu Penyusunan Rekonsiliasi Bank', sebelum: '3 Hari', sesudah: '2 Jam (Otomatis Excel)', nilai: '2 Jam' },
          { label: 'Tingkat Akurasi Input Jurnal', sebelum: '92%', sesudah: '100% Balance & Akurat', nilai: '100% Balance' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Verifikasi Bukti Transaksi Kas Kecil',
        latar_belakang: 'Target pemeriksaan dan pencatatan kwitansi kas kecil (petty cash) bulanan.',
        proses_atau_formula: '1. Kumpulkan seluruh nota dan kwitansi pengeluaran kas kecil.\n2. Verifikasi keabsahan tanda tangan dan nilai nominal transaksi.\n3. Catat transaksi ke dalam sistem aplikasi akuntansi.',
        hasil: 'Pembukuan kas kecil selesai tepat waktu dan saldo tunai selalu sesuai.',
        data_angka: [
          { label: 'Verifikasi Kwitansi Transaksi', sebelum: '200 Nota (Target)', sesudah: '215 Nota (Realisasi)', nilai: '215 Nota' },
          { label: 'Penyusunan Jurnal Penyesuaian', sebelum: '100% Tepat Waktu (Target)', sesudah: '100% Selesai H-2 Closing', nilai: 'H-2 Closing' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Pembukuan dengan Standar Akuntansi (PSAK)',
        latar_belakang: 'Evaluasi penerapan pencatatan debet-kredit dan bukti fisik transaksi sesuai PSAK.',
        proses_atau_formula: '1. Periksa setiap jurnal agar nilai debet dan kredit selalu seimbang.\n2. Lampirkan bukti kas masuk atau kas keluar pada tiap lembar voucher.\n3. Arsipkan laporan keuangan bulanan secara rapi.',
        hasil: 'Laporan keuangan perusahaan 100% memenuhi standar akuntansi keuangan yang berlaku.',
        data_angka: [
          { label: 'Pencatatan Berpasangan (Double Entry)', sebelum: 'Balance Debet Kredit', sesudah: '100% Sesuai PSAK', nilai: '100% Sesuai' },
          { label: 'Kelengkapan Bukti Kas Masuk/Keluar', sebelum: 'Kwitansi, Stempel & TTD', sesudah: 'Sesuai Standar Audit', nilai: 'Sesuai Audit' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Selisih Kas Kecil (Petty Cash Discrepancy)',
        latar_belakang: 'Terjadi perbedaan antara saldo fisik uang tunai kas kecil dengan catatan di buku kas.',
        proses_atau_formula: '1. Hitung ulang seluruh fisik uang tunai di kasir kas kecil.\n2. Lacak kembali nota transaksi kecil yang belum ter-input.\n3. Buat jurnal koreksi untuk menyesuaikan saldo kas.',
        hasil: 'Penyebab selisih ditemukan dan saldo catatan kembali cocok dengan uang fisik.',
        data_angka: [
          { label: 'Selisih Saldo Kas Kecil', sebelum: 'Kurang Rp 150.000', sesudah: 'Ketemu Nota Parkir Tercecer', nilai: 'Ditemukan Nota' },
          { label: 'Koreksi Jurnal Salah Catat', sebelum: 'Error Akun Beban', sesudah: 'Jurnal Koreksi Reversal Rapi', nilai: 'Reversal Rapi' },
        ],
      },
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
    studiKasusByJenis: {
      optimasi: {
        judul: 'Optimasi Jangkauan Promosi & Omzet Toko Online (Marketplace)',
        latar_belakang: 'Jumlah pengunjung dan penjualan toko online di Shopee/Tokopedia stagnan.',
        proses_atau_formula: '1. Perbaiki judul dan kata kunci pencarian produk (SEO Toko).\n2. Pasang iklan kata kunci produk di Shopee Ads.\n3. Buat foto produk yang menarik dengan latar belakang bersih.',
        hasil: 'Pengunjung toko melonjak drastis dan jumlah pembeli harian meningkat pesat.',
        data_angka: [
          { label: 'Pengunjung Toko Per Hari (Traffic)', sebelum: '120 Orang', sesudah: '1.500 Orang', nilai: '1.500 Orang' },
          { label: 'Jumlah Pesanan Harian (Closing)', sebelum: '5 Transaksi', sesudah: '45 Transaksi', nilai: '45 Transaksi' },
        ],
      },
      pencapaian: {
        judul: 'Pencapaian Target Omzet Penjualan & Live Streaming Product',
        latar_belakang: 'Target omzet bulanan dan penonton live streaming jualan produk.',
        proses_atau_formula: '1. Siapkan jadwal live streaming jualan di TikTok / Shopee Live.\n2. Berikan voucher diskon khusus bagi penonton live.\n3. Balas pertanyaan calon pembeli di kolom komentar secara interaktif.',
        hasil: 'Target pencapaian penjualan bulanan berhasil ditembus melampaui ekspektasi.',
        data_angka: [
          { label: 'Target Omzet Penjualan Bulanan', sebelum: 'Rp 15 Juta (Target)', sesudah: 'Rp 18.5 Juta (Realisasi)', nilai: 'Rp 18.5 Juta' },
          { label: 'Penonton Live Shopping TikTok', sebelum: '500 Penonton (Target)', sesudah: '1.200 Penonton (Realisasi)', nilai: '1.200 Penonton' },
        ],
      },
      kesesuaian: {
        judul: 'Kesesuaian Standar Packing Pengiriman & Pelayanan Pelanggan',
        latar_belakang: 'Pemeriksaan kerapian pembungkusan bubble wrap dan waktu balasan chat pelanggan.',
        proses_atau_formula: '1. Balas pesan chat pembeli kurang dari 3 menit.\n2. Bungkus barang pesanan dengan bubble wrap 3 lapis yang tebal.\n3. Tempelkan stiker fragile dan resi pengiriman dengan jelas.',
        hasil: 'Pelanggan memberikan rating bintang 5 dan pujian atas kecepatan pelayanan.',
        data_angka: [
          { label: 'Waktu Balas Chat Customer (SOP)', sebelum: 'Kurang dari 5 Menit', sesudah: '100% Memenuhi SOP', nilai: '100% Memenuhi' },
          { label: 'Keamanan Packing Bubble Wrap', sebelum: 'Bebas Rusak Pengiriman', sesudah: '0% Komplain Pecah', nilai: '0% Komplain' },
        ],
      },
      troubleshooting: {
        judul: 'Penanganan Komplain Retur Barang & Ulasan Bintang 1',
        latar_belakang: 'Pembeli memberikan rating buruk karena barang yang dikirim salah warna.',
        proses_atau_formula: '1. Segera hubungi pembeli dan minta maaf atas kekeliruan kirim.\n2. Kirimkan barang pengganti yang benar tanpa membebani ongkir pembeli.\n3. Minta pembeli untuk mengubah ulasan setelah barang pengganti diterima.',
        hasil: 'Pembeli merasa puas dengan respon cepat dan mengubah rating menjadi bintang 5.',
        data_angka: [
          { label: 'Ulasan Bintang 1 Produk', sebelum: '3 Ulasan Negatif', sesudah: 'Ganti Produk & Rating Jadi 5', nilai: 'Rating 5' },
          { label: 'Penanganan Resi Pengiriman Gantung', sebelum: 'Resi Gantung H+2', sesudah: 'Koordinasi Kurir & Chat Update', nilai: 'Update Chat' },
        ],
      },
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

export function getJurusanExample(jurusanKey?: string, jenisTabel?: string): JurusanExample {
  let base = JURUSAN_EXAMPLES['mplb']
  if (jurusanKey) {
    const key = jurusanKey.toLowerCase().trim()
    const detectedKey = detectJurusanKey(key)
    base = JURUSAN_EXAMPLES[key] || JURUSAN_EXAMPLES[detectedKey] || JURUSAN_EXAMPLES['mplb']
  }
  if (jenisTabel && base.studiKasusByJenis && base.studiKasusByJenis[jenisTabel]) {
    return {
      ...base,
      studiKasus: base.studiKasusByJenis[jenisTabel],
    }
  }
  return base
}
