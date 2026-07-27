# BAB Catalog — Modul BAB Laporan PKL

Setiap BAB adalah **modul** yang bisa di-include atau di-skip. Agent pilih modul berdasarkan data yang tersedia + preferensi user.

---

## Daftar Modul BAB

### `PENDAHULUAN` — Selalu Include

**Judul default:** BAB [N] PENDAHULUAN

| Sub-bab | ID | Include Condition | Enumerasi |
|---------|----|--------------------|-----------|
| Latar Belakang | `1.1` | ✅ Selalu | Paragraf naratif |
| Rumusan Masalah | `1.2` | Kalau ada pertanyaan spesifik | `1. 2. 3.` (angka) |
| Batasan Masalah | `1.3` | Kalau scope perlu dijelaskan | `a. b. c.` (huruf) |
| Tujuan PKL | `1.4` | ✅ Selalu (tujuan umum + khusus) | `1. 2. 3.` (angka) |
| Manfaat PKL | `1.5` | Sering (bagi siswa, sekolah, perusahaan) | `a. b. c.` (huruf) |
| Waktu dan Tempat Pelaksanaan | `1.6` | ✅ Selalu | Paragraf / tabel |
| Metode Pengumpulan Data | `1.7` | Kalau diminta sekolah | `1. 2. 3.` (angka) |
| Sistematika Penulisan | `1.8` | Kalau diminta sekolah | Paragraf per BAB |

**Data needed:** `pkl.tanggal_mulai`, `pkl.tanggal_selesai`, `perusahaan.nama`, `perusahaan.alamat`, `siswa.jurusan`

**Konten Latar Belakang:** Ditulis berdasarkan konteks jurusan + perusahaan. BUKAN template generic "Perkembangan teknologi..." (lihat humanisasi.md).

---

### `PROFIL_PERUSAHAAN` — Include kalau ada data perusahaan detail

**Judul default:** BAB [N] PROFIL PERUSAHAAN / GAMBARAN UMUM INSTANSI

| Sub-bab | Include Condition |
|---------|-------------------|
| Sejarah Singkat | Kalau `profil_perusahaan.sejarah` ada |
| Visi dan Misi | Kalau `profil_perusahaan.visi` / `misi` ada |
| Struktur Organisasi | Kalau ada data atau gambar |
| Bidang Usaha | Dari `perusahaan.bidang_usaha` |
| Lokasi / Cabang | Kalau relevan |
| Tata Tertib Perusahaan | Kalau `profil_perusahaan.tata_tertib` ada |
| Jam Kerja | Kalau ada data jam kerja |
| Job Description | Kalau ada data posisi + deskripsi tugas |

**Judul alternatif:**
- "Tinjauan Umum Perusahaan"
- "Gambaran Umum PT [Nama]"
- "Profil Instansi / DUDI"

---

### `LANDASAN_TEORI` — Include kalau user mau 5-6 BAB

**Judul default:** BAB [N] LANDASAN TEORI / TINJAUAN PUSTAKA

| Sub-bab | Konten |
|---------|--------|
| Landasan Teori | Definisi PKL dari ahli (Oemar Hamalik, Minarti & Usman, Wardiman) |
| Landasan Hukum / Asas PKL | UU No.20/2003, PP No.29/1990, Kepmendikbud No.323/U/1997, Permendikbud No.50/2020, Kepmendikbudristek No.262/M/2022 |
| Teori Teknis Jurusan | Teori yang relevan dengan kegiatan PKL (opsional) |
| Profil/Sejarah Sekolah | Opsional, beberapa sekolah taruh di sini |

**Load dari:** `references/laporan-pkl-landasan-hukum.md`

---

### `PELAKSANAAN` — Selalu Include (inti laporan)

**Judul default:** BAB [N] PELAKSANAAN PKL / KEGIATAN INDUSTRI

| Sub-bab | Include Condition |
|---------|-------------------|
| Uraian Kegiatan per Bidang | ✅ Selalu — dari `kegiatan[]` |
| Studi Kasus / Analisis Teknis | Kalau `studi_kasus` ada — load referensi dari `jurusan-knowledge.md` |
| Peralatan & Perlengkapan | Kalau `peralatan[]` ada — dengan gambar |
| Dokumentasi Foto | Kalau `assets[]` ada yang type foto/screenshot |

**Judul alternatif:**
- "Kegiatan Industri"
- "Pembahasan"
- "Hasil Pelaksanaan PKL"
- "Data Pengamatan"

**Format kegiatan:**
```
[Bidang: Operation]
Adapun tugas yang penulis kerjakan dalam bidang Operation adalah:
a. [Tugas 1 + detail]
b. [Tugas 2 + detail]
...

[Bidang: Collection]
Adapun tugas yang penulis kerjakan dalam bidang Collection adalah:
a. [Tugas 1 + detail]
...
```

---

### `PEMBAHASAN` — Include kalau ada analisis mendalam

**Judul default:** BAB [N] PEMBAHASAN

| Sub-bab | Include Condition |
|---------|-------------------|
| Analisis Masalah | Kalau ada problem solving yang dikerjakan |
| Refleksi Pengalaman | Kalau `refleksi` ada |
| Perbandingan Teori vs Praktik | Kalau ada LANDASAN_TEORI dan bisa dibandingkan |
| Hal-hal yang Perlu Diperhatikan | General reflection |

**Note:** Modul ini sering digabung dengan PELAKSANAAN di struktur 4 BAB.

---

### `HAMBATAN` — Include kalau ada data kendala signifikan

**Judul default:** BAB [N] HAMBATAN DAN SOLUSI

| Sub-bab | Konten |
|---------|--------|
| Hambatan | Dari `kendala[].masalah` |
| Solusi / Upaya | Dari `kendala[].solusi` |

**Note:** Modul ini sering menjadi sub-bab di PELAKSANAAN atau PENUTUP di struktur < 6 BAB.

---

### `PENUTUP` — Selalu Include

**Judul default:** BAB [N] KESIMPULAN DAN SARAN / PENUTUP

| Sub-bab | Enumerasi |
|---------|-----------|
| Kesimpulan | `1. 2. 3.` (angka) — ringkasan dari semua kegiatan |
| Saran untuk Sekolah | `1. 2. 3.` (angka) |
| Saran untuk Perusahaan | `1. 2. 3.` (angka) |

**Konten Kesimpulan:** Sintesis dari data kegiatan + refleksi. BUKAN "Semoga bermanfaat..." (lihat humanisasi.md).

---

## Logika Pemilihan Otomatis

Agent analisis data yang terkumpul dan rekomendasikan jumlah BAB:

```
RULE 1: Kalau data minimal (cuma nama + kegiatan dasar)
  → 3 BAB: PENDAHULUAN + PELAKSANAAN + PENUTUP

RULE 2: Kalau ada data perusahaan detail (sejarah/visi misi/struktur)
  → 4 BAB: + PROFIL_PERUSAHAAN

RULE 3: Kalau ada data perusahaan + perlu landasan teori
  → 5 BAB: + LANDASAN_TEORI

RULE 4: Kalau ada studi kasus teknis + analisis mendalam
  → 5-6 BAB: + PEMBAHASAN (terpisah dari PELAKSANAAN)

RULE 5: Kalau ada kendala signifikan yang perlu BAB sendiri
  → +1 BAB: HAMBATAN (biasanya jadi BAB V di struktur 6 BAB)
```

**Format rekomendasi ke user:**

> Berdasarkan data kamu, saya sarankan **[N] BAB**:
> 
> BAB I — Pendahuluan
> BAB II — Profil [Nama Perusahaan]
> BAB III — Pelaksanaan PKL
> BAB IV — Penutup
> 
> **Alasan:** [penjelasan singkat]
> 
> Mau pakai ini, atau mau ubah? Bisa tambah BAB Landasan Teori, atau kurangin jadi 3 BAB.

**User bisa override:**
- "Saya mau 6 BAB" → agent sesuaikan
- "Tambah BAB hambatan" → agent tambahkan modul HAMBATAN
- "Gabung aja profil perusahaan ke pendahuluan" → agent merge

---

## Penomoran BAB Otomatis

Setelah modul dipilih, BAB di-nomor ulang secara sekuensial:

```python
selected_modules = ["PENDAHULUAN", "PROFIL_PERUSAHAAN", "PELAKSANAAN", "PENUTUP"]
for i, module in enumerate(selected_modules, 1):
    bab_number = to_roman(i)  # I, II, III, IV
```

Sub-bab mengikuti nomor BAB:
- BAB I → 1.1, 1.2, 1.3
- BAB II → 2.1, 2.2, 2.3
- dst.
