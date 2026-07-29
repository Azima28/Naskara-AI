"""Verifikasi komputasi nomor halaman Daftar Isi via Word COM."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.docx.builder import compute_toc_page_numbers
import json

src = sys.argv[1] if len(sys.argv) > 1 else str(
    Path(__file__).resolve().parent.parent / "output" / "Laporan-PKL-Rizky Pratama-915547.docx")
p = compute_toc_page_numbers(src)
print(json.dumps(p, indent=2, ensure_ascii=False))
print("total bookmark:", len(p))
