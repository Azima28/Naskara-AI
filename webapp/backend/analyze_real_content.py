import zipfile
import xml.etree.ElementTree as ET

docx_path = r"C:\Work\Project Ai\docx_skill_package\hasil\Anisa_Rahmawati_XII_TKJ_1 (4).docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

current_heading = "Header"
heading_lengths = {}

for p in root.findall(f".//{{{NS['w']}}}p"):
    texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
    full_text = "".join(texts).strip()

    # Check if heading
    pStyle = p.find(f".//{{{NS['w']}}}pStyle")
    style_val = pStyle.attrib.get(f"{{{NS['w']}}}val", "") if pStyle is not None else ""

    if style_val in ("Heading1", "Heading2", "Heading3", "JudulBab", "SubBab") or full_text.startswith("BAB ") or full_text.startswith("1.") or full_text.startswith("2.") or full_text.startswith("3."):
        if len(full_text) < 100:
            current_heading = full_text

    heading_lengths[current_heading] = heading_lengths.get(current_heading, 0) + len(full_text)

print("=" * 80)
print(f"TEXT CHARACTER LENGTH PER SECTION IN: {docx_path}")
print("=" * 80)
for h, l in heading_lengths.items():
    print(f"{h:<65} -> Total Chars: {l:,} (~{l/1500:.1f} pages)")
