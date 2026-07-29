export interface DataAngkaExample {
  label: string
  nilai: string
}

export interface JurusanExample {
  jurusan_key: string
  label: string
  icon: string
  badge: string
  studiKasus: {
    judul: string
    latar_belakang: string
    proses_atau_formula: string
    hasil: string
    data_angka: DataAngkaExample[]
  }
}

export const JURUSAN_EXAMPLES: Record<string, JurusanExample> = {
  akl: {
    jurusan_key: 'akl',
    label: 'Akuntansi & Keuangan Lembaga (AKL)',
    icon: 'chart',
    badge: 'Akuntansi & Keuangan',
    studiKasus: {
      judul: 'Pendataan & Penghitungan Waive Discount Debitur Macet',
      latar_belakang:
        'Proses permohonan waive discount (potongan denda) oleh debitur membutuhkan penghitungan persentase potongan yang teliti agar perusahaan tidak mengalami kerugian berlebih namun debitur tetap dapat melunasi kewajibannya.',
      proses_atau_formula:
        '1. Mengumpulkan berkas KTP dan formulir permohonan debitur.\n2. Menghitung akumulasi denda harian (Total Angsuran x 0,5%).\n3. Melakukan negosiasi besaran diskon denda yang disetujui Head Collection.\n4. Menginput data persentase diskon ke sistem database.',
      hasil:
        'Debitur mendapatkan keringanan pembayaran denda sebesar 37,99% sehingga total tunggakan denda berkurang dari Rp 4.596.800,- menjadi Rp 2.851.000,- dan pembayaran pelunasan berhasil diproses.',
      data_angka: [
        { label: 'Total Denda Awal Kredit', nilai: 'Rp 4.596.800,-' },
        { label: 'Hasil Negosiasi Diskon (Waive)', nilai: '37,99%' },
        { label: 'Total Denda Setelah Diskon', nilai: 'Rp 2.851.000,-' },
        { label: 'Sisa Pokok Hutang Debitur', nilai: 'Rp 16.448.301,-' },
      ],
    },
  },

  rpl: {
    jurusan_key: 'rpl',
    label: 'Rekayasa Perangkat Lunak (RPL / PPLG)',
    icon: 'code',
    badge: 'Perangkat Lunak & IT',
    studiKasus: {
      judul: 'Optimasi Speed & Performance Query Database pada Rekapitulasi Laporan',
      latar_belakang:
        'Fitur rekapitulasi laporan bulanan mengalami kendala pemuatan lambat (timeout) saat memuat puluhan ribu baris data transaksi karena belum ada penciptaan indeks pada tabel database.',
      proses_atau_formula:
        '1. Melakukan profiling query menggunakan EXPLAIN ANALYZE.\n2. Menambahkan composite index pada kolom created_at dan status_id.\n3. Mengubah struktur subquery JOIN menjadi INNER JOIN ber-indeks.\n4. Melakukan testing beban dengan k6 / Apache JMeter.',
      hasil:
        'Waktu pemuatan halaman rekapitulasi berkurang drastis dari 3,8 detik menjadi 0,2 detik, dan penggunaan memori server berkurang hingga 65%.',
      data_angka: [
        { label: 'Waktu Query Sebelum Optimasi', nilai: '3.8 Detik' },
        { label: 'Waktu Query Setelah Optimasi', nilai: '0.2 Detik' },
        { label: 'Penghematan Memori Server', nilai: '65%' },
        { label: 'Jumlah Record Terproses', nilai: '50.000 Data' },
      ],
    },
  },

  tkj: {
    jurusan_key: 'tkj',
    label: 'Teknik Komputer & Jaringan (TKJ / SIJA)',
    icon: 'globe',
    badge: 'Jaringan & Server',
    studiKasus: {
      judul: 'Konfigurasi Manajemen Bandwidth Router MikroTik & Segmentation VLAN',
      latar_belakang:
        'Penggunaan koneksi internet di kantor sering mengalami lag akibat beberapa divisi menggunakan seluruh bandwidth tanpa pembagian kuota (queue tree) yang terorganisir.',
      proses_atau_formula:
        '1. Pembuatan VLAN ID 10 untuk Staf dan VLAN ID 20 untuk Tamu.\n2. Setting DHCP Server & IP Pool pada MikroTik RB750Gr3.\n3. Penerapan Queue Tree & PCQ (Per Connection Queue) untuk pembagian bandwidth adil.\n4. Uji kelajuan koneksi via Speedtest & iPerf.',
      hasil:
        'Lalu lintas data antar divisi menjadi terisolasi aman, latency koneksi stabil di angka 12ms, dan kecepatan internet merata 100 Mbps di seluruh divisi.',
      data_angka: [
        { label: 'Throughput Sebelum Limiting', nilai: '10 Mbps (Unstable)' },
        { label: 'Throughput Setelah Queuing', nilai: '100 Mbps (Stable)' },
        { label: 'Latency Rata-Rata', nilai: '12 ms' },
        { label: 'Jumlah Client Terhubung', nilai: '45 User' },
      ],
    },
  },

  bdp: {
    jurusan_key: 'bdp',
    label: 'Bisnis Daring & Pemasaran (BDP / Bisnis Digital)',
    icon: 'chart-line',
    badge: 'Pemasaran & Bisnis',
    studiKasus: {
      judul: 'Analisis Efektivitas Kampanye Social Media Ads & Conversion Rate',
      latar_belakang:
        'Kampanye produk baru melalui iklan digital membutuhkan evaluasi berjangka untuk memastikan Return on Ad Spend (ROAS) menguntungkan perusahaan.',
      proses_atau_formula:
        '1. Merancang materi konten video pendek (Reels/TikTok).\n2. Memasang Meta Ads dengan target audiens usia 18-35 tahun.\n3. Melakukan tracking Meta Pixel untuk pencatatan transaksi masuk.\n4. Evaluasi mingguan pada rasio konversi (CTR & Conversion Rate).',
      hasil:
        'Kampanye menghasilkan 1.250 leads prospektif dengan Conversion Rate naik sebesar 4,5% dan kenaikan total omzet bulanan sebesar 18%.',
      data_angka: [
        { label: 'Total Impresi Iklan (Reach)', nilai: '45.000 User' },
        { label: 'Click-Through Rate (CTR)', nilai: '4.5%' },
        { label: 'Total Konversi Penjualan', nilai: '120 Transaksi' },
        { label: 'Peningkatan Omzet Bulanan', nilai: '18%' },
      ],
    },
  },

  mplb: {
    jurusan_key: 'mplb',
    label: 'Manajemen Perkantoran & Layanan Bisnis (MPLB / OTKP)',
    icon: 'folder',
    badge: 'Administrasi Perkantoran',
    studiKasus: {
      judul: 'Digitalisasi & Digital Archiving System Surat Masuk/Keluar',
      latar_belakang:
        'Sistem temu kembali (retrieval) arsip fisik surat masuk sering memakan waktu lama karena pencatatan agenda masih menggunakan buku register manual.',
      proses_atau_formula:
        '1. Melakukan alih media (scanning) dokumen surat fisik ke format PDF.\n2. Mengelompokkan dokumen berdasarkan Sistem Subjek & Kode Klasifikasi.\n3. Menginput nomor disposisi dan indeks surat ke e-Office.\n4. Pengujian kecepatan pencarian dokumen (Retrieval Time Test).',
      hasil:
        'Waktu temu kembali dokumen arsip berkurang drastis dari 15 menit menjadi kurang dari 1 menit per dokumen.',
      data_angka: [
        { label: 'Waktu Temu Kembali Manual', nilai: '15 Menit' },
        { label: 'Waktu Temu Kembali Digital', nilai: '45 Detik' },
        { label: 'Dokumen Terscan & Terindeks', nilai: '250 Surat' },
        { label: 'Akurasi Klasifikasi Arsip', nilai: '99%' },
      ],
    },
  },

  tkro: {
    jurusan_key: 'tkro',
    label: 'Teknik Kendaraan Ringan Otomotif (TKRO / TBSM)',
    icon: 'car',
    badge: 'Otomotif & Mesin',
    studiKasus: {
      judul: 'Diagnosa Kode Kerusakan DTC & Tune-Up Sistem EFI Mesin Mobil',
      latar_belakang:
        'Kendaraan pelanggan mengalami indikator Check Engine menyala disertai mesin bergetar (mispot) dan konsumsi bahan bakar yang boros.',
      proses_atau_formula:
        '1. Memasang OBD-II Diagnostic Scanner untuk membaca Diagnostic Trouble Code (DTC).\n2. Memeriksa nilai tahanan sensor O2 dan kebersihan throttle body.\n3. Pembersihan busi & injektor menggunakan ultrasonic cleaner.\n4. Clearing DTC memory & uji jalan (road test).',
      hasil:
        'Kode DTC P0300 (Random Misfire) berhasil diatasi, putaran idle mesin kembali halus di 750 RPM, dan efisiensi bahan bakar kembali normal.',
      data_angka: [
        { label: 'Putaran Idle Sebelum Service', nilai: '550 RPM (Pincang)' },
        { label: 'Putaran Idle Setelah Tune-Up', nilai: '750 RPM (Halus)' },
        { label: 'Tahanan Busi / Resistance', nilai: '4.2 kOhm' },
        { label: 'Tekanan Bahan Bakar (Fuel Press)', nilai: '3.1 Bar' },
      ],
    },
  },

  dkv: {
    jurusan_key: 'dkv',
    label: 'Desain Komunikasi Visual (DKV / Animasi)',
    icon: 'palette',
    badge: 'Desain & Media',
    studiKasus: {
      judul: 'Perancangan Branding Visual & Optimasi Asset Rendering Motion Graphic',
      latar_belakang:
        'Waktu rendering video promosi resolusi 4K sering mengalami kegagalan karena ukuran aset grafis bitmap terlalu besar dan belum teroptimasi.',
      proses_atau_formula:
        '1. Mengubah aset gambar dari raster bitmap menjadi format vektor (SVG/AI).\n2. Pengaturan hierarki tipografi dan palet warna CMYK sesuai Brand Guidelines.\n3. Pengaturan Media Encoder H.264 profil target bit-rate 15 Mbps.\n4. Render final video iklan 60 FPS.',
      hasil:
        'Waktu komputasi render berkurang dari 45 menit menjadi 12 menit tanpa penurunan kualitas visual.',
      data_angka: [
        { label: 'Waktu Render Sebelum Optimasi', nilai: '45 Menit' },
        { label: 'Waktu Render Setelah Optimasi', nilai: '12 Menit' },
        { label: 'Ukuran File Video Final', nilai: '150 MB' },
        { label: 'Resolusi Output', nilai: '1920x1080 (60 FPS)' },
      ],
    },
  },

  ph: {
    jurusan_key: 'ph',
    label: 'Tata Boga & Perhotelan (PH / Kuliner)',
    icon: 'utensils',
    badge: 'Boga & Perhotelan',
    studiKasus: {
      judul: 'Standardisasi Mise en Place & Efisiensi Food Cost Menu Utama',
      latar_belakang:
        'Tingginya persentase sisa bahan baku makanan (food waste) pada pengolahan menu buffet banquet menyebabkan Food Cost melebihi standar target 30%.',
      proses_atau_formula:
        '1. Penerapan metode FIFO (First In First Out) pada penyimpanan chiller.\n2. Penimbangan porsi bahan (portion control) presisi saat Mise en Place.\n3. Perhitungan standar resep dan yield percentage bahan baku.\n4. Audit ketaatan prosedur higienitas sanitasi HACCP.',
      hasil:
        'Persentase Food Cost berhasil ditekan dari 38% menjadi 29,5%, sesuai standar efisiensi operasional hotel.',
      data_angka: [
        { label: 'Food Cost Sebelum Control', nilai: '38%' },
        { label: 'Food Cost Setelah Control', nilai: '29.5%' },
        { label: 'Waktu Persiapan (Mise en Place)', nilai: '45 Menit' },
        { label: 'Tingkat Kepatuhan HACCP', nilai: '98%' },
      ],
    },
  },

  farmasi: {
    jurusan_key: 'farmasi',
    label: 'Farmasi Klinis & Komunitas',
    icon: 'activity',
    badge: 'Kesehatan & Farmasi',
    studiKasus: {
      judul: 'Manajemen Stok Obat LASA (Look Alike Sound Alike) & Skrining Resep',
      latar_belakang:
        'Risiko kesalahan pengambilan obat (medication error) pada sediaan obat bernama/kemasan mirip (LASA) membutuhkan penataan stiker peringatan khusus.',
      proses_atau_formula:
        '1. Skrining administratif & farmasetis resep dokter.\n2. Penempelan stiker penanda hijau "LASA" pada rak penyimpanan obat.\n3. Perhitungan dosis maksimal racikan puyer anak.\n4. Penyiapan etiket & penyerahan obat disertai Edukasi Informasi Obat (KIE).',
      hasil:
        'Tingkat akurasi penyiapan obat mencapai 100% tanpa ada insiden salah pasok obat LASA.',
      data_angka: [
        { label: 'Akurasi Penyiapan Obat', nilai: '100%' },
        { label: 'Waktu Pelayanan Resep Non-Racikan', nilai: '7 Menit' },
        { label: 'Waktu Pelayanan Resep Racikan', nilai: '18 Menit' },
        { label: 'Jumlah Item Obat Terlabel LASA', nilai: '60 Jenis' },
      ],
    },
  },

  tei: {
    jurusan_key: 'tei',
    label: 'Teknik Elektronika Industri (TEI)',
    icon: 'lightning',
    badge: 'Elektronika & PLC',
    studiKasus: {
      judul: 'Kalibrasi Sensor Suhu PT100 & Programming Ladder Diagram PLC',
      latar_belakang:
        'Pembacaan suhu pada oven pengering komponen mengalami deviasi nilai sebesar 5°C sehingga pemanas bekerja tidak stabil.',
      proses_atau_formula:
        '1. Pengukuran nilai resistansi sensor PT100 menggunakan multimeter presisi.\n2. Adjusting trimmer potensio pada transmitter 4-20mA.\n3. Pemrograman ulang timer & counter pada PLC Omron via CX-Programmer.\n4. Pengujian fungsi darurat (Emergency Stop Test).',
      hasil:
        'Deviasi pembacaan suhu sensor berkurang menjadi 0.1°C dan alur kerja conveyor otomatis berjalan lancar.',
      data_angka: [
        { label: 'Deviasi Suhu Sebelum Kalibrasi', nilai: '5.0 °C' },
        { label: 'Deviasi Suhu Setelah Kalibrasi', nilai: '0.1 °C' },
        { label: 'Sinyal Transmitter Output', nilai: '4 - 20 mA' },
        { label: 'Response Time Emergency Stop', nilai: '0.05 Detik' },
      ],
    },
  },
}

export function detectJurusanKey(input: string): string {
  if (!input) return 'rpl'
  const lower = input.toLowerCase().trim()
  if (lower.includes('akuntansi') || lower.includes('akl') || lower.includes('keuangan') || lower.includes('perbankan')) return 'akl'
  if (lower.includes('perangkat lunak') || lower.includes('rpl') || lower.includes('pplg') || lower.includes('software') || lower.includes('coding')) return 'rpl'
  if (lower.includes('jaringan') || lower.includes('tkj') || lower.includes('sija') || lower.includes('komputer') || lower.includes('network')) return 'tkj'
  if (lower.includes('pemasaran') || lower.includes('bdp') || lower.includes('bisnis digital') || lower.includes('marketing')) return 'bdp'
  if (lower.includes('perkantoran') || lower.includes('mplb') || lower.includes('otkp') || lower.includes('administrasi')) return 'mplb'
  if (lower.includes('otomotif') || lower.includes('tkro') || lower.includes('tbsm') || lower.includes('mesin') || lower.includes('kendaraan')) return 'tkro'
  if (lower.includes('desain') || lower.includes('dkv') || lower.includes('animasi') || lower.includes('visual') || lower.includes('broadcasting')) return 'dkv'
  if (lower.includes('boga') || lower.includes('ph') || lower.includes('kuliner') || lower.includes('hotel') || lower.includes('perhotelan')) return 'ph'
  if (lower.includes('farmasi') || lower.includes('obat') || lower.includes('apotek')) return 'farmasi'
  if (lower.includes('elektronika') || lower.includes('tei') || lower.includes('plc') || lower.includes('listrik')) return 'tei'
  return 'rpl'
}

export function getJurusanExample(jurusanKey?: string): JurusanExample {
  if (!jurusanKey) return JURUSAN_EXAMPLES['rpl']
  const key = jurusanKey.toLowerCase().trim()
  return JURUSAN_EXAMPLES[key] || JURUSAN_EXAMPLES[detectJurusanKey(key)] || JURUSAN_EXAMPLES['rpl']
}
