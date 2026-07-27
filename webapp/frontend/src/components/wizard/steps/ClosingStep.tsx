import type { PklContext, DaftarPustaka } from '@/types/pkl'
import { FieldGroup, TextField } from '@/components/fields/FormFields'

function DaftarPustakaTable({ items, onChange }: { items: DaftarPustaka[], onChange: (i: DaftarPustaka[]) => void }) {
  const update = (idx: number, patch: Partial<DaftarPustaka>) => {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }
  const add = () => onChange([...items, { penulis: '', judul: '', tahun: '', sumber: '', url: '' }])
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  return (
    <div className="table-container">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Penulis</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tahun</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Judul</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Penerbit/Sumber</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.5rem' }}>
                <input className="field__input" value={item.penulis} onChange={e => update(i, { penulis: e.target.value })} placeholder="Nama" />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <input className="field__input" value={item.tahun} onChange={e => update(i, { tahun: e.target.value })} placeholder="2024" />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <input className="field__input" value={item.judul} onChange={e => update(i, { judul: e.target.value })} placeholder="Judul Buku/Artikel" />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <input className="field__input" value={item.sumber} onChange={e => update(i, { sumber: e.target.value })} placeholder="Penerbit/Web" />
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                <button type="button" className="btn-sm btn-danger" onClick={() => remove(i)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={add}>+ Tambah Referensi</button>
    </div>
  )
}

export default function ClosingStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const kp = ctx.kata_pengantar
  const updKp = (patch: Partial<typeof kp>) => set({ kata_pengantar: { ...kp, ...patch } })

  return (
    <>
      <h2>Penutup & Referensi</h2>

      <FieldGroup title="Kata Pengantar">
        <div style={{ marginTop: '0.5rem' }}>
          <TextField label="Tempat Penulisan" value={kp.kota} onChange={(v) => updKp({ kota: v })} importance="wajib" placeholder="Bandar Lampung" hint="Untuk ttd Kata Pengantar" />
          <TextField label="Tanggal Penulisan" value={kp.tanggal} onChange={(v) => updKp({ tanggal: v })} importance="wajib" placeholder="Juli 2024" />
        </div>
      </FieldGroup>

      <FieldGroup title="Daftar Pustaka">
        {(() => {
          // Default aktif — draft lama tanpa field ini dianggap ON.
          const autoOn = ctx.config.auto_daftar_pustaka !== false
          const setAuto = (on: boolean) =>
            set({ config: { ...ctx.config, auto_daftar_pustaka: on } })

          return (
            <>
              <label className={`chip ${autoOn ? 'chip--on' : ''}`} style={{ marginBottom: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={autoOn}
                  onChange={e => setAuto(e.target.checked)}
                />
                Susun otomatis saat dokumen dibuat (AI)
              </label>

              {autoOn ? (
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Daftar pustaka akan disusun otomatis di akhir, dari sumber yang
                  memang ada di datamu: website perusahaan &amp; sekolah, ditambah
                  artikel/buku publik tentang PKL. Kalau kamu mengisi manual di
                  bawah (matikan dulu tombol ini), isianmu yang dipakai.
                </p>
              ) : (
                <>
                  <p className="muted" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                    Masukkan daftar referensi buku, panduan, atau website yang kamu gunakan.
                  </p>
                  <DaftarPustakaTable
                    items={ctx.daftar_pustaka || []}
                    onChange={(daftar_pustaka) => set({ daftar_pustaka })}
                  />
                </>
              )}
            </>
          )
        })()}
      </FieldGroup>
    </>
  )
}
