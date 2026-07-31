export interface DataAngkaExample {
  label: string
  nilai: string
}

export interface JurusanExample {
  jurusan_key: string
  label: string
  icon: string
  badge: string
  contohPelajaran: string[]
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
    icon: 'code',
    badge: 'Perangkat Lunak & IT',
    contohPelajaran: [
      'Memahami pembuatan dan pengujian REST API',
      'Mengoptimalkan performa query database',
      'Bekerja secara kolaboratif dalam tim pengembang software',
    ],
    studiKasus: {
      judul: 'Optimasi Speed & Performance Query Database pada Rekapitulasi Laporan Bulanan',
      latar_belakang:
        'Fitur rekapitulasi laporan bulanan mengalami kendala pemuatan lambat (timeout) saat memuat puluhan ribu baris data transaksi karena belum ada penciptaan indeks pada tabel database.',
      proses_atau_formula:
        '1. Melakukan profiling query menggunakan EXPLAIN ANALYZE.\n2. Menambahkan composite index pada kolom created_at dan status_id.\n3. Mengubah struktur subquery JOIN menjadi INNER JOIN ber-indeks.\n4. Melakukan testing beban dengan k6 / Apache JMeter.',
      hasil:
        'Waktu pemuatan halaman rekapitulasi berkurang drastis dari 3,8 detik menjadi 0,2 detik, dan penggunaan memori server berkurang hingga 65%.',
      data_angka: [
        { label: 'Waktu Pemuatan Aplikasi (Sebelum)', nilai: '3,8 Detik / 15 Menit' },
        { label: 'Waktu Pemuatan Aplikasi (Setelah)', nilai: '0,2 Detik / 2 Menit' },
        { label: 'Ukuran File / Memori Server', nilai: '8 MB (Hemat 65%)' },
        { label: 'Jumlah Data Terproses', nilai: '50.000 Record' },
      ],
    },
  },

  tkj: {
    jurusan_key: 'tkj',
    label: 'Teknik Komputer & Jaringan (TKJ)',
    icon: 'globe',
    badge: 'Jaringan & Server',
    contohPelajaran: [
      'Melakukan crimping kabel UTP dan testing koneksi jaringan LAN',
      'Mengonfigurasi IP Address, Router MikroTik, dan VLAN',
      'Melakukan instalasi dan troubleshooting perangkat komputer/jaringan',
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
        { label: 'Waktu Setting Router & VLAN (Durasi)', nilai: '2 Jam / 1 Hari' },
        { label: 'Kecepatan Internet (Setelah Limiting)', nilai: '100 Mbps (Stabil)' },
        { label: 'Latency Rata-Rata Koneksi', nilai: '12 ms' },
        { label: 'Jumlah Komputer / User Terhubung', nilai: '45 Unit' },
      ],
    },
  },

  dkv: {
    jurusan_key: 'dkv',
    label: 'Desain Komunikasi Visual (DKV)',
    icon: 'palette',
    badge: 'Desain & Media',
    contohPelajaran: [
      'Mengoperasikan software desain grafis (Adobe Illustrator / Photoshop)',
      'Memahami hierarki tipografi dan komposisi tata letak media cetak/digital',
      'Membuat aset visual dan motion graphic untuk kebutuhan promosi',
    ],
    studiKasus: {
      judul: 'Perancangan Branding Visual & Optimasi Asset Rendering Motion Graphic',
      latar_belakang:
        'Waktu rendering video promosi resolusi 4K sering mengalami kegagalan karena ukuran aset grafis bitmap terlalu besar dan belum teroptimasi.',
      proses_atau_formula:
        '1. Mengubah aset gambar dari raster bitmap menjadi format vektor (SVG/AI).\n2. Pengaturan hierarki tipografi dan palet warna CMYK sesuai Brand Guidelines.\n3. Pengaturan Media Encoder H.264 profil target bit-rate 15 Mbps.\n4. Render final video iklan 60 FPS.',
      hasil:
        'Waktu komputasi render berkurang dari 45 menit menjadi 12 menit tanpa penurunan kualitas visual.',
      data_angka: [
        { label: 'Waktu Render Video (Sebelum Optimasi)', nilai: '45 Menit' },
        { label: 'Waktu Render Video (Setelah Optimasi)', nilai: '12 Menit' },
        { label: 'Ukuran File Video Final', nilai: '150 MB' },
        { label: 'Durasi Video Iklan', nilai: '60 Detik / 1 Menit' },
      ],
    },
  },

  upw: {
    jurusan_key: 'upw',
    label: 'Usaha Perjalanan Wisata (UPW)',
    icon: 'compass',
    badge: 'Pariwisata & Tour',
    contohPelajaran: [
      'Menyusun paket itinerary dan perhitungan estimasi biaya tur (costing)',
      'Melakukan komunikasi dan reservasi dengan vendor armada & hotel',
      'Memberikan pelayanan panduan wisata (guiding) secara profesional',
    ],
    studiKasus: {
      judul: 'Penyusunan Paket Itinerary Tour Bandung-Lembang & Optimasi Travel Costing',
      latar_belakang:
        'Pembuatan paket tur wisata rombongan instansi sering mengalami estimasi biaya membengkak karena kurang presisinya perhitungan komponen transport, tiket masuk, dan catering.',
      proses_atau_formula:
        '1. Analisis rute perjalanan dan estimasi waktu tempuh (Time Table).\n2. Negosiasi kontrak rate dengan vendor armada bus dan restoran mitra.\n3. Perhitungan komponen Variable Cost dan Fixed Cost per pax.\n4. Simulasi Margin Keuntungan 15% pada harga jual paket tour.',
      hasil:
        'Paket wisata 3D2N berhasil disusun dengan efisiensi harga 12% dibanding kompetitor dan kepuasan peserta tour mencapai 98%.',
      data_angka: [
        { label: 'Durasi Paket Perjalanan Tur', nilai: '3 Hari 2 Malam' },
        { label: 'Efisiensi Biaya Paket Wisata', nilai: '12%' },
        { label: 'Total Peserta Rombongan Tur', nilai: '120 Pax / Orang' },
        { label: 'Indeks Kepuasan Pelanggan', nilai: '98%' },
      ],
    },
  },

  ph: {
    jurusan_key: 'ph',
    label: 'Perhotelan (PH)',
    icon: 'bed',
    badge: 'Hospitality & Hotel',
    contohPelajaran: [
      'Melakukan standar pembersihan dan inspeksi kamar (housekeeping)',
      'Melakukan prosedur check-in dan check-out tamu hotel di Front Desk',
      'Menjaga etika keramahan (hospitality) dan komunikasi profesional',
    ],
    studiKasus: {
      judul: 'Standardisasi Housekeeping Room Inspection & Optimasi Guest Check-In Speed',
      latar_belakang:
        'Tingginya antrean check-in guest pada jam sibuk (peak hour) akibat keterlambatan kesiapan kamar (room status ready) dari tim Housekeeping.',
      proses_atau_formula:
        '1. Penerapan Check-list digital Room Inspection 21 Poin via Property Management System (PMS).\n2. Pembagian zonasi penyiapan linenn dan amenities per lantai.\n3. Pelatihan koordinasi real-time antara Front Desk dan Floor Supervisor.\n4. Audit waktu rata-rata pembersihan kamar Deluxe Room.',
      hasil:
        'Waktu pembersihan dan inspeksi kamar turun dari 35 menit menjadi 20 menit, sehingga antrean check-in terurai 50% lebih cepat.',
      data_angka: [
        { label: 'Waktu Cleaning Per Kamar', nilai: '20 Menit' },
        { label: 'Waktu Proses Check-In Tamu', nilai: '2,5 Menit / Guest' },
        { label: 'Durasi Kesiapan Kamar VIP', nilai: '1 Jam' },
        { label: 'Tingkat Okupansi Akhir Pekan', nilai: '92%' },
      ],
    },
  },

  tb: {
    jurusan_key: 'tb',
    label: 'Tata Boga (Tabog / Kuliner)',
    icon: 'utensils',
    badge: 'Kuliner & Banquet',
    contohPelajaran: [
      'Melakukan persiapan bahan makanan (Mise en Place) dengan presisi',
      'Menerapkan standar higienitas dan sanitasi keselamatan kerja dapur (HACCP)',
      'Mengolah dan menyajikan hidangan sesuai standar resep restoran/hotel',
    ],
    studiKasus: {
      judul: 'Standardisasi Mise en Place & Efisiensi Food Cost Menu Banquet Event',
      latar_belakang:
        'Tingginya persentase sisa bahan baku makanan (food waste) pada pengolahan menu buffet banquet menyebabkan Food Cost melebihi standar target 30%.',
      proses_atau_formula:
        '1. Penerapan metode FIFO (First In First Out) pada penyimpanan chiller.\n2. Penimbangan porsi bahan (portion control) presisi saat Mise en Place.\n3. Perhitungan standar resep dan yield percentage bahan baku.\n4. Audit ketaatan prosedur higienitas sanitasi HACCP.',
      hasil:
        'Persentase Food Cost berhasil ditekan dari 38% menjadi 29,5%, sesuai standar efisiensi operasional hotel dan restoran.',
      data_angka: [
        { label: 'Waktu Persiapan Bahan (Mise en Place)', nilai: '45 Menit / 1 Jam' },
        { label: 'Persentase Food Cost (Sebelum)', nilai: '38%' },
        { label: 'Persentase Food Cost (Setelah)', nilai: '29,5%' },
        { label: 'Daya Tahan Bahan Chiller', nilai: '3 Hari' },
      ],
    },
  },

  busana: {
    jurusan_key: 'busana',
    label: 'Tata Busana (Tabus / Fashion)',
    icon: 'scissors',
    badge: 'Fashion & Custom Making',
    contohPelajaran: [
      'Membaca dan merancang pola dasar busana (draping & flat pattern)',
      'Mengoperasikan mesin jahit industri dengan setikan presisi',
      'Melakukan pemotongan bahan (cutting) dan pengawasan kualitas jahitan',
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
        { label: 'Waktu Penyelesaian Pola Busana', nilai: '60 Menit / 2 Jam' },
        { label: 'Toleransi Presisi Ukuran Pola', nilai: '±0,2 cm' },
        { label: 'Kerapatan Setikan Jahitan', nilai: '9 Stik / Inci' },
        { label: 'Penghematan Sisa Bahan Kain', nilai: '18%' },
      ],
    },
  },

  mplb: {
    jurusan_key: 'mplb',
    label: 'Manajemen Perkantoran & Layanan Bisnis (MPLB)',
    icon: 'folder',
    badge: 'Administrasi & Perkantoran',
    contohPelajaran: [
      'Mengelola arsip fisik dan digitalisasi dokumen kantor',
      'Melakukan penanganan surat masuk, surat keluar, dan disposisi',
      'Melayani komunikasi telepon dan penerimaan tamu kantor secara ramah',
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
        { label: 'Waktu Temu Kembali Surat (Sebelum)', nilai: '15 Menit / 2 Jam' },
        { label: 'Waktu Temu Kembali Surat (Setelah)', nilai: '45 Detik / 1 Menit' },
        { label: 'Lama Proses Disposisi Surat', nilai: '1 Hari' },
        { label: 'Jumlah Dokumen Terindeks', nilai: '250 Berkas' },
      ],
    },
  },

  akl: {
    jurusan_key: 'akl',
    label: 'Akuntansi & Keuangan Lembaga (AKL)',
    icon: 'chart',
    badge: 'Akuntansi & Keuangan',
    contohPelajaran: [
      'Menginput dan merapikan catatan transaksi keuangan ke jurnal umum',
      'Melakukan penghitungan dan rekonsiliasi kas/bank',
      'Menyusun draf laporan keuangan sederhana dan verifikasi kuitansi',
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
        { label: 'Total Denda Awal Kredit', nilai: 'Rp 4.596.800' },
        { label: 'Hasil Negosiasi Diskon (Waive)', nilai: '37,99%' },
        { label: 'Lama Proses Rekonsiliasi Bank', nilai: '3 Jam / 2 Hari' },
        { label: 'Sisa Pokok Hutang Debitur', nilai: 'Rp 16.448.301' },
      ],
    },
  },

  bdp: {
    jurusan_key: 'bdp',
    label: 'Bisnis Daring & Pemasaran (BDP)',
    icon: 'shopping-bag',
    badge: 'Pemasaran & Bisnis',
    contohPelajaran: [
      'Membuat materi konten promosi digital dan riset produk',
      'Melayani transaksi penjualan dan pelayanan konsumen (customer service)',
      'Mengelola toko online (e-commerce) dan pencatatan stok barang',
    ],
    studiKasus: {
      judul: 'Analisis Efektivitas Kampanye Social Media Ads & Conversion Rate E-Commerce',
      latar_belakang:
        'Kampanye produk baru melalui iklan digital membutuhkan evaluasi berjangka untuk memastikan Return on Ad Spend (ROAS) menguntungkan perusahaan.',
      proses_atau_formula:
        '1. Merancang materi konten video pendek (Reels/TikTok).\n2. Memasang Meta Ads dengan target audiens usia 18-35 tahun.\n3. Melakukan tracking Meta Pixel untuk pencatatan transaksi masuk.\n4. Evaluasi mingguan pada rasio konversi (CTR & Conversion Rate).',
      hasil:
        'Kampanye menghasilkan 1.250 leads prospektif dengan Conversion Rate naik sebesar 4,5% dan kenaikan total omzet bulanan sebesar 18%.',
      data_angka: [
        { label: 'Jangkauan Promosi Iklan (Reach)', nilai: '45.000 User' },
        { label: 'Lama Durasi Kampanye Iklan', nilai: '7 Hari / 1 Bulan' },
        { label: 'Click-Through Rate (CTR)', nilai: '4.5%' },
        { label: 'Peningkatan Omzet Bulanan', nilai: 'Rp 18.500.000 (18%)' },
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
