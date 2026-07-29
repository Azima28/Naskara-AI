import type { PembimbingIndustri, Perusahaan, PklContext } from '@/types/pkl'
import { emptyPembimbingIndustri } from '@/types/pkl'
import { FieldGroup, ImportanceLegend, TextField, SelectField } from '@/components/fields/FormFields'

export default function PerusahaanStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const p = ctx.perusahaan
  const upd = (patch: Partial<Perusahaan>) => set({ perusahaan: { ...p, ...patch } })
  const updPejabat = (key: 'pimpinan' | 'hrd' | 'pembimbing_industri', patch: any) => upd({ [key]: { ...p[key], ...patch } })
  // Draft lama mungkin belum punya field pembimbing II — isi default dulu.
  const updPembimbing2 = (patch: Partial<PembimbingIndustri>) => upd({
    pembimbing_industri_2: { ...emptyPembimbingIndustri(), ...p.pembimbing_industri_2, ...patch },
  })

  return (
    <>
      <h2>Data Instansi / Perusahaan</h2>
      <p className="muted">Tempat kamu PKL. Kalau ada yang tidak tahu, tanyakan ke pembimbing industrimu.</p>

      <ImportanceLegend />

      <FieldGroup title="Identitas Perusahaan">
        <TextField name="perusahaan.nama" label="Nama Perusahaan" value={p.nama} onChange={(v) => upd({ nama: v })} importance="wajib" placeholder="PT Bank Lampung" hint="Nama panggilan/singkat yang akan sering disebut di laporan" />
        <TextField name="perusahaan.nama_lengkap" label="Nama Lengkap" value={p.nama_lengkap} onChange={(v) => upd({ nama_lengkap: v })} importance="wajib" placeholder="PT Bank Pembangunan Daerah Lampung" />
        <TextField name="perusahaan.alamat" label="Alamat" value={p.alamat} onChange={(v) => upd({ alamat: v })} importance="wajib" />
        <TextField name="perusahaan.bidang_usaha" label="Bidang Usaha" value={p.bidang_usaha} onChange={(v) => upd({ bidang_usaha: v })} importance="wajib" hint="Contoh: Jasa Keuangan, Otomotif, dll" />
        <SelectField
          name="perusahaan.status"
          label="Status"
          value={p.status}
          onChange={(v) => upd({ status: v })}
          importance="wajib"
          hint="Misal: PMDN, PMA, BUMN, Swasta"
          options={[
            { label: 'Swasta', value: 'Swasta' },
            { label: 'BUMN', value: 'BUMN' },
            { label: 'BUMD', value: 'BUMD' },
            { label: 'PMDN', value: 'PMDN' },
            { label: 'PMA', value: 'PMA' },
            { label: 'Instansi Pemerintah', value: 'Instansi Pemerintah' },
            { label: 'Lainnya', value: 'Lainnya' },
          ]}
        />
        <TextField name="perusahaan.no_telp" label="No. Telp" value={p.no_telp} onChange={(v) => upd({ no_telp: v })} importance="wajib" />
        <TextField name="perusahaan.fax" label="Fax" value={p.fax} onChange={(v) => upd({ fax: v })} importance="opsional" hint="Kosongkan jika tidak ada" />
        <TextField name="perusahaan.email" label="Email" value={p.email} onChange={(v) => upd({ email: v })} importance="wajib" type="email" />
        <TextField name="perusahaan.website" label="Website" value={p.website} onChange={(v) => upd({ website: v })} importance="wajib" />
      </FieldGroup>

      <FieldGroup title="Pimpinan / Kepala Cabang">
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem' }}>
          Pejabat tertinggi di tempat PKL yang akan menandatangani laporan.
        </p>
        <TextField name="perusahaan.pimpinan.nama" label="Nama Pimpinan" value={p.pimpinan.nama} onChange={(v) => updPejabat('pimpinan', { nama: v })} importance="wajib" />
        <TextField name="perusahaan.pimpinan.jabatan" label="Jabatan" value={p.pimpinan.jabatan} onChange={(v) => updPejabat('pimpinan', { jabatan: v })} importance="wajib" placeholder="Kepala Cabang / Direktur" />
      </FieldGroup>

      <FieldGroup title="Pembimbing Industri">
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem' }}>
          Orang yang membimbing kamu sehari-hari selama PKL.
        </p>
        <TextField name="perusahaan.pembimbing_industri.nama" label="Nama Pembimbing" value={p.pembimbing_industri.nama} onChange={(v) => updPejabat('pembimbing_industri', { nama: v })} importance="wajib" />
        <TextField label="Jabatan" value={p.pembimbing_industri.jabatan} onChange={(v) => updPejabat('pembimbing_industri', { jabatan: v })} importance="wajib" />
        <TextField label="No. Telp" value={p.pembimbing_industri.telp} onChange={(v) => updPejabat('pembimbing_industri', { telp: v })} importance="wajib" />
        <TextField label="Email" value={p.pembimbing_industri.email} onChange={(v) => updPejabat('pembimbing_industri', { email: v })} importance="wajib" type="email" />
      </FieldGroup>

      <FieldGroup title="Pembimbing Industri II (Opsional)">
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem' }}>
          Isi hanya jika pembimbingmu dua orang — halaman pengesahan akan
          menampilkan kolom Pembimbing I &amp; II berdampingan. Kosongkan jika satu.
        </p>
        <TextField
          label="Nama Pembimbing II"
          value={p.pembimbing_industri_2?.nama || ''}
          onChange={(v) => updPembimbing2({ nama: v })}
          importance="opsional"
        />
        <TextField
          label="Jabatan"
          value={p.pembimbing_industri_2?.jabatan || ''}
          onChange={(v) => updPembimbing2({ jabatan: v })}
          importance="opsional"
        />
      </FieldGroup>

      <FieldGroup title="HRD / Personalia (Opsional)">
        <TextField label="Nama HRD" value={p.hrd.nama} onChange={(v) => updPejabat('hrd', { nama: v })} importance="opsional" />
        <TextField label="No. Telp" value={p.hrd.telp} onChange={(v) => updPejabat('hrd', { telp: v })} importance="opsional" />
      </FieldGroup>
    </>
  )
}
