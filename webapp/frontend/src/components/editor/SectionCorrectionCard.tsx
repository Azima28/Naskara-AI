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
        background: '#fffbe6',
        border: '1.5px solid #ffe58f',
        borderRadius: '10px',
        padding: '16px',
        marginTop: '12px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(250, 173, 20, 0.08)',
      }}
    >
      {/* Warning Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <IconAlert size={20} color="#d46b08" />
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#d46b08', fontWeight: 800 }}>
          💡 Petunjuk Perbaikan Input Sub-bab '{sectionTitle}'
        </h4>
      </div>

      {/* Message Explanation */}
      <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: '#873800', lineHeight: 1.5 }}>
        {errorDetail.message ||
          'Sistem AI menolak input ini karena terdeteksi mengandung obrolan santai atau di luar kegiatan PKL.'}
      </p>

      {/* Raw Input Snippet */}
      {errorDetail.raw_input_snippet && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ffd591',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            color: '#595959',
            fontFamily: 'monospace',
            marginBottom: '14px',
            wordBreak: 'break-word',
          }}
        >
          <strong>Input Anda Sebelumnya:</strong> &quot;{errorDetail.raw_input_snippet}&quot;
        </div>
      )}

      {/* 3 Resolution Options Panel */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #ffe58f', padding: '12px' }}>
        <strong style={{ fontSize: '0.84rem', color: '#d46b08', display: 'block', marginBottom: '8px' }}>
          Pilih 1 dari 3 Cara Penyelesaian Berikut:
        </strong>

        {/* Option A: Inline Re-prompt Fix */}
        <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #ffe58f' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#262626', display: 'block', marginBottom: '4px' }}>
            Opsi 1: Tulis Ulang Teks / Instruksi Tambahan (Inline)
          </label>
          <textarea
            rows={2}
            placeholder="Ketik draf kalimat kegiatan PKL Anda di sini (contoh: Saya membantu melakukan perbaikan PC di divisi IT)..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.82rem',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              marginBottom: '6px',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={handleReGenerate}
            disabled={loading}
            className="btn btn--primary btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <IconSparkles size={14} /> {loading ? 'Memproses AI...' : 'Generate Ulang Sub-bab Ini'}
          </button>
        </div>

        {/* Option B: Jump Back to Wizard Form */}
        <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #ffe58f' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#262626', display: 'block', marginBottom: '4px' }}>
            Opsi 2: Edit Sumber Data Utama di Form Wizard
          </label>
          <a
            href={`/wizard/${draftId}?step=${wizardStep}`}
            className="btn btn--outline btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none', color: '#d46b08', borderColor: '#ffd591' }}
          >
            <IconPencil size={14} /> Kembali ke Form Wizard (Langkah {wizardStep}: {stepName})
          </a>
        </div>

        {/* Option C: Explicit Academic Fallback Trigger */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#262626', display: 'block', marginBottom: '4px' }}>
            Opsi 3: Gunakan Templat Baku Akademik Jurusan (Fallback Rekomendasi SMKN4)
          </label>
          <button
            type="button"
            onClick={() => {
              onApplyFallback()
              onClearError()
            }}
            className="btn btn--secondary btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <IconDocument size={14} /> Gunakan Templat Baku Akademik
          </button>
        </div>
      </div>
    </div>
  )
}
