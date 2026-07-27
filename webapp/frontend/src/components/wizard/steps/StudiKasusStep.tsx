import type { DataAngka, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

  const updAngka = (i: number, patch: Partial<DataAngka>) => {
    const next = [...sk.data_angka]
    next[i] = { ...next[i], ...patch }
    upd({ data_angka: next })
  }

  return (
    <>
      <h2>Studi Kasus / Analisis Teknis</h2>
      <p className="muted">
        Opsional. Ceritakan satu pekerjaan yang paling menarik/menantang selama PKL. Ini akan jadi bab pembahasan (analisis) di laporan kamu.
      </p>

      <FieldGroup title="Studi Kasus">
        <TextField label="Judul Studi Kasus" value={sk.judul} onChange={(v) => upd({ judul: v })} importance="opsional" hint="Contoh: Proses Instalasi Jaringan, atau Cara Perhitungan Diskon" />
        <TextareaField label="Latar Belakang / Masalah" value={sk.latar_belakang} onChange={(v) => upd({ latar_belakang: v })} importance="opsional" hint="Kenapa pekerjaan ini penting atau menarik?" />
        <TextareaField label="Proses / Cara Kerja" value={sk.proses_atau_formula} onChange={(v) => upd({ proses_atau_formula: v })} importance="opsional" hint="Langkah-langkah pengerjaannya secara urut" />
        <TextareaField label="Hasil / Kesimpulan" value={sk.hasil} onChange={(v) => upd({ hasil: v })} importance="opsional" hint="Bagaimana hasil akhirnya?" />
      </FieldGroup>

      <FieldGroup title="Data Angka">
        {sk.data_angka.map((d, i) => (
          <div key={i} className="array__row">
            <TextField label="" value={d.label} onChange={(v) => updAngka(i, { label: v })} placeholder="Total Angsuran" />
            <TextField label="" value={d.nilai} onChange={(v) => updAngka(i, { nilai: v })} placeholder="Rp 3.478.000" />
            <button type="button" className="btn-sm btn-danger array__remove" onClick={() => upd({ data_angka: sk.data_angka.filter((_, idx) => idx !== i) })}>✕</button>
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline array__add" onClick={() => upd({ data_angka: [...sk.data_angka, emptyDataAngka()] })}>+ Tambah Data Angka</button>
      </FieldGroup>

      <FieldGroup title="Assets terkait (Opsional)">
        <ImageArrayUploadField label="Upload Gambar Tambahan" items={sk.assets} onChange={(assets) => upd({ assets })} hint="Pilih gambar untuk melengkapi pembahasan (contoh: foto sebelum/sesudah perbaikan)." />
      </FieldGroup>
    </>
  )
}
