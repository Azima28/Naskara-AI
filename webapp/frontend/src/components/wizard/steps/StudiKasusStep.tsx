import { useState, useEffect } from 'react'
import type { DataAngka, JenisTabel, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import JurusanExampleCard from '@/components/wizard/JurusanExampleCard'
import { getJurusanExample } from '@/utils/jurusanExamples'
import { IconDocument } from '@/components/common/Icons'

const TABEL_OPTIONS: {
  id: JenisTabel
  icon: string
  titleOnly: string
  desc: string
}[] = [
  {
    id: 'optimasi',
    icon: '⚙️',
    titleOnly: 'Optimasi & Perbaikan Performance',
    desc: 'Untuk pekerjaan yang memiliki kondisi sebelum dan sesudah.',
  },
  {
    id: 'pencapaian',
    icon: '🎯',
    titleOnly: 'Pencapaian Target Kerja',
    desc: 'Untuk pekerjaan yang memiliki target dan hasil.',
  },
  {
    id: 'kesesuaian',
    icon: '✅',
    titleOnly: 'Kesesuaian SOP',
    desc: 'Untuk membandingkan SOP dengan praktik di lapangan.',
  },
  {
    id: 'troubleshooting',
    icon: '🔧',
    titleOnly: 'Troubleshooting',
    desc: 'Untuk menjelaskan masalah dan cara penyelesaiannya.',
  },
]

interface JenisTabelConfig {
  sectionTitle: string
  sectionDesc: string
  col1Label: string
  col2Label: string
  col3Label: string
  getCol2Placeholder: (sampleRow: any) => string
  getCol3Placeholder: (sampleRow: any) => string
}

const JENIS_TABEL_CONFIG: Record<JenisTabel, JenisTabelConfig> = {
  optimasi: {
    sectionTitle: 'Tabel Data Angka Perbandingan (Sebelum ➔ Sesudah)',
    sectionDesc: 'Bandingkan kondisi awal sebelum pekerjaan vs hasil akhir setelah dioptimasi/diperbaiki. (Bebas menggunakan satuan: detik, menit, jam, hari, MB, %, Rp, unit, dll.)',
    col1Label: 'Parameter / Nama Yang Diukur',
    col2Label: 'Kondisi Sebelum (Awal)',
    col3Label: 'Kondisi Sesudah (Hasil Akhir)',
    getCol2Placeholder: (s) => (s?.sebelum || s?.nilai_awal ? `Contoh: ${s.sebelum || s.nilai_awal}` : 'Contoh: 3.8 Detik'),
    getCol3Placeholder: (s) => (s?.sesudah || s?.nilai_akhir ? `Contoh: ${s.sesudah || s.nilai_akhir}` : 'Contoh: 0.2 Detik'),
  },
  pencapaian: {
    sectionTitle: 'Tabel Data Pencapaian Target Kerja (Target ➔ Realisasi)',
    sectionDesc: 'Bandingkan target yang ditetapkan perusahaan/supervisor vs realisasi hasil pekerjaan yang kamu capai.',
    col1Label: 'Indikator / Parameter Target',
    col2Label: 'Target Perusahaan',
    col3Label: 'Realisasi Pelaksanaan',
    getCol2Placeholder: (s) => (s?.sebelum || s?.nilai_awal ? `Contoh: ${s.sebelum || s.nilai_awal}` : 'Contoh: Target 20 Titik'),
    getCol3Placeholder: (s) => (s?.sesudah || s?.nilai_akhir ? `Contoh: ${s.sesudah || s.nilai_akhir}` : 'Contoh: Realisasi 24 Titik'),
  },
  kesesuaian: {
    sectionTitle: 'Tabel Data Kesesuaian Standar SOP (Standar SOP ➔ Lapangan)',
    sectionDesc: 'Bandingkan ketentuan standar SOP / Teori sekolah vs fakta pelaksanaan riil di lapangan.',
    col1Label: 'Prosedur / Standar Kerja',
    col2Label: 'Standar SOP / Teori',
    col3Label: 'Pelaksanaan di Lapangan',
    getCol2Placeholder: (s) => (s?.sebelum || s?.nilai_awal ? `Contoh: ${s.sebelum || s.nilai_awal}` : 'Contoh: Wajib 100% Lolos Rule'),
    getCol3Placeholder: (s) => (s?.sesudah || s?.nilai_akhir ? `Contoh: ${s.sesudah || s.nilai_akhir}` : 'Contoh: 100% Clean Code'),
  },
  troubleshooting: {
    sectionTitle: 'Tabel Data Troubleshooting (Masalah / Gejala ➔ Solusi)',
    sectionDesc: 'Jelaskan kasus/gejala kerusakan yang ditemukan vs tindakan/solusi penanganan yang kamu lakukan.',
    col1Label: 'Kasus / Gejala Kerusakan',
    col2Label: 'Analisis Penyebab',
    col3Label: 'Tindakan / Solusi',
    getCol2Placeholder: (s) => (s?.sebelum || s?.nilai_awal ? `Contoh: ${s.sebelum || s.nilai_awal}` : 'Contoh: Penggunaan RAM > 90%'),
    getCol3Placeholder: (s) => (s?.sesudah || s?.nilai_akhir ? `Contoh: ${s.sesudah || s.nilai_akhir}` : 'Contoh: Normal (RAM 35%)'),
  },
}

function getAwalValue(d: DataAngka): string {
  if (d.sebelum !== undefined && d.sebelum !== '') return d.sebelum
  if (d.nilai_awal !== undefined && d.nilai_awal !== '') return d.nilai_awal
  if (!d.nilai) return ''
  for (const delim of ['➔', '->', '→']) {
    if (d.nilai.includes(delim)) {
      const parts = d.nilai.split(delim)
      return parts[0].replace(/^(sebelum|target|sop|gejala)[:\s]*/i, '').trim()
    }
  }
  return d.nilai
}

function getAkhirValue(d: DataAngka): string {
  if (d.sesudah !== undefined && d.sesudah !== '') return d.sesudah
  if (d.nilai_akhir !== undefined && d.nilai_akhir !== '') return d.nilai_akhir
  if (!d.nilai) return ''
  for (const delim of ['➔', '->', '→']) {
    if (d.nilai.includes(delim)) {
      const parts = d.nilai.split(delim)
      return (parts[1] || '').replace(/^(sesudah|realisasi|lapangan|solusi)[:\s]*/i, '').trim()
    }
  }
  return ''
}

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const [showAlurExample, setShowAlurExample] = useState(false)
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

  // Auto-initialize 1 default row if empty
  useEffect(() => {
    if (!sk.data_angka || sk.data_angka.length === 0) {
      upd({ data_angka: [emptyDataAngka()] })
    }
  }, [])

  const activeJenis = (sk.jenis_tabel || 'optimasi') as JenisTabel
  const currentConfig = JENIS_TABEL_CONFIG[activeJenis] || JENIS_TABEL_CONFIG.optimasi

  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan, activeJenis)
  const sampleData = jurusanExample.studiKasus?.data_angka || []
  const sample1 = sampleData[0] || { label: 'Jumlah Dokumen / Unit Diproses', sebelum: '0 Berkas', sesudah: '45 Berkas', nilai: '45 Berkas' }

  const updAngka = (i: number, patch: Partial<DataAngka>) => {
    const next = [...sk.data_angka]
    const current = next[i] || emptyDataAngka()

    const awal = patch.sebelum !== undefined ? patch.sebelum : (patch.nilai_awal !== undefined ? patch.nilai_awal : getAwalValue(current))
    const akhir = patch.sesudah !== undefined ? patch.sesudah : (patch.nilai_akhir !== undefined ? patch.nilai_akhir : getAkhirValue(current))
    const label = patch.label !== undefined ? patch.label : (current.label || '')

    const updated: DataAngka = {
      ...current,
      label,
      sebelum: awal,
      nilai_awal: awal,
      sesudah: akhir,
      nilai_akhir: akhir,
      nilai: awal && akhir ? `${awal} ➔ ${akhir}` : (awal || akhir || ''),
    }

    next[i] = updated
    upd({ data_angka: next })
  }

  return (
    <>
      <h2>Topik Utama &amp; Pengalaman Kerja Paling Berkesan (BAB IV &amp; V)</h2>
      <p className="muted">
        Ceritakan 1 pekerjaan utama yang paling sering atau berkesan selama kamu PKL. AI akan membantu merapikan tulisan kamu menjadi narasi alur cerita laporan resmi yang bagus.
      </p>

      {/* Storyline Flow Progress Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          margin: '1.25rem 0',
          padding: '0.65rem 1rem',
          background: 'var(--green-50, #f0fdf4)',
          border: '1px solid var(--green-500, #4ade80)',
          borderRadius: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--green-700, #14614a)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}><IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Alur Cerita Pekerjaan:</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>1. Tugas Diterima</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>2. Masalah Awal (Sebelum)</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>3. Langkah Kerja</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>4. Hasil Akhir (Sesudah)</span>
      </div>

      <FieldGroup title="Alur Pengalaman &amp; Pelaksanaan Pekerjaan Utama">
        {/* Collapsible Major-Specific Storyline Guidance */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn-sm btn-outline btn-mobile-full"
            onClick={() => setShowAlurExample(!showAlurExample)}
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 0.85rem',
              background: '#ffffff',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            💡 {showAlurExample ? 'Sembunyikan Contoh Alur Pekerjaan' : `Lihat Contoh Alur Pekerjaan (${jurusanExample.label})`}
          </button>

          {showAlurExample && (
            <div
              style={{
                marginTop: '0.65rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                color: '#334155',
              }}
            >
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                💡 Contoh Alur Pekerjaan ({jurusanExample.label}):
              </strong>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', lineHeight: 1.45 }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>1. Nama Pekerjaan: </span>
                  <span style={{ color: '#334155' }}>"{jurusanExample.studiKasus.judul}"</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>2. Masalah Awal: </span>
                  <span style={{ color: '#334155' }}>"{jurusanExample.studiKasus.latar_belakang}"</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>3. Langkah Kerja: </span>
                  <span style={{ color: '#334155', whiteSpace: 'pre-line' }}>{jurusanExample.studiKasus.proses_atau_formula}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>4. Hasil Akhir: </span>
                  <span style={{ color: '#334155' }}>"{jurusanExample.studiKasus.hasil}"</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <TextField
          name="studi_kasus.judul"
          label="1. Pekerjaan / Tugas Apa yang Kamu Kerjakan?"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.judul}"`}
          hint="Tuliskan nama tugas atau proyek utama yang kamu tangani."
        />
        <TextareaField
          name="studi_kasus.latar_belakang"
          label="2. Bagaimana Kondisi Awal / Masalah Sebelum Kamu Kerjakan?"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.latar_belakang}"`}
          hint="Bagaimana kondisi awal atau kendala sebelum pekerjaan kamu selesaikan?"
        />
        <TextareaField
          name="studi_kasus.proses_atau_formula"
          label="3. Langkah-Langkah yang Kamu Lakukan untuk Menyelesaikannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}):\n${jurusanExample.studiKasus.proses_atau_formula}`}
          hint="Tuliskan urutan kegiatan pengerjaannya dari awal sampai selesai (bisa pakai nomor 1, 2, 3)."
        />
        <TextareaField
          name="studi_kasus.hasil"
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.hasil}"`}
          hint="Bagaimana hasil akhir setelah pekerjaan tersebut selesai kamu lakukan?"
        />
      </FieldGroup>

      {/* Data Angka / Perbandingan (OPSIONAL) */}
      <FieldGroup title="Hasil yang Bisa Diukur &amp; Perbandingan" full>
        <div className="field field--full" id="field-studi_kasus.jenis_tabel" data-field="studi_kasus.jenis_tabel">
          <div style={{ marginBottom: '1.25rem', padding: '1.1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>
                💡 Pilih jenis analisis yang paling sesuai dengan pekerjaanmu: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {!sk.jenis_tabel && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                  WAJIB DIPILIH
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              {TABEL_OPTIONS.map((opt) => {
                const isSelected = sk.jenis_tabel === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => upd({ jenis_tabel: opt.id })}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--green-600, #187257)' : '1px solid #cbd5e1',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      boxShadow: isSelected ? '0 2px 8px rgba(24, 114, 87, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                      position: 'relative',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{opt.icon}</span>
                      {isSelected ? (
                        <span style={{ fontSize: '0.68rem', color: '#ffffff', background: 'var(--green-600, #187257)', padding: '1px 6px', borderRadius: '999px', fontWeight: 700, flexShrink: 0 }}>
                          ✓ Terpilih
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '999px', fontWeight: 500, flexShrink: 0 }}>
                          Pilih
                        </span>
                      )}
                    </div>
                    <strong style={{ display: 'block', fontSize: '0.84rem', color: isSelected ? 'var(--green-800, #166534)' : '#0f172a', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.3rem' }}>
                      {opt.titleOnly}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: isSelected ? '#15803d' : '#64748b', lineHeight: 1.4 }}>
                      {opt.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <span className="field__label">
            {currentConfig.sectionTitle} <span className="field__badge field__badge--opsional">OPSIONAL</span>
          </span>
          <p className="muted" style={{ margin: '0.25rem 0 0.85rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
            {currentConfig.sectionDesc}<br />
            Jika ada, tuliskan di sini. Jika tidak ada, bagian ini boleh dikosongkan.
          </p>

          {/* Dynamic Major-Specific Example Card with Docx Preview */}
          <JurusanExampleCard
            jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
            jenisTabel={sk.jenis_tabel || 'optimasi'}
          />

          {/* Responsive Data Angka Input Table / Mobile Cards */}
          <div className="studi-kasus-table-container">
            {/* Table Header (Desktop/Tablet) */}
            <div className="studi-kasus-table-header">
              <div className="col-num-desktop">#</div>
              <div style={{ flex: 1, minWidth: 0 }}>{currentConfig.col1Label}</div>
              <div style={{ flex: 1, minWidth: 0 }}>{currentConfig.col2Label}</div>
              <div style={{ flex: 1, minWidth: 0 }}>{currentConfig.col3Label}</div>
              <div className="col-action-desktop">Aksi</div>
            </div>

            {/* Repeater Rows */}
            {sk.data_angka.map((d, i) => {
              const sampleRow = sampleData[i % sampleData.length] || sample1
              return (
                <div key={i} className="studi-kasus-row-card">
                  {/* Mobile Header Bar */}
                  <div className="studi-kasus-row-mobile-header">
                    <span className="row-badge">Data #{i + 1}</span>
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() => {
                        const next = sk.data_angka.filter((_, idx) => idx !== i)
                        upd({ data_angka: next.length === 0 ? [emptyDataAngka()] : next })
                      }}
                      aria-label="Hapus baris data"
                      title="Hapus baris ini"
                      style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}
                    >
                      ✕ Hapus
                    </button>
                  </div>

                  {/* Desktop Row Number */}
                  <div className="studi-kasus-col col-num-desktop">{i + 1}</div>

                  {/* Field 1: Label / Parameter */}
                  <div className="studi-kasus-col">
                    <label className="mobile-field-label">{currentConfig.col1Label}</label>
                    <input
                      className="field__input"
                      type="text"
                      value={d.label || ''}
                      onChange={(e) => updAngka(i, { label: e.target.value })}
                      placeholder={`Contoh: ${sampleRow.label}`}
                    />
                  </div>

                  {/* Field 2: Awal / Target / Standar SOP / Gejala */}
                  <div className="studi-kasus-col">
                    <label className="mobile-field-label">{currentConfig.col2Label}</label>
                    <input
                      className="field__input"
                      type="text"
                      value={getAwalValue(d)}
                      onChange={(e) => updAngka(i, { sebelum: e.target.value, nilai_awal: e.target.value })}
                      placeholder={currentConfig.getCol2Placeholder(sampleRow)}
                    />
                  </div>

                  {/* Field 3: Akhir / Realisasi / Lapangan / Solusi */}
                  <div className="studi-kasus-col">
                    <label className="mobile-field-label">{currentConfig.col3Label}</label>
                    <input
                      className="field__input"
                      type="text"
                      value={getAkhirValue(d)}
                      onChange={(e) => updAngka(i, { sesudah: e.target.value, nilai_akhir: e.target.value })}
                      placeholder={currentConfig.getCol3Placeholder(sampleRow)}
                    />
                  </div>

                  {/* Desktop Action */}
                  <div className="studi-kasus-col col-action-desktop">
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() => {
                        const next = sk.data_angka.filter((_, idx) => idx !== i)
                        upd({ data_angka: next.length === 0 ? [emptyDataAngka()] : next })
                      }}
                      aria-label="Hapus baris data"
                      title="Hapus baris ini"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      ✕ Hapus
                    </button>
                  </div>
                </div>
              )
            })}
            <button
              type="button"
              className="btn-sm btn-outline array__add"
              onClick={() => upd({ data_angka: [...sk.data_angka, emptyDataAngka()] })}
              style={{ marginTop: '0.4rem', alignSelf: 'flex-start' }}
            >
              + Tambah Data Perbandingan
            </button>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Foto &amp; Dokumen Pendukung (Opsional)">
        <ImageArrayUploadField label="Upload Foto Dokumentasi Pekerjaan Ini" items={sk.assets} onChange={(assets) => upd({ assets })} hint="Unggah foto saat kamu mengerjakan tugas ini atau foto kondisi barang sebelum/sesudah." />
      </FieldGroup>
    </>
  )
}
