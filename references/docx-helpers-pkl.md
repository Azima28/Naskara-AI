# DOCX Helpers PKL — Helper Functions python-docx untuk Laporan PKL

Semua fungsi python-docx yang siap pakai untuk generate Laporan PKL SMK. Presisi berdasarkan reverse-engineering `LAPORAN PKL NIKEN FIXED.docx` + standar umum.

---

## Setup

```python
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import os

doc = Document()

def setup_document(margin=None):
    """Setup page + styles. margin = dict {atas, bawah, kiri, kanan} in cm"""
    m = margin or {"atas": 4, "bawah": 3, "kiri": 4, "kanan": 3}
    for section in doc.sections:
        section.page_width = Cm(21.01)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(m["atas"])
        section.bottom_margin = Cm(m["bawah"])
        section.left_margin = Cm(m["kiri"])
        section.right_margin = Cm(m["kanan"])
    
    # Normal style
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(12)
    style.paragraph_format.line_spacing = 1.5
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.space_before = Pt(0)
    
    # Heading styles
    for level, size, align in [
        (1, 14, WD_ALIGN_PARAGRAPH.CENTER),
        (2, 12, WD_ALIGN_PARAGRAPH.LEFT),
        (3, 12, WD_ALIGN_PARAGRAPH.LEFT)
    ]:
        hs = doc.styles[f'Heading {level}']
        hs.font.name = 'Times New Roman'
        hs.font.size = Pt(size)
        hs.font.bold = True
        hs.font.color.rgb = RGBColor(0, 0, 0)
        hs.paragraph_format.alignment = align
        hs.paragraph_format.line_spacing = 1.5
        hs.paragraph_format.space_after = Pt(0)
```

---

## Page Numbering

```python
def setup_page_numbering(section, fmt='arabic', start=1):
    """Set page numbering format for a section.
    fmt: 'arabic', 'lowerRoman', 'upperRoman', 'none'
    """
    sectPr = section._sectPr
    # Remove existing pgNumType
    for el in sectPr.findall(qn('w:pgNumType')):
        sectPr.remove(el)
    
    if fmt == 'none':
        return
    
    fmt_map = {
        'arabic': 'decimal',
        'lowerRoman': 'lowerRoman',
        'upperRoman': 'upperRoman'
    }
    
    pg_num = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="{fmt_map.get(fmt, "decimal")}" w:start="{start}"/>')
    sectPr.append(pg_num)

def add_section_break(margin=None):
    """Add a new section with page break."""
    new_section = doc.add_section()
    m = margin or {"atas": 4, "bawah": 3, "kiri": 4, "kanan": 3}
    new_section.top_margin = Cm(m["atas"])
    new_section.bottom_margin = Cm(m["bawah"])
    new_section.left_margin = Cm(m["kiri"])
    new_section.right_margin = Cm(m["kanan"])
    return new_section
```

---

## Cover

```python
def add_cover(data, config=None):
    """Generate cover luar.
    data: dict with siswa, sekolah, perusahaan, pkl
    config: optional formatting overrides
    """
    # Judul LAPORAN
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("LAPORAN")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(20)
    run.bold = True
    
    add_spacing(1)
    
    # PRAKTEK KERJA LAPANGAN (PKL)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("PRAKTEK KERJA LAPANGAN (PKL)")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(20)
    run.bold = True
    
    # DI [PERUSAHAAN]
    nama_perusahaan = data.get("perusahaan", {}).get("nama", "[NAMA PERUSAHAAN]")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"DI {nama_perusahaan.upper()}")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(20)
    run.bold = True
    
    add_spacing(1)
    
    # Subtitle italic
    jurusan = data.get("siswa", {}).get("jurusan", "[Jurusan]")
    sekolah = data.get("sekolah", {}).get("nama", "[Nama Sekolah]")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(f"Disusun untuk memenuhi salah satu persyaratan dalam menyelesaikan studi di {sekolah} kompetensi keahlian {jurusan}")
    run.font.size = Pt(14)
    run.italic = True
    
    add_spacing(1)
    
    # disusun oleh
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("disusun oleh :")
    run.font.size = Pt(14)
    
    # Nama + NIS
    nama = data.get("siswa", {}).get("nama", "[Nama Siswa]")
    nis = data.get("siswa", {}).get("nis", "[NIS]")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"{nama} ")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(16)
    run.bold = True
    run.underline = True
    run2 = p.add_run(f"NIS. {nis}")
    run2.font.name = 'Times New Roman'
    run2.font.size = Pt(16)
    run2.bold = True
    
    add_spacing(2)
    
    # Logo sekolah (kalau ada)
    logo_path = data.get("sekolah", {}).get("logo_path")
    if logo_path and os.path.exists(logo_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(logo_path, width=Cm(3))
        add_spacing(1)
    
    # Kop sekolah
    kop = data.get("sekolah", {}).get("kop", {})
    kop_lines = [
        (kop.get("baris_1", "PEMERINTAH PROVINSI [...]"), 14, False),
        (kop.get("baris_2", "DINAS PENDIDIKAN DAN KEBUDAYAAN"), 14, False),
        (data.get("sekolah", {}).get("nama_lengkap", sekolah).upper(), 14, True),
        (data.get("sekolah", {}).get("alamat", "[Alamat Sekolah]"), 14, False),
    ]
    for text, size, bold in kop_lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.size = Pt(size)
        run.bold = bold
    
    # Baris kecil (email, NPSN)
    small_lines = []
    email = data.get("sekolah", {}).get("email", "")
    website = data.get("sekolah", {}).get("website", "")
    if email or website:
        small_lines.append(f"E-mail: {email}    {website}")
    npsn = kop.get("npsn", "")
    nss = kop.get("nss", "")
    if npsn or nss:
        small_lines.append(f"NPSN : {npsn}            NSS : {nss}")
    
    for text in small_lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.size = Pt(12)
```

---

## Pengesahan

```python
def add_pengesahan_industri(data):
    """Halaman pengesahan industri. Layout vertikal, ls=1.9"""
    nama_perusahaan = data.get("perusahaan", {}).get("nama", "[PERUSAHAAN]")
    
    h = doc.add_heading("HALAMAN PENGESAHAN", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    h2 = doc.add_heading(f"PADA {nama_perusahaan.upper()}", level=1)
    for run in h2.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    # Menyetujui
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.9
    run = p.add_run("Menyetujui,")
    run.font.size = Pt(18)
    run.bold = True
    
    add_spacing(1)
    
    # Pembimbing Industri
    pembimbing = data.get("perusahaan", {}).get("pembimbing_industri", {})
    _add_ttd_block(
        label="Pembimbing Industri",
        nama=pembimbing.get("nama", "[Nama Pembimbing]"),
        size=18
    )
    
    add_spacing(1)
    
    # Pimpinan
    pimpinan = data.get("perusahaan", {}).get("pimpinan", {})
    _add_ttd_block(
        label=pimpinan.get("jabatan", "Kepala Cabang"),
        nama=pimpinan.get("nama", "[Nama Pimpinan]"),
        size=18
    )

def add_pengesahan_sekolah(data):
    """Halaman pengesahan sekolah. Tab stop presisi 11.83cm & 9.84cm"""
    sekolah_nama = data.get("sekolah", {}).get("nama", "[SEKOLAH]")
    
    h = doc.add_heading("HALAMAN PENGESAHAN", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    h2 = doc.add_heading(f"PADA {sekolah_nama.upper()}", level=1)
    for run in h2.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    # Menyetujui
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("Menyetujui,")
    run.font.size = Pt(16)
    run.bold = True
    
    add_spacing(1)
    
    # Ketua KK [TAB] Pembimbing — tab stop @11.83cm
    ketua = data.get("sekolah", {}).get("ketua_kk", {})
    pembimbing = data.get("sekolah", {}).get("pembimbing_sekolah", {})
    
    p = doc.add_paragraph()
    p.paragraph_format.tab_stops.add_tab_stop(Cm(11.83), WD_TAB_ALIGNMENT.LEFT)
    run = p.add_run("Ketua Kompetensi Keahlian\tPembimbing")
    run.font.size = Pt(16)
    run.bold = True
    
    add_spacing(3)  # ruang TTD
    
    # Nama [TAB] Nama — tab stop @9.84cm
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.tab_stops.add_tab_stop(Cm(9.84), WD_TAB_ALIGNMENT.LEFT)
    
    nama_kk = ketua.get("nama", "[Nama Ketua KK]")
    nama_pb = pembimbing.get("nama", "[Nama Pembimbing]")
    nip_kk = ketua.get("nip", "")
    nip_pb = pembimbing.get("nip", "")
    
    run = p.add_run(nama_kk)
    run.font.size = Pt(16)
    run.bold = True
    run.underline = True
    run2 = p.add_run(f"\t{nama_pb}")
    run2.font.size = Pt(16)
    run2.bold = True
    run2.underline = True
    
    # NIP line
    if nip_kk or nip_pb:
        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.tab_stops.add_tab_stop(Cm(9.84), WD_TAB_ALIGNMENT.LEFT)
        run = p2.add_run(f"NIP.{nip_kk}" if nip_kk else "")
        run.font.size = Pt(16)
        run2 = p2.add_run(f"\tNIP.{nip_pb}" if nip_pb else "")
        run2.font.size = Pt(16)
    
    add_spacing(2)
    
    # Waka Humas
    waka = data.get("sekolah", {}).get("waka_humas", {})
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"Waka Humas {sekolah_nama}")
    run.font.size = Pt(16)
    run.bold = True
    
    add_spacing(3)  # ruang TTD
    
    nama_waka = waka.get("nama", "[Nama Waka Humas]")
    nip_waka = waka.get("nip", "")
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(nama_waka)
    run.font.size = Pt(16)
    run.bold = True
    run.underline = True
    
    if nip_waka:
        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p2.add_run(f"NIP.{nip_waka}")
        run.font.size = Pt(16)

def _add_ttd_block(label, nama, size=18, nip=None):
    """Helper: blok label + ruang TTD + nama underline"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(label)
    run.font.size = Pt(size)
    run.bold = True
    
    add_spacing(3)  # ruang TTD
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(nama)
    run.font.size = Pt(size)
    run.bold = True
    run.underline = True
    
    if nip:
        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p2.add_run(f"NIP. {nip}")
        run.font.size = Pt(size)
```

---

## Identitas (Tabel Tanpa Border)

```python
def add_identitas_siswa(data):
    """Tabel identitas siswa 3 kolom tanpa border"""
    h = doc.add_heading("IDENTITAS SISWA", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    siswa = data.get("siswa", {})
    rows_data = [
        ("Nama Siswa", siswa.get("nama", "")),
        ("Nomor Induk", siswa.get("nis", "")),
        ("Tempat, Tgl.lahir", f"{siswa.get('tempat_lahir', '')}, {siswa.get('tanggal_lahir', '')}"),
        ("Jenis Kelamin", siswa.get("jenis_kelamin", "")),
        ("Golongan Darah", siswa.get("golongan_darah", "")),
        ("Catatan Kesehatan", siswa.get("catatan_kesehatan", "-")),
        ("No. Telp/Hp siswa", siswa.get("no_telp", "")),
        ("Nama Sekolah", data.get("sekolah", {}).get("nama", "")),
        ("Alamat Sekolah", data.get("sekolah", {}).get("alamat", "")),
        ("No. Telp Sekolah", data.get("sekolah", {}).get("telp", "")),
        ("Nama Orang Tua/Wali", siswa.get("nama_ortu", "")),
        ("Alamat Orang Tua/Wali", siswa.get("alamat_ortu", "")),
        ("No. Telp Orang Tua/Wali", siswa.get("telp_ortu", "")),
    ]
    
    _add_borderless_table(rows_data)
    
    add_spacing(2)
    
    # Tanda tangan
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run("Yang Bersangkutan,")
    run.font.size = Pt(14)
    run.bold = True
    
    add_spacing(3)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.left_indent = Cm(11.43)
    run = p.add_run(siswa.get("nama", "[Nama]"))
    run.font.size = Pt(14)
    run.bold = True
    run.underline = True

def add_identitas_industri(data):
    """Tabel identitas industri 3 kolom 21 baris tanpa border"""
    h = doc.add_heading("IDENTITAS INDUSTRI / INSTANSI", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    perusahaan = data.get("perusahaan", {})
    pimpinan = perusahaan.get("pimpinan", {})
    hrd = perusahaan.get("hrd", {})
    pembimbing = perusahaan.get("pembimbing_industri", {})
    
    rows_data = [
        # Seksi 1: Perusahaan
        ("Perusahaan / Instansi", None),  # header
        ("Nama", perusahaan.get("nama", "")),
        ("Alamat", perusahaan.get("alamat", "")),
        ("Bidang Produk/Jasa", perusahaan.get("bidang_usaha", "")),
        ("Status", perusahaan.get("status", "")),
        ("Nomor Telp", perusahaan.get("no_telp", "")),
        ("Nomor Fax.", perusahaan.get("fax", "-")),
        ("E-mail", perusahaan.get("email", "-")),
        ("Website", perusahaan.get("website", "-")),
        # Seksi 2: Pimpinan
        ("Pimpinan", None),  # header
        ("Jabatan", pimpinan.get("jabatan", "")),
        ("Nama", pimpinan.get("nama", "")),
        # Seksi 3: HRD
        ("HRD / Ka. Tu", None),  # header
        ("Nama", hrd.get("nama", "")),
        ("No. Telp - Ext.", hrd.get("telp", "")),
        ("E-mail", hrd.get("email", "")),
        # Seksi 4: Pembimbing
        ("Pembimbing", None),  # header
        ("Jabatan", pembimbing.get("jabatan", "")),
        ("Nama", pembimbing.get("nama", "")),
        ("No. Telp - Ext.", pembimbing.get("telp", "")),
        ("E-mail", pembimbing.get("email", "")),
    ]
    
    table = doc.add_table(rows=len(rows_data), cols=3)
    table.style = 'Normal Table'
    _remove_all_borders(table)
    
    for i, (label, value) in enumerate(rows_data):
        cells = table.rows[i].cells
        _set_cell_text(cells[0], label, bold=(value is None))
        if value is None:
            # Header row — merge or leave empty
            _set_cell_text(cells[1], "")
            _set_cell_text(cells[2], "")
        else:
            _set_cell_text(cells[1], ":")
            _set_cell_text(cells[2], value)

def _add_borderless_table(rows_data):
    """Create a borderless key-value table"""
    table = doc.add_table(rows=len(rows_data), cols=3)
    table.style = 'Normal Table'
    _remove_all_borders(table)
    
    for i, (label, value) in enumerate(rows_data):
        cells = table.rows[i].cells
        _set_cell_text(cells[0], label)
        _set_cell_text(cells[1], ":")
        _set_cell_text(cells[2], f" {value}")

def _set_cell_text(cell, text, bold=False, size=12):
    """Set cell text with formatting"""
    cell.text = ''
    p = cell.paragraphs[0]
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(text))
    run.font.name = 'Times New Roman'
    run.font.size = Pt(size)
    run.bold = bold

def _remove_all_borders(table):
    """Remove all borders from a table"""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else parse_xml(f'<w:tblPr {nsdecls("w")}/>') 
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '</w:tblBorders>'
    )
    tblPr.append(borders)
```

---

## Kata Pengantar

```python
def add_kata_pengantar(data):
    """Generate kata pengantar dengan hierarki terima kasih"""
    h = doc.add_heading("KATA PENGANTAR", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    kp = data.get("kata_pengantar", {})
    nama = data.get("siswa", {}).get("nama", "[Nama]")
    
    # Syukur
    syukur = kp.get("ucapan_syukur", "Puji syukur kepada Tuhan Yang Maha Esa, karena karunia dan nikmat yang diberikan-Nya sehingga Penulis dapat menyelesaikan penyusunan Laporan Praktik Kerja Lapangan (PKL) ini tepat pada waktunya.")
    add_body(syukur)
    
    # Tujuan laporan
    add_body("Laporan ini Penulis susun sebagai salah satu bentuk persyaratan untuk memenuhi tugas dalam menyelesaikan pendidikan di sekolah.")
    
    # Intro terima kasih
    add_body("Pada kesempatan ini juga, Penulis mengucapkan terima kasih atas bimbingan dan pelajaran yang telah diberikan kepada:")
    
    # Hierarki terima kasih
    hierarki = kp.get("hierarki_terima_kasih", [])
    if not hierarki:
        hierarki = _default_hierarki(data)
    
    for item in hierarki:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.63)
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(item)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
    
    add_spacing(1)
    
    # Harapan
    harapan = kp.get("harapan", "Penulis berharap semoga hasil laporan yang Penulis susun ini dapat bermanfaat bagi peningkatan mutu pendidikan di masa yang akan datang. Penulis juga meminta maaf atas segala kekurangan dalam penyusunan laporan ini.")
    add_body(harapan)
    
    add_spacing(2)
    
    # Tanggal + TTD
    kota = kp.get("kota", data.get("sekolah", {}).get("kota", "[Kota]"))
    tanggal = kp.get("tanggal", "[Tanggal]")
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run(f"{kota}, {tanggal}")
    run.font.size = Pt(12)
    run.bold = True
    
    add_spacing(3)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.left_indent = Cm(11.43)
    run = p.add_run(nama)
    run.font.size = Pt(12)
    run.underline = True
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.left_indent = Cm(11.43)
    run = p.add_run("Penulis")
    run.font.size = Pt(12)
    run.bold = True

def _default_hierarki(data):
    """Generate default hierarki terima kasih dari data"""
    items = ["Tuhan Yang Maha Esa, atas berkat dan rahmat-Nya Penulis bisa menyusun laporan Praktik Kerja Lapangan ini."]
    items.append("Kedua Orang Tua, yang selalu memberi dukungan dan motivasi kepada Penulis.")
    
    pb_ind = data.get("perusahaan", {}).get("pembimbing_industri", {})
    if pb_ind.get("nama"):
        items.append(f"{pb_ind['nama']}, selaku pembimbing industri yang telah memberikan bimbingan selama pelaksanaan PKL.")
    
    kepsek = data.get("sekolah", {}).get("kepala_sekolah", {})
    if kepsek.get("nama"):
        gelar = kepsek.get("gelar", "")
        items.append(f"{kepsek['nama']}{', ' + gelar if gelar else ''}, selaku kepala sekolah yang telah memberikan izin dan kesempatan untuk melaksanakan PKL.")
    
    ketua = data.get("sekolah", {}).get("ketua_kk", {})
    if ketua.get("nama"):
        items.append(f"{ketua['nama']}, selaku ketua kompetensi keahlian yang telah membantu kelancaran pelaksanaan PKL.")
    
    pb_sek = data.get("sekolah", {}).get("pembimbing_sekolah", {})
    if pb_sek.get("nama"):
        items.append(f"{pb_sek['nama']}, selaku guru pembimbing PKL yang telah memberikan arahan dalam penyusunan laporan.")
    
    items.append("Pihak lain yang tidak dapat Penulis sebutkan satu persatu.")
    return items
```

---

## Daftar Isi

```python
def add_daftar_isi(sections_list):
    """Generate daftar isi dengan TOC styles.
    sections_list: list of (text, page_num, level)
    level: 1=BAB/Front, 2=Sub-bab, 3=Sub-sub-bab
    """
    h = doc.add_heading("DAFTAR ISI", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    add_spacing(1)
    
    style_map = {1: "toc 1", 2: "toc 2", 3: "toc 3"}
    
    for text, page, level in sections_list:
        style_name = style_map.get(level, "toc 1")
        p = doc.add_paragraph(style=style_name)
        
        # Tab stop with dots leader
        p.paragraph_format.tab_stops.add_tab_stop(
            Cm(13.5), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
        )
        
        r_left = p.add_run(text)
        r_left.font.name = 'Times New Roman'
        r_left.font.size = Pt(12)
        
        r_right = p.add_run(f"\t{page}")
        r_right.font.name = 'Times New Roman'
        r_right.font.size = Pt(12)
```

---

## Content Helpers

```python
def add_body(text):
    """Body paragraph: justify, first-line indent 1.27cm, TNR 12pt, 1.5 spacing"""
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(1.27)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    return p

def add_bab_heading(nomor, judul):
    """BAB I PENDAHULUAN — Heading 1 center bold kapital"""
    romans = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII"}
    roman = romans.get(nomor, str(nomor))
    h = doc.add_heading(f"BAB {roman} {judul.upper()}", level=1)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_sub_heading(nomor_bab, nomor_sub, judul):
    """1.1 Latar Belakang — Heading 2 left bold"""
    h = doc.add_heading(f"{nomor_bab}.{nomor_sub} {judul}", level=2)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_numbered(text, number, indent_level=0):
    """Numbered item: 1. text"""
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
    p.paragraph_format.first_line_indent = Cm(-0.63)
    run = p.add_run(f"{number}. {text}")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    return p

def add_lettered(text, letter, indent_level=0):
    """Lettered item: a. text"""
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
    p.paragraph_format.first_line_indent = Cm(-0.63)
    run = p.add_run(f"{letter}. {text}")
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    return p

def add_image(image_path, caption="", width_cm=10):
    """Insert image with caption"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(image_path, width=Cm(width_cm))
    
    if caption:
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.style = doc.styles.get('Caption', doc.styles['Normal'])
        run = p_cap.add_run(caption)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)

def add_table(headers, rows):
    """Grid table for data"""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ''
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(h)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
    
    for r_idx, row_data in enumerate(rows):
        for c_idx, cell_text in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = ''
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(str(cell_text))
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
    
    return table

def add_daftar_pustaka(refs):
    """Daftar pustaka with hanging indent"""
    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27)
        p.paragraph_format.first_line_indent = Cm(-1.27)
        run = p.add_run(ref)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)

def add_page_break():
    doc.add_page_break()

def add_spacing(lines=1):
    for _ in range(lines):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run('')
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)

def save_docx(filename, directory=None):
    if directory:
        path = os.path.join(directory, filename)
    else:
        path = os.path.expanduser(f"~/projects/{filename}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc.save(path)
    print(f"Tersimpan di: {path}")
    return path
```
