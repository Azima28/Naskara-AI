"""Template prompts untuk setiap section BAB.

Membangun user prompt berdasarkan PklContext.
"""

def prompt_latar_belakang(ctx: dict, jurusan_context: str) -> str:
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    
    return f"""Buat narasi untuk bagian 'Latar Belakang' Laporan PKL.

Konteks Data:
- Siswa: {siswa.get('nama', '')}
- Jurusan: {siswa.get('jurusan', '')}
- Tempat PKL: {perusahaan.get('nama', '')} yang bergerak di bidang {perusahaan.get('bidang_usaha', '')}

Konteks Jurusan (Gunakan istilah ini jika relevan):
{jurusan_context}

Instruksi Khusus:
1. Jelaskan mengapa PKL penting untuk siswa jurusan tersebut.
2. Alasan mengapa memilih tempat PKL tersebut (hubungkan bidang usaha perusahaan dengan jurusan).
3. Tulis sebanyak 3-4 paragraf yang mengalir secara kronologis.
4. Ingat Aturan Mutlak: JANGAN gunakan awalan paragraf generik seperti "Dalam era globalisasi...".
"""

def prompt_tujuan_manfaat(ctx: dict) -> str:
    return """Buat daftar naratif untuk 'Tujuan' dan 'Manfaat' Praktik Kerja Lapangan.

Instruksi Khusus:
1. Buat bagian 'Tujuan' yang berisi 4 poin utama tentang apa yang ingin dicapai siswa melalui PKL.
2. Buat bagian 'Manfaat' yang berisi 3 poin tentang keuntungan bagi siswa, sekolah, dan perusahaan.
3. Ingat Aturan Mutlak: JANGAN gunakan bullet point (*, -, •). Gunakan format numbered list (1. 2. 3.) atau huruf (a. b. c.) di awal paragraf.
"""

def prompt_profil_perusahaan(ctx: dict) -> str:
    perusahaan = ctx.get("perusahaan", {})
    profil = ctx.get("profil_perusahaan", {})
    
    return f"""Buat narasi untuk bagian 'Sejarah Singkat' perusahaan.

Konteks Data:
- Nama Perusahaan: {perusahaan.get('nama', '')}
- Bidang Usaha: {perusahaan.get('bidang_usaha', '')}
- Alamat: {perusahaan.get('alamat', '')}
- Catatan Sejarah/Data mentah: {profil.get('sejarah', 'Tuliskan sejarah fiktif yang realistis untuk bidang usaha tersebut jika data kosong.')}

Instruksi Khusus:
1. Ubah catatan data mentah menjadi paragraf naratif yang utuh dan profesional.
2. Minimal 2 paragraf.
"""

def prompt_pelaksanaan(ctx: dict, bidang: str, deskripsi_umum: str) -> str:
    return f"""Buat paragraf pengantar untuk 'Pelaksanaan Kegiatan' di bidang: {bidang}.

Catatan Kegiatan:
{deskripsi_umum}

Instruksi Khusus:
1. Buat 1-2 paragraf naratif pengantar yang menceritakan secara umum peran dan rutinitas Penulis di bidang tersebut.
2. Jangan merinci satu-per-satu tugas (karena tugas spesifik akan di-generate oleh sistem menjadi list tersendiri).
"""

def prompt_pembahasan(ctx: dict, jurusan_context: str) -> str:
    kegiatan = ctx.get("kegiatan", [])
    tugas_list = []
    for keg in kegiatan:
        if isinstance(keg, dict):
            for t in keg.get("tugas", []):
                if isinstance(t, dict):
                    tugas_list.append(t.get("nama", ""))
    
    return f"""Buat narasi untuk bagian 'Pembahasan'.

Kegiatan yang telah dilakukan selama PKL:
{', '.join(tugas_list)}

Konteks Jurusan (Gunakan teori/istilah teknis yang relevan):
{jurusan_context}

Instruksi Khusus:
1. Bahas kaitan antara teori yang dipelajari di sekolah (kompetensi keahlian) dengan praktik nyata yang dilakukan di perusahaan.
2. Jelaskan nilai tambah atau keahlian teknis spesifik yang Penulis peroleh.
3. Buat 3-4 paragraf akademik.
"""

def prompt_kesimpulan_saran(ctx: dict) -> str:
    return """Buat bagian 'Kesimpulan' dan 'Saran' untuk penutup laporan.

Instruksi Khusus:
1. Tulis 3 poin kesimpulan berdasarkan pelaksanaan PKL secara umum.
2. Tulis saran untuk pihak Sekolah (1-2 poin) dan pihak Perusahaan (1-2 poin).
3. Ingat Aturan Mutlak: JANGAN gunakan bullet point (*, -, •). Gunakan angka (1. 2. 3.).
"""

def prompt_regenerate(old_text: str, instruction: str) -> str:
    return f"""Perbaiki teks laporan PKL berikut berdasarkan instruksi user.

Teks Lama:
{old_text}

Instruksi User:
{instruction}

Instruksi Khusus:
1. Terapkan instruksi user tanpa mengubah gaya bahasa formal akademik.
2. Kembalikan HANYA teks yang baru (tanpa kata-kata pengantar seperti "Berikut adalah...").
3. Ingat Aturan Mutlak: Tidak boleh ada bullet point, dan tetap gunakan sudut pandang "Penulis".
"""
