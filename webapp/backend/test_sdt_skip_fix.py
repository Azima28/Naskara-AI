import zipfile
import xml.etree.ElementTree as ET
import math

docx_path = r"C:\Users\agust\Downloads\Anisa_Rahmawati_XII_TKJ_1 (5).docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

# Find all sdt elements
sdt_elems = root.findall(f".//{{{NS['w']}}}sdt")
sdt_paras = set()
for sdt in sdt_elems:
    for p in sdt.findall(f".//{{{NS['w']}}}p"):
        sdt_paras.add(p)

print("=" * 80)
print(f"RE-AUDITING PHYSICAL PAGE CALCULATIONS BY SKIPPING SDT (TOC):")
print("=" * 80)

current_page = 1
lines_on_current_page = 0.0

bab_lines = {}
current_bab_key = None
bookmark_offset_lines = {}
bookmark_bab_key = {}

for p in root.findall(f".//{{{NS['w']}}}p"):
    if p in sdt_paras:
        continue # SKIP SDT PARAGRAPHS!

    texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
    full_text = "".join(texts).strip()
    if not full_text:
        continue

    # Check for bookmarkStart
    bms = [b.attrib.get(f"{{{NS['w']}}}name") for b in p.findall(f".//{{{NS['w']}}}bookmarkStart") if b.attrib.get(f"{{{NS['w']}}}name")]

    # Check for page break
    brs = p.findall(f".//{{{NS['w']}}}br")
    has_page_break = any(br.attrib.get(f"{{{NS['w']}}}type") == "page" for br in brs)

    # Check for images
    drawings = p.findall(f".//{{{NS['w']}}}drawing") + p.findall(f".//{{{NS['w']}}}pict")
    img_lines = len(drawings) * 15.0

    # Indent
    has_ind = p.find(f".//{{{NS['w']}}}ind") is not None
    chars_per_line = 48.0 if has_ind else 62.0

    para_lines = max(1.0, math.ceil(len(full_text) / chars_per_line)) * 1.2 + img_lines

    if bms:
        print(f"BM Found: {bms[0]:<20} | Text: {full_text[:50]:<45} | Para Lines: {para_lines:.1f}")

    if "BAB I " in full_text.upper():
        current_bab_key = 1
        bab_lines[1] = 4.0
    elif "BAB II " in full_text.upper():
        current_bab_key = 2
        bab_lines[2] = 4.0
    elif "BAB III " in full_text.upper():
        current_bab_key = 3
        bab_lines[3] = 4.0
    elif "BAB IV " in full_text.upper():
        current_bab_key = 4
        bab_lines[4] = 4.0
    elif "BAB V " in full_text.upper():
        current_bab_key = 5
        bab_lines[5] = 4.0
    elif "BAB VI " in full_text.upper():
        current_bab_key = 6
        bab_lines[6] = 4.0

    if current_bab_key is not None:
        if bms:
            bookmark_offset_lines[bms[0]] = bab_lines[current_bab_key]
        bab_lines[current_bab_key] = bab_lines.get(current_bab_key, 0.0) + para_lines

print("\n" + "=" * 80)
print("REAL ACCUMULATED BODY LINES PER BAB (EXCLUDING SDT):")
print("=" * 80)
for bab, lines in bab_lines.items():
    print(f"BAB {bab}: {lines:.1f} lines (~{math.ceil(lines/25.0)} pages)")

print("\n" + "=" * 80)
print("REAL SUB-HEADING PAGE OFFSETS INSIDE BAB I:")
print("=" * 80)
for bm, off in bookmark_offset_lines.items():
    pg_off = int(off // 25.0) + 1
    print(f"Bookmark: {bm:<20} | Lines Offset: {off:.1f} | Calculated Page: {pg_off}")
