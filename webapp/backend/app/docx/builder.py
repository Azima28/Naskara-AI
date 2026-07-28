"""PklDocBuilder — refactor references/docx-helpers-pkl.md jadi class stateless.

Perbedaan dengan aslinya:
- Semua helper jadi METHOD pada class (bukan fungsi modul global).
- Tiap instance pegang `self.doc` sendiri → aman untuk request konkuren.
- Semua nilai presisi (tab 11.83/9.84cm, spacing 1.9, leader 13.5cm) dipertahankan.

Sumber kebenaran format: references/docx-helpers-pkl.md + references/formatting-defaults.md.
"""
from __future__ import annotations

import os
from typing import Any

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor

# Pedoman resmi SMKN 4 (1.7.2): kiri 4 cm, kanan 3 cm, atas 3 cm, bawah 3 cm.
DEFAULT_MARGIN = {"atas": 3, "bawah": 3, "kiri": 4, "kanan": 3}

# Ukuran judul default (golden rules SKILL.md: bab 14pt, sub-bab 12pt).
DEFAULT_HEADING_SIZES = {1: 14, 2: 12, 3: 12}

_ROMANS = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII"}

# Garis titik untuk nama yang belum diketahui pada blok tanda tangan —
# konvensi dokumen resmi; tidak pernah mencetak placeholder "[Nama ...]".
SIG_DOTS = "(............................)"


def _sig_name(nama: str | None) -> str:
    """Nama untuk blok tanda tangan; kosong/'-' → garis titik."""
    n = (nama or "").strip()
    return n if n and n != "-" else SIG_DOTS


def _xml_escape(text: str) -> str:
    """Escape karakter khusus XML untuk teks yang disisipkan ke XML mentah."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


class PklDocBuilder:
    """Builder stateless per-request. Tiap instance = satu dokumen."""

    def __init__(
        self,
        margin: dict[str, float] | None = None,
        heading_sizes: dict[int, int] | None = None,
        preset: str = "pedoman",
    ) -> None:
        self.doc = Document()
        self.margin = margin or DEFAULT_MARGIN
        self.heading_sizes = {**DEFAULT_HEADING_SIZES, **(heading_sizes or {})}
        self.preset = preset
        self._bookmark_id = 100  # id unik untuk bookmarkStart/End
        self._sub_counter = 0    # bookmark otomatis untuk sub-bab (level 2)
        self._sub3_counter = 0   # bookmark otomatis untuk sub-sub-bab (level 3)
        # Daftar (level, teks, bookmark) heading yang ditulis — bahan entri
        # Daftar Isi (diisi otomatis oleh add_bab_heading/add_sub_heading).
        self.outline: list[tuple[int, str, str]] = []
        # Paragraf marker tempat entri BAB Daftar Isi disisipkan belakangan.
        self.toc_marker: Any = None
        self.setup_document()

    # ------------------------------------------------------------------ #
    #  Setup & page                                                       #
    # ------------------------------------------------------------------ #
    def setup_document(self) -> None:
        m = self.margin
        for section in self.doc.sections:
            section.page_width = Cm(21.01)
            section.page_height = Cm(29.7)
            section.top_margin = Cm(m["atas"])
            section.bottom_margin = Cm(m["bawah"])
            section.left_margin = Cm(m["kiri"])
            section.right_margin = Cm(m["kanan"])

        # Normal style: TNR 12pt, spasi 1.5
        style = self.doc.styles["Normal"]
        style.font.name = "Times New Roman"
        style.font.size = Pt(12)
        style.paragraph_format.line_spacing = 1.5
        style.paragraph_format.space_after = Pt(0)
        style.paragraph_format.space_before = Pt(0)

        # Heading styles
        for level, align in [
            (1, WD_ALIGN_PARAGRAPH.CENTER),
            (2, WD_ALIGN_PARAGRAPH.LEFT),
            (3, WD_ALIGN_PARAGRAPH.LEFT),
        ]:
            hs = self.doc.styles[f"Heading {level}"]
            hs.font.name = "Times New Roman"
            hs.font.size = Pt(self.heading_sizes[level])
            hs.font.bold = True
            hs.font.color.rgb = RGBColor(0, 0, 0)
            hs.paragraph_format.alignment = align
            hs.paragraph_format.line_spacing = 1.5
            hs.paragraph_format.space_after = Pt(0)

    def setup_page_numbering(self, section: Any, fmt: str = "arabic", start: int = 1, align: str = "center") -> None:
        """fmt: 'arabic' | 'lowerRoman' | 'upperRoman' | 'none'."""
        sectPr = section._sectPr
        for el in sectPr.findall(qn("w:pgNumType")):
            sectPr.remove(el)
        
        # Unlink footer so it doesn't inherit from previous section
        section.footer.is_linked_to_previous = False
        
        if fmt == "none":
            for p in list(section.footer.paragraphs):
                p_elem = p._p
                p_elem.getparent().remove(p_elem)
            return

        fmt_map = {"arabic": "decimal", "lowerRoman": "lowerRoman", "upperRoman": "upperRoman"}
        pg_num = parse_xml(
            f'<w:pgNumType {nsdecls("w")} w:fmt="{fmt_map.get(fmt, "decimal")}" w:start="{start}"/>'
        )
        sectPr.append(pg_num)

        # Tambahkan footer dengan field PAGE fisik (Bawah Tengah)
        p_footer = section.footer.paragraphs[0] if section.footer.paragraphs else section.footer.add_paragraph()
        p_footer.text = ""  # Bersihkan teks lama
        if align == "right":
            p_footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        else:
            p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_footer.paragraph_format.space_before = Pt(0)
        p_footer.paragraph_format.space_after = Pt(0)

        fld_xml = parse_xml(
            f'<w:fldSimple {nsdecls("w")} w:instr="PAGE">'
            f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'
            f'<w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>'
        )
        p_footer._p.append(fld_xml)

    def add_section_break(self) -> Any:
        new_section = self.doc.add_section()
        m = self.margin
        new_section.top_margin = Cm(m["atas"])
        new_section.bottom_margin = Cm(m["bawah"])
        new_section.left_margin = Cm(m["kiri"])
        new_section.right_margin = Cm(m["kanan"])

        # Hapus pgBorders pada section baru agar border HANYA ada di halaman Cover
        try:
            sectPr = new_section._sectPr
            for child in list(sectPr):
                if child.tag.endswith('pgBorders'):
                    sectPr.remove(child)
        except Exception:
            pass

        return new_section

    def add_page_break(self) -> None:
        self.doc.add_page_break()

    # ------------------------------------------------------------------ #
    #  Bookmark & TOC (untuk Daftar Isi ber-nomor-halaman otomatis)       #
    # ------------------------------------------------------------------ #
    def attach_bookmark(self, paragraph: Any, name: str) -> None:
        """Pasang bookmark Word pada sebuah paragraf (target PAGEREF)."""
        bid = str(self._bookmark_id)
        self._bookmark_id += 1
        start = parse_xml(f'<w:bookmarkStart {nsdecls("w")} w:id="{bid}" w:name="{name}"/>')
        end = parse_xml(f'<w:bookmarkEnd {nsdecls("w")} w:id="{bid}"/>')
        paragraph._p.insert(0, start)
        paragraph._p.append(end)

    def add_toc_entry(self, text: str, bookmark: str, level: int = 1) -> Any:
        """Satu baris daftar isi: teks .... <PAGEREF bookmark>.

        Nomor halaman berupa field PAGEREF sehingga Word mengisinya
        otomatis (romawi/arab mengikuti section target). Return paragraf
        supaya bisa dipindah ke posisi marker Daftar Isi.
        """
        indent_map = {1: Cm(0), 2: Cm(1), 3: Cm(2)}
        p = self.doc.add_paragraph()
        p.paragraph_format.left_indent = indent_map.get(level, Cm(0))
        p.paragraph_format.tab_stops.add_tab_stop(
            Cm(13.5), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
        )
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        tab = p.add_run("\t")
        tab.font.name = "Times New Roman"
        tab.font.size = Pt(12)
        fld = parse_xml(
            f'<w:fldSimple {nsdecls("w")} w:instr=" PAGEREF {bookmark} \\h ">'
            f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'
            f'<w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>'
        )
        p._p.append(fld)
        return p

    def mark_toc_position(self) -> None:
        """Tandai posisi penyisipan entri BAB pada halaman Daftar Isi."""
        p = self.doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        self.toc_marker = p

    def finalize_toc(self) -> None:
        """Sisipkan entri outline (BAB + sub-bab) ke posisi marker Daftar Isi.

        Dipanggil SETELAH seluruh konten ditulis, sehingga daftar sub-bab
        akurat mengikuti apa yang benar-benar tercetak.
        """
        if self.toc_marker is None:
            return
        for level, text, bookmark in self.outline:
            p = self.add_toc_entry(text, bookmark, level)
            # add_toc_entry menaruh paragraf di akhir dokumen — pindahkan
            # elemen XML-nya ke depan marker (urutan terjaga).
            self.toc_marker._p.addprevious(p._p)

    def add_native_toc(self, title: str = "DAFTAR ISI") -> None:
        """Daftar Isi berupa field TOC asli Word di dalam SDT.

        Sama seperti dokumen referensi (Niken): `TOC \\o "1-3" \\h \\z \\u`
        di dalam w:sdt gallery "Table of Contents".
        """
        size_half_pt = self.heading_sizes[1] * 2
        sdt = parse_xml(
            f'<w:sdt {nsdecls("w")}>'
            '<w:sdtPr><w:docPartObj>'
            '<w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/>'
            '</w:docPartObj></w:sdtPr>'
            '<w:sdtContent>'
            # Judul DAFTAR ISI (tampilan sama dengan heading bab)
            '<w:p><w:pPr><w:jc w:val="center"/>'
            '<w:spacing w:line="360" w:lineRule="auto" w:after="0"/></w:pPr>'
            '<w:r><w:rPr>'
            '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'
            f'<w:b/><w:sz w:val="{size_half_pt}"/></w:rPr>'
            f'<w:t>{title}</w:t></w:r></w:p>'
            '</w:sdtContent></w:sdt>'
        )
        body = self.doc.element.body
        sectPr = body.find(qn("w:sectPr"))
        if sectPr is not None:
            sectPr.addprevious(sdt)
        else:
            body.append(sdt)

    def populate_native_toc(self, sections_list: list[tuple[str, str, int]]) -> None:
        """Populasi Daftar Isi dengan field PAGEREF yang menunjuk bookmark nyata.

        Tiap entri berupa field ``PAGEREF <bookmark> \\h`` sehingga nomor
        halaman dihitung Word/LibreOffice dari posisi heading SEBENARNYA —
        bukan angka hardcode yang cepat basi. Cache di dalam field dibiarkan
        placeholder ("1") — angka asli diisi belakangan oleh
        ``embed_toc_page_numbers`` (re-render via Word) atau oleh
        ``enable_update_fields`` saat dokumen dibuka di Word. ``sections_list``
        berisi ``(teks, bookmark, level)``; entri tanpa bookmark valid dilewati.
        """
        sdtContent_list = self.doc.element.body.xpath('.//w:sdtContent')
        if not sdtContent_list:
            return
        sdtContent = sdtContent_list[0]

        for text, bookmark, level in sections_list:
            if not bookmark:
                continue
            indent_dxa = "0" if level == 1 else ("360" if level == 2 else "720")
            p_xml = parse_xml(
                f'<w:p {nsdecls("w")}>'
                f'<w:pPr>'
                f'<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="7654"/></w:tabs>'
                f'<w:ind w:left="{indent_dxa}"/>'
                f'<w:spacing w:line="360" w:lineRule="auto" w:after="0"/></w:pPr>'
                f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">{_xml_escape(text)}</w:t></w:r>'
                f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:tab/></w:r>'
                f'<w:fldSimple w:instr=" PAGEREF {bookmark} \\h ">'
                f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r>'
                f'</w:fldSimple>'
                f'</w:p>'
            )
            sdtContent.append(p_xml)

        # Word wajib me-update semua field (PAGEREF) saat dokumen dibuka agar
        # nomor halaman Daftar Isi akurat mengikuti letak heading sebenarnya.
        self.enable_update_fields()

    def enable_update_fields(self) -> None:
        """Minta Word meng-update semua field (PAGEREF) saat dokumen dibuka."""
        settings = self.doc.settings.element
        if settings.find(qn("w:updateFields")) is None:
            settings.append(parse_xml(f'<w:updateFields {nsdecls("w")} w:val="true"/>'))

    def clear_update_fields(self) -> None:
        """Hapus flag updateFields — dipakai setelah nomor halaman tertanam."""
        settings = self.doc.settings.element
        el = settings.find(qn("w:updateFields"))
        if el is not None:
            settings.remove(el)

    # ------------------------------------------------------------------ #
    #  Embed nomor halaman nyata ke Daftar Isi (tanpa butuh user update)  #
    # ------------------------------------------------------------------ #
    def embed_toc_page_numbers(self, pages: dict[str, str]) -> None:
        """Tulis nomor halaman NYATA ke cache tiap field PAGEREF di Daftar Isi.

        ``pages`` = pemetaan ``bookmark → nomor halaman`` (mis. ``"1"`` /
        ``"ii"``) hasil komputasi engine Word. Setelah angka tertanam, flag
        ``updateFields`` dicabut supaya Word tidak mengganti angka lagi —
        dokumen langsung menampilkan Daftar Isi yang benar di semua viewer,
        termasuk yang tidak mengeksekusi field (pratinjau, konversi PDF).
        """
        if not pages:
            return
        for fld in self.doc.element.body.xpath('.//w:fldSimple[contains(@w:instr, "PAGEREF")]'):
            instr = fld.get(qn("w:instr")) or ""
            parts = instr.split()
            if len(parts) < 2:
                continue
            bookmark = parts[1]
            if bookmark not in pages:
                continue
            # Ganti teks cache di dalam run field dengan nomor nyata.
            ts = fld.findall('.//' + qn('w:t'))
            if ts:
                ts[0].text = str(pages[bookmark])
                for extra in ts[1:]:
                    extra.text = ""
        self.clear_update_fields()

    def add_spacing(self, lines: int = 1, keep_with_next: bool = False) -> Any:
        last_p = None
        for _ in range(lines):
            p = self.doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            if keep_with_next:
                p.paragraph_format.keep_with_next = True
            run = p.add_run("")
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)
            last_p = p
        return last_p

    # ------------------------------------------------------------------ #
    #  Cover                                                              #
    # ------------------------------------------------------------------ #
    def add_cover(self, data: dict, is_cover_dalam: bool = False) -> None:
        sekolah = data.get("sekolah", {})
        siswa = data.get("siswa", {})
        perusahaan = data.get("perusahaan", {})
        pedoman = self.preset == "pedoman"

        sec_curr = self.doc.sections[0] if not is_cover_dalam else self.doc.sections[-1]
        sec_curr.left_margin = Cm(1.55)
        sec_curr.right_margin = Cm(1.65)
        sec_curr.top_margin = Cm(2.44)
        sec_curr.bottom_margin = Cm(0.50)

        try:
            sectPr = sec_curr._sectPr
            for child in list(sectPr):
                if child.tag.endswith('pgBorders'):
                    sectPr.remove(child)
            if not is_cover_dalam:
                borders_xml = parse_xml(
                    r'<w:pgBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:display="allPages" w:offsetFrom="page">'
                    r'<w:top w:val="thinThickThinSmallGap" w:color="auto" w:sz="24" w:space="24"/>'
                    r'<w:left w:val="thinThickThinSmallGap" w:color="auto" w:sz="24" w:space="24"/>'
                    r'<w:bottom w:val="thinThickThinSmallGap" w:color="auto" w:sz="24" w:space="24"/>'
                    r'<w:right w:val="thinThickThinSmallGap" w:color="auto" w:sz="24" w:space="24"/>'
                    r'</w:pgBorders>'
                )
                sectPr.append(borders_xml)
        except Exception:
            pass

        # Logo Pemprov di bagian atas cover (contoh resmi hal. 33) — opsional.
        if pedoman:
            logo_prov = sekolah.get("logo_provinsi_path")
            if logo_prov and os.path.exists(logo_prov):
                p = self.doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.add_run().add_picture(logo_prov, width=Cm(2.2))

        # LAPORAN (20pt bold center)
        self._center_run("LAPORAN", 20, bold=True)
        self.add_spacing(1)
        # Ejaan resmi pedoman TP 2026-2027: "PRAKTIK"; legacy meniru dokumen
        # lama yang menulis "PRAKTEK".
        judul_pkl = "PRAKTIK KERJA LAPANGAN (PKL)" if pedoman else "PRAKTEK KERJA LAPANGAN (PKL)"
        self._center_run(judul_pkl, 20, bold=True)
        # Cover umumnya menyebut nama perusahaan + kota/cabang; nama pendek
        # (`nama`) dipakai di narasi body.
        nama_prsh = (
            perusahaan.get("nama_cover")
            or perusahaan.get("nama")
            or "[NAMA PERUSAHAAN]"
        )
        kota_prsh = (perusahaan.get("kota") or "").strip()
        if pedoman and kota_prsh and kota_prsh.upper() not in nama_prsh.upper():
            # Contoh resmi memisahkan kota di baris sendiri:
            # "DI HOTEL HORISON" / "JAKARTA".
            self._center_run(f"DI {nama_prsh.upper()}", 20, bold=True)
            self._center_run(kota_prsh.upper(), 20, bold=True)
        else:
            self._center_run(f"DI {nama_prsh.upper()}", 20, bold=True)
        self.add_spacing(1)

        # Subtitle italic 14pt (3 baris sesuai contoh resmi SMKN 4).
        jurusan = (siswa.get("jurusan") or "").strip()
        nama_sekolah = sekolah.get("nama", "[Nama Sekolah]") or "[Nama Sekolah]"
        
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        run1 = p.add_run("Disusun untuk memenuhi salah satu persyaratan\n")
        run1.font.size = Pt(14)
        run1.italic = True
        run2 = p.add_run(f"dalam menyelesaikan studi di {nama_sekolah}\n")
        run2.font.size = Pt(14)
        run2.italic = True
        if jurusan:
            run3 = p.add_run(f"kompetensi keahlian {jurusan}")
            run3.font.size = Pt(14)
            run3.italic = True

        self.add_spacing(1)
        self._center_run("disusun oleh :", 14)

        # Nama (16pt bold uppercase underline centered, sesuai contoh resmi CONTOH COVER SMKN 4)
        nama = siswa.get("nama", "[Nama Siswa]") or "[Nama Siswa]"
        p_nama = self.doc.add_paragraph()
        p_nama.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_nama = p_nama.add_run(nama.upper())
        run_nama.font.name = "Arial"
        run_nama.font.size = Pt(16)
        run_nama.bold = True
        run_nama.underline = True

        # Nomor NISN / NIS di bawah Nama
        nomor = (siswa.get("nisn") or siswa.get("nis") or "").strip()
        label = "NISN." if siswa.get("nisn") else "NIS."
        if nomor:
            p_nis = self.doc.add_paragraph()
            p_nis.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run_nis = p_nis.add_run(f"{label} {nomor}")
            run_nis.font.name = "Arial"
            run_nis.font.size = Pt(16)
            run_nis.bold = True

        self.add_spacing(1)

        # Logo Sekolah SMKN 4 di tengah di bawah NISN/NIS (diperbesar 6.0cm)
        logo_sekolah_path = sekolah.get("logo_path")
        smkn4_logo_def = os.path.join(os.path.dirname(__file__), "smkn4_assets", "logo_smkn4.jpeg")
        if not logo_sekolah_path or not os.path.exists(logo_sekolah_path):
            if os.path.exists(smkn4_logo_def):
                logo_sekolah_path = smkn4_logo_def
            else:
                alt_logo = os.path.join(os.path.dirname(__file__), "smkn4_assets", "image1.jpeg")
                if os.path.exists(alt_logo):
                    logo_sekolah_path = alt_logo

        if logo_sekolah_path and os.path.exists(logo_sekolah_path):
            p_logo = self.doc.add_paragraph()
            p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run_logo = p_logo.add_run()
            run_logo.add_picture(logo_sekolah_path, width=Cm(6.05))  # Diperbesar 10% lagi (dari 5.5cm ke 6.05cm)

        # Perhitungan spasi vertikal dinamis (Dynamic Cover Spacing Fallback)
        # Menghitung perkiraan tinggi baris paragraf yang terpakai di atas logo
        title_lines = 3  # "LAPORAN", "PRAKTIK KERJA LAPANGAN (PKL)", "DI [PERUSAHAAN]"
        if len(judul_pkl) > 35:
            title_lines += 1
        if len(nama_prsh) > 30:
            title_lines += 1
        if pedoman and kota_prsh and kota_prsh.upper() not in nama_prsh.upper():
            title_lines += 1

        subtitle_lines = 3  # "Disusun untuk memenuhi...", "Ujian...", "Tahun..."
        if len(nama_sekolah) > 35:
            subtitle_lines += 1

        author_lines = 3  # "disusun oleh :", "Nama", "NISN / NIS"
        if len(nama) > 30:
            author_lines += 1

        logo_lines = 6.0 if (logo_sekolah_path and os.path.exists(logo_sekolah_path)) else 0
        total_top_lines = title_lines + subtitle_lines + author_lines + logo_lines

        # Target kapasitas baris Halaman Cover sebelum Kop Footer (mentok sampai bawah, tersisa 1 enter sebelum page break)
        target_lines_before_kop = 20.0
        needed_enters = int(round(target_lines_before_kop - total_top_lines))
        final_enters = max(0, min(5, needed_enters))

        for _ in range(final_enters):
            p_sp = self.doc.add_paragraph()
            p_sp.paragraph_format.line_spacing = 1.15
            p_sp.paragraph_format.space_before = Pt(0)
            p_sp.paragraph_format.space_after = Pt(0)
            r_sp = p_sp.add_run()
            r_sp.font.name = "Times New Roman"
            r_sp.font.size = Pt(12)

        # Footer Kop sekolah + Logo Lampung di sebelah kiri
        logo_prov_path = sekolah.get("logo_provinsi_path")
        lampung_logo_def = os.path.join(os.path.dirname(__file__), "smkn4_assets", "logo_lampung.png")
        if not logo_prov_path or not os.path.exists(logo_prov_path):
            if os.path.exists(lampung_logo_def):
                logo_prov_path = lampung_logo_def

        kop = sekolah.get("kop", {})
        kop_lines = [
            (kop.get("baris_1", "PEMERINTAH PROVINSI LAMPUNG"), 14, False),
            (kop.get("baris_2", "DINAS PENDIDIKAN DAN KEBUDAYAAN"), 14, False),
            (sekolah.get("nama_lengkap") or nama_sekolah.upper(), 14, True),
        ]
        alamat_sekolah = (sekolah.get("alamat") or "").strip()
        if alamat_sekolah:
            kop_lines.append((alamat_sekolah, 12, False))
        alamat_2 = kop.get("baris_alamat_2", "")
        if alamat_2:
            kop_lines.append((alamat_2, 12, False))

        email = sekolah.get("email", "") or ""
        website = sekolah.get("website", "") or ""
        npsn = kop.get("npsn", "") or "10807215"
        nss = kop.get("nss", "") or "401126003028"

        # Menggunakan tabel 1-baris x 2-kolom tanpa border:
        # Cell left: Logo Lampung (kiri top-aligned)
        # Cell right: Kop Teks Sekolah + baris NSS (kiri) & NPSN (kanan) 14pt Bold
        table = self.doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.LEFT
        tblPr_cov = table._tbl.tblPr
        tblInd_cov = parse_xml(r'<w:tblInd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:w="0" w:type="dxa"/>')
        tblPr_cov.append(tblInd_cov)

        cell_left = table.cell(0, 0)
        cell_right = table.cell(0, 1)
        cell_left.width = Cm(3.2)
        cell_right.width = Cm(14.61)

        # Hapus border tabel
        for cell in (cell_left, cell_right):
            tcPr = cell._element.get_or_add_tcPr()
            tcBorders = parse_xml(
                r'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                r'<w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>'
                r'</w:tcBorders>'
            )
            tcPr.append(tcBorders)

        # Set top vertical alignment & zero cell margin untuk cell_left agar mentok border
        for cell in (cell_left, cell_right):
            tcPr = cell._element.get_or_add_tcPr()
            tcPr.append(parse_xml(r'<w:vAlign xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="top"/>'))
        tcPr_l = cell_left._element.get_or_add_tcPr()
        tcPr_l.append(parse_xml(r'<w:tcMar xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tcMar>'))

        # 1. Gambar Logo Pemprov Lampung di cell_left (Top Aligned mentok border kiri)
        if logo_prov_path and os.path.exists(logo_prov_path):
            p_prov = cell_left.paragraphs[0]
            p_prov.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p_prov.paragraph_format.left_indent = Cm(0)
            p_prov.paragraph_format.space_before = Pt(0)
            p_prov.paragraph_format.space_after = Pt(0)
            r_prov = p_prov.add_run()
            r_prov.add_picture(logo_prov_path, width=Cm(3.2))

        # 2. Teks Kop Sekolah di cell_right (Top Aligned Centered, simetris dengan halaman)
        # Indent kanan 3.2cm menyamai lebar Logo Lampung (3.2cm) di kiri agar teks Kop presisi di tengah halaman
        p_right_first = cell_right.paragraphs[0]
        p_right_first.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_right_first.paragraph_format.right_indent = Cm(3.2)

        for idx, (text, size, bold) in enumerate(kop_lines):
            if idx == 0:
                p = p_right_first
            else:
                p = cell_right.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.right_indent = Cm(3.2)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(size)
            run.bold = bold

        if email or website:
            p = cell_right.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.right_indent = Cm(3.2)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(f"E-mail: {email}    {website}")
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.5)

        # 3. Baris NSS (Kiri) dan NPSN (Kanan) 14pt Bold digabung di paragraf Kop (sesuai instruksi user)
        p_ids = cell_right.add_paragraph()
        p_ids.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_ids.paragraph_format.line_spacing = 1.15
        p_ids.paragraph_format.space_before = Pt(8)
        p_ids.paragraph_format.space_after = Pt(0)
        p_ids.paragraph_format.right_indent = Cm(0)
        p_ids.paragraph_format.tab_stops.add_tab_stop(Cm(13.2), WD_TAB_ALIGNMENT.RIGHT)

        r_nss = p_ids.add_run(f"NSS : {nss}")
        r_nss.font.name = "Times New Roman"
        r_nss.font.size = Pt(14)
        r_nss.bold = True

        p_ids.add_run("\t")

        r_npsn = p_ids.add_run(f"NPSN : {npsn}")
        r_npsn.font.name = "Times New Roman"
        r_npsn.font.size = Pt(14)
        r_npsn.bold = True

    # ------------------------------------------------------------------ #
    #  Pengesahan                                                         #
    # ------------------------------------------------------------------ #
    def add_pengesahan_industri(self, data: dict) -> None:
        perusahaan = data.get("perusahaan", {})
        nama_prsh = (
            perusahaan.get("nama_pengesahan")
            or perusahaan.get("nama_lengkap")
            or perusahaan.get("nama")
            or "[PERUSAHAAN]"
        )
        pb = perusahaan.get("pembimbing_industri", {})
        pb2 = perusahaan.get("pembimbing_industri_2", {})
        pimpinan = perusahaan.get("pimpinan", {})

        # Template resmi SMKN 4 (hal. 34 / WhatsApp Image 2026-07-26 at 22.21.28 (2).jpeg):
        # "PENGESAHAN / dari / <NAMA_PERUSAHAAN>"
        h = self._heading("PENGESAHAN", bookmark="peng_industri")
        self._center_run("dari", 12)
        self._heading(nama_prsh.upper())
        self.add_spacing(2)

        name_pb1 = _sig_name(pb.get("nama"))
        name_pb2 = _sig_name(pb2.get("nama")) if (pb2.get("nama") or "").strip() else "( ........................................ )"

        self._ttd_columns(
            "Pembimbing I,", name_pb1,
            "Pembimbing II,", name_pb2,
        )

        self.add_spacing(2)
        if isinstance(pimpinan, str):
            pimpinan = {"nama": pimpinan, "jabatan": "General Manager"}
        elif not isinstance(pimpinan, dict):
            pimpinan = {}
        jabatan = pimpinan.get("jabatan") or "Kepala"
        self._ttd_block(f"{jabatan},", _sig_name(pimpinan.get("nama")), size=14)

        # Footnote keterangan di bagian bawah (persis panduan resmi SMKN 4 hal. 34)
        self.add_spacing(2)
        p_ket = self.doc.add_paragraph()
        p_ket.paragraph_format.line_spacing = 1.15
        r_ket = p_ket.add_run(
            "Keterangan :\n"
            "1) Nama Institusi Pasangan (IP)/industri tempat PKL\n"
            "2) Manager HRD/Ka.TU/Manager Lab/yang berwenang di IP"
        )
        r_ket.font.name = "Times New Roman"
        r_ket.font.size = Pt(10)
        r_ket.italic = True
        return

    def add_pengesahan_sekolah(self, data: dict) -> None:
        """Halaman Pengesahan Sekolah mengikut pedoman resmi SMKN 4."""
        self._pengesahan_sekolah_pedoman(data)

    def _pengesahan_sekolah_pedoman(self, data: dict) -> None:
        """Template resmi hal. 35: Menyetujui (Ketua KK | Pembimbing) lalu
        'Mengetahui' Kepala Sekolah — bukan Waka Humas."""
        sekolah = data.get("sekolah", {})
        nama_sekolah = sekolah.get("nama", "[SEKOLAH]") or "[SEKOLAH]"
        ketua = sekolah.get("ketua_kk", {})
        pembimbing = sekolah.get("pembimbing_sekolah", {})
        kepsek = sekolah.get("kepala_sekolah", {})

        self._heading("PENGESAHAN", bookmark="peng_sekolah")
        self._center_run("dari", 12)
        self._heading(nama_sekolah)
        self.add_spacing(1)
        self._center_run("Menyetujui,", 14, bold=True)
        self.add_spacing(1)

        self._ttd_columns(
            "Ketua Kompetensi Keahlian,", _sig_name(ketua.get("nama")),
            "Pembimbing,", _sig_name(pembimbing.get("nama")),
            nip_kiri=ketua.get("nip", ""), nip_kanan=pembimbing.get("nip", ""),
        )

        self.add_spacing(2)
        self._center_run("Mengetahui", 14, bold=True)
        self._center_run(f"Kepala {nama_sekolah}", 14, bold=True)
        self.add_spacing(3)
        self._center_run(_sig_name(kepsek.get("nama")), 14, bold=True, underline=True)
        nip_kepsek = (kepsek.get("nip") or "").strip()
        if nip_kepsek:
            self._center_run(f"NIP. {nip_kepsek}", 14)

    def _ttd_columns(
        self, label_kiri: str, nama_kiri: str, label_kanan: str, nama_kanan: str,
        nip_kiri: str = "", nip_kanan: str = "", size: int = 16,
    ) -> None:
        """Dua blok tanda tangan berdampingan.

        Dibuat sebagai tabel 2-baris x 2-kolom tanpa border:
        Row 0: Label Jabatan (top-aligned)
        Row 1: Ruang TTD + Nama Terang & NIP (selalu 100% sejajar horizontal)
        """
        table = self.doc.add_table(rows=2, cols=2)
        table.style = "Normal Table"
        self._remove_all_borders(table)

        # Row 0: Label Jabatan
        row0 = table.rows[0]
        for cell, label in ((row0.cells[0], label_kiri), (row0.cells[1], label_kanan)):
            tcPr = cell._element.get_or_add_tcPr()
            tcPr.append(parse_xml(r'<w:vAlign xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="top"/>'))
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(label)
            run.font.name = "Times New Roman"
            run.font.size = Pt(size)
            run.bold = True

        # Row 1: Nama Terang + NIP (Selalu sejajar horizontal di baris terpisah)
        row1 = table.rows[1]
        for cell, nama, nip in ((row1.cells[0], nama_kiri, nip_kiri), (row1.cells[1], nama_kanan, nip_kanan)):
            tcPr = cell._element.get_or_add_tcPr()
            tcPr.append(parse_xml(r'<w:vAlign xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="top"/>'))
            # Ruang tanda tangan (3 baris kosong)
            p_first = cell.paragraphs[0]
            p_first.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_first.paragraph_format.line_spacing = 1.5
            for _ in range(2):
                sp = cell.add_paragraph()
                sp.paragraph_format.line_spacing = 1.5

            # Nama (underline)
            pn = cell.add_paragraph()
            pn.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pn.paragraph_format.line_spacing = 1.5
            rn = pn.add_run(nama)
            rn.font.name = "Times New Roman"
            rn.font.size = Pt(size)
            rn.bold = True
            rn.underline = True

            if nip:
                pnip = cell.add_paragraph()
                pnip.alignment = WD_ALIGN_PARAGRAPH.CENTER
                pnip.paragraph_format.line_spacing = 1.5
                rnip = pnip.add_run(f"NIP. {nip}")
                rnip.font.name = "Times New Roman"
                rnip.font.size = Pt(size)

    # ------------------------------------------------------------------ #
    #  Identitas (tabel borderless)                                       #
    # ------------------------------------------------------------------ #
    def add_identitas_siswa(self, data: dict) -> None:
        self._heading("IDENTITAS SISWA", bookmark="id_siswa")
        self.add_spacing(1)
        siswa = data.get("siswa", {})
        sekolah = data.get("sekolah", {})

        # Normalisasi Jenis Kelamin (L/P/Laki-laki/Perempuan -> Laki-laki / Perempuan)
        jk_raw = (siswa.get("jenis_kelamin") or "").strip()
        if jk_raw.upper() in ("L", "LAKI-LAKI", "LAKI LAKI", "MALE"):
            jk_str = "Laki-laki"
        elif jk_raw.upper() in ("P", "PEREMPUAN", "FEMALE"):
            jk_str = "Perempuan"
        else:
            jk_str = jk_raw or "-"

        rows = [
            ("Nama Siswa", siswa.get("nama", "")),
            ("Nomor Induk", siswa.get("nisn") or siswa.get("nis", "")),
            ("Tempat, Tgl.lahir", f"{siswa.get('tempat_lahir', '')}, {siswa.get('tanggal_lahir', '')}"),
            ("Jenis Kelamin", jk_str),
            ("Golongan Darah", siswa.get("golongan_darah", "") or "-"),
            ("Catatan Kesehatan", siswa.get("catatan_kesehatan", "-")),
            ("No. Telp/Hp siswa", siswa.get("no_telp", "")),
            ("Nama Sekolah", sekolah.get("nama", "")),
            ("Alamat Sekolah", sekolah.get("alamat", "")),
            ("No. Telp Sekolah", sekolah.get("telp", "")),
            ("Nama Orang Tua/Wali", siswa.get("nama_ortu", "")),
            ("Alamat Orang Tua/Wali", siswa.get("alamat_ortu", "")),
            ("No. Telp Orang Tua/Wali", siswa.get("telp_ortu", "")),
        ]
        # Hitung estimasi total baris teks (termasuk baris terurai/line-wrap)
        total_line_count = len(rows)
        for label, val in rows:
            if val and len(str(val)) > 35:
                total_line_count += (len(str(val)) // 35)

        # Hitung sisa ruang vertikal halaman secara eksak (Kapasitas halaman A4 ~28-29 baris)
        # Heading (2) + Tabel Atas (total_line_count) + Tabel Bawah (7 baris) = Total baris terpakai
        used_lines = 2 + total_line_count + 7
        available_enters = max(1, 28 - used_lines)

        # Jika sisa ruang mepet, kecilkan group_space_before & enter agar tetap muat di 1 halaman
        if available_enters <= 1 and total_line_count > 17:
            group_space_before = 4
            spacing_enters = 1
        elif available_enters <= 2:
            group_space_before = 6
            spacing_enters = available_enters
        else:
            group_space_before = 10
            spacing_enters = available_enters

        self._add_borderless_table(rows, group_space_before=group_space_before)

        # Enters (jarak vertikal) dinamis hasil kalkulasi sisa kapasitas halaman
        self.add_spacing(spacing_enters, keep_with_next=True)

        # Tabel 2 kolom bagian bawah: Pas Foto 3x4 di kiri bawah, TTD Siswa di kanan bawah
        table_bot = self.doc.add_table(rows=1, cols=2)
        table_bot.style = "Normal Table"
        self._remove_all_borders(table_bot)

        # Kunci baris agar tidak terpisah (cantSplit)
        trPr_bot = table_bot.rows[0]._tr.get_or_add_trPr()
        trPr_bot.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

        # Set Table Left Indent for bottom table (0.18 cm matching Niken)
        tblPr_bot = table_bot._tbl.tblPr
        tblInd_bot = parse_xml(r'<w:tblInd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:w="100" w:type="dxa"/>')
        tblPr_bot.append(tblInd_bot)

        cell_foto = table_bot.rows[0].cells[0]
        cell_ttd = table_bot.rows[0].cells[1]
        cell_foto.width = Cm(6.89)
        cell_ttd.width = Cm(8.90)

        # Sel Kiri: Pas Foto 3x4 (posisi pas di kiri bawah, offset 1.5cm persis Niken)
        foto = (siswa.get("foto") or "").strip()
        if not foto or not os.path.exists(foto):
            # Fallback ke pas foto siswa jika tidak ada foto (untuk testing)
            alt_foto = os.path.join(os.path.dirname(__file__), "smkn4_assets", "image10.jpeg")
            if not os.path.exists(alt_foto):
                alt_foto = os.path.join(os.path.dirname(__file__), "smkn4_assets", "logo_smkn4.jpeg")
            foto = alt_foto

        p_f = cell_foto.paragraphs[0]
        p_f.paragraph_format.left_indent = Cm(0)  # Mentok sejajar di kiri dengan teks Nama Sekolah / Nama Orang Tua
        p_f.paragraph_format.space_before = Pt(6)
        p_f.paragraph_format.space_after = Pt(0)
        p_f.paragraph_format.keep_with_next = True
        if foto and os.path.exists(foto):
            try:
                r_f = p_f.add_run()
                r_f.add_picture(foto, width=Cm(3.04), height=Cm(4.10))
            except Exception:
                pass

        # Sel Kanan: Tanda Tangan Siswa (Yang Bersangkutan, - Rata Kanan sejajar margin kanan)
        p_t1 = cell_ttd.paragraphs[0]
        p_t1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_t1.paragraph_format.line_spacing = 1.15
        p_t1.paragraph_format.keep_with_next = True
        r_t1 = p_t1.add_run("Yang Bersangkutan,")
        r_t1.font.name = "Times New Roman"
        r_t1.font.size = Pt(14)
        r_t1.bold = True

        for _ in range(4):
            sp = cell_ttd.add_paragraph()
            sp.paragraph_format.line_spacing = 1.15
            sp.paragraph_format.keep_with_next = True

        p_t2 = cell_ttd.add_paragraph()
        p_t2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_t2.paragraph_format.line_spacing = 1.15
        p_t2.paragraph_format.keep_with_next = True
        r_t2 = p_t2.add_run(_sig_name(siswa.get("nama")))
        r_t2.font.name = "Times New Roman"
        r_t2.font.size = Pt(14)
        r_t2.bold = True
        r_t2.underline = True

    def add_identitas_industri(self, data: dict) -> None:
        self._heading("IDENTITAS INDUSTRI / INSTANSI", bookmark="id_industri")
        self.add_spacing(1)
        perusahaan = data.get("perusahaan", {})
        pimpinan = perusahaan.get("pimpinan", {})
        hrd = perusahaan.get("hrd", {})
        pembimbing = perusahaan.get("pembimbing_industri", {})

        rows: list[tuple[str, str | None]] = [
            ("Perusahaan / Instansi", None),
            ("Nama", perusahaan.get("nama", "")),
            ("Alamat", perusahaan.get("alamat", "")),
            ("Bidang Produk/Jasa", perusahaan.get("bidang_usaha", "")),
            ("Status", perusahaan.get("status", "")),
            ("Nomor Telp", perusahaan.get("no_telp", "")),
            ("Nomor Fax.", perusahaan.get("fax", "-")),
            ("E-mail", perusahaan.get("email", "-")),
            ("Website", perusahaan.get("website", "-")),
            ("Pimpinan", None),
            ("Jabatan", pimpinan.get("jabatan", "")),
            ("Nama", pimpinan.get("nama", "")),
            ("HRD / Ka. Tu", None),
            ("Nama", hrd.get("nama", "")),
            ("No. Telp - Ext.", hrd.get("telp", "")),
            ("E-mail", hrd.get("email", "")),
            ("Pembimbing", None),
            ("Jabatan", pembimbing.get("jabatan", "")),
            ("Nama", pembimbing.get("nama", "")),
            ("No. Telp - Ext.", pembimbing.get("telp", "")),
            ("E-mail", pembimbing.get("email", "")),
        ]

        self._add_borderless_table(rows, col_widths=(5.83, 1.33, 9.63))

    # ------------------------------------------------------------------ #
    #  Kata Pengantar                                                     #
    # ------------------------------------------------------------------ #
    def add_kata_pengantar(self, data: dict) -> None:
        self._heading("KATA PENGANTAR", bookmark="kata_pengantar")
        self.add_spacing(1)
        kp = data.get("kata_pengantar", {})
        siswa = data.get("siswa", {})
        sekolah = data.get("sekolah", {})

        syukur = kp.get("ucapan_syukur") or (
            "Puji syukur kepada Tuhan Yang Maha Esa, karena karunia dan nikmat yang diberikan-Nya "
            "sehingga Penulis dapat menyelesaikan penyusunan Laporan Praktik Kerja Lapangan (PKL) "
            "ini tepat pada waktunya."
        )
        self.add_body(syukur)
        self.add_body(kp.get("pengantar_laporan") or (
            "Laporan ini Penulis susun sebagai salah satu bentuk persyaratan untuk memenuhi tugas "
            "dalam menyelesaikan pendidikan di sekolah."
        ))
        self.add_body(kp.get("intro_terima_kasih") or (
            "Pada kesempatan ini juga, Penulis mengucapkan terima kasih atas bimbingan dan pelajaran "
            "yang telah diberikan kepada:"
        ))

        hierarki = kp.get("hierarki_terima_kasih") or []
        if not hierarki:
            hierarki = self._default_hierarki(data)
        # Hierarki ucapan terima kasih diberi nomor 1. 2. 3. — sesuai aturan
        # enumerasi laporan (bullet dilarang).
        for i, item in enumerate(hierarki, 1):
            p = self.doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.left_indent = Cm(1.63)
            p.paragraph_format.first_line_indent = Cm(-0.63)
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(f"{i}. {item}")
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)

        self.add_spacing(1)
        harapan = kp.get("harapan") or (
            "Penulis berharap semoga hasil laporan yang Penulis susun ini dapat bermanfaat bagi "
            "peningkatan mutu pendidikan di masa yang akan datang. Penulis juga meminta maaf atas "
            "segala kekurangan dalam penyusunan laporan ini."
        )
        self.add_body(harapan)

        self.add_spacing(1)

        kota = kp.get("kota") or sekolah.get("kota", "") or ""
        tanggal = (kp.get("tanggal") or "").strip()
        tanda_tempat = ", ".join(x for x in (kota, tanggal) if x)
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run = p.add_run(tanda_tempat)
        run.font.size = Pt(12)
        run.bold = True
        self.add_spacing(1)

        nama = siswa.get("nama", "[Nama]") or "[Nama]"
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.left_indent = Cm(11.43)
        run = p.add_run(nama)
        run.font.size = Pt(12)
        run.underline = True
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.left_indent = Cm(11.43)
        run = p.add_run("Penulis")
        run.font.size = Pt(12)
        run.bold = True

    def _default_hierarki(self, data: dict) -> list[str]:
        items = [
            "Tuhan Yang Maha Esa, atas berkat dan rahmat-Nya Penulis bisa menyusun laporan Praktik "
            "Kerja Lapangan ini.",
            "Kedua Orang Tua, yang selalu memberi dukungan dan motivasi kepada Penulis.",
        ]
        pb_ind = data.get("perusahaan", {}).get("pembimbing_industri", {})
        if pb_ind.get("nama"):
            items.append(
                f"{pb_ind['nama']}, selaku pembimbing industri yang telah memberikan bimbingan "
                f"selama pelaksanaan PKL."
            )
        kepsek = data.get("sekolah", {}).get("kepala_sekolah", {})
        if kepsek.get("nama"):
            gelar = kepsek.get("gelar", "")
            items.append(
                f"{kepsek['nama']}{', ' + gelar if gelar else ''}, selaku kepala sekolah yang telah "
                f"memberikan izin dan kesempatan untuk melaksanakan PKL."
            )
        ketua = data.get("sekolah", {}).get("ketua_kk", {})
        if ketua.get("nama"):
            items.append(
                f"{ketua['nama']}, selaku ketua kompetensi keahlian yang telah membantu kelancaran "
                f"pelaksanaan PKL."
            )
        pb_sek = data.get("sekolah", {}).get("pembimbing_sekolah", {})
        if pb_sek.get("nama"):
            items.append(
                f"{pb_sek['nama']}, selaku guru pembimbing PKL yang telah memberikan arahan dalam "
                f"penyusunan laporan."
            )
        items.append("Pihak lain yang tidak dapat Penulis sebutkan satu persatu.")
        return items

    # ------------------------------------------------------------------ #
    #  Daftar Isi                                                         #
    # ------------------------------------------------------------------ #
    def add_daftar_isi(self, sections_list: list[tuple[str, str | int, int]]) -> None:
        """sections_list: list of (text, page_num, level). level 1/2/3."""
        self._heading("DAFTAR ISI")
        self.add_spacing(1)
        indent_map = {1: Cm(0), 2: Cm(1), 3: Cm(2)}
        for text, page, level in sections_list:
            p = self.doc.add_paragraph()
            p.paragraph_format.left_indent = indent_map.get(level, Cm(0))
            p.paragraph_format.tab_stops.add_tab_stop(Cm(13.5), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_after = Pt(0)
            r_left = p.add_run(text)
            r_left.font.name = "Times New Roman"
            r_left.font.size = Pt(12)
            r_right = p.add_run(f"\t{page}")
            r_right.font.name = "Times New Roman"
            r_right.font.size = Pt(12)

    # ------------------------------------------------------------------ #
    #  Body content helpers                                               #
    # ------------------------------------------------------------------ #
    def add_body(self, text: str, bold: bool = False) -> Any:
        """Body: justify, indent 0.75cm, TNR 12pt, 1.5 spacing."""
        p = self.doc.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(0.75)
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        if bold:
            run.bold = True
        return p

    def add_bab_heading(self, nomor: int, judul: str, bookmark: str | None = None) -> None:
        roman = _ROMANS.get(nomor, str(nomor))
        text = f"BAB {roman} {judul.upper()}"
        self._heading(text, bookmark=bookmark)
        if bookmark:
            self.outline.append((1, text, bookmark))
        # Pedoman 1.7.2.b: jarak judul bab ke teks = 3 spasi. Penulis BAB
        # menambah 1 spasi sendiri, jadi di sini cukup 2 tambahan.
        if self.preset == "pedoman":
            self.add_spacing(1)

    def add_sub_heading(self, nomor_bab: int, nomor_sub: int, judul: str) -> None:
        # Tambahkan 1 baris Enter pemisah sebelum Sub-BAB (persis dokumen Niken)
        self.add_spacing(1)
        text = f"{nomor_bab}.{nomor_sub} {judul}"
        h = self._heading2(text)
        # Registrasi ke outline + bookmark — jadi entri level-2 Daftar Isi.
        self._sub_counter += 1
        bookmark = f"sub_{self._sub_counter}"
        self.attach_bookmark(h, bookmark)
        self.outline.append((2, text, bookmark))

    def add_sub_heading_3(self, judul: str) -> None:
        """Heading level 3 (tanpa penomoran, untuk sub-sub bab seperti Waktu Kerja dll)."""
        # Tambahkan 1 baris Enter pemisah sebelum Sub-Sub-BAB (persis dokumen Niken)
        self.add_spacing(1)
        p = self.doc.add_paragraph()
        p.style = self.doc.styles["Heading 3"]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(judul)
        run.font.name = "Times New Roman"
        run.font.size = Pt(self.heading_sizes[3])
        run.bold = True
        # Registrasi ke outline + bookmark — jadi entri level-3 Daftar Isi.
        self._sub3_counter += 1
        bookmark = f"sub3_{self._sub3_counter}"
        self.attach_bookmark(p, bookmark)
        self.outline.append((3, judul, bookmark))

    def add_numbered(self, text: str, number: int, indent_level: int = 0) -> None:
        """1. text — enumerated list (no bullets per formatting rules)."""
        p = self.doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
        p.paragraph_format.first_line_indent = Cm(-0.63)
        run = p.add_run(f"{number}. {text}")
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)

    def add_lettered(self, text: str, letter: str, indent_level: int = 0,
                     bold: bool = False) -> None:
        """a. text — lettered list. `letter` boleh sudah membawa penandanya
        sendiri ("a)"), kalau belum maka titik ditambahkan."""
        marker = letter if letter.endswith((")", ".", ":")) else f"{letter}."
        p = self.doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
        p.paragraph_format.first_line_indent = Cm(-0.63)
        run = p.add_run(f"{marker} {text}")
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        if bold:
            run.bold = True

    def add_sub_item(self, text: str, indent_level: int = 1, bold: bool = False) -> None:
        """Sub-poin tanpa penanda nomor/huruf — dipakai untuk rincian di bawah
        sebuah item bernomor (mis. Area I, Area II)."""
        p = self.doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        if bold:
            run.bold = True

    def add_bullet_item(self, text: str, indent_level: int = 1, bullet_char: str = "•", bold: bool = False) -> None:
        """Buletan hitam (•) untuk rincian cabang di bawah Area I - III."""
        p = self.doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.27 * (indent_level + 1))
        p.paragraph_format.first_line_indent = Cm(-0.5)
        run_b = p.add_run(f"{bullet_char}  ")
        run_b.font.name = "Times New Roman"
        run_b.font.size = Pt(12)
        if bold:
            run_b.bold = True
        run_t = p.add_run(text)
        run_t.font.name = "Times New Roman"
        run_t.font.size = Pt(12)
        if bold:
            run_t.bold = True

    def add_simple_table(self, rows: list[list[str]]) -> Any:
        """Tabel data tanpa baris header (mis. rincian nominal: label | nilai)."""
        if not rows:
            return None
        cols = max(len(r) for r in rows)
        table = self.doc.add_table(rows=len(rows), cols=cols)
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Proporsional lebar kolom agar selebar area teks (misal 13.5cm)
        if cols == 2:
            table.autofit = False
            for row in table.rows:
                row.cells[0].width = Cm(8.5)
                row.cells[1].width = Cm(5.0)

        for r_idx, row_data in enumerate(rows):
            for c_idx in range(cols):
                cell = table.rows[r_idx].cells[c_idx]
                value = str(row_data[c_idx]) if c_idx < len(row_data) else ""
                self._fill_cell(cell, value, size=11)
        return table

    def add_caption(self, text: str, bookmark: str | None = None) -> None:
        """Caption gambar (Gambar 4. 1) — Times New Roman 10pt Italic, center."""
        p = self.doc.add_paragraph()
        p.style = self.doc.styles["Caption"]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.italic = True
        run.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
        if bookmark:
            self.attach_bookmark(p, bookmark)

    def add_image(self, image_path: str, caption: str = "", width_cm: float = 10) -> None:
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(image_path, width=Cm(width_cm))
        if caption:
            p_cap = self.doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.style = self.doc.styles.get("Caption", self.doc.styles["Normal"])
            run = p_cap.add_run(caption)
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            run.italic = True
            run.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    def add_table(self, headers: list[str], rows: list[list[str]]) -> Any:
        if headers == ["HARI", "JAM KERJA", "KETERANGAN"]:
            return self.add_waktu_kerja_table(headers, rows)

        table = self.doc.add_table(rows=1 + len(rows), cols=len(headers))
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, h in enumerate(headers):
            cell = table.rows[0].cells[i]
            cell.text = ""
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(h)
            run.bold = True
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
        for r_idx, row_data in enumerate(rows):
            for c_idx, cell_text in enumerate(row_data):
                cell = table.rows[r_idx + 1].cells[c_idx]
                self._fill_cell(cell, str(cell_text), size=11)
        return table

    def add_waktu_kerja_table(self, headers: list[str], rows: list[list[str]]) -> Any:
        """Tabel Waktu Kerja & Istirahat Kerja persis seperti dokumen Niken:
        - Setiap slot jam/keterangan dipecah menjadi baris fisik terpisah.
        - Kolom 0 (HARI) di-merge vertikal (vMerge) mencakup seluruh slot jam di hari tersebut.
        - Teks HARI di-align vertikal CENTER dan horizontal CENTER.
        - Seluruh kolom (HARI, JAM KERJA, KETERANGAN) di-align CENTER.
        - Header Bold, Centered, Times New Roman 11pt.
        - Style Table Grid, cantSplit pada setiap baris.
        """
        expanded_slots: list[tuple[str, list[tuple[str, str]]]] = []
        for row in rows:
            hari = row[0] if len(row) > 0 else ""
            jam_raw = row[1] if len(row) > 1 else ""
            ket_raw = row[2] if len(row) > 2 else ""
            
            jam_list = [j.strip() for j in jam_raw.split("\n") if j.strip()] if jam_raw else ["-"]
            ket_list = [k.strip() for k in ket_raw.split("\n") if k.strip()] if ket_raw else ["-"]
            
            num_slots = max(len(jam_list), len(ket_list))
            slots: list[tuple[str, str]] = []
            for idx in range(num_slots):
                j_val = jam_list[idx] if idx < len(jam_list) else ""
                k_val = ket_list[idx] if idx < len(ket_list) else ""
                slots.append((j_val, k_val))
            expanded_slots.append((hari, slots))

        total_rows = 1 + sum(len(slots) for _, slots in expanded_slots)
        table = self.doc.add_table(rows=total_rows, cols=3)
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        col_widths = (Cm(3.5), Cm(4.5), Cm(5.5))

        hdr_cells = table.rows[0].cells
        for i, h_text in enumerate(headers):
            hdr_cells[i].width = col_widths[i]
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(h_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
            run.bold = True

        current_row_idx = 1
        for hari, slots in expanded_slots:
            start_row_idx = current_row_idx
            num_slots = len(slots)

            for slot_i, (jam_val, ket_val) in enumerate(slots):
                row = table.rows[current_row_idx]
                trPr = row._tr.get_or_add_trPr()
                trPr.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

                cells = row.cells
                for col_i in range(3):
                    cells[col_i].width = col_widths[col_i]

                p0 = cells[0].paragraphs[0]
                p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p0.paragraph_format.line_spacing = 1.0
                p0.paragraph_format.space_before = Pt(2)
                p0.paragraph_format.space_after = Pt(2)
                if slot_i == 0:
                    run0 = p0.add_run(hari)
                    run0.font.name = "Times New Roman"
                    run0.font.size = Pt(11)

                p1 = cells[1].paragraphs[0]
                p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p1.paragraph_format.line_spacing = 1.0
                p1.paragraph_format.space_before = Pt(2)
                p1.paragraph_format.space_after = Pt(2)
                run1 = p1.add_run(jam_val)
                run1.font.name = "Times New Roman"
                run1.font.size = Pt(11)

                p2 = cells[2].paragraphs[0]
                p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p2.paragraph_format.line_spacing = 1.0
                p2.paragraph_format.space_before = Pt(2)
                p2.paragraph_format.space_after = Pt(2)
                run2 = p2.add_run(ket_val)
                run2.font.name = "Times New Roman"
                run2.font.size = Pt(11)

                current_row_idx += 1

            if num_slots > 1:
                cell_top = table.rows[start_row_idx].cells[0]
                cell_bottom = table.rows[start_row_idx + num_slots - 1].cells[0]
                cell_top.merge(cell_bottom)

            tcPr = table.rows[start_row_idx].cells[0]._tc.get_or_add_tcPr()
            vAlign = parse_xml(r'<w:vAlign xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="center"/>')
            tcPr.append(vAlign)

        return table

    def _fill_cell(self, cell: Any, text: str, size: int = 11) -> None:
        """Isi sel; teks ber-newline jadi beberapa paragraf dalam sel yang sama
        (dipakai jadwal kerja: satu baris HARI menampung beberapa slot jam)."""
        cell.text = ""
        lines = text.split("\n") if text else [""]
        for i, line in enumerate(lines):
            p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(line)
            run.font.name = "Times New Roman"
            run.font.size = Pt(size)

    def add_daftar_pustaka(self, refs: list[str]) -> None:
        """Hanging indent 1.27cm (≈4 ketikan).

        Pedoman 1.7.2.h: dalam satu pustaka jarak 1 spasi, antar pustaka
        2 spasi (di sini: space_after 12pt). Legacy memakai 1.5 spasi
        seragam meniru dokumen lama.
        """
        pedoman = self.preset == "pedoman"
        for ref in refs:
            p = self.doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.0 if pedoman else 1.5
            p.paragraph_format.space_after = Pt(12) if pedoman else Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.left_indent = Cm(1.27)
            p.paragraph_format.first_line_indent = Cm(-1.27)
            run = p.add_run(ref)
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)

    # ------------------------------------------------------------------ #
    #  Save                                                               #
    # ------------------------------------------------------------------ #
    def save(self, path: str) -> str:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        self.doc.save(path)
        return path

    # ------------------------------------------------------------------ #
    #  Private helpers                                                    #
    # ------------------------------------------------------------------ #
    def _heading(self, text: str, bookmark: str | None = None) -> Any:
        h = self.doc.add_heading(text, level=1)
        for run in h.runs:
            run.font.name = "Times New Roman"
            run.font.color.rgb = RGBColor(0, 0, 0)
        if bookmark:
            self.attach_bookmark(h, bookmark)
        return h

    def _heading2(self, text: str) -> Any:
        h = self.doc.add_heading(text, level=2)
        for run in h.runs:
            run.font.name = "Times New Roman"
            run.font.color.rgb = RGBColor(0, 0, 0)
        return h

    def _center_run(
        self, text: str, size: int, bold: bool = False, underline: bool = False,
        line_spacing: float | None = None,
    ) -> None:
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if line_spacing is not None:
            p.paragraph_format.line_spacing = line_spacing
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(size)
        if bold:
            run.bold = True
        if underline:
            run.underline = True

    def _ttd_block(self, label: str, nama: str, size: int = 18, nip: str | None = None) -> None:
        self._center_run(label, size, bold=True)
        self.add_spacing(3)
        self._center_run(nama, size, bold=True, underline=True)
        if nip:
            self._center_run(f"NIP. {nip}", size)

    def _add_borderless_table(
        self, rows_data: list[tuple[str, str | None]],
        col_widths: tuple[float, float, float] = (6.89, 0.84, 8.06),
        font_size: int = 14,
        group_space_before: int = 10,
    ) -> None:
        table = self.doc.add_table(rows=len(rows_data), cols=3)
        table.style = "Normal Table"
        self._remove_all_borders(table)

        # Set Table Left Indent (tblInd = 100 twips = 0.18 cm, persis LAPORAN PKL NIKEN FIXED.docx)
        tblPr = table._tbl.tblPr
        tblInd = parse_xml(r'<w:tblInd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:w="100" w:type="dxa"/>')
        tblPr.append(tblInd)

        for i, (label, value) in enumerate(rows_data):
            row = table.rows[i]
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

            cells = row.cells
            cells[0].width = Cm(col_widths[0])
            cells[1].width = Cm(col_widths[1])
            cells[2].width = Cm(col_widths[2])

            # Jarak spasi kelompok (space_before) sebelum header kelompok data
            space_before_pt = group_space_before if label in (
                "Nama Sekolah", "Nama Orang Tua/Wali",
                "Pimpinan", "HRD / Ka. Tu", "Pembimbing"
            ) else 0

            self._set_cell_text(cells[0], label, bold=(value is None), size=font_size, space_before=space_before_pt)
            if value is None:
                self._set_cell_text(cells[1], "", size=font_size, space_before=space_before_pt)
                self._set_cell_text(cells[2], "", size=font_size, space_before=space_before_pt)
            else:
                self._set_cell_text(cells[1], ":", align=WD_ALIGN_PARAGRAPH.RIGHT, size=font_size, space_before=space_before_pt)
                self._set_cell_text(cells[2], f" {value}", size=font_size, space_before=space_before_pt)

    def _set_cell_text(
        self, cell: Any, text: str, bold: bool = False, size: int = 14,
        space_before: int = 0, align: Any = WD_ALIGN_PARAGRAPH.LEFT
    ) -> None:
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = align
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(str(text or ""))
        run.font.name = "Times New Roman"
        run.font.size = Pt(size)
        run.bold = bold

    def _remove_all_borders(self, table: Any) -> None:
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
            "</w:tblBorders>"
        )
        tblPr.append(borders)


def compute_toc_page_numbers(docx_path: str) -> dict[str, str]:
    """Hitung nomor halaman tiap bookmark dengan me-render via Microsoft Word.

    Memakai Word COM automation (Windows + MS Office): membuka dokumen hasil
    build, membaca ``Bookmark.Range.Information(wdActiveEndPageNumber)`` untuk
    tiap bookmark, dan menghitung nomor halaman relatif per section (Romawi
    untuk front-matter, Arab mulai 1 untuk body-matter). Hasil dipakai
    ``embed_toc_page_numbers`` untuk menanam angka final ke Daftar Isi.
    """
    try:
        import pythoncom  # type: ignore
        import win32com.client  # type: ignore
    except Exception:
        return {}

    WD_ACTIVE_END_PAGE_NUMBER = 3
    pages: dict[str, str] = {}
    word = None
    doc = None
    pythoncom.CoInitialize()
    try:
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        try:
            word.DisplayAlerts = 0
        except Exception:
            pass
        doc = word.Documents.Open(os.path.abspath(docx_path), ReadOnly=True, AddToRecentFiles=False)
        doc.Repaginate()

        # Paksa Word me-repaginate & hitung jumlah halaman fisik dokumen
        doc.ComputeStatistics(2)  # wdStatisticPages = 2

        # Map index section tempat bookmark berada
        def _sec_index(bm) -> int:
            try:
                rng = bm.Range
                sec = rng.Sections
                return sec.Item(1).Index if sec.Count else 1
            except Exception:
                return 1

        # Catat halaman fisik tempat tiap section DIMULAI:
        # Information(3) pada Section(i).Range mengembalikan halaman AKHIR section i,
        # sehingga section i+1 dimulai pada (halaman akhir section i) + 1.
        sec_starts: dict[int, int] = {1: 1}
        for i in range(1, doc.Sections.Count):
            try:
                end_pg = int(doc.Sections.Item(i).Range.Information(WD_ACTIVE_END_PAGE_NUMBER))
                sec_starts[i + 1] = end_pg + 1
            except Exception:
                sec_starts[i + 1] = 1

        for bm in doc.Bookmarks:
            name = bm.Name
            if not name or name.startswith("_"):
                continue
            try:
                phys_page = int(bm.Range.Information(WD_ACTIVE_END_PAGE_NUMBER))
                sec_idx = _sec_index(bm)
                sec_start = sec_starts.get(sec_idx, 1)

                rel_page = max(1, phys_page - sec_start + 1)
                if sec_idx <= 2:
                    # Section 1 (Cover) & Section 2 (Front Matter): Romawi kecil relatif per section (i, ii, iii, dst)
                    pages[name] = _to_roman(rel_page).lower()
                else:
                    # Section 3+ (Body Matter): Arab relatif per section, reset mulai 1
                    pages[name] = str(rel_page)
            except Exception:
                continue
        return pages
    except Exception:
        return {}
    finally:
        try:
            if doc is not None:
                doc.Close(False)
        except Exception:
            pass
        try:
            if word is not None:
                word.Quit()
        except Exception:
            pass
        pythoncom.CoUninitialize()


def _to_roman(n: int) -> str:
    """Konversi integer ke angka Romawi (untuk fallback format footer)."""
    vals = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
            (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
            (5, "V"), (4, "IV"), (1, "I")]
    out = ""
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out
