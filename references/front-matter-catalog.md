# Front Matter Catalog — Halaman Depan Laporan PKL

Setiap halaman depan adalah modul yang bisa di-include atau di-skip.

---

## Daftar Modul Front Matter

### `COVER_LUAR` — Wajib

**Urutan konten (dari atas ke bawah, semua center):**

1. Judul "LAPORAN" — TNR 20pt Bold
2. "PRAKTEK KERJA LAPANGAN (PKL)" — TNR 20pt Bold
3. "DI [NAMA PERUSAHAAN]" — TNR 20pt Bold
4. [spacing]
5. "Disusun untuk memenuhi salah satu persyaratan dalam menyelesaikan studi di [Sekolah] kompetensi keahlian [Jurusan]" — 14pt Italic Center
6. [spacing]
7. "disusun oleh :" — 14pt Center
8. "[Nama Siswa] NIS. [NIS]" — 16pt Bold Underline Center
9. [spacing]
10. [Logo Sekolah — IMAGE jika ada]
11. [spacing]
12. Kop Sekolah:
    - "[PEMERINTAH PROVINSI ...]" — 14pt Center
    - "[DINAS PENDIDIKAN DAN KEBUDAYAAN]" — 14pt Center
    - "[SMK NEGERI/SWASTA ...]" — 14pt Bold Center
    - "[Alamat + Telp]" — 14pt Center → 12pt
    - "[Email + Website]" — 12pt Center
    - "[NPSN : ... NSS : ...]" — 12pt Center

**Data needed:** `siswa.nama`, `siswa.nis`, `siswa.jurusan`, `sekolah.nama`, `sekolah.kop.*`, `perusahaan.nama`

---

### `COVER_DALAM` — Default Include, bisa skip

Identik 100% dengan Cover Luar. Harus di page sendiri (page break setelah Cover Luar).

---

### `PENGESAHAN_INDUSTRI` — Wajib

**Halaman pengesahan dari pihak perusahaan/instansi.**

**Layout (vertikal center):**
1. [H1] "HALAMAN PENGESAHAN" — Center
2. [H1] "PADA [NAMA PERUSAHAAN]" — Center
3. [spacing]
4. "Menyetujui," — 18pt Bold Center
5. [spacing]
6. "Pembimbing Industri" — 20pt Bold Center
7. [spacing besar untuk TTD]
8. "[Nama Pembimbing]" — 18pt Bold Underline Center
9. [spacing]
10. "[Jabatan Pimpinan]" — 18pt Bold Center
11. [spacing besar untuk TTD]
12. "[Nama Pimpinan]" — 18pt Bold Underline Center

**Formatting khusus:**
- Line spacing: **1.9** (lebih longgar dari body)
- Semua center
- Nama selalu underline

**Data needed:** `perusahaan.nama`, `perusahaan.pembimbing_industri`, `perusahaan.pimpinan`

---

### `PENGESAHAN_SEKOLAH` — Wajib

**Halaman pengesahan dari pihak sekolah.**

**Layout:**
1. [H1] "HALAMAN PENGESAHAN" — Center
2. [H1] "PADA [NAMA SEKOLAH]" — Center
3. [spacing]
4. "Menyetujui," — 16pt Bold Center
5. [spacing]
6. "Ketua Kompetensi Keahlian **[TAB]** Pembimbing" — 16pt Bold, **Tab Stop @11.83cm**
7. [spacing besar untuk TTD]
8. "[Nama Ketua KK] **[TAB]** [Nama Pembimbing]" — 16pt Bold Underline, **Tab Stop @9.84cm**
9. "NIP.[...] **[TAB]** NIP.[...]" — 16pt
10. [spacing]
11. "Waka Humas [Nama Sekolah]" — 16pt Bold Center
12. [spacing besar untuk TTD]
13. "[Nama Waka Humas]" — 16pt Bold Underline Center
14. "NIP.[...]" — 16pt Center

**Tab Stop presisi (dari reverse-engineering Niken):**
- Baris label: Tab Stop @**11.83 cm** (LEFT alignment)
- Baris nama: Tab Stop @**9.84 cm**

**Data needed:** `sekolah.ketua_kk`, `sekolah.pembimbing_sekolah`, `sekolah.waka_humas`, `sekolah.nama`

---

### `IDENTITAS_SISWA` — Default Include, bisa skip

**Format: Tabel 3 kolom tanpa border**

| Kolom 1 (Field) | Kolom 2 | Kolom 3 (Value) |
|-----------------|---------|-----------------|
| Nama Siswa | : | [nama] |
| Nomor Induk | : | [nis] |
| Tempat, Tgl.lahir | : | [tempat], [tanggal] |
| Jenis Kelamin | : | [jenis_kelamin] |
| Golongan Darah | : | [golongan_darah] |
| Catatan Kesehatan | : | [catatan] |
| No. Telp/Hp siswa | : | [no_telp] |
| Nama Sekolah | : | [sekolah.nama] |
| Alamat Sekolah | : | [sekolah.alamat] |
| No. Telp Sekolah | : | [sekolah.telp] |
| Nama Orang Tua/Wali | : | [nama_ortu] |
| Alamat Orang Tua/Wali | : | [alamat_ortu] |
| No. Telp Orang Tua/Wali | : | [telp_ortu] |

Style: `Normal Table` (tanpa border/grid)

Diikuti tanda tangan:
```
[Right align] "Yang Bersangkutan,"  → 14pt Bold
[spacing untuk TTD]
[Center, L=11.43cm] "[Nama Siswa]"  → 14pt Bold Underline
```

**Data needed:** `siswa.*`

---

### `IDENTITAS_INDUSTRI` — Default Include, bisa skip

**Format: Tabel 3 kolom tanpa border, 4 seksi header**

**Seksi 1 — Perusahaan/Instansi (rows 0-8):**
| Field | : | Value |
|-------|---|-------|
| Nama | : | [nama] |
| Alamat | : | [alamat] |
| Bidang Produk/Jasa | : | [bidang] |
| Status | : | [status] |
| Nomor Telp | : | [telp] |
| Nomor Fax. | : | [fax] |
| E-mail | : | [email] |
| Website | : | [website] |

**Seksi 2 — Pimpinan (rows 9-11):**
Header row tanpa `:` → "Pimpinan"
| Jabatan | : | [jabatan] |
| Nama | : | [nama] |

**Seksi 3 — HRD / Ka. Tu (rows 12-15):**
Header row → "HRD / Ka. Tu"
| Nama | : | [nama] |
| No. Telp | : | [telp] |
| E-mail | : | [email] |

**Seksi 4 — Pembimbing (rows 16-20):**
Header row → "Pembimbing"
| Jabatan | : | [jabatan] |
| Nama | : | [nama] |
| No. Telp | : | [telp] |
| E-mail | : | [email] |

Style: `Normal Table` (tanpa border/grid), total 21 rows x 3 cols

**Data needed:** `perusahaan.*`

---

### `KATA_PENGANTAR` — Wajib

**Struktur:**
1. [H1] "KATA PENGANTAR" — Center
2. Paragraf syukur — Justify, L=~1cm, ls=1.5
3. Paragraf tujuan laporan — Justify
4. Paragraf intro terima kasih — Justify
5. **7 Hierarki Terima Kasih** (semua Justify, indent lebih dalam ~1.6cm):
   1. Tuhan Yang Maha Esa
   2. Kedua Orang Tua
   3. [Pembimbing Industri] — nama + jabatan
   4. [Kepala Sekolah] — nama + gelar
   5. [Ketua Jurusan / KK] — nama + gelar
   6. [Pembimbing Sekolah] — nama + gelar
   7. Pihak lain yang tidak dapat disebutkan satu persatu
6. Paragraf harapan + permohonan maaf
7. [Right align] "[Kota], [Tanggal]" — Bold
8. [spacing untuk TTD]
9. [Center, L=11.43cm] "[Nama Siswa]" — Underline
10. [Center, L=11.43cm] "Penulis" — Bold

**Data needed:** `siswa.nama`, `kata_pengantar.*`, semua nama pembimbing

---

### `DAFTAR_ISI` — Wajib

**Format Word native TOC styles:**
- `toc 1` — BAB / Halaman Depan (level 1)
- `toc 2` — Sub-bab 1.1, 1.2 (level 2)
- `toc 3` — Sub-sub-bab a), b) (level 3)

Tab Stop: **dots leader @13.5cm**, right alignment untuk nomor halaman.

**Auto-generated** berdasarkan modul BAB yang dipilih.

---

### `DAFTAR_GAMBAR` — Auto Include jika ada gambar

Format sama dengan Daftar Isi tapi untuk gambar:
```
Gambar 4.1 [caption] .............. [halaman]
Gambar 4.2 [caption] .............. [halaman]
```

---

### `DAFTAR_TABEL` — Auto Include jika ada tabel

Format sama untuk tabel.

---

## Urutan Default

```
1. COVER_LUAR          (halaman tanpa nomor)
2. COVER_DALAM         (halaman tanpa nomor)
3. PENGESAHAN_INDUSTRI (halaman i)
4. PENGESAHAN_SEKOLAH  (halaman ii)
5. IDENTITAS_SISWA     (halaman iii)
6. IDENTITAS_INDUSTRI  (halaman iv)
7. KATA_PENGANTAR      (halaman v)
8. DAFTAR_ISI          (halaman vi)
9. DAFTAR_GAMBAR       (halaman vii, jika ada)
10. DAFTAR_TABEL       (halaman viii, jika ada)
--- PAGE BREAK + switch to arabic numbering ---
11. BAB I              (halaman 1)
...
```

Penomoran:
- Cover: **tanpa nomor**
- Front matter (Pengesahan → Daftar Isi): **romawi kecil** (i, ii, iii...)
- BAB dst: **angka arab** (1, 2, 3...)
