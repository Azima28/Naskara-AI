import requests
import zipfile
import xml.etree.ElementTree as ET
from test_web_simulation_looping import create_web_simulation_context

# 1. Register / Login test user
session = requests.Session()
auth_res = session.post("http://127.0.0.1:8000/auth/register", json={
    "email": "test_local_e2e@naskara.ai",
    "name": "Test Local User",
    "password": "Password123!"
})
if auth_res.status_code not in (200, 201):
    auth_res = session.post("http://127.0.0.1:8000/auth/login", json={
        "email": "test_local_e2e@naskara.ai",
        "password": "Password123!"
    })

token = auth_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Create draft
draft_res = session.post("http://127.0.0.1:8000/drafts", json={"title": "Draft Test Local E2E"}, headers=headers)
draft_id = draft_res.json()["id"]

# 3. Update draft data with full Telkom Lampung context
ctx = create_web_simulation_context("web_sim_telkom_lampung_exact", 99)
ctx["siswa"]["nis"] = "12345"
ctx["pkl"]["tanggal_mulai"] = "2024-07-01"
ctx["pkl"]["tanggal_selesai"] = "2024-09-30"
session.put(f"http://127.0.0.1:8000/drafts/{draft_id}", json={"data": ctx}, headers=headers)

# 4. Call /generate/{draft_id} API endpoint
gen_res = session.post(f"http://127.0.0.1:8000/generate/{draft_id}", headers=headers)

assert gen_res.status_code == 200, f"Generate failed: {gen_res.status_code} - {gen_res.text}"

docx_filename = "LOCAL_WEB_API_TEST_RESULT.docx"
with open(docx_filename, "wb") as f:
    f.write(gen_res.content)

print("=" * 80)
print(f"SUCCESSFULLY GENERATED AND DOWNLOADED FROM LOCAL WEB API SERVER!")
print(f"File Saved: {docx_filename} ({len(gen_res.content)/1024:.2f} KB)")
print("=" * 80)

# 5. Inspect XML Table of Contents
with zipfile.ZipFile(docx_filename, 'r') as z:
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
