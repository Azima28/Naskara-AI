"""Test cover page layout & page count across drafts using Word COM Automation."""
import os
import sys
import pythoncom
import docx

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import Draft
from app.docx.assembly import assemble_report

db = SessionLocal()
drafts = db.query(Draft).all()

print(f"Testing Cover Page for {len(drafts)} drafts...")
print("-" * 60)

def test_draft(d):
    pythoncom.CoInitialize()
    import win32com.client
    data = d.data_json or {}
    out_file = os.path.abspath(assemble_report(data))

    # Strip updateFields flag temporarily so Word doesn't pop up a prompt
    doc = docx.Document(out_file)
    settings = doc.settings.element
    for child in list(settings):
        if child.tag.endswith("updateFields"):
            settings.remove(child)
    doc.save(out_file)

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        wdoc = word.Documents.Open(out_file, ConfirmConversions=False, ReadOnly=True)
        sec1_end = wdoc.Sections(1).Range.Information(3) # wdActiveEndPageNumber
        sec2_start = wdoc.Sections(2).Range.Information(3)
        wdoc.Close(False)

        status = "OK (1 Page)" if sec2_start == 2 else f"OVERFLOW (Sec 1 ends on Page {sec1_end}, Sec 2 starts on Page {sec2_start})"
        return f"Draft {d.id[:8]} ({d.title[:30]}): {status}"
    finally:
        word.Quit()
        pythoncom.CoUninitialize()

for d in drafts[1:]:
    try:
        res = test_draft(d)
        print(res)
    except Exception as e:
        print(f"Draft {d.id[:8]} Error: {e}")
