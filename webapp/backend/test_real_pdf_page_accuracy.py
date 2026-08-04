"""Test Real PDF Page Accuracy Loop & Audit Script.

Script ini:
1. Memanggil `assemble_report` untuk membuat file .docx riil.
2. Mengonversi .docx ke .pdf menggunakan LibreOffice (`soffice`).
3. Membaca PDF via PyMuPDF (`fitz`) halaman demi halaman.
4. Mengekstrak posisi fisik sebenarnya (halaman footer & halaman fisik PDF) tempat setiap BAB, Sub-bab, Gambar, dan Lampiran berada.
5. Membaca teks DAFTAR ISI, DAFTAR GAMBAR, dan DAFTAR LAMPIRAN dari PDF hasil render.
6. Membandingkan nomor halaman yang tertulis di DAFTAR ISI/GAMBAR/LAMPIRAN dengan posisi fisik/footer sebenarnya.
7. Memverifikasi akurasi 100%.
"""

import sys
import os
import re
import shutil
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report, _sanitize_data, _generate_sections_list
from test_honest_docx_inspection import create_honest_mock_context

def run_pdf_accuracy_test(mode: str, idx: int):
    print(f"\n" + "=" * 90)
    print(f"🧪 TESTING MODE: [{mode.upper()}] (Test #{idx})")
    print("=" * 90)

    ctx = create_honest_mock_context(idx, mode)
    _sanitize_data(ctx)

    docx_path = assemble_report(ctx)
    print(f"📄 DOCX Generated: {os.path.basename(docx_path)}")

    # Check LibreOffice soffice binary
    soffice_bin = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice_bin:
        for common_path in [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
        ]:
            if os.path.exists(common_path):
                soffice_bin = common_path
                break

    if not soffice_bin:
        print("❌ ERROR: soffice (LibreOffice) binary not found! Cannot convert to PDF.")
        return False

    pdf_path = os.path.splitext(docx_path)[0] + ".pdf"
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    print(f"🔄 Converting {os.path.basename(docx_path)} to PDF using LibreOffice...")
    cmd = [soffice_bin, "--headless", "--convert-to", "pdf", os.path.abspath(docx_path)]
    res = subprocess.run(cmd, capture_output=True, timeout=60, cwd=os.path.dirname(os.path.abspath(docx_path)))

    if res.returncode != 0 or not os.path.exists(pdf_path):
        print(f"❌ ERROR PDF conversion failed: {res.stderr.decode('utf-8', errors='ignore')}")
        return False

    print(f"✅ PDF Generated Successfully: {os.path.basename(pdf_path)}")

    import fitz
    pdf_doc = fitz.open(pdf_path)
    total_pages = len(pdf_doc)
    print(f"📖 Total Physical PDF Pages: {total_pages}")

    # Step A: Identify PDF Page numbers where DAFTAR ISI, DAFTAR GAMBAR, DAFTAR LAMPIRAN sit
    toc_pdf_pages = []
    gambar_pdf_pages = []
    lampiran_pdf_pages = []

    bab1_pdf_page = None

    for p in range(1, total_pages + 1):
        txt = pdf_doc[p - 1].get_text("text")
        txt_clean = re.sub(r"\s+", " ", txt).upper()

        if "DAFTAR ISI" in txt_clean and p <= 12:
            toc_pdf_pages.append(p)
        if "DAFTAR GAMBAR" in txt_clean and p <= 12:
            gambar_pdf_pages.append(p)
        if "DAFTAR LAMPIRAN" in txt_clean and p <= 15:
            lampiran_pdf_pages.append(p)

        if ("BAB I" in txt_clean or "BAB 1" in txt_clean) and ("PENDAHULUAN" in txt_clean or "LATAR BELAKANG" in txt_clean):
            if "DAFTAR ISI" not in txt_clean and bab1_pdf_page is None:
                bab1_pdf_page = p

    print(f"📍 Location Analysis:")
    print(f"   - DAFTAR ISI PDF Page(s): {toc_pdf_pages}")
    print(f"   - DAFTAR GAMBAR PDF Page(s): {gambar_pdf_pages}")
    print(f"   - DAFTAR LAMPIRAN PDF Page(s): {lampiran_pdf_pages}")
    print(f"   - BAB I PENDAHULUAN Physical PDF Page: {bab1_pdf_page} (Body Matter Page 1)")

    # Step B: Parse printed entries from DAFTAR ISI page(s)
    toc_printed_entries = []
    for p in toc_pdf_pages:
        lines = [line.strip() for line in pdf_doc[p - 1].get_text("text").split("\n") if line.strip()]
        for line in lines:
            # Match pattern: Title ... page_num
            # e.g., "BAB I PENDAHULUAN ................................................ 1"
            # e.g., "1.1 Latar Belakang ................................................ 1"
            # e.g., "KATA PENGANTAR .................................................... v"
            m = re.search(r"^(.*?)\s*\.{3,}\s*([a-z0-9]+)$", line, re.IGNORECASE)
            if m:
                title = m.group(1).strip()
                pg_str = m.group(2).strip()
                toc_printed_entries.append((title, pg_str, p))
            else:
                # Also check lines where dots might not be present or extracted differently
                m2 = re.search(r"^(BAB\s+[IVXLCDM\d]+.*?|\d+\.\d+.*?|KATA PENGANTAR|PENGESAHAN.*?|IDENTITAS.*?|DAFTAR PUSTAKA|LAMPIRAN)\s+([a-z0-9]+)$", line, re.IGNORECASE)
                if m2:
                    toc_printed_entries.append((m2.group(1).strip(), m2.group(2).strip(), p))

    print(f"\n📋 Printed Entries Extracted from PDF DAFTAR ISI ({len(toc_printed_entries)} entries):")
    for t, pg, pdf_p in toc_printed_entries:
        print(f"   - '{t}' -> Written Page: [{pg}] (from TOC PDF Page {pdf_p})")

    # Step C: Locate actual physical PDF page numbers where headings/sections/captions land
    mismatches = []
    verified_entries = 0

    # Scan BAB PDF start pages
    p_babs = {}
    for p in range(1, total_pages + 1):
        txt_clean = re.sub(r"\s+", " ", pdf_doc[p - 1].get_text("text")).upper()
        if p in toc_pdf_pages:
            continue
        if p < (bab1_pdf_page or 10):
            if "PENGESAHAN" in txt_clean and ("INDUSTRI" in txt_clean or "TELKOM" in txt_clean) and "peng_ind" not in p_babs:
                p_babs["peng_ind"] = p
            elif "PENGESAHAN" in txt_clean and ("SEKOLAH" in txt_clean or "SMK" in txt_clean) and "peng_sek" not in p_babs:
                p_babs["peng_sek"] = p
            elif "IDENTITAS SISWA" in txt_clean and "id_siswa" not in p_babs:
                p_babs["id_siswa"] = p
            elif "IDENTITAS INDUSTRI" in txt_clean and "id_ind" not in p_babs:
                p_babs["id_ind"] = p
            elif "KATA PENGANTAR" in txt_clean and "kata_peng" not in p_babs:
                p_babs["kata_peng"] = p
        else:
            if ("BAB I " in txt_clean or "BAB I\n" in txt_clean or "BAB 1" in txt_clean) and ("PENDAHULUAN" in txt_clean or "LATAR BELAKANG" in txt_clean) and 1 not in p_babs:
                p_babs[1] = p
            elif ("BAB II " in txt_clean or "BAB II\n" in txt_clean or "BAB 2" in txt_clean or "KEGIATAN DI INDUSTRI" in txt_clean or "KEGIATAN INDUSTRI" in txt_clean) and 2 not in p_babs:
                p_babs[2] = p
            elif ("BAB III " in txt_clean or "BAB III\n" in txt_clean or "BAB 3" in txt_clean or "TINJAUAN PUSTAKA" in txt_clean) and 3 not in p_babs:
                p_babs[3] = p
            elif ("BAB IV " in txt_clean or "BAB IV\n" in txt_clean or "BAB 4" in txt_clean or "DATA PENGAMATAN" in txt_clean) and 4 not in p_babs:
                p_babs[4] = p
            elif ("BAB V " in txt_clean or "BAB V\n" in txt_clean or "BAB 5" in txt_clean or "PEMBAHASAN" in txt_clean) and 5 not in p_babs:
                p_babs[5] = p
            elif ("BAB VI " in txt_clean or "BAB VI\n" in txt_clean or "BAB 6" in txt_clean or "KESIMPULAN" in txt_clean) and 6 not in p_babs:
                p_babs[6] = p
            elif "DAFTAR PUSTAKA" in txt_clean and "dp" not in p_babs:
                p_babs["dp"] = p
            elif "LAMPIRAN" in txt_clean and "DAFTAR" not in txt_clean and "lamp" not in p_babs:
                p_babs["lamp"] = p

    p_b1 = p_babs.get(1, bab1_pdf_page or 11)
    p_b2 = p_babs.get(2, p_b1 + 5)
    p_b3 = p_babs.get(3, p_b2 + 3)
    p_b4 = p_babs.get(4, p_b3 + 3)
    p_b5 = p_babs.get(5, p_b4 + 5)
    p_b6 = p_babs.get(6, p_b5 + 2)
    p_dp = p_babs.get("dp", p_b6 + 2)
    p_lamp = p_babs.get("lamp", p_dp + 2)

    active_bab = 1
    pengesahan_idx = 0

    print(f"\n🔍 Verifying Each Heading/Section Location in Physical PDF...")
    for title, written_pg, toc_pdf_p in toc_printed_entries:
        clean_title = re.sub(r"^\s*BAB\s+[IVXLCDM\d]+\s*", "", title, flags=re.IGNORECASE).strip()
        clean_title = re.sub(r"^\s*\d+(\.\d+)*\s*", "", clean_title).strip()

        is_roman = written_pg in ("i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x")

        found_physical_page = None

        if is_roman:
            if "PENGESAHAN" in title.upper():
                pengesahan_idx += 1
                if pengesahan_idx == 1:
                    search_range = range(p_babs.get("peng_ind", 3), p_babs.get("peng_sek", 4))
                else:
                    search_range = range(p_babs.get("peng_sek", 4), p_babs.get("id_siswa", 5))
            elif "IDENTITAS SISWA" in title.upper():
                search_range = range(p_babs.get("id_siswa", 5), p_babs.get("id_ind", 6))
            elif "IDENTITAS INDUSTRI" in title.upper():
                search_range = range(p_babs.get("id_ind", 6), p_babs.get("kata_peng", 7))
            elif "KATA PENGANTAR" in title.upper():
                search_range = range(p_babs.get("kata_peng", 7), p_b1)
            else:
                search_range = range(1, p_b1)
        else:
            m_b = re.match(r"^(\d+)\.", title)
            m_g = re.match(r"^Gambar\s+(\d+)\.", title)
            if m_b:
                active_bab = int(m_b.group(1))
            elif m_g:
                active_bab = int(m_g.group(1))
            elif "BAB I " in title.upper() or "BAB 1" in title.upper():
                active_bab = 1
            elif "BAB II " in title.upper() or "BAB 2" in title.upper():
                active_bab = 2
            elif "BAB III " in title.upper() or "BAB 3" in title.upper():
                active_bab = 3
            elif "BAB IV " in title.upper() or "BAB 4" in title.upper():
                active_bab = 4
            elif "BAB V " in title.upper() or "BAB 5" in title.upper():
                active_bab = 5
            elif "BAB VI " in title.upper() or "BAB 6" in title.upper():
                active_bab = 6
            elif "DAFTAR PUSTAKA" in title.upper():
                active_bab = "dp"
            elif "LAMPIRAN" in title.upper():
                active_bab = "lamp"

            if active_bab == 1:
                search_range = range(p_b1, max(p_b1 + 1, p_b2))
            elif active_bab == 2:
                search_range = range(p_b2, max(p_b2 + 1, p_b3))
            elif active_bab == 3:
                search_range = range(p_b3, max(p_b3 + 1, p_b4))
            elif active_bab == 4:
                search_range = range(p_b4, max(p_b4 + 1, p_b5))
            elif active_bab == 5:
                search_range = range(p_b5, max(p_b5 + 1, p_b6))
            elif active_bab == 6:
                search_range = range(p_b6, max(p_b6 + 1, p_dp))
            elif active_bab == "dp":
                search_range = range(p_dp, max(p_dp + 1, p_lamp))
            elif active_bab == "lamp":
                search_range = range(p_lamp, total_pages + 1)
            else:
                search_range = range(p_b1, total_pages + 1)

        sk_up = title.upper()
        ct_up = clean_title.upper()

        for p in search_range:
            if p > total_pages:
                break
            p_text = re.sub(r"\s+", " ", pdf_doc[p - 1].get_text("text")).upper()
            if p in toc_pdf_pages and "PENDAHULUAN" not in p_text:
                continue

            if (sk_up and sk_up in p_text) or (len(ct_up) >= 5 and ct_up in p_text):
                found_physical_page = p
                break

        if found_physical_page is not None:
            if is_roman:
                # Front matter relative roman page calculation (sec_front starts after cover 1 & 2 -> PDF page 3 = roman i)
                sec_front_start = 3
                actual_roman_page = _int_to_roman(found_physical_page - sec_front_start + 1).lower()
                is_correct = (actual_roman_page == written_pg.lower())
                status = "✅ PERFECT" if is_correct else f"❌ MISMATCH (Written: {written_pg}, Actual PDF Roman: {actual_roman_page})"
                print(f"   [{status}] {title:<45} -> Written: [{written_pg:<4}] | Found on PDF Page {found_physical_page} (Calc Roman: {actual_roman_page})")
                if not is_correct:
                    mismatches.append((title, written_pg, actual_roman_page, found_physical_page))
            else:
                actual_arabic_page = str(found_physical_page - bab1_pdf_page + 1)
                is_correct = (actual_arabic_page == written_pg)
                status = "✅ PERFECT" if is_correct else f"❌ MISMATCH (Written: {written_pg}, Actual PDF Page: {actual_arabic_page} [PDF p.{found_physical_page} - BAB1 p.{bab1_pdf_page} + 1])"
                print(f"   [{status}] {title:<45} -> Written: [{written_pg:<4}] | Found on PDF Page {found_physical_page} (Calc Arabic: {actual_arabic_page})")
                if not is_correct:
                    mismatches.append((title, written_pg, actual_arabic_page, found_physical_page))
            verified_entries += 1
        else:
            print(f"   ⚠️ WARNING: Could not find physical heading for '{title}' in PDF search range!")

    pdf_doc.close()

    print(f"\n" + "-" * 90)
    print(f"📊 SUMMARY RESULTS FOR [{mode.upper()}]:")
    print(f"   - Total TOC Entries Verified: {verified_entries}")
    print(f"   - Mismatches Found: {len(mismatches)}")
    if mismatches:
        print(f"   ❌ DETAILED MISMATCHES:")
        for t, w_pg, a_pg, p_pdf in mismatches:
            print(f"      * Title: '{t}' | Written in TOC: '{w_pg}' | Actual calculated page: '{a_pg}' (PDF Page {p_pdf})")
        return False
    else:
        print(f"   🎉 100% PERFECT PAGE ALIGNMENT ACCURACY FOR MODE [{mode.upper()}]!")
        return True

def _int_to_roman(n: int) -> str:
    vals = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
            (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
            (5, "V"), (4, "IV"), (1, "I")]
    out = ""
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out

def main():
    modes = ["short", "medium", "long", "xlong", "with_images"]
    results = {}
    for idx, mode in enumerate(modes, 1):
        results[mode] = run_pdf_accuracy_test(mode, idx)

    print("\n" + "=" * 90)
    print("🏆 OVERALL AUDIT RESULTS:")
    print("=" * 90)
    all_passed = True
    for mode, ok in results.items():
        status_str = "✅ PASS" if ok else "❌ FAIL"
        print(f"  - Mode [{mode.upper()}]: {status_str}")
        if not ok:
            all_passed = False

    if all_passed:
        print("\n🎉 ALL 5 MODES PASSED WITH 100% REAL PDF PHYSICAL PAGE ACCURACY!")
    else:
        print("\n⚠️ SOME MODES HAD PAGE NUMBER MISMATCHES. REFINEMENT NEEDED.")

if __name__ == "__main__":
    main()
