"""Print Full Table of Contents (Daftar Isi, Daftar Gambar, Daftar Lampiran) Test Results.

Script ini memicu build 5 file .docx riil (SHORT, MEDIUM, LONG, XLONG, WITH_IMAGES),
lalu mengekstrak dan menampilkan SELURUH entri Daftar Isi, Sub-bab, Sub-sub-bab,
Daftar Gambar, dan Daftar Lampiran secara FULL (100% tanpa ada yang dipotong/ditruncate).
"""

import sys
import os
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report, _generate_sections_list, _sanitize_data, _normalize_modules, _auto_select_modules, ALL_BAB_MODULES, _build_front_matter, _build_bab_content
from app.docx.builder import PklDocBuilder
from test_honest_docx_inspection import create_honest_mock_context

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

def print_full_toc_for_mode(mode: str, idx: int):
    ctx = create_honest_mock_context(idx, mode)
    _sanitize_data(ctx)
    builder = PklDocBuilder()
    bab_modules = _normalize_modules(ctx.get("config", {}).get("bab_modules") or _auto_select_modules(ctx))
    bab_modules = [m for m in bab_modules if m in ALL_BAB_MODULES]

    _build_front_matter(builder, ctx, bab_modules)
    _build_bab_content(builder, ctx, bab_modules)

    docx_path = assemble_report(ctx)

    print(f"\n" + "=" * 90)
    print(f"📑 FULL DETAIL TEST DAFTAR ISI, DAFTAR GAMBAR, & DAFTAR LAMPIRAN - MODE: [{mode.upper()}]")
    print("=" * 90)
    print(f"📦 File DOCX: {os.path.basename(docx_path)}")

    # Unzip word/document.xml to inspect XML nodes
    with zipfile.ZipFile(docx_path, 'r') as z:
        xml_bytes = z.read("word/document.xml")
    root = ET.fromstring(xml_bytes)

    # Extract all text paragraphs with tabs and fldSimple PAGEREF inside sdtContent (Daftar Isi)
    sdt_elem = root.find(f".//{{{NS['w']}}}sdtContent")

    print("\n--- 1. DAFTAR ISI (FULL STRUCTURE & EMBEDDED PAGE NUMBERS) ---")
    if sdt_elem is not None:
        p_idx = 1
        for p in sdt_elem.findall(f".//{{{NS['w']}}}p"):
            # Get text
            texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
            full_text = "".join(texts).strip()

            # Get PAGEREF bookmark & value
            fld = p.find(f".//{{{NS['w']}}}fldSimple")
            if fld is not None:
                instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
                parts = instr.strip().split()
                target_bm = parts[1] if len(parts) > 1 else ""
                t_elem = fld.find(f".//{{{NS['w']}}}t")
                embedded_pg = t_elem.text if t_elem is not None else ""

                print(f"  {p_idx:02d}. {full_text:<62} -> [Bookmark: {target_bm:<20}] -> Halaman: [{embedded_pg}]")
                p_idx += 1

    # Extract all paragraphs outside SDT that contain PAGEREF (Daftar Gambar & Daftar Lampiran)
    print("\n--- 2. DAFTAR GAMBAR & DAFTAR LAMPIRAN (FULL ENTRIES) ---")
    other_p_idx = 1
    has_other = False
    for p in root.findall(f".//{{{NS['w']}}}p"):
        if sdt_elem is not None and p in list(sdt_elem.iter()):
            continue
        fld = p.find(f".//{{{NS['w']}}}fldSimple")
        if fld is not None:
            instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
            if "PAGEREF" in instr:
                has_other = True
                parts = instr.strip().split()
                target_bm = parts[1] if len(parts) > 1 else ""
                texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
                full_text = "".join(texts).strip()
                t_elem = fld.find(f".//{{{NS['w']}}}t")
                embedded_pg = t_elem.text if t_elem is not None else ""

                print(f"  {other_p_idx:02d}. {full_text:<62} -> [Bookmark: {target_bm:<20}] -> Halaman: [{embedded_pg}]")
                other_p_idx += 1

    if not has_other:
        print("  (Tidak ada Daftar Gambar / Lampiran pada mode ini karena tidak ada gambar/foto)")

    print("\n" + "=" * 90)

def main():
    modes = ["short", "medium", "long", "xlong", "with_images"]
    for idx, mode in enumerate(modes, 1):
        print_full_toc_for_mode(mode, idx)

if __name__ == "__main__":
    main()
