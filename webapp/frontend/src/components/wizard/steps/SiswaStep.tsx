import type { PklContext } from '@/types/pkl'
import { FieldGroup, ImportanceLegend, TextField, SelectField, ImageUploadField } from '@/components/fields/FormFields'

export default function SiswaStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const s = ctx.siswa
  const upd = (patch: Partial<typeof s>) => set({ siswa: { ...s, ...patch } })

  return (
    <>
      <h2>Data Siswa</h2>
      <p className="muted">Data diri kamu. Ini yang akan muncul di Cover dan Halaman Pengesahan.</p>

      <ImportanceLegend />

      <FieldGroup title="Data Akademik">
        <TextField label="Nama Lengkap" value={s.nama} onChange={(v) => upd({ nama: v })} importance="wajib" hint="Muncul di Cover dan Pengesahan" />
        <ImageUploadField 
          label="Pas Foto 3x4" 
          value={s.foto || ''} 
          onChange={(v) => upd({ foto: v })} 
          importance="wajib" 
          hint="Digunakan untuk halaman Identitas Siswa" 
        />
        <TextField label="NIS" value={s.nis} onChange={(v) => upd({ nis: v })} importance="wajib" hint="Nomor Induk Siswa (biasanya 4-5 digit)" />
        <TextField label="NISN" value={s.nisn} onChange={(v) => upd({ nisn: v })} importance="wajib" hint="Nomor Induk Siswa Nasional (10 digit)" />
        <TextField label="Kelas" value={s.kelas} onChange={(v) => upd({ kelas: v })} importance="wajib" placeholder="XII AKL 1" />
        <TextField 
          label="Jurusan" 
          value={s.jurusan} 
          onChange={(v) => {
            let key = 'lainnya'
            const lower = v.toLowerCase()
            if (lower.includes('akuntansi') || lower.includes('akl')) key = 'akl'
            else if (lower.includes('komputer jaringan') || lower.includes('tkj')) key = 'tkj'
            else if (lower.includes('perangkat lunak') || lower.includes('rpl')) key = 'rpl'
            else if (lower.includes('pemasaran') || lower.includes('bdp')) key = 'bdp'
            else if (lower.includes('perkantoran') || lower.includes('mplb')) key = 'mplb'
            
            upd({ jurusan: v, jurusan_key: key })
          }} 
          importance="wajib" 
          placeholder="contoh: Rekayasa Perangkat Lunak" 
          hint="Sistem akan otomatis mengenali program keahlian dari teks ini" 
        />
      </FieldGroup>

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
