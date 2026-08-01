import { useState } from 'react'
import type {
  AreaCabang, CabangPerusahaan, JamKerja, JobDescription,
  PklContext, ProfilPerusahaan
} from '@/types/pkl'
import {
  emptyAreaCabang, emptyCabangPerusahaan, emptyJamKerja, emptyJobDescription
} from '@/types/pkl'
import { getJurusanExample, type JurusanExample } from '@/utils/jurusanExamples'
import {
  FieldGroup, ImportanceLegend, StringArrayField, TextareaField, TextField, ImageUploadField
} from '@/components/fields/FormFields'

// ─── Pilihan rekomendasi jam (00.00 - 24.00) ────────────────────────────────── //
const JAM_OPTIONS: string[] = []
for (let h = 0; h <= 24; h++) {
  const hh = String(h).padStart(2, '0')
  JAM_OPTIONS.push(`${hh}.00`)
  if (h < 24) {
    JAM_OPTIONS.push(`${hh}.15`)
    JAM_OPTIONS.push(`${hh}.30`)
    JAM_OPTIONS.push(`${hh}.45`)
  }
}

// ─── Jadwal Jam Kerja: editor slot per hari, langsung di tabel laporan ────── //
const DAY_ORDER = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU']

/** Satu slot jadwal dalam sehari. */
interface Slot {
  mulai: string
  selesai: string
  label: string
}

/** Baca slot dari data tersimpan (jam & keterangan multi-baris). */
function parseSlots(j: JamKerja): Slot[] {
  const jamLines = (j.jam || '').split('\n').map(x => x.trim()).filter(Boolean)
  const ketLines = (j.keterangan || '').split('\n').map(x => x.trim())
  if (jamLines.length) {
    return jamLines.map((line, k) => {
      const range = line.match(/(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})/)
      const label = ketLines[k] !== undefined ? ketLines[k] : ''
      if (range) return { mulai: range[1], selesai: range[2], label }
      const single = line.match(/^(\d{1,2}[.:]\d{2})$/)
      return { mulai: single ? single[1] : '', selesai: '', label }
    })
  }
  // Kompatibilitas data lama (jam_mulai/jam_selesai terpisah)
  if (j.jam_mulai || j.jam_selesai) {
    return [{ mulai: j.jam_mulai || '08.00', selesai: j.jam_selesai || '16.00', label: 'OPERASIONAL' }]
  }
  return []
}

/** Conversi string "HH.MM" ke menit murni untuk validasi urutan jam. */
const toMin = (t: string): number => {
  if (!t) return NaN
  const m = t.trim().match(/^(\d{1,2})[.:](\d{2})$/)
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : NaN
}

/** Jam Mulai slot si: di-disable jika < Jam Selesai slot sebelumnya di hari yang sama. */
function isStartDisabled(val: string, slots: Slot[], si: number): boolean {
  if (si <= 0) return false
  const prevSlot = slots[si - 1]
  const prevEnd = prevSlot.selesai || prevSlot.mulai
  const prevMin = toMin(prevEnd)
  const valMin = toMin(val)
  if (isNaN(prevMin) || isNaN(valMin)) return false
  return valMin < prevMin
}

/** Jam Selesai slot si: di-disable jika <= Jam Mulai slot si (tidak boleh mundur atau sama). */
function isEndDisabled(val: string, mulai: string): boolean {
  const mulaiMin = toMin(mulai)
  const valMin = toMin(val)
  if (isNaN(mulaiMin) || isNaN(valMin)) return false
  return valMin <= mulaiMin
}

/** Simpan slot kembali ke format jam & keterangan multi-baris. */
function serializeSlots(slots: Slot[]): { jam: string; keterangan: string } {
  return {
    jam: slots.map(s => (s.selesai ? `${s.mulai} - ${s.selesai}` : s.mulai)).join('\n'),
    keterangan: slots.map(s => s.label).join('\n'),
  }
}

// ─── Sub-komponen: Area & Cabang ──────────────────────────────────────────── //
function AreaCabangCard({
  area, idx, onChange, onRemove, totalAreas, jurusanExample,
}: {
  area: AreaCabang; idx: number
  onChange: (patch: Partial<AreaCabang>) => void
  onRemove: () => void
  totalAreas: number
  jurusanExample: JurusanExample
}) {
  const contoh = jurusanExample.contohCabang
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
            placeholder={`cth: ${contoh.tipeBesar.area1.namaArea} (atau KOSONGKAN jika tanpa area)`}
            onChange={e => onChange({ nama_area: e.target.value })}
            style={{ flex: 1, minWidth: '220px' }}
          />
        </div>
        {totalAreas > 1 && (
          <button type="button" className="btn-sm btn-danger" onClick={onRemove}>✕ Hapus Area</button>
        )}
      </div>

      <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
        💡 <strong>Nama Area (Opsional):</strong> Kosongkan saja jika tempat PKL kamu adalah toko/kantor/hotel/studio/perusahaan biasa tanpa pembagian wilayah area.
      </p>

      <div style={{ paddingTop: '0.6rem' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
          Daftar Cabang Tempat PKL <span style={{ color: '#ef4444' }}>*</span>
          <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>
            (min. 1 — tuliskan nama cabang / lokasi tempat kamu PKL)
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
                placeholder={`cth: ${contoh.tipeBiasa.cabang}`}
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
  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan)
  const contohCabang = jurusanExample.contohCabang

  const [isMultiBranch, setIsMultiBranch] = useState<boolean>(() => {
    const ac = pr.area_cabang || []
    if (ac.length > 1) return true
    if (ac[0]?.nama_area?.trim()) return true
    if (ac[0]?.cabang && ac[0].cabang.length > 1) return true
    return false
  })

  const [showContohCabang, setShowContohCabang] = useState(false)
  const [showContohTataTertib, setShowContohTataTertib] = useState(false)
  const [showContohJamKerja, setShowContohJamKerja] = useState(false)

  const upd = (patch: Partial<ProfilPerusahaan>) =>
    set({ profil_perusahaan: { ...pr, ...patch } })

  // ── Jam Kerja ─────────────────────────────────────────────────────────── //
  const updJam = (i: number, patch: Partial<JamKerja>) => {
    const next = [...pr.jam_kerja]
    next[i] = { ...next[i], ...patch }
    upd({ jam_kerja: next })
  }

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

  const handleApplySampleJamKerja = () => {
    const sampleJam: JamKerja[] = [
      {
        hari: 'SENIN',
        jam: '08.00 - 12.00\n12.00 - 13.00\n13.00 - 16.00',
        keterangan: 'OPERASIONAL\nISTIRAHAT\nOPERASIONAL',
        jam_mulai: '08.00', jam_selesai: '16.00', jam_istirahat: '12.00-13.00', jam_briefing: '',
      },
      {
        hari: 'SELASA',
        jam: '08.00 - 12.00\n12.00 - 13.00\n13.00 - 16.00',
        keterangan: 'OPERASIONAL\nISTIRAHAT\nOPERASIONAL',
        jam_mulai: '08.00', jam_selesai: '16.00', jam_istirahat: '12.00-13.00', jam_briefing: '',
      },
      {
        hari: 'RABU',
        jam: '08.00 - 12.00\n12.00 - 13.00\n13.00 - 16.00',
        keterangan: 'OPERASIONAL\nISTIRAHAT\nOPERASIONAL',
        jam_mulai: '08.00', jam_selesai: '16.00', jam_istirahat: '12.00-13.00', jam_briefing: '',
      },
      {
        hari: 'KAMIS',
        jam: '08.00 - 12.00\n12.00 - 13.00\n13.00 - 16.00',
        keterangan: 'OPERASIONAL\nISTIRAHAT\nOPERASIONAL',
        jam_mulai: '08.00', jam_selesai: '16.00', jam_istirahat: '12.00-13.00', jam_briefing: '',
      },
      {
        hari: 'JUMAT',
        jam: '08.00 - 12.00\n12.00 - 13.00\n13.00 - 16.00',
        keterangan: 'OPERASIONAL\nISTIRAHAT\nOPERASIONAL',
        jam_mulai: '08.00', jam_selesai: '16.00', jam_istirahat: '12.00-13.00', jam_briefing: '',
      },
      {
        hari: 'SABTU',
        jam: '08.00 - 12.00\n12.00',
        keterangan: 'OPERASIONAL\nTUTUP',
        jam_mulai: '08.00', jam_selesai: '12.00', jam_istirahat: '', jam_briefing: '',
      },
    ]
    upd({ jam_kerja: sampleJam })
  }

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
          Logo perusahaan akan muncul di laporan.
        </p>
        <ImageUploadField
          label="Logo Perusahaan"
          value={pr.logo_perusahaan}
          onChange={v => upd({ logo_perusahaan: v })}
          importance="wajib"
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
          Alamat tempat kamu PKL sudah diisi di langkah Perusahaan. Di sini isi alamat kantor pusat dan lokasi/cabang perusahaan.
        </p>

        <TextField
          label="Alamat Kantor Pusat"
          value={pr.head_office}
          onChange={v => upd({ head_office: v })}
          importance="wajib"
          hint="Kantor utama perusahaan (bisa sama atau beda kota dengan lokasi tempat kamu PKL)."
          placeholder="cth: Jalan Tentara Pelajar Blok B No. 3&5, Kebayoran Lama, Jakarta Selatan"
        />

        {/* Pertanyaan Sederhana: 1 Tempat vs Multi Cabang */}
        <div style={{ marginTop: '1.25rem', padding: '1rem 1.1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.6rem' }}>
            Apakah tempat PKL kamu memiliki lebih dari 1 lokasi / cabang perusahaan? <span style={{ color: '#ef4444' }}>*</span>
          </label>

          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: !isMultiBranch ? 600 : 400 }}>
              <input
                type="radio"
                name="isMultiBranch"
                checked={!isMultiBranch}
                onChange={() => {
                  setIsMultiBranch(false)
                  const currentCabangName = pr.area_cabang?.[0]?.cabang?.[0]?.nama || ctx.perusahaan?.nama_lengkap || ctx.perusahaan?.nama || ''
                  upd({
                    area_cabang: [
                      {
                        nama_area: '',
                        cabang: [{ nama: currentCabangName }]
                      }
                    ]
                  })
                }}
              />
              <span>Tidak (Hanya 1 lokasi / toko / studio / hotel / kantor)</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: isMultiBranch ? 600 : 400 }}>
              <input
                type="radio"
                name="isMultiBranch"
                checked={isMultiBranch}
                onChange={() => {
                  setIsMultiBranch(true)
                  if (!pr.area_cabang || pr.area_cabang.length === 0) {
                    upd({ area_cabang: [emptyAreaCabang()] })
                  }
                }}
              />
              <span>Ya (Punya banyak cabang / kelompok area)</span>
            </label>
          </div>

          {/* OPSI 1: HANYA 1 LOKASI (SINGLE INPUT - SUPER SIMPLE) */}
          {!isMultiBranch && (
            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <TextField
                label="Nama / Alamat Lokasi Tempat Kamu PKL"
                value={pr.area_cabang?.[0]?.cabang?.[0]?.nama || ''}
                onChange={(v) => {
                  upd({
                    area_cabang: [
                      {
                        nama_area: '',
                        cabang: [{ nama: v }]
                      }
                    ]
                  })
                }}
                importance="wajib"
                placeholder={`cth: ${contohCabang.tipeBiasa.cabang}`}
                hint="Tuliskan nama tempat/cabang tempat kamu melaksanakan PKL."
              />
            </div>
          )}

          {/* OPSI 2: BANYAK CABANG / BER-AREA (MULTI CABANG ENGINE) */}
          {isMultiBranch && (
            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--green-700)' }}>
                  Kelola Daftar Cabang &amp; Wilayah Area ({jurusanExample.label})
                </span>
                <button
                  type="button"
                  onClick={() => setShowContohCabang(v => !v)}
                  style={{ fontSize: '0.75rem', color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {showContohCabang ? '↑ Sembunyikan contoh' : 'Lihat contoh perusahaan besar'}
                </button>
              </div>

              {showContohCabang && (
                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.5 }}>
                  <strong>Contoh Perusahaan Banyak Cabang ({contohCabang.tipeBesar.namaPerusahaan}):</strong>
                  <div style={{ marginTop: '0.35rem' }}>
                    • <strong>{contohCabang.tipeBesar.area1.namaArea}:</strong> {contohCabang.tipeBesar.area1.cabang.join(', ')}<br />
                    • <strong>{contohCabang.tipeBesar.area2.namaArea}:</strong> {contohCabang.tipeBesar.area2.cabang.join(', ')}
                  </div>
                  <p style={{ marginTop: '0.4rem', marginBottom: 0, fontSize: '0.78rem', color: '#1d4ed8', fontStyle: 'italic' }}>
                    * Jika cabang tidak dikelompokkan per wilayah, kosongkan saja input Nama Area!
                  </p>
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
                  jurusanExample={jurusanExample}
                />
              ))}
              <button type="button" className="btn-sm btn-outline" onClick={addArea}>
                + Tambah Kelompok Area / Cabang Lain
              </button>
            </div>
          )}
        </div>
      </FieldGroup>

      {/* ── Tata Tertib ──────────────────────────────────────────────────── */}
      <FieldGroup title="Tata Tertib Perusahaan" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Isi tata tertib <strong>khusus dari perusahaanmu</strong> — aturan unik yang tidak ada di sekolah.
          AI akan membantu merapikan bahasanya saat kamu download laporan.
        </p>

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
              Boleh singkat — AI akan otomatis memformalkan ke kalimat yang lebih profesional
            </p>
          </div>
        )}
        <StringArrayField
          label="Aturan / Tata Tertib Khusus Perusahaan"
          items={pr.tata_tertib_perusahaan ?? []}
          onChange={items => upd({ tata_tertib_perusahaan: items, tata_tertib: items })}
          addLabel="+ Tambah Aturan"
          placeholder="cth: datang tepat waktu jam 08.00"
          importance="wajib"
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0 0.5rem' }}>
          <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Editor Tabel Jadwal Operasional PKL</strong>
          <button
            type="button"
            onClick={() => setShowContohJamKerja(v => !v)}
            style={{ fontSize: '0.75rem', color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showContohJamKerja ? '↑ Sembunyikan contoh tabel (.docx)' : 'Lihat contoh tabel (.docx)'}
          </button>
        </div>

        {showContohJamKerja && (
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <strong style={{ color: '#0f172a' }}>
                📄 Pratinjau Tampilan Tabel Jam Kerja di Dokumen MS Word (.docx):
              </strong>
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={handleApplySampleJamKerja}
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', color: 'var(--green-700)', borderColor: 'var(--green-600)', fontWeight: 600, background: '#ffffff' }}
              >
                + Gunakan Contoh Jadwal Ini (Senin–Sabtu)
              </button>
            </div>

            {/* Simulated DOCX Table */}
            <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '0.6rem', margin: '0.5rem 0', fontFamily: '"Times New Roman", serif', fontSize: '10pt', color: '#000000' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Tabel 2.1 Jadwal Kerja Operasional Perusahaan
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '9.5pt' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center', width: '25%' }}>HARI</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center', width: '35%' }}>JAM KERJA</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center', width: '40%' }}>KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>SENIN</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>08.00 – 12.00<br />12.00 – 13.00<br />13.00 – 16.00</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>OPERASIONAL<br />ISTIRAHAT<br />OPERASIONAL</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>SELASA</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>08.00 – 12.00<br />12.00 – 13.00<br />13.00 – 16.00</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>OPERASIONAL<br />ISTIRAHAT<br />OPERASIONAL</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>SABTU</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>08.00 – 12.00<br />12.00</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>OPERASIONAL<br />TUTUP</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: '0.4rem', marginBottom: 0, fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
              
            </p>
          </div>
        )}

        <div className="table-scroll">
          <table className="fill-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>HARI</th>
                <th style={{ minWidth: 140 }}>JAM KERJA</th>
                <th>KETERANGAN</th>
                <th style={{ width: 32 }}></th>
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
                  const next = slots.map((s, x) => {
                    if (x !== si) return s
                    const updated = { ...s, ...patch }
                    // Jika jam mulai diubah dan jam selesai menjadi <= jam mulai, reset jam selesai
                    if (patch.mulai !== undefined && updated.selesai) {
                      if (toMin(updated.selesai) <= toMin(patch.mulai)) {
                        updated.selesai = ''
                      }
                    }
                    return updated
                  })
                  setSlots(di, next)
                }
                const addSlot = () => {
                  const last = slots[slots.length - 1]
                  const mulai = last ? (last.selesai || last.mulai) : '08.00'
                  setSlots(di, [...slots, { mulai, selesai: '', label: '' }])
                }
                const removeSlot = (si: number) => setSlots(di, slots.filter((_, x) => x !== si))

                const rows = slots.map((s, si) => {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                          <select
                            value={s.mulai}
                            onChange={e => setSlot(si, { mulai: e.target.value })}
                            style={{ width: 'auto', padding: '3px 2px', fontSize: '0.82rem' }}
                          >
                            <option value="">—</option>
                            {JAM_OPTIONS.map(v => (
                              <option key={v} value={v} disabled={isStartDisabled(v, slots, si)}>{v}</option>
                            ))}
                            {s.mulai && !JAM_OPTIONS.includes(s.mulai) && (
                              <option value={s.mulai}>{s.mulai}</option>
                            )}
                          </select>
                          <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>–</span>
                          <select
                            value={s.selesai}
                            onChange={e => setSlot(si, { selesai: e.target.value })}
                            style={{ width: 'auto', padding: '3px 2px', fontSize: '0.82rem' }}
                          >
                            <option value="">—</option>
                            {JAM_OPTIONS.map(v => (
                              <option key={v} value={v} disabled={isEndDisabled(v, s.mulai)}>{v}</option>
                            ))}
                            {s.selesai && !JAM_OPTIONS.includes(s.selesai) && (
                              <option value={s.selesai}>{s.selesai}</option>
                            )}
                          </select>
                        </div>
                      </td>
                      <td>
                        {/* Input teks bebas dengan contoh abu-abu (placeholder). */}
                        <input
                          type="text"
                          value={s.label}
                          placeholder="cth: Jam Kerja / Istirahat"
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
          importance="wajib"
          hint="Format JPG/PNG. Ukuran ideal: landscape, min. 800×600px"
        />
        {pr.struktur_organisasi && (
          <TextareaField
            label="Penjelasan Manfaat Struktur Organisasi"
            value={pr.narasi_struktur}
            onChange={v => upd({ narasi_struktur: v })}
            importance="wajib"
            hint="Kalimat pembuka yang menjelaskan gunanya bagan di atas."
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
