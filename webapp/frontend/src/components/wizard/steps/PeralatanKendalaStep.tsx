import type { Kendala, PklContext, Peralatan } from '@/types/pkl'
import { emptyKendala, emptyPeralatan } from '@/types/pkl'
import { FieldGroup, StringArrayField, TextareaField, TextField } from '@/components/fields/FormFields'

export default function PeralatanKendalaStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const peralatan = ctx.peralatan
  const kendala = ctx.kendala

  const updPeralatan = (i: number, patch: Partial<Peralatan>) => {
    const next = [...peralatan]
    next[i] = { ...next[i], ...patch }
    set({ peralatan: next })
  }
  const addPeralatan = () => set({ peralatan: [...peralatan, emptyPeralatan()] })
  const removePeralatan = (i: number) => set({ peralatan: peralatan.filter((_, idx) => idx !== i) })

  const updKendala = (i: number, patch: Partial<Kendala>) => {
    const next = [...kendala]
    next[i] = { ...next[i], ...patch }
    set({ kendala: next })
  }
  const addKendala = () => set({ kendala: [...kendala, emptyKendala()] })
  const removeKendala = (i: number) => set({ kendala: kendala.filter((_, idx) => idx !== i) })

  return (
    <>
      <h2>Peralatan &amp; Kendala</h2>

      <FieldGroup title="Peralatan yang Digunakan">
        {peralatan.map((p, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card__head">
              <strong>{p.nama || `Peralatan ${i + 1}`}</strong>
              <button type="button" className="btn-sm btn-danger" onClick={() => removePeralatan(i)}>✕</button>
            </div>
            <TextField label="Nama Peralatan" value={p.nama} onChange={(v) => updPeralatan(i, { nama: v })} placeholder="Printer" />
            <TextareaField label="Deskripsi" value={p.deskripsi} onChange={(v) => updPeralatan(i, { deskripsi: v })} rows={2} />
            <TextField label="Nama File Gambar" value={p.gambar} onChange={(v) => updPeralatan(i, { gambar: v })} placeholder="printer.jpg" />
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addPeralatan}>+ Tambah Peralatan</button>
      </FieldGroup>

      <FieldGroup title="Kendala &amp; Solusi">
        <p className="muted" style={{ marginTop: 0 }}>Minimal 1 kendala direkomendasikan.</p>
        {kendala.map((k, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card__head">
              <strong>{k.masalah || `Kendala ${i + 1}`}</strong>
              <button type="button" className="btn-sm btn-danger" onClick={() => removeKendala(i)}>✕</button>
            </div>
            <TextareaField label="Masalah" value={k.masalah} onChange={(v) => updKendala(i, { masalah: v })} rows={2} />
            <TextareaField label="Solusi" value={k.solusi} onChange={(v) => updKendala(i, { solusi: v })} rows={2} />
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addKendala}>+ Tambah Kendala Lain</button>
      </FieldGroup>

      <FieldGroup title="Pelajaran">
        <StringArrayField label="Yang Dipelajari" items={ctx.pelajaran} onChange={(pelajaran) => set({ pelajaran })} addLabel="+ Tambah Pelajaran" placeholder="Pentingnya kedisiplinan..." />
      </FieldGroup>

      <FieldGroup title="Refleksi">
        <TextareaField label="Refleksi Diri" value={ctx.refleksi} onChange={(v) => set({ refleksi: v })} rows={4} />
      </FieldGroup>
    </>
  )
}
