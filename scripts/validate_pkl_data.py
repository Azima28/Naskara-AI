"""Validate pkl-context.json completeness and generate readiness report."""
import json
import sys
import os

def validate(data):
    """Validate PKL data completeness. Returns (score, issues, warnings)."""
    issues = []      # Blocking — cannot generate
    warnings = []    # Non-blocking — can generate but incomplete
    score = 0
    max_score = 0
    
    # === WAJIB (Minimal untuk Generate) ===
    
    # Siswa
    siswa = data.get("siswa", {})
    wajib_siswa = {
        "siswa.nama": siswa.get("nama"),
        "siswa.nis": siswa.get("nis"),
        "siswa.jurusan": siswa.get("jurusan"),
    }
    for field, value in wajib_siswa.items():
        max_score += 1
        if value:
            score += 1
        else:
            issues.append(f"❌ WAJIB: {field} kosong — dibutuhkan untuk Cover")
    
    # Sekolah
    sekolah = data.get("sekolah", {})
    wajib_sekolah = {
        "sekolah.nama": sekolah.get("nama"),
        "sekolah.kota": sekolah.get("kota"),
    }
    for field, value in wajib_sekolah.items():
        max_score += 1
        if value:
            score += 1
        else:
            issues.append(f"❌ WAJIB: {field} kosong — dibutuhkan untuk Cover & Kata Pengantar")
    
    # Perusahaan
    perusahaan = data.get("perusahaan", {})
    max_score += 1
    if perusahaan.get("nama"):
        score += 1
    else:
        issues.append("❌ WAJIB: perusahaan.nama kosong — dibutuhkan untuk Cover")
    
    # PKL periode
    pkl = data.get("pkl", {})
    for field_name, field_key in [("pkl.tanggal_mulai", "tanggal_mulai"), ("pkl.tanggal_selesai", "tanggal_selesai")]:
        max_score += 1
        if pkl.get(field_key):
            score += 1
        else:
            issues.append(f"❌ WAJIB: {field_name} kosong — dibutuhkan untuk BAB I")

    # Foto Dokumentasi Kegiatan (Minimal 1 Foto)
    assets = data.get("assets", [])
    foto_kegiatan = data.get("lampiran", {}).get("foto_kegiatan", [])
    has_foto = bool(assets or foto_kegiatan)
    max_score += 1
    if has_foto:
        score += 1
    else:
        issues.append("❌ WAJIB: foto_kegiatan / assets kosong — dibutuhkan minimal 1 foto dokumentasi untuk Lampiran")
    
    # Kegiatan (jika tidak diisi, otomatis di-fallback ke kegiatan sesuai jurusan)
    kegiatan = data.get("kegiatan", [])
    max_score += 1
    if kegiatan and any(k.get("tugas") for k in kegiatan if isinstance(k, dict)):
        score += 1
    else:
        warnings.append("⚠️ PENTING: kegiatan / daftar tugas kosong — akan otomatis diisi rekomendasi jurusan oleh sistem")
    
    # === PENTING (Sangat Direkomendasikan) ===
    
    # Pembimbing industri
    pb_ind = perusahaan.get("pembimbing_industri", {})
    max_score += 1
    if pb_ind.get("nama"):
        score += 1
    else:
        warnings.append("⚠️ PENTING: perusahaan.pembimbing_industri.nama kosong — dibutuhkan untuk Pengesahan Industri")
    
    # Pimpinan
    pimpinan = perusahaan.get("pimpinan", {})
    max_score += 1
    if pimpinan.get("nama"):
        score += 1
    else:
        warnings.append("⚠️ PENTING: perusahaan.pimpinan.nama kosong — dibutuhkan untuk Pengesahan Industri")
    
    # Pembimbing sekolah
    pb_sek = sekolah.get("pembimbing_sekolah", {})
    max_score += 1
    if pb_sek.get("nama"):
        score += 1
    else:
        warnings.append("⚠️ PENTING: sekolah.pembimbing_sekolah.nama kosong — dibutuhkan untuk Pengesahan Sekolah")
    
    # Ketua KK
    ketua = sekolah.get("ketua_kk", {})
    max_score += 1
    if ketua.get("nama"):
        score += 1
    else:
        warnings.append("⚠️ PENTING: sekolah.ketua_kk.nama kosong — dibutuhkan untuk Pengesahan Sekolah")
    
    # Waka Humas
    waka = sekolah.get("waka_humas", {})
    max_score += 1
    if waka.get("nama"):
        score += 1
    else:
        warnings.append("⚠️ PENTING: sekolah.waka_humas.nama kosong — dibutuhkan untuk Pengesahan Sekolah")
    
    # === ENRICHMENT ===
    
    # Profil perusahaan
    profil = data.get("profil_perusahaan", {})
    enrichment_fields = [
        ("profil_perusahaan.sejarah", profil.get("sejarah")),
        ("profil_perusahaan.visi", profil.get("visi")),
        ("profil_perusahaan.misi", profil.get("misi")),
        ("studi_kasus", data.get("studi_kasus", {}).get("judul")),
        ("kendala (minimal 1)", bool(data.get("kendala"))),
        ("refleksi", data.get("refleksi")),
        ("kata_pengantar", data.get("kata_pengantar", {}).get("ucapan_syukur")),
    ]
    
    for field_name, value in enrichment_fields:
        max_score += 1
        if value:
            score += 1
        else:
            warnings.append(f"ℹ️ OPSIONAL: {field_name} kosong — laporan bisa lebih lengkap dengan ini")
    
    # === BAB MODULE VALIDATION ===
    config = data.get("config", {})
    bab_modules = config.get("bab_modules", [])
    
    if bab_modules:
        if "PROFIL_PERUSAHAAN" in bab_modules and not profil.get("sejarah"):
            warnings.append("⚠️ BAB PROFIL_PERUSAHAAN dipilih tapi profil_perusahaan.sejarah kosong")
        
        if "LANDASAN_TEORI" in bab_modules:
            pass  # Konten dari reference file, tidak perlu data user
        
        if "PEMBAHASAN" in bab_modules and not data.get("studi_kasus", {}).get("judul"):
            warnings.append("⚠️ BAB PEMBAHASAN dipilih tapi studi_kasus kosong")
    
    # === GAPS ===
    gaps = data.get("gaps", [])
    for gap in gaps:
        warnings.append(f"📋 GAP: {gap.get('field', '?')} — {gap.get('reason', 'belum diisi')}")
    
    return score, max_score, issues, warnings


def recommend_bab(data):
    """Recommend number of BABs based on available data."""
    profil = data.get("profil_perusahaan", {})
    studi_kasus = data.get("studi_kasus", {})
    kendala = data.get("kendala", [])
    
    modules = ["PENDAHULUAN"]
    reasons = []
    
    # Check profil perusahaan
    if profil.get("sejarah") or profil.get("visi") or profil.get("misi"):
        modules.append("PROFIL_PERUSAHAAN")
        reasons.append("Data perusahaan lengkap → BAB Profil Perusahaan")
    
    # Check landasan teori (recommend for 5+ BAB)
    if len(modules) >= 2 and (studi_kasus.get("judul") or profil.get("sejarah")):
        modules.append("LANDASAN_TEORI")
        reasons.append("Ada studi kasus/profil detail → BAB Landasan Teori")
    
    # Always include pelaksanaan
    modules.append("PELAKSANAAN")
    
    # Check pembahasan (separate from pelaksanaan)
    if studi_kasus.get("judul") and len(modules) >= 4:
        modules.append("PEMBAHASAN")
        reasons.append("Studi kasus teknis → BAB Pembahasan terpisah")
    
    # Always include penutup
    modules.append("PENUTUP")
    
    return modules, reasons


def main():
    if len(sys.argv) > 1:
        json_path = sys.argv[1]
    else:
        json_path = "pkl-data/pkl-context.json"
    
    if not os.path.exists(json_path):
        print(f"File tidak ditemukan: {json_path}")
        sys.exit(1)
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    score, max_score, issues, warnings = validate(data)
    
    print("=" * 60)
    print("VALIDASI DATA PKL")
    print("=" * 60)
    print(f"\nSkor: {score}/{max_score} ({round(score/max_score*100)}%)")
    print(f"Status: {data.get('status', 'unknown')}")
    
    if issues:
        print(f"\n❌ BLOCKING ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"  {issue}")
    
    if warnings:
        print(f"\n⚠️ WARNINGS ({len(warnings)}):")
        for warn in warnings:
            print(f"  {warn}")
    
    if not issues:
        print("\n✅ Data SIAP untuk generate .docx!")
        
        # Recommend BAB
        modules, reasons = recommend_bab(data)
        config_modules = data.get("config", {}).get("bab_modules", [])
        
        print(f"\n📋 REKOMENDASI STRUKTUR ({len(modules)} BAB):")
        for i, mod in enumerate(modules, 1):
            print(f"  BAB {['I','II','III','IV','V','VI','VII'][i-1]} — {mod}")
        
        if reasons:
            print("\n  Alasan:")
            for reason in reasons:
                print(f"    • {reason}")
        
        if config_modules and config_modules != modules:
            print(f"\n  ⚠️ Config menggunakan: {config_modules}")
            print(f"  Rekomendasi berbeda! Review config.bab_modules")
    else:
        print(f"\n🚫 TIDAK BISA generate — {len(issues)} masalah harus diselesaikan dulu")
    
    print()
    return 0 if not issues else 1


if __name__ == "__main__":
    sys.exit(main())
