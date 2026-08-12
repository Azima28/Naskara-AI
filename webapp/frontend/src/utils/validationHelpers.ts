import type { PklContext } from '@/types/pkl'

export interface InvalidFieldResult {
  stepIdx: number
  fieldKey: string
  fieldLabel: string
  stepTitle: string
}

/**
 * Pengecekan menyeluruh untuk mencari kolom WAJIB paling pertama (urutan teratas)
 * yang belum diisi atau dipilih oleh siswa di Form Wizard.
 */
export function findFirstInvalidField(ctx?: PklContext | null): InvalidFieldResult | null {
  if (!ctx) {
    return { stepIdx: 0, fieldKey: 'siswa.jurusan', fieldLabel: 'Jurusan / Program Keahlian', stepTitle: 'Data Siswa' }
  }

  const filled = (v?: string | null) => !!v && typeof v === 'string' && v.trim().length > 0

  // 0. Data Siswa
  if (!filled(ctx.siswa?.jurusan)) return { stepIdx: 0, fieldKey: 'siswa.jurusan', fieldLabel: 'Jurusan / Program Keahlian', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.nama)) return { stepIdx: 0, fieldKey: 'siswa.nama', fieldLabel: 'Nama Lengkap Siswa', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.foto)) return { stepIdx: 0, fieldKey: 'siswa.foto', fieldLabel: 'Pas Foto 3x4', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.nis)) return { stepIdx: 0, fieldKey: 'siswa.nis', fieldLabel: 'NIS Siswa', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.nisn)) return { stepIdx: 0, fieldKey: 'siswa.nisn', fieldLabel: 'NISN Siswa', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.kelas)) return { stepIdx: 0, fieldKey: 'siswa.kelas', fieldLabel: 'Nomor Kelas / Rombel', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.tempat_lahir)) return { stepIdx: 0, fieldKey: 'siswa.tempat_lahir', fieldLabel: 'Tempat Lahir', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.tanggal_lahir)) return { stepIdx: 0, fieldKey: 'siswa.tanggal_lahir', fieldLabel: 'Tanggal Lahir', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.jenis_kelamin)) return { stepIdx: 0, fieldKey: 'siswa.jenis_kelamin', fieldLabel: 'Jenis Kelamin', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.no_telp)) return { stepIdx: 0, fieldKey: 'siswa.no_telp', fieldLabel: 'No. Telp / HP Siswa', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.alamat)) return { stepIdx: 0, fieldKey: 'siswa.alamat', fieldLabel: 'Alamat Tempat Tinggal', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.nama_ortu)) return { stepIdx: 0, fieldKey: 'siswa.nama_ortu', fieldLabel: 'Nama Orang Tua / Wali', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.alamat_ortu)) return { stepIdx: 0, fieldKey: 'siswa.alamat_ortu', fieldLabel: 'Alamat Orang Tua / Wali', stepTitle: 'Data Siswa' }
  if (!filled(ctx.siswa?.telp_ortu)) return { stepIdx: 0, fieldKey: 'siswa.telp_ortu', fieldLabel: 'No. Telp Orang Tua / Wali', stepTitle: 'Data Siswa' }

  // 1. Data Sekolah
  if (!filled(ctx.sekolah?.nama)) return { stepIdx: 1, fieldKey: 'sekolah.nama', fieldLabel: 'Nama Singkat Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.nama_lengkap)) return { stepIdx: 1, fieldKey: 'sekolah.nama_lengkap', fieldLabel: 'Nama Lengkap Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.alamat)) return { stepIdx: 1, fieldKey: 'sekolah.alamat', fieldLabel: 'Alamat Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kota)) return { stepIdx: 1, fieldKey: 'sekolah.kota', fieldLabel: 'Kota Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.telp)) return { stepIdx: 1, fieldKey: 'sekolah.telp', fieldLabel: 'No. Telp Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.email)) return { stepIdx: 1, fieldKey: 'sekolah.email', fieldLabel: 'Email Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kop?.baris_1)) return { stepIdx: 1, fieldKey: 'sekolah.kop.baris_1', fieldLabel: 'Kop Surat Baris 1', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kop?.baris_2)) return { stepIdx: 1, fieldKey: 'sekolah.kop.baris_2', fieldLabel: 'Kop Surat Baris 2', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kop?.baris_3)) return { stepIdx: 1, fieldKey: 'sekolah.kop.baris_3', fieldLabel: 'Kop Surat Baris 3', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kop?.npsn)) return { stepIdx: 1, fieldKey: 'sekolah.kop.npsn', fieldLabel: 'NPSN Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kepala_sekolah?.nama)) return { stepIdx: 1, fieldKey: 'sekolah.kepala_sekolah.nama', fieldLabel: 'Nama Kepala Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kepala_sekolah?.nip)) return { stepIdx: 1, fieldKey: 'sekolah.kepala_sekolah.nip', fieldLabel: 'NIP Kepala Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.kepala_sekolah?.gelar)) return { stepIdx: 1, fieldKey: 'sekolah.kepala_sekolah.gelar', fieldLabel: 'Gelar Kepala Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.waka_humas?.nama)) return { stepIdx: 1, fieldKey: 'sekolah.waka_humas.nama', fieldLabel: 'Nama Waka Humas', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.waka_humas?.nip)) return { stepIdx: 1, fieldKey: 'sekolah.waka_humas.nip', fieldLabel: 'NIP Waka Humas', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.ketua_kk?.nama)) return { stepIdx: 1, fieldKey: 'sekolah.ketua_kk.nama', fieldLabel: 'Nama Ketua Jurusan', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.ketua_kk?.nip)) return { stepIdx: 1, fieldKey: 'sekolah.ketua_kk.nip', fieldLabel: 'NIP Ketua Jurusan', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.pembimbing_sekolah?.nama)) return { stepIdx: 1, fieldKey: 'sekolah.pembimbing_sekolah.nama', fieldLabel: 'Nama Pembimbing Sekolah', stepTitle: 'Data Sekolah' }
  if (!filled(ctx.sekolah?.pembimbing_sekolah?.nip)) return { stepIdx: 1, fieldKey: 'sekolah.pembimbing_sekolah.nip', fieldLabel: 'NIP Pembimbing Sekolah', stepTitle: 'Data Sekolah' }

  // 2. Data Perusahaan
  if (!filled(ctx.perusahaan?.nama)) return { stepIdx: 2, fieldKey: 'perusahaan.nama', fieldLabel: 'Nama Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.nama_lengkap)) return { stepIdx: 2, fieldKey: 'perusahaan.nama_lengkap', fieldLabel: 'Nama Lengkap Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.alamat)) return { stepIdx: 2, fieldKey: 'perusahaan.alamat', fieldLabel: 'Alamat Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.bidang_usaha)) return { stepIdx: 2, fieldKey: 'perusahaan.bidang_usaha', fieldLabel: 'Bidang Usaha', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.status)) return { stepIdx: 2, fieldKey: 'perusahaan.status', fieldLabel: 'Status Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.no_telp)) return { stepIdx: 2, fieldKey: 'perusahaan.no_telp', fieldLabel: 'No. Telp Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.email)) return { stepIdx: 2, fieldKey: 'perusahaan.email', fieldLabel: 'Email Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.pimpinan?.nama)) return { stepIdx: 2, fieldKey: 'perusahaan.pimpinan.nama', fieldLabel: 'Nama Pimpinan Perusahaan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.pimpinan?.jabatan)) return { stepIdx: 2, fieldKey: 'perusahaan.pimpinan.jabatan', fieldLabel: 'Jabatan Pimpinan', stepTitle: 'Data Perusahaan' }
  if (!filled(ctx.perusahaan?.pembimbing_industri?.nama)) return { stepIdx: 2, fieldKey: 'perusahaan.pembimbing_industri.nama', fieldLabel: 'Nama Pembimbing Industri', stepTitle: 'Data Perusahaan' }

  // 3. Periode PKL
  if (!filled(ctx.pkl?.tanggal_mulai)) return { stepIdx: 3, fieldKey: 'pkl.tanggal_mulai', fieldLabel: 'Tanggal Mulai PKL', stepTitle: 'Periode PKL' }
  if (!filled(ctx.pkl?.tanggal_selesai)) return { stepIdx: 3, fieldKey: 'pkl.tanggal_selesai', fieldLabel: 'Tanggal Selesai PKL', stepTitle: 'Periode PKL' }
  if (!ctx.pkl?.jam_pelajaran) return { stepIdx: 3, fieldKey: 'pkl.jam_pelajaran', fieldLabel: 'Total Jam Kerja / Pelajaran', stepTitle: 'Periode PKL' }
  if (!filled(ctx.pkl?.bagian_ditempatkan)) return { stepIdx: 3, fieldKey: 'pkl.bagian_ditempatkan', fieldLabel: 'Bagian / Divisi Tempat PKL', stepTitle: 'Periode PKL' }

  // 4. Profil Perusahaan (BAB II)
  if (!filled(ctx.profil_perusahaan?.logo_perusahaan)) return { stepIdx: 4, fieldKey: 'profil_perusahaan.logo_perusahaan', fieldLabel: 'Logo Perusahaan', stepTitle: 'Profil Perusahaan (BAB II)' }
  if (!filled(ctx.profil_perusahaan?.sejarah)) return { stepIdx: 4, fieldKey: 'profil_perusahaan.sejarah', fieldLabel: 'Sejarah Perusahaan', stepTitle: 'Profil Perusahaan (BAB II)' }
  if (!filled(ctx.profil_perusahaan?.visi)) return { stepIdx: 4, fieldKey: 'profil_perusahaan.visi', fieldLabel: 'Visi Perusahaan', stepTitle: 'Profil Perusahaan (BAB II)' }

  const misiArr = Array.isArray(ctx.profil_perusahaan?.misi) ? ctx.profil_perusahaan.misi : []
  if (misiArr.length === 0 || !filled(misiArr[0])) {
    return { stepIdx: 4, fieldKey: 'profil_perusahaan.misi', fieldLabel: 'Misi Perusahaan', stepTitle: 'Profil Perusahaan (BAB II)' }
  }

  const ttRaw: any = ctx.profil_perusahaan?.tata_tertib_perusahaan || ctx.profil_perusahaan?.tata_tertib || []
  const ttArr: string[] = Array.isArray(ttRaw) ? ttRaw : typeof ttRaw === 'string' && String(ttRaw).trim() ? [String(ttRaw)] : []
  if (ttArr.length === 0 || !filled(ttArr[0])) {
    return { stepIdx: 4, fieldKey: 'profil_perusahaan.tata_tertib_perusahaan', fieldLabel: 'Tata Tertib Perusahaan', stepTitle: 'Profil Perusahaan (BAB II)' }
  }

  const jkArr = Array.isArray(ctx.profil_perusahaan?.jam_kerja) ? ctx.profil_perusahaan.jam_kerja : []
  if (jkArr.length === 0) {
    return { stepIdx: 4, fieldKey: 'profil_perusahaan.jam_kerja', fieldLabel: 'Jadwal Jam Kerja', stepTitle: 'Profil Perusahaan (BAB II)' }
  }

  // 5. Kegiatan, Peralatan & Kendala
  const kegs = Array.isArray(ctx.kegiatan) ? ctx.kegiatan : []
  const hasValidKeg = kegs.some(k => filled(k?.bidang) || (Array.isArray(k?.tugas) && k.tugas.some(t => filled(t?.nama))))
  if (!hasValidKeg) return { stepIdx: 5, fieldKey: 'kegiatan', fieldLabel: 'Kegiatan Utama PKL', stepTitle: 'Kegiatan, Peralatan & Kendala' }
  const peralatans = Array.isArray(ctx.peralatan) ? ctx.peralatan : []
  if (!peralatans.some(p => filled(p?.nama))) return { stepIdx: 5, fieldKey: 'peralatan', fieldLabel: 'Nama Peralatan', stepTitle: 'Kegiatan, Peralatan & Kendala' }
  const kendalas = Array.isArray(ctx.kendala) ? ctx.kendala : []
  if (!kendalas.some(k => filled(k?.masalah) && filled(k?.solusi))) return { stepIdx: 5, fieldKey: 'kendala', fieldLabel: 'Kendala & Solusi', stepTitle: 'Kegiatan, Peralatan & Kendala' }
  const pelajaran = Array.isArray(ctx.pelajaran) ? ctx.pelajaran : []
  if (!pelajaran.some(p => filled(p))) return { stepIdx: 5, fieldKey: 'pelajaran', fieldLabel: 'Pelajaran / Pengalaman', stepTitle: 'Kegiatan, Peralatan & Kendala' }

  // 6. Studi Kasus Teknis
  if (!filled(ctx.studi_kasus?.judul)) return { stepIdx: 6, fieldKey: 'studi_kasus.judul', fieldLabel: 'Pekerjaan Utama yang Dikembangkan', stepTitle: 'Studi Kasus Teknis' }
  if (!filled(ctx.studi_kasus?.latar_belakang)) return { stepIdx: 6, fieldKey: 'studi_kasus.latar_belakang', fieldLabel: 'Kondisi Awal / Masalah Sebelum Pengerjaan', stepTitle: 'Studi Kasus Teknis' }
  if (!filled(ctx.studi_kasus?.proses_atau_formula)) return { stepIdx: 6, fieldKey: 'studi_kasus.proses_atau_formula', fieldLabel: 'Langkah-Langkah Pengerjaan', stepTitle: 'Studi Kasus Teknis' }
  if (!filled(ctx.studi_kasus?.hasil)) return { stepIdx: 6, fieldKey: 'studi_kasus.hasil', fieldLabel: 'Hasil Akhir Pekerjaan', stepTitle: 'Studi Kasus Teknis' }
  if (!ctx.studi_kasus?.jenis_tabel) return { stepIdx: 6, fieldKey: 'studi_kasus.jenis_tabel', fieldLabel: 'Pilihan Jenis Analisis Tabel (WAJIB DIPILIH)', stepTitle: 'Studi Kasus Teknis' }

  // 7. Closing
  if (!filled(ctx.kesimpulan_user)) return { stepIdx: 7, fieldKey: 'kesimpulan_user', fieldLabel: 'Kesimpulan PKL', stepTitle: 'Penutup & Kesimpulan' }
  if (!filled(ctx.saran_user)) return { stepIdx: 7, fieldKey: 'saran_user', fieldLabel: 'Saran untuk Sekolah / Perusahaan', stepTitle: 'Penutup & Kesimpulan' }
  if (!filled(ctx.kata_pengantar?.kota)) return { stepIdx: 7, fieldKey: 'kata_pengantar.kota', fieldLabel: 'Tempat Penulisan Kata Pengantar', stepTitle: 'Penutup & Kesimpulan' }
  if (!filled(ctx.kata_pengantar?.tanggal)) return { stepIdx: 7, fieldKey: 'kata_pengantar.tanggal', fieldLabel: 'Tanggal Penulisan Kata Pengantar', stepTitle: 'Penutup & Kesimpulan' }

  // 8. Assets & Lampiran
  const hasFoto = (Array.isArray(ctx.assets) && ctx.assets.length > 0) || (Array.isArray(ctx.lampiran?.foto_kegiatan) && ctx.lampiran.foto_kegiatan.length > 0)
  if (!hasFoto) return { stepIdx: 8, fieldKey: 'lampiran.foto_kegiatan', fieldLabel: 'Foto Dokumentasi Kegiatan (Minimal 1 Foto)', stepTitle: 'Lampiran & Foto' }

  return null
}

export function isWizardComplete(ctx?: PklContext | null): boolean {
  if (!ctx) return false
  return findFirstInvalidField(ctx) === null
}

const MAIN_NARRATIVE_KEYS = [
  'latar_belakang',
  'tujuan_pkl',
  'profil_sejarah',
  'tata_tertib',
  'narasi_struktur',
  'landasan_teori',
  'pembahasan',
  'kesimpulan_saran',
]

export function isEditorComplete(ctx?: PklContext | null): boolean {
  if (!ctx) return false
  const gen = ctx.generated_sections || {}
  const prof = ctx.profil_perusahaan || {}

  const bab1Keys = ['latar_belakang', 'tujuan_pkl', 'profil_sejarah', 'tata_tertib', 'narasi_struktur']
  const bab1Count = bab1Keys.filter((k) => {
    const v = gen[k] || (k === 'profil_sejarah' ? prof.sejarah : k === 'tata_tertib' ? (prof.tata_tertib_perusahaan || prof.tata_tertib) : '')
    return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
  }).length

  const mainNarrativeCount = Object.entries(gen).filter(([key, val]) => {
    if (!MAIN_NARRATIVE_KEYS.includes(key) && !key.startsWith('kegiatan_')) return false
    return Array.isArray(val) ? val.length > 0 : !!(typeof val === 'string' && val.trim())
  }).length

  return bab1Count >= 2 && mainNarrativeCount >= 3
}
