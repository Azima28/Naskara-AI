import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from app.docx.assembly import assemble_report
from test_web_simulation_looping import create_web_simulation_context

ctx = create_web_simulation_context("web_sim_telkom_lampung_exact", 6)
docx_path = assemble_report(ctx)

print("=" * 80)
print(f"GENERATING REPORT WITH LATEST KODE BACKEND ( assembly.py ):")
print(f"Generated File Path: {docx_path}")
print("=" * 80)

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

sdt_elem = root.find(f".//{{{NS['w']}}}sdtContent")

if sdt_elem is not None:
    for p_idx, p in enumerate(sdt_elem.findall(f".//{{{NS['w']}}}p"), 1):
        texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
        full_text = "".join(texts).strip()

        fld = p.find(f".//{{{NS['w']}}}fldSimple")
        if fld is not None:
            t_elem = fld.find(f".//{{{NS['w']}}}t")
            embedded_pg = t_elem.text if t_elem is not None else ""
            print(f"{p_idx:02d}. {full_text:<68} -> Page: [{embedded_pg}]")
