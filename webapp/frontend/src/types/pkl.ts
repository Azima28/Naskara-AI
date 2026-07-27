/**
 * TS types — mirror persis backend/app/schemas.py (yang mirror data-schema.md).
 *
 * Dipakai di seluruh frontend supaya data PKL selalu bertipe. Tiap objek punya
 * factory kosong agar form/wizard bisa inisialisasi field nested tanpa undefined.
 */

// --------------------------------------------------------------------------- //
//  config                                                                     //
// --------------------------------------------------------------------------- //
// Dua ejaan diterima backend: nama katalog lama + nama kanonik assembly
// (KEGIATAN_INDUSTRI dst.) — lihat schemas.py BabModule.
export type BabModule =
  | 'PENDAHULUAN'
  | 'PROFIL_PERUSAHAAN'
  | 'LANDASAN_TEORI'
  | 'PELAKSANAAN'
  | 'PEMBAHASAN'
  | 'HAMBATAN'
  | 'PENUTUP'
  | 'KEGIATAN_INDUSTRI'
  | 'PROSES_KEGIATAN'
  | 'TINJAUAN_PUSTAKA'
  | 'DATA_PENGAMATAN'
  | 'KESIMPULAN_SARAN'
  | 'KESIMPULAN'

export interface Margin {
  atas: number
  bawah: number
  kiri: number
  kanan: number
}

export interface PklConfig {
  preset?: 'pedoman' | 'custom'
  cover_page_number?: 'none' | 'lowerRoman' | 'arabic'
  front_matter_format?: 'lowerRoman' | 'arabic'
  front_matter_start?: number
  body_matter_format?: 'arabic' | 'lowerRoman'
  body_matter_start?: number
  jumlah_bab: number | null
  bab_modules: BabModule[]
  margin: Margin
  font: string
  font_size: number
  spasi: number
  pedoman_sekolah: string | null
  // Daftar pustaka disusun otomatis saat generate (AI / penyusun standar)
  // bila user tidak mengisi manual. Default aktif.
  auto_daftar_pustaka?: boolean
}

// --------------------------------------------------------------------------- //
//  identitas                                                                  //
// --------------------------------------------------------------------------- //
export interface Siswa {
  nama: string
  nis: string
  nisn: string
  kelas: string
  jurusan: string
  jurusan_key: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  golongan_darah: string
  catatan_kesehatan: string
  no_telp: string
  alamat: string
  nama_ortu: string
  alamat_ortu: string
  telp_ortu: string
  foto: string
}

export interface Kop {
  baris_1: string
  baris_2: string
  baris_3: string
  npsn: string
  nss: string
}

export interface Pejabat {
  nama: string
  nip: string
  gelar: string
}

export interface Sekolah {
  nama: string
  nama_lengkap: string
  alamat: string
  kota: string
  telp: string
  email: string
  website: string
  kop: Kop
  kepala_sekolah: Pejabat
  waka_humas: Pejabat
  ketua_kk: Pejabat
  pembimbing_sekolah: Pejabat
}

export interface Pimpinan {
  nama: string
  jabatan: string
}

export interface Hrd {
  nama: string
  jabatan: string
  telp: string
  email: string
}

export interface PembimbingIndustri {
  nama: string
  jabatan: string
  telp: string
  email: string
}

export interface Perusahaan {
  nama: string
  nama_lengkap: string
  alamat: string
  bidang_usaha: string
  status: string
  no_telp: string
  fax: string
  email: string
  website: string
  pimpinan: Pimpinan
  hrd: Hrd
  pembimbing_industri: PembimbingIndustri
  // Pembimbing II — template pengesahan resmi punya dua kolom pembimbing;
  // kosongkan jika hanya satu.
  pembimbing_industri_2?: PembimbingIndustri
}

export interface Pkl {
  tanggal_mulai: string
  tanggal_selesai: string
  durasi_bulan: number | null
  jam_pelajaran: number | null
  bagian_ditempatkan: string
  tahun_ajaran: string
}

// --------------------------------------------------------------------------- //
//  profil / kegiatan / studi kasus                                            //
// --------------------------------------------------------------------------- //
export interface JamKerja {
  hari: string        // misal: 'SENIN'
  // Slot jadwal multi-baris ("08.30 - 09.00\n09.00 - 12.00\n...") — sumber
  // kebenaran editor slot; keterangan berisi label per baris (BRIEFING dst).
  jam: string
  jam_mulai: string   // legacy: '08.30'
  jam_selesai: string // legacy: '16.30'
  jam_istirahat: string // legacy: '12.00-13.00'
  jam_briefing: string  // legacy: '30 menit' / '08.30-09.00'
  keterangan: string  // label per slot, sejajar dengan `jam`
}

export interface CabangPerusahaan {
  nama: string        // misal: 'PT Reksa Finance Cabang Lampung'
}

export interface AreaCabang {
  nama_area: string           // misal: 'Area I', atau '' jika tidak ada area
  cabang: CabangPerusahaan[]  // minimal 1 cabang
}

export interface JobDescription {
  posisi: string
  tugas: string[]
}

export type ProfilPerusahaan = {
  logo_perusahaan: string     // path/URL logo perusahaan
  sejarah: string
  visi: string
  misi: string[]
  head_office: string         // Alamat kantor pusat (opsional)
  area_cabang: AreaCabang[]   // wajib minimal 1 jika ada cabang
  struktur_organisasi: string // path/URL gambar bagan
  narasi_struktur: string     // AI-generated narasi manfaat struktur
  tata_tertib: string[]       // legacy field (tidak dipakai lagi di UI baru)
  tata_tertib_perusahaan: string[]  // tata tertib dari perusahaan (akan di-polish AI)
  jam_kerja: JamKerja[]
  job_descriptions: JobDescription[]
}

export interface Tugas {
  nama: string
  detail: string
  assets: string[]
}

export interface Kegiatan {
  bidang: string
  deskripsi_umum: string
  tugas: Tugas[]
}

export interface DataAngka {
  label: string
  nilai: string
}

export interface StudiKasus {
  judul: string
  latar_belakang: string
  proses_atau_formula: string
  data_angka: DataAngka[]
  hasil: string
  assets: string[]
}

export interface Peralatan {
  nama: string
  deskripsi: string
  gambar: string
}

export interface Kendala {
  masalah: string
  solusi: string
}

// --------------------------------------------------------------------------- //
//  closing / assets / gaps / lampiran                                         //
// --------------------------------------------------------------------------- //
export interface KataPengantar {
  ucapan_syukur: string
  hierarki_terima_kasih: string[]
  harapan: string
  kota: string
  tanggal: string
}

export type AssetType = 'foto' | 'screenshot' | 'logo' | 'dokumen' | 'diagram'

export interface Asset {
  id: string
  filename: string
  original_name: string
  type: AssetType
  caption: string
  used_in_bab: number | null
  path: string
}

export interface Gap {
  field: string
  reason: string
  impact: string
  resolution: string
}

export interface FotoDokumentasi {
  gambar: string
  keterangan: string
}

export interface DaftarPustaka {
  penulis: string
  judul: string
  tahun: string
  sumber: string
  url: string     // opsional
}

export interface Lampiran {
  jurnal_kegiatan: boolean
  absensi: boolean
  sertifikat: boolean
  penilaian: boolean
  surat_permohonan: boolean
  surat_balasan: boolean
  foto_dokumentasi: boolean
  foto_kegiatan: FotoDokumentasi[]
}

// --------------------------------------------------------------------------- //
//  Root                                                                       //
// --------------------------------------------------------------------------- //
export type PklStatus = 'collecting' | 'reviewing' | 'ready' | 'generated'

export interface PklContext {
  version: string
  status: PklStatus
  created_at: string
  updated_at: string
  config: PklConfig
  siswa: Siswa
  sekolah: Sekolah
  perusahaan: Perusahaan
  pkl: Pkl
  profil_perusahaan: ProfilPerusahaan
  kegiatan: Kegiatan[]
  studi_kasus: StudiKasus
  peralatan: Peralatan[]
  kendala: Kendala[]
  pelajaran: string[]
  refleksi: string           // cerita mentah user
  refleksi_bab5: string      // input user BAB V opsional
  kesimpulan_user: string    // input user BAB VI opsional
  saran_user: string         // input user BAB VI opsional
  kata_pengantar: KataPengantar
  daftar_pustaka: DaftarPustaka[]
  assets: Asset[]
  gaps: Gap[]
  lampiran: Lampiran
  generated_sections?: Record<string, string | string[]>
}

// --------------------------------------------------------------------------- //
//  Empty factories (inisialisasi field nested tanpa undefined)                //
// --------------------------------------------------------------------------- //
// Pedoman resmi SMKN 4 (1.7.2): kiri 4, kanan 3, atas 3, bawah 3.
export const emptyMargin = (): Margin => ({ atas: 3, bawah: 3, kiri: 4, kanan: 3 })

export const emptyConfig = (): PklConfig => ({
  preset: 'pedoman',
  cover_page_number: 'none',
  front_matter_format: 'lowerRoman',
  front_matter_start: 2,
  body_matter_format: 'arabic',
  body_matter_start: 1,
  jumlah_bab: null,
  bab_modules: [],
  margin: emptyMargin(),
  font: 'Times New Roman',
  font_size: 12,
  spasi: 1.5,
  pedoman_sekolah: null,
  auto_daftar_pustaka: true,
})

export const emptySiswa = (): Siswa => ({
  nama: '', nis: '', nisn: '', kelas: '', jurusan: '', jurusan_key: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', golongan_darah: '',
  catatan_kesehatan: '', no_telp: '', alamat: '', nama_ortu: '', alamat_ortu: '', telp_ortu: '', foto: ''
})

export const emptyKop = (): Kop => ({ baris_1: 'PEMERINTAH PROVINSI LAMPUNG', baris_2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN', baris_3: 'SMK NEGERI 4 BANDAR LAMPUNG', npsn: '10807215', nss: '401126003028' })
export const emptyPejabat = (): Pejabat => ({ nama: '', nip: '', gelar: '' })
export const emptySekolah = (): Sekolah => ({
  nama: 'SMK Negeri 4 Bandar Lampung', nama_lengkap: 'SMK Negeri 4 Bandar Lampung', alamat: 'Jl. HOS Cokroaminoto No.102', kota: 'Bandar Lampung', telp: '(0721) 262637', email: 'smkn4bl@yahoo.co.id', website: 'www.smkn4-bdl.sch.id',
  kop: emptyKop(),
  kepala_sekolah: { nama: 'HJ. Dewi Ningsih, S.Pd., M.Pd.', nip: '', gelar: '' },
  waka_humas: { nama: 'Mas Azizah, M.Pd', nip: '197810152009022001', gelar: '' },
  ketua_kk: emptyPejabat(),
  pembimbing_sekolah: emptyPejabat(),
})

export const emptyPimpinan = (): Pimpinan => ({ nama: '', jabatan: '' })
export const emptyHrd = (): Hrd => ({ nama: '', jabatan: '', telp: '', email: '' })
export const emptyPembimbingIndustri = (): PembimbingIndustri => ({ nama: '', jabatan: '', telp: '', email: '' })
export const emptyPerusahaan = (): Perusahaan => ({
  nama: '', nama_lengkap: '', alamat: '', bidang_usaha: '', status: '',
  no_telp: '', fax: '', email: '', website: '',
  pimpinan: emptyPimpinan(),
  hrd: emptyHrd(),
  pembimbing_industri: emptyPembimbingIndustri(),
  pembimbing_industri_2: emptyPembimbingIndustri(),
})

export const emptyPkl = (): Pkl => ({
  tanggal_mulai: '', tanggal_selesai: '', durasi_bulan: null, jam_pelajaran: null,
  bagian_ditempatkan: '', tahun_ajaran: '',
})

export const emptyJamKerja = (): JamKerja => ({ hari: '', jam: '', jam_mulai: '', jam_selesai: '', jam_istirahat: '', jam_briefing: '', keterangan: '' })
export const emptyCabangPerusahaan = (): CabangPerusahaan => ({ nama: '' })
export const emptyAreaCabang = (): AreaCabang => ({ nama_area: '', cabang: [emptyCabangPerusahaan()] })
export const emptyJobDescription = (): JobDescription => ({ posisi: '', tugas: [] })
export const emptyProfilPerusahaan = (): ProfilPerusahaan => ({
  logo_perusahaan: '',
  sejarah: '', visi: '', misi: [],
  head_office: '',
  area_cabang: [],
  struktur_organisasi: '', narasi_struktur: '',
  tata_tertib: [],
  tata_tertib_perusahaan: [],
  jam_kerja: [], job_descriptions: [],
})

export const emptyTugas = (): Tugas => ({ nama: '', detail: '', assets: [] })
export const emptyKegiatan = (): Kegiatan => ({ bidang: '', deskripsi_umum: '', tugas: [] })

export const emptyDataAngka = (): DataAngka => ({ label: '', nilai: '' })
export const emptyStudiKasus = (): StudiKasus => ({
  judul: '', latar_belakang: '', proses_atau_formula: '', data_angka: [], hasil: '', assets: [],
})

export const emptyPeralatan = (): Peralatan => ({ nama: '', deskripsi: '', gambar: '' })
export const emptyKendala = (): Kendala => ({ masalah: '', solusi: '' })

export const emptyKataPengantar = (): KataPengantar => ({
  ucapan_syukur: 'Puji syukur kepada Tuhan Yang Maha Esa, karena karunia dan nikmat yang diberikan-Nya sehingga Penulis dapat menyusun dan menyelesaikan Laporan Praktik Kerja Lapangan ini.', hierarki_terima_kasih: [], harapan: 'Penulis berharap semoga hasil laporan yang Penulis susun ini dapat bermanfaat. Terimakasih atas bimbingannya, dan Penulis mohon maaf apabila terdapat kesalahan atau perilaku yang tidak berkenan selama Praktik Kerja Lapangan ini berlangsung.', kota: 'Bandar Lampung', tanggal: '',
})

export const emptyAsset = (): Asset => ({
  id: '', filename: '', original_name: '', type: 'foto', caption: '',
  used_in_bab: null, path: '',
})

export const emptyFotoDokumentasi = (): FotoDokumentasi => ({ gambar: '', keterangan: '' })
export const emptyDaftarPustaka = (): DaftarPustaka => ({ penulis: '', judul: '', tahun: '', sumber: '', url: '' })

export const emptyLampiran = (): Lampiran => ({
  jurnal_kegiatan: false, absensi: false, sertifikat: false, penilaian: false,
  surat_permohonan: false, surat_balasan: false, foto_dokumentasi: true,
  foto_kegiatan: [],
})

export const emptyContext = (): PklContext => ({
  version: '1.0',
  status: 'collecting',
  created_at: '',
  updated_at: '',
  config: emptyConfig(),
  siswa: emptySiswa(),
  sekolah: emptySekolah(),
  perusahaan: emptyPerusahaan(),
  pkl: emptyPkl(),
  profil_perusahaan: emptyProfilPerusahaan(),
  kegiatan: [],
  studi_kasus: emptyStudiKasus(),
  peralatan: [],
  kendala: [],
  pelajaran: [],
  refleksi: '',
  refleksi_bab5: '',
  kesimpulan_user: '',
  saran_user: '',
  kata_pengantar: emptyKataPengantar(),
  daftar_pustaka: [],
  assets: [],
  gaps: [],
  lampiran: emptyLampiran(),
})
