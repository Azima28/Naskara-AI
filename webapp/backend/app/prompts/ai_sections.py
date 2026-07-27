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
2. Tulis TEPAT 6 poin tujuan PKL dengan format "1. [tujuan]" — satu per baris.
   Setiap poin adalah kalimat lengkap (bukan frasa pendek).
   Hubungkan minimal 2 poin dengan jurusan/tempat PKL dari data jika relevan.

ATURAN KERAS:
- DILARANG menulis label "Tujuan:", "A.", "B.", atau heading apapun.
- DILARANG menyebut nama orang atau angka yang tidak ada di data.
- Tulis dalam 1 blok teks: paragraf pembuka diikuti 6 poin bernomor.
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
    siswa = ctx.get("siswa", {})
    perusahaan = ctx.get("perusahaan", {})
    pkl = ctx.get("pkl", {})
    kendala = ctx.get("kendala", [])
    pelajaran = ctx.get("pelajaran", [])
    refleksi = ctx.get("refleksi", "")
    refleksi_bab5 = ctx.get("refleksi_bab5", "")

    # Sumber data: prioritaskan refleksi_bab5, fallback ke refleksi umum
    sumber_cerita = refleksi_bab5 if refleksi_bab5.strip() else refleksi

    # Format kendala
    kendala_str = ""
    for i, k in enumerate(kendala[:5]):
        kendala_str += f"  {i+1}. Kendala: {k.get('masalah', '')} | Solusi: {k.get('solusi', '')}\n"

    # Format pelajaran
    pelajaran_str = "\n".join([f"  - {p}" for p in pelajaran[:8]]) if pelajaran else "  (tidak disebutkan)"

    return f"""Buat konten untuk sub-bab "Hal-hal yang Perlu Diperhatikan" (BAB V Pembahasan) dalam laporan PKL.

Data Siswa:
- Nama: {siswa.get('nama', 'Penulis')}
- Jurusan: {siswa.get('jurusan', '')}
- Tempat PKL: {perusahaan.get('nama', '')}
- Durasi: {pkl.get('durasi_bulan', 3)} bulan

Cerita/Refleksi Pengalaman:
{sumber_cerita[:800] if sumber_cerita else "(gunakan data kendala dan pelajaran di bawah)"}

Kendala yang Dihadapi:
{kendala_str if kendala_str else "  (tidak ada kendala spesifik yang disebutkan)"}

Pelajaran yang Diperoleh:
{pelajaran_str}

Instruksi WAJIB:
1. Tulis 3 paragraf refleksi pengalaman PKL yang mengalir natural.
2. Paragraf 1: Perkenalan pengalaman baru yang didapat selama PKL — apa yang paling berkesan.
3. Paragraf 2: Apa yang dirasakan saat terjun langsung ke dunia kerja — tantangan dan pembelajaran.
4. Paragraf 3: Nilai/karakter yang terbentuk (disiplin, tanggung jawab, profesionalisme, dll).
5. JANGAN gunakan format bullet/numbered list — murni paragraf naratif.
6. Gunakan sudut pandang orang pertama "Penulis" (bukan "saya").
7. Jangan sama persis dengan: "Sebelumnya, Dengan Adanya Pelaksanaan Kegiatan PKL..."
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
