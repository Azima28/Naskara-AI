import type { Pkl, PklContext } from '@/types/pkl'
import { FieldGroup, NumberField, TextField } from '@/components/fields/FormFields'

export default function PklStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const p = ctx.pkl
  const upd = (patch: Partial<Pkl>) => set({ pkl: { ...p, ...patch } })

  const calcDates = (mulai: string, selesai: string) => {
    let patch: Partial<Pkl> = {}
    if (mulai && selesai) {
      const d1 = new Date(mulai)
      const d2 = new Date(selesai)
      let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
      if (months <= 0) months = 1
      patch.durasi_bulan = months
    }
    if (mulai) {
      const d1 = new Date(mulai)
      const year = d1.getFullYear()
      const month = d1.getMonth()
      if (month < 6) {
        patch.tahun_ajaran = `${year - 1}/${year}`
      } else {
        patch.tahun_ajaran = `${year}/${year + 1}`
      }
    }
    return patch
  }

  return (
    <>
      <h2>Periode PKL</h2>
      <p className="muted">Tanggal mulai &amp; selesai wajib diisi (untuk BAB I).</p>

      <FieldGroup title="Waktu Pelaksanaan">
        <TextField name="pkl.tanggal_mulai" label="Tanggal Mulai" value={p.tanggal_mulai} onChange={(v) => upd({ tanggal_mulai: v, ...calcDates(v, p.tanggal_selesai) })} importance="wajib" type="date" />
        <TextField name="pkl.tanggal_selesai" label="Tanggal Selesai" value={p.tanggal_selesai} onChange={(v) => upd({ tanggal_selesai: v, ...calcDates(p.tanggal_mulai, v) })} importance="wajib" type="date" />
        <NumberField name="pkl.durasi_bulan" label="Durasi (bulan)" value={p.durasi_bulan} onChange={(v) => upd({ durasi_bulan: v })} importance="opsional" hint="Dihitung sendiri setelah kamu mengisi kedua tanggal di atas." readOnly />
        <NumberField name="pkl.jam_pelajaran" label="Jam Pelajaran" value={p.jam_pelajaran} onChange={(v) => upd({ jam_pelajaran: v })} importance="wajib" />
      </FieldGroup>

      <FieldGroup title="Penempatan">
        <TextField label="Bagian / Divisi" value={p.bagian_ditempatkan} onChange={(v) => upd({ bagian_ditempatkan: v })} importance="wajib" hint="Misal: Divisi IT, Bagian Keuangan. Kosongkan jika pindah-pindah divisi." />
        <TextField label="Tahun Ajaran" value={p.tahun_ajaran} onChange={(v) => upd({ tahun_ajaran: v })} importance="opsional" hint="Dihitung sendiri dari tanggal mulai." readOnly />
      </FieldGroup>
    </>
  )
}
