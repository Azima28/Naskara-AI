# Interview Flow — Panduan Percakapan Adaptif PKL

Interview bukan kuesioner. Ini percakapan yang mengalir berdasarkan konteks user.

---

## Prinsip Utama

1. **Max 3-5 pertanyaan per batch** — jangan overwhelm user
2. **Reflect & confirm** — setelah user jawab, ringkas: "OK jadi kamu PKL di PT X sebagai anak RPL, betul?"
3. **User bisa drop file kapan saja** — agent detect, simpan di `pkl-data/assets/`, catat di JSON
4. **Gap tracking** — kalau user gak tau sesuatu, catat sebagai gap dan lanjut. Jangan block.
5. **Bahasa natural** — ikuti bahasa user. Kalau user casual, agent juga casual.
6. **Jangan tanya yang sudah dijawab** — dengarkan prompt awal, extract info yang sudah ada.

---

## Fase 1: First Contact

Saat user bilang "buat laporan PKL" atau serupa:

**Langkah:**
1. Dengarkan prompt awal — mungkin sudah ada info (nama perusahaan, jurusan, dll)
2. Extract apa yang sudah diketahui dari prompt
3. Tanyakan yang belum ada (max 3-4 pertanyaan):

**Pertanyaan kunci:**
- Jurusan / kompetensi keahlian apa?
- PKL di mana? (nama perusahaan/instansi)
- Sudah selesai PKL atau masih berjalan?
- Berapa lama? (tanggal mulai - selesai)

**Reflect:**
> "OK, jadi kamu anak [jurusan] di [sekolah], PKL di [perusahaan] selama [durasi]. Betul?"

**Jangan tanya di fase ini:**
- Jumlah BAB (terlalu teknis, user belum tau)
- Detail formatting (belum waktunya)
- Data pembimbing (terlalu detail terlalu cepat)

---

## Fase 2: Data Diri & Sekolah

**Pertanyaan batch 1 (data diri):**
- Nama lengkap
- NIS / NISN
- Kelas berapa?

**Pertanyaan batch 2 (sekolah):**
- Nama sekolah lengkap (SMK Negeri/Swasta apa?)
- Kota mana?
- Sekolah punya pedoman format laporan PKL?
  - **YA** → "Bisa drop/share pedomannya? Biar saya ikutin format sekolah"
  - **TIDAK / GAK TAU** → "OK saya pake format standar. Margin default 4-4-3-3 cm, font TNR 12pt. Mau ubah atau udah OK?"

**Data pembimbing sekolah (bisa di-skip):**
- Nama pembimbing sekolah
- Nama ketua kompetensi keahlian  
- Nama Waka Humas
- Nama kepala sekolah

> Kalau user gak hafal nama/NIP, catat sebagai gap: `"Nanti bisa diisi belakangan, gak masalah"`

---

## Fase 3: Data Perusahaan

**Pertanyaan:**
- Alamat perusahaan
- Bidang usaha (jasa/produksi/dll)
- Nama pembimbing industri + jabatan
- Nama pimpinan/kepala cabang + jabatan

**Drop file opportunity:**
> "Ada logo perusahaan atau foto gedung? Bisa drop di sini nanti saya masukin ke laporan"

**Sanitasi:**
- Jangan tulis "PT. PT. Nama" — sanitasi otomatis jadi "PT Nama"
- Jangan tulis "CV. CV. Nama"

---

## Fase 4: Kegiatan & Konten (INTI)

Ini bagian terpenting. Probing disesuaikan berdasarkan jurusan.

**Pertanyaan pembuka:**
> "Sekarang ceritain dong, apa aja yang kamu kerjakan selama PKL? Gak usah urut, bebas aja"

**Setelah user cerita, probing lanjutan per jurusan:**

Load dari `references/jurusan-knowledge.md` dan tanyakan yang relevan:

| Jurusan | Probing Lanjutan |
|---------|-----------------|
| RPL/PPLG | "Project apa yang dikerjakan? Pakai bahasa/framework apa? Ada screenshot app?" |
| TKJ/SIJA | "Konfigurasi jaringan apa? Ada troubleshooting yang menarik? Topologi?" |
| AKL | "Proses accounting apa? Ada perhitungan yang dikerjakan? Laporan keuangan?" |
| BDP | "Campaign marketing apa? Ada data penjualan/conversion?" |
| MPLB | "Pengarsipan gimana? Surat masuk/keluar? Ada SOP yang dipelajari?" |
| Otomotif | "Troubleshooting engine apa? Ada diagnosa scantool?" |
| DKV | "Desain apa yang dibuat? Software apa? Ada portofolio?" |
| Kuliner | "Menu apa yang dimasak? Ada food cost calculation?" |

**Drop file opportunity:**
> "Ada foto kegiatan? Screenshot hasil kerja? Hasil desain? Drop aja, nanti saya masukin ke laporan"

**Tanya kendala:**
> "Selama PKL ada kendala atau hambatan gak? Gimana cara ngatasinnya?"

**Tanya refleksi:**
> "Apa pelajaran paling berharga yang kamu dapet selama PKL?"

---

## Fase 5: Review, Rekomendasi & Generate

**1. Tampilkan ringkasan data:**
```
Data yang sudah terkumpul:
✅ Data diri: Niken Vena As-Syifa, NIS 13979, kelas XII AKL
✅ Sekolah: SMK Negeri 4 Bandar Lampung
✅ Perusahaan: PT Reksa Finance Lampung (6 bulan)
✅ Kegiatan: Operation (10 tugas) + Collection (10 tugas)
✅ Studi kasus: Perhitungan Waive Discount
✅ Foto: 3 gambar kegiatan
⚠️ Gap: NIP Waka Humas belum ada
⚠️ Gap: Logo perusahaan belum ada
```

**2. Rekomendasi struktur BAB:**

Agent analisis data yang terkumpul dan rekomendasikan:

```
Berdasarkan data kamu, saya sarankan 5 BAB:

BAB I   — Pendahuluan (latar belakang, tujuan, manfaat, waktu & tempat)
BAB II  — Profil PT Reksa Finance (sejarah, visi misi, struktur organisasi)
BAB III — Landasan Teori & Hukum PKL
BAB IV  — Pelaksanaan PKL (kegiatan Operation & Collection + studi kasus Waive Discount)
BAB V   — Penutup (kesimpulan & saran)

Alasan: Kamu punya data perusahaan yang lengkap dan studi kasus teknis, jadi 5 BAB cocok.

Mau pakai ini, atau mau ubah? (misal tambah BAB Hambatan, atau kurangin jadi 4 BAB)
```

**3. Konfirmasi & generate:**
> "OK saya mulai generate laporan ya. Tunggu sebentar..."

---

## Handling Edge Cases

### User langsung drop banyak info sekaligus
Extract semua info dari prompt, skip pertanyaan yang sudah terjawab, tanyakan sisanya.

### User bilang "gak tau" atau skip
Catat sebagai gap. Lanjut. Tawari: "Nanti bisa diisi belakangan kok."

### User minta custom jumlah BAB
Ikuti. Sesuaikan modul BAB dari `references/bab-catalog.md`.

### User drop file di tengah percakapan
Detect file type, simpan di `pkl-data/assets/`, catat di JSON:
```json
{
  "id": "A-001",
  "filename": "screenshot-app.png",
  "type": "screenshot",
  "caption": "auto-detect atau tanya user",
  "used_in_bab": "auto-assign nanti"
}
```
Respond: "Oke, foto [nama] sudah saya simpan. Nanti saya masukin ke laporan."

### User mau revisi setelah generate
Buka `pkl-data/pkl-context.json`, update field yang diminta, re-generate.

---

## Anti-Pattern: Jangan Lakukan Ini

❌ Jangan tanya semua data sekaligus dalam 1 batch besar
❌ Jangan tanya "berapa BAB?" di awal — user gak tau, dan ini tugas agent
❌ Jangan paksa urutan — kalau user mau ceritain kegiatan duluan, ikutin
❌ Jangan block karena data gap — catat dan lanjut
❌ Jangan generate tanpa konfirmasi struktur BAB ke user
