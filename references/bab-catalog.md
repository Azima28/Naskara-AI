# BAB Catalog — Modul BAB Laporan PKL
# Panduan Resmi SMKN4 Bandar Lampung TP 2026-2027

Setiap BAB adalah **modul** yang bisa di-include atau di-skip. Agent pilih modul berdasarkan data yang tersedia + preferensi user.

> **PEMBARUAN TP 2026-2027**: Struktur resmi SMKN4 adalah **6 BAB**. Profil Perusahaan
> (Sejarah, Visi-Misi, Tata Tertib, Struktur Organisasi, Job Description) **tidak lagi**
> berdiri sebagai BAB tersendiri — melainkan menjadi sub-bab 1.3–1.6 di dalam BAB I PENDAHULUAN.

---

## Struktur Resmi 6 BAB SMKN4 TP 2026-2027

| No | Modul | Judul | Sub-bab |
|:---:|:---|:---|:---|
| I | `PENDAHULUAN` | PENDAHULUAN | 1.1 Latar Belakang, 1.2 Tujuan, 1.3 Sejarah Perusahaan, 1.4 Tata Tertib, 1.5 Struktur Organisasi, 1.6 Job Description |
| II | `KEGIATAN_INDUSTRI` | KEGIATAN DI INDUSTRI | 2.1 Proses Kegiatan Selama PKL |
| III | `TINJAUAN_PUSTAKA` | TINJAUAN PUSTAKA | 3.1 Landasan Teori, 3.2 Asas PKL, 3.3 Sejarah SMKN4 |
| IV | `DATA_PENGAMATAN` | DATA PENGAMATAN | 4.1 Pelaksanaan Kegiatan, 4.2 Peralatan & Perlengkapan |
| V | `PEMBAHASAN` | PEMBAHASAN | 5.1 Hambatan, 5.2 Pemecahan Masalah, 5.3 Hal yang Perlu Diperhatikan |
| VI | `KESIMPULAN_SARAN` | KESIMPULAN DAN SARAN | 6.1 Kesimpulan, 6.2 Saran |

---

## Daftar Modul BAB

### `PENDAHULUAN` — Selalu Include

**Judul default:** BAB I PENDAHULUAN

| Sub-bab | ID | Include Condition | Enumerasi |
|---------|----|--------------------|-----------| 
| Latar Belakang | `1.1` | ✅ Selalu | Paragraf naratif |
| Tujuan PKL | `1.2` | ✅ Selalu (tujuan umum + khusus) | `1. 2. 3.` (angka) |
| Sejarah Singkat Perusahaan | `1.3` | Kalau `profil_perusahaan.sejarah` ada | Paragraf + sub-sub a) Visi-Misi, b) Profil Lokasi |
| Tata Tertib Perusahaan | `1.4` | ✅ Selalu (8 poin resmi SMKN4 + poin khusus) | Sub-sub a) Jam Kerja, b) Tata Tertib, c) Khusus |
| Bagan Struktur Organisasi | `1.5` | Kalau ada gambar/data struktur | Gambar + narasi |
| Job Description | `1.6` | Kalau ada `job_descriptions` | Posisi + daftar tugas |

**Data needed:** `pkl.tanggal_mulai`, `perusahaan.nama`, `profil_perusahaan.*`, `siswa.jurusan`

> **CATATAN:** `PROFIL_PERUSAHAAN` sebagai modul terpisah sudah **tidak berlaku** sejak TP 2026-2027.
> Backend menerima nilai ini untuk kompatibilitas mundur, tetapi akan diabaikan (dialiaskan ke `None`).
> Konten profil perusahaan otomatis masuk ke BAB I sub-bab 1.3-1.6.

---

### `KEGIATAN_INDUSTRI` (alias: `PELAKSANAAN`, `PROSES_KEGIATAN`) — Selalu Include

**Judul default:** BAB II KEGIATAN DI INDUSTRI

| Sub-bab | Include Condition |
|---------|-------------------|
| Proses Kegiatan Selama PKL | ✅ Selalu — dari `kegiatan[]` per bidang |

**Judul alternatif:**
- "Kegiatan di Industri"
- "Proses Kegiatan"

---

### `TINJAUAN_PUSTAKA` (alias: `LANDASAN_TEORI`) — Selalu Include

**Judul default:** BAB III TINJAUAN PUSTAKA

| Sub-bab | Konten |
|---------|--------|
| Landasan Teori | Definisi PKL dari ahli (Oemar Hamalik, Minarti & Usman, Wardiman) |
| Asas / Landasan Hukum | UU No.20/2003, PP No.29/1990, Kepmendikbud No.323/U/1997, Permendikbud No.50/2020 |
| Sejarah SMKN4 | Sejarah singkat SMK Negeri 4 Bandar Lampung |

**Load dari:** `references/laporan-pkl-landasan-hukum.md`, `references/smkn4_sejarah.py`

---

### `DATA_PENGAMATAN` — Include (inti laporan detail)

**Judul default:** BAB IV DATA PENGAMATAN

| Sub-bab | Include Condition |
|---------|-------------------|
| Pelaksanaan Kegiatan PKL | ✅ Selalu — narasi detail dari `kegiatan[]` |
| Jenis Peralatan dan Perlengkapan | Kalau `peralatan[]` ada — dengan gambar |

---

### `PEMBAHASAN` (alias: `HAMBATAN`) — Include kalau ada analisis

**Judul default:** BAB V PEMBAHASAN

| Sub-bab | Include Condition |
|---------|-------------------|
| Hambatan yang Dialami | Kalau `kendala[]` ada |
| Pemecahan Masalah | Kalau `kendala[]` ada (pasangan dari hambatan) |
| Hal-hal yang Perlu Diperhatikan | ✅ Selalu — pembelajaran/refleksi |

---

### `KESIMPULAN_SARAN` (alias: `PENUTUP`, `KESIMPULAN`) — Selalu Include

**Judul default:** BAB VI KESIMPULAN DAN SARAN

| Sub-bab | Enumerasi |
|---------|-----------|
| Kesimpulan | `1. 2. 3.` (angka) — ringkasan dari semua kegiatan |
| Saran | `1. 2. 3.` (angka) — untuk sekolah dan industri |

---

## Logika Pemilihan Otomatis

Agent analisis data yang terkumpul dan rekomendasikan struktur **6 BAB resmi** SMKN4:

```
RULE 1 (Resmi SMKN4 TP 2026-2027):
  SELALU gunakan 6 BAB:
    BAB I   PENDAHULUAN       → termasuk Profil Perusahaan (1.3-1.6)
    BAB II  KEGIATAN INDUSTRI → ringkasan proses kegiatan
    BAB III TINJAUAN PUSTAKA  → Landasan Teori + Asas PKL + Sejarah SMKN4
    BAB IV  DATA PENGAMATAN   → detail kegiatan + peralatan
    BAB V   PEMBAHASAN        → hambatan + solusi + refleksi
    BAB VI  KESIMPULAN & SARAN

RULE 2 (Sub-bab BAB I yang muncul/tidak):
  - 1.3 Sejarah: muncul kalau profil_perusahaan.sejarah ada
  - 1.4 Tata Tertib: SELALU ada (8 poin resmi SMKN4 + poin khusus perusahaan)
  - 1.5 Struktur: muncul kalau ada gambar struktur_organisasi
  - 1.6 Job Desc: muncul kalau ada job_descriptions
```

---

## Penomoran BAB Otomatis

Setelah modul dipilih, BAB di-nomor ulang secara sekuensial:

```python
selected_modules = ["PENDAHULUAN", "KEGIATAN_INDUSTRI", "TINJAUAN_PUSTAKA",
                    "DATA_PENGAMATAN", "PEMBAHASAN", "KESIMPULAN_SARAN"]
for i, module in enumerate(selected_modules, 1):
    bab_number = to_roman(i)  # I, II, III, IV, V, VI
```

Sub-bab mengikuti nomor BAB:
- BAB I → 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
- BAB II → 2.1
- BAB III → 3.1, 3.2, 3.3
- dst.
