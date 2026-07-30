import { useState, useEffect, useRef } from 'react'
import { draftSection, updateDraft } from '@/api/client'
import type { PklContext } from '@/types/pkl'
import { IconSparkles, IconCheck, IconAlert } from '@/components/common/Icons'

const ARRAY_SECTION_KEYS = [
  'tujuan',
  'tujuan_pkl',
  'manfaat',
  'kesimpulan',
  'saran',
  'rumusan_masalah',
  'kesimpulan_saran',
]

export interface SectionDef {
  key: string
  title: string
}

export interface BatchGenerateModalProps {
  isOpen: boolean
  draftId: string
  ctx: PklContext
  sections: SectionDef[]
  onUpdateCtx: (updatedCtx: PklContext) => void
  onClose: () => void
}

type SectionStatus = 'pending' | 'generating' | 'success' | 'failed'

export default function BatchGenerateModal({
  isOpen,
  draftId,
  ctx,
  sections,
  onUpdateCtx,
  onClose,
}: BatchGenerateModalProps) {
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [streamText, setStreamText] = useState<string>('')
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isFinished, setIsFinished] = useState<boolean>(false)

  const isCancelledRef = useRef<boolean>(false)
  const streamIntervalRef = useRef<any>(null)

  // Initialize status on modal open
  useEffect(() => {
    if (isOpen) {
      const initialStatuses: Record<string, SectionStatus> = {}
      sections.forEach((sec) => {
        const existing = ctx.generated_sections?.[sec.key]
        if (existing && (Array.isArray(existing) ? existing.length > 0 : !!existing.trim())) {
          initialStatuses[sec.key] = 'success'
        } else {
          initialStatuses[sec.key] = 'pending'
        }
      })
      setStatuses(initialStatuses)
      setActiveKey(null)
      setStreamText('')
      setErrorMessages({})
      setIsGenerating(false)
      setIsFinished(false)
      isCancelledRef.current = false
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
    }
  }, [isOpen, sections, ctx])

  if (!isOpen) return null

  const total = sections.length
  const successCount = Object.values(statuses).filter((s) => s === 'success').length
  const failedCount = Object.values(statuses).filter((s) => s === 'failed').length
  const completedCount = successCount + failedCount
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

  // Gate Check: At least 3 sections must succeed
  const meetsMinGate = successCount >= 3

  const startBatchGeneration = async () => {
    setIsGenerating(true)
    setIsFinished(false)
    isCancelledRef.current = false

    let currentCtx = { ...ctx }

    for (let i = 0; i < sections.length; i++) {
      if (isCancelledRef.current) break

      const sec = sections[i]
      setActiveKey(sec.key)
      setStatuses((prev) => ({ ...prev, [sec.key]: 'generating' }))
      setStreamText(`✨ Penyusun AI sedang menyiapkan konteks untuk bagian "${sec.title}"...\n`)

      try {
        // Call AI draftSection API
        const res = await draftSection(sec.key, currentCtx)
        const rawContent = res.content || ''

        // Simulate streaming typing effect into live preview box
        await new Promise<void>((resolve) => {
          let charIndex = 0
          const chunkSize = Math.max(3, Math.floor(rawContent.length / 25))
          setStreamText('')

          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)

          streamIntervalRef.current = setInterval(() => {
            if (isCancelledRef.current) {
              clearInterval(streamIntervalRef.current)
              resolve()
              return
            }
            charIndex += chunkSize
            if (charIndex >= rawContent.length) {
              setStreamText(rawContent)
              clearInterval(streamIntervalRef.current)
              resolve()
            } else {
              setStreamText(rawContent.slice(0, charIndex) + '▌')
            }
          }, 20)
        })

        // Process output for array type sections
        let parsedContent: string | string[] = rawContent
        if (ARRAY_SECTION_KEYS.includes(sec.key)) {
          parsedContent = rawContent
            .split('\n')
            .map((s) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
            .filter(Boolean)
        }

        // Update context & trigger autosave
        currentCtx = {
          ...currentCtx,
          generated_sections: {
            ...(currentCtx.generated_sections || {}),
            [sec.key]: parsedContent,
          },
        }

        onUpdateCtx(currentCtx)
        setStatuses((prev) => ({ ...prev, [sec.key]: 'success' }))

        // Autosave draft to backend
        try {
          await updateDraft(draftId, { data: currentCtx })
        } catch (saveErr) {
          console.warn('[BatchGenerate] Failed intermediate save:', saveErr)
        }

      } catch (err: any) {
        const detail = err?.response?.data?.detail
        const msg = typeof detail === 'string'
          ? detail
          : detail?.message || err?.message || 'Sistem AI timeout / offline.'

        setErrorMessages((prev) => ({ ...prev, [sec.key]: msg }))
        setStatuses((prev) => ({ ...prev, [sec.key]: 'failed' }))
        setStreamText(`❌ Gagal menyusun "${sec.title}": ${msg}`)
      }
    }

    setActiveKey(null)
    setIsGenerating(false)
    setIsFinished(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Decorative Bar */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #187257 0%, #059669 50%, #3b82f6 100%)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem 1rem',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconSparkles size={22} color="#059669" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Generasi Realtime AI Sub-bab Laporan
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  Menyusun seluruh draf naratif sub-bab secara otomatis &amp; akurat 1 per 1 (KBBI Akademis).
                </p>
              </div>
            </div>

            {/* Progress Badge */}
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: meetsMinGate ? '#059669' : isFinished ? '#dc2626' : '#187257',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: meetsMinGate ? '#ecfdf5' : isFinished ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${meetsMinGate ? '#a7f3d0' : isFinished ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                {successCount} / {total} Sub-bab Selesai
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                height: '8px',
                width: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: meetsMinGate ? '#059669' : isFinished ? '#dc2626' : '#187257',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body: 2 Columns (Sub-sections List + Live Stream Box) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 0 }}>
          {/* Left Column: Sub-bab Checklist Status */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRight: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              overflowY: 'auto',
              maxHeight: '440px',
            }}
          >
            <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daftar Sub-bab ({sections.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {sections.map((sec, idx) => {
                const status = statuses[sec.key] || 'pending'
                const isActive = activeKey === sec.key

                return (
                  <div
                    key={sec.key}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#ffffff' : '#ffffff',
                      border: `1px solid ${
                        isActive
                          ? '#059669'
                          : status === 'success'
                          ? '#a7f3d0'
                          : status === 'failed'
                          ? '#fecaca'
                          : '#e2e8f0'
                      }`,
                      boxShadow: isActive ? '0 0 0 2px rgba(5, 150, 105, 0.15)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#64748b',
                          width: '20px',
                          textAlign: 'center',
                        }}
                      >
                        {idx + 1}.
                      </span>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#0f172a' : '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={sec.title}
                      >
                        {sec.title}
                      </span>
                    </div>

                    {/* Status Badge Icon */}
                    <div style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                      {status === 'generating' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                          <svg className="animate-spin" style={{ width: '15px', height: '15px', marginRight: '4px' }} viewBox="0 0 24 24" fill="none">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Proses...
                        </span>
                      )}
                      {status === 'success' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                          <IconCheck size={16} color="#059669" style={{ marginRight: '2px' }} /> Selesai
                        </span>
                      )}
                      {status === 'failed' && (
                        <span
                          title={errorMessages[sec.key] || 'Gagal'}
                          style={{ display: 'inline-flex', alignItems: 'center', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'help' }}
                        >
                          <IconAlert size={15} color="#dc2626" style={{ marginRight: '2px' }} /> Gagal
                        </span>
                      )}
                      {status === 'pending' && (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>⏳ Menunggu</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Real-time Streaming Terminal Preview */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '440px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isGenerating ? '#22c55e' : '#64748b' }} />
                <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#94a3b8', textTransform: 'uppercase' }}>
                  {isGenerating ? 'LIVE AI STREAMING LOG' : isFinished ? 'STREAMING SELESAI' : 'SIAP GENERATE'}
                </span>
              </div>
              {activeKey && (
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                  [{activeKey}]
                </span>
              )}
            </div>

            {/* Stream Box Content */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#020617',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            >
              {!isGenerating && !isFinished && (
                <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '3rem' }}>
                  <IconSparkles size={32} color="#475569" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0 }}>Klik <strong>"Mulai Generasi Realtime"</strong> di bawah untuk menyusun seluruh sub-bab laporan sekaligus.</p>
                </div>
              )}

              {(isGenerating || isFinished) && (streamText || 'Menyiapkan respon AI...')}
            </div>
          </div>
        </div>

        {/* Gate Validation Banner & Action Footer */}
        <div
          style={{
            padding: '1rem 1.75rem 1.25rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Left Notification Message */}
          <div style={{ flex: 1 }}>
            {isFinished && !meetsMinGate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
                <IconAlert size={18} color="#dc2626" />
                <span>
                  Generasi Gagal: Hanya {successCount} dari {total} sub-bab yang berhasil dibuat. Minimal 3 sub-bab harus berhasil diselesaikan. Silakan periksa koneksi AI Anda lalu klik "Coba Lagi".
                </span>
              </div>
            )}

            {isFinished && meetsMinGate && failedCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.88rem', fontWeight: 600 }}>
                <IconAlert size={18} color="#d97706" />
                <span>
                  {successCount} dari {total} sub-bab berhasil disusun AI ({failedCount} gagal). Anda tetap dapat mengedit draf dan mencoba regenerate bagian tersebut secara terpisah di editor.
                </span>
              </div>
            )}

            {isFinished && meetsMinGate && failedCount === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.88rem', fontWeight: 600 }}>
                <IconCheck size={18} color="#059669" />
                <span>
                  Seluruh {total} sub-bab berhasil disusun AI 100% sempurna! Klik tombol di samping untuk melanjutkan penyuntingan.
                </span>
              </div>
            )}

            {!isFinished && !isGenerating && (
              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Tekan tombol di samping untuk memulai alur penyusunan otomatis.
              </span>
            )}

            {isGenerating && (
              <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 600 }}>
                ⚡ Sedang memproses... Harap tidak menutup popup sampai selesai.
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            {(!isGenerating || isFinished) && (
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
                disabled={isGenerating}
                style={{ fontSize: '0.9rem', padding: '0.6rem 1.1rem', borderRadius: '8px' }}
              >
                {isFinished && meetsMinGate ? 'Tutup' : 'Batal'}
              </button>
            )}

            {!isGenerating && (!isFinished || !meetsMinGate) && (
              <button
                type="button"
                className="btn-primary"
                onClick={startBatchGeneration}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  backgroundColor: '#187257',
                  borderColor: '#14614a',
                }}
              >
                <IconSparkles size={16} style={{ marginRight: '0.4rem' }} />
                {isFinished ? 'Coba Lagi Generasi Batch' : 'Mulai Generasi Realtime'}
              </button>
            )}

            {isFinished && meetsMinGate && (
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  padding: '0.65rem 1.4rem',
                  borderRadius: '8px',
                  backgroundColor: '#059669',
                  borderColor: '#047857',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                }}
              >
                Selesai &amp; Buka Editor Laporan →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
