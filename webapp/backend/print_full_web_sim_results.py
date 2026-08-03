"""Print 100% Full Un-truncated Web Simulation Test Results.

Script ini memicu build 6 skenario web simulation riil dan menampilkan
seluruh entri Daftar Isi, Sub-bab, Sub-sub-bab, Daftar Gambar, dan Daftar Lampiran secara FULL (100% tanpa dipotong).
"""

import sys
import os
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.assembly import assemble_report
from test_web_simulation_looping import create_web_simulation_context

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

def print_full_web_sim(scenario_name: str, idx: int):
    ctx = create_web_simulation_context(scenario_name, idx)
    docx_path = assemble_report(ctx)

    print(f"\n" + "=" * 95)
    print(f"📑 FULL DETAIL WEBSIM TEST RESULTS - SKENARIO #{idx}: [{scenario_name.upper()}]")
    print("=" * 95)
    print(f"📦 File DOCX Generated: {os.path.basename(docx_path)}")

    # Unzip document.xml
    with zipfile.ZipFile(docx_path, 'r') as z:
        xml_bytes = z.read("word/document.xml")
    root = ET.fromstring(xml_bytes)

    sdt_elem = root.find(f".//{{{NS['w']}}}sdtContent")

    print("\n--- 1. DAFTAR ISI (FULL STRUCTURE & EMBEDDED PAGE NUMBERS) ---")
    if sdt_elem is not None:
        p_idx = 1
        for p in sdt_elem.findall(f".//{{{NS['w']}}}p"):
            texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
            full_text = "".join(texts).strip()

            fld = p.find(f".//{{{NS['w']}}}fldSimple")
            if fld is not None:
                instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
                parts = instr.strip().split()
                target_bm = parts[1] if len(parts) > 1 else ""
                t_elem = fld.find(f".//{{{NS['w']}}}t")
                embedded_pg = t_elem.text if t_elem is not None else ""

                print(f"  {p_idx:02d}. {full_text:<68} -> [BM: {target_bm:<18}] -> Halaman: [{embedded_pg}]")
                p_idx += 1

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

                print(f"  {other_p_idx:02d}. {full_text:<68} -> [BM: {target_bm:<18}] -> Halaman: [{embedded_pg}]")
                other_p_idx += 1

    if not has_other:
        print("  (Tidak ada Daftar Gambar / Lampiran pada skenario ini)")

    print("\n" + "=" * 95)

def main():
    scenarios = [
        "web_sim_short",
        "web_sim_medium",
        "web_sim_long_with_equipment_and_photos",
        "web_sim_xlong_with_heavy_content",
        "web_sim_telkom_lampung_exact",
        "web_sim_multi_page_photos"
    ]
    for idx, sc in enumerate(scenarios, 1):
        print_full_web_sim(sc, idx)

if __name__ == "__main__":
    main()
