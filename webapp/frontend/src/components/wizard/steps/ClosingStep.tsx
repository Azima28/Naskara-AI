import type { PklContext, DaftarPustaka } from '@/types/pkl'
import { FieldGroup, TextField, TextareaField } from '@/components/fields/FormFields'

function DaftarPustakaTable({ items, onChange }: { items: DaftarPustaka[], onChange: (i: DaftarPustaka[]) => void }) {
  const update = (idx: number, patch: Partial<DaftarPustaka>) => {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }
  const add = () => onChange([...items, { penulis: '', judul: '', tahun: '', sumber: '', url: '' }])
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  return (
    <div style={{ marginTop: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
      <div className="table-scroll" style={{ width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
        <table className="simple-table" style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', boxSizing: 'border-box' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--line-strong, #b9b09c)' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem', width: '28%' }}>Penulis</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', width: '14%' }}>Tahun</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', width: '32%' }}>Judul</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', width: '22%' }}>Penerbit/Sumber</th>
              <th style={{ width: '4%', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--line, #ddd6c8)' }}>
                <td style={{ padding: '0.4rem' }}>
                  <input className="field__input" style={{ width: '100%', boxSizing: 'border-box' }} value={item.penulis} onChange={e => update(i, { penulis: e.target.value })} placeholder="Nama Penulis" />
                </td>
                <td style={{ padding: '0.4rem' }}>
                  <input className="field__input" style={{ width: '100%', boxSizing: 'border-box' }} value={item.tahun} onChange={e => update(i, { tahun: e.target.value })} placeholder="2026" />
                </td>
                <td style={{ padding: '0.4rem' }}>
                  <input className="field__input" style={{ width: '100%', boxSizing: 'border-box' }} value={item.judul} onChange={e => update(i, { judul: e.target.value })} placeholder="Judul Buku / Website" />
                </td>
                <td style={{ padding: '0.4rem' }}>
                  <input className="field__input" style={{ width: '100%', boxSizing: 'border-box' }} value={item.sumber} onChange={e => update(i, { sumber: e.target.value })} placeholder="Penerbit / URL" />
                </td>
                <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                  <button type="button" className="btn-sm btn-danger" onClick={() => remove(i)} title="Hapus referensi">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-sm btn-outline" style={{ marginTop: '0.75rem' }} onClick={add}>+ Tambah Referensi Manual</button>
    </div>
  )
}

export default function ClosingStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const kp = ctx.kata_pengantar
  const updKp = (patch: Partial<typeof kp>) => set({ kata_pengantar: { ...kp, ...patch } })

  return (
    <>
      <h2>Penutup, Kesimpulan &amp; Referensi</h2>

      <FieldGroup title="Kesimpulan &amp; Saran (BAB V)" full>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#166534' }}>
          <strong>💡 Tidak perlu menulis panjang.</strong> 1–3 kalimat sudah cukup. AI akan membantu mengembangkannya menjadi bagian laporan resmi.
        </div>

        <TextareaField
          name="kesimpulan_user"
          label="Apa yang kamu dapatkan setelah mengikuti PKL? (Kesimpulan)"
          value={ctx.kesimpulan_user || ''}
          onChange={(v) => set({ kesimpulan_user: v })}
          importance="wajib"
          placeholder="Contoh: Selama PKL saya belajar bekerja sama, lebih disiplin, dan memahami bagaimana pekerjaan dilakukan di dunia kerja nyata."
          rows={3}
        />
        <TextareaField
          name="saran_user"
          label="Apa yang ingin kamu sarankan untuk sekolah atau perusahaan? (Saran)"
          value={ctx.saran_user || ''}
          onChange={(v) => set({ saran_user: v })}
          importance="wajib"
          placeholder="Contoh: Sekolah dapat menambah kegiatan praktik agar siswa lebih siap menghadapi dunia kerja."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup title="Kata Pengantar">
        <div style={{ marginTop: '0.5rem' }}>
          <TextField name="kata_pengantar.kota" label="Tempat Penulisan" value={kp.kota} onChange={(v) => updKp({ kota: v })} importance="wajib" placeholder="Bandar Lampung" hint="Untuk ttd Kata Pengantar" />
          <TextField name="kata_pengantar.tanggal" label="Tanggal Penulisan" value={kp.tanggal} onChange={(v) => updKp({ tanggal: v })} importance="wajib" placeholder="Juli 2026" />
        </div>
      </FieldGroup>

      <FieldGroup title="Daftar Pustaka" full>
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
