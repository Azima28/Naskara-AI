import type { PklContext, BabModule } from '@/types/pkl'
import { FieldGroup, NumberField, TextField } from '@/components/fields/FormFields'

// Modul BAB yang bisa dipilih user.
// Sesuai Panduan Resmi SMKN4 TP 2026-2027: 6 BAB.
// Profil Perusahaan (Sejarah, Visi-Misi, Tata Tertib, Struktur, Job Desc)
// sudah otomatis masuk sebagai sub-bab 1.3-1.6 di BAB I PENDAHULUAN.
const ALL_MODULES: { id: BabModule; label: string; desc?: string }[] = [
  { id: 'PENDAHULUAN', label: 'BAB I — Pendahuluan', desc: 'Latar Belakang, Tujuan, Sejarah & Profil Perusahaan' },
  { id: 'PELAKSANAAN', label: 'BAB II — Kegiatan di Industri', desc: 'Proses kegiatan per seksi/divisi' },
  { id: 'LANDASAN_TEORI', label: 'BAB III — Tinjauan Pustaka', desc: 'Landasan Teori, Asas PKL, Sejarah SMKN4' },
  { id: 'DATA_PENGAMATAN', label: 'BAB IV — Data Pengamatan', desc: 'Detail kegiatan & Peralatan' },
  { id: 'PEMBAHASAN', label: 'BAB V — Pembahasan', desc: 'Hambatan, Solusi, Pembelajaran' },
  { id: 'PENUTUP', label: 'BAB VI — Kesimpulan & Saran', desc: 'Kesimpulan dan saran' },
]

export default function ConfigStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const c = ctx.config
  const m = c.margin
  const isCustom = c.preset === 'custom'

  const toggleModule = (mod: BabModule) => {
    const has = c.bab_modules.includes(mod)
    set({
      config: {
        ...c,
        bab_modules: has ? c.bab_modules.filter((x) => x !== mod) : [...c.bab_modules, mod],
      },
    })
  }

  const updCfg = (patch: Partial<typeof c>) => set({ config: { ...c, ...patch } })

  return (
    <>
      <h2>Pengaturan Dokumen &amp; Penomoran Halaman</h2>
      <p className="muted">
        Pilih preset format resmi atau atur nomor halaman (Cover, Halaman Depan, &amp; BAB) sesuai kebutuhanmu.
      </p>

      <FieldGroup title="Mode Format Dokumen">
        <div className="grid-2-col" style={{ marginBottom: '1rem' }}>
          <div
            onClick={() => updCfg({ preset: 'pedoman', cover_page_number: 'none', front_matter_format: 'lowerRoman', front_matter_start: 2, body_matter_format: 'arabic', body_matter_start: 1 })}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: !isCustom ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: !isCustom ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', color: !isCustom ? '#1d4ed8' : '#111827' }}>
              🎯 Format Resmi SMKN 4 2026/2027 (Rekomendasi)
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              • Cover: <b>Tanpa Nomor</b><br />
              • Pengesahan s/d Daftar Isi: <b>Romawi (ii, iii, iv...)</b><br />
              • BAB I s/d Akhir: <b>Angka Arab (1, 2, 3...)</b><br />
              • Auto-TOC 100% Terkunci Otomatis
            </p>
          </div>

          <div
            onClick={() => updCfg({ preset: 'custom' })}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: isCustom ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: isCustom ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', color: isCustom ? '#1d4ed8' : '#111827' }}>
              🎛️ Format Kustom / Bebas
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              Bebas mengatur format nomor halaman Cover, Halaman Depan, dan BAB I mengikut kebutuhan sekolah/kampus lain.
            </p>
          </div>
        </div>
      </FieldGroup>

      {isCustom && (
        <FieldGroup title="Pengaturan Penomoran Halaman Kustom">
          <div className="grid-2-col">
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Nomor Halaman Cover
              </label>
              <select
                className="input-field"
                value={c.cover_page_number || 'none'}
                onChange={(e) => updCfg({ cover_page_number: e.target.value as any })}
              >
                <option value="none">Tanpa Nomor Halaman (Default)</option>
                <option value="lowerRoman">Romawi Kecil (i)</option>
                <option value="arabic">Angka Arab (1)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Format Halaman Depan (Pengesahan - Daftar Isi)
              </label>
              <select
                className="input-field"
                value={c.front_matter_format || 'lowerRoman'}
                onChange={(e) => updCfg({ front_matter_format: e.target.value as any })}
              >
                <option value="lowerRoman">Romawi Kecil (i, ii, iii...)</option>
                <option value="arabic">Angka Arab (1, 2, 3...)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Nomor Awal Halaman Pengesahan Industri
              </label>
              <select
                className="input-field"
                value={c.front_matter_start ?? 2}
                onChange={(e) => updCfg({ front_matter_start: parseInt(e.target.value) })}
              >
                <option value={2}>Mulai dari ii (Opsi B - Cover Dalam dihitung)</option>
                <option value={1}>Mulai dari i (Opsi A - Cover tidak dihitung)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Format &amp; Nomor Awal BAB I
              </label>
              <select
                className="input-field"
                value={c.body_matter_start ?? 1}
                onChange={(e) => updCfg({ body_matter_start: parseInt(e.target.value) })}
              >
                <option value={1}>Mulai dari Angka 1 (Default)</option>
                <option value={0}>Lanjutkan dari Nomor Halaman Depan</option>
              </select>
            </div>
          </div>
        </FieldGroup>
      )}

      <FieldGroup title="Modul BAB (Panduan Resmi SMKN4 — 6 BAB)">
        <p className="muted" style={{ marginTop: 0 }}>
          Struktur laporan sesuai Panduan Resmi SMKN4 TP 2026-2027. Profil Perusahaan otomatis masuk sebagai sub-bab 1.3-1.6 di BAB I.
        </p>
        <div className="checkbox-grid">
          {ALL_MODULES.map((mod) => (
            <label key={mod.id} className={`chip ${c.bab_modules.includes(mod.id) ? 'chip--on' : ''}`}>
              <input
                type="checkbox"
                checked={c.bab_modules.includes(mod.id)}
                onChange={() => toggleModule(mod.id)}
              />
              <span>
                <strong>{mod.label}</strong>
                {mod.desc && <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.7 }}>{mod.desc}</span>}
              </span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Margin (cm)">
        <div className="btn-group-responsive" style={{ marginBottom: '1rem' }}>
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
