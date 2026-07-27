# Standar Master Laporan PKL SMK (Standar Vokasi & Industri Real - 100% Presisi Niken)

Dokumen ini adalah **pedoman baku dan aturan absolut** dalam pembuatan Laporan Praktik Kerja Lapangan (PKL) SMK 6 BAB yang 100% presisi mengikuti dokumen sampel fisik (`LAPORAN PKL NIKEN FIXED.docx`).

---

## 🔴 Aturan Absolut Layout & Structure (Reverse-Engineered 21 Seksi)

### 1. Structure Halaman Depan (Front Matter Wajib - 8 Lembar Halaman)
1. **Cover Luar (Sampul Jilid):** Judul PKL + Nama + Kop Sekolah Lengkap (Kop Provinsi, Dinas, SMKN 4, NIS, NPSN, NSS).
2. **Cover Dalam (Lembar Judul):** Identik 100% dengan Cover Luar (Halaman ganda wajib sebelum Pengesahan).
3. **Pengesahan Industri (Halaman i):** Pembimbing Industri I di atas, disusul Kepala Cabang / CEO di bawah secara vertikal center (Spasi longgar `line_spacing=1.9`). Dilarang keras menggunakan tanda tangan menyamping atau menggabung string PT ganda.
4. **Pengesahan Sekolah (Halaman ii):** Ketua Kompetensi Keahlian & Pembimbing Sekolah disusul paragraf menyamping bertingkat dengan **Tab Stop Presisi (`11.83 cm` & `9.84 cm`)**, serta Waka Humas center di bawah.
5. **Identitas Siswa (Halaman iii):** Tabel 3 Kolom tanpa border (`Nama Siswa`, `Nomor Induk`, `Tempat Tgl Lahir`, `Gol Darah`, `Kontak`, `Ortu`), disusul form tanda tangan *"Yang Bersangkutan"* di kanan.
6. **Identitas Industri / Instansi (Halaman iv):** Tabel 3 Kolom 21 Baris tanpa border memuat 4 header seksi (*Perusahaan/Instansi*, *Pimpinan*, *HRD/Ka.TU*, *Pembimbing*) beserta data lengkap.
7. **Kata Pengantar (Halaman v):** Ucapan syukur, 7-tingkat hierarki terima kasih, harapan/permohonan maaf, tanggal & tanda tangan Penulis di kanan bawah.
8. **Daftar Isi (Halaman vi):** Paragraf dengan style bawaan Word **`toc 1`** (Level 1 / BAB / Front Matter), **`toc 2`** (Level 2 / Sub-bab `1.1`), dan **`toc 3`** (Level 3 / Sub-sub-bab `a)`) menggunakan **Tab Stop Dots (`13.5 cm`)** & right alignment nomor halaman. Tidak boleh menggunakan style `Normal` agar navigasi dan hirarki inden Word terbentuk sempurna.

---

## 🔴 Larangan Keras Anti-Redundansi & Anti-Artifak

1. **Dilarang Pengulangan String PT:** Dilarang keras menghasilkan string seperti `PT. PT. Newus Technology` atau `PT. PT. Technology`. Wajib disanitasi menjadi `PT Newus Technology Indonesia`.
2. **Dilarang Membawa Sisa Template Niken:** Dilarang keras menyisakan nama `Niken Vena As-Syifa`, NIS `13979`, atau `Reksa Finance` pada dokumen generasi jurusan lain/RPL. Wajib diganti bersih.
3. **Dilarang Tumpang Tindih Layout:** Setiap Halaman Pengesahan (Industri & Sekolah) wajib dipisah dengan `doc.add_page_break()` agar berdiri di halaman A4 mandiri.

---

## 📋 Implementation Code Pattern (python-docx)

```python
# Helper Daftar Isi Native Word Styles
def add_toc_p(doc, text, page, style_name="toc 1"):
    p = doc.add_paragraph(style=style_name)
    r_left = p.add_run(text)
    r_left.font.name = 'Times New Roman'
    r_left.font.size = Pt(12)
    r_right = p.add_run("\t" + page)
    r_right.font.name = 'Times New Roman'
    r_right.font.size = Pt(12)

# Helper Pengesahan Sekolah Tab Stops
p_sch_head = doc.add_paragraph()
p_sch_head.paragraph_format.tab_stops.add_tab_stop(Cm(11.83), WD_TAB_ALIGNMENT.LEFT)
p_sch_head.add_run("Ketua Kompetensi Keahlian\tPembimbing")
```
