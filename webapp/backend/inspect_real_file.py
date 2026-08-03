import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

docx_path = r"C:\Work\Project Ai\docx_skill_package\hasil\Anisa_Rahmawati_XII_TKJ_1 (4).docx"

if not Path(docx_path).exists():
    print(f"File not found: {docx_path}")
    exit(1)

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

sdt_elem = root.find(f".//{{{NS['w']}}}sdtContent")

print("=" * 80)
print(f"INSPECTING TOC IN REAL FILE: {docx_path}")
print("=" * 80)

if sdt_elem is not None:
    for p_idx, p in enumerate(sdt_elem.findall(f".//{{{NS['w']}}}p"), 1):
        texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
        full_text = "".join(texts).strip()

        fld = p.find(f".//{{{NS['w']}}}fldSimple")
        if fld is not None:
            instr = fld.attrib.get(f"{{{NS['w']}}}instr", "")
            parts = instr.strip().split()
            target_bm = parts[1] if len(parts) > 1 else ""
            t_elem = fld.find(f".//{{{NS['w']}}}t")
            embedded_pg = t_elem.text if t_elem is not None else ""

            print(f"{p_idx:02d}. {full_text:<68} -> [BM: {target_bm:<18}] -> Halaman: [{embedded_pg}]")
else:
    print("No sdtContent found!")
