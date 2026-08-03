import zipfile
import xml.etree.ElementTree as ET

docx_path = r"C:\Users\agust\Downloads\Anisa_Rahmawati_XII_TKJ_1 (5).docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

in_bab1 = False
count = 0

print("=" * 80)
print("ALL PARAGRAPHS IN BAB I PENDAHULUAN:")
print("=" * 80)

for p in root.findall(f".//{{{NS['w']}}}p"):
    texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
    full_text = "".join(texts).strip()

    if "BAB I" in full_text:
        in_bab1 = True
        print(f"\n---> START BAB I: {full_text}")
        continue

    if "BAB II" in full_text:
        in_bab1 = False
        print(f"\n---> END BAB I: {full_text}")
        break

    if in_bab1 and full_text:
        count += 1
        print(f"{count:02d}. ({len(full_text)} chars) {full_text[:100]}...")
