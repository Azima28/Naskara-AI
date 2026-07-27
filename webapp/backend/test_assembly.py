"""Test assembly: generate .docx dari sample-pkl-data.json."""
import json
import sys
from pathlib import Path

# Setup path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.docx.assembly import assemble_report

# Load sample data
sample_path = backend_dir.parent.parent / "examples" / "sample-pkl-data.json"
with open(sample_path, encoding="utf-8") as f:
    data = json.load(f)

print(f"Data loaded: {len(data)} top-level keys")
print(f"Siswa: {data.get('siswa', {}).get('nama', 'N/A')}")
print(f"Perusahaan: {data.get('perusahaan', {}).get('nama', 'N/A')}")
print(f"Kegiatan: {len(data.get('kegiatan', []))} bidang")
print(f"BAB modules (config): {data.get('config', {}).get('bab_modules', [])}")
print()

# Generate
try:
    path = assemble_report(data)
    print(f"✅ SUCCESS! File generated: {path}")
    print(f"   Size: {Path(path).stat().st_size:,} bytes")
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
