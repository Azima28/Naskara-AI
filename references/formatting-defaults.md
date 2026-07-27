# Formatting Defaults — Opsi Kustomisasi Format Laporan PKL

Default values + apa yang bisa dikustomisasi user.

---

## Default Configuration

```yaml
kertas: A4  # 21.01 x 29.7 cm

margin:
  atas: 4      # cm — default, bisa diubah
  bawah: 3     # cm
  kiri: 4      # cm — lebih besar untuk jilid
  kanan: 3     # cm

font:
  nama: "Times New Roman"
  body_size: 12          # pt
  heading_bab_size: 14   # pt
  heading_sub_size: 12   # pt
  cover_judul_size: 20   # pt
  cover_subtitle_size: 14  # pt
  cover_nama_font: "Times New Roman"  # atau Arial (Niken pakai Arial)
  cover_nama_size: 16    # pt
  pengesahan_industri_size: 18  # pt
  pengesahan_sekolah_size: 16   # pt
  caption_size: 10       # pt

spasi:
  body: 1.5
  tabel: 1.0
  pengesahan_industri: 1.9  # longgar untuk TTD
  cover: 1.15               # lebih rapat

alignment:
  body: justify
  heading_bab: center
  heading_sub: left
  cover: center

indent:
  first_line: 1.27  # cm — indent paragraf pertama
  daftar_pustaka_hanging: 1.27  # cm

heading_bab:
  format: "BAB {romawi} {JUDUL KAPITAL}"
  style: "Heading 1"
  font_size: 14
  bold: true
  center: true
  color: "000000"  # hitam

heading_sub:
  format: "{nomor_bab}.{nomor_sub} {Judul}"
  style: "Heading 2"
  font_size: 12
  bold: true
  left: true
  color: "000000"

heading_subsub:
  style: "Heading 3"
  font_size: 12
  bold: true
  left: true

penomoran_halaman:
  cover: none
  front_matter:
    format: "lowerRoman"
    start: 1
    position: "center_bottom"
  bab:
    format: "arabic"
    start: 1
    position: "right_top"
    first_page_of_bab: "center_bottom"

enumerasi:
  rumusan_masalah: "angka"    # 1. 2. 3.
  batasan_masalah: "huruf"    # a. b. c.
  tujuan: "angka"             # 1. 2. 3.
  manfaat: "huruf"            # a. b. c.
  analisis_kebutuhan: "huruf" # a. b. c.
  kesimpulan: "angka"         # 1. 2. 3.
  saran: "angka"              # 1. 2. 3.
  kegiatan: "huruf"           # a. b. c.

larangan:
  - "Bullet point (•) DILARANG di semua konteks akademik"
  - "Dash list (- item) DILARANG"
  - "Hanya gunakan 1. 2. 3. atau a. b. c."
```

---

## Customizable Fields

Saat interview (Fase 2), agent tanyakan:

### Margin
> "Margin default 4-4-3-3 cm (atas-kiri-bawah-kanan). Mau diubah atau udah OK?"

Opsi umum:
| Preset | Atas | Bawah | Kiri | Kanan |
|--------|------|-------|------|-------|
| Default | 4 | 3 | 4 | 3 |
| Standar B | 3 | 3 | 4 | 3 |
| Standar C | 4 | 4 | 4 | 3 |
| Custom | ? | ? | ? | ? |

### Jumlah BAB
> "Berdasarkan data kamu, saya sarankan [N] BAB. Mau ikut atau mau custom?"

### Halaman Depan
> "Mau pakai halaman Identitas Siswa dan Identitas Industri? (beberapa sekolah gak pakai)"

### Pedoman Sekolah
> "Sekolah punya pedoman format sendiri? Kalau ada, drop aja nanti saya ikutin"

Kalau user drop pedoman sekolah → agent baca dan override defaults.

---

## Formatting yang TIDAK Bisa Diubah (Golden Rules)

| Rule | Alasan |
|------|--------|
| Font body = Times New Roman 12pt | Standar karya ilmiah Indonesia |
| Spasi body = 1.5 | Standar karya ilmiah |
| Alignment body = Justify | Standar karya ilmiah |
| No bullet point | Standar akademik Indonesia |
| Heading BAB = Center Bold Kapital | Standar semua sekolah |
| Daftar Pustaka = Hanging indent | Standar sitasi |
