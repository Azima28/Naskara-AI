import os
import re

FILE_PATH = r"c:\Work\Project Ai\docx_skill_package\webapp\backend\app\docx\assembly.py"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Find the split point
split_marker = "#  BAB Content Writers"
idx = content.find(split_marker)
if idx == -1:
    print("Could not find split marker!")
    exit(1)

# Find the start of the line before the split marker
idx = content.rfind("# ======================================================================== #", 0, idx)

top_content = content[:idx]

bottom_content = """# ======================================================================== #
#  BAB Content Writers                                                      #
# ======================================================================== #
from .smkn4_sejarah import SEJARAH_SMKN4

def _build_bab_content(
    builder: PklDocBuilder, data: dict, bab_modules: list[str]
) -> list[tuple[str, str, int]]:
    \"\"\"Tulis semua BAB berurutan. Return TOC entries.\"\"\"
    toc: list[tuple[str, str, int]] = []
    writers = {
        "PENDAHULUAN": _write_pendahuluan,
        "KEGIATAN_INDUSTRI": _write_kegiatan_industri,
        "TINJAUAN_PUSTAKA": _write_tinjauan_pustaka,
        "DATA_PENGAMATAN": _write_data_pengamatan,
        "PEMBAHASAN": _write_pembahasan,
        "KESIMPULAN_SARAN": _write_kesimpulan_saran,
    }

    for bab_num, module_key in enumerate(bab_modules, 1):
        writer = writers.get(module_key)
        if writer:
            if bab_num > 1:
                builder.add_page_break()
            writer(builder, data, bab_num)

    return toc


# ---------------------------------------------------------------------- #
#  PENDAHULUAN                                                             #
# ---------------------------------------------------------------------- #
def _write_pendahuluan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "PENDAHULUAN")
    builder.add_spacing(1)

    siswa = data.get("siswa", {})
    perusahaan = data.get("perusahaan", {})
    
    sub = 1
    builder.add_sub_heading(bab_num, sub, "Latar Belakang")
    jurusan = siswa.get("jurusan", "[Jurusan]")
    nama_prsh = perusahaan.get("nama", "[Perusahaan]")
    builder.add_body(
        f"Praktik Kerja Lapangan (PKL) merupakan salah satu program wajib yang "
        f"harus dilaksanakan oleh setiap siswa SMK sebagai bagian dari kurikulum "
        f"pendidikan. Program ini bertujuan untuk memberikan pengalaman kerja secara "
        f"langsung di dunia usaha dan industri (DUDI) sesuai dengan kompetensi keahlian "
        f"yang dipelajari di sekolah."
    )
    builder.add_body(
        f"Penulis melaksanakan Praktik Kerja Lapangan di {nama_prsh} "
        f"sebagai siswa kompetensi keahlian {jurusan}. Melalui kegiatan ini, Penulis "
        f"dapat menerapkan ilmu yang telah dipelajari di sekolah ke dalam praktik kerja "
        f"nyata di lingkungan industri."
    )
    sub += 1

    builder.add_sub_heading(bab_num, sub, "Tujuan PKL")
    builder.add_body("Adapun tujuan pelaksanaan Praktik Kerja Lapangan adalah:")
    defaults = [
        "Memenuhi salah satu persyaratan dalam menyelesaikan pendidikan di sekolah.",
        "Menambah wawasan dan pengalaman kerja di dunia usaha dan industri.",
        "Mengaplikasikan ilmu yang telah dipelajari di sekolah ke dalam praktik kerja nyata.",
        "Melatih kedisiplinan, tanggung jawab, dan etos kerja siswa.",
    ]
    for i, t in enumerate(defaults, 1):
        builder.add_numbered(t, i)
    sub += 1

    builder.add_sub_heading(bab_num, sub, "Manfaat PKL")
    builder.add_body("Manfaat yang diperoleh dari pelaksanaan PKL antara lain:")
    defaults_manfaat = [
        "Membentuk etos kerja yang baik bagi siswa.",
        "Menjalin kerja sama yang baik antara sekolah dan industri.",
        "Mengetahui standar kerja yang berlaku di dunia industri.",
    ]
    for i, m in enumerate(defaults_manfaat):
        builder.add_lettered(m, _LETTERS[i])
    sub += 1

# ---------------------------------------------------------------------- #
#  KEGIATAN INDUSTRI (Profil Perusahaan)                                   #
# ---------------------------------------------------------------------- #
def _write_kegiatan_industri(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "KEGIATAN INDUSTRI")
    builder.add_spacing(1)
    
    profil = data.get("profil_perusahaan", {})
    sub = 1
    
    sejarah = profil.get("sejarah", "")
    if sejarah:
        builder.add_sub_heading(bab_num, sub, "Sejarah Perusahaan")
        for para in sejarah.split("\\n"):
            if para.strip():
                builder.add_body(para.strip())
        sub += 1
        
    visi = profil.get("visi", "")
    if visi:
        builder.add_sub_heading(bab_num, sub, "Visi Perusahaan")
        builder.add_body(visi)
        sub += 1
        
    misi = profil.get("misi", [])
    if misi:
        builder.add_sub_heading(bab_num, sub, "Misi Perusahaan")
        for i, m in enumerate(misi, 1):
            builder.add_numbered(m, i)
        sub += 1

# ---------------------------------------------------------------------- #
#  TINJAUAN PUSTAKA                                                        #
# ---------------------------------------------------------------------- #
def _write_tinjauan_pustaka(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "TINJAUAN PUSTAKA")
    builder.add_spacing(1)
    
    sub = 1
    
    # 3.1 Sejarah SMKN 4
    builder.add_sub_heading(bab_num, sub, "Sejarah SMK Negeri 4 Bandar Lampung")
    for para in SEJARAH_SMKN4.split("\\n"):
        if para.strip():
            builder.add_body(para.strip())
    sub += 1
    
    # 3.2 Landasan PKL
    builder.add_sub_heading(bab_num, sub, "Landasan Pelaksanaan PKL")
    builder.add_body("Pelaksanaan Praktik Kerja Lapangan dilandaskan pada peraturan sebagai berikut:")
    hukum = [
        "Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.",
        "Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan.",
        "Peraturan Menteri Pendidikan dan Kebudayaan Nomor 50 Tahun 2020 tentang Praktik Kerja Lapangan bagi Peserta Didik.",
    ]
    for i, h in enumerate(hukum, 1):
        builder.add_numbered(h, i)
    sub += 1

# ---------------------------------------------------------------------- #
#  DATA PENGAMATAN                                                         #
# ---------------------------------------------------------------------- #
def _write_data_pengamatan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "DATA PENGAMATAN")
    builder.add_spacing(1)
    
    kegiatan = data.get("kegiatan", [])
    if not kegiatan:
        builder.add_body("Penulis belum mencatat kegiatan pengamatan secara spesifik.")
        return
        
    sub = 1
    for i, k in enumerate(kegiatan, 1):
        bidang = k.get("bidang", f"Bidang {i}").title()
        builder.add_sub_heading(bab_num, sub, bidang)
        
        desk = k.get("deskripsi_umum", "")
        if desk:
            builder.add_body(desk)
            
        tugas = k.get("tugas", [])
        if tugas:
            builder.add_body("Adapun rincian tugas yang dilaksanakan pada bidang ini adalah:")
            for j, t in enumerate(tugas):
                nama = t.get("nama_tugas") or t.get("nama") or f"Tugas {j+1}"
                detail = t.get("detail", "")
                builder.add_lettered(f"{nama}: {detail}", _LETTERS[j])
        sub += 1

# ---------------------------------------------------------------------- #
#  PEMBAHASAN                                                              #
# ---------------------------------------------------------------------- #
def _write_pembahasan(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "PEMBAHASAN")
    builder.add_spacing(1)
    
    sub = 1
    
    # 5.1 Hambatan
    builder.add_sub_heading(bab_num, sub, "Hambatan yang Dialami")
    kendala = data.get("kendala", [])
    if not kendala:
        builder.add_body("Selama pelaksanaan Praktik Kerja Lapangan, Penulis tidak mengalami hambatan yang berarti. Semua kegiatan dapat dilaksanakan dengan baik sesuai dengan arahan pembimbing.")
    else:
        builder.add_body("Dalam pelaksanaan Praktik Kerja Lapangan, Penulis menghadapi beberapa hambatan, antara lain:")
        for i, k in enumerate(kendala, 1):
            m = k.get("masalah", "")
            if m:
                builder.add_numbered(m, i)
    sub += 1
    
    # 5.2 Solusi
    if kendala:
        builder.add_sub_heading(bab_num, sub, "Pemecahan Masalah")
        builder.add_body("Untuk mengatasi hambatan di atas, Penulis melakukan langkah-langkah sebagai berikut:")
        for i, k in enumerate(kendala, 1):
            s = k.get("solusi", "")
            if s:
                builder.add_numbered(s, i)
        sub += 1
        
    # 5.3 Pelajaran / Refleksi
    pelajaran = data.get("pelajaran", [])
    refleksi = data.get("refleksi", "")
    
    if pelajaran or refleksi:
        builder.add_sub_heading(bab_num, sub, "Pembelajaran yang Diperoleh")
        if pelajaran:
            builder.add_body("Melalui Praktik Kerja Lapangan ini, Penulis memperoleh pembelajaran sebagai berikut:")
            for i, p in enumerate(pelajaran, 1):
                builder.add_numbered(p, i)
        if refleksi:
            builder.add_body(refleksi)
        sub += 1

# ---------------------------------------------------------------------- #
#  KESIMPULAN & SARAN                                                      #
# ---------------------------------------------------------------------- #
def _write_kesimpulan_saran(builder: PklDocBuilder, data: dict, bab_num: int) -> None:
    builder.add_bab_heading(bab_num, "PENUTUP")
    builder.add_spacing(1)
    
    sub = 1
    
    # Kesimpulan
    builder.add_sub_heading(bab_num, sub, "Kesimpulan")
    builder.add_body("Berdasarkan pelaksanaan Praktik Kerja Lapangan, dapat ditarik kesimpulan sebagai berikut:")
    
    defaults_kesimpulan = [
        "Praktik Kerja Lapangan memberikan pengalaman nyata mengenai situasi kerja di dunia industri.",
        "Penulis dapat menerapkan berbagai teori yang telah dipelajari di sekolah secara langsung.",
        "Kegiatan ini melatih kedisiplinan dan tanggung jawab Penulis dalam melaksanakan tugas.",
    ]
    for i, s in enumerate(defaults_kesimpulan, 1):
        builder.add_numbered(s, i)
    sub += 1
    
    # Saran
    builder.add_sub_heading(bab_num, sub, "Saran")
    builder.add_body("Adapun saran yang dapat Penulis sampaikan adalah:")
    defaults_saran = [
        "Bagi siswa yang akan melaksanakan PKL, persiapkan diri dengan mempelajari lebih dalam materi yang berkaitan dengan industri terkait.",
        "Bagi sekolah, agar terus menjalin hubungan baik dengan pihak industri demi kelancaran program PKL di masa mendatang.",
    ]
    for i, s in enumerate(defaults_saran, 1):
        builder.add_numbered(s, i)
    sub += 1


# ======================================================================== #
#  Helpers                                                                  #
# ======================================================================== #

def _auto_select_modules(data: dict) -> list[str]:
    # Hardcode for SMKN 4 specific pivot
    modules = data.get("recommended_bab", [])
    if not modules:
        modules = [
            "PENDAHULUAN",
            "KEGIATAN_INDUSTRI",
            "TINJAUAN_PUSTAKA",
            "DATA_PENGAMATAN",
            "PEMBAHASAN",
            "KESIMPULAN_SARAN"
        ]
    return modules


def _build_toc_entries(
    data: dict, bab_modules: list[str]
) -> list[tuple[str, str, int]]:
    entries: list[tuple[str, str, int]] = []

    # Front matter entries
    entries.append(("HALAMAN PENGESAHAN INDUSTRI", "i", 1))
    entries.append(("HALAMAN PENGESAHAN SEKOLAH", "ii", 1))
    entries.append(("IDENTITAS SISWA", "iii", 1))
    entries.append(("IDENTITAS INDUSTRI / INSTANSI", "iv", 1))
    entries.append(("KATA PENGANTAR", "v", 1))
    entries.append(("DAFTAR ISI", "vi", 1))

    # BAB entries
    module_titles = {
        "PENDAHULUAN": "PENDAHULUAN",
        "KEGIATAN_INDUSTRI": "KEGIATAN INDUSTRI",
        "TINJAUAN_PUSTAKA": "TINJAUAN PUSTAKA",
        "DATA_PENGAMATAN": "DATA PENGAMATAN",
        "PEMBAHASAN": "PEMBAHASAN",
        "KESIMPULAN_SARAN": "PENUTUP",
    }

    for bab_num, module_key in enumerate(bab_modules, 1):
        roman = _ROMANS.get(bab_num, str(bab_num))
        title = module_titles.get(module_key, module_key.replace("_", " "))
        entries.append((f"BAB {roman} {title}", "", 1))

    # Daftar Pustaka
    if data.get("daftar_pustaka"):
        entries.append(("DAFTAR PUSTAKA", "", 1))

    return entries
"""

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.write(top_content + bottom_content)

print("assembly.py successfully patched.")
