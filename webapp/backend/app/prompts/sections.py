"""Template prompts untuk setiap section BAB.

Membangun user prompt berdasarkan PklContext.
"""

def prompt_latar_belakang(ctx: dict, jurusan_context: str) -> str:
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    pkl = ctx.get("pkl", {})

    return f"""Buat narasi untuk bagian 'Latar Belakang' Laporan PKL.

DATA NYATA (ground truth — SATU-SATUNYA sumber fakta, jangan tambah fakta lain):
- Nama siswa    : {siswa.get('nama', '') or '[tidak diisi]'}
- Jurusan       : {siswa.get('jurusan', '') or '[tidak diisi]'}
- Tempat PKL    : {perusahaan.get('nama', '') or '[tidak diisi]'}
- Bidang usaha  : {perusahaan.get('bidang_usaha', '') or '[tidak diisi]'}
- Kota PKL      : {perusahaan.get('kota', '') or '[tidak diisi]'}
- Durasi PKL    : {pkl.get('durasi_bulan', '') or '[tidak diisi]'} bulan

Konteks Jurusan (istilah teknis relevan — hanya gunakan jika memang relevan dengan data):
{jurusan_context}

Struktur yang WAJIB diikuti — tulis 3 paragraf:
- Paragraf 1 [topik: definisi & pentingnya PKL untuk jurusan ini]
  → Hanya gunakan nama jurusan dari data. Jangan menyebut nama orang atau tempat spesifik.
- Paragraf 2 [topik: alasan memilih tempat PKL]
  → WAJIB sebutkan: nama tempat PKL dan bidang usahanya dari data.
  → DILARANG menyebut detail (tahun berdiri, jumlah karyawan, dll) yang tidak ada di data.
- Paragraf 3 [topik: relevansi PKL dengan jurusan dan harapan]
  → WAJIB sebutkan: nama jurusan dari data.
  → Akhiri dengan harapan siswa dari PKL ini.

ATURAN TAMBAHAN:
- Jika ada field [tidak diisi] → tulis kalimat umum untuk topik itu, tanpa mengarang detail spesifik.
- DILARANG menulis frasa: "Dalam era globalisasi", "Di era modern", "Seiring perkembangan zaman".
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

    sejarah_raw = (profil.get('sejarah') or "").strip()

    return f"""Buat narasi untuk bagian 'Sejarah Singkat' perusahaan dalam laporan PKL.

DATA NYATA (ground truth — SATU-SATUNYA sumber fakta):
- Nama perusahaan : {perusahaan.get('nama', '') or '[tidak diisi]'}
- Nama lengkap   : {perusahaan.get('nama_lengkap', '') or '[sama dengan nama]'}
- Bidang usaha   : {perusahaan.get('bidang_usaha', '') or '[tidak diisi]'}
- Alamat         : {perusahaan.get('alamat', '') or '[tidak diisi]'}
- Catatan sejarah: {sejarah_raw if sejarah_raw else '[kosong]'}

Instruksi:
1. Jika 'Catatan sejarah' TIDAK KOSONG: ubah menjadi 2-3 paragraf naratif profesional.
   HANYA kembangkan fakta yang ADA di catatan. JANGAN tambahkan fakta baru.
2. Jika 'Catatan sejarah' KOSONG: tulis 1 paragraf umum tentang perusahaan berdasarkan
   nama dan bidang usahanya SAJA — tanpa menyebut tahun berdiri, pendiri, atau detail
   apapun yang tidak ada di data.
3. DILARANG KERAS mengarang: tahun berdiri, nama pendiri, jumlah karyawan, atau
   pencapaian spesifik yang tidak ada di data.
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
