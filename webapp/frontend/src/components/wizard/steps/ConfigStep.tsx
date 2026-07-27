import type { PklContext, BabModule } from '@/types/pkl'
import { FieldGroup, NumberField, TextField } from '@/components/fields/FormFields'

const ALL_MODULES: { id: BabModule; label: string }[] = [
  { id: 'PENDAHULUAN', label: 'Pendahuluan' },
  { id: 'PROFIL_PERUSAHAAN', label: 'Profil Perusahaan' },
  { id: 'LANDASAN_TEORI', label: 'Landasan Teori' },
  { id: 'PELAKSANAAN', label: 'Pelaksanaan' },
  { id: 'PEMBAHASAN', label: 'Pembahasan' },
  { id: 'HAMBATAN', label: 'Hambatan' },
  { id: 'PENUTUP', label: 'Penutup' },
]

export default function ConfigStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const c = ctx.config
  const m = c.margin
  const toggleModule = (mod: BabModule) => {
    const has = c.bab_modules.includes(mod)
    set({
      config: {
        ...c,
        bab_modules: has ? c.bab_modules.filter((x) => x !== mod) : [...c.bab_modules, mod],
      },
    })
  }

  return (
    <>
      <h2>Pengaturan Dokumen</h2>
      <p className="muted">
        Aturan format default (Times New Roman 12pt, spasi 1.5, justify) sudah sesuai standar.
        Jumlah &amp; modul BAB bisa kamu sesuaikan di sini — sistem juga akan memberi rekomendasi otomatis.
      </p>

      <FieldGroup title="Modul BAB">
        <p className="muted" style={{ marginTop: 0 }}>
          Centang modul yang ingin dimasukkan. Rekomendasi otomatis muncul di langkah akhir.
        </p>
        <div className="checkbox-grid">
          {ALL_MODULES.map((mod) => (
            <label key={mod.id} className={`chip ${c.bab_modules.includes(mod.id) ? 'chip--on' : ''}`}>
              <input
                type="checkbox"
                checked={c.bab_modules.includes(mod.id)}
                onChange={() => toggleModule(mod.id)}
              />
              {mod.label}
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Margin (cm)">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button 
            type="button" 
            className="btn-sm btn-outline"
            onClick={() => set({ config: { ...c, margin: { atas: 4, bawah: 3, kiri: 4, kanan: 3 } } })}
          >
            Standar (4-4-3-3)
          </button>
          <button 
            type="button" 
            className="btn-sm btn-outline"
            onClick={() => set({ config: { ...c, margin: { atas: 3, bawah: 3, kiri: 4, kanan: 3 } } })}
          >
            Alternatif (3-3-4-3)
          </button>
          <button 
            type="button" 
            className="btn-sm btn-outline"
            onClick={() => set({ config: { ...c, margin: { atas: 3, bawah: 3, kiri: 3, kanan: 3 } } })}
          >
            Sama Rata (3-3-3-3)
          </button>
        </div>
        <NumberField label="Atas" value={m.atas} onChange={(v) => set({ config: { ...c, margin: { ...m, atas: v ?? 4 } } })} />
        <NumberField label="Bawah" value={m.bawah} onChange={(v) => set({ config: { ...c, margin: { ...m, bawah: v ?? 3 } } })} />
        <NumberField label="Kiri" value={m.kiri} onChange={(v) => set({ config: { ...c, margin: { ...m, kiri: v ?? 4 } } })} />
        <NumberField label="Kanan" value={m.kanan} onChange={(v) => set({ config: { ...c, margin: { ...m, kanan: v ?? 3 } } })} />
      </FieldGroup>

      <FieldGroup title="Tipografi">
        <TextField label="Font" value={c.font} onChange={(v) => set({ config: { ...c, font: v } })} />
        <NumberField label="Ukuran font (pt)" value={c.font_size} onChange={(v) => set({ config: { ...c, font_size: v ?? 12 } })} />
        <NumberField label="Spasi" value={c.spasi} onChange={(v) => set({ config: { ...c, spasi: v ?? 1.5 } })} />
      </FieldGroup>
    </>
  )
}
