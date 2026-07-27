import { useState, type ReactNode } from 'react'
import type { Pejabat, PklContext, Sekolah } from '@/types/pkl'
import { FieldGroup, ImportanceLegend, TextField } from '@/components/fields/FormFields'

/**
 * Panel data yang sudah terisi default. Isinya dikunci (read-only) supaya user
 * tidak perlu memikirkannya, tapi tetap bisa dibuka lewat tombol "Ubah" kalau
 * datanya ternyata tidak cocok — misalnya user berasal dari sekolah lain.
 */
function PrefilledGroup({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: (locked: boolean) => ReactNode
}) {
  const [locked, setLocked] = useState(true)

  return (
    <FieldGroup title={title}>
      <div className="prefill-note">
        <p className="muted prefill-note__text">{description}</p>
        <button
          type="button"
          className={locked ? 'btn-sm' : 'btn-sm btn-active'}
          onClick={() => setLocked((v) => !v)}
        >
          {locked ? 'Ubah data ini' : 'Selesai mengubah'}
        </button>
      </div>
      {children(locked)}
    </FieldGroup>
  )
}

export default function SekolahStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const s = ctx.sekolah
  const upd = (patch: Partial<Sekolah>) => set({ sekolah: { ...s, ...patch } })
  const updKop = (patch: Partial<typeof s.kop>) => upd({ kop: { ...s.kop, ...patch } })
  const updPejabat = (key: 'kepala_sekolah' | 'waka_humas' | 'ketua_kk' | 'pembimbing_sekolah', patch: Partial<Pejabat>) =>
    upd({ [key]: { ...s[key], ...patch } } as Partial<Sekolah>)

  return (
    <>
      <h2>Data Sekolah</h2>
      <p className="muted">
        Identitas sekolah sudah kami isi dengan data SMK Negeri 4 Bandar Lampung. Kalau kamu dari
        sekolah lain, tekan <strong>Ubah data ini</strong> untuk mengoreksinya.
      </p>

      <ImportanceLegend />

      <PrefilledGroup
        title="Identitas Sekolah"
        description="Sudah terisi otomatis. Periksa sebentar, biasanya tidak perlu diubah."
      >
        {(locked) => (
          <>
            <TextField label="Nama Singkat" value={s.nama} onChange={(v) => upd({ nama: v })} importance="wajib" placeholder="SMKN 4 BDL" hint="Muncul di Cover dan Pengesahan" readOnly={locked} />
            <TextField label="Nama Lengkap" value={s.nama_lengkap} onChange={(v) => upd({ nama_lengkap: v })} importance="opsional" placeholder="SMK Negeri 4 Bandar Lampung" readOnly={locked} />
            <TextField label="Alamat Sekolah" value={s.alamat} onChange={(v) => upd({ alamat: v })} importance="opsional" readOnly={locked} />
            <TextField label="Kota" value={s.kota} onChange={(v) => upd({ kota: v })} importance="wajib" hint="Dipakai untuk tanggal di Kata Pengantar (misal: Bandar Lampung, 25 Juli 2026)" readOnly={locked} />
            <TextField label="No. Telp" value={s.telp} onChange={(v) => upd({ telp: v })} importance="opsional" readOnly={locked} />
            <TextField label="Email" value={s.email} onChange={(v) => upd({ email: v })} importance="opsional" readOnly={locked} />
            <TextField label="Website" value={s.website} onChange={(v) => upd({ website: v })} importance="opsional" readOnly={locked} />
          </>
        )}
      </PrefilledGroup>

      <PrefilledGroup
        title="Kop Surat"
        description="Dipakai untuk kop di Halaman Pengesahan. Ubah kalau kop sekolahmu berbeda."
      >
        {(locked) => (
          <>
            <TextField label="Baris 1 (Instansi)" value={s.kop?.baris_1} onChange={(v) => updKop({ baris_1: v })} importance="opsional" hint="Contoh: PEMERINTAH PROVINSI LAMPUNG" readOnly={locked} />
            <TextField label="Baris 2 (Dinas)" value={s.kop?.baris_2} onChange={(v) => updKop({ baris_2: v })} importance="opsional" hint="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN" readOnly={locked} />
            <TextField label="Baris 3 (Nama)" value={s.kop?.baris_3} onChange={(v) => updKop({ baris_3: v })} importance="opsional" hint="Contoh: SMK NEGERI 4 BANDAR LAMPUNG" readOnly={locked} />
            <TextField label="NPSN" value={s.kop?.npsn} onChange={(v) => updKop({ npsn: v })} importance="opsional" hint="Nomor Pokok Sekolah Nasional" readOnly={locked} />
            <TextField label="NSS" value={s.kop?.nss} onChange={(v) => updKop({ nss: v })} importance="opsional" readOnly={locked} />
          </>
        )}
      </PrefilledGroup>

      <FieldGroup title="Pejabat Sekolah">
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem' }}>
          Bagian ini harus kamu isi sendiri. Tanya ke guru pembimbing kalau tidak tahu. Gelar ditulis
          setelah nama di Halaman Pengesahan (contoh: S.Pd., M.M.)
        </p>
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField label="Kepala Sekolah - Nama" value={s.kepala_sekolah.nama} onChange={(v) => updPejabat('kepala_sekolah', { nama: v })} importance="wajib" />
          <TextField label="Kepala Sekolah - NIP" value={s.kepala_sekolah.nip} onChange={(v) => updPejabat('kepala_sekolah', { nip: v })} importance="opsional" />
          <TextField label="Kepala Sekolah - Gelar" value={s.kepala_sekolah.gelar} onChange={(v) => updPejabat('kepala_sekolah', { gelar: v })} importance="opsional" />
        </div>
        
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField label="Waka Humas - Nama" value={s.waka_humas.nama} onChange={(v) => updPejabat('waka_humas', { nama: v })} importance="wajib" />
          <TextField label="Waka Humas - NIP" value={s.waka_humas.nip} onChange={(v) => updPejabat('waka_humas', { nip: v })} importance="opsional" />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField label="Ketua Jurusan / KK - Nama" value={s.ketua_kk.nama} onChange={(v) => updPejabat('ketua_kk', { nama: v })} importance="wajib" />
          <TextField label="Ketua Jurusan / KK - NIP" value={s.ketua_kk.nip} onChange={(v) => updPejabat('ketua_kk', { nip: v })} importance="opsional" />
        </div>

        <div>
          <TextField label="Pembimbing Sekolah - Nama" value={s.pembimbing_sekolah.nama} onChange={(v) => updPejabat('pembimbing_sekolah', { nama: v })} importance="wajib" />
          <TextField label="Pembimbing Sekolah - NIP" value={s.pembimbing_sekolah.nip} onChange={(v) => updPejabat('pembimbing_sekolah', { nip: v })} importance="opsional" />
        </div>
      </FieldGroup>
    </>
  )
}
