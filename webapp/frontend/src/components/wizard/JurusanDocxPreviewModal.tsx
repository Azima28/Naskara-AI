import { useState } from 'react'
import type { JenisTabel } from '@/types/pkl'
import { getJurusanExample, type JurusanExample } from '@/utils/jurusanExamples'

interface JurusanDocxPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  initialJurusanKey?: string
  jenisTabel?: JenisTabel
  onSelectJurusan?: (jurusanValue: string, jurusanKey: string) => void
}

const MAJOR_TABS = [
  { key: 'pplg', label: 'PPLG / Software & Gim' },
  { key: 'tkj', label: 'TKJ / Jaringan' },
  { key: 'dkv', label: 'DKV / Desain' },
  { key: 'upw', label: 'UPW / Wisata' },
  { key: 'ph', label: 'PH / Perhotelan' },
  { key: 'tb', label: 'Tabog / Kuliner' },
  { key: 'busana', label: 'Tabus / Fashion' },
  { key: 'mplb', label: 'MPLB / Perkantoran' },
  { key: 'akl', label: 'AKL / Akuntansi' },
  { key: 'bdp', label: 'BDP / Marketing' },
]

const JENIS_TABS: { key: JenisTabel; label: string; icon: string }[] = [
  { key: 'optimasi', label: 'Optimasi', icon: '⚙️' },
  { key: 'pencapaian', label: 'Pencapaian', icon: '🎯' },
  { key: 'kesesuaian', label: 'Kesesuaian SOP', icon: '✅' },
  { key: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
]

const HEADER_MAP = {
  optimasi: {
    title: 'Tabel 4.1 Data Perbandingan Sebelum dan Sesudah Optimasi',
    label: 'Nama / Parameter Data',
    awal: 'Kondisi Sebelum (Awal)',
    akhir: 'Kondisi Sesudah (Hasil Akhir)',
  },
  pencapaian: {
    title: 'Tabel 4.1 Data Pencapaian Target Kerja',
    label: 'Indikator / Parameter Target',
    awal: 'Target Perusahaan',
    akhir: 'Realisasi Pelaksanaan',
  },
  kesesuaian: {
    title: 'Tabel 4.1 Data Kesesuaian Standar SOP',
    label: 'Prosedur / Standar Kerja',
    awal: 'Standar SOP / Teori',
    akhir: 'Pelaksanaan di Lapangan',
  },
  troubleshooting: {
    title: 'Tabel 4.1 Data Troubleshooting dan Penanganan Masalah',
    label: 'Kasus / Gejala Kerusakan',
    awal: 'Analisis Penyebab',
    akhir: 'Tindakan / Solusi',
  },
}

export default function JurusanDocxPreviewModal({
  isOpen,
  onClose,
  initialJurusanKey = 'mplb',
  jenisTabel = 'optimasi',
  onSelectJurusan,
}: JurusanDocxPreviewModalProps) {
  const [activeKey, setActiveKey] = useState<string>(initialJurusanKey || 'mplb')
  const [activeJenis, setActiveJenis] = useState<JenisTabel>(jenisTabel || 'optimasi')

  if (!isOpen) return null

  const example: JurusanExample = getJurusanExample(activeKey, activeJenis)
  const sk = example.studiKasus
  const h = HEADER_MAP[activeJenis] || HEADER_MAP.optimasi

  const handleApply = () => {
    if (onSelectJurusan) {
      onSelectJurusan(example.label, example.jurusan_key)
    }
    onClose()
  }

  return (
    <div
      className="docx-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(24, 23, 20, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.5rem, 2.5vw, 1.25rem)',
      }}
    >
      <div
        className="docx-modal-container"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          backgroundColor: 'var(--surface, #fffdf8)',
          border: '1px solid var(--line-strong, #b9b09c)',
          borderRadius: 'clamp(8px, 2vw, 12px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="docx-modal-header"
          style={{
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid var(--line, #ddd6c8)',
            background: 'var(--paper-2, #ece8de)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
              Contoh Hasil Cetak Laporan Word (.docx) Setiap Jurusan
            </h3>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', lineHeight: 1.35 }}>
              Klik tab jurusan di bawah untuk melihat contoh nyata lembar laporan & tabel data hasil akhir (.docx) per jurusan.
            </p>
          </div>
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={onClose}
            style={{ fontSize: '1.1rem', padding: '0.2rem 0.6rem', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Major Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.55rem 0.85rem',
            background: 'var(--surface, #fffdf8)',
            borderBottom: '1px solid var(--line, #ddd6c8)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {MAJOR_TABS.map((tab) => {
            const isActive = activeKey === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveKey(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: isActive ? '1px solid var(--green-700, #14614a)' : '1px solid var(--line, #ddd6c8)',
                  backgroundColor: isActive ? 'var(--green-600, #187257)' : 'var(--paper-2, #ece8de)',
                  color: isActive ? '#ffffff' : 'var(--ink-soft, #555)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Jenis Tabel Sub-tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--paper-2, #ece8de)',
            borderBottom: '1px solid var(--line, #ddd6c8)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft, #555)', flexShrink: 0, marginRight: '0.2rem' }}>
            Jenis Analisis:
          </span>
          {JENIS_TABS.map((jTab) => {
            const isActive = activeJenis === jTab.key
            return (
              <button
                key={jTab.key}
                type="button"
                onClick={() => setActiveJenis(jTab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: isActive ? '1px solid var(--green-600, #187257)' : '1px solid #cbd5e1',
                  backgroundColor: isActive ? '#f0fdf4' : '#ffffff',
                  color: isActive ? 'var(--green-800, #166534)' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{jTab.icon}</span> {jTab.label}
              </button>
            )
          })}
        </div>

        {/* Document Sheet Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(0.6rem, 2vw, 1.25rem)',
            background: 'var(--paper, #f4f1ea)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* Simulated A4 Word Document Page */}
          <div
            style={{
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '720px',
              minHeight: '520px',
              backgroundColor: '#ffffff',
              border: '1px solid #dcd7cc',
              borderRadius: '4px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              padding: 'clamp(0.85rem, 3.5vw, 2.25rem) clamp(0.75rem, 3vw, 1.75rem)',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: 1.5,
              fontSize: '11pt',
            }}
          >
            {/* Document Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: 'clamp(11pt, 3.5vw, 13pt)', textTransform: 'uppercase' }}>
                BAB IV DATA PENGAMATAN & PEMBAHASAN
              </div>
              <div style={{ fontSize: '9.5pt', color: '#555', fontStyle: 'italic', marginTop: '2px' }}>
                (Pratinjau Format Resmi Word SMKN 4 Bandar Lampung — {example.label})
              </div>
            </div>

            {/* Sub-heading */}
            <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '0.5rem' }}>
              4.1 {sk.judul}
            </div>

            {/* Paragraph 1 */}
            <p style={{ textIndent: 'clamp(0.4cm, 3vw, 1cm)', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              {sk.latar_belakang}
            </p>

            {/* Paragraph 2 - Process */}
            <p style={{ textIndent: 'clamp(0.4cm, 3vw, 1cm)', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              Prosedur pelaksanaan kegiatan ini meliputi langkah-langkah sistematis sebagai berikut:
            </p>

            <div style={{ paddingLeft: 'clamp(0.4cm, 3.5vw, 1.2cm)', marginBottom: '1rem', fontSize: '10.5pt' }}>
              {sk.proses_atau_formula.split('\n').map((line, lIdx) => (
                <div key={lIdx} style={{ marginBottom: '0.2rem' }}>
                  {line}
                </div>
              ))}
            </div>

            {/* Simulated Word Table */}
            <div style={{ margin: '1.2rem 0 1.5rem 0', overflowX: 'auto' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '0.35rem', textAlign: 'center' }}>
                {h.title}
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1.5px solid #000000',
                  fontSize: '10pt',
                  fontFamily: '"Times New Roman", serif',
                }}
              >
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center', width: '35px' }}>No</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>{h.label}</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>{h.awal}</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>{h.akhir}</th>
                  </tr>
                </thead>
                <tbody>
                  {sk.data_angka.map((d, dIdx) => (
                    <tr key={dIdx}>
                      <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'center' }}>{dIdx + 1}</td>
                      <td style={{ border: '1px solid #000000', padding: '5px 8px' }}>{d.label}</td>
                      <td style={{ border: '1px solid #000000', padding: '5px 8px' }}>{d.sebelum || d.nilai_awal || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '5px 8px', fontWeight: 'bold' }}>{d.sesudah || d.nilai_akhir || d.nilai || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paragraph 3 - Conclusion */}
            <p style={{ textIndent: 'clamp(0.4cm, 3vw, 1cm)', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              {sk.hasil}
            </p>

            {/* Image Figure Caption Mockup */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontStyle: 'italic', fontSize: '9.5pt' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  minHeight: '85px',
                  padding: '0.5rem',
                  margin: '0 auto 0.4rem',
                  border: '1px dashed #999',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  boxSizing: 'border-box',
                }}
              >
                [Gambar Dokumentasi Foto / Diagram Alat - {example.label}]
              </div>
              Gambar 4.1 Foto Pelaksanaan Kegiatan & Bukti Fisik
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div
          className="docx-modal-footer"
          style={{
            padding: '0.85rem 1.1rem',
            borderTop: '1px solid var(--line, #ddd6c8)',
            background: 'var(--surface, #fffdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Jurusan Aktif: <strong>{example.label}</strong>
          </div>
          <div className="docx-modal-footer-btns" style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn-outline" onClick={onClose}>
              Tutup Pratinjau
            </button>
            {onSelectJurusan && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleApply}
                style={{ fontWeight: 600 }}
              >
                ✓ Pilih Jurusan Ini ({example.badge})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
