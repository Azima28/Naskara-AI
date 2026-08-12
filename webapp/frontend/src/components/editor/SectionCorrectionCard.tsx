import React, { useState } from 'react'
import type { SectionErrorDetail } from '@/types/pkl'
import { IconAlert, IconSparkles, IconPencil, IconDocument } from '@/components/common/Icons'

export interface SectionCorrectionCardProps {
  sectionKey: string
  sectionTitle: string
  errorDetail: SectionErrorDetail
  draftId: string
  onApplyFallback: () => void
  onRegenerateSection: (customInstruction?: string) => Promise<void>
  onClearError: () => void
}

export const SectionCorrectionCard: React.FC<SectionCorrectionCardProps> = ({
  sectionTitle,
  errorDetail,
  draftId,
  onApplyFallback,
  onRegenerateSection,
  onClearError,
}) => {
  const [customInstruction, setCustomInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReGenerate = async () => {
    setLoading(true)
    try {
      await onRegenerateSection(customInstruction.trim() || undefined)
      onClearError()
    } catch {
      /* Error already handled by parent */
    } finally {
      setLoading(false)
    }
  }

  const wizardStep = errorDetail.wizard_step || 3
  const stepName =
    wizardStep === 1
      ? 'Identitas Siswa'
      : wizardStep === 2
      ? 'Profil Perusahaan'
      : wizardStep === 3
      ? 'Cerita Kegiatan & Refleksi'
      : wizardStep === 4
      ? 'Peralatan & Kendala'
      : 'Form Data Wizard'

  return (
    <div
      style={{
        background: 'var(--amber-50, #fffbeb)',
        borderLeft: '4px solid #d97706',
        borderRadius: '8px',
        padding: 'clamp(0.65rem, 2.5vw, 1rem)',
        marginTop: '0.5rem',
        marginBottom: '0.85rem',
        boxShadow: 'none',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Warning Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.45rem',
          marginBottom: '0.55rem',
          flexWrap: 'wrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <IconAlert size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <h4
          style={{
            margin: 0,
            fontSize: 'clamp(0.84rem, 2.8vw, 0.95rem)',
            color: 'var(--amber-800, #92400e)',
            fontWeight: 700,
            wordBreak: 'break-word',
            flex: 1,
            minWidth: 0,
            lineHeight: 1.35,
          }}
        >
          Petunjuk Perbaikan Input Sub-bab &lsquo;{sectionTitle}&rsquo;
        </h4>
      </div>

      {/* Message Explanation */}
      <p
        style={{
          margin: '0 0 0.65rem',
          fontSize: 'clamp(0.76rem, 2.2vw, 0.83rem)',
          color: 'var(--amber-900, #78350f)',
          lineHeight: 1.55,
          wordBreak: 'break-word',
        }}
      >
        {errorDetail.message ||
          'AI belum menghasilkan isi Laporan PKL yang sesuai dengan bagian ini. Silakan berikan instruksi yang lebih jelas terkait isi yang ingin dibuat atau diperbaiki.'}
      </p>

      {/* Raw Input Snippet */}
      {errorDetail.raw_input_snippet && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '0.45rem 0.65rem',
            fontSize: 'clamp(0.72rem, 2.1vw, 0.78rem)',
            color: '#451a03',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            marginBottom: '0.75rem',
            wordBreak: 'break-word',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <strong>Input Anda Sebelumnya:</strong> &quot;{errorDetail.raw_input_snippet}&quot;
        </div>
      )}

      {/* 3 Resolution Options Panel (Clean Flat Direct Layout - No Border inside Border) */}
      <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #fcd34d' }}>
        <strong style={{ fontSize: 'clamp(0.78rem, 2.3vw, 0.84rem)', color: '#92400e', display: 'block', marginBottom: '0.65rem' }}>
          Pilih 1 dari 3 Cara Penyelesaian Berikut:
        </strong>

        {/* Option A: Inline Re-prompt Fix */}
        <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed #fcd34d' }}>
          <label style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.8rem)', fontWeight: 700, color: '#1c1917', display: 'block', marginBottom: '0.35rem', wordBreak: 'break-word' }}>
            Opsi 1: Tulis Ulang Teks / Instruksi Tambahan (Inline)
          </label>
          <textarea
            rows={2}
            placeholder="Ketik draf kalimat kegiatan PKL Anda di sini (contoh: Saya membantu melakukan perbaikan PC di divisi IT)..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            style={{
              width: '100%',
              fontSize: 'clamp(0.76rem, 2.2vw, 0.83rem)',
              padding: '0.45rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              marginBottom: '0.45rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          <button
            type="button"
            onClick={handleReGenerate}
            disabled={loading}
            className="btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)',
              fontWeight: 700,
              width: '100%',
              padding: '0.45rem 0.8rem',
              borderRadius: '6px',
              background: 'var(--green-600, #187257)',
              color: '#ffffff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxSizing: 'border-box',
            }}
          >
            <IconSparkles size={14} style={{ flexShrink: 0 }} /> {loading ? 'Memproses AI...' : 'Generate Ulang Sub-bab Ini'}
          </button>
        </div>

        {/* Option B: Jump Back to Wizard Form */}
        <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed #fcd34d' }}>
          <label style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.8rem)', fontWeight: 700, color: '#1c1917', display: 'block', marginBottom: '0.35rem', wordBreak: 'break-word' }}>
            Opsi 2: Edit Sumber Data Utama di Form Wizard
          </label>
          <a
            href={`/wizard/${draftId}?step=${wizardStep}`}
            className="btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)',
              fontWeight: 700,
              color: '#b45309',
              background: '#fef3c7',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 0.8rem',
              textDecoration: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <IconPencil size={14} style={{ flexShrink: 0 }} /> Kembali ke Form Wizard (Langkah {wizardStep}: {stepName})
          </a>
        </div>

        {/* Option C: Explicit Academic Fallback Trigger */}
        <div>
          <label style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.8rem)', fontWeight: 700, color: '#1c1917', display: 'block', marginBottom: '0.35rem', wordBreak: 'break-word' }}>
            Opsi 3: Gunakan Templat Baku Akademik Jurusan (Fallback Rekomendasi SMKN4)
          </label>
          <button
            type="button"
            onClick={() => {
              onApplyFallback()
              onClearError()
            }}
            className="btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)',
              fontWeight: 700,
              color: '#475569',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 0.8rem',
              width: '100%',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <IconDocument size={14} style={{ flexShrink: 0 }} /> Gunakan Templat Baku Akademik
          </button>
        </div>
      </div>
    </div>
  )
}
