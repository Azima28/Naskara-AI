"""Script Inspeksi Halaman DOCX (Daftar Isi & Daftar Lampiran).

Membaca file .docx hasil generate (dari Local atau Docker), lalu menampilkan:
1. Semua bookmark & nomor halaman yang tertanam di field PAGEREF (Daftar Isi / Lampiran).
2. Membandingkan dengan halaman fisik aktual via LibreOffice/MS Word jika ada.

Penggunaan:
    python inspect_docx_pages.py <path_to_docx_file>
"""
import os
import sys
import shutil
import subprocess
import re
from docx import Document
from docx.oxml.ns import qn

def inspect_docx(docx_path: str):
    if not os.path.exists(docx_path):
        print(f"❌ File tidak ditemukan: {docx_path}")
        return

    print("=" * 70)
    print(f"📄 MEMERIKSA FILE: {os.path.basename(docx_path)}")
    print("=" * 70)

    doc = Document(docx_path)

    # 1. Ekstrak semua PAGEREF embedded
    embedded_pages = {}
    print("\n[1] Field PAGEREF Tertanam di Dokumen (Daftar Isi & Daftar Lampiran):")
    print("-" * 70)
    print(f"{'Bookmark':<25} | {'Nomor Halaman Tertanam':<20}")
    print("-" * 70)

    for fld in doc.element.body.xpath('.//w:fldSimple[contains(@w:instr, "PAGEREF")]'):
        instr = fld.get(qn("w:instr")) or ""
        parts = instr.split()
        if len(parts) >= 2:
            bookmark = parts[1]
            ts = fld.findall('.//' + qn('w:t'))
            page_str = ts[0].text if ts else "-"
            embedded_pages[bookmark] = page_str
            print(f"{bookmark:<25} | {page_str:<20}")

    if not embedded_pages:
        print("⚠️ Tidak ditemukan field PAGEREF di dalam dokumen ini.")

    # 2. Cek fisik via LibreOffice PDF jika soffice/libreoffice ada
    soffice_bin = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice_bin:
        for common in [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
        ]:
            if os.path.exists(common):
                soffice_bin = common
                break

    if soffice_bin:
        print("\n[2] Memeriksa Halaman Fisik Aktual via LibreOffice + PyMuPDF...")
        pdf_path = os.path.splitext(os.path.abspath(docx_path))[0] + "_inspect.pdf"
        try:
            cmd = [soffice_bin, "--headless", "--convert-to", "pdf", os.path.abspath(docx_path), "--outdir", os.path.dirname(os.path.abspath(docx_path))]
            res = subprocess.run(cmd, capture_output=True, timeout=45)
            created_pdf = os.path.splitext(os.path.abspath(docx_path))[0] + ".pdf"
            if os.path.exists(created_pdf):
                os.rename(created_pdf, pdf_path)

            if os.path.exists(pdf_path):
                import fitz
                pdf_doc = fitz.open(pdf_path)
                total = len(pdf_doc)
                print(f"   Total Halaman PDF hasil render LibreOffice: {total} Halaman")

                # Cari BAB I
                bab1_pg = None
                for p in range(1, total + 1):
                    txt = pdf_doc[p - 1].get_text("text")
                    if "BAB I" in txt.upper() and "PENDAHULUAN" in txt.upper() and "DAFTAR ISI" not in txt.upper():
                        bab1_pg = p
                        break
                print(f"   Halaman tempat BAB I PENDAHULUAN dimulai: Halaman fisik {bab1_pg or 'Tidak Ditemukan'}")

                # Print ringkasan halaman per bab di PDF
                print("\n   Daftar Posisi Judul Utama di PDF:")
                for p in range(1, total + 1):
                    txt = pdf_doc[p - 1].get_text("text")
                    lines = [l.strip() for l in txt.split("\n") if l.strip()]
                    for l in lines:
                        if any(l.startswith(k) for k in ["BAB ", "DAFTAR ", "KATA PENGANTAR", "LAMPIRAN", "PENGESAHAN", "IDENTITAS"]):
                            rel = (p - bab1_pg + 1) if bab1_pg and p >= bab1_pg else f"({p})"
                            print(f"   - Hal {p:<3} [relatif: {str(rel):<4}] : {l[:60]}")

                pdf_doc.close()
                os.remove(pdf_path)
        except Exception as e:
            print(f"⚠️ Gagal ekstraksi PDF LibreOffice: {e}")
    else:
        print("\n[2] LibreOffice tidak terdeteksi di environment ini.")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect_docx(sys.argv[1])
    else:
        # Cari file docx terbaru di webapp/output
        output_dir = os.path.join(os.path.dirname(__file__), "..", "output")
        if os.path.exists(output_dir):
            files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith(".docx")]
            if files:
                latest = max(files, key=os.path.getmtime)
                inspect_docx(latest)
            else:
                print("Tidak ada file .docx di webapp/output")
        else:
            print("Folder webapp/output tidak ditemukan")
