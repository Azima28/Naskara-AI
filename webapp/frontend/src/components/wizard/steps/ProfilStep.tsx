import { useState } from 'react'
import type {
  AreaCabang, CabangPerusahaan, JamKerja, JobDescription,
  PklContext, ProfilPerusahaan
} from '@/types/pkl'
import {
  emptyAreaCabang, emptyCabangPerusahaan, emptyJamKerja, emptyJobDescription
} from '@/types/pkl'
import {
  FieldGroup, ImportanceLegend, StringArrayField, TextareaField, TextField, ImageUploadField
} from '@/components/fields/FormFields'

// ─── Konstanta pilihan jam ─────────────────────────────────────────────────── //
const JAM_OPTIONS = [
  '07.00', '07.30', '08.00', '08.30', '09.00', '09.30', '10.00', '10.30',
  '11.00', '11.30', '12.00', '12.30', '13.00', '13.30', '14.00', '14.30',
  '15.00', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00',
]

// ─── Jadwal Jam Kerja: editor slot per hari, langsung di tabel laporan ────── //
const DAY_ORDER = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU']

/** Satu slot jadwal dalam sehari. TUTUP hanya punya jam mulai. */
interface Slot {
  mulai: string
  selesai: string
  label: string
}

const toMin = (t: string): number => {
  const m = (t || '').trim().match(/^(\d{1,2})[.:](\d{2})$/)
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : NaN
}

/** Baca slot dari data tersimpan (jam & keterangan multi-baris). */
function parseSlots(j: JamKerja): Slot[] {
  const jamLines = (j.jam || '').split('\n').map(x => x.trim()).filter(Boolean)
  const ketLines = (j.keterangan || '').split('\n').map(x => x.trim())
  if (jamLines.length) {
    return jamLines.map((line, k) => {
      const range = line.match(/(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})/)
      // Label kosong dibiarkan kosong (round-trip dengan placeholder);
      // baris satu-waktu tanpa label diasumsikan TUTUP.
      const label = ketLines[k] || (range ? '' : 'TUTUP')
      if (range) return { mulai: range[1], selesai: range[2], label }
      const single = line.match(/^(\d{1,2}[.:]\d{2})$/)
      return { mulai: single ? single[1] : '', selesai: '', label }
    })
  }
  // Kompatibilitas data lama (jam_mulai/jam_selesai terpisah)
  if (j.jam_mulai || j.jam_selesai) {
    return [{ mulai: j.jam_mulai, selesai: j.jam_selesai, label: 'OPERASIONAL' }]
  }
  return []
}

/** Simpan slot kembali ke format jam & keterangan multi-baris. */
function serializeSlots(slots: Slot[]): { jam: string; keterangan: string } {
  return {
    jam: slots.map(s => (s.label === 'TUTUP' || !s.selesai ? s.mulai : `${s.mulai} - ${s.selesai}`)).join('\n'),
    keterangan: slots.map(s => s.label).join('\n'),
  }
}

/** Rentang menit yang sudah terpakai slot lain (untuk deteksi bentrok). */
function occupiedRanges(slots: Slot[], skipIdx: number): Array<[number, number]> {
  return slots
    .filter((s, i) => i !== skipIdx && s.label !== 'TUTUP' && s.mulai && s.selesai)
    .map(s => [toMin(s.mulai), toMin(s.selesai)] as [number, number])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b))
}

/** Jam mulai tidak boleh jatuh DI DALAM slot lain. */
function startDisabled(t: string, ranges: Array<[number, number]>): boolean {
  const v = toMin(t)
  return ranges.some(([a, b]) => v >= a && v < b)
}

/** Jam selesai harus > mulai dan rentangnya tidak boleh menabrak slot lain. */
function endDisabled(t: string, mulai: string, ranges: Array<[number, number]>): boolean {
  const v = toMin(t)
  const m = toMin(mulai)
  if (isNaN(m)) return false
  if (v <= m) return true
  return ranges.some(([a, b]) => a < v && b > m)
}

// ─── Sub-komponen: Area & Cabang ──────────────────────────────────────────── //
function AreaCabangCard({
  area, idx, onChange, onRemove, totalAreas,
}: {
  area: AreaCabang; idx: number
  onChange: (patch: Partial<AreaCabang>) => void
  onRemove: () => void
  totalAreas: number
}) {
  const updateCabang = (ci: number, patch: Partial<CabangPerusahaan>) => {
    const next = [...area.cabang]
    next[ci] = { ...next[ci], ...patch }
    onChange({ cabang: next })
  }
  const addCabang = () => onChange({ cabang: [...area.cabang, emptyCabangPerusahaan()] })
  const removeCabang = (ci: number) => onChange({ cabang: area.cabang.filter((_, i) => i !== ci) })

  return (
    <div className="nested-card" style={{ marginBottom: '1rem' }}>
      <div className="nested-card__head">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, flexWrap: 'wrap', width: '100%' }}>
          <strong style={{ minWidth: 60 }}>Area {idx + 1}</strong>
          <input
            type="text"
            className="field__input"
            value={area.nama_area}
            placeholder="Nama area (opsional, cth: Area I, Area Sumatera)"
            onChange={e => onChange({ nama_area: e.target.value })}
            style={{ flex: 1, minWidth: '180px' }}
          />
        </div>
        {totalAreas > 1 && (
          <button type="button" className="btn-sm btn-danger" onClick={onRemove}>✕ Hapus Area</button>
        )}
      </div>

      <div style={{ paddingTop: '0.5rem' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
          Daftar Cabang <span style={{ color: '#ef4444' }}>*</span>
          <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>
            (min. 1 — termasuk cabang tempat PKL)
          </span>
        </label>
        {area.cabang.map((cb, ci) => (
          <div key={ci} className="array__row" style={{ marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0, width: '100%' }}>
              <span style={{ minWidth: 18, color: '#6b7280', fontSize: '0.85rem', flexShrink: 0 }}>{ci + 1}.</span>
              <input
                type="text"
                className="field__input"
                value={cb.nama}
                placeholder="cth: PT Reksa Finance Cabang Lampung"
                onChange={e => updateCabang(ci, { nama: e.target.value })}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            {area.cabang.length > 1 && (
              <button type="button" className="btn-sm btn-danger array__remove" onClick={() => removeCabang(ci)}>✕ Hapus</button>
            )}
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addCabang} style={{ marginTop: '0.25rem' }}>
          + Tambah Cabang
        </button>
      </div>
    </div>
  )
}

// ─── Sub-komponen: Job Description Row ───────────────────────────────────── //
function JobDescCard({
  job, idx, onChange, onRemove,
}: {
  job: JobDescription; idx: number
  onChange: (patch: Partial<JobDescription>) => void
  onRemove: () => void
}) {
  const [showContoh, setShowContoh] = useState(false)

  return (
    <div className="nested-card" style={{ marginBottom: '1rem' }}>
      <div className="nested-card__head">
        <strong>{job.posisi || `Jabatan ${idx + 1}`}</strong>
        <button type="button" className="btn-sm btn-danger" onClick={onRemove}>✕</button>
      </div>

      <TextField
        label="Nama Jabatan/Posisi"
        value={job.posisi}
        onChange={v => onChange({ posisi: v })}
        placeholder="cth: Kasir, Branch Manager, Admin Credit, Office Boy"
        importance="wajib"
      />

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
            Tugas-tugas <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowContoh(v => !v)}
            style={{ fontSize: '0.75rem', color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showContoh ? '↑ Sembunyikan contoh' : 'Lihat contoh'}
          </button>
        </div>

        {showContoh && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#166534' }}>
            <strong>Contoh tugas Kasir:</strong>
            <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem' }}>
              <li>Menerima dan mencatat pembayaran angsuran customer secara tunai</li>
              <li>Melakukan cash opname setiap hari kerja</li>
              <li>Menyetorkan uang angsuran ke bank setiap hari kerja</li>
              <li>Bertanggung jawab atas dokumen kasir (bon, invoice customer)</li>
            </ul>
          </div>
        )}

        <StringArrayField
          label=""
          items={job.tugas}
          onChange={tugas => onChange({ tugas })}
          addLabel="+ Tambah Tugas"
          placeholder="cth: Menerima pembayaran angsuran customer"
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────── //
export default function ProfilStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const pr = ctx.profil_perusahaan
  const [showContohCabang, setShowContohCabang] = useState(false)
  const [showContohTataTertib, setShowContohTataTertib] = useState(false)

  const upd = (patch: Partial<ProfilPerusahaan>) =>
    set({ profil_perusahaan: { ...pr, ...patch } })

  // ── Jam Kerja ─────────────────────────────────────────────────────────── //
  const updJam = (i: number, patch: Partial<JamKerja>) => {
    const next = [...pr.jam_kerja]
    next[i] = { ...next[i], ...patch }
    upd({ jam_kerja: next })
  }
  /** Tambah hari baru: otomatis pilih hari pertama yang belum dipakai dan
   *  menyalin susunan slot dari hari sebelumnya (biasanya jadwalnya sama). */
  const addJam = () => {
    const used = new Set(pr.jam_kerja.map(j => (j.hari || '').toUpperCase()))
    const nextDay = DAY_ORDER.find(d => !used.has(d)) || ''
    const prev = pr.jam_kerja[pr.jam_kerja.length - 1]
    upd({
      jam_kerja: [...pr.jam_kerja, {
        ...emptyJamKerja(),
        hari: nextDay,
        jam: prev?.jam || '',
        keterangan: prev?.keterangan || '',
      }],
    })
  }
  const removeJam = (i: number) => upd({ jam_kerja: pr.jam_kerja.filter((_, idx) => idx !== i) })

  /** Ubah susunan slot sebuah hari lalu simpan sebagai jam/keterangan. */
  const setSlots = (i: number, slots: Slot[]) => updJam(i, serializeSlots(slots))

  // ── Area Cabang ───────────────────────────────────────────────────────── //
  const updArea = (i: number, patch: Partial<AreaCabang>) => {
    const next = [...pr.area_cabang]
    next[i] = { ...next[i], ...patch }
    upd({ area_cabang: next })
  }
  const addArea = () => upd({ area_cabang: [...pr.area_cabang, emptyAreaCabang()] })
  const removeArea = (i: number) => upd({ area_cabang: pr.area_cabang.filter((_, idx) => idx !== i) })

  // ── Job Descriptions ──────────────────────────────────────────────────── //
  const updJob = (i: number, patch: Partial<JobDescription>) => {
    const next = [...pr.job_descriptions]
    next[i] = { ...next[i], ...patch }
    upd({ job_descriptions: next })
  }
  const addJob = () => upd({ job_descriptions: [...pr.job_descriptions, emptyJobDescription()] })
  const removeJob = (i: number) => upd({ job_descriptions: pr.job_descriptions.filter((_, idx) => idx !== i) })

  return (
    <>
      <h2>Profil Perusahaan <span style={{ fontSize: '0.7em', fontWeight: 400, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, marginLeft: 6 }}>BAB II</span></h2>
      <p className="muted">
        Informasi detail tentang perusahaan tempat kamu PKL. Sesuai aturan resmi SMKN4,
        bagian ini menjadi <strong>BAB II Profil Perusahaan</strong> tersendiri (bukan lagi bagian dari BAB I).
        Isi sebanyak yang kamu tahu — semakin lengkap semakin baik, tapi semua opsional kecuali yang wajib.
      </p>

      <ImportanceLegend />

      {/* ── Logo Perusahaan ──────────────────────────────────────────────── */}
      <FieldGroup title="Logo Perusahaan">
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Logo perusahaan akan muncul di laporan. Jika tidak ada, bisa dikosongkan.
        </p>
        <ImageUploadField
          label="Logo Perusahaan"
          value={pr.logo_perusahaan}
          onChange={v => upd({ logo_perusahaan: v })}
          importance="opsional"
          hint="Format JPG/PNG. Cari logo di website resmi perusahaan atau minta ke HRD."
        />
      </FieldGroup>

      {/* ── Sejarah, Visi, Misi ──────────────────────────────────────────── */}
      <FieldGroup title="Sejarah & Visi Misi">
        <TextareaField
          label="Sejarah Singkat Perusahaan"
          value={pr.sejarah}
          onChange={v => upd({ sejarah: v })}
          importance="wajib"
          hint="Kapan perusahaan didirikan? Bagaimana berkembangnya? 2-3 paragraf."
          placeholder="cth: PT Reksa Finance didirikan pada tanggal 24 Oktober 1984 dengan nama PT Reksa Semesta Leasing. Pada tahun 2006 berganti nama menjadi PT Reksa Finance..."
        />
        <TextareaField
          label="Visi"
          value={pr.visi}
          onChange={v => upd({ visi: v })}
          importance="wajib"
          hint="Cita-cita jangka panjang perusahaan. Biasanya satu kalimat, ada di website atau dipajang di dinding kantor."
          placeholder="cth: Menjadi perusahaan pembiayaan yang memiliki kualifikasi aset terbaik..."
        />

        <StringArrayField
          label="Misi"
          items={pr.misi}
          onChange={v => upd({ misi: v })}
          importance="wajib"
          itemNoun="misi"
          addLabel="+ Tambah poin misi"
          hint="Langkah-langkah nyata untuk mencapai visi. Tambahkan satu poin per baris — biasanya ada 3–5 poin."
          placeholder="cth: Berkontribusi positif terhadap pasar pembiayaan"
        />
      </FieldGroup>

      {/* ── Profil Lokasi (Alamat + Head Office + Cabang) ────────────────── */}
      <FieldGroup title="Profil Lokasi PKL" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Alamat tempat kamu PKL sudah diisi di langkah Perusahaan. Di sini isi alamat kantor pusat dan daftar cabang
          (minimal 1 cabang).
        </p>

        <TextField
          label="Alamat Kantor Pusat"
          value={pr.head_office}
          onChange={v => upd({ head_office: v })}
          importance="opsional"
          hint="Kantor utama perusahaan, bisa beda kota dengan tempat kamu PKL. Kosongkan jika perusahaan hanya punya satu kantor."
          placeholder="cth: Jalan Tentara Pelajar Blok B No. 3&5 (Rukan Permata Senayan), Kebayoran Lama, Jakarta Selatan 12210"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem' }}>
          <div>
            <strong style={{ fontSize: '0.9rem' }}>Daftar Cabang Perusahaan</strong>
            <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: 8 }}>
              (wajib min. 1 cabang)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowContohCabang(v => !v)}
            style={{ fontSize: '0.75rem', color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showContohCabang ? '↑ Sembunyikan contoh' : 'Lihat contoh'}
          </button>
        </div>

        {showContohCabang && (
          <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#1e40af' }}>
            <strong>Contoh perusahaan besar (banyak cabang):</strong>
            <div style={{ marginTop: '0.4rem' }}>
              <em>Area I:</em> PT Reksa Finance Cabang Pangkal Pinang, PT Reksa Finance Cabang Tangerang<br />
              <em>Area II:</em> PT Reksa Finance Cabang Lampung, PT Reksa Finance Cabang Palembang
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Contoh perusahaan kecil (1 cabang tanpa area):</strong><br />
              <em>Area (kosongkan):</em> Apotek Sehat Farma Bandar Lampung
            </div>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#1d4ed8' }}>
              Jika perusahaan tidak punya area, biarkan nama area kosong dan isi saja daftar cabangnya.
            </p>
          </div>
        )}

        {pr.area_cabang.length === 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#92400e' }}>
            Belum ada cabang. Klik tombol di bawah untuk menambah minimal 1 cabang.
          </div>
        )}

        {pr.area_cabang.map((area, i) => (
          <AreaCabangCard
            key={i}
            area={area}
            idx={i}
            onChange={patch => updArea(i, patch)}
            onRemove={() => removeArea(i)}
            totalAreas={pr.area_cabang.length}
          />
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addArea}>
          + Tambah Area / Kelompok Cabang
        </button>
      </FieldGroup>

      {/* ── Tata Tertib ──────────────────────────────────────────────────── */}
      <FieldGroup title="Tata Tertib Perusahaan" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Isi tata tertib <strong>khusus dari perusahaanmu</strong> — aturan unik yang tidak ada di sekolah.
          AI akan membantu merapikan bahasanya saat kamu download laporan.
        </p>

        {/* Info: 8 poin SMKN4 otomatis */}
        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.83rem', color: '#1e40af' }}>
          <strong>ℹ️ Sudah termasuk otomatis:</strong> 8 aturan resmi SMKN 4 Bandar Lampung selalu muncul di laporan
          (mematuhi aturan industri, menggunakan seragam, tidak mengaktifkan HP, dst).
          Yang kamu isi di sini adalah <em>tambahan khusus</em> dari perusahaanmu.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowContohTataTertib(v => !v)}
            style={{ fontSize: '0.75rem', color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showContohTataTertib ? '↑ Sembunyikan contoh' : 'Lihat contoh aturan perusahaan'}
          </button>
        </div>
        {showContohTataTertib && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#166534' }}>
            <strong>Contoh tata tertib khusus perusahaan:</strong>
            <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem' }}>
              <li>Datang dan absen tepat waktu sebelum jam 08.00</li>
              <li>Wajib menggunakan name tag perusahaan di area kantor</li>
              <li>Melaporkan setiap pekerjaan selesai kepada pembimbing lapangan</li>
              <li>Dilarang mengakses sistem komputer kantor tanpa izin supervisor</li>
              <li>Menjaga kerahasiaan data dan informasi perusahaan</li>
            </ul>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, fontStyle: 'italic' }}>
              💡 Boleh singkat — AI akan otomatis memformalkan ke kalimat yang lebih profesional
            </p>
          </div>
        )}
        <StringArrayField
          label="Aturan / Tata Tertib Khusus Perusahaan"
          items={pr.tata_tertib_perusahaan ?? []}
          onChange={items => upd({ tata_tertib_perusahaan: items, tata_tertib: items })}
          addLabel="+ Tambah Aturan"
          placeholder="cth: datang tepat waktu jam 08.00"
          importance="opsional"
        />
      </FieldGroup>


      {/* ── Jam Kerja: susun slot LANGSUNG di tabel bentuk laporan ────────── */}
      <FieldGroup title="Jadwal Jam Kerja" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Tabel ini persis seperti yang tercetak di laporan. Pilih hari, lalu
          susun slot jamnya (BRIEFING / OPERASIONAL / ISTIRAHAT / TUTUP).
          Jam yang bentrok atau mundur otomatis tidak bisa dipilih.
          Menambah hari baru akan menyalin jadwal hari sebelumnya.
        </p>


        <div className="table-scroll">
          <table className="fill-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>HARI</th>
                <th>JAM KERJA</th>
                <th style={{ width: 170 }}>KETERANGAN</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {pr.jam_kerja.map((j, di) => {
                const slots = parseSlots(j)
                const usedDays = new Set(
                  pr.jam_kerja.filter((_, x) => x !== di).map(x => (x.hari || '').toUpperCase())
                )
                const hariVal = (j.hari || '').toUpperCase()
                const nRows = slots.length + 1 // + baris "tambah slot"

                const setSlot = (si: number, patch: Partial<Slot>) => {
                  const next = slots.map((s, x) => (x === si ? { ...s, ...patch } : s))
                  // Label TUTUP tidak punya jam selesai.
                  if ((patch.label || '').trim().toUpperCase() === 'TUTUP') next[si].selesai = ''
                  setSlots(di, next)
                }
                const addSlot = () => {
                  const last = slots[slots.length - 1]
                  const mulai = last ? (last.selesai || last.mulai) : '08.00'
                  // Label sengaja kosong supaya contoh abu-abu (placeholder)
                  // terlihat dan user mengisinya sendiri.
                  setSlots(di, [...slots, { mulai, selesai: '', label: '' }])
                }
                const removeSlot = (si: number) => setSlots(di, slots.filter((_, x) => x !== si))

                const rows = slots.map((s, si) => {
                  const ranges = occupiedRanges(slots, si)
                  const isTutup = s.label.trim().toUpperCase() === 'TUTUP'
                  return (
                    <tr key={`${di}-${si}`}>
                      {si === 0 && (
                        <td rowSpan={nRows} style={{ verticalAlign: 'top' }}>
                          <select value={hariVal} onChange={e => updJam(di, { hari: e.target.value })}>
                            <option value="">— pilih —</option>
                            {DAY_ORDER.map(d => (
                              <option key={d} value={d} disabled={usedDays.has(d)}>{d}</option>
                            ))}
                            {hariVal && !DAY_ORDER.includes(hariVal) && (
                              <option value={hariVal}>{hariVal}</option>
                            )}
                          </select>
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          <select
                            value={s.mulai}
                            onChange={e => setSlot(si, { mulai: e.target.value })}
                            style={{ width: 'auto' }}
                          >
                            <option value="">—</option>
                            {JAM_OPTIONS.map(v => (
                              <option key={v} value={v} disabled={startDisabled(v, ranges)}>{v}</option>
                            ))}
                          </select>
                          {!isTutup && (
                            <>
                              <span style={{ color: 'var(--ink-soft)' }}>–</span>
                              <select
                                value={s.selesai}
                                onChange={e => setSlot(si, { selesai: e.target.value })}
                                style={{ width: 'auto' }}
                              >
                                <option value="">—</option>
                                {JAM_OPTIONS.map(v => (
                                  <option key={v} value={v} disabled={endDisabled(v, s.mulai, ranges)}>{v}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {/* Input teks bebas dengan contoh abu-abu (placeholder). */}
                        <input
                          type="text"
                          value={s.label}
                          placeholder="cth: OPERASIONAL"
                          onChange={e => setSlot(si, { label: e.target.value })}
                          style={{ textAlign: 'center' }}
                        />
                      </td>
                      <td>
                        <button type="button" className="fill-table__remove" onClick={() => removeSlot(si)} title="Hapus slot">✕</button>
                      </td>
                    </tr>
                  )
                })

                // Baris terakhir tiap hari: tambah slot + hapus hari.
                rows.push(
                  <tr key={`${di}-add`}>
                    {slots.length === 0 && (
                      <td rowSpan={1} style={{ verticalAlign: 'top' }}>
                        <select value={hariVal} onChange={e => updJam(di, { hari: e.target.value })}>
                          <option value="">— pilih —</option>
                          {DAY_ORDER.map(d => (
                            <option key={d} value={d} disabled={usedDays.has(d)}>{d}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td colSpan={2} style={{ padding: 0 }}>
                      <button
                        type="button"
                        onClick={addSlot}
                        style={{
                          width: '100%', border: 'none', background: 'transparent',
                          color: 'var(--green-700)', fontWeight: 600, fontSize: '0.8rem',
                          padding: '0.4rem', cursor: 'pointer',
                        }}
                      >
                        + jam
                      </button>
                    </td>
                    <td>
                      <button type="button" className="fill-table__remove" onClick={() => removeJam(di)} title="Hapus hari ini">
                        hapus hari
                      </button>
                    </td>
                  </tr>
                )
                return rows
              })}

              {/* Baris tambah hari — bagian dari tabel supaya alurnya jelas */}
              <tr>
                <td colSpan={4} style={{ padding: 0 }}>
                  <button
                    type="button"
                    onClick={addJam}
                    style={{
                      width: '100%', border: 'none', background: 'transparent',
                      color: 'var(--green-700)', fontWeight: 600, fontSize: '0.85rem',
                      padding: '0.55rem', cursor: 'pointer',
                    }}
                  >
                    + Tambah hari
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </FieldGroup>

      {/* ── Bagan Struktur Organisasi ─────────────────────────────────────── */}
      <FieldGroup title="Bagan Struktur Organisasi" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Upload foto/screenshot bagan struktur perusahaan. Bisa minta ke HRD atau foto dari papan pengumuman kantor.
          Jika tidak ada, sub-bab ini akan dilewati di laporan.
        </p>
        <ImageUploadField
          label="Gambar Bagan Struktur"
          value={pr.struktur_organisasi}
          onChange={v => upd({ struktur_organisasi: v })}
          importance="opsional"
          hint="Format JPG/PNG. Ukuran ideal: landscape, min. 800×600px"
        />
        {pr.struktur_organisasi && (
          <TextareaField
            label="Penjelasan Manfaat Struktur Organisasi"
            value={pr.narasi_struktur}
            onChange={v => upd({ narasi_struktur: v })}
            importance="opsional"
            hint="Kalimat pembuka yang menjelaskan gunanya bagan di atas. Kosongkan saja — AI akan menuliskannya untukmu."
            placeholder="cth: Manfaat Struktur organisasi adalah mempermudah proses pencapaian tujuan dari suatu lembaga..."
          />
        )}
      </FieldGroup>

      {/* ── Job Descriptions ─────────────────────────────────────────────── */}
      <FieldGroup title="Job Description (Tugas per Jabatan)" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Isi tugas-tugas setiap jabatan yang ada di perusahaan. Minimal isi jabatan tempat kamu ditempatkan.
          Tidak perlu hafal semua — isi yang kamu ketahui saja.
        </p>
        {pr.job_descriptions.length === 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#92400e' }}>
            Belum ada jabatan. Klik "+ Tambah Jabatan" untuk mengisi.
          </div>
        )}
        {pr.job_descriptions.map((job, i) => (
          <JobDescCard
            key={i} job={job} idx={i}
            onChange={patch => updJob(i, patch)}
            onRemove={() => removeJob(i)}
          />
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addJob}>+ Tambah Jabatan</button>
      </FieldGroup>
    </>
  )
}
