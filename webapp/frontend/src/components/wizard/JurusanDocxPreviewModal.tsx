import { useState } from 'react'
import { JURUSAN_EXAMPLES, type JurusanExample } from '@/utils/jurusanExamples'

interface JurusanDocxPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  initialJurusanKey?: string
  onSelectJurusan?: (jurusanValue: string, jurusanKey: string) => void
}

const MAJOR_TABS = [
  { key: 'tkro', label: 'TKRO / Otomotif', icon: '🚗' },
  { key: 'akl', label: 'AKL / Akuntansi', icon: '📊' },
  { key: 'rpl', label: 'RPL / Software', icon: '💻' },
  { key: 'tkj', label: 'TKJ / Jaringan', icon: '🌐' },
  { key: 'bdp', label: 'BDP / Marketing', icon: '📈' },
  { key: 'mplb', label: 'MPLB / Perkantoran', icon: '📁' },
  { key: 'dkv', label: 'DKV / Desain', icon: '🎨' },
  { key: 'ph', label: 'PH / Tata Boga', icon: '🍽️' },
  { key: 'farmasi', label: 'Farmasi', icon: '💊' },
  { key: 'tei', label: 'TEI / Elektronika', icon: '⚡' },
]

export default function JurusanDocxPreviewModal({
  isOpen,
  onClose,
  initialJurusanKey = 'rpl',
  onSelectJurusan,
}: JurusanDocxPreviewModalProps) {
  const [activeKey, setActiveKey] = useState<string>(initialJurusanKey || 'rpl')

  if (!isOpen) return null

  const example: JurusanExample = JURUSAN_EXAMPLES[activeKey] || JURUSAN_EXAMPLES['rpl']
  const sk = example.studiKasus

  const handleApply = () => {
    if (onSelectJurusan) {
      onSelectJurusan(example.label, example.jurusan_key)
    }
    onClose()
  }

  return (
    <div
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
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          backgroundColor: 'var(--surface, #fffdf8)',
          border: '1px solid var(--line-strong, #b9b09c)',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--line, #ddd6c8)',
            background: 'var(--paper-2, #ece8de)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
              📄 Contoh Hasil Cetak Laporan Word (.docx) Setiap Jurusan
            </h3>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
              Klik tab jurusan di bawah untuk melihat contoh nyata lembar laporan & tabel data hasil akhir (.docx) per jurusan.
            </p>
          </div>
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={onClose}
            style={{ fontSize: '1.1rem', padding: '0.2rem 0.6rem' }}
          >
            ✕
          </button>
        </div>

        {/* Major Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.65rem 1rem',
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
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--green-700, #14614a)' : '1px solid var(--line, #ddd6c8)',
                  backgroundColor: isActive ? 'var(--green-600, #187257)' : 'var(--paper-2, #ece8de)',
                  color: isActive ? '#ffffff' : 'var(--ink-soft, #555)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Document Sheet Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: 'var(--paper, #f4f1ea)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Simulated A4 Word Document Page */}
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              minHeight: '620px',
              backgroundColor: '#ffffff',
              border: '1px solid #dcd7cc',
              borderRadius: '4px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              padding: '2.5cm 2cm 2cm 2.5cm', // Visual 4-3-3-3cm margin feel
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: 1.5,
              fontSize: '11pt',
            }}
          >
            {/* Document Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase' }}>
                BAB IV DATA PENGAMATAN & PEMBAHASAN
              </div>
              <div style={{ fontSize: '10pt', color: '#555', fontStyle: 'italic', marginTop: '2px' }}>
                (Pratinjau Format Resmi Word SMKN 4 — {example.label})
              </div>
            </div>

            {/* Sub-heading */}
            <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '0.5rem' }}>
              4.1 {sk.judul}
            </div>

            {/* Paragraph 1 */}
            <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              {sk.latar_belakang}
            </p>

            {/* Paragraph 2 - Process */}
            <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              Prosedur pelaksanaan kegiatan ini meliputi langkah-langkah sistematis sebagai berikut:
            </p>

            <div style={{ paddingLeft: '1.2cm', marginBottom: '1rem', fontSize: '10.5pt' }}>
              {sk.proses_atau_formula.split('\n').map((line, lIdx) => (
                <div key={lIdx} style={{ marginBottom: '0.2rem' }}>
                  {line}
                </div>
              ))}
            </div>

            {/* Simulated Word Table */}
            <div style={{ margin: '1.2rem 0 1.5rem 0' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '0.35rem', textAlign: 'center' }}>
                Tabel 4.1 Hasil Pengamatan & Data Pengukuran ({example.badge})
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
                    <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '40px' }}>No</th>
                    <th style={{ border: '1px solid #000000', padding: '6px 10px', textAlign: 'left' }}>Parameter / Nama Data</th>
                    <th style={{ border: '1px solid #000000', padding: '6px 10px', textAlign: 'left' }}>Nilai Hasil Pengukuran</th>
                  </tr>
                </thead>
                <tbody>
                  {sk.data_angka.map((d, dIdx) => (
                    <tr key={dIdx}>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>{dIdx + 1}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{d.label}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>{d.nilai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paragraph 3 - Conclusion */}
            <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '0 0 1rem 0' }}>
              {sk.hasil}
            </p>

            {/* Image Figure Caption Mockup */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontStyle: 'italic', fontSize: '9.5pt' }}>
              <div
                style={{
                  width: '60%',
                  height: '110px',
                  margin: '0 auto 0.4rem',
                  border: '1px dashed #999',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                }}
              >
                🖼️ [Gambar Dokumentasi Foto / Diagram Alat - {example.label}]
              </div>
              Gambar 4.1 Foto Pelaksanaan Kegiatan & Bukti Fisik
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
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
          <div style={{ display: 'flex', gap: '0.6rem' }}>
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
