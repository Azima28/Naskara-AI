# Jurusan Knowledge — Bank Pengetahuan per Kompetensi Keahlian

Panduan probing interview + studi kasus + istilah teknis per jurusan SMK.

---

## Cara Pakai

1. Saat interview Fase 1 → detect jurusan user
2. Load section jurusan yang relevan
3. Gunakan **probing questions** untuk menggali kegiatan
4. Gunakan **studi kasus template** kalau user mau BAB analisis teknis
5. Kalau jurusan user **tidak ada** di daftar → gunakan template CUSTOM di bawah

---

## 1. Akuntansi & Keuangan Lembaga (AKL) / Perbankan

**Probing Questions:**
- Ditempatkan di bagian apa? (Kasir, Admin, Collection, Marketing?)
- Ada proses pencatatan transaksi? Manual atau sistem?
- Pernah bikin laporan keuangan? Rekonsiliasi?
- Ada perhitungan yang dikerjakan? (denda, angsuran, bunga)

**Kegiatan Umum:**
- Pencatatan transaksi di sistem
- Penagihan / collection angsuran
- Rekonsiliasi saldo bank
- Cetak surat peringatan
- Pengarsipan dokumen
- Input data kredit ke sistem

**Studi Kasus Template: Waive Discount**
- Latar: Perhitungan potongan denda keterlambatan angsuran
- Formula: `Denda Harian = Total Angsuran × 0.5%`, `Total Denda = Denda Harian + Collection Fee`, `Denda Setelah Potongan = Total Denda - (Total Denda × % Negosiasi)`
- Checklist berkas: Surat Permohonan, Foto debitur, KTP, Form sistem, Form kronologis

**Studi Kasus Template: Rekonsiliasi Saldo**
- Latar: Membandingkan saldo penerimaan Payment Channel BRI, Laporan Sistem, dan Rekening Koran
- Proses: Cari selisih → adjusting trial balance
- Tujuan: Memastikan parameter keuntungan cabang tercatat valid

**Istilah Teknis:** Debitur, Kreditur, Angsuran, Denda, Waive Discount, Pelunasan Khusus, Collection Fee, BASTK, SKT, Late Charges, FID, TaColl, Cash Opname, Rekening Koran, Adjusting, GO LIVE

---

## 2. Teknik Komputer & Jaringan (TKJ) / SIJA

**Probing Questions:**
- Konfigurasi jaringan apa yang pernah dikerjakan?
- Ada troubleshooting yang menarik? Error apa?
- Pernah setting mikrotik/router/switch?
- Ada topologi jaringan yang di-design?

**Kegiatan Umum:**
- Setting IP Address, Subnetting
- Konfigurasi VLAN, routing
- Crimping kabel UTP
- Install OS, software
- Troubleshooting koneksi internet
- Maintenance server/PC

**Studi Kasus Template: Subnetting CIDR**
- Latar: Perancangan segmen jaringan LAN untuk N divisi
- Formula: `Jumlah Subnet = 2^x`, `Host per Subnet = 2^y - 2`
- Simulasi: Alokasi IP → Pembagian subnet → VLAN assignment

**Studi Kasus Template: Bandwidth Management**
- Latar: Latensi tinggi pada jam operasional
- Proses: Analisis → Simple Queue → Burst Limit
- Hasil: Bandwidth terdistribusi merata

**Istilah Teknis:** IP Address, Subnetting, CIDR, VLAN, Mikrotik, Queue Tree, Bandwidth, Latency, Crimping, UTP, RJ-45, DHCP, DNS, Firewall, NAT, Topologi

---

## 3. Rekayasa Perangkat Lunak (RPL) / PPLG

**Probing Questions:**
- Project apa yang dikerjakan? (nama aplikasi)
- Tech stack apa? (bahasa, framework, database)
- Ada screenshot aplikasi? Drop aja
- Fitur apa yang kamu kerjakan?
- Ada masalah teknis yang harus diatasi?

**Kegiatan Umum:**
- Develop aplikasi web/mobile/desktop
- Design database / ERD
- Coding fitur (CRUD, auth, reporting)
- Testing / debugging
- Deploy aplikasi
- Maintenance & update

**Studi Kasus Template: Optimasi Query**
- Latar: Query lambat pada tabel transaksi besar
- Proses: Analisis EXPLAIN → CREATE INDEX → Query tuning
- Hasil: Execution time turun dari X detik ke Y detik

**Studi Kasus Template: Implementasi Fitur**
- Latar: Requirement fitur baru dari user
- Proses: Analisis kebutuhan → Design → Code → Test
- Hasil: Fitur berjalan sesuai requirement

**Istilah Teknis:** Framework, API, Database, SQL, CRUD, ERD, Frontend, Backend, Deploy, Git, Repository, Debug, Testing, UI/UX, Responsive

---

## 4. Pemasaran (BDP) / Bisnis Digital

**Probing Questions:**
- Campaign marketing apa yang dikerjakan?
- Platform media sosial apa?
- Ada data penjualan atau analytics?
- Pernah bikin konten? Design? Copy?

**Kegiatan Umum:**
- Manage akun media sosial
- Buat konten marketing (foto, video, caption)
- Input data penjualan ke spreadsheet
- Customer service / handling complaint
- Promosi produk online/offline

**Studi Kasus Template: Conversion Rate & ROI**
- Formula: `CR = (Leads / Total Klik) × 100%`, `ROAS = Total Pendapatan / Total Biaya Iklan`
- Simulasi angka nyata dari campaign

**Istilah Teknis:** Conversion Rate, ROI, ROAS, Impression, CTR, Engagement, Leads, Funnel, Campaign, Content Marketing, SEO, SEM

---

## 5. Manajemen Perkantoran & Layanan Bisnis (MPLB)

**Probing Questions:**
- Bagian apa yang ditempatin? (resepsionis, admin, arsip)
- Tugas administratif apa?
- Ada sistem pengarsipan yang dipelajari?
- Pernah handle surat masuk/keluar?

**Kegiatan Umum:**
- Pengarsipan surat masuk/keluar
- Input data ke komputer
- Fotokopi, scan, fax dokumen
- Menerima tamu / resepsionis
- Pengetikan surat/dokumen

**Studi Kasus Template: Efisiensi Arsip**
- Latar: Penataan arsip sistem abjad & kronologis
- Proses: Retrieval time analysis sebelum vs sesudah
- Hasil: Durasi pencarian turun dari 15 menit ke < 2 menit

**Istilah Teknis:** Disposisi, Agenda Surat, Filing System, Kartu Kendali, Retrieval, In/Out Mail

---

## 6. Teknik Otomotif (TKRO / TBSM)

**Probing Questions:**
- Bengkel atau dealer?
- Servis apa yang paling sering dikerjakan?
- Ada troubleshooting engine yang menarik?
- Pernah pakai alat scan/diagnostic?

**Kegiatan Umum:**
- Tune up / servis berkala
- Ganti oli, filter, busi
- Troubleshooting engine
- Cek sistem kelistrikan
- Balancing, spooring ban

**Studi Kasus Template: Troubleshooting FI**
- Latar: Mesin mati mendadak (sudden engine stall)
- Diagnosa: Scantool DTC code (e.g., P0190)
- Formula: `Total Cost = Harga Part + Biaya Jasa + PPN 11%`
- Simulasi: Sensor + filter + jasa = subtotal + PPN

**Istilah Teknis:** DTC, Scantool, Fuel Injection, ECU, Tune Up, Spooring, Balancing, Overheat, Stall, Idle

---

## 7. Desain Komunikasi Visual (DKV) / Animasi / Broadcasting

**Probing Questions:**
- Desain apa yang kamu buat? (logo, branding, poster, video)
- Software apa yang dipakai?
- Ada portofolio / hasil karya? Drop aja
- Ada revisi dari client? Berapa kali?

**Kegiatan Umum:**
- Design branding (logo, kartu nama, banner)
- Edit video / motion graphics
- Photography / videography
- Layout majalah / buku
- Social media content design

**Studi Kasus Template: Render Time Optimization**
- Formula: `Total Render = Jumlah Frame × Waktu per Frame`
- Simulasi: 15 detik @30fps = 450 frame × 4.5s = 33.75 menit

**Istilah Teknis:** Resolution, Render, Frame, FPS, Vector, Raster, CMYK, RGB, Bleed, Trim, Mockup, Brief, Revisi

---

## 8. Kuliner / Tata Boga & Perhotelan (PH)

**Probing Questions:**
- Kitchen mana? (hot kitchen, cold kitchen, pastry)
- Menu apa yang paling sering dimasak?
- Ada perhitungan food cost?
- Ada SOP kebersihan / HACCP?

**Kegiatan Umum:**
- Prepare bahan makanan (mise en place)
- Masak menu harian
- Plating / garnishing
- Kebersihan dapur (cleaning station)
- Stock opname bahan baku

**Studi Kasus Template: Food Cost Percentage**
- Formula: `Food Cost % = (Biaya Bahan Baku / Harga Jual) × 100%`
- Standar industri: 30-40% = ideal
- Simulasi angka nyata

**Istilah Teknis:** Mise en Place, Food Cost, Yield, Plating, Garnishing, FIFO, HACCP, Stock Opname, BEP

---

## 9. Farmasi Klinis & Komunitas

**Probing Questions:**
- Apotek atau rumah sakit?
- Tugas apa? (racik obat, kasir, input resep)
- Ada perhitungan dosis?
- Pernah handle resep dokter?

**Kegiatan Umum:**
- Meracik obat resep dokter
- Menyerahkan obat + informasi pemakaian
- Input data obat ke sistem
- Stock opname obat
- Cek expired date

**Istilah Teknis:** Resep, Racikan, Dosis, Sediaan, Generik, Paten, LASA, High Alert, Expired, Stock Opname, e-Resep

---

## 10. Teknik Elektronika Industri (TEI)

**Probing Questions:**
- Maintenance mesin apa?
- Ada troubleshooting PLC/sensor?
- Pernah soldering/assembly PCB?

**Kegiatan Umum:**
- Maintenance mesin produksi
- Troubleshooting panel listrik
- Programming PLC
- Soldering / assembly komponen
- Kalibrasi alat ukur

**Istilah Teknis:** PLC, Ladder Diagram, Sensor, Actuator, PCB, Soldering, Multimeter, Oscilloscope, Panel Listrik

---

## CUSTOM — Jurusan yang Belum Ada

Kalau user input jurusan yang tidak ada di daftar:

1. **Jangan tolak** — terima dan lanjut
2. **Tanya langsung:**
   > "Jurusan [X] belum ada di database saya. Bisa ceritakan kegiatan teknis apa yang kamu kerjakan selama PKL? Nanti saya buatkan studi kasus dari situ."
3. **Extract pattern:**
   - Kegiatan rutin → BAB Pelaksanaan
   - Kegiatan teknis spesifik → Studi Kasus
   - Istilah teknis → Glossary
4. **Tidak perlu studi kasus template** — generate berdasarkan cerita user
