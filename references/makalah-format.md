# Format Makalah Akademik Indonesia

**Gunakan saat user minta bikin MAKALAH.** Saya harus nentuin struktur sendiri secara dinamis.

---

## 🔴 Aturan Mutlak

| Aturan | Keputusan |
|--------|-----------|
| Bullet point | DILARANG KERAS |
| Enumerasi angka 1. 2. 3. | Rumusan masalah kesimpulan saran |
| Enumerasi huruf a. b. c. | Batasan masalah manfaat kebutuhan |
| Font | Times New Roman 12pt |
| Spasi | 1.5 line spacing |
| Margin | 4-4-3-3 cm |
| Alignment | Justify |
| H1 Judul Bab | 14pt Bold Center KAPITAL |
| H2 Sub Bab | 12pt Bold Left |
| Indent paragraf | 1.27 cm |
| Kata terlarang | Saya Kita Anda Penulis kecuali Kata Pengantar |
| Daftar Pustaka | Hanging indent 1.27cm |

---

## Cara Saya Nentuin Struktur

### Analisis Otomatis

Saya ANALISIS prompt user untuk nentuin:

| Indikator | Simpulan |
|-----------|----------|
| Ada "project" "aplikasi" "Flutter" "RPL" | Makalah teknis butuh BAB Metode + Hasil |
| Ada "studi literatur" "kajian" | Makalah teoritis butuh BAB Kajian Pustaka |
| User sebut judul project | Ambil konten dari codebase |
| User gak bilang jumlah BAB | Saya tentuin (3-5 sesuai kompleksitas) |
| User bilang jumlah BAB | Ikuti permintaan |
| Project punya DB schema + diagram | BAB III cocok untuk Metode |
| Project punya screenshot hasil | BAB IV cocok untuk Hasil |

### Logika Penentuan Jumlah BAB

| Kondisi | BAB | Struktur |
|---------|-----|----------|
| Project sederhana / user minta singkat | 3 | Pendahuluan  Pembahasan  Penutup |
| Project teknis dengan teori | 4 | + Tinjauan Pustaka |
| Project lengkap (analisis desain implementasi testing) | 5 | + Metode + Hasil |

### Penentuan Sub-Bab Tiap BAB

BAB I Pendahuluan:
- Latar Belakang WAJIB ada
- Rumusan Masalah: 1.2 kalau ada pertanyaan spesifik
- Batasan Masalah: 1.3 kalau scope perlu dijelaskan
- Tujuan: 1.4 WAJIB ada
- Manfaat: 1.5 kalau perlu

BAB II:
- Lihat konteks: teori / tinjauan pustaka / profil perusahaan
- Sub-bab disesuaikan

BAB III dst:
- Tergantung judul bab yang saya tentukan
- Sub-bab saya bikin sesuai kebutuhan konten

---

## Contoh Hasil Analisis

Prompt: "Buat makalah tentang project Kantin Digital"
Analisis saya:
- Ada project Flutter + Supabase  makalah teknis
- Butuh teori (Flutter Supabase NFC)  BAB II Tinjauan Pustaka
- Butuh metode (Waterfall perancangan DB)  BAB III Metode
- Ada hasil (screenshot fitur testing)  BAB IV Hasil
- 5 BAB

Prompt: "Buat makalah 3 BAB tentang pengembangan aplikasi kasir"
Analisis saya:
- User minta 3 BAB
- Project kasir  cukup Pendahuluan Pembahasan Penutup
- BAB II gabung metode + hasil
- 3 BAB

---

## 🐍 Helper Functions Python-docx

```python
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

doc = Document()

# Page setup
for section in doc.sections:
    section.top_margin = Cm(4)
    section.bottom_margin = Cm(3)
    section.left_margin = Cm(4)
    section.right_margin = Cm(3)

# Style setup
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5
style.paragraph_format.space_after = Pt(0)

# Headings
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

def add_body(text):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(1.27)
    p.paragraph_format.line_spacing = 1.5
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
    return p

def add_heading_text(text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = 'Times New Roman'; run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_centered(text, bold=False, size=12, italic=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.font.name = 'Times New Roman'; run.font.size = Pt(size)
    run.bold = bold; run.italic = italic
    return p

def add_numbered(text, number, indent_level=0):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
    p.paragraph_format.first_line_indent = Cm(-0.63)
    run = p.add_run(f'{number}. {text}')
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
    return p

def add_lettered(text, letter, indent_level=0):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
    p.paragraph_format.first_line_indent = Cm(-0.63)
    run = p.add_run(f'{letter}. {text}')
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
    return p

def add_spacing(lines=1):
    for _ in range(lines):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(''); run.font.name = 'Times New Roman'; run.font.size = Pt(12)

def add_table(headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]; cell.text = ''
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(h); run.bold = True
        run.font.name = 'Times New Roman'; run.font.size = Pt(11)
    for r_idx, row_data in enumerate(rows):
        for c_idx, cell_text in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]; cell.text = ''
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(str(cell_text))
            run.font.name = 'Times New Roman'; run.font.size = Pt(11)

def add_daftar_pustaka(refs):
    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27)
        p.paragraph_format.first_line_indent = Cm(-1.27)
        run = p.add_run(ref)
        run.font.name = 'Times New Roman'; run.font.size = Pt(12)

def add_page_break():
    doc.add_page_break()

def save_docx(filename):
    import os
    path = os.path.expanduser(f'~/{filename}')
    doc.save(path)
    print(f'Tersimpan di: {path}')
    return path
```

---

## Panduan Cepat Generate

1. Load file ini
2. Analisis prompt user + project codebase
3. Tentukan struktur (jumlah BAB sub-bab konten)
4. Eksplor project (pubspec main router DB schema)
5. Generate script kirim .docx via MEDIA

### Pitfall
- JANGAN pake asumsi BAB selalu 5
- JANGAN tanya user jumlah BAB kecuali mereka minta
- SAYA yang mutusin struktur
- String-quoting: jangan campur petik satu dan dua
- Ganti bullet dengan a. b. c. atau 1. 2. 3.
