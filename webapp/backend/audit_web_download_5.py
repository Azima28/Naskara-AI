import zipfile
import xml.etree.ElementTree as ET
import math

docx_path = r"C:\Users\agust\Downloads\Anisa_Rahmawati_XII_TKJ_1 (5).docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

paragraphs = root.findall(f".//{{{NS['w']}}}p")

print("=" * 80)
print(f"PHYSICAL PAGE CALCULATION AUDIT ON REAL WEB DOWNLOAD: {docx_path}")
print("=" * 80)

current_page = 1
lines_on_current_page = 0.0

for idx, p in enumerate(paragraphs, 1):
    texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
    full_text = "".join(texts).strip()

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
        print(f"Page {current_page:02d} (lines: {lines_on_current_page:.1f}/25) -> Heading: {full_text[:50]} [BM: {bms[0]}]")

    lines_on_current_page += para_lines

    if has_page_break:
        current_page += 1
        lines_on_current_page = 0.0
    elif lines_on_current_page >= 25.0:
        added_pages = int(lines_on_current_page // 25.0)
        current_page += added_pages
        lines_on_current_page = lines_on_current_page % 25.0

print(f"\nTotal Computed Physical Pages: {current_page}")
