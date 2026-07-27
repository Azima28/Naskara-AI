# Bank Studi Kasus & Formula BAB IV Laporan PKL SMK (Dinamis per Jurusan)

File ini memuat contoh **Studi Kasus Kuantitatif, Formula Matematika/Teknis, dan Simulasi Masalah Realistis** untuk BAB IV Laporan PKL SMK di berbagai jurusan.

---

## 🎯 Aturan Penulisan BAB IV Sesuai Jurusan

Setiap Laporan PKL SMK **wajib** menyajikan studi kasus teknis di BAB IV yang mencakup:
1. **Latar Belakang Kasus / Permasalahan Tempat Kerja.**
2. **Formula / Parameter / Standard Operating Procedure (SOP).**
3. **Kalkulasi Angka Nyata / Langkah Diagnostic Troubleshooting.**
4. **Hasil Akhir & Tindakan Rekonsiliasi / Solusi.**

---

## 📂 1. Akuntansi & Keuangan Lembaga (AKL) / Perbankan

### Kasus A: Perhitungan Pengajuan Potongan Denda (Waive Discount)
* **Deskripsi:** Perhitungan potongan denda keterlambatan angsuran debitur berdasarkan negosiasi persetujuan cabang & kantor pusat.
* **Formula:**
  $$\text{Denda Harian} = \text{Total Angsuran} \times 0.5\%$$
  $$\text{Total Denda} = \text{Denda Harian} + \text{Collection Fee}$$
  $$\text{Denda Setelah Potongan} = \text{Total Denda} - (\text{Total Denda} \times \% \text{Negosiasi})$$
* **Simulasi Angka:**
  * Total Angsuran: Rp 3.478.000,-
  * Denda Akumulasi: Rp 4.146.800,- + Collection Fee Rp 450.000,- = Total Rp 4.596.800,-
  * Hasil Negosiasi Potongan (37.99%): $\text{Rp 4.596.800} \times 37.99\% = \text{Rp 1.746.324.32}$
  * Total Dibayar Debitur: $\text{Rp 4.596.800} - \text{Rp 1.746.324.32} = \text{Rp 2.850.475.68} \approx \text{Rp 2.851.000,-}$
* **Checklist Berkas Wajib:**
  1. Surat Permohonan Waive Discount bertanda tangan.
  2. Foto debitur saat membuat surat.
  3. Fotokopi KTP debitur.
  4. Form sistem persetujuan Waive Discount.
  5. Form kronologis percakapan Head Collection & Debitur.

### Kasus B: Rekonsiliasi Saldo Bank BRI & Adjusting Trial Balance
* **Deskripsi:** Membandingkan saldo penerimaan Payment Channel BRI (Online), Laporan Sistem Reksaloan, dan Rekening Koran BRI.
* **Tindakan:** Jika terjadi *unbalance* (selisih data akibat miss-input atau double input), dilakukan *adjusting trial balance* untuk memastikan parameter keuntungan cabang tercatat valid.

---

## 📂 2. Teknik Komputer & Jaringan (TKJ) / SIJA

### Kasus A: Perhitungan Subnetting CIDR & Perencanaan Topologi VLAN
* **Deskripsi:** Perancangan pembagian segmen jaringan LAN kantor cabang untuk 4 divisi (Admin, Marketing, Guest, Server).
* **Formula Subnetting:**
  $$\text{Jumlah Subnet} = 2^x \quad (x = \text{jumlah bit 1 tambahan})$$
  $$\text{Jumlah Host per Subnet} = 2^y - 2 \quad (y = \text{jumlah bit 0})$$
* **Simulasi Angka:**
  * Alokasi IP: `192.168.10.0/24` (254 host usable).
  * Pembagian Subnet `/26` (Block Size 64):
    * VLAN 10 (Admin): `192.168.10.1` - `192.168.10.62` (Netmask `255.255.255.192`)
    * VLAN 20 (Marketing): `192.168.10.65` - `192.168.10.126`
    * VLAN 30 (Guest): `192.168.10.129` - `192.168.10.190`
    * VLAN 40 (Server): `192.168.10.193` - `192.168.10.254`

### Kasus B: Troubleshooting Bandwidth Drop & Queue Tree Mikrotik
* **Deskripsi:** Menganalisis latensi tinggi pada jam operasional dan mengonfigurasi Simple Queue Bandwidth Management (Burst Limit).

---

## 📂 3. Rekayasa Perangkat Lunak (RPL) / PPLG

### Kasus A: Optimasi Query Database SQL & Indexing Tabel Transaksi
* **Deskripsi:** Mengatasi penundaan pencarian data transaksi bulanan yang lambat akibat query tanpa index.
* **Analisis Query:**
  ```sql
  -- Sebelum Optimasi (Execution Time: 2.45 detik - Full Table Scan)
  SELECT * FROM transaksi WHERE tanggal_bayar BETWEEN '2024-11-01' AND '2024-11-30';

  -- Solusi Indexing & Optimasi Query (Execution Time: 0.03 detik)
  CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal_bayar);
  SELECT id_transaksi, no_kontrak, nominal, tanggal_bayar FROM transaksi WHERE tanggal_bayar >= '2024-11-01' AND tanggal_bayar <= '2024-11-30';
  ```

---

## 📂 4. Pemasaran (BDP) / Bisnis Digital

### Kasus A: Perhitungan Conversion Rate & ROI Digital Ads Campaign
* **Deskripsi:** Mengukur efektivitas iklan media sosial tempat PKL dalam menghasilkan leads/pelanggan baru.
* **Formula:**
  $$\text{Conversion Rate (CR)} = \left( \frac{\text{Jumlah Lead / Customer}}{\text{Total Klik / Impression}} \right) \times 100\%$$
  $$\text{Return on Ad Spend (ROAS)} = \frac{\text{Total Pendapatan Iklan}}{\text{Total Jasa Iklan}}$$

---

## 📂 5. Manajemen Perkantoran & Layanan Bisnis (MPLB)

### Kasus A: Efisiensi Penataan Arsip Sistem Abjad & Cronologis
* **Deskripsi:** Pengelompokan dan indeks waktu penemuan kembali surat masuk/keluar (*retrieval time analysis*).
* **Standar Penilaian:** Penurunan durasi pencarian dokumen fisik dari 15 menit menjadi di bawah 2 menit dengan kartu kendali indeks.

---

## 📂 6. Teknik Otomotif (TKRO / TBSM)

### Kasus A: Troubleshooting System Fuel Injection & Perhitungan Part Cost Breakdown
* **Deskripsi:** Diagnosis penyebab mesin mati mendadak (sudden engine stall) dan kalkulasi biaya perbaikan/penggantian suku cadang.
* **Diagnosa Scantool:** Code DTC `P0190` (Fuel Rail Pressure Sensor Circuit Malfunction).
* **Formula Total Cost Estimate:**
  $$\text{Total Cost} = \text{Harga Part} + \text{Biaya Jasa Service} + \text{PPN 11\%}$$
* **Simulasi Angka:**
  * Sensor Assy Fuel Pressure: Rp 850.000,-
  * Filter Bensin: Rp 120.000,-
  * Jasa Tune Up & Scan DTC: Rp 250.000,-
  * Subtotal: Rp 1.220.000,- + PPN 11% (Rp 134.200,-) = **Total Rp 1.354.200,-**

---

## 📂 7. Desain Komunikasi Visual (DKV) / Animasi / Broadcasting

### Kasus A: Pipeline Produksi Assets, Render Time & Storage Optimization
* **Deskripsi:** Pengelolaan alur kerja revisi desain branding, kompresi resolusi output media cetak/digital, dan estimasi render time.
* **Formula Render Time Estimate:**
  $$\text{Total Render Time} = \text{Jumlah Frame} \times \text{Rata-rata Waktu Render per Frame}$$
* **Simulasi Data:**
  * Durasi Video 15 detik @ 30 FPS = 450 Frame.
  * Render Time per Frame (4K H.264): 4.5 detik.
  * Total Waktu: $450 \times 4.5\text{s} = 2.025\text{ detik} \approx 33.75\text{ menit}$.

---

## 📂 8. Kuliner / Tata Boga & Perhotelan (PH)

### Kasus A: Perhitungan Food Cost Percentage & Yield Percentage
* **Deskripsi:** Menghitung HPP (Harga Pokok Penjualan) menu restoran tempat PKL untuk mencegah kerugian pembuangan bahan (waste).
* **Formula:**
  $$\text{Food Cost \%} = \left( \frac{\text{Biaya Bahan Baku}}{\text{Harga Jual Menu}} \right) \times 100\%$$
* **Simulasi Angka:**
  * Biaya Bahan Baku per Porsi Steak: Rp 42.500,-
  * Harga Jual Menu: Rp 110.000,-
  * Food Cost %: $\left(\frac{42.500}{110.000}\right) \times 100\% = 38.63\%$ (Standard Industri: 30% - 40% = Ideal).
