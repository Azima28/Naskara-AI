import zipfile
import xml.etree.ElementTree as ET

docx_path = r"C:\Users\agust\Downloads\Anisa_Rahmawati_XII_TKJ_1 (5).docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_bytes = z.read("word/document.xml")

root = ET.fromstring(xml_bytes)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

in_latar_belakang = False
latar_belakang_paras = []
latar_belakang_chars = 0

for p in root.findall(f".//{{{NS['w']}}}p"):
    texts = [t.text for t in p.findall(f".//{{{NS['w']}}}t") if t.text]
    full_text = "".join(texts).strip()

    if "1.1" in full_text and "Latar Belakang" in full_text:
        in_latar_belakang = True
        continue

    if "1.2" in full_text and "Tujuan" in full_text:
        in_latar_belakang = False
        break

    if in_latar_belakang:
        if full_text:
            latar_belakang_paras.append(full_text)
            latar_belakang_chars += len(full_text)

print("=" * 80)
print("EXACT PARAGRAPHS INSIDE 1.1 LATAR BELAKANG IN Anisa_Rahmawati_XII_TKJ_1 (5).docx:")
print("=" * 80)
print(f"Total Paragraphs: {len(latar_belakang_paras)}")
print(f"Total Character Count: {latar_belakang_chars}")
print("-" * 80)
for idx, p in enumerate(latar_belakang_paras, 1):
    print(f"[{idx}] ({len(p)} chars): {p}\n")
