"""Skema data PKL — mirror persis references/data-schema.md (18 top-level keys).

Semua field diberi default kosong supaya draft baru langsung valid tanpa harus
isi semua. Tier WAJIB/PENTING/OPSIONAL tidak di-enforce di sini (di-handle oleh
validation.py yang di-port dari validate_pkl_data.py); skema cuma menjamin
struktur/bentuk.
"""
from __future__ import annotations

from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------- #
#  config                                                                     #
# --------------------------------------------------------------------------- #
class Margin(BaseModel):
    # Default mengikuti pedoman resmi SMKN 4 TP 2026-2027 (1.7.2 Aturan
    # Penulisan): kiri 4 cm, kanan 3 cm, atas 3 cm, bawah 3 cm.
    model_config = ConfigDict(populate_by_name=True)
    atas: float = 3
    bawah: float = 3
    kiri: float = 4
    kanan: float = 3


# Modul BAB yang dikenal. Dua ejaan diterima: nama katalog (bab-catalog.md, dipakai
# frontend) dan nama kanonik assembly.ALL_BAB_MODULES. assembly.MODULE_ALIASES yang
# menyatukannya saat generate — kalau di sini hanya satu ejaan yang lolos, draft
# dengan ejaan lain ditolak 422 walau sebenarnya bisa di-generate.
#
# CATATAN: PROFIL_PERUSAHAAN tidak lagi menjadi BAB tersendiri (Panduan Resmi SMKN4
# TP 2026-2027). Kontennya (Sejarah, Visi-Misi, Tata Tertib, Struktur, Job Desc)
# sudah terintegrasi ke dalam BAB I PENDAHULUAN (sub-bab 1.3–1.6). Jika frontend
# mengirimkan PROFIL_PERUSAHAAN, assembly.MODULE_ALIASES akan mengaliaskannya ke None
# (diabaikan) sehingga tidak menimbulkan error.
BabModule = Literal[
    # nama katalog
    "PENDAHULUAN",
    "PROFIL_PERUSAHAAN",   # alias ke None — konten masuk BAB I (sub 1.3-1.6)
    "LANDASAN_TEORI",
    "PELAKSANAAN",
    "PEMBAHASAN",
    "HAMBATAN",
    "PENUTUP",
    # nama kanonik
    "KEGIATAN_INDUSTRI",
    "PROSES_KEGIATAN",
    "TINJAUAN_PUSTAKA",
    "DATA_PENGAMATAN",
    "KESIMPULAN_SARAN",
    "KESIMPULAN",
]


# Gaya dokumen:
#   pedoman — buku panduan resmi SMKN 4 TP 2026-2027: ada Daftar Isi (+ daftar
#             gambar/lampiran), pengesahan versi resmi (Mengetahui Kepala
#             Sekolah; Pembimbing I/II), cover "PRAKTIK" + NISN.
#   legacy  — meniru dokumen jadi lama (mis. laporan Niken 2024): tanpa Daftar
#             Isi, Waka Humas di pengesahan, cover "PRAKTEK" + NIS.
Preset = Literal["pedoman", "legacy"]


class Config(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    preset: Preset = "pedoman"
    # Daftar pustaka disusun otomatis saat generate bila user tidak mengisi
    # manual (AI bila aktif; fallback penyusun standar dari data yang ada).
    auto_daftar_pustaka: bool = True
    jumlah_bab: Optional[int] = None
    bab_modules: list[BabModule] = Field(default_factory=list)
    margin: Margin = Field(default_factory=Margin)
    font: str = "Times New Roman"
    font_size: int = 12
    spasi: float = 1.5
    pedoman_sekolah: Optional[str] = None
    # Ukuran judul bab / sub-bab. Default mengikuti golden rules SKILL.md
    # (14pt bab, 12pt sub-bab); sebagian pedoman sekolah memakai 16/13pt.
    h1_size: int = 14
    h2_size: int = 12
    h3_size: int = 12


# --------------------------------------------------------------------------- #
#  siswa / sekolah / perusahaan / pkl                                         #
# --------------------------------------------------------------------------- #
class Siswa(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    nis: str = ""
    nisn: str = ""
    kelas: str = ""
    jurusan: str = ""
    jurusan_key: str = ""
    tempat_lahir: str = ""
    tanggal_lahir: str = ""
    jenis_kelamin: str = ""
    golongan_darah: str = ""
    catatan_kesehatan: str = ""
    no_telp: str = ""
    alamat: str = ""
    nama_ortu: str = ""
    alamat_ortu: str = ""
    telp_ortu: str = ""
    foto: str = ""


class Kop(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    baris_1: str = "PEMERINTAH PROVINSI LAMPUNG"
    baris_2: str = "DINAS PENDIDIKAN DAN KEBUDAYAAN"
    baris_3: str = "SMK NEGERI 4 BANDAR LAMPUNG"
    # Baris alamat kedua (kel/kec/kota + kode pos) — opsional.
    baris_alamat_2: str = ""
    npsn: str = "10807215"
    nss: str = "401126003028"


class Pejabat(BaseModel):
    """Pejabat sekolah: kepala_sekolah / waka_humas / ketua_kk / pembimbing_sekolah."""
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    nip: str = ""
    gelar: str = ""


class Sekolah(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = "SMK Negeri 4 Bandar Lampung"
    nama_lengkap: str = "SMK Negeri 4 Bandar Lampung"
    alamat: str = "Jl. HOS Cokroaminoto No.102"
    kota: str = "Bandar Lampung"
    telp: str = "(0721) 262637"
    email: str = "smkn4bl@yahoo.co.id"
    website: str = "www.smkn4-bdl.sch.id"
    sejarah: str = ""          # narasi sejarah sekolah (BAB Tinjauan Pustaka)
    logo_path: str = ""            # logo sekolah (cover); kosong = logo bawaan SMKN4
    logo_provinsi_path: str = ""   # logo Pemprov (cover pedoman, opsional)
    kop: Kop = Field(default_factory=Kop)
    # Data per buku panduan TP 2026-2027 hal. 35.
    kepala_sekolah: Pejabat = Field(default_factory=lambda: Pejabat(
        nama="Dr. Hj. Dewi Ningsih, S.Pd., M.Pd.", nip="19720913 199702 2 002", gelar=""))
    waka_humas: Pejabat = Field(default_factory=lambda: Pejabat(nama="Mas Azizah, M.Pd", nip="197810152009022001", gelar=""))
    ketua_kk: Pejabat = Field(default_factory=Pejabat)
    pembimbing_sekolah: Pejabat = Field(default_factory=Pejabat)


class Pimpinan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    jabatan: str = ""


class Hrd(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    jabatan: str = ""
    telp: str = ""
    email: str = ""


class PembimbingIndustri(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    jabatan: str = ""
    # Label di halaman pengesahan ("Pembimbing Industri I"); default dipakai
    # kalau kosong.
    label_pengesahan: str = ""
    telp: str = ""
    email: str = ""


class Perusahaan(BaseModel):
    """Nama perusahaan sering punya beberapa bentuk yang dipakai di tempat
    berbeda. Hanya `nama` yang wajib; sisanya jatuh balik ke `nama`.

      nama            "Reksa Finance"                     -> narasi body
      nama_lengkap    "PT. Reksa Finance"                 -> badan hukum
      nama_cabang     "PT. Reksa Finance Cabang Lampung"  -> job description
      nama_cover      "Reksa Finance Lampung"             -> judul cover
      nama_pengesahan "PT. REKSA FINANCE"                 -> halaman pengesahan
    """
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    nama_lengkap: str = ""
    nama_cabang: str = ""
    nama_cover: str = ""
    nama_pengesahan: str = ""
    alamat: str = ""
    # Kota tempat industri — cover pedoman menulisnya di baris terpisah
    # ("DI HOTEL HORISON" / "JAKARTA").
    kota: str = ""
    bidang_usaha: str = ""
    status: str = ""
    no_telp: str = ""
    fax: str = ""
    email: str = ""
    website: str = ""
    pimpinan: Pimpinan = Field(default_factory=Pimpinan)
    hrd: Hrd = Field(default_factory=Hrd)
    pembimbing_industri: PembimbingIndustri = Field(default_factory=PembimbingIndustri)
    # Pembimbing II — template pengesahan resmi (hal. 34) punya dua kolom
    # pembimbing; kosong = hanya satu pembimbing yang dicetak.
    pembimbing_industri_2: PembimbingIndustri = Field(default_factory=PembimbingIndustri)


class Pkl(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    tanggal_mulai: str = ""
    tanggal_selesai: str = ""
    durasi_bulan: Optional[int] = None
    jam_pelajaran: Optional[int] = None
    bagian_ditempatkan: str = ""
    tahun_ajaran: str = ""


# --------------------------------------------------------------------------- #
#  profil_perusahaan                                                          #
# --------------------------------------------------------------------------- #
class JamKerja(BaseModel):
    """Satu baris jadwal kerja — satu entry = satu range hari dengan jam kerja dan keterangan.

    `jam` dipakai kalau jadwalnya sudah jadi teks (boleh multi-baris untuk satu
    hari dengan beberapa slot); kalau kosong, dibentuk dari jam_mulai/jam_selesai.
    """
    model_config = ConfigDict(populate_by_name=True)
    hari: str = ""             # misal: "Senin-Kamis", "Jumat", "Sabtu"
    jam: str = ""              # misal: "08.30 - 16.30" atau beberapa slot ber-newline
    jam_mulai: str = ""        # misal: "08.30"
    jam_selesai: str = ""      # misal: "16.30"
    jam_istirahat: str = ""    # misal: "12.00-13.00" (opsional)
    jam_briefing: str = ""     # misal: "08.30-09.00" — briefing pagi (opsional)
    keterangan: str = ""       # misal: "Hari kerja", "Setengah hari"


class CabangPerusahaan(BaseModel):
    """Satu cabang dalam sebuah area."""
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""  # misal: "PT Reksa Finance Cabang Lampung"


class AreaCabang(BaseModel):
    """Satu area dengan daftar cabang di dalamnya."""
    model_config = ConfigDict(populate_by_name=True)
    nama_area: str = ""   # misal: "Area I", atau kosong jika tidak ada area
    cabang: list[CabangPerusahaan] = Field(default_factory=list)


class JobDescription(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    posisi: str = ""
    tugas: list[str] = Field(default_factory=list)


class ProfilPerusahaan(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    logo_perusahaan: str = ""          # path/URL logo perusahaan (opsional, untuk dokumen)
    sejarah: str = ""
    visi: str = ""
    misi: list[str] = Field(default_factory=list)
    head_office: str = ""              # Alamat kantor pusat (opsional)
    area_cabang: list[AreaCabang] = Field(default_factory=list)  # wajib min 1 jika ada cabang
    struktur_organisasi: str = ""      # path/URL gambar bagan struktur
    narasi_struktur: str = ""          # teks narasi manfaat struktur (AI-generated)
    tata_tertib: list[str] = Field(default_factory=list)
    tata_tertib_perusahaan: list[str] = Field(default_factory=list)
    jam_kerja: list[JamKerja] = Field(default_factory=list)
    job_descriptions: list[JobDescription] = Field(default_factory=list)

    # Kalimat pembuka tiap sub-bab profil. Semua opsional — kalau kosong,
    # assembly.py menyusun kalimat default dari nama perusahaan.
    visi_misi_intro: str = ""
    profil_lokasi: str = ""            # narasi lokasi (ganti kalimat "beralamat di ...")
    bagan_intro: str = ""
    tata_tertib_intro: str = ""
    tata_tertib_list_intro: str = ""
    jam_kerja_intro: str = ""


# --------------------------------------------------------------------------- #
#  kegiatan (array nested)                                                    #
# --------------------------------------------------------------------------- #
class Tugas(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    detail: str = ""
    assets: list[str] = Field(default_factory=list)


class Kegiatan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    bidang: str = ""
    deskripsi_umum: str = ""
    tugas: list[Tugas] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
#  detail_kegiatan — isi naratif BAB Data Pengamatan                          #
# --------------------------------------------------------------------------- #
BlockType = Literal["paragraf", "poin", "tabel"]


class Block(BaseModel):
    """Satu blok isi di bawah sebuah kegiatan detail.

    paragraf → narasi biasa; poin → sub-poin tanpa nomor;
    tabel    → `rows` (+ `header` opsional) untuk rincian nominal.
    """
    model_config = ConfigDict(populate_by_name=True)
    tipe: BlockType = "paragraf"
    teks: str = ""
    header: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class DetailKegiatan(BaseModel):
    """Satu kegiatan yang diceritakan detail di BAB Data Pengamatan."""
    model_config = ConfigDict(populate_by_name=True)
    judul: str = ""
    blocks: list[Block] = Field(default_factory=list)


class AsasPkl(BaseModel):
    """Satu dasar hukum/asas PKL, boleh punya rincian sub-poin."""
    model_config = ConfigDict(populate_by_name=True)
    teks: str = ""
    sub: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
#  studi_kasus / peralatan / kendala                                          #
# --------------------------------------------------------------------------- #
class DataAngka(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    label: str = ""
    nilai: str = ""


class StudiKasus(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    judul: str = ""
    latar_belakang: str = ""
    proses_atau_formula: str = ""
    data_angka: list[DataAngka] = Field(default_factory=list)
    hasil: str = ""
    assets: list[str] = Field(default_factory=list)


class Peralatan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nama: str = ""
    deskripsi: str = ""
    gambar: str = ""


class Kendala(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    masalah: str = ""
    solusi: str = ""


# --------------------------------------------------------------------------- #
#  kata_pengantar / assets / gaps / lampiran                                  #
# --------------------------------------------------------------------------- #
class KataPengantar(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    ucapan_syukur: str = "Puji syukur kepada Tuhan Yang Maha Esa, karena karunia dan nikmat yang diberikan-Nya sehingga Penulis dapat menyusun dan menyelesaikan Laporan Praktik Kerja Lapangan ini."
    # Paragraf 2 & 3 kata pengantar — kosong = pakai kalimat default builder.
    pengantar_laporan: str = ""
    intro_terima_kasih: str = ""
    hierarki_terima_kasih: list[str] = Field(default_factory=list)
    harapan: str = "Penulis berharap semoga hasil laporan yang Penulis susun ini dapat bermanfaat. Terimakasih atas bimbingannya, dan Penulis mohon maaf apabila terdapat kesalahan atau perilaku yang tidak berkenan selama Praktik Kerja Lapangan ini berlangsung."
    kota: str = "Bandar Lampung"
    tanggal: str = ""


AssetType = Literal["foto", "screenshot", "logo", "dokumen", "diagram"]


class Asset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    filename: str = ""
    original_name: str = ""
    type: Union[AssetType, str] = "foto"
    caption: str = ""
    used_in_bab: Optional[int] = None
    path: str = ""


class Gap(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    field: str = ""
    reason: str = ""
    impact: str = ""
    resolution: str = ""


class FotoDokumentasi(BaseModel):
    """Satu foto lampiran dengan keterangan."""
    model_config = ConfigDict(populate_by_name=True)
    gambar: str = ""        # path/URL foto
    keterangan: str = ""    # caption/keterangan foto


class DaftarPustaka(BaseModel):
    """Satu entri referensi pustaka."""
    model_config = ConfigDict(populate_by_name=True)
    penulis: str = ""       # nama penulis/publisher
    judul: str = ""         # judul buku/artikel
    tahun: str = ""         # tahun terbit
    sumber: str = ""        # penerbit / nama website
    url: str = ""           # URL (opsional)


class Lampiran(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    jurnal_kegiatan: bool = False
    absensi: bool = False
    sertifikat: bool = False
    penilaian: bool = False
    surat_permohonan: bool = False
    surat_balasan: bool = False
    foto_dokumentasi: bool = True
    foto_kegiatan: list[FotoDokumentasi] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
#  Root: PklContext                                                           #
# --------------------------------------------------------------------------- #
Status = Literal["collecting", "reviewing", "ready", "generated", "completed"]


class PklContext(BaseModel):
    """Root object = pkl-context.json (18 top-level keys)."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    version: str = "1.0"
    status: Status = "collecting"
    created_at: str = ""
    updated_at: str = ""

    config: Config = Field(default_factory=Config)
    siswa: Siswa = Field(default_factory=Siswa)
    sekolah: Sekolah = Field(default_factory=Sekolah)
    perusahaan: Perusahaan = Field(default_factory=Perusahaan)
    pkl: Pkl = Field(default_factory=Pkl)
    profil_perusahaan: ProfilPerusahaan = Field(default_factory=ProfilPerusahaan)
    kegiatan: list[Kegiatan] = Field(default_factory=list)
    detail_kegiatan: list[DetailKegiatan] = Field(default_factory=list)
    studi_kasus: StudiKasus = Field(default_factory=StudiKasus)
    peralatan: list[Peralatan] = Field(default_factory=list)
    kendala: list[Kendala] = Field(default_factory=list)
    pelajaran: list[str] = Field(default_factory=list)
    tujuan_pkl: list[str] = Field(default_factory=list)         # kosong = pakai daftar baku
    asas_pkl: list[AsasPkl] = Field(default_factory=list)       # dasar hukum PKL
    refleksi: str = Field(default="", max_length=50000)                                          # cerita mentah user (sumber AI)
    refleksi_bab5: str = Field(default="", max_length=50000)                                     # input user untuk BAB V (opsional, AI enhance)
    kesimpulan_user: str = Field(default="", max_length=50000)                                   # input user BAB VI kesimpulan (opsional)
    saran_user: str = Field(default="", max_length=50000)                                        # input user BAB VI saran (opsional)
    saran_intro: str = Field(default="", max_length=5000)                                       # kalimat pembuka sub-bab Saran
    saran_items: list[str] = Field(default_factory=list)         # saran ber-enumerasi a. b. c.
    kata_pengantar: KataPengantar = Field(default_factory=KataPengantar)
    # Entri boleh berupa objek terstruktur, string sitasi, atau dict arbitrari.
    daftar_pustaka: list[Union[DaftarPustaka, str, dict[str, Any]]] = Field(default_factory=list)
    assets: list[Asset] = Field(default_factory=list)
    gaps: list[Gap] = Field(default_factory=list)
    lampiran: Lampiran = Field(default_factory=Lampiran)

    # Teks / data hasil generate AI per section (latar_belakang, landasan_teori, list of strings, dst).
    generated_sections: dict[str, Any] = Field(default_factory=dict)
    # Override judul sub-bab agar cocok dengan pedoman masing-masing sekolah.
    judul_override: dict[str, str] = Field(default_factory=dict)


def empty_context() -> PklContext:
    """Bikin context kosong siap-edit (status=collecting)."""
    return PklContext()
