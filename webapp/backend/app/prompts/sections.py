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


def get_deterministic_academic_fallback(section_key: str, ctx: dict) -> str:
    """Menghasilkan teks templat akademik baku KBBI bawaan jurusan tanpa memanggil API LLM luar (Offline Fallback)."""
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    nama_siswa = siswa.get("nama", "Penulis") or "Penulis"
    jurusan_str = siswa.get("jurusan", "Teknik Komputer dan Jaringan") or "Kompetensi Keahlian SMK"
    nama_perusahaan = perusahaan.get("nama_lengkap") or perusahaan.get("nama") or "Dunia Usaha / Dunia Industri"

    if section_key == "latar_belakang":
        return (
            f"Praktik Kerja Lapangan (PKL) merupakan salah satu bentuk penyelenggaraan pendidikan kejuruan yang memadukan secara sistematis dan sinkron antara program pendidikan di sekolah dengan program penguasaan keahlian yang diperoleh melalui kegiatan bekerja langsung di dunia kerja. Bagi siswa kompetensi keahlian {jurusan_str}, kegiatan ini bertujuan untuk membentuk keterampilan, kedisiplinan, serta etika kerja profesional.\n\n"
            f"Penulis melaksanakan kegiatan Praktik Kerja Lapangan di {nama_perusahaan}. Pemilihan tempat PKL ini didasari oleh kesesuaian antara kompetensi keahlian yang dipelajari di sekolah dengan bidang aktivitas operasional yang berjalan di {nama_perusahaan}.\n\n"
            f"Melalui pelaksanaan PKL ini, Penulis berharap dapat memperluas wawasan teknis, memahami alur kerja standar industri, serta mempersiapkan diri untuk menjadi tenaga kerja yang kompeten dan siap pakai di bidang {jurusan_str}."
        )
    elif section_key == "tujuan_pkl":
        return (
            f"1. Memperoleh pengalaman kerja nyata di {nama_perusahaan} sesuai dengan kompetensi keahlian {jurusan_str}.\n"
            f"2. Mengaplikasikan teori dan keterampilan teknis yang telah dipelajari di sekolah ke dalam lingkungan kerja industri.\n"
            f"3. Meningkatkan kemampuan komunikasi, kedisiplinan, serta etika profesionalisme dalam bekerja.\n"
            f"4. Memahami alur dan standar operasional prosedur yang berlaku di {nama_perusahaan}."
        )
    elif section_key == "profil_sejarah":
        return (
            f"{nama_perusahaan} merupakan instansi/perusahaan yang bergerak di bidang pelayanan dan operasional profesional. "
            f"Dalam menjalankan aktivitasnya, {nama_perusahaan} senantiasa berkomitmen untuk memberikan kualitas layanan terbaik serta menerapkan standar kerja yang efisien dan disiplin bagi seluruh staf dan peserta praktik."
        )
    elif section_key == "landasan_teori":
        return (
            f"Praktik Kerja Lapangan menurut Oemar Hamalik (2001: 21) adalah model pelatihan yang bertujuan untuk memberikan kecakapan yang diperlukan dalam pekerjaan tertentu sesuai dengan tuntutan kemampuan bagi pekerja. "
            f"Menurut Wardiman Djojonegoro (1998: 79), PKL adalah suatu bentuk penyelenggaraan pendidikan keahlian kejuruan yang memadukan secara akademik program pendidikan di sekolah dan penguasaan keahlian di dunia kerja. "
            f"Dalam konteks kompetensi keahlian {jurusan_str}, landasan teori ini menjadi acuan utama Penulis dalam melaksanakan tugas-tugas teknis selama kegiatan PKL."
        )
    elif section_key == "pembahasan":
        return (
            f"Dalam proses peningkatan kompetensi keahlian {jurusan_str} di {nama_perusahaan}, terdapat beberapa hal utama yang perlu diperhatikan. "
            f"Penulis diwajibkan untuk memahami dan mematuhi standar operasional prosedur (SOP) yang berlaku agar setiap pengerjaan tugas berjalan secara aman, tepat, dan efisien.\n\n"
            f"Selain aspek keterampilan teknis, aspek non-teknis seperti ketelitian, manajemen waktu, serta komunikasi kerja menjadi faktor kunci dalam menyelesaikan setiap tanggung jawab. "
            f"Pengalaman kerja di {nama_perusahaan} memberikan pemahaman nyata bagi Penulis mengenai pentingnya kedisiplinan dan tanggung jawab profesional."
        )
    elif section_key == "kesimpulan_saran":
        return (
            "[KESIMPULAN]\n"
            f"Pelaksanaan Praktik Kerja Lapangan selama PKL di {nama_perusahaan} memberikan pengalaman kerja nyata yang sangat berharga bagi Penulis. Penulis dapat mengaplikasikan ilmu keahlian {jurusan_str} serta memahami lingkungan kerja industri secara langsung.\n\n"
            "[SARAN]\n"
            f"1. Bagi Sekolah: Diharapkan dapat terus meningkatkan kerja sama dengan {nama_perusahaan} serta memperbarui sarana praktik di sekolah sesuai perkembangan industri.\n"
            f"2. Bagi Perusahaan: Diharapkan dapat terus memberikan bimbingan dan kesempatan belajar bagi peserta PKL di masa mendatang."
        )
    else:
        return (
            f"Pelaksanaan kegiatan PKL di {nama_perusahaan} dilaksanakan sesuai dengan alur operasional yang ditetapkan. "
            f"Penulis berusaha menjalankan seluruh tugas di bidang {jurusan_str} dengan sebaik-baiknya sesuai dengan petunjuk dari pembimbing industri."
        )
