import { useState } from 'react'
import type { PklContext } from '@/types/pkl'
import { FieldGroup, ImportanceLegend, TextField, SelectField, ImageUploadField } from '@/components/fields/FormFields'
import { detectJurusanKey } from '@/utils/jurusanExamples'
import JurusanDocxPreviewModal from '@/components/wizard/JurusanDocxPreviewModal'
import { IconSearch } from '@/components/common/Icons'

const JURUSAN_DROPDOWN_OPTIONS = [
  { label: 'Pemrograman Perangkat Lunak & Gim (PPLG)', value: 'Pemrograman Perangkat Lunak dan Gim', key: 'pplg', code: 'PPLG' },
  { label: 'Teknik Komputer dan Jaringan (TKJ)', value: 'Teknik Komputer dan Jaringan', key: 'tkj', code: 'TKJ' },
  { label: 'Desain Komunikasi Visual (DKV)', value: 'Desain Komunikasi Visual', key: 'dkv', code: 'DKV' },
  { label: 'Usaha Perjalanan Wisata (UPW)', value: 'Usaha Perjalanan Wisata', key: 'upw', code: 'UPW' },
  { label: 'Perhotelan (PH)', value: 'Perhotelan', key: 'ph', code: 'PH' },
  { label: 'Tata Boga (TB / Kuliner)', value: 'Tata Boga', key: 'tb', code: 'TB' },
  { label: 'Tata Busana (TS / Fashion)', value: 'Tata Busana', key: 'busana', code: 'TS' },
  { label: 'Otomatisasi & Tata Kelola Perkantoran (OTKP)', value: 'Otomatisasi dan Tata Kelola Perkantoran', key: 'otkp', code: 'OTKP' },
  { label: 'Akuntansi & Keuangan Lembaga (AKL)', value: 'Akuntansi dan Keuangan Lembaga', key: 'akl', code: 'AKL' },
  { label: 'Bisnis Daring & Pemasaran (BDP)', value: 'Bisnis Daring dan Pemasaran', key: 'bdp', code: 'BDP' },
]

export default function SiswaStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const s = ctx.siswa
  const upd = (patch: Partial<typeof s>) => set({ siswa: { ...s, ...patch } })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const handleSelectJurusan = (val: string, forcedKey?: string) => {
    const item = JURUSAN_DROPDOWN_OPTIONS.find((j) => j.value === val || j.key === forcedKey)
    if (item) {
      upd({
        jurusan: item.value,
        jurusan_key: item.key,
        kelas: `XII ${item.code}`,
      })
    } else {
      const key = forcedKey || detectJurusanKey(val)
      upd({ jurusan: val, jurusan_key: key })
    }
  }

  return (
    <>
      <h2>Data Siswa</h2>
      <p className="muted">Data diri kamu. Ini yang akan muncul di Cover dan Halaman Pengesahan.</p>

      <ImportanceLegend />

      <FieldGroup title="Data Akademik">
        {/* 1. Jurusan Dropdown (Pertama) */}
        <div className="field field--full" style={{ marginBottom: '1rem' }}>
          <SelectField
            name="siswa.jurusan"
            label="Jurusan / Program Keahlian"
            value={s.jurusan}
            onChange={(v) => handleSelectJurusan(v)}
            importance="wajib"
            hint="Pilih 1 dari 10 Konsentrasi Keahlian resmi SMKN 4 Bandar Lampung"
            options={JURUSAN_DROPDOWN_OPTIONS.map((j) => ({
              label: j.label,
              value: j.value,
            }))}
          />

          <div style={{ marginTop: '0.45rem' }}>
            <button
              type="button"
              className="btn-sm btn-outline"
              onClick={() => setShowPreviewModal(true)}
              style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <IconSearch size={14} /> Lihat Contoh Lembaran Laporan (.docx) Per Jurusan
            </button>
          </div>
        </div>

        {/* 2. Nama Lengkap */}
        <TextField name="siswa.nama" label="Nama Lengkap" value={s.nama} onChange={(v) => upd({ nama: v })} importance="wajib" hint="Muncul di Cover dan Pengesahan" />

        {/* 3. Pas Foto 3x4 */}
        <ImageUploadField
          name="siswa.foto"
          label="Pas Foto 3x4"
          value={s.foto || ''}
          onChange={(v) => upd({ foto: v })}
          importance="wajib"
          hint="Digunakan untuk halaman Identitas Siswa"
        />

        {/* 4. NIS */}
        <TextField name="siswa.nis" label="NIS" value={s.nis} onChange={(v) => upd({ nis: v })} importance="wajib" hint="Nomor Induk Siswa (biasanya 4-5 digit)" />

        {/* 5. NISN */}
        <TextField name="siswa.nisn" label="NISN" value={s.nisn} onChange={(v) => upd({ nisn: v })} importance="wajib" hint="Nomor Induk Siswa Nasional (10 digit)" />

        {/* 6. Kelas (Auto-filled berdasarkan jurusan) */}
        <TextField
          name="siswa.kelas"
          label="Kelas"
          value={s.kelas}
          onChange={(v) => upd({ kelas: v })}
          importance="wajib"
          placeholder="XII PPLG 1"
          hint="Terisi otomatis berdasarkan Jurusan (bisa disesuaikan nomor rombelnya, misal: XII PPLG 2)"
        />
      </FieldGroup>

      {/* Modal Preview Lembaran Laporan per Jurusan */}
      <JurusanDocxPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        initialJurusanKey={s.jurusan_key || detectJurusanKey(s.jurusan)}
        onSelectJurusan={(val, key) => handleSelectJurusan(val, key)}
      />

      <FieldGroup title="Data Pribadi">
        <TextField label="Tempat Lahir" value={s.tempat_lahir} onChange={(v) => upd({ tempat_lahir: v })} importance="wajib" placeholder="Bandar Lampung" />
        <TextField label="Tanggal Lahir" value={s.tanggal_lahir} onChange={(v) => upd({ tanggal_lahir: v })} type="date" importance="wajib" />
        <SelectField
          label="Jenis Kelamin"
          value={s.jenis_kelamin}
          onChange={(v) => upd({ jenis_kelamin: v })}
          importance="wajib"
          options={[
            { label: 'Laki-laki', value: 'Laki-laki' },
            { label: 'Perempuan', value: 'Perempuan' },
          ]}
        />
        <SelectField
          label="Golongan Darah"
          value={s.golongan_darah}
          onChange={(v) => upd({ golongan_darah: v })}
          options={[
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'AB', value: 'AB' },
            { label: 'O', value: 'O' },
          ]}
        />
        <TextField label="Catatan Kesehatan" value={s.catatan_kesehatan} onChange={(v) => upd({ catatan_kesehatan: v })} importance="opsional" hint="Misal: Baik, atau Alergi debu. Kosongkan jika tidak ada." />
        <TextField label="No. Telp/HP" value={s.no_telp} onChange={(v) => upd({ no_telp: v })} importance="wajib" />
        <TextField label="Alamat" value={s.alamat} onChange={(v) => upd({ alamat: v })} importance="wajib" />
      </FieldGroup>

      <FieldGroup title="Data Orang Tua / Wali">
        <TextField label="Nama Orang Tua/Wali" value={s.nama_ortu} onChange={(v) => upd({ nama_ortu: v })} importance="wajib" />
        <TextField label="Alamat Orang Tua" value={s.alamat_ortu} onChange={(v) => upd({ alamat_ortu: v })} importance="wajib" />
        <TextField label="No. Telp Orang Tua" value={s.telp_ortu} onChange={(v) => upd({ telp_ortu: v })} importance="wajib" />
      </FieldGroup>
    </>
  )
}
