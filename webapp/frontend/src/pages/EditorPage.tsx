import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getDraft, updateDraft, generateDocx, draftSection, regenerateSection, enhanceContext } from '@/api/client'
import AntiAIHighlighter from '@/components/editor/AntiAIHighlighter'
import EnhancementDiffModal from '@/components/editor/EnhancementDiffModal'
import DocumentOutline from '@/components/editor/DocumentOutline'
import RequestionPanel, { type GenerateIssue, type Requestion } from '@/components/RequestionPanel'
import NotificationModal from '@/components/common/NotificationModal'
import BatchGenerateModal from '@/components/editor/BatchGenerateModal'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'
import { IconDocument, IconDownload, IconSparkles, IconAlert, IconPencil } from '@/components/common/Icons'

const ARRAY_SECTION_KEYS = [
  'tujuan',
  'tujuan_pkl',
  'manfaat',
  'kesimpulan',
  'saran',
  'rumusan_masalah',
  'kesimpulan_saran',
]

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <EditorInner />
    </ProtectedRoute>
  )
}

function EditorInner() {
  const { draftId } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const [ctx, setCtx] = useState<PklContext>(emptyContext())
  const [title, setTitle] = useState('Laporan PKL')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const dirtyRef = useRef(false)

  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const draftIdRef = useRef(draftId)
  draftIdRef.current = draftId

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const savingPromiseRef = useRef<Promise<any> | null>(null)

  const [downloading, setDownloading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [genError, setGenError] = useState('')
  const [genIssues, setGenIssues] = useState<GenerateIssue[]>([])
  const [genQuestions, setGenQuestions] = useState<Requestion[]>([])
  const [polishNotice, setPolishNotice] = useState('')

  // Batch Generation Modal State
  const [showBatchModal, setShowBatchModal] = useState(false)

  // Notification Modal State
  const [modal, setModal] = useState<{ isOpen: boolean; title?: string; message: string; type?: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    message: '',
  })

  const showErrorModal = (msg: string, title?: string) => {
    setModal({
      isOpen: true,
      title: title || 'Informasi Layanan AI',
      message: msg,
      type: 'error',
    })
  }

  // Diff Modal State
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [pendingEnhancedCtx, setPendingEnhancedCtx] = useState<PklContext | null>(null)
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>(undefined)

  // Auto-open Batch Modal if ?batch=true parameter is present
  useEffect(() => {
    if (searchParams.get('batch') === 'true') {
      setShowBatchModal(true)
    }
  }, [searchParams])

  const flushSave = useCallback(async (extraStatus: string = 'completed') => {
    if (savingPromiseRef.current) {
      try {
        await savingPromiseRef.current
      } catch {
        /* ignore prior save errors */
      }
    }
    if (loadingRef.current || !dirtyRef.current || !draftIdRef.current) return

    setSaveState('saving')
    const promise = updateDraft(draftIdRef.current, {
      data: ctxRef.current,
      status: extraStatus,
    })
      .then((updated) => {
        setCtx(updated.data)
        setSaveState('saved')
        dirtyRef.current = false
      })
      .catch((err) => {
        setSaveState('idle')
        throw err
      })
      .finally(() => {
        savingPromiseRef.current = null
      })

    savingPromiseRef.current = promise
    await promise
  }, [])

  // Load draft
  useEffect(() => {
    if (!draftId) return
    setLoading(true)
    getDraft(draftId)
      .then((d) => {
        setCtx(d.data)
        setTitle(d.title)
        dirtyRef.current = false
      })
      .finally(() => setLoading(false))
  }, [draftId])

  // Autosave
  useEffect(() => {
    if (loading || !dirtyRef.current || !draftId) return
    setSaveState('saving')
    const t = setTimeout(() => {
      flushSave('completed')
    }, 2000)
    return () => clearTimeout(t)
  }, [ctx, draftId, loading, flushSave])

  // Unmount & page leave cleanup
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (dirtyRef.current && draftIdRef.current && !loadingRef.current) {
        updateDraft(draftIdRef.current, { data: ctxRef.current, status: 'completed' })
      }
    }
  }, [])

  const handleManualSave = async () => {
    if (!draftId || loading) return
    dirtyRef.current = true
    await flushSave('completed')
  }

  const handleBackToWizard = async () => {
    await flushSave('completed')
    nav(`/wizard/${draftId}`)
  }

  const updateSection = useCallback((key: string, content: string | string[]) => {
    setCtx((prev) => {
      const gen = prev.generated_sections || {}
      return { ...prev, generated_sections: { ...gen, [key]: content } }
    })
    dirtyRef.current = true
    setGenError('')
    setGenIssues([])
    setGenQuestions([])
  }, [])

  const handleSelectSection = (key: string) => {
    setActiveSectionKey(key)
    const el = document.getElementById(`section-${key}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Memuat editor laporan…</p>
      </div>
    )
  }

  // Determine section list
  const sections = buildSectionList(ctx)

  // Count sections that have non-empty content
  const generatedCount = Object.keys(ctx.generated_sections || {}).filter((k) => {
    const v = ctx.generated_sections?.[k]
    return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
  }).length

  // Lock gate: at least 3 sections must be generated to unlock individual section editors and document download
  const isUnlocked = generatedCount >= 3

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__row">
          <h1>
            <button
              type="button"
              onClick={handleBackToWizard}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              ← Kembali ke Form Data
            </button>{' '}
            &nbsp;|&nbsp; Review &amp; Edit: {title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => setShowBatchModal(true)}
              style={{ fontSize: '0.82rem', padding: '0.38rem 0.8rem', background: '#187257' }}
            >
              <IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Generate Semua Sub-bab Laporan
            </button>
            <button
              type="button"
              className="btn-sm btn-outline"
              onClick={handleManualSave}
              disabled={saveState === 'saving'}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.7rem' }}
            >
              <IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Simpan Draf
            </button>
            <span className="save-indicator">
              {saveState === 'saving' && 'menyimpan draf…'}
              {saveState === 'saved' && 'tersimpan ✓'}
            </span>
          </div>
        </div>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Gunakan AI untuk menyusun draf naratif tiap bagian laporan secara akademis (KBBI). Kamu bisa menyunting hasilnya secara langsung.
        </p>
      </header>

      <div className="editor-grid">
        {/* Editor Main Content */}
        <div className="editor-sections">
          {/* Lock Banner when generated_sections count is less than 3 */}
          {!isUnlocked && (
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconDocument size={24} color="#475569" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>
                    Editor Terkunci — Jalankan Penyusunan Sub-bab Pertama Kali
                  </h3>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Untuk memastikan kelengkapan dokumen, jalankan penyusunan draf terlebih dahulu. Pintu editor dan unduhan dokumen Word akan terbuka secara otomatis setelah minimal 3 sub-bab berhasil disusun.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowBatchModal(true)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.92rem',
                    backgroundColor: '#187257',
                    borderColor: '#14614a',
                  }}
                >
                  <IconDocument size={16} style={{ marginRight: '0.4rem' }} /> Generate Semua Sub-bab Laporan
                </button>
              </div>
            </div>
          )}

          {sections.map((sec) => (
            <div id={`section-${sec.key}`} key={sec.key}>
              <SectionEditor
                sectionKey={sec.key}
                title={sec.title}
                ctx={ctx}
                value={(ctx.generated_sections || {})[sec.key] || ''}
                onChange={(val) => updateSection(sec.key, val)}
                onError={showErrorModal}
                disabled={!isUnlocked}
              />
            </div>
          ))}
          {sections.length === 0 && (
            <div className="card">
              <p className="muted">Belum ada bagian yang dikonfigurasi untuk laporan ini.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Finalisasi & Structure Outline */}
        <div className="editor-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Panel Finalisasi */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>Finalisasi Laporan</h3>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Kemajuan Draf Sub-bab</span>
                <strong>{Object.keys(ctx.generated_sections || {}).length} / {sections.length}</strong>
              </div>
              <div className="completeness__bar">
                <div
                  className="completeness__fill is-ready"
                  style={{ width: `${sections.length > 0 ? (Object.keys(ctx.generated_sections || {}).length / sections.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                fontSize: '0.98rem',
                fontWeight: 600,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                background: 'var(--green-600, #187257)',
                color: '#ffffff',
                border: '1px solid var(--green-700, #14614a)',
                cursor: downloading || !isUnlocked ? 'not-allowed' : 'pointer',
                opacity: !isUnlocked ? 0.5 : 1,
                boxShadow: '0 2px 6px rgba(24, 114, 87, 0.25)',
                marginBottom: '1rem',
              }}
              disabled={downloading || !isUnlocked}
              onClick={async () => {
                if (!draftId) return
                setDownloading(true)
                setGenError('')
                setGenIssues([])
                setGenQuestions([])
                try {
                  await flushSave('completed')
                  const notice = await generateDocx(draftId)
                  setPolishNotice(notice || '')
                } catch (err: any) {
                  const detail = err?.detail || err?.response?.data?.detail
                  if (detail && typeof detail === 'object' && ((detail.issues && detail.issues.length > 0) || (detail.requestions && detail.requestions.length > 0))) {
                    setGenError(detail.message || 'Data belum lengkap. Isi field WAJIB terlebih dahulu.')
                    setGenIssues(detail.issues || [])
                    setGenQuestions(detail.requestions || [])
                  } else {
                    const msg = typeof detail === 'string'
                      ? detail
                      : detail?.message || err?.message || 'Terjadi kendala saat menyusun dokumen.'
                    setGenError(msg)
                    setGenIssues([])
                    setGenQuestions([])
                  }
                } finally {
                  setDownloading(false)
                }
              }}
            >
              {downloading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="animate-spin" style={{ width: '18px', height: '18px', marginRight: '8px' }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyusun dokumen Word…
                </span>
              ) : (
                <>
                  <IconDownload size={18} style={{ marginRight: '0.4rem' }} /> Download .docx (Siap Cetak)
                </>
              )}
            </button>

            <div style={{ padding: '0.75rem 0.85rem', background: 'var(--paper-2, #ece8de)', borderRadius: '8px', border: '1px solid var(--line, #ddd6c8)' }}>
              <button
                type="button"
                className="btn-outline"
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 0.75rem',
                  opacity: !isUnlocked ? 0.5 : 1,
                  cursor: !isUnlocked ? 'not-allowed' : 'pointer',
                }}
                disabled={enhancing || downloading || !isUnlocked}
                onClick={async () => {
                  if (!draftId) return
                  setEnhancing(true)
                  try {
                    const res = await enhanceContext(ctx)
                    setPendingEnhancedCtx(res.context_data)
                    setShowDiffModal(true)
                  } catch (err: any) {
                    const detail = err?.response?.data?.detail
                    const msg = typeof detail === 'string'
                      ? detail
                      : detail?.message || err?.message || 'Gagal merapikan data via AI.'
                    showErrorModal(msg)
                  } finally {
                    setEnhancing(false)
                  }
                }}
              >
                {enhancing ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="animate-spin" style={{ width: '14px', height: '14px', marginRight: '6px' }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Merapikan Bahasa…
                  </span>
                ) : (
                  <>
                    <IconSparkles size={16} style={{ marginRight: '0.4rem' }} /> Rapikan Bahasa Teks via AI (Opsional)
                  </>
                )}
              </button>
            </div>

            {genError && (
              genIssues.length > 0 || genQuestions.length > 0 ? (
                <RequestionPanel
                  message={genError}
                  issues={genIssues}
                  requestions={genQuestions}
                  draftId={draftId}
                />
              ) : (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--red-50, #fef2f2)',
                    border: '1px solid var(--red-200, #fecaca)',
                    borderRadius: '8px',
                  }}
                >
                  <strong style={{ color: 'var(--red-700, #b91c1c)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <IconAlert size={16} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> {genError}
                  </strong>
                  {genError.toLowerCase().includes('data belum lengkap') || genError.toLowerCase().includes('wajib') ? (
                    <>
                      <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                        Beberapa field wajib pada form data belum terisi lengkap. Klik tombol di bawah untuk melengkapinya.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.85rem',
                          background: 'var(--red-600, #dc2626)',
                          borderColor: 'var(--red-700, #b91c1c)',
                          color: '#ffffff',
                          fontWeight: 600,
                        }}
                        onClick={() => nav(`/wizard/${draftId}`)}
                      >
                        Buka Form Data untuk Melengkapi →
                      </button>
                    </>
                  ) : (
                    <p className="muted" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.4 }}>
                      Terjadi kendala saat menyusun dokumen. Silakan periksa koneksi atau coba klik tombol Download sekali lagi.
                    </p>
                  )}
                </div>
              )
            )}

            {polishNotice && (
              <p
                style={{
                  color: 'var(--amber-700, #b45309)',
                  background: 'var(--amber-50, #fffbeb)',
                  border: '1px solid var(--amber-200, #fde68a)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.8rem',
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                <IconAlert size={16} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> {polishNotice}
              </p>
            )}
          </div>

          {/* Document Outline Sidebar */}
          <DocumentOutline
            ctx={ctx}
            activeSectionKey={activeSectionKey}
            onSelectSection={handleSelectSection}
          />
        </div>
      </div>

      {/* Diff Review Modal */}
      {showDiffModal && pendingEnhancedCtx && (
        <EnhancementDiffModal
          oldCtx={ctx}
          newCtx={pendingEnhancedCtx}
          onApply={async (finalCtx) => {
            setCtx(finalCtx)
            setShowDiffModal(false)
            if (draftId) {
              setSaveState('saving')
              try {
                await updateDraft(draftId, { data: finalCtx, status: 'completed' })
                setSaveState('saved')
                dirtyRef.current = false
              } catch {
                setSaveState('idle')
              }
            }
          }}
          onCancel={() => {
            setShowDiffModal(false)
          }}
        />
      )}

      {/* Notification Pop-up Modal */}
      <NotificationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Batch AI Realtime Stream Generation Modal */}
      <BatchGenerateModal
        isOpen={showBatchModal}
        draftId={draftId || ''}
        ctx={ctx}
        sections={sections}
        onUpdateCtx={(updatedCtx) => {
          setCtx(updatedCtx)
          dirtyRef.current = true
        }}
        onClose={() => setShowBatchModal(false)}
      />
    </div>
  )
}

export function buildSectionList(ctx: PklContext) {
  const bab = ctx.config?.bab_modules || []
  const list: { key: string; title: string }[] = []

  // BAB I PENDAHULUAN — termasuk profil perusahaan (sub-bab 1.3-1.6)
  if (bab.length === 0 || bab.includes('PENDAHULUAN')) {
    list.push({ key: 'latar_belakang', title: 'Latar Belakang (1.1)' })
    list.push({ key: 'tujuan_pkl', title: 'Tujuan PKL (1.2)' })
    list.push({ key: 'profil_sejarah', title: 'Sejarah Singkat Perusahaan (1.3)' })
    list.push({ key: 'narasi_struktur', title: 'Narasi Struktur Organisasi (1.5)' })
  }
  if (bab.length === 0 || bab.includes('LANDASAN_TEORI') || bab.includes('TINJAUAN_PUSTAKA')) {
    list.push({ key: 'landasan_teori', title: 'Landasan Teori (BAB III)' })
  }
  if (bab.includes('PELAKSANAAN') || bab.includes('KEGIATAN_INDUSTRI') || bab.includes('DATA_PENGAMATAN')) {
    const kegiatan = ctx.kegiatan || []
    kegiatan.forEach((k) => {
      if (k.bidang) {
        list.push({
          key: `kegiatan_${k.bidang.toLowerCase().replace(/\s+/g, '_')}_intro`,
          title: `Pengantar Kegiatan: ${k.bidang}`,
        })
      }
    })
    if (ctx.studi_kasus?.judul) {
      list.push({ key: 'studi_kasus_proses', title: `Proses: ${ctx.studi_kasus.judul}` })
    }
  }
  if (bab.length === 0 || bab.includes('PEMBAHASAN')) {
    list.push({ key: 'pembahasan', title: 'Pembahasan & Analisis (BAB V)' })
  }
  if (bab.length === 0 || bab.includes('PENUTUP') || bab.includes('KESIMPULAN_SARAN')) {
    list.push({ key: 'kesimpulan_saran', title: 'Kesimpulan dan Saran (BAB VI)' })
  }

  if (list.length === 0) {
    list.push(
      { key: 'latar_belakang', title: 'Latar Belakang (1.1)' },
      { key: 'tujuan_pkl', title: 'Tujuan PKL (1.2)' },
      { key: 'profil_sejarah', title: 'Sejarah Singkat Perusahaan (1.3)' },
      { key: 'narasi_struktur', title: 'Narasi Struktur Organisasi (1.5)' },
      { key: 'landasan_teori', title: 'Landasan Teori (BAB III)' },
      { key: 'pembahasan', title: 'Pembahasan & Analisis (BAB V)' },
      { key: 'kesimpulan_saran', title: 'Kesimpulan dan Saran (BAB VI)' }
    )
  }

  return list
}

// --------------------------------------------------------------------------- //
//  Section Editor Component
// --------------------------------------------------------------------------- //
function SectionEditor({
  sectionKey,
  title,
  ctx,
  value,
  onChange,
  onError,
  disabled = false,
}: {
  sectionKey: string
  title: string
  ctx: PklContext
  value: string | string[]
  onChange: (val: any) => void
  onError?: (msg: string) => void
  disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [regen, setRegen] = useState(false)
  const [instruction, setInstruction] = useState('')

  const isArrayType = ARRAY_SECTION_KEYS.includes(sectionKey)

  // Format value into text
  const textValue = Array.isArray(value)
    ? value.map((v) => `- ${v}`).join('\n')
    : (value as string)

  const handleGenerate = async () => {
    if (disabled) return
    setLoading(true)
    try {
      const res = await draftSection(sectionKey, ctx)
      if (isArrayType) {
        const arr = res.content
          .split('\n')
          .map((s) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
          .filter(Boolean)
        onChange(arr)
      } else {
        onChange(res.content)
      }
    } catch (err: any) {
      const d = err?.response?.data?.detail
      const msg = (d && typeof d === 'object' ? d.message : d) || err?.message || 'Gagal membuat draf AI'
      if (onError) onError(msg)
      else alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (disabled || !instruction) {
      setRegen(false)
      return
    }
    setLoading(true)
    try {
      const res = await regenerateSection(textValue, instruction)
      if (isArrayType) {
        const arr = res.content
          .split('\n')
          .map((s) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
          .filter(Boolean)
        onChange(arr)
      } else {
        onChange(res.content)
      }
      setInstruction('')
      setRegen(false)
    } catch (err: any) {
      const d = err?.response?.data?.detail
      const msg = (d && typeof d === 'object' ? d.message : d) || err?.message || 'Gagal memperbarui draf'
      if (onError) onError(msg)
      else alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem', opacity: disabled ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {!textValue && !loading && (
          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={handleGenerate}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            Tulis Draf Individu
          </button>
        )}
      </div>

      {loading && <p className="muted">Penyusun AI sedang menulis draf naratif…</p>}

      {!loading && textValue && (
        <>
          <textarea
            className="input"
            rows={Math.max(5, textValue.split('\n').length + 1)}
            value={textValue}
            disabled={disabled}
            onChange={(e) => {
              if (isArrayType) {
                const lines = e.target.value.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean)
                onChange(lines)
              } else {
                onChange(e.target.value)
              }
            }}
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, opacity: disabled ? 0.7 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {!regen ? (
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => setRegen(true)}
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <IconPencil size={14} style={{ marginRight: '0.3rem' }} /> Perbaiki &amp; Tulis Ulang
              </button>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  disabled={disabled}
                  style={{ flex: 1, padding: '0.35rem 0.6rem' }}
                  placeholder="Instruksi: contoh 'Lebih padat', 'Gunakan istilah TKJ yang baku'"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                />
                <button type="button" className="btn-sm" onClick={handleRegenerate} disabled={disabled}>
                  Proses
                </button>
                <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(false)}>
                  Batal
                </button>
              </>
            )}
          </div>

          {!disabled && (
            <AntiAIHighlighter
              text={textValue}
              onReplace={(newText) => {
                if (isArrayType) {
                  const lines = newText.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean)
                  onChange(lines)
                } else {
                  onChange(newText)
                }
              }}
            />
          )}
        </>
      )}

      {!loading && !textValue && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--paper-2, #ece8de)', borderRadius: '8px' }}>
          <p className="muted" style={{ marginBottom: '1rem' }}>Belum ada draf tulisan untuk bagian ini.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            Tulis Draf Individu
          </button>
        </div>
      )}
    </div>
  )
}
