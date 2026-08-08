import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, type NavigateFunction } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getDraft, updateDraft, generateDocx, draftSectionStream, regenerateSection } from '@/api/client'
import DocumentOutline from '@/components/editor/DocumentOutline'
import RequestionPanel, { type GenerateIssue, type Requestion } from '@/components/RequestionPanel'
import NotificationModal from '@/components/common/NotificationModal'
import MasterGenModal from '@/components/editor/MasterGenModal'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'
import { IconDocument, IconDownload, IconAlert, IconPencil, IconCheck } from '@/components/common/Icons'
import { polishAcademicText, polishAcademicList } from '@/utils/textPolish'

const ARRAY_SECTION_KEYS = [
  'tujuan',
  'tujuan_pkl',
  'manfaat',
  'kesimpulan',
  'saran',
  'rumusan_masalah',
  'kesimpulan_saran',
]

const MAIN_NARRATIVE_KEYS = [
  'latar_belakang',
  'tujuan_pkl',
  'profil_sejarah',
  'tata_tertib',
  'narasi_struktur',
  'landasan_teori',
  'pembahasan',
  'kesimpulan_saran',
]

function isMainNarrativeSection(key: string): boolean {
  return MAIN_NARRATIVE_KEYS.includes(key) || key.startsWith('kegiatan_')
}

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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const dirtyRef = useRef(false)

  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const draftIdRef = useRef(draftId)
  draftIdRef.current = draftId

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const savingPromiseRef = useRef<Promise<void> | null>(null)

  const [downloading, setDownloading] = useState(false)
  const [genError, setGenError] = useState('')
  const [genIssues, setGenIssues] = useState<GenerateIssue[]>([])
  const [genQuestions, setGenQuestions] = useState<Requestion[]>([])
  const [polishNotice, setPolishNotice] = useState('')

  // Master Unified AI Generation Modal State
  const [showMasterModal, setShowMasterModal] = useState(false)

  // Hybrid Editor View Mode State (Default: 'reader' agar siswa disambut bacaan yang bersih & nyaman)
  const [editorViewMode, setEditorViewMode] = useState<'reader' | 'editor'>('reader')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSectionExpand = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEditSectionFromReader = (key: string) => {
    setEditorViewMode('editor')
    setExpandedSections((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      const el = document.getElementById(`section-${key}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
  }

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

  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>(undefined)

  const handleStartMasterBatch = () => {
    setShowMasterModal(true)
  }

  // Auto-trigger Master Generation Modal on mount if ?batch=true parameter is present
  useEffect(() => {
    if (searchParams.get('batch') === 'true' && !loading) {
      setShowMasterModal(true)
    }
  }, [searchParams, loading])

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
        setSaveState('error')
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

  const handleDownloadDocx = async () => {
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
  }

  const handleBackToWizard = async () => {
    await flushSave('completed')
    nav(`/wizard/${draftId}`)
  }

  const updateSection = useCallback((key: string, content: string | string[]) => {
    setCtx((prev) => {
      const gen = { ...(prev.generated_sections || {}), [key]: content }
      let pr = { ...(prev.profil_perusahaan || {}) }
      if (key === 'profil_sejarah') {
        pr.sejarah = typeof content === 'string' ? content : content.join('\n')
      } else if (key === 'tata_tertib') {
        const list = Array.isArray(content)
          ? content
          : (content ? content.split('\n').filter(Boolean) : [])
        pr.tata_tertib_perusahaan = list
        pr.tata_tertib = list
      }
      return { ...prev, generated_sections: gen, profil_perusahaan: pr as any }
    })
    dirtyRef.current = true
    setGenError('')
    setGenIssues([])
    setGenQuestions([])
  }, [])

  const updateProfilPerusahaan = useCallback((patch: Partial<import('@/types/pkl').ProfilPerusahaan>) => {
    setCtx((prev) => ({
      ...prev,
      profil_perusahaan: {
        ...(prev.profil_perusahaan || {}),
        ...patch,
      },
    }))
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

  // Count BAB 1 core sections specifically
  const bab1Count = ['latar_belakang', 'tujuan_pkl', 'profil_sejarah', 'tata_tertib', 'narasi_struktur'].filter((k) => {
    const v = getSectionValue(ctx, k)
    return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
  }).length

  // Count main narrative sections that have non-empty content
  const mainNarrativeCount = Object.entries(ctx.generated_sections || {}).filter(([key, val]) => {
    if (!isMainNarrativeSection(key)) return false
    return Array.isArray(val) ? val.length > 0 : !!(typeof val === 'string' && val.trim())
  }).length

  // Count actual filled sections (non-empty) for progress tracking
  const filledCount = sections.filter((s) => {
    const v = getSectionValue(ctx, s.key)
    return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
  }).length

  // Lock gate: BAB I must have at least 2 sections generated AND main narrative count >= 3 to unlock Mode Baca
  const isUnlocked = bab1Count >= 2 && mainNarrativeCount >= 3

  return (
    <div className="shell">
      {/* Unified Header & Action Bar Card */}
      <div
        className="card editor-header-card"
        style={{
          marginTop: 0,
          marginBottom: '0.75rem',
          padding: 'clamp(0.65rem, 2vw, 1.1rem)',
          borderTop: '4px solid var(--green-600, #187257)',
          background: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          borderLeft: '1px solid var(--line, #cbd5e1)',
          borderRight: '1px solid var(--line, #cbd5e1)',
          borderBottom: '1px solid var(--line, #cbd5e1)',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Row 1: Back Navigation (Left) + Save Indicator Badge (Right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={handleBackToWizard}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--green-700, #14614a)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ← Kembali ke Form Data
          </button>

          {saveState && saveState !== 'idle' && (
            <span
              className="save-indicator"
              style={{
                fontSize: 'clamp(0.72rem, 2.2vw, 0.8rem)',
                padding: '0.15rem 0.6rem',
                borderRadius: '20px',
                background: saveState === 'error' ? '#fee2e2' : 'var(--paper-2, #ece8de)',
                color: saveState === 'error' ? '#dc2626' : 'var(--ink-soft, #555)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {saveState === 'saving' && 'menyimpan…'}
              {saveState === 'saved' && 'tersimpan ✓'}
              {saveState === 'error' && 'Gagal ⚠'}
            </span>
          )}
        </div>

        {/* Row 2: Document Title */}
        <div style={{ marginBottom: '0.65rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: 'clamp(0.95rem, 3.6vw, 1.28rem)', margin: 0, fontWeight: 700, color: 'var(--ink, #262521)', lineHeight: 1.35, wordBreak: 'break-word', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {title || 'Review & Edit Laporan PKL'}
          </h1>
        </div>

        {/* Row 3: Simpan Draf Button */}
        <div style={{ marginBottom: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={handleManualSave}
            disabled={saveState === 'saving'}
            style={{
              width: '100%',
              fontSize: 'clamp(0.78rem, 2.4vw, 0.84rem)',
              padding: '0.42rem 0.8rem',
              background: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              boxSizing: 'border-box',
            }}
          >
            <IconDocument size={14} style={{ flexShrink: 0 }} /> Simpan Draf
          </button>
        </div>

        {/* Row 4: Download .docx Button (Full Width) */}
        <div style={{ marginBottom: '0.55rem', width: '100%', boxSizing: 'border-box' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={downloading || !isUnlocked}
            onClick={handleDownloadDocx}
            style={{
              width: '100%',
              fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
              padding: '0.5rem 1rem',
              background: 'var(--green-600, #187257)',
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              border: '1px solid var(--green-700, #14614a)',
              borderRadius: '8px',
              cursor: downloading || !isUnlocked ? 'not-allowed' : 'pointer',
              opacity: !isUnlocked ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(24, 114, 87, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            {downloading ? (
              'Menyusun dokumen Word…'
            ) : (
              <>
                <IconDownload size={16} style={{ flexShrink: 0 }} /> Download .docx (Siap Cetak)
              </>
            )}
          </button>
        </div>

        {/* Row 5: View Mode Switcher Pills (Full Width 50%-50%) */}
        <div
          style={{
            display: 'flex',
            background: 'var(--paper-2, #ece8de)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--line, #cbd5e1)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={() => setEditorViewMode('reader')}
            style={{
              flex: 1,
              padding: '0.4rem 0.5rem',
              borderRadius: '6px',
              fontSize: 'clamp(0.78rem, 2.4vw, 0.84rem)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: editorViewMode === 'reader' ? 'var(--green-600, #187257)' : 'transparent',
              color: editorViewMode === 'reader' ? '#ffffff' : 'var(--ink-soft, #555)',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              justifyContent: 'center',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <IconDocument size={14} style={{ marginRight: '0.3rem', flexShrink: 0 }} /> Mode Baca
          </button>
          <button
            type="button"
            onClick={() => setEditorViewMode('editor')}
            style={{
              flex: 1,
              padding: '0.4rem 0.5rem',
              borderRadius: '6px',
              fontSize: 'clamp(0.78rem, 2.4vw, 0.84rem)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: editorViewMode === 'editor' ? 'var(--green-600, #187257)' : 'transparent',
              color: editorViewMode === 'editor' ? '#ffffff' : 'var(--ink-soft, #555)',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              justifyContent: 'center',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <IconPencil size={14} style={{ marginRight: '0.3rem', flexShrink: 0 }} /> Mode Edit
          </button>
        </div>
      </div>

      <div className="editor-grid" style={{ marginTop: 0 }}>
        {/* Editor Main Content */}
        <div className="editor-sections">
          {/* Lock Banner when generated_sections count is less than 3 */}
          {!isUnlocked && (
            <div
              className="card editor-lock-banner"
              style={{
                marginBottom: '1.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
              }}
            >
              <div className="editor-lock-banner__icon">
                <IconDocument size={24} color="#475569" />
              </div>
              <div className="editor-lock-banner__body">
                <h3 className="editor-lock-banner__title">
                  Draf Awal Teks Laporan PKL Kamu
                </h3>
                <p className="editor-lock-banner__text">
                  Teks laporan dapat kamu susun otomatis menggunakan AI atau kamu tulis sendiri secara bebas di bawah ini.
                </p>
              </div>
              <button
                type="button"
                className="btn-primary editor-lock-banner__btn"
                onClick={handleStartMasterBatch}
                style={{ cursor: 'pointer' }}
              >
                <IconDocument size={16} style={{ marginRight: '0.4rem' }} />
                Generate Semua Sub-bab Laporan
              </button>
            </div>
          )}

          {/* READER VIEW (Mode Baca Laporan Berkelanjutan) */}
          {editorViewMode === 'reader' && (
            <>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '0.55rem 0.85rem',
                  marginBottom: '0.65rem',
                  fontSize: 'clamp(0.76rem, 2.2vw, 0.83rem)',
                  color: '#166534',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(22, 101, 52, 0.05)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <IconDocument size={16} color="#166534" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Mode Baca (Pratinjau Cetak):</strong> Tampilan bersih laporan PKL kamu seperti cetakan Word. Klik tombol "Edit" di kanan sub-bab untuk mengubah isi draf.
                </span>
              </div>
              <DocumentReaderView
                sections={sections}
                ctx={ctx}
                onEditSection={handleEditSectionFromReader}
                mode="reader"
                onUpdateProfil={updateProfilPerusahaan}
              />
            </>
          )}

          {/* ACCORDION EDITOR VIEW (Mode Edit Sub-bab Kartu Ringkas) */}
          {editorViewMode === 'editor' && (
            <>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.55rem 0.85rem',
                  marginBottom: '0.65rem',
                  fontSize: 'clamp(0.76rem, 2.2vw, 0.83rem)',
                  color: '#334155',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <IconPencil size={16} color="#334155" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Mode Edit (Penyuntingan Sub-bab):</strong> Ketik draf teks secara langsung atau gunakan tombol "Generate AI" untuk bantuan menulis per sub-bab.
                </span>
              </div>
              <DocumentReaderView
                sections={sections}
                ctx={ctx}
                onEditSection={handleEditSectionFromReader}
                mode="editor"
                updateSection={updateSection}
                onUpdateProfil={updateProfilPerusahaan}
                showErrorModal={showErrorModal}
                isUnlocked={isUnlocked}
                expandedSections={expandedSections}
                toggleSectionExpand={toggleSectionExpand}
              />
            </>
          )}

          {sections.length === 0 && (
            <div className="card">
              <p className="muted">Belum ada bagian yang dikonfigurasi untuk laporan ini.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Finalisasi & Structure Outline */}
        <div className="editor-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {/* Panel Finalisasi */}
          <div className="card" style={{ margin: 0, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(0.98rem, 3vw, 1.15rem)', wordBreak: 'break-word', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>Finalisasi Laporan</h3>

            <div style={{ marginBottom: '1rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(0.78rem, 2.4vw, 0.85rem)', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.25rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                <span>Kemajuan Draf Sub-bab</span>
                <strong>{filledCount} / {sections.length}</strong>
              </div>
              <div className="completeness__bar" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                <div
                  className="completeness__fill is-ready"
                  style={{ width: `${sections.length > 0 ? (filledCount / sections.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '0.8rem 1rem',
                fontSize: 'clamp(0.82rem, 2.6vw, 0.98rem)',
                fontWeight: 600,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                whiteSpace: 'normal',
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
              onClick={handleDownloadDocx}
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

      {/* Notification Pop-up Modal */}
      <NotificationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Master Unified AI Generation Modal */}
      <MasterGenModal
        isOpen={showMasterModal}
        ctx={ctx}
        draftId={draftId || ''}
        allSections={sections}
        onComplete={(updatedCtx) => {
          setCtx(updatedCtx)
          dirtyRef.current = true
          if (draftIdRef.current) {
            updateDraft(draftIdRef.current, { data: updatedCtx, status: 'completed' }).catch(() => {})
          }
          // Remove ?batch=true query parameter cleanly from URL
          if (searchParams.get('batch')) {
            nav(`/editor/${draftId}`, { replace: true })
          }
        }}
        onClose={() => setShowMasterModal(false)}
      />
    </div>
  )
}

function getSectionValue(ctx: PklContext, key: string): string | string[] {
  const gen = ctx.generated_sections || {}
  if (key in gen) {
    return gen[key] ?? ''
  }
  if (key === 'profil_sejarah' && ctx.profil_perusahaan?.sejarah) {
    return ctx.profil_perusahaan.sejarah
  }
  if (key === 'tata_tertib' && (ctx.profil_perusahaan?.tata_tertib_perusahaan?.length || ctx.profil_perusahaan?.tata_tertib?.length)) {
    return ctx.profil_perusahaan.tata_tertib_perusahaan || ctx.profil_perusahaan.tata_tertib || ''
  }
  return ''
}

function buildSectionList(ctx: PklContext) {
  const bab = ctx.config?.bab_modules || []
  const list: { key: string; title: string }[] = []

  // BAB I PENDAHULUAN — termasuk profil perusahaan (sub-bab 1.3-1.6)
  if (bab.length === 0 || bab.includes('PENDAHULUAN')) {
    list.push({ key: 'latar_belakang', title: 'Latar Belakang (1.1)' })
    list.push({ key: 'tujuan_pkl', title: 'Tujuan PKL (1.2)' })
    list.push({ key: 'profil_sejarah', title: 'Sejarah Singkat Perusahaan (1.3)' })
    list.push({ key: 'tata_tertib', title: 'Tata Tertib & Keselamatan Kerja (1.4)' })
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
      { key: 'tata_tertib', title: 'Tata Tertib & Keselamatan Kerja (1.4)' },
      { key: 'narasi_struktur', title: 'Narasi Struktur Organisasi (1.5)' },
      { key: 'landasan_teori', title: 'Landasan Teori (BAB III)' },
      { key: 'pembahasan', title: 'Pembahasan & Analisis (BAB V)' },
      { key: 'kesimpulan_saran', title: 'Kesimpulan dan Saran (BAB VI)' }
    )
  }

  // Deduplicate entries by key to guarantee 100% unique React keys
  const seenKeys = new Set<string>()
  const uniqueList: { key: string; title: string }[] = []
  for (const item of list) {
    if (!seenKeys.has(item.key)) {
      seenKeys.add(item.key)
      uniqueList.push(item)
    }
  }

  // Include any extra AI-generated sections from ctx.generated_sections
  if (ctx.generated_sections) {
    Object.keys(ctx.generated_sections).forEach((k) => {
      if (!seenKeys.has(k) && !['visi_misi', 'tata_tertib', 'job_descriptions'].includes(k)) {
        const val = ctx.generated_sections?.[k]
        const hasContent = Array.isArray(val) ? val.length > 0 : !!(typeof val === 'string' && val.trim())
        if (hasContent) {
          seenKeys.add(k)
          const titleFormatted = k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          uniqueList.push({ key: k, title: titleFormatted })
        }
      }
    })
  }

  return uniqueList
}

// --------------------------------------------------------------------------- //
//  Document Reader View Component (Pratinjau Dokumen Cetak Clean & Akademis)
// --------------------------------------------------------------------------- //
function ReaderSectionItem({
  sec,
  val,
  onEditSection,
}: {
  sec: { key: string; title: string }
  val: string | string[]
  onEditSection: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isArray = Array.isArray(val)
  const hasText = isArray ? val.length > 0 : !!(typeof val === 'string' && val.trim())

  let previewText = ''
  let isLong = false

  if (hasText && !isArray && typeof val === 'string') {
    const trimmed = val.trim()
    const sentences = trimmed.split(/(?<=[.!?])\s+/)
    const firstSentence = sentences[0] || trimmed
    if (sentences.length > 1 || trimmed.length > 130) {
      isLong = true
      previewText = firstSentence.length > 130 ? firstSentence.slice(0, 130) + '…' : firstSentence
    } else {
      previewText = trimmed
    }
  } else if (hasText && isArray) {
    const arr = val as string[]
    const first = arr[0] || ''
    if (arr.length > 1 || first.length > 120) {
      isLong = true
    }
  }

  const handleToggle = () => {
    if (expanded) {
      // Smoothly keep/lock scroll position at top of section when collapsing
      const el = document.getElementById(`reader-sec-${sec.key}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setExpanded(false)
    } else {
      setExpanded(true)
    }
  }

  return (
    <div
      id={`reader-sec-${sec.key}`}
      style={{
        scrollMarginTop: '100px',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background: hasText ? '#ffffff' : '#f8fafc',
        border: hasText ? '1px solid var(--line, #cbd5e1)' : '1px solid #cbd5e1',
        borderLeft: hasText ? '4px solid var(--green-600, #187257)' : '4px solid #94a3b8',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '0.35rem',
        boxShadow: hasText ? '0 2px 6px rgba(0, 0, 0, 0.03)' : 'none',
        opacity: hasText ? 1 : 0.65,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px dashed var(--line, #e2e8f0)', paddingBottom: '0.4rem', gap: '0.5rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)', color: hasText ? 'var(--green-800, #114e3b)' : '#64748b', fontFamily: 'var(--font-serif)', fontWeight: 700, wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
          {sec.title}
        </h4>
        {hasText ? (
          <button
            type="button"
            onClick={() => onEditSection(sec.key)}
            className="btn-sm btn-outline"
            style={{ fontSize: 'clamp(0.72rem, 2.2vw, 0.78rem)', padding: '0.2rem 0.55rem', background: '#ffffff', color: 'var(--green-700, #14614a)', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', boxSizing: 'border-box' }}
          >
            <IconPencil size={13} style={{ marginRight: '0.2rem', flexShrink: 0 }} /> Edit
          </button>
        ) : (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.55rem',
              background: '#e2e8f0',
              color: '#475569',
              borderRadius: '6px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'not-allowed',
            }}
          >
            <IconAlert size={13} style={{ flexShrink: 0 }} /> Belum Di-generate AI
          </span>
        )}
      </div>

      {hasText ? (
        <div style={{ fontSize: 'clamp(0.82rem, 2.5vw, 0.93rem)', lineHeight: 1.7, color: 'var(--ink, #262521)', wordBreak: 'break-word', overflowWrap: 'break-word', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {isArray ? (
            <>
              <ul style={{ margin: '0.4rem 0 0 1.25rem', paddingLeft: '0.5rem' }}>
                {(expanded || !isLong
                  ? (val as string[])
                  : [(val as string[])[0]?.length > 120 ? (val as string[])[0].slice(0, 120) + '…' : (val as string[])[0]]
                ).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                ))}
              </ul>
              {isLong && (
                <button
                  type="button"
                  onClick={handleToggle}
                  style={{
                    background: 'var(--paper-2, #ece8de)',
                    border: '1px solid var(--line-strong, #b9b09c)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--green-700, #14614a)',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {expanded ? '▼ Sembunyikan Detail' : `▶ Baca Selengkapnya (${(val as string[]).length - 1} poin lagi)`}
                </button>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {expanded || !isLong ? (val as string) : previewText}
                {!expanded && isLong && '…'}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={handleToggle}
                  style={{
                    background: 'var(--paper-2, #ece8de)',
                    border: '1px solid var(--line-strong, #b9b09c)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--green-700, #14614a)',
                    cursor: 'pointer',
                    marginTop: '0.55rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {expanded ? '▼ Sembunyikan Detail Teks' : '▶ Baca Selengkapnya'}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: 'clamp(0.78rem, 2.3vw, 0.85rem)', color: '#64748b' }}>
          <span style={{ wordBreak: 'break-word' }}>Sub-bab ini belum di-generate oleh AI. Klik tombol "Generate Semua Sub-bab Laporan" di atas untuk membuat drafnya.</span>
        </div>
      )}
    </div>
  )
}

// ── Special Reader Cards for Integrated Profile & Document Parts ────────── //

function SpecialVisiMisiCard({
  ctx,
  nav,
  mode = 'reader',
  onUpdateProfil,
  onSwitchToEdit,
}: {
  ctx: PklContext
  nav: NavigateFunction
  mode?: 'reader' | 'editor'
  onUpdateProfil?: (patch: Partial<import('@/types/pkl').ProfilPerusahaan>) => void
  onSwitchToEdit?: () => void
}) {
  const { draftId } = useParams()
  const [expanded, setExpanded] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const visi = ctx.profil_perusahaan?.visi || ''
  const misi = ctx.profil_perusahaan?.misi || []
  const hasContent = !!visi || misi.length > 0

  const handleVisiChange = (val: string) => {
    if (onUpdateProfil) {
      onUpdateProfil({ visi: val })
    }
  }

  const handleMisiChange = (text: string) => {
    if (onUpdateProfil) {
      const list = text.split('\n').map((s) => s.trim()).filter(Boolean)
      onUpdateProfil({ misi: list })
    }
  }

  if (mode === 'editor') {
    return (
      <div
        id="section-visi_misi"
        style={{
          background: '#ffffff',
          border: '1px solid var(--green-600, #187257)',
          borderLeft: '4px solid var(--green-600, #187257)',
          borderRadius: '10px',
          padding: '0.85rem 1.2rem',
          marginBottom: '0.5rem',
          boxShadow: '0 2px 8px rgba(24, 114, 87, 0.08)',
        }}
      >
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isOpen ? '0.75rem' : 0,
            borderBottom: isOpen ? '1px solid var(--line, #e2e8f0)' : 'none',
            paddingBottom: isOpen ? '0.45rem' : 0,
            gap: '0.5rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.02rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--green-700, #14614a)' }}>{isOpen ? '▼' : '▶'}</span>
            1.3.a Visi &amp; Misi Perusahaan (Dipoles AI KBBI)
          </h4>
          <span style={{ fontSize: '0.74rem', background: 'var(--green-50, #f0fdf4)', color: 'var(--green-700, #14614a)', border: '1px solid #86efac', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
            Mode Edit Langsung
          </span>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink, #262521)', marginBottom: '0.25rem' }}>
                Visi Perusahaan:
              </label>
              <textarea
                value={visi}
                onChange={(e) => handleVisiChange(e.target.value)}
                placeholder="Masukkan visi perusahaan (misal: Menjadi perusahaan teknologi terdepan...)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink, #262521)', marginBottom: '0.25rem' }}>
                Misi Perusahaan (1 poin per baris):
              </label>
              <textarea
                value={misi.join('\n')}
                onChange={(e) => handleMisiChange(e.target.value)}
                placeholder="Tekan Enter untuk membuat poin misi baru&#10;1. Memberikan layanan terbaik&#10;2. Mengembangkan inovasi teknologi"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line, #cbd5e1)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        padding: '0.85rem 1.35rem',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px dashed var(--line, #e2e8f0)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
          1.3.a Visi &amp; Misi Perusahaan (Dipoles AI KBBI)
        </h4>
        <button
          type="button"
          onClick={() => onSwitchToEdit ? onSwitchToEdit() : nav(`/wizard/${draftId || ''}`)}
          className="btn-sm btn-outline"
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', background: '#ffffff', color: 'var(--green-700)', fontWeight: 600 }}
        >
          <IconPencil size={13} style={{ marginRight: '0.2rem' }} /> Edit
        </button>
      </div>

      {hasContent ? (
        <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink, #262521)' }}>
          {visi && (
            <p style={{ margin: '0 0 0.4rem', fontWeight: 600 }}>
              <strong>Visi:</strong> {expanded || visi.length <= 110 ? visi : `${visi.slice(0, 110)}…`}
            </p>
          )}
          {misi.length > 0 && (
            <div style={{ marginTop: '0.35rem' }}>
              <strong>Misi Perusahaan:</strong>
              <ul style={{ margin: '0.3rem 0 0 1.25rem', paddingLeft: '0.5rem' }}>
                {(expanded ? misi : misi.slice(0, 1)).map((m, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {(misi.length > 1 || visi.length > 110) && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'var(--paper-2, #ece8de)',
                border: '1px solid var(--line-strong, #b9b09c)',
                borderRadius: '6px',
                padding: '0.28rem 0.7rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--green-700, #14614a)',
                cursor: 'pointer',
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {expanded ? '▼ Sembunyikan Detail Visi-Misi' : `▶ Baca Selengkapnya Visi & Misi (${misi.length} poin)`}
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Visi dan Misi perusahaan otomatis dipoles oleh AI pada Phase 2 saat dokumen dibuat.
        </div>
      )}
    </div>
  )
}

function SpecialJobDescCard({
  ctx,
  nav,
  mode = 'reader',
  onUpdateProfil,
  onSwitchToEdit,
}: {
  ctx: PklContext
  nav: NavigateFunction
  mode?: 'reader' | 'editor'
  onUpdateProfil?: (patch: Partial<import('@/types/pkl').ProfilPerusahaan>) => void
  onSwitchToEdit?: () => void
}) {
  const { draftId } = useParams()
  const [expanded, setExpanded] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const jobs = ctx.profil_perusahaan?.job_descriptions || []
  const hasContent = jobs.length > 0

  const handleUpdateJobPosisi = (index: number, newPosisi: string) => {
    if (!onUpdateProfil) return
    const updated = [...jobs]
    updated[index] = { ...updated[index], posisi: newPosisi }
    onUpdateProfil({ job_descriptions: updated })
  }

  const handleUpdateJobTugas = (index: number, textTugas: string) => {
    if (!onUpdateProfil) return
    const list = textTugas.split('\n').map((s) => s.trim()).filter(Boolean)
    const updated = [...jobs]
    updated[index] = { ...updated[index], tugas: list }
    onUpdateProfil({ job_descriptions: updated })
  }

  const handleAddJob = () => {
    if (!onUpdateProfil) return
    const updated = [...jobs, { posisi: 'Posisi / Jabatan Baru', tugas: [] }]
    onUpdateProfil({ job_descriptions: updated })
  }

  const handleRemoveJob = (index: number) => {
    if (!onUpdateProfil) return
    const updated = jobs.filter((_, i) => i !== index)
    onUpdateProfil({ job_descriptions: updated })
  }

  if (mode === 'editor') {
    return (
      <div
        id="section-job_descriptions"
        style={{
          background: '#ffffff',
          border: '1px solid var(--green-600, #187257)',
          borderLeft: '4px solid var(--green-600, #187257)',
          borderRadius: '10px',
          padding: '0.85rem 1.2rem',
          marginBottom: '0.5rem',
          boxShadow: '0 2px 8px rgba(24, 114, 87, 0.08)',
        }}
      >
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isOpen ? '0.75rem' : 0,
            borderBottom: isOpen ? '1px solid var(--line, #e2e8f0)' : 'none',
            paddingBottom: isOpen ? '0.45rem' : 0,
            gap: '0.5rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.02rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--green-700, #14614a)' }}>{isOpen ? '▼' : '▶'}</span>
            1.6 Job Description (Profil Jabatan Perusahaan — BAB I)
          </h4>
          <span style={{ fontSize: '0.74rem', background: 'var(--green-50, #f0fdf4)', color: 'var(--green-700, #14614a)', border: '1px solid #86efac', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
            Mode Edit Langsung
          </span>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {jobs.length === 0 && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Belum ada deskripsi posisi pekerjaan. Klik tombol di bawah untuk menambah jabatan.
              </p>
            )}

            {jobs.map((job, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={job.posisi}
                    onChange={(e) => handleUpdateJobPosisi(idx, e.target.value)}
                    placeholder={`Nama Jabatan ${idx + 1}`}
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--green-800, #114e3b)',
                      padding: '0.3rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      flex: 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveJob(idx)}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      padding: '0.2rem 0.55rem',
                      cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                </div>
                <textarea
                  value={(Array.isArray(job.tugas) ? job.tugas : [job.tugas]).join('\n')}
                  onChange={(e) => handleUpdateJobTugas(idx, e.target.value)}
                  placeholder="Rincian tugas per baris (Tekan Enter untuk poin baru)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.6rem',
                    fontSize: '0.82rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddJob}
              style={{
                background: '#ffffff',
                border: '1px dashed var(--green-600, #187257)',
                color: 'var(--green-700, #14614a)',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              + Tambah Posisi / Jabatan Pekerjaan
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line, #cbd5e1)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        padding: '0.85rem 1.35rem',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px dashed var(--line, #e2e8f0)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
          1.6 Job Description / Deskripsi Pekerjaan per Posisi (Dipoles AI)
        </h4>
        <button
          type="button"
          onClick={() => onSwitchToEdit ? onSwitchToEdit() : nav(`/wizard/${draftId || ''}`)}
          className="btn-sm btn-outline"
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', background: '#ffffff', color: 'var(--green-700)', fontWeight: 600 }}
        >
          <IconPencil size={13} style={{ marginRight: '0.2rem' }} /> Edit
        </button>
      </div>

      {hasContent ? (
        <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink, #262521)' }}>
          {(expanded ? jobs : jobs.slice(0, 1)).map((job, idx) => (
            <div key={idx} style={{ marginBottom: '0.6rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong style={{ color: 'var(--green-800, #114e3b)' }}>{job.posisi || `Jabatan ${idx + 1}`}:</strong>
              <ul style={{ margin: '0.25rem 0 0 1.1rem', paddingLeft: '0.4rem' }}>
                {(Array.isArray(job.tugas) ? job.tugas : [job.tugas]).map((t, i) => (
                  <li key={i} style={{ fontSize: '0.83rem', marginBottom: '0.2rem' }}>{t}</li>
                ))}
              </ul>
            </div>
          ))}

          {jobs.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'var(--paper-2, #ece8de)',
                border: '1px solid var(--line-strong, #b9b09c)',
                borderRadius: '6px',
                padding: '0.28rem 0.7rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--green-700, #14614a)',
                cursor: 'pointer',
                marginTop: '0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {expanded ? '▼ Sembunyikan Job Description' : `▶ Baca Selengkapnya Job Description (${jobs.length - 1} jabatan lagi)`}
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Deskripsi pekerjaan per posisi otomatis dipoles oleh AI pada Phase 2 saat dokumen dibuat.
        </div>
      )}
    </div>
  )
}

function SpecialFrontMatterCard({ ctx }: { ctx: PklContext }) {
  const [expanded, setExpanded] = useState(false)
  const namaSiswa = ctx.siswa?.nama?.trim()
  const kelasSiswa = ctx.siswa?.kelas?.trim()
  const nisnSiswa = ctx.siswa?.nisn?.trim()
  const namaPerusahaan = ctx.perusahaan?.nama_lengkap?.trim() || ctx.perusahaan?.nama?.trim()
  const pembimbing = (ctx.perusahaan as any)?.pembimbing?.trim() || (ctx.perusahaan as any)?.pembimbing_nama?.trim()
  const kota = ctx.kata_pengantar?.kota?.trim()
  const tanggal = ctx.kata_pengantar?.tanggal?.trim()

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line, #cbd5e1)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        padding: '0.85rem 1.35rem',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', borderBottom: '1px dashed var(--line, #e2e8f0)', paddingBottom: '0.4rem' }}>
        <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
          Informasi Kelengkapan Halaman Depan (Front Matter)
        </h4>
        <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
          Otomatis / Siap Cetak
        </span>
      </div>

      <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: 'var(--ink, #262521)', lineHeight: 1.6 }}>
        Halaman depan disusun otomatis sesuai format standar SMKN 4 Bandar Lampung (Cover, Halaman Pengesahan Pembimbing Industri &amp; Sekolah, Identitas Siswa, Identitas Perusahaan, Kata Pengantar, serta Daftar Isi).
      </p>

      {expanded && (
        <div style={{ marginTop: '0.6rem', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.83rem', lineHeight: 1.6, color: '#334155' }}>
          <div style={{ marginBottom: '0.35rem' }}>
            • <strong>Siswa:</strong> {namaSiswa || <span style={{ color: '#94a3b8' }}>[Belum Diisi]</span>} {kelasSiswa ? `(${kelasSiswa})` : ''} — NISN: {nisnSiswa || <span style={{ color: '#94a3b8' }}>-</span>}
          </div>
          <div style={{ marginBottom: '0.35rem' }}>
            • <strong>Perusahaan:</strong> {namaPerusahaan || <span style={{ color: '#94a3b8' }}>[Belum Diisi]</span>}
          </div>
          <div style={{ marginBottom: '0.35rem' }}>
            • <strong>Pembimbing Industri:</strong> {pembimbing || <span style={{ color: '#94a3b8' }}>[Belum Diisi]</span>}
          </div>
          <div>
            • <strong>Tempat &amp; Tanggal TTD Kata Pengantar:</strong> {kota || 'Bandar Lampung'}, {tanggal || 'Juli 2026'}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'var(--paper-2, #ece8de)',
          border: '1px solid var(--line-strong, #b9b09c)',
          borderRadius: '6px',
          padding: '0.28rem 0.7rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--green-700, #14614a)',
          cursor: 'pointer',
          marginTop: '0.45rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        {expanded ? '▼ Sembunyikan Rincian Front Matter' : '▶ Rincian Halaman Depan (Cover, Pengesahan & Identitas)'}
      </button>
    </div>
  )
}

function SpecialLampiranCard({ ctx }: { ctx: PklContext }) {
  const [expanded, setExpanded] = useState(false)
  const countJurnal = (ctx.kegiatan || []).length
  const countFoto = (ctx.assets || []).length
  const countRef = (ctx.daftar_pustaka || []).length

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line, #cbd5e1)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        padding: '0.85rem 1.35rem',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', borderBottom: '1px dashed var(--line, #e2e8f0)', paddingBottom: '0.4rem' }}>
        <h4 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)', color: 'var(--green-800, #114e3b)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
          Halaman Belakang &amp; Lampiran Dokumentasi
        </h4>
        <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
          Siap Diterbitkan
        </span>
      </div>

      <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: 'var(--ink, #262521)', lineHeight: 1.6 }}>
        Terdiri dari Daftar Pustaka resmi (disusun otomatis/manual) serta Lampiran Jurnal Kegiatan ({countJurnal} entri), Foto Dokumentasi ({countFoto} berkas), Lembar Absensi, dan Sertifikat Penilaian Industri.
      </p>

      {expanded && (
        <div style={{ marginTop: '0.6rem', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.83rem', lineHeight: 1.6, color: '#334155' }}>
          <div style={{ marginBottom: '0.35rem' }}>• <strong>Daftar Pustaka:</strong> {countRef > 0 ? `${countRef} referensi tersusun` : 'Disusun otomatis dari datamu & buku publik'}</div>
          <div style={{ marginBottom: '0.35rem' }}>• <strong>Jurnal &amp; Absensi:</strong> {countJurnal} entri bidang kerja terdaftar</div>
          <div>• <strong>Foto Dokumentasi &amp; Penilaian:</strong> {countFoto} foto terlampir siap cetak</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'var(--paper-2, #ece8de)',
          border: '1px solid var(--line-strong, #b9b09c)',
          borderRadius: '6px',
          padding: '0.28rem 0.7rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--green-700, #14614a)',
          cursor: 'pointer',
          marginTop: '0.45rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        {expanded ? '▼ Sembunyikan Rincian Lampiran' : '▶ Rincian Halaman Belakang & Lampiran'}
      </button>
    </div>
  )
}

// ── Parent Chapter Accordion Component ───────────────────────────────────── //

interface ParentChapter {
  id: string
  title: string
  subtitle: string
  icon: string
  items: { key: string; title: string; type?: 'standard' | 'visi_misi' | 'job_descriptions' | 'front_matter' | 'lampiran' }[]
}

function ChapterAccordionGroup({
  chapter,
  ctx,
  onEditSection,
  nav,
  mode = 'reader',
  updateSection,
  onUpdateProfil,
  showErrorModal,
  isLocked = false,
  expandedSections = {},
  toggleSectionExpand,
  defaultExpanded = false,
}: {
  chapter: ParentChapter
  ctx: PklContext
  onEditSection: (key: string) => void
  nav: NavigateFunction
  mode?: 'reader' | 'editor'
  updateSection?: (key: string, val: string | string[]) => void
  onUpdateProfil?: (patch: Partial<import('@/types/pkl').ProfilPerusahaan>) => void
  showErrorModal?: (msg: string) => void
  isLocked?: boolean
  expandedSections?: Record<string, boolean>
  toggleSectionExpand?: (key: string) => void
  defaultExpanded?: boolean
}) {
  // Count filled items in this chapter
  const filledCount = chapter.items.filter((item) => {
    if (item.type === 'front_matter' || item.type === 'lampiran') return true
    if (item.type === 'visi_misi') return !!(ctx.profil_perusahaan?.visi || (ctx.profil_perusahaan?.misi || []).length > 0)
    if (item.type === 'job_descriptions') return (ctx.profil_perusahaan?.job_descriptions || []).length > 0
    const val = getSectionValue(ctx, item.key)
    return Array.isArray(val) ? val.length > 0 : !!(typeof val === 'string' && val.trim())
  }).length

  const chapterIsLocked = isLocked || (mode === 'reader' && filledCount === 0)

  const [isOpen, setIsOpen] = useState(!chapterIsLocked && (defaultExpanded || mode === 'editor'))

  useEffect(() => {
    if (chapterIsLocked) {
      setIsOpen(false)
    } else if (mode === 'editor') {
      setIsOpen(true)
    } else {
      setIsOpen(defaultExpanded)
    }
  }, [mode, defaultExpanded, chapterIsLocked])

  return (
    <div
      style={{
        background: chapterIsLocked ? 'var(--paper-2, #ece8de)' : '#ffffff',
        border: chapterIsLocked ? '1px dashed var(--line-strong, #b9b09c)' : '1.5px solid var(--line-strong, #b9b09c)',
        borderRadius: '12px',
        marginBottom: '0.45rem',
        overflow: 'hidden',
        boxShadow: chapterIsLocked ? 'none' : '0 3px 12px rgba(0, 0, 0, 0.04)',
        opacity: chapterIsLocked ? 0.55 : 1,
        pointerEvents: chapterIsLocked ? 'none' : 'auto',
      }}
    >
      {/* Chapter Parent Header */}
      <div
        onClick={() => !chapterIsLocked && setIsOpen(!isOpen)}
        style={{
          padding: 'clamp(0.65rem, 2vw, 0.85rem) clamp(0.7rem, 2.5vw, 1.25rem)',
          background: chapterIsLocked ? 'var(--paper-2, #ece8de)' : isOpen ? 'var(--paper-2, #ece8de)' : '#ffffff',
          borderBottom: !chapterIsLocked && isOpen ? '1px solid var(--line-strong, #b9b09c)' : 'none',
          cursor: chapterIsLocked ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.45rem',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '1.05rem', flexShrink: 0, opacity: chapterIsLocked ? 0.5 : 1 }}>{chapter.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 'clamp(0.82rem, 2.7vw, 1.08rem)',
                color: chapterIsLocked ? 'var(--ink-soft, #64748b)' : 'var(--green-800, #114e3b)',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
                lineHeight: 1.25,
              }}
            >
              {chapter.title}
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: 'clamp(0.72rem, 2.1vw, 0.8rem)', color: chapterIsLocked ? '#94a3b8' : 'var(--ink-soft, #64748b)', lineHeight: 1.3 }}>
              {chapter.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <span style={{ fontSize: 'clamp(0.68rem, 2vw, 0.75rem)', background: chapterIsLocked ? '#ece8de' : '#ffffff', border: '1px solid var(--line-strong, #b9b09c)', padding: '0.15rem 0.5rem', borderRadius: '14px', fontWeight: 700, color: chapterIsLocked ? '#64748b' : 'var(--green-700, #14614a)', whiteSpace: 'nowrap' }}>
            {filledCount} / {chapter.items.length} Bagian
          </span>
          <span style={{ fontSize: '0.85rem', color: chapterIsLocked ? '#94a3b8' : 'var(--green-700, #14614a)', fontWeight: 700, flexShrink: 0 }}>
            {isOpen ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Chapter Child Body */}
      {isOpen && (
        <div style={{ padding: '0.85rem 1rem', background: '#faf8f5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chapter.items.map((item) => {
            if (item.type === 'front_matter') {
              return <SpecialFrontMatterCard key={item.key} ctx={ctx} />
            }
            if (item.type === 'lampiran') {
              return <SpecialLampiranCard key={item.key} ctx={ctx} />
            }
            if (item.type === 'visi_misi') {
              return (
                <SpecialVisiMisiCard
                  key={item.key}
                  ctx={ctx}
                  nav={nav}
                  mode={mode}
                  onUpdateProfil={onUpdateProfil}
                  onSwitchToEdit={() => onEditSection(item.key)}
                />
              )
            }
            if (item.type === 'job_descriptions') {
              return (
                <SpecialJobDescCard
                  key={item.key}
                  ctx={ctx}
                  nav={nav}
                  mode={mode}
                  onUpdateProfil={onUpdateProfil}
                  onSwitchToEdit={() => onEditSection(item.key)}
                />
              )
            }

            if (mode === 'editor') {
              return (
                <div id={`section-${item.key}`} key={item.key}>
                  <SectionEditor
                    sectionKey={item.key}
                    title={item.title}
                    ctx={ctx}
                    value={getSectionValue(ctx, item.key)}
                    onChange={(val) => updateSection && updateSection(item.key, val)}
                    onError={showErrorModal}
                    disabled={false}
                    isExpanded={expandedSections?.[item.key] !== false}
                    onToggleExpand={() => toggleSectionExpand && toggleSectionExpand(item.key)}
                  />
                </div>
              )
            }

            const val = getSectionValue(ctx, item.key)
            return (
              <ReaderSectionItem
                key={item.key}
                sec={{ key: item.key, title: item.title }}
                val={val}
                onEditSection={onEditSection}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocumentReaderView({
  sections,
  ctx,
  onEditSection,
  mode = 'reader',
  updateSection,
  onUpdateProfil,
  showErrorModal,
  isUnlocked = true,
  expandedSections = {},
  toggleSectionExpand,
}: {
  sections: { key: string; title: string }[]
  ctx: PklContext
  onEditSection: (key: string) => void
  mode?: 'reader' | 'editor'
  updateSection?: (key: string, val: string | string[]) => void
  onUpdateProfil?: (patch: Partial<import('@/types/pkl').ProfilPerusahaan>) => void
  showErrorModal?: (msg: string) => void
  isUnlocked?: boolean
  expandedSections?: Record<string, boolean>
  toggleSectionExpand?: (key: string) => void
}) {
  const nav = useNavigate()

  // Build the 8 Hierarchical Parent Chapters
  const chapters: ParentChapter[] = [
    {
      id: 'front_matter',
      title: 'HALAMAN DEPAN (FRONT MATTER)',
      subtitle: 'Cover, Halaman Pengesahan, Identitas Siswa/Industri & Kata Pengantar',
      icon: '📘',
      items: [{ key: 'front_matter_summary', title: 'Halaman Depan Dokumen', type: 'front_matter' }],
    },
    {
      id: 'bab_1',
      title: 'BAB I: PENDAHULUAN',
      subtitle: 'Latar Belakang, Tujuan PKL, Sejarah & Profil Perusahaan, Tata Tertib, Struktur, Job Desc',
      icon: '📗',
      items: [
        { key: 'latar_belakang', title: '1.1 Latar Belakang' },
        { key: 'tujuan_pkl', title: '1.2 Tujuan Kegiatan PKL' },
        { key: 'profil_sejarah', title: '1.3 Sejarah Singkat Perusahaan' },
        { key: 'visi_misi', title: '1.3.a Visi & Misi Perusahaan', type: 'visi_misi' },
        { key: 'tata_tertib', title: '1.4 Tata Tertib & Keselamatan Kerja (K3)' },
        { key: 'narasi_struktur', title: '1.5 Bagan & Narasi Struktur Organisasi' },
        { key: 'job_descriptions', title: '1.6 Job Description (Profil Jabatan Perusahaan)', type: 'job_descriptions' },
      ],
    },
    {
      id: 'bab_2',
      title: 'BAB II: KEGIATAN DI INDUSTRI',
      subtitle: 'Proses & Ringkasan Kegiatan Operasional Industri Per Seksi/Divisi',
      icon: '📙',
      items: sections.filter((s) => s.key.startsWith('kegiatan_') && s.key.endsWith('_intro')).length > 0
        ? sections.filter((s) => s.key.startsWith('kegiatan_') && s.key.endsWith('_intro'))
        : [{ key: 'proses_kegiatan', title: '2.1 Ringkasan Proses Kegiatan Industri' }],
    },
    {
      id: 'bab_3',
      title: 'BAB III: TINJAUAN PUSTAKA',
      subtitle: 'Landasan Teori Akademis Paraphrased AI, Asas PKL & Sejarah Sekolah',
      icon: '📕',
      items: [
        { key: 'landasan_teori', title: '3.1 Landasan Teori Akademis' },
      ],
    },
    {
      id: 'bab_4',
      title: 'BAB IV: DATA PENGAMATAN',
      subtitle: 'Pelaksanaan Pekerjaan, Studi Kasus Problem Solving & Rincian Peralatan',
      icon: '📒',
      items: sections.filter((s) => s.key === 'studi_kasus_proses' || s.key.startsWith('detail_kegiatan')).length > 0
        ? sections.filter((s) => s.key === 'studi_kasus_proses' || s.key.startsWith('detail_kegiatan'))
        : [
            { key: 'pelaksanaan_kegiatan', title: '4.1 Pelaksanaan Kegiatan & Rincian Tugas Harian Siswa' },
            ...(sections.some((s) => s.key === 'studi_kasus_proses') ? [{ key: 'studi_kasus_proses', title: '4.2 Proses Penyelesaian Studi Kasus' }] : []),
          ],
    },
    {
      id: 'bab_5',
      title: 'BAB V: PEMBAHASAN',
      subtitle: 'Hal-hal yang Perlu Diperhatikan & Analisis Peningkatan Kompetensi Industri',
      icon: '📔',
      items: [{ key: 'pembahasan', title: '5.1 Pembahasan & Analisis Peningkatan Kompetensi' }],
    },
    {
      id: 'bab_6',
      title: 'BAB VI: KESIMPULAN DAN SARAN',
      subtitle: 'Kesimpulan Laporan PKL & Saran Konstruktif untuk Sekolah / Industri',
      icon: '📑',
      items: [{ key: 'kesimpulan_saran', title: '6.1 Kesimpulan & 6.2 Saran' }],
    },
    {
      id: 'back_matter',
      title: 'HALAMAN BELAKANG & LAMPIRAN',
      subtitle: 'Daftar Pustaka, Jurnal Kegiatan, Absensi, Penilaian & Foto Dokumentasi',
      icon: '📂',
      items: [{ key: 'lampiran_summary', title: 'Daftar Pustaka & Lampiran Dokumentasi', type: 'lampiran' }],
    },
  ]

  const bab1Count = ['latar_belakang', 'tujuan_pkl', 'profil_sejarah', 'tata_tertib', 'narasi_struktur'].filter((k) => {
    const v = ctx.generated_sections?.[k]
    return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
  }).length

  const isReaderLocked = mode === 'reader' && (!isUnlocked || bab1Count < 2)

  return (
    <div
      className="document-reader-view"
      style={{
        background: isReaderLocked ? '#faf9f6' : '#ffffff',
        border: isReaderLocked ? '2px dashed var(--line-strong, #b9b09c)' : '1px solid var(--line-strong, #b9b09c)',
        borderRadius: '12px',
        padding: 'clamp(1rem, 2.5vw, 1.8rem) clamp(0.5rem, 1.8vw, 1.5rem)',
        boxShadow: isReaderLocked ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
        marginTop: 0,
        marginBottom: '0.4rem',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        position: 'relative',
        opacity: isReaderLocked ? 0.55 : 1,
        filter: 'none',
        pointerEvents: isReaderLocked ? 'none' : 'auto',
        userSelect: isReaderLocked ? 'none' : 'auto',
      }}
    >
      {isReaderLocked && (
        <div
          style={{
            position: 'relative',
            marginBottom: '1.25rem',
            padding: '0.65rem 1.25rem',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '30px',
            color: '#166534',
            fontSize: 'clamp(0.78rem, 2.3vw, 0.85rem)',
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)',
            pointerEvents: 'auto',
            opacity: 1,
          }}
        >
          <IconAlert size={16} color="#166534" style={{ flexShrink: 0 }} />
          Pratinjau Mode Baca Terkunci — Lengkapi draf di Mode Edit atau klik "Generate Semua Sub-bab Laporan"
        </div>
      )}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          paddingTop: '0.85rem',
          paddingBottom: '0.75rem',
          position: 'relative',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.05rem, 3.5vw, 1.4rem)', color: 'var(--ink, #262521)', margin: '0 0 0.4rem', textTransform: 'uppercase', wordBreak: 'break-word' }}>
          LAPORAN PRAKTIK KERJA LAPANGAN
        </h2>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(0.9rem, 2.8vw, 1.1rem)', color: 'var(--green-700, #14614a)', margin: 0, fontWeight: 600, wordBreak: 'break-word' }}>
          {ctx.perusahaan?.nama_lengkap || ctx.perusahaan?.nama || 'PERUSAHAAN'}
        </h3>
        <p style={{ fontSize: 'clamp(0.78rem, 2.4vw, 0.85rem)', color: 'var(--ink-soft, #555)', margin: '0.4rem 0 0', wordBreak: 'break-word' }}>
          Oleh: <strong>{ctx.siswa?.nama || 'Siswa'}</strong> ({ctx.siswa?.kelas || 'XII'}) — {ctx.siswa?.jurusan || 'SMK'}
        </p>
        <div
          style={{
            height: '4.5px',
            backgroundColor: 'var(--ink-soft, #475569)',
            borderRadius: '9999px',
            marginTop: '1.25rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '98%',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
      </div>

      {/* Parent Chapter Accordion Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {chapters.map((chap) => (
          <ChapterAccordionGroup
            key={chap.id}
            chapter={chap}
            ctx={ctx}
            onEditSection={onEditSection}
            nav={nav}
            mode={mode}
            updateSection={updateSection}
            onUpdateProfil={onUpdateProfil}
            showErrorModal={showErrorModal}
            isLocked={isReaderLocked}
            expandedSections={expandedSections}
            toggleSectionExpand={toggleSectionExpand}
            defaultExpanded={false}
          />
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------- //
//  Section Editor Component (Accordion Card View)
// --------------------------------------------------------------------------- //
function SectionEditor({
  sectionKey,
  title,
  ctx,
  value,
  onChange,
  onError,
  disabled = false,
  isExpanded = false,
  onToggleExpand,
}: {
  sectionKey: string
  title: string
  ctx: PklContext
  value: string | string[]
  onChange: (val: string | string[]) => void
  onError?: (msg: string) => void
  disabled?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [regen, setRegen] = useState(false)
  const [instruction, setInstruction] = useState('')

  const isArrayType = ARRAY_SECTION_KEYS.includes(sectionKey)

  // Format value into text
  const textValue = Array.isArray(value)
    ? value.map((v) => `- ${v}`).join('\n')
    : (value as string)

  // 1-line snippet for collapsed view
  const snippet = textValue.split('\n').map(s => s.trim()).filter(Boolean)[0] || ''

  const handleGenerate = async () => {
    if (disabled) return
    setLoading(true)
    try {
      let accumulated = ''
      const resContent = await draftSectionStream(sectionKey, ctx, (chunk) => {
        accumulated += chunk
        if (isArrayType) {
          const arr = accumulated
            .split('\n')
            .map((s: string) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
            .filter(Boolean)
          onChange(arr)
        } else {
          onChange(accumulated)
        }
      })

      if (isArrayType) {
        const arr = resContent
          .split('\n')
          .map((s: string) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
          .filter(Boolean)
        onChange(polishAcademicList(arr))
      } else {
        onChange(polishAcademicText(resContent))
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
        onChange(polishAcademicList(arr))
      } else {
        onChange(polishAcademicText(res.content))
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

  const wordCount = textValue ? textValue.trim().split(/\s+/).length : 0

  return (
    <div
      className="card section-editor-card"
      style={{
        marginTop: 0,
        marginBottom: '0.25rem',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        border: isExpanded ? '1.5px solid var(--green-600, #187257)' : '1px solid var(--line, #ddd6c8)',
        borderRadius: '10px',
        padding: 'clamp(0.65rem, 2vw, 1.1rem)',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Accordion Card Header */}
      <div
        onClick={onToggleExpand}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          gap: '0.5rem',
          flexWrap: 'wrap',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 700, flexShrink: 0 }}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <h3 style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 0.98rem)', color: 'var(--ink, #262521)', wordBreak: 'break-word' }}>{title}</h3>
            {textValue ? (
              <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', color: '#059669', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', boxSizing: 'border-box' }}>
                <IconCheck size={13} color="#059669" style={{ marginRight: '3px', flexShrink: 0 }} /> Terisi ({wordCount} kata)
              </span>
            ) : (
              <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '12px', boxSizing: 'border-box' }}>
                Kosong
              </span>
            )}
          </div>

          {!isExpanded && snippet && (
            <p style={{ margin: '0.3rem 0 0 1.3rem', fontSize: 'clamp(0.75rem, 2.3vw, 0.82rem)', color: 'var(--ink-soft, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              {snippet}
            </p>
          )}
        </div>
      </div>

      {/* Accordion Card Content (Expanded Body) */}
      {isExpanded && (
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--line, #e2e8f0)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {loading && (
            <p className="muted" style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: '#187257' }}>
              Penyusun AI sedang menulis draf naratif…
            </p>
          )}

          {!loading && (
            <>
              <textarea
                className="input"
                rows={Math.max(5, textValue ? textValue.split('\n').length + 1 : 4)}
                value={textValue}
                placeholder="Ketik draf tulisan kamu sendiri di sini, atau klik 'Generate AI Bagian Ini' untuk bantuan penyusunan otomatis..."
                onChange={(e) => {
                  if (isArrayType) {
                    const lines = e.target.value.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean)
                    onChange(lines)
                  } else {
                    onChange(e.target.value)
                  }
                }}
                style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, cursor: 'text', fontSize: 'clamp(0.82rem, 2.5vw, 0.93rem)' }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                {!textValue && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGenerate}
                    style={{ fontSize: 'clamp(0.78rem, 2.3vw, 0.85rem)', flexWrap: 'wrap', boxSizing: 'border-box' }}
                  >
                    ✨ Generate AI Bagian Ini
                  </button>
                )}

                {textValue && !regen && (
                  <button
                    type="button"
                    className="btn-sm btn-outline"
                    onClick={() => setRegen(true)}
                    style={{ fontSize: 'clamp(0.75rem, 2.3vw, 0.82rem)', flexWrap: 'wrap', boxSizing: 'border-box' }}
                  >
                    <IconPencil size={14} style={{ marginRight: '0.3rem', flexShrink: 0 }} /> Perbaiki &amp; Tulis Ulang (AI)
                  </button>
                )}

                {textValue && regen && (
                  <>
                    <input
                      type="text"
                      className="input"
                      style={{ flex: '1 1 180px', padding: '0.35rem 0.6rem', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', fontSize: 'clamp(0.78rem, 2.3vw, 0.85rem)' }}
                      placeholder="Instruksi: contoh 'Lebih padat', 'Gunakan istilah TKJ yang baku'"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                    />
                    <button type="button" className="btn-sm" onClick={handleRegenerate} style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)', boxSizing: 'border-box', flexWrap: 'wrap' }}>
                      Proses
                    </button>
                    <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(false)} style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)', boxSizing: 'border-box', flexWrap: 'wrap' }}>
                      Batal
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
