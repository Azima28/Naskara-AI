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
            <TextField name="sekolah.nama" label="Nama Singkat" value={s.nama} onChange={(v) => upd({ nama: v })} importance="wajib" placeholder="SMKN 4 BDL" hint="Muncul di Cover dan Pengesahan" readOnly={locked} />
            <TextField name="sekolah.nama_lengkap" label="Nama Lengkap" value={s.nama_lengkap} onChange={(v) => upd({ nama_lengkap: v })} importance="wajib" placeholder="SMK Negeri 4 Bandar Lampung" readOnly={locked} />
            <TextField name="sekolah.alamat" label="Alamat Sekolah" value={s.alamat} onChange={(v) => upd({ alamat: v })} importance="wajib" readOnly={locked} />
            <TextField name="sekolah.kota" label="Kota" value={s.kota} onChange={(v) => upd({ kota: v })} importance="wajib" hint="Dipakai untuk tanggal di Kata Pengantar (misal: Bandar Lampung, 25 Juli 2026)" readOnly={locked} />
            <TextField name="sekolah.telp" label="No. Telp" value={s.telp} onChange={(v) => upd({ telp: v })} importance="wajib" readOnly={locked} />
            <TextField name="sekolah.email" label="Email" value={s.email} onChange={(v) => upd({ email: v })} importance="wajib" readOnly={locked} />
            <TextField name="sekolah.website" label="Website" value={s.website} onChange={(v) => upd({ website: v })} importance="wajib" readOnly={locked} />
          </>
        )}
      </PrefilledGroup>

      <PrefilledGroup
        title="Kop Surat"
        description="Dipakai untuk kop di Halaman Pengesahan. Ubah kalau kop sekolahmu berbeda."
      >
        {(locked) => (
          <>
            <TextField label="Baris 1 (Instansi)" value={s.kop?.baris_1} onChange={(v) => updKop({ baris_1: v })} importance="wajib" hint="Contoh: PEMERINTAH PROVINSI LAMPUNG" readOnly={locked} />
            <TextField label="Baris 2 (Dinas)" value={s.kop?.baris_2} onChange={(v) => updKop({ baris_2: v })} importance="wajib" hint="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN" readOnly={locked} />
            <TextField label="Baris 3 (Nama)" value={s.kop?.baris_3} onChange={(v) => updKop({ baris_3: v })} importance="wajib" hint="Contoh: SMK NEGERI 4 BANDAR LAMPUNG" readOnly={locked} />
            <TextField label="NPSN" value={s.kop?.npsn} onChange={(v) => updKop({ npsn: v })} importance="wajib" hint="Nomor Pokok Sekolah Nasional" readOnly={locked} />
            <TextField label="NSS" value={s.kop?.nss} onChange={(v) => updKop({ nss: v })} importance="wajib" readOnly={locked} />
          </>
        )}
      </PrefilledGroup>

      <FieldGroup title="Pejabat Sekolah">
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem' }}>
          Bagian ini harus kamu isi sendiri. Tanya ke guru pembimbing kalau tidak tahu. Gelar ditulis
          setelah nama di Halaman Pengesahan (contoh: S.Pd., M.M.)
        </p>
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField name="sekolah.kepala_sekolah.nama" label="Nama Kepala Sekolah" value={s.kepala_sekolah.nama} onChange={(v) => updPejabat('kepala_sekolah', { nama: v })} importance="wajib" placeholder="Contoh: Drs. H. Yulianto, M.Pd." />
          <TextField name="sekolah.kepala_sekolah.nip" label="NIP Kepala Sekolah" value={s.kepala_sekolah.nip} onChange={(v) => updPejabat('kepala_sekolah', { nip: v })} importance="wajib" placeholder="Contoh: 19680712 199403 1 005" />
          <TextField name="sekolah.kepala_sekolah.gelar" label="Gelar Kepala Sekolah" value={s.kepala_sekolah.gelar} onChange={(v) => updPejabat('kepala_sekolah', { gelar: v })} importance="wajib" placeholder="Contoh: M.Pd." />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField name="sekolah.waka_humas.nama" label="Nama Waka Humas" value={s.waka_humas.nama} onChange={(v) => updPejabat('waka_humas', { nama: v })} importance="wajib" placeholder="Contoh: Dra. Hj. Ratna, M.T." />
          <TextField name="sekolah.waka_humas.nip" label="NIP Waka Humas" value={s.waka_humas.nip} onChange={(v) => updPejabat('waka_humas', { nip: v })} importance="wajib" placeholder="Contoh: 19720515 199802 2 001" />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <TextField name="sekolah.ketua_kk.nama" label="Nama Ketua Jurusan" value={s.ketua_kk.nama} onChange={(v) => updPejabat('ketua_kk', { nama: v })} importance="wajib" placeholder="Contoh: Budi Santoso, S.Kom., M.T." />
          <TextField name="sekolah.ketua_kk.nip" label="NIP Ketua Jurusan" value={s.ketua_kk.nip} onChange={(v) => updPejabat('ketua_kk', { nip: v })} importance="wajib" placeholder="Contoh: 19800101 200501 1 003" />
        </div>

        <div>
          <TextField name="sekolah.pembimbing_sekolah.nama" label="Nama Pembimbing Sekolah" value={s.pembimbing_sekolah.nama} onChange={(v) => updPejabat('pembimbing_sekolah', { nama: v })} importance="wajib" placeholder="Contoh: Ahmad Rizki, S.Pd." />
          <TextField name="sekolah.pembimbing_sekolah.nip" label="NIP Pembimbing Sekolah" value={s.pembimbing_sekolah.nip} onChange={(v) => updPejabat('pembimbing_sekolah', { nip: v })} importance="wajib" placeholder="Contoh: 19850320 201001 1 008" />
        </div>
      </FieldGroup>
    </>
  )
}
