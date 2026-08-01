import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getDraft, updateDraft, generateDocx, draftSectionStream, regenerateSection } from '@/api/client'
import AntiAIHighlighter from '@/components/editor/AntiAIHighlighter'
import DocumentOutline from '@/components/editor/DocumentOutline'
import RequestionPanel, { type GenerateIssue, type Requestion } from '@/components/RequestionPanel'
import NotificationModal from '@/components/common/NotificationModal'
import ProfilPolishModal from '@/components/editor/ProfilPolishModal'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'
import { IconDocument, IconDownload, IconAlert, IconPencil, IconCheck } from '@/components/common/Icons'

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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const dirtyRef = useRef(false)

  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const draftIdRef = useRef(draftId)
  draftIdRef.current = draftId

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const savingPromiseRef = useRef<Promise<any> | null>(null)

  const [downloading, setDownloading] = useState(false)
  const [genError, setGenError] = useState('')
  const [genIssues, setGenIssues] = useState<GenerateIssue[]>([])
  const [genQuestions, setGenQuestions] = useState<Requestion[]>([])
  const [polishNotice, setPolishNotice] = useState('')

  // In-Page Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [batchStatuses, setBatchStatuses] = useState<Record<string, 'pending' | 'generating' | 'success' | 'failed'>>({})
  const [showProfilPolishModal, setShowProfilPolishModal] = useState(false)

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

  const handleStartInPageBatch = async () => {
    if (isBatchGenerating || !draftIdRef.current) return

    setIsBatchGenerating(true)
    const allSections = buildSectionList(ctxRef.current)
    const initialStatuses: Record<string, 'pending' | 'generating' | 'success' | 'failed'> = {}

    allSections.forEach((sec) => {
      const existing = ctxRef.current.generated_sections?.[sec.key]
      if (existing && (Array.isArray(existing) ? existing.length > 0 : !!(typeof existing === 'string' && existing.trim()))) {
        initialStatuses[sec.key] = 'success'
      } else {
        initialStatuses[sec.key] = 'pending'
      }
    })

    setBatchStatuses(initialStatuses)

    let currentCtx = { ...ctxRef.current }
    const failedList: string[] = []

    for (let i = 0; i < allSections.length; i++) {
      const sec = allSections[i]

      // Scroll smoothly to active section on screen
      const el = document.getElementById(`section-${sec.key}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      setBatchStatuses((prev) => ({ ...prev, [sec.key]: 'generating' }))

      try {
        let accumulatedStream = ''

        // 2-minute maximum timeout promise for generation
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI tidak merespon (Timeout)')), 120000)
        )

        const rawContent: string = await Promise.race([
          draftSectionStream(sec.key, currentCtx, (chunk) => {
            accumulatedStream += chunk
            setCtx((prev) => ({
              ...prev,
              generated_sections: {
                ...(prev.generated_sections || {}),
                [sec.key]: accumulatedStream + ' ▌',
              },
            }))
          }),
          timeoutPromise,
        ])

        let parsedContent: string | string[] = rawContent
        if (ARRAY_SECTION_KEYS.includes(sec.key)) {
          parsedContent = rawContent
            .split('\n')
            .map((s: string) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
            .filter(Boolean)
        }

        currentCtx = {
          ...currentCtx,
          generated_sections: {
            ...(currentCtx.generated_sections || {}),
            [sec.key]: parsedContent,
          },
        }

        setCtx(currentCtx)
        dirtyRef.current = true
        setBatchStatuses((prev) => ({ ...prev, [sec.key]: 'success' }))

        try {
          await updateDraft(draftIdRef.current, { data: currentCtx })
        } catch (saveErr) {
          console.warn('[InPageBatch] Intermediate save error:', saveErr)
        }

      } catch (err: any) {
        failedList.push(sec.title)
        setBatchStatuses((prev) => ({ ...prev, [sec.key]: 'failed' }))
      }
    }

    setIsBatchGenerating(false)

    // Calculate total successful sections in context
    const totalGenCount = Object.keys(currentCtx.generated_sections || {}).filter((k) => {
      const v = currentCtx.generated_sections?.[k]
      return Array.isArray(v) ? v.length > 0 : !!(typeof v === 'string' && v.trim())
    }).length

    if (totalGenCount < 3) {
      setModal({
        isOpen: true,
        title: 'Penyusunan Sub-bab Belum Memenuhi Syarat Minimal',
        message: `Hanya ${totalGenCount} sub-bab yang berhasil disusun. Minimal 3 sub-bab harus berhasil diselesaikan agar editor terbuka. Silakan periksa server AI Anda dan klik tombol 'Generate Semua Sub-bab Laporan' kembali.`,
        type: 'error',
      })
    } else {
      setShowProfilPolishModal(true)
      if (failedList.length > 0) {
        setModal({
          isOpen: true,
          title: 'Penyusunan Sub-bab Selesai',
          message: `Sebanyak ${totalGenCount} sub-bab berhasil disusun. Terdapat ${failedList.length} sub-bab yang gagal/timeout 15 detik (${failedList.join(', ')}). Pintu editor telah terbuka dan Anda dapat mencoba bagian yang gagal tersebut secara individu.`,
          type: 'warning',
        })
      }
    }
  }

  // Auto-trigger batch generation on mount if ?batch=true parameter is present
  useEffect(() => {
    if (searchParams.get('batch') === 'true' && !loading) {
      handleStartInPageBatch()
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
              className="btn-sm btn-outline"
              onClick={handleManualSave}
              disabled={saveState === 'saving' || isBatchGenerating}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.7rem' }}
            >
              <IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Simpan Draf
            </button>
            <span className="save-indicator">
              {saveState === 'saving' && 'menyimpan draf…'}
              {saveState === 'saved' && 'tersimpan ✓'}
              {saveState === 'error' && (
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  Gagal menyimpan - Cek Koneksi Internet! ⚠
                </span>
              )}
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
                onClick={handleStartInPageBatch}
                disabled={isBatchGenerating}
                style={{ opacity: isBatchGenerating ? 0.6 : 1, cursor: isBatchGenerating ? 'wait' : 'pointer' }}
              >
                <IconDocument size={16} style={{ marginRight: '0.4rem' }} />
                {isBatchGenerating ? 'Sedang Menyusun Sub-bab...' : 'Generate Semua Sub-bab Laporan'}
              </button>
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
                disabled={!isUnlocked || isBatchGenerating}
                batchStatus={batchStatuses[sec.key]}
                isBatchGenerating={isBatchGenerating}
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

      {/* Profil Perusahaan Polish Modal */}
      <ProfilPolishModal
        isOpen={showProfilPolishModal}
        ctx={ctx}
        onComplete={(updatedProfil) => {
          const updated = {
            ...ctxRef.current,
            profil_perusahaan: { ...ctxRef.current.profil_perusahaan, ...updatedProfil },
          }
          setCtx(updated)
          dirtyRef.current = true
          if (draftIdRef.current) {
            updateDraft(draftIdRef.current, { data: updated }).catch(() => {})
          }
        }}
        onClose={() => setShowProfilPolishModal(false)}
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
  batchStatus,
  isBatchGenerating = false,
}: {
  sectionKey: string
  title: string
  ctx: PklContext
  value: string | string[]
  onChange: (val: any) => void
  onError?: (msg: string) => void
  disabled?: boolean
  batchStatus?: 'pending' | 'generating' | 'success' | 'failed'
  isBatchGenerating?: boolean
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
    if (disabled || isBatchGenerating) return
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
        onChange(arr)
      } else {
        onChange(resContent)
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
    if (disabled || isBatchGenerating || !instruction) {
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

  const isCurrentGenerating = batchStatus === 'generating'

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        opacity: disabled && !isCurrentGenerating ? 0.6 : 1,
        borderColor: isCurrentGenerating ? '#187257' : undefined,
        boxShadow: isCurrentGenerating ? '0 0 0 2px rgba(24, 114, 87, 0.2)' : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {batchStatus === 'generating' && (
            <span style={{ fontSize: '0.78rem', color: '#187257', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <svg className="animate-spin" style={{ width: '13px', height: '13px', marginRight: '4px' }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyusun...
            </span>
          )}
          {batchStatus === 'failed' && (
            <span style={{ fontSize: '0.78rem', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <IconAlert size={14} color="#dc2626" style={{ marginRight: '3px' }} /> Gagal
            </span>
          )}
          {batchStatus === 'success' && !isCurrentGenerating && (
            <span style={{ fontSize: '0.78rem', color: '#059669', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <IconCheck size={14} color="#059669" style={{ marginRight: '3px' }} /> Selesai
            </span>
          )}
        </div>

        {!textValue && !loading && !isCurrentGenerating && (
          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={handleGenerate}
            disabled={disabled || isBatchGenerating}
            style={{ opacity: disabled || isBatchGenerating ? 0.5 : 1, cursor: disabled || isBatchGenerating ? 'not-allowed' : 'pointer' }}
          >
            Generate AI
          </button>
        )}
      </div>

      {(loading || isCurrentGenerating) && (
        <p className="muted" style={{ fontSize: '0.9rem', color: '#187257' }}>
          Penyusun AI sedang menulis draf naratif…
        </p>
      )}

      {!loading && !isCurrentGenerating && textValue && (
        <>
          <textarea
            className="input"
            rows={Math.max(5, textValue.split('\n').length + 1)}
            value={textValue}
            disabled={isBatchGenerating}
            onChange={(e) => {
              if (isArrayType) {
                const lines = e.target.value.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean)
                onChange(lines)
              } else {
                onChange(e.target.value)
              }
            }}
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, opacity: disabled || isBatchGenerating ? 0.7 : 1, cursor: disabled || isBatchGenerating ? 'not-allowed' : 'text' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {!regen ? (
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => setRegen(true)}
                disabled={disabled || isBatchGenerating}
                style={{ opacity: disabled || isBatchGenerating ? 0.5 : 1, cursor: disabled || isBatchGenerating ? 'not-allowed' : 'pointer' }}
              >
                <IconPencil size={14} style={{ marginRight: '0.3rem' }} /> Perbaiki &amp; Tulis Ulang
              </button>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  disabled={disabled || isBatchGenerating}
                  style={{ flex: 1, padding: '0.35rem 0.6rem' }}
                  placeholder="Instruksi: contoh 'Lebih padat', 'Gunakan istilah TKJ yang baku'"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                />
                <button type="button" className="btn-sm" onClick={handleRegenerate} disabled={disabled || isBatchGenerating}>
                  Proses
                </button>
                <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(false)}>
                  Batal
                </button>
              </>
            )}
          </div>

          {/* Fitur Saran Penulisan Natural (Anti-AI) nonaktif sementara atas permintaan user */}
          {false && !disabled && !isBatchGenerating && (
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

      {!loading && !isCurrentGenerating && !textValue && (
        <div style={{ padding: '1.75rem', textAlign: 'center', background: 'var(--paper-2, #ece8de)', borderRadius: '8px' }}>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>Belum ada draf tulisan untuk bagian ini.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={disabled || isBatchGenerating}
            style={{ opacity: disabled || isBatchGenerating ? 0.5 : 1, cursor: disabled || isBatchGenerating ? 'not-allowed' : 'pointer' }}
          >
            Generate AI
          </button>
        </div>
      )}
    </div>
  )
}
