---
name: docx
description: "Create Word documents (.docx). Laporan PKL SMK (adaptive interview + auto-generate 3-6 BAB), makalah akademik, report, memo, letter. Use when user asks for laporan PKL, praktik kerja lapangan, makalah, report, or any .docx deliverable."
license: Proprietary. LICENSE.txt has complete terms
platforms: [linux, macos, windows]
---

# DOCX — Word Document Creation & Editing

## Overview

A .docx file is a ZIP archive containing XML files.

**Two approaches:**
| Approach | When To Use |
|----------|-------------|
| **python-docx** (Python) — `pip install python-docx` | Preferred for this Hermes environment. Works reliably, no timeout issues. |
| **docx-js** (Node.js) — `npm install -g docx` | Alternative if python-docx unavailable. Full Anthropic docx skill has deeper XML editing. |

## Quick Reference

| Task | Approach |
|------|----------|
| Read/analyze content | `pandoc` or python-docx .paragraphs |
| Create new document (Python) | Use `python-docx` — see Creating with Python below |
| Create new document (JS) | Use `docx-js` (Node.js) |
| Edit existing document | Unpack → edit XML → repack |

## Dependencies

```bash
pip install python-docx
npm install -g docx    # fallback
```

## ⚠️ Environment Notes (Windows)

- **python-docx** → system Python 3.13
  - Windows/PowerShell: `& "C:\Users\agust\AppData\Local\Programs\Python\Python313\python.exe" script.py`
  - Git Bash: `"/c/Users/agust/AppData/Local/Programs/Python/Python313/python.exe" script.py`
- **Hermes venv Python** (3.11) — does NOT have python-docx

---

## 🗂️ Document Type Reference Files

Referensi file berisi **aturan + helper** untuk jenis dokumen tertentu. Load sesuai kebutuhan:

### Umum
| Dokumen | File Referensi |
|---------|---------------|
| **Makalah** (akademik) | `references/makalah-format.md` |
| **Humanisasi** (anti-AI) | `references/indonesian-akademik-humanis.md` |

### Laporan PKL SMK — Planner System

**⚠️ JANGAN load semua file sekaligus! Load sesuai fase yang dibutuhkan.**

| File | Isi | Load di Fase |
|------|-----|--------------|
| `references/interview-flow.md` | Panduan interview adaptif 5 fase | **Fase 1** (saat intent detected) |
| `references/jurusan-knowledge.md` | Bank pengetahuan per jurusan (10+) | **Fase 1** (load HANYA section jurusan user) |
| `references/data-schema.md` | Schema JSON `pkl-context.json` | **Fase 2** (saat mulai simpan data) |
| `references/formatting-defaults.md` | Default formatting + opsi kustomisasi | **Fase 2** (saat tanya format preferences) |
| `references/bab-catalog.md` | Katalog modul BAB + logika pemilihan | **Fase 5** (sebelum rekomendasi BAB) |
| `references/front-matter-catalog.md` | Katalog halaman depan + formatting presisi | **Generate** (saat build .docx) |
| `references/docx-helpers-pkl.md` | Helper functions python-docx | **Generate** (load HANYA fungsi yang dipakai) |
| `references/laporan-pkl-landasan-hukum.md` | UU, PP, Kepmendikbud | **Generate** (HANYA jika ada BAB Landasan Teori) |
| `references/indonesian-akademik-humanis.md` | Anti-AI detection | **Post-generate** (saat humanisasi check) |
| `scripts/validate_pkl_data.py` | Validasi kelengkapan data | **Fase 5** (sebelum generate) |
| `examples/sample-pkl-data.json` | Contoh data PKL lengkap | **Referensi** (kalau perlu contoh schema) |

**⚠️ PENTING — HUMANISASI: Dokumen jangan terdengar buatan AI!**

Sebelum kirim, scan dengan `references/indonesian-akademik-humanis.md` dan periksa ciri-ciri AI. Minimal 3 pola AI = harus dihumanisasi.

### Aturan Enumerasi Sesuai Konteks

| Jenis Sub-bab | Enumerasi |
|---------------|-----------|
| Rumusan Masalah | **`1. 2. 3.`** (angka) |
| Batasan Masalah | **`a. b. c.`** (huruf) |
| Tujuan | **`1. 2. 3.`** (angka) |
| Manfaat | **`a. b. c.`** (huruf) |
| Analisis Kebutuhan | **`a. b. c.`** (huruf) |
| Kesimpulan | **`1. 2. 3.`** (angka) |
| Saran | **`1. 2. 3.`** (angka) |

---

## 🔴 Golden Rules (Semua Jenis Dokumen Akademik)

| Aturan | Berlaku Untuk |
|--------|---------------|
| Bullet point `•` **DILARANG** | Makalah & Laporan PKL |
| Enumerasi: `1. 2. 3.` / `a. b. c.` | Makalah & Laporan PKL |
| Times New Roman 12pt | Body text semua |
| Margin kiri 4, kanan 3, atas 3, bawah 3 cm (pedoman SMKN 4; bisa dikustomisasi) | Semua |
| Justify + first-line indent 1.27cm | Semua |
| Judul Bab: 14pt bold center KAPITAL | Semua |
| Sub Bab: 12pt bold left | Semua |
| Daftar Pustaka: hanging indent 1.27cm | Semua |

---

## 📋 PKL Report Planner — Workflow Lengkap

**Trigger**: User bilang "laporan PKL", "laporan praktik kerja", "PKL report", "buat laporan PKL", "laporan magang SMK"

### Prinsip Utama

1. **INTERVIEW DULU, JANGAN LANGSUNG GENERATE** — kumpulkan data lewat percakapan
2. **STRUKTUR DINAMIS** — jumlah BAB (3/4/5/6) ditentukan berdasarkan data, bukan template kaku
3. **USER BISA DROP FILE KAPAN SAJA** — gambar, screenshot, logo → simpan di `pkl-data/assets/`
4. **FORMATTING BISA DIKUSTOMISASI** — margin, font, dll. Default 4-4-3-3 tapi tanyakan
5. **HUMANISASI WAJIB** — scan sebelum kirim

### Workflow Step-by-Step

```
1. DETECT intent → user minta laporan PKL
2. LOAD: references/interview-flow.md (panduan interview)
3. INIT workspace:
   → mkdir -p pkl-data/assets pkl-data/output
   → Buat pkl-data/pkl-context.json kosong (lihat references/data-schema.md)
4. INTERVIEW Fase 1: First Contact
   → Tanya jurusan, perusahaan, durasi
   → LOAD: section jurusan yang relevan dari references/jurusan-knowledge.md
5. INTERVIEW Fase 2: Data Diri & Sekolah
   → Nama, NIS, pembimbing
   → LOAD: references/formatting-defaults.md → tanya margin preferences
6. INTERVIEW Fase 3: Data Perusahaan
   → Alamat, pembimbing industri, pimpinan
7. INTERVIEW Fase 4: Kegiatan & Konten
   → Probing per jurusan, studi kasus, foto
   → Setiap drop file → simpan ke pkl-data/assets/ + catat di JSON
8. UPDATE pkl-data/pkl-context.json dengan semua data
9. VALIDASI: jalankan scripts/validate_pkl_data.py pkl-data/pkl-context.json
10. INTERVIEW Fase 5: Review & Rekomendasi
    → LOAD: references/bab-catalog.md → logika pemilihan BAB
    → Tampilkan ringkasan data + rekomendasi BAB → user confirm/override
11. GENERATE .docx:
    → LOAD: references/front-matter-catalog.md (halaman depan)
    → LOAD: HANYA fungsi yang dipakai dari references/docx-helpers-pkl.md
    → LOAD: references/laporan-pkl-landasan-hukum.md (HANYA jika ada BAB Landasan Teori)
    → Build Python script → jalankan → simpan di pkl-data/output/
12. POST-GENERATE:
    → LOAD: references/indonesian-akademik-humanis.md → humanisasi check
    → Deliver file ke user
```

### Workspace Structure

```
pkl-data/
  pkl-context.json          ← Source of truth (semua data PKL)
  assets/                   ← File yang di-drop user
    logo-sekolah.png
    foto-kegiatan-1.jpg
    screenshot-app.png
  output/                   ← Hasil .docx
    Laporan-PKL-NamaSiswa.docx
```

### Logika Pemilihan BAB (Otomatis + User Override)

Agent analisis data yang terkumpul dan **REKOMENDASIKAN** jumlah BAB:

| Kondisi | Rekomendasi |
|---------|-------------|
| Data minimal (nama + kegiatan dasar) | **3 BAB**: Pendahuluan → Pelaksanaan → Penutup |
| Ada data perusahaan detail (sejarah/visi misi) | **4 BAB**: + Profil Perusahaan |
| Ada profil detail + perlu landasan teori | **5 BAB**: + Landasan Teori |
| Ada studi kasus teknis + analisis mendalam | **6 BAB**: + Pembahasan terpisah |

**Format rekomendasi ke user:**
> "Berdasarkan data kamu, saya sarankan **5 BAB**: BAB I Pendahuluan, BAB II Profil PT X, BAB III Landasan Teori, BAB IV Pelaksanaan PKL, BAB V Penutup. Alasan: kamu punya data perusahaan lengkap. Mau pakai ini atau mau ubah?"

User bisa: setuju, tambah BAB, kurangi BAB, custom susunan.

### Drop File Protocol

Saat user drop/attach file di tengah percakapan:
1. Detect file type (gambar/dokumen/screenshot)
2. Simpan ke `pkl-data/assets/[nama-sanitized]`
3. Catat di `pkl-context.json` → `assets[]` array
4. Respond: "OK, [nama file] sudah saya simpan. Nanti saya masukkan ke laporan."
5. Auto-assign ke BAB yang relevan saat generate

### Anti-Patterns (JANGAN Lakukan)

- ❌ Jangan tanya semua data sekaligus dalam 1 prompt besar
- ❌ Jangan generate tanpa interview (meskipun user bilang "langsung aja")
- ❌ Jangan block karena data gap — catat dan lanjut
- ❌ Jangan generate tanpa konfirmasi struktur BAB ke user
- ❌ Jangan pakai bullet point (•) — pakai `1. 2. 3.` / `a. b. c.`
- ❌ Jangan copy-paste template generic — sesuaikan konteks jurusan + perusahaan

---

## Creating with Python (python-docx)

### Standard Academic Setup

```python
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# Page Setup: Margin kiri 4, kanan 3, atas 3, bawah 3 (pedoman SMKN 4)
for section in doc.sections:
    section.top_margin = Cm(3)
    section.bottom_margin = Cm(3)
    section.left_margin = Cm(4)
    section.right_margin = Cm(3)

# Normal style: Times New Roman 12pt, 1.5 spacing
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5
style.paragraph_format.space_after = Pt(0)

# Heading styles
for level, size, align in [(1, 14, WD_ALIGN_PARAGRAPH.CENTER),
                           (2, 12, WD_ALIGN_PARAGRAPH.LEFT),
                           (3, 12, WD_ALIGN_PARAGRAPH.LEFT)]:
    hs = doc.styles[f'Heading {level}']
    hs.font.name = 'Times New Roman'
    hs.font.size = Pt(size)
    hs.font.bold = True
    hs.font.color.rgb = RGBColor(0, 0, 0)
    hs.paragraph_format.alignment = align
    hs.paragraph_format.line_spacing = 1.5
```

### Helper Functions

Load dari reference file yang sesuai untuk daftar lengkap helper. Semua reference punya:
- `add_body()` — body paragraph justify
- `add_heading_text()` — heading TNR
- `add_centered()` — centered text
- `add_numbered()` — `1. 2. 3.`
- `add_lettered()` — `a. b. c.`
- `add_table()` — grid table
- `add_daftar_pustaka()` — hanging indent

---

## Creating with docx-js (Node.js) — Alternative

> **Lihat `references/docx-js-reference.md`** untuk contoh lengkap docx-js (Node.js). Hanya dipakai jika python-docx tidak tersedia. **Untuk PKL, selalu pakai python-docx.**

---

## Editing Existing Documents (XML approach)

1. **Unpack:** Extract XML from .docx
2. **Edit XML:** Make targeted changes
3. **Pack:** Validate and recreate .docx

---

## Pitfalls

- `python-docx` ada di system Python 3.13, BUKAN di Hermes venv.
- Heading style `size` diset di style definition — jangan khawatir kalau `read_back` menunjukkan None.
- Daftar isi harus manual (tab stops) di python-docx.
- File docx disimpan di `pkl-data/output/<nama-file>.docx` (untuk PKL) atau `~/projects/<nama-file>.docx` (umum).
- **⚠️ String-quoting pitfall:** Dalam Python script, PASTIKAN semua baris dalam satu concatenation pakai quote YANG SAMA — jangan campur `'` dan `"`.
- **🔴 NO BULLET POINTS** di makalah/laporan akademik Indonesia — pakai `a. b. c.` / `1. 2. 3.`
- **📋 PKL PLANNER:** Selalu interview dulu sebelum generate. Jangan skip langsung ke generate walaupun user minta cepat.
- **📋 PKL PLANNER:** Jumlah BAB = REKOMENDASI agent berdasarkan data + user bisa override/custom.
- **📋 PKL PLANNER:** Drop file kapan saja → simpan di assets/ → catat di JSON → assign ke BAB saat generate.
- Saat user minta makalah dari project codebase: eksplor dulu (pubspec, main, router, model, DB schema), mapping ke tiap bab, baru generate.

