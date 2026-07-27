# Data Schema — pkl-context.json

Semua data PKL disimpan di `pkl-data/pkl-context.json`. File ini adalah **source of truth** untuk generate .docx.

---

## Schema Lengkap

```json
{
  "version": "1.0",
  "status": "collecting | reviewing | ready | generated",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",

  "config": {
    "jumlah_bab": null,
    "bab_modules": [],
    "margin": { "atas": 4, "bawah": 3, "kiri": 4, "kanan": 3 },
    "font": "Times New Roman",
    "font_size": 12,
    "spasi": 1.5,
    "pedoman_sekolah": null
  },

  "siswa": {
    "nama": "",
    "nis": "",
    "nisn": "",
    "kelas": "",
    "jurusan": "",
    "jurusan_key": "",
    "tempat_lahir": "",
    "tanggal_lahir": "",
    "jenis_kelamin": "",
    "golongan_darah": "",
    "catatan_kesehatan": "",
    "no_telp": "",
    "alamat": "",
    "nama_ortu": "",
    "alamat_ortu": "",
    "telp_ortu": ""
  },

  "sekolah": {
    "nama": "",
    "nama_lengkap": "",
    "alamat": "",
    "kota": "",
    "telp": "",
    "email": "",
    "website": "",
    "kop": {
      "baris_1": "",
      "baris_2": "",
      "baris_3": "",
      "npsn": "",
      "nss": ""
    },
    "kepala_sekolah": { "nama": "", "nip": "", "gelar": "" },
    "waka_humas": { "nama": "", "nip": "", "gelar": "" },
    "ketua_kk": { "nama": "", "nip": "", "gelar": "" },
    "pembimbing_sekolah": { "nama": "", "nip": "", "gelar": "" }
  },

  "perusahaan": {
    "nama": "",
    "nama_lengkap": "",
    "alamat": "",
    "bidang_usaha": "",
    "status": "",
    "no_telp": "",
    "fax": "",
    "email": "",
    "website": "",
    "pimpinan": { "nama": "", "jabatan": "" },
    "hrd": { "nama": "", "jabatan": "", "telp": "", "email": "" },
    "pembimbing_industri": { "nama": "", "jabatan": "", "telp": "", "email": "" }
  },

  "pkl": {
    "tanggal_mulai": "",
    "tanggal_selesai": "",
    "durasi_bulan": null,
    "jam_pelajaran": null,
    "bagian_ditempatkan": "",
    "tahun_ajaran": ""
  },

  "profil_perusahaan": {
    "sejarah": "",
    "visi": "",
    "misi": [],
    "struktur_organisasi": "",
    "tata_tertib": [],
    "jam_kerja": [],
    "job_descriptions": []
  },

  "kegiatan": [
    {
      "bidang": "",
      "deskripsi_umum": "",
      "tugas": [
        {
          "nama": "",
          "detail": "",
          "assets": []
        }
      ]
    }
  ],

  "studi_kasus": {
    "judul": "",
    "latar_belakang": "",
    "proses_atau_formula": "",
    "data_angka": [],
    "hasil": "",
    "assets": []
  },

  "peralatan": [
    {
      "nama": "",
      "deskripsi": "",
      "gambar": ""
    }
  ],

  "kendala": [
    {
      "masalah": "",
      "solusi": ""
    }
  ],

  "pelajaran": [],

  "refleksi": "",

  "kata_pengantar": {
    "ucapan_syukur": "",
    "hierarki_terima_kasih": [],
    "harapan": "",
    "kota": "",
    "tanggal": ""
  },

  "daftar_pustaka": [],

  "assets": [
    {
      "id": "A-001",
      "filename": "",
      "original_name": "",
      "type": "foto | screenshot | logo | dokumen | diagram",
      "caption": "",
      "used_in_bab": null,
      "path": "pkl-data/assets/..."
    }
  ],

  "gaps": [
    {
      "field": "sekolah.waka_humas.nip",
      "reason": "",
      "impact": "",
      "resolution": ""
    }
  ],

  "lampiran": {
    "jurnal_kegiatan": false,
    "absensi": false,
    "sertifikat": false,
    "penilaian": false,
    "surat_permohonan": false,
    "surat_balasan": false,
    "foto_dokumentasi": true
  }
}
```

---

## Field Categories

### Wajib (Minimal untuk Generate)

| Field | Diperlukan Untuk |
|-------|-----------------|
| `siswa.nama` | Cover, Pengesahan, Identitas |
| `siswa.nis` | Cover, Identitas |
| `siswa.jurusan` | Cover, konten BAB |
| `sekolah.nama` | Cover, Pengesahan Sekolah |
| `sekolah.kota` | Cover, Kata Pengantar |
| `perusahaan.nama` | Cover, Pengesahan Industri, BAB Profil |
| `pkl.tanggal_mulai` | BAB I |
| `pkl.tanggal_selesai` | BAB I |
| `kegiatan` (min 1) | BAB Pelaksanaan |

### Penting (Sangat Direkomendasikan)

| Field | Diperlukan Untuk |
|-------|-----------------|
| `perusahaan.pembimbing_industri` | Pengesahan Industri |
| `perusahaan.pimpinan` | Pengesahan Industri |
| `sekolah.pembimbing_sekolah` | Pengesahan Sekolah |
| `sekolah.ketua_kk` | Pengesahan Sekolah |
| `kendala` (min 1) | BAB Hambatan / Penutup |

### Opsional (Enrichment)

| Field | Efek |
|-------|------|
| `profil_perusahaan.sejarah` | Enables BAB Profil Perusahaan |
| `studi_kasus` | Enables analisis teknis di BAB Pelaksanaan |
| `peralatan` | Enables sub-bab Peralatan + gambar |
| `assets` | Gambar di BAB + Lampiran |
| `sekolah.kop.*` | Kop sekolah di Cover |

---

## Status Lifecycle

```
collecting → user masih interview, data belum lengkap
reviewing  → agent tampilkan ringkasan, user review
ready      → user konfirmasi, siap generate
generated  → .docx sudah dibuat
```

---

## Asset Management

Saat user drop file:
1. Simpan ke `pkl-data/assets/[sanitized-filename]`
2. Tambah entry di `assets[]` array
3. Auto-assign `id` (A-001, A-002, ...)
4. Tanya caption kalau belum ada
5. `used_in_bab` di-assign saat generate (bukan saat drop)

Supported file types: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.pdf`
