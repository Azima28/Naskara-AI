import { useState } from 'react'
import type { PklContext } from '@/types/pkl'
import { FieldGroup, ImportanceLegend, TextField, SelectField, ImageUploadField } from '@/components/fields/FormFields'
import { detectJurusanKey, getJurusanExample } from '@/utils/jurusanExamples'
import JurusanDocxPreviewModal from '@/components/wizard/JurusanDocxPreviewModal'
import { IconSearch } from '@/components/common/Icons'

const JURUSAN_PRESETS = [
  { name: 'PPLG (Perangkat Lunak & Gim)', value: 'Pemrograman Perangkat Lunak dan Gim', key: 'pplg' },
  { name: 'TKJ (Teknik Komputer & Jaringan)', value: 'Teknik Komputer dan Jaringan', key: 'tkj' },
  { name: 'DKV (Desain Komunikasi Visual)', value: 'Desain Komunikasi Visual', key: 'dkv' },
  { name: 'UPW (Usaha Perjalanan Wisata)', value: 'Usaha Perjalanan Wisata', key: 'upw' },
  { name: 'PH (Perhotelan)', value: 'Perhotelan', key: 'ph' },
  { name: 'TB (Tata Boga / Kuliner)', value: 'Tata Boga', key: 'tb' },
  { name: 'TS (Tata Busana / Fashion)', value: 'Tata Busana', key: 'busana' },
  { name: 'OTKP (Tata Kelola Perkantoran)', value: 'Otomatisasi dan Tata Kelola Perkantoran', key: 'otkp' },
  { name: 'AKL (Akuntansi & Keuangan)', value: 'Akuntansi dan Keuangan Lembaga', key: 'akl' },
  { name: 'BDP (Bisnis Daring & Pemasaran)', value: 'Bisnis Daring dan Pemasaran', key: 'bdp' },
]

export default function SiswaStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const s = ctx.siswa
  const upd = (patch: Partial<typeof s>) => set({ siswa: { ...s, ...patch } })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const currentJurusanExample = getJurusanExample(s.jurusan_key || detectJurusanKey(s.jurusan))

  const handleJurusanChange = (val: string, forcedKey?: string) => {
    const key = forcedKey || detectJurusanKey(val)
    upd({ jurusan: val, jurusan_key: key })
  }

  return (
    <>
      <h2>Data Siswa</h2>
      <p className="muted">Data diri kamu. Ini yang akan muncul di Cover dan Halaman Pengesahan.</p>

      <ImportanceLegend />

      <FieldGroup title="Data Akademik">
        <TextField name="siswa.nama" label="Nama Lengkap" value={s.nama} onChange={(v) => upd({ nama: v })} importance="wajib" hint="Muncul di Cover dan Pengesahan" />
        <ImageUploadField
          name="siswa.foto"
          label="Pas Foto 3x4"
          value={s.foto || ''}
          onChange={(v) => upd({ foto: v })}
          importance="wajib"
          hint="Digunakan untuk halaman Identitas Siswa"
        />
        <TextField name="siswa.nis" label="NIS" value={s.nis} onChange={(v) => upd({ nis: v })} importance="wajib" hint="Nomor Induk Siswa (biasanya 4-5 digit)" />
        <TextField name="siswa.nisn" label="NISN" value={s.nisn} onChange={(v) => upd({ nisn: v })} importance="wajib" hint="Nomor Induk Siswa Nasional (10 digit)" />
        <TextField name="siswa.kelas" label="Kelas" value={s.kelas} onChange={(v) => upd({ kelas: v })} importance="wajib" placeholder="XII AKL 1" />

        <div className="field field--full">
          <TextField
            name="siswa.jurusan"
            label="Jurusan / Program Keahlian"
            value={s.jurusan}
            onChange={(v) => handleJurusanChange(v)}
            importance="wajib"
            placeholder="contoh: Rekayasa Perangkat Lunak"
            hint="Ketik nama jurusan kamu, atau pilih cepat dari tombol di bawah"
          />

          <div style={{ marginTop: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>
              Pilih Cepat Jurusan SMK:
            </span>
            <div className="checkbox-grid">
              {JURUSAN_PRESETS.map((jp) => {
                const isSelected = (s.jurusan_key || detectJurusanKey(s.jurusan)) === jp.key
                return (
                  <button
                    key={jp.key}
                    type="button"
                    className={`chip ${isSelected ? 'chip--on' : ''}`}
                    onClick={() => handleJurusanChange(jp.value, jp.key)}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
                  >
                    {jp.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Detected Jurusan Badge & Preview Button */}
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.85rem 1rem',
              background: 'var(--green-50, #f0fdf4)',
              border: '1px solid var(--green-500, #4ade80)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-700)', textTransform: 'uppercase' }}>
                  Jurusan Terdeteksi:
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {currentJurusanExample.label}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-sm btn-primary btn-mobile-full"
              onClick={() => setShowPreviewModal(true)}
              style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <IconSearch size={14} /> Lihat Contoh Lembaran Laporan (.docx) Per Jurusan
            </button>
          </div>
        </div>
      </FieldGroup>

      {/* Modal Preview Lembaran Laporan per Jurusan */}
      <JurusanDocxPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        initialJurusanKey={s.jurusan_key || detectJurusanKey(s.jurusan)}
        onSelectJurusan={(val, key) => handleJurusanChange(val, key)}
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
