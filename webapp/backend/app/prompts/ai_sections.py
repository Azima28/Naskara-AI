"""Prompt AI untuk section-section yang wajib di-generate unik per user.

Memastikan output tidak sama persis antar user meskipun konteks serupa.
Setiap fungsi mengembalikan string prompt yang siap dikirim ke AI provider.
"""


# ── GAP 1: Tujuan PKL — unik per user, bukan hardcoded ───────────────────── #
def prompt_tujuan_pkl(ctx: dict) -> str:
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    pkl = ctx.get("pkl", {})

    return f"""Buat narasi untuk bagian "Tujuan Kegiatan Praktik Kerja Lapangan" dalam laporan PKL siswa SMK.

DATA NYATA (ground truth — gunakan fakta ini):
- Jurusan  : {siswa.get('jurusan', '') or '[tidak diisi]'}
- Tempat PKL: {perusahaan.get('nama', '') or '[tidak diisi]'}
- Durasi   : {pkl.get('durasi_bulan', 3)} bulan

Struktur output WAJIB:
1. Tulis 1 paragraf pembuka (2-3 kalimat) tentang tujuan PKL dalam konteks peningkatan
   mutu pendidikan SMK — sebutkan kota dari data jika ada.
2. Tulis 4-8 poin tujuan PKL dengan format "1. [tujuan]" — satu per baris.
   JUMLAH POIN DINAMIS sesuai kelengkapan data:
   - Kalau data minim (hanya jurusan + tempat PKL) → 4-5 poin (tujuan umum PKL).
   - Kalau data cukup (ada bidang usaha, divisi, durasi jelas) → 6-8 poin,
     sebagian dikaitkan dengan data spesifik.
   Setiap poin adalah kalimat lengkap (bukan frasa pendek).
   Hubungkan minimal 2 poin dengan jurusan/tempat PKL dari data jika relevan.
   DILARANG mengarang tujuan yang TIDAK BERHUBUNGAN dengan tujuan umum PKL
   hanya untuk memenuhi jumlah poin.

ATURAN KERAS:
- DILARANG menulis label "Tujuan:", "A.", "B.", atau heading apapun.
- DILARANG menyebut nama orang atau angka yang tidak ada di data.
- Tulis dalam 1 blok teks: paragraf pembuka diikuti poin bernomor (4-8 poin).
"""


# ── GAP 5: Narasi Bagan Struktur Organisasi — unik per user ──────────────── #
def prompt_narasi_struktur(ctx: dict) -> str:
    perusahaan = ctx.get("perusahaan", {})
    profil = ctx.get("profil_perusahaan", {})

    # Cek apakah ada job description untuk dapatkan nama jabatan
    jobs = profil.get("job_descriptions", [])
    jabatan_list = [j.get("posisi", "") for j in jobs if j.get("posisi")]
    jabatan_str = ", ".join(jabatan_list[:6]) if jabatan_list else "belum diketahui"

    return f"""Buat narasi 2-3 paragraf untuk sub-bab "Bagan Struktur Organisasi" dalam laporan PKL.

Data:
- Nama perusahaan: {perusahaan.get('nama', '')}
- Alamat: {perusahaan.get('alamat', '')}
- Jabatan yang ada: {jabatan_str}

Instruksi WAJIB:
1. Paragraf 1: Jelaskan manfaat struktur organisasi secara umum (untuk perusahaan/lembaga).
   Jangan sama persis dengan: "Manfaat Struktur organisasi adalah mempermudah proses pencapaian tujuan dari suatu lembaga..."
   Paraphrase dengan makna yang sama tapi kata-kata berbeda.
2. Paragraf 2: Jelaskan manfaat konkret bagi perusahaan ini — sebutkan nama perusahaannya.
   Sebutkan bahwa struktur organisasi mempertegas wewenang dan tanggung jawab.
3. Paragraf 3 (opsional): Jika ada jabatan yang diketahui, sebutkan secara singkat komposisi strukturnya.
4. JANGAN tulis format tabel, hanya narasi paragraf
5. OUTPUT HANYA teks laporan — tanpa label, tanpa penjelasan tambahan
"""


# ── GAP 8: Landasan Teori — paraphrase agar tidak identik ────────────────── #
def prompt_landasan_teori_paraphrase() -> str:
    return """Tulis ulang (paraphrase) konten untuk sub-bab "Landasan Teori" dalam laporan PKL SMK.

Konten asli yang harus diparaphrase:
Praktik kerja lapangan menurut Oemar Hambalik (2001: 21) adalah model pelatihan yang bertujuan untuk memberikan kecakapan yang diperlukan dalam pekerjaan tertentu sesuai dengan tuntutan kemampuan bagi pekerja. Wardiman Djojonegoro (1998: 79) PKL adalah suatu bentuk penyelenggaraan pendidikan dan pelatihan keahlian kejuruan yang memadukan secara sistematik dan sinkron program pendidikan di sekolah dan program penguasaan keahlian yang diperoleh melalui bekerja di dunia kerja. Ahmad Rizali, dkk, (2009: 45) Praktik Kerja Lapangan adalah realisasi dari bagian Pendidikan Sistem Ganda (PSG).

Instruksi WAJIB:
1. Pertahankan semua nama penulis, tahun, dan halaman referensi (Oemar Hambalik 2001:21, Wardiman Djojonegoro 1998:79, Ahmad Rizali 2009:45) — JANGAN ubah.
2. Paraphrase HANYA gaya bahasa pengantar dan penghubung antar kutipan.
3. Tulis paragraf pembuka 1-2 kalimat yang BERBEDA dari: "Pelaksanaan Praktik Kerja Lapangan secara tidak langsung akan memberikan..."
4. Tambahkan kalimat penutup 1 kalimat yang merangkum pentingnya PKL.
5. Total panjang: 1 paragraf (150-200 kata).
6. OUTPUT HANYA teks laporan — tanpa label, tanpa penjelasan tambahan
"""


# ── GAP 11: BAB V Pembahasan — AI generate dari data user ────────────────── #
def prompt_hal_diperhatikan(ctx: dict) -> str:
    """Prompt BAB V — sesuai Panduan SMKN4 TP 2026-2027.

    Bab V membahas hal-hal yang perlu diperhatikan dalam proses peningkatan
    kompetensi yang dikuasai selama PKL, mengacu pada standar yang ditetapkan
    oleh industri/institusi tempat PKL.
    """
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    pkl = ctx.get("pkl", {})
    kegiatan = ctx.get("kegiatan", [])
    pelajaran = ctx.get("pelajaran", [])
    refleksi = ctx.get("refleksi", "")
    refleksi_bab5 = ctx.get("refleksi_bab5", "")

    # Sumber data refleksi: prioritaskan refleksi_bab5, fallback ke refleksi umum
    sumber_cerita = refleksi_bab5 if refleksi_bab5.strip() else refleksi

    # Bidang/divisi tempat kompetensi dikuasai
    bidang_list = [k.get("bidang", "") for k in kegiatan if k.get("bidang")]
    bidang_str = ", ".join(bidang_list) if bidang_list else "berbagai bidang"

    # Format pelajaran
    pelajaran_str = "\n".join([f"  - {p}" for p in pelajaran[:8]]) if pelajaran else "  (tidak disebutkan)"

    return f"""Buat konten untuk sub-bab "Hal-hal yang Perlu Diperhatikan" (BAB V Pembahasan) dalam laporan PKL.
Sub-bab ini adalah satu-satunya isi BAB V, sesuai Panduan SMK Negeri 4 Bandar Lampung.

DATA NYATA — SATU-SATUNYA sumber fakta:
- Nama siswa   : {siswa.get('nama', 'Penulis')}
- Jurusan      : {siswa.get('jurusan', '') or '[tidak diisi]'}
- Tempat PKL   : {perusahaan.get('nama', '') or '[tidak diisi]'}
- Bidang usaha : {perusahaan.get('bidang_usaha', '') or '[tidak diisi]'}
- Durasi       : {pkl.get('durasi_bulan', 3)} bulan
- Divisi/Bidang: {bidang_str}
- Standar acuan: standar kerja yang berlaku di {perusahaan.get('nama', 'perusahaan')}

Cerita/Refleksi Pengalaman (konteks tambahan):
{sumber_cerita[:600] if sumber_cerita.strip() else '(tidak ada)'}

Pelajaran yang Diperoleh:
{pelajaran_str}

Instruksi WAJIB — ikuti PERSIS sesuai panduan:
1. Fokus pada HAL-HAL YANG PERLU DIPERHATIKAN dalam proses peningkatan
   kompetensi keahlian {siswa.get('jurusan', '')} yang dikuasai selama PKL.
2. Acuan: standar yang ditetapkan oleh {perusahaan.get('nama', 'industri/institusi')}.
   Sebutkan standar kerja, prosedur, atau target kompetensi yang berlaku di tempat PKL.
3. Tulis 3 paragraf naratif yang mengalir:
   - Paragraf 1: Pengantar — peningkatan kompetensi apa yang dicapai, dan acuan
     standar apa yang berlaku di perusahaan.
   - Paragraf 2: Hal-hal spesifik yang perlu diperhatikan untuk mencapai kompetensi
     tersebut (kedisiplinan, ketelitian, prosedur, tools, dll).
   - Paragraf 3: Refleksi — apa arti standar industri ini bagi pengembangan diri Penulis
     ke depannya.
4. JANGAN menulis sub-bab "Hambatan" atau "Solusi" — tidak termasuk BAB V
   berdasarkan Panduan SMKN4 Bandar Lampung.
5. JANGAN gunakan format bullet/numbered list — murni paragraf naratif.
6. Gunakan sudut pandang "Penulis" (bukan "saya").
7. Jika data standar kompetensi tidak ada, tulis kalimat umum tentang pentingnya
   standar kerja di industri, JANGAN mengarang standar fiktif.
8. OUTPUT HANYA teks laporan — tanpa label, tanpa penjelasan tambahan
"""


# ── GAP 12: BAB VI Kesimpulan & Saran — enhance atau generate ────────────── #
def prompt_kesimpulan_saran(ctx: dict, bab_num: int = 7) -> str:
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    pkl = ctx.get("pkl", {})
    kegiatan = ctx.get("kegiatan", [])
    kesimpulan_user = ctx.get("kesimpulan_user", "")
    saran_user = ctx.get("saran_user", "")

    bidang_list = [k.get("bidang", "") for k in kegiatan if k.get("bidang")]
    bidang_str = ", ".join(bidang_list) if bidang_list else "berbagai bidang"

    sub1 = f"{bab_num}.1"
    sub2 = f"{bab_num}.2"

    mode_kesimpulan = "ENHANCE (perbaiki dan kembangkan)" if (kesimpulan_user or "").strip() else "GENERATE (buat dari data yang ada)"
    mode_saran = "ENHANCE (perbaiki dan kembangkan)" if (saran_user or "").strip() else "GENERATE (buat dari data yang ada)"

    return f"""Buat konten untuk BAB {bab_num} "Kesimpulan dan Saran" dalam laporan PKL.

DATA NYATA (ground truth — SATU-SATUNYA sumber fakta):
- Nama siswa   : {siswa.get('nama', 'Penulis') or 'Penulis'}
- Jurusan      : {siswa.get('jurusan', '') or '[tidak diisi]'}
- Tempat PKL   : {perusahaan.get('nama', '') or '[tidak diisi]'}
- Durasi PKL   : {pkl.get('durasi_bulan', 3)} bulan
- Bidang kerja : {bidang_str}

Input Kesimpulan dari Siswa (mode: {mode_kesimpulan}):
{(kesimpulan_user or '').strip() or "(kosong — generate dari data di atas)"}

Input Saran dari Siswa (mode: {mode_saran}):
{(saran_user or '').strip() or "(kosong — generate dari data di atas)"}

FORMAT OUTPUT WAJIB — SANGAT PENTING, IKUTI PERSIS:
Baris pertama output: [KESIMPULAN]
Lalu 2 paragraf teks kesimpulan.
Lalu 1 baris kosong.
Lalu baris: [SARAN]
Lalu 2 paragraf atau poin teks saran.

Contoh format yang BENAR (jangan copy isinya, hanya ikuti strukturnya):
[KESIMPULAN]
Pelaksanaan Praktik Kerja Lapangan selama ... bulan di ... memberikan pengalaman...
Melalui kegiatan ini, Penulis dapat memahami secara langsung...

[SARAN]
Bagi pihak SMKN 4 Bandar Lampung, diharapkan...
Bagi pihak {perusahaan.get('nama', 'perusahaan')}, diharapkan...

ATURAN KERAS:
- Tag [KESIMPULAN] dan [SARAN] WAJIB ada, ditulis PERSIS seperti itu (huruf kapital, dalam kurung siku).
- JANGAN menulis "Kesimpulan:", "### Kesimpulan", atau variasi lain. HANYA [KESIMPULAN].
- JANGAN menulis sub-bab {sub1} atau {sub2} — sistem akan menambahnya otomatis.
- DILARANG mengarang kegiatan atau fakta yang tidak ada di data.
- Gunakan kata 'Penulis', bukan 'saya'.
"""


# ── GAP 13: BAB IV Data Pengamatan Intro — paragraf pembuka dinamis per jurusan ─ #
def prompt_data_pengamatan_intro(ctx: dict, jurusan_context: str) -> str:
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    kegiatan = ctx.get("kegiatan", [])

    nama_prsh = perusahaan.get("nama_lengkap") or perusahaan.get("nama") or "perusahaan"
    jurusan_str = siswa.get("jurusan", "") or "kompetensi keahlian"
    bidang_list = [k.get("bidang", "") for k in kegiatan if isinstance(k, dict) and k.get("bidang")]
    bidang_str = ", ".join(bidang_list[:3]) if bidang_list else "aktivitas operasional harian"

    return f"""Buat 1 paragraf naratif pengantar untuk halaman awal "BAB IV DATA PENGAMATAN" dalam laporan PKL.

DATA NYATA (ground truth — SATU-SATUNYA sumber fakta):
- Nama Perusahaan : {nama_prsh}
- Jurusan Siswa   : {jurusan_str}
- Bidang Aktivitas: {bidang_str}

Konteks Jurusan (gunakan istilah teknis relevan):
{jurusan_context}

Instruksi WAJIB:
1. Tulis 1 paragraf pengantar akademis yang menjelaskan bahwa BAB IV ini memuat hasil pengamatan dan pengalaman kerja nyata siswa selama PKL di {nama_prsh}.
2. Hubungkan secara alami dengan jurusan {jurusan_str} dan aktivitas {bidang_str}.
3. DILARANG mengarang fakta fiktif. DILARANG menggunakan bullet point atau heading.
4. OUTPUT HANYA 1 paragraf narasi.
"""


# ── Helper: Default Daftar Pustaka ────────────────────────────────────────── #
def generate_default_daftar_pustaka(ctx: dict) -> list[dict]:
    """Generate daftar pustaka default berdasarkan data konteks."""
    perusahaan = ctx.get("perusahaan", {})
    referensi = []

    # Referensi tetap SMKN 4
    referensi.append({
        "penulis": "smkn4-bdl.sch.id",
        "judul": "Sejarah Sekolah",
        "tahun": "2024",
        "sumber": "SMKN 4 Bandar Lampung",
        "url": "https://smkn4-bdl.sch.id/sejarah",
    })

    # Referensi PKL teoritis
    referensi.append({
        "penulis": "www.kajianpustaka.com",
        "judul": "Praktik Kerja Lapangan (Pengertian, Tujuan, Manfaat, Pelaksanaan dan Penilaian)",
        "tahun": "2024",
        "sumber": "Kajian Pustaka",
        "url": "https://www.kajianpustaka.com/2021/03/praktik-kerja-lapangan.html",
    })

    # Referensi hukum (tidak ada URL karena dokumen fisik)
    referensi.append({
        "penulis": "Pemerintah Republik Indonesia",
        "judul": "UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional",
        "tahun": "2003",
        "sumber": "Sekretariat Negara",
        "url": "",
    })

    referensi.append({
        "penulis": "Kemendikbudristek",
        "judul": "Permendikbud Nomor 50 Tahun 2020 tentang Praktik Kerja Lapangan",
        "tahun": "2020",
        "sumber": "Kemendikbudristek",
        "url": "",
    })

    # Referensi perusahaan (jika ada website)
    website = perusahaan.get("website", "")
    if website and website not in ("-", ""):
        referensi.append({
            "penulis": website,
            "judul": f"Profil Perusahaan {perusahaan.get('nama', '')}",
            "tahun": "2024",
            "sumber": perusahaan.get("nama", ""),
            "url": website if website.startswith("http") else f"https://{website}",
        })

    return referensi


# ======================================================================== #
#  AUTO-POLISH PROMPTS — dipanggil otomatis saat Download, bukan manual    #
#  Tujuan: merapikan/memformalkan input mentah user → kalimat akademik     #
# ======================================================================== #

# ── POLISH 1: Visi & Misi Perusahaan ─────────────────────────────────────── #
def prompt_visi_misi(ctx: dict) -> str:
    profil = ctx.get("profil_perusahaan", {})
    perusahaan = ctx.get("perusahaan", {})
    nama = perusahaan.get("nama", "perusahaan")

    visi_raw = (profil.get("visi") or "").strip()
    misi_raw = profil.get("misi") or []
    if isinstance(misi_raw, str):
        misi_raw = [m.strip() for m in misi_raw.split("\n") if m.strip()]

    misi_str = "\n".join(f"  {i+1}. {m}" for i, m in enumerate(misi_raw)) if misi_raw else "  (kosong)"

    return f"""Rapikan dan formalkan Visi & Misi perusahaan berikut untuk laporan PKL akademik.

DATA NYATA dari user (ground truth - JANGAN ubah makna/isi, hanya rapikan bahasa):
- Nama perusahaan: {nama}
- VISI (input user): {visi_raw if visi_raw else '(kosong)'}
- MISI (input user):
{misi_str}

Instruksi:
1. Jika VISI tidak kosong: rapikan menjadi 1 kalimat formal bahasa Indonesia baku.
   JANGAN ubah makna. Hanya perbaiki tata bahasa dan ejaan.
2. Jika MISI tidak kosong: rapikan tiap poin menjadi kalimat formal yang lengkap.
   Setiap poin harus diawali kata kerja (Memberikan, Meningkatkan, Mewujudkan, dll).
   Panjang tiap poin: minimal 1 kalimat utuh, maksimal 2 kalimat.
3. Jika VISI atau MISI kosong: tulis "(tidak tersedia)" untuk bagian yang kosong.

FORMAT OUTPUT WAJIB:
[VISI]
(teks visi yang sudah dirapikan)

[MISI]
1. (poin misi 1 yang sudah dirapikan)
2. (poin misi 2 yang sudah dirapikan)
... dst

ATURAN KERAS:
- DILARANG mengarang visi/misi baru yang tidak ada di input user.
- HANYA rapikan bahasa, jangan tambah atau kurangi poin misi.
- Output dalam Bahasa Indonesia formal (EYD).
- Tag [VISI] dan [MISI] WAJIB ada persis seperti itu.
"""


# ── POLISH 2: Tata Tertib Perusahaan (dari input user) ───────────────────── #
def prompt_tata_tertib_perusahaan(ctx: dict) -> str:
    profil = ctx.get("profil_perusahaan", {})
    perusahaan = ctx.get("perusahaan", {})
    nama = perusahaan.get("nama", "perusahaan")

    tata_tertib_raw = profil.get("tata_tertib_perusahaan") or []
    if isinstance(tata_tertib_raw, str):
        tata_tertib_raw = [t.strip() for t in tata_tertib_raw.split("\n") if t.strip()]

    if not tata_tertib_raw:
        return ""  # Tidak ada input → skip

    tt_str = "\n".join(f"  {i+1}. {t}" for i, t in enumerate(tata_tertib_raw))

    return f"""Rapikan dan formalkan tata tertib perusahaan berikut untuk laporan PKL akademik.

DATA NYATA dari user (ground truth - JANGAN ubah isi aturan, hanya rapikan bahasa):
- Nama perusahaan: {nama}
- Tata tertib (input user):
{tt_str}

Instruksi:
1. Rapikan tiap poin menjadi 1 KALIMAT ATURAN PENDEK BAHASA INDONESIA BAKU (maksimal 10-15 kata per poin).
2. Setiap poin harus diawali kata kerja imperatif formal:
   "Mematuhi...", "Melaksanakan...", "Tidak diperkenankan...", "Wajib...", dst.
3. Akhiri setiap poin dengan tanda titik (.).
4. Jika ada poin yang sama atau sangat mirip, gabungkan menjadi 1 poin.

FORMAT OUTPUT WAJIB - HANYA DAFTAR POIN RINGKAS YANG SUDAH DIRAPIKAN, SATU PER BARIS:
1. (poin aturan 1 pendek)
2. (poin aturan 2 pendek)
... dst

ATURAN KERAS:
- DILARANG MEMBUAT PARAGRAF NARASI/CERITA LAPORAN AKADEMIK.
- DILARANG mengarang aturan baru yang tidak ada di input user.
- JANGAN kurangi poin yang ada, kecuali duplikat.
- Output HANYA daftar bernomor berisi poin-poin aturan ringkas, tanpa pengantar, tanpa penutup.
"""


# ── POLISH 3: Job Description ─────────────────────────────────────────────── #
def prompt_job_descriptions(ctx: dict) -> str:
    profil = ctx.get("profil_perusahaan", {})
    perusahaan = ctx.get("perusahaan", {})
    nama = perusahaan.get("nama", "perusahaan")

    job_descs = profil.get("job_descriptions", [])
    if not job_descs:
        return ""

    jd_lines = []
    for jd in job_descs:
        posisi = jd.get("posisi", "")
        tugas = jd.get("tugas", [])
        if posisi:
            jd_lines.append(f"\nPosisi: {posisi}")
        for t in tugas:
            if t.strip():
                jd_lines.append(f"  - {t.strip()}")
    jd_str = "\n".join(jd_lines) if jd_lines else "(kosong)"

    return f"""Rapikan job description berikut menjadi kalimat formal untuk laporan PKL akademik.

DATA NYATA dari user (ground truth - JANGAN ubah jenis tugas, hanya rapikan bahasa):
- Nama perusahaan: {nama}
- Job description (input user):
{jd_str}

Instruksi:
1. Untuk tiap POSISI, rapikan deskripsi tugasnya menjadi 1 KALIMAT PENDEK RINGKAS (maksimal 10-15 kata).
2. Tiap tugas harus dimulai dengan kata kerja aktif: "Melakukan...", "Memastikan...", "Mengelola...", "Bertanggung jawab atas...", dst.
3. Jika tugas sangat singkat (< 5 kata), rapikan menjadi kalimat tugas utuh yang profesional.
   Contoh: "bersihkan pc" → "Melakukan pembersihan dan perawatan rutin perangkat komputer"
4. JANGAN tambahkan tugas yang tidak disebutkan user.

FORMAT OUTPUT WAJIB:
[POSISI: nama posisi 1]
1. (tugas 1 pendek yang sudah dirapikan)
2. (tugas 2 pendek yang sudah dirapikan)

[POSISI: nama posisi 2]
1. (tugas 1 pendek yang sudah dirapikan)
... dst

ATURAN KERAS:
- Tag [POSISI: ...] WAJIB ada untuk setiap posisi.
- DILARANG MEMBUAT PARAGRAF NARASI/CERITA LAPORAN.
- DILARANG mengarang tugas baru.
- Output HANYA poin-poin tugas ringkas per posisi.
"""


# ── POLISH 4: Detail Kegiatan per Bidang ─────────────────────────────────── #
def prompt_detail_kegiatan(ctx: dict) -> str:
    kegiatan = ctx.get("kegiatan", [])
    perusahaan = ctx.get("perusahaan", {})
    nama = perusahaan.get("nama", "perusahaan")
    siswa = ctx.get("siswa", {})

    if not kegiatan:
        return ""

    keg_lines = []
    for k in kegiatan:
        bidang = k.get("bidang", "")
        deskripsi = k.get("deskripsi_umum", "")
        tugas = k.get("tugas", [])
        if bidang:
            keg_lines.append(f"\nBidang: {bidang}")
        if deskripsi:
            keg_lines.append(f"  Deskripsi: {deskripsi}")
        for t in tugas:
            nama_t = t.get("nama_tugas") or t.get("nama") or ""
            detail_t = t.get("detail") or ""
            if nama_t:
                keg_lines.append(f"  Tugas: {nama_t}")
            if detail_t:
                keg_lines.append(f"    Detail: {detail_t}")
    keg_str = "\n".join(keg_lines) if keg_lines else "(kosong)"

    return f"""Rapikan narasi kegiatan PKL berikut menjadi teks formal untuk laporan akademik.

DATA NYATA dari user (ground truth - JANGAN ubah fakta kegiatan):
- Tempat PKL: {nama}
- Jurusan siswa: {siswa.get('jurusan', '')}
- Kegiatan (input user):
{keg_str}

Instruksi:
1. Untuk tiap BIDANG, buat 1-2 kalimat narasi pengantar yang mendeskripsikan bidang tersebut secara formal.
   Gunakan kalimat: "Penulis ditempatkan pada bidang [X] yang bertugas untuk..."
2. Untuk tiap TUGAS: jika detail terlalu singkat, expand menjadi kalimat formal lengkap.
   JANGAN ubah jenis/nama tugasnya, hanya perbaiki bahasanya.
3. Jika deskripsi sudah cukup baik (> 20 kata), cukup perbaiki ejaan/tata bahasa saja.

FORMAT OUTPUT WAJIB:
[BIDANG: nama bidang 1]
(narasi 1-2 kalimat pengantar bidang)
[TUGAS: nama tugas 1]
(deskripsi tugas yang sudah dirapikan)
[TUGAS: nama tugas 2]
(deskripsi tugas yang sudah dirapikan)

[BIDANG: nama bidang 2]
... dst

ATURAN KERAS:
- Tag [BIDANG: ...] dan [TUGAS: ...] WAJIB ada.
- DILARANG mengarang kegiatan/tugas baru.
- Output dalam Bahasa Indonesia formal (EYD).
- Gunakan kata 'Penulis', bukan 'saya'.
"""


# ── POLISH 5: Deskripsi Peralatan ────────────────────────────────────────── #
def prompt_peralatan_deskripsi(ctx: dict) -> str:
    peralatan = ctx.get("peralatan", [])
    perusahaan = ctx.get("perusahaan", {})
    nama = perusahaan.get("nama", "perusahaan")

    if not peralatan:
        return ""

    alat_lines = []
    for i, p in enumerate(peralatan, 1):
        nama_alat = p.get("nama", f"Alat {i}")
        deskripsi = p.get("deskripsi", "")
        alat_lines.append(f"{i}. {nama_alat}: {deskripsi if deskripsi else '(tidak ada deskripsi)'}")
    alat_str = "\n".join(alat_lines)

    return f"""Rapikan deskripsi peralatan dan perlengkapan kantor berikut untuk laporan PKL akademik.

DATA NYATA dari user (ground truth - nama alat tidak boleh diubah):
- Tempat PKL: {nama}
- Peralatan (input user):
{alat_str}

Instruksi:
1. Untuk tiap alat: tulis 1-2 kalimat deskripsi formal yang menjelaskan fungsi alat tersebut dalam konteks PKL.
2. Jika user sudah mengisi deskripsi: rapikan dan expand jadi kalimat formal (minimal 1 kalimat lengkap).
3. Jika deskripsi kosong ('tidak ada deskripsi'): buat 1 kalimat umum tentang fungsi alat tersebut.
   Contoh: untuk "Komputer PC" → "Komputer PC digunakan sebagai perangkat utama untuk menyelesaikan pekerjaan administratif dan teknis selama PKL."
4. JANGAN mengarang fungsi yang tidak relevan dengan nama alat.

FORMAT OUTPUT WAJIB - satu alat per blok:
[ALAT: nama alat 1]
(deskripsi 1-2 kalimat formal)

[ALAT: nama alat 2]
(deskripsi 1-2 kalimat formal)
... dst

ATURAN KERAS:
- Tag [ALAT: ...] WAJIB ada dengan nama alat PERSIS dari data (jangan diubah).
- Output dalam Bahasa Indonesia formal (EYD).
- DILARANG mengarang fungsi alat yang tidak masuk akal untuk konteks PKL.
"""

