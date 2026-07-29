"""Test cover page Kop Footer positioning in MS Word COM Automation."""
import os
import sys
import pythoncom
import docx

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import Draft
from app.docx.assembly import assemble_report

db = SessionLocal()
d_anisa = db.query(Draft).filter(Draft.id == "2275bf5002a34339a89dbab98743d194").first()
data = d_anisa.data_json or {}

pythoncom.CoInitialize()
import win32com.client

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0

out_file = os.path.abspath(assemble_report(data))

# Strip updateFields flag
doc = docx.Document(out_file)
settings = doc.settings.element
for child in list(settings):
    if child.tag.endswith("updateFields"):
        settings.remove(child)
doc.save(out_file)

try:
    wdoc = word.Documents.Open(out_file, ConfirmConversions=False, ReadOnly=True)

    # Section 1 end page, Section 2 start page
    s1_end = wdoc.Sections(1).Range.Information(3) # wdActiveEndPageNumber
    s2_start = wdoc.Sections(2).Range.Information(3)

    # Inspect tables in Section 1
    t1 = wdoc.Sections(1).Range.Tables(1)
    table_page = t1.Range.Information(3)

    print(f"Doc: {out_file}")
    print(f"Section 1 ends on page: {s1_end}")
    print(f"Section 2 starts on page: {s2_start}")
    print(f"Kop Table is on page: {table_page}")

    wdoc.Close(False)
finally:
    word.Quit()
    pythoncom.CoUninitialize()
