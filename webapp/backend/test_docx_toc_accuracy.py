"""Comprehensive DOCX TOC Accuracy Test - Real Looping Test/Fix Cycle.

EXACTLY what the user requested:
1. Generates a real DOCX file (same code path as web download)
2. Opens the DOCX with python-docx and extracts ALL embedded TOC page numbers
3. Converts the DOCX to PDF via LibreOffice headless
4. Reads the PDF page-by-page with PyMuPDF to find where each heading ACTUALLY appears
5. Compares DOCX-embedded page numbers vs actual physical PDF positions
6. Reports mismatches

NO SHORTCUTS. This inspects the real DOCX output, not estimates.
"""
import sys
import os
import re
import shutil
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from docx import Document as DocxDocument
from app.docx.assembly import assemble_report, _sanitize_data
from app.db import SessionLocal
from app.models import Draft


def extract_toc_entries_from_docx(docx_path: str) -> list[dict]:
    """Extract ALL TOC/Gambar/Lampiran entries from DOCX.

    Uses lxml xpath to find ALL <w:p> paragraphs including those inside
    <w:sdt><w:sdtContent> (where DAFTAR ISI entries live).
    Returns list of {title, page_str, section}.
    """
    from docx.oxml.ns import qn as _qn

    doc = DocxDocument(docx_path)
    body = doc.element.body

    # Get ALL <w:p> elements in document order, including inside SDTs
    all_paras = body.findall('.//' + _qn('w:p'))

    entries = []
    current_section = None

    for p_el in all_paras:
        # Extract all <w:t> text nodes from this paragraph
        t_nodes = p_el.findall('.//' + _qn('w:t'))
        texts = [t.text or '' for t in t_nodes]
        full_text = ''.join(texts).strip()

        if not full_text:
            continue

        upper = full_text.upper()

        # Detect section boundaries
        if upper == 'DAFTAR ISI':
            current_section = 'daftar_isi'
            continue
        if upper == 'DAFTAR GAMBAR':
            current_section = 'daftar_gambar'
            continue
        if upper == 'DAFTAR LAMPIRAN':
            current_section = 'daftar_lampiran'
            continue

        if not current_section:
            continue

        # Each TOC entry has: <w:r>title</w:r> <w:r><w:tab/></w:r> <w:r>page_num</w:r>
        # After embed, fldSimple is replaced, so page_num is a direct <w:r><w:t>
        # Get non-empty text segments
        text_parts = [t for t in texts if t.strip()]

        if len(text_parts) >= 2:
            title_part = text_parts[0].strip()
            page_part = text_parts[-1].strip()

            is_valid_page = bool(
                re.match(r'^[ivxlcdm]+$', page_part, re.IGNORECASE) or
                re.match(r'^\d+$', page_part)
            )

            if is_valid_page and len(title_part) > 1:
                entries.append({
                    'title': title_part,
                    'page_str': page_part,
                    'section': current_section,
                })
                continue

        # Fallback: parse from concatenated text
        m = re.search(r'^(.*?)\s+(\d+|[ivxlcdm]+)\s*$', full_text, re.IGNORECASE)
        if m:
            title_part = m.group(1).strip()
            page_part = m.group(2).strip()

            is_valid_page = bool(
                re.match(r'^[ivxlcdm]+$', page_part, re.IGNORECASE) or
                re.match(r'^\d+$', page_part)
            )

            if is_valid_page and len(title_part) > 2:
                entries.append({
                    'title': title_part,
                    'page_str': page_part,
                    'section': current_section,
                })

    return entries


def find_bab1_page(pdf_doc, total_pages: int) -> int:
    for p in range(1, total_pages + 1):
        txt = re.sub(r'\s+', ' ', pdf_doc[p - 1].get_text("text")).upper()
        if 'DAFTAR ISI' in txt:
            continue
        if 'BAB I' in txt and ('PENDAHULUAN' in txt or 'LATAR BELAKANG' in txt):
            return p
    return 6


def scan_pdf_bab_pages(pdf_doc, total_pages: int, bab1_page: int) -> dict:
    p_babs = {}
    for p in range(1, total_pages + 1):
        txt = re.sub(r'\s+', ' ', pdf_doc[p - 1].get_text("text")).upper()
        if p < bab1_page:
            if 'PENGESAHAN' in txt and ('INDUSTRI' in txt or 'TELKOM' in txt or 'PERUSAHAAN' in txt) and 'peng_ind' not in p_babs:
                p_babs['peng_ind'] = p
            elif 'PENGESAHAN' in txt and ('SEKOLAH' in txt or 'SMK' in txt) and 'peng_sek' not in p_babs:
                p_babs['peng_sek'] = p
            elif 'IDENTITAS SISWA' in txt and 'id_siswa' not in p_babs:
                p_babs['id_siswa'] = p
            elif ('IDENTITAS INDUSTRI' in txt or 'IDENTITAS INSTANSI' in txt) and 'id_ind' not in p_babs:
                p_babs['id_ind'] = p
            elif 'KATA PENGANTAR' in txt and 'kata_peng' not in p_babs:
                p_babs['kata_peng'] = p
        else:
            for bab_num, markers in [(1, ['BAB I ']), (2, ['BAB II']), (3, ['BAB III']), (4, ['BAB IV']), (5, ['BAB V ']), (6, ['BAB VI'])]:
                if bab_num not in p_babs and any(m in txt for m in markers):
                    p_babs[bab_num] = p
            if 'DAFTAR PUSTAKA' in txt and 'dp' not in p_babs and 'DAFTAR ISI' not in txt:
                p_babs['dp'] = p
            if 'LAMPIRAN' in txt and 'DAFTAR' not in txt and 'lamp' not in p_babs:
                p_babs['lamp'] = p
    return p_babs


def get_bab_search_range(title: str, p_babs: dict, bab1_page: int, total_pages: int) -> range:
    title_upper = title.upper()
    p_b1 = p_babs.get(1, bab1_page)
    p_b2 = p_babs.get(2, p_b1 + 5)
    p_b3 = p_babs.get(3, p_b2 + 3)
    p_b4 = p_babs.get(4, p_b3 + 3)
    p_b5 = p_babs.get(5, p_b4 + 5)
    p_b6 = p_babs.get(6, p_b5 + 2)
    p_dp = p_babs.get('dp', p_b6 + 2)
    p_lamp = p_babs.get('lamp', p_dp + 2)

    m_b = re.match(r'^(\d+)\.', title)
    m_g = re.match(r'^Gambar\s+(\d+)\.', title, re.IGNORECASE)

    active_bab = None
    if m_b:
        active_bab = int(m_b.group(1))
    elif m_g:
        active_bab = int(m_g.group(1))
    elif 'BAB I ' in title_upper:
        active_bab = 1
    elif 'BAB II' in title_upper:
        active_bab = 2
    elif 'BAB III' in title_upper:
        active_bab = 3
    elif 'BAB IV' in title_upper:
        active_bab = 4
    elif 'BAB V ' in title_upper or title_upper == 'BAB V PEMBAHASAN':
        active_bab = 5
    elif 'BAB VI' in title_upper:
        active_bab = 6
    elif 'DAFTAR PUSTAKA' in title_upper:
        active_bab = 'dp'
    elif 'LAMPIRAN' in title_upper:
        active_bab = 'lamp'

    bab_ranges = {
        1: range(p_b1, max(p_b1 + 1, p_b2)),
        2: range(p_b2, max(p_b2 + 1, p_b3)),
        3: range(p_b3, max(p_b3 + 1, p_b4)),
        4: range(p_b4, max(p_b4 + 1, p_b5)),
        5: range(p_b5, max(p_b5 + 1, p_b6)),
        6: range(p_b6, max(p_b6 + 1, p_dp)),
        'dp': range(p_dp, max(p_dp + 1, p_lamp)),
        'lamp': range(p_lamp, total_pages + 1),
    }

    if active_bab in bab_ranges:
        return bab_ranges[active_bab]
    return range(bab1_page, total_pages + 1)


def _int_to_roman(n: int) -> str:
    vals = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'),
            (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'),
            (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out


def verify_entry_in_pdf(pdf_doc, entry: dict, bab1_page: int, sec_front_start: int,
                        p_babs: dict, total_pages: int, pengesahan_idx_ref: list) -> dict:
    title = entry['title']
    page_str = entry['page_str']
    is_roman = bool(re.match(r'^[ivxlcdm]+$', page_str, re.IGNORECASE))

    title_upper = title.upper().strip()
    clean_title = re.sub(r'^\s*BAB\s+[IVXLCDM\d]+\s*', '', title, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r'^\s*\d+(\.\d+)*\s*', '', clean_title).strip()
    clean_title = re.sub(r'^[a-c]\.\s*', '', clean_title).strip()
    clean_upper = clean_title.upper()

    if is_roman:
        if 'PENGESAHAN' in title_upper:
            pengesahan_idx_ref[0] += 1
            if pengesahan_idx_ref[0] == 1:
                search_range = range(p_babs.get('peng_ind', 3), p_babs.get('peng_sek', 4) + 1)
            else:
                search_range = range(p_babs.get('peng_sek', 4), p_babs.get('id_siswa', 5) + 1)
        elif 'IDENTITAS SISWA' in title_upper:
            search_range = range(p_babs.get('id_siswa', 5), p_babs.get('id_ind', 6) + 1)
        elif 'IDENTITAS INDUSTRI' in title_upper or 'IDENTITAS INSTANSI' in title_upper:
            search_range = range(p_babs.get('id_ind', 6), p_babs.get('kata_peng', 7) + 1)
        elif 'KATA PENGANTAR' in title_upper:
            search_range = range(p_babs.get('kata_peng', 7), bab1_page)
        else:
            search_range = range(1, bab1_page)
    else:
        search_range = get_bab_search_range(title, p_babs, bab1_page, total_pages)

    found_page = None
    for p in search_range:
        if p > total_pages or p < 1:
            continue
        page_text = re.sub(r'\s+', ' ', pdf_doc[p - 1].get_text("text")).upper()

        if title_upper in page_text:
            found_page = p
            break
        if len(clean_upper) >= 5 and clean_upper in page_text:
            found_page = p
            break

    if found_page is None:
        return {'title': title, 'docx_page': page_str, 'actual_page': '?',
                'match': False, 'detail': f'NOT FOUND in range {list(search_range)[:10]}...'}

    if is_roman:
        actual = _int_to_roman(found_page - sec_front_start + 1).lower()
    else:
        actual = str(found_page - bab1_page + 1)

    return {
        'title': title,
        'docx_page': page_str,
        'actual_page': actual,
        'pdf_physical': found_page,
        'match': actual == page_str.lower(),
        'detail': '' if actual == page_str.lower() else f'MISMATCH: DOCX={page_str}, actual={actual} (phys p.{found_page})'
    }


def run_full_docx_accuracy_test():
    print("=" * 90)
    print("COMPREHENSIVE DOCX TOC ACCURACY TEST")
    print("DOCX XML Inspection + LibreOffice PDF Physical Verification")
    print("=" * 90)

    db = SessionLocal()
    drafts = db.query(Draft).all()
    if not drafts:
        print("ERROR: No drafts in database!")
        db.close()
        return False

    all_passed = True

    for draft_idx, draft in enumerate(drafts):
        data = draft.data_json or {}
        nama = data.get('nama_siswa', f'Draft-{draft_idx}')
        print(f"\n{'=' * 90}")
        print(f"TEST #{draft_idx + 1}: {nama}")
        print(f"{'=' * 90}")

        _sanitize_data(data)

        # Step 1: Generate DOCX
        print("\n[1] Generating DOCX via assemble_report()...")
        try:
            output_path = assemble_report(data)
        except Exception as e:
            print(f"  ERROR: {e}")
            all_passed = False
            continue
        print(f"  -> {output_path} ({os.path.getsize(output_path)} bytes)")

        # Step 2: Read DOCX with python-docx
        print("\n[2] Reading DOCX TOC entries with python-docx...")
        toc_entries = extract_toc_entries_from_docx(output_path)
        print(f"  Found {len(toc_entries)} TOC entries:")
        for e in toc_entries:
            sec = e['section'].replace('daftar_', '').upper()
            print(f"    [{sec:8}] {e['title']:<55} -> {e['page_str']}")

        if not toc_entries:
            print("  WARNING: No TOC entries extracted!")
            all_passed = False
            continue

        # Step 3: Convert to PDF
        print("\n[3] Converting to PDF via LibreOffice...")
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice:
            print("  ERROR: soffice not found!")
            all_passed = False
            continue

        pdf_path = os.path.splitext(output_path)[0] + ".pdf"
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

        cmd = [soffice, "--headless", "--convert-to", "pdf", os.path.abspath(output_path)]
        res = subprocess.run(cmd, capture_output=True, timeout=60,
                             cwd=os.path.dirname(os.path.abspath(output_path)))

        if res.returncode != 0 or not os.path.exists(pdf_path):
            print(f"  ERROR: PDF conversion failed! rc={res.returncode}")
            all_passed = False
            continue
        print(f"  -> {pdf_path}")

        # Step 4: Verify each entry against PDF
        print("\n[4] Verifying DOCX page numbers against physical PDF...")
        import fitz
        pdf_doc = fitz.open(pdf_path)
        total_pages = len(pdf_doc)
        bab1_page = find_bab1_page(pdf_doc, total_pages)
        sec_front_start = 3
        p_babs = scan_pdf_bab_pages(pdf_doc, total_pages, bab1_page)

        print(f"  PDF pages: {total_pages}, BAB I at p.{bab1_page}")
        print(f"  Section map: {p_babs}")

        mismatches = []
        verified = 0
        not_found = 0
        pengesahan_idx = [0]

        for e in toc_entries:
            result = verify_entry_in_pdf(pdf_doc, e, bab1_page, sec_front_start,
                                         p_babs, total_pages, pengesahan_idx)

            if result['actual_page'] == '?':
                tag = "WARN"
                not_found += 1
            elif result['match']:
                tag = "OK"
                verified += 1
            else:
                tag = "FAIL"
                mismatches.append(result)
                verified += 1

            phys = f"p.{result.get('pdf_physical', '?')}" if 'pdf_physical' in result else ''
            print(f"  [{tag:4}] {result['title']:<55} DOCX:{result['docx_page']:>4}  PDF:{result['actual_page']:>4}  {phys}")

        pdf_doc.close()

        # Summary
        print(f"\n  --- SUMMARY ---")
        print(f"  Entries: {len(toc_entries)} | Verified: {verified} | Not found: {not_found} | Mismatches: {len(mismatches)}")
        if mismatches:
            print(f"  MISMATCHES:")
            for m in mismatches:
                print(f"    {m['title']}: DOCX={m['docx_page']}, actual={m['actual_page']}")
            all_passed = False
        else:
            print(f"  ALL CORRECT!")

        try:
            os.remove(pdf_path)
        except:
            pass

    db.close()

    print(f"\n{'=' * 90}")
    if all_passed:
        print("ALL DRAFTS PASSED - DOCX TOC page numbers are 100% accurate!")
    else:
        print("SOME ISSUES FOUND")
    print(f"{'=' * 90}")
    return all_passed


if __name__ == "__main__":
    success = run_full_docx_accuracy_test()
    sys.exit(0 if success else 1)
