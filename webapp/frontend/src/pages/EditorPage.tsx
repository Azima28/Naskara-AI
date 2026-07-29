import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getDraft, updateDraft, generateDocx, draftSection, regenerateSection, enhanceContext } from '@/api/client'
import AntiAIHighlighter from '@/components/editor/AntiAIHighlighter'
import EnhancementDiffModal from '@/components/editor/EnhancementDiffModal'
import DocumentOutline from '@/components/editor/DocumentOutline'
import RequestionPanel, { type GenerateIssue, type Requestion } from '@/components/RequestionPanel'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'

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
  const [ctx, setCtx] = useState<PklContext>(emptyContext())
  const [title, setTitle] = useState('Laporan PKL')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const dirtyRef = useRef(false)

  const [downloading, setDownloading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [genError, setGenError] = useState('')
  const [genIssues, setGenIssues] = useState<GenerateIssue[]>([])
  const [genQuestions, setGenQuestions] = useState<Requestion[]>([])
  const [polishNotice, setPolishNotice] = useState('')
  const [isDocxReady, setIsDocxReady] = useState(false)

  // Diff Modal State
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [pendingEnhancedCtx, setPendingEnhancedCtx] = useState<PklContext | null>(null)
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>(undefined)

  // Load draft
  useEffect(() => {
    if (!draftId) return
    getDraft(draftId)
      .then((d) => {
        setCtx(d.data)
        setTitle(d.title)
      })
      .finally(() => setLoading(false))
  }, [draftId])

  // Autosave
  useEffect(() => {
    if (!dirtyRef.current || !draftId) return
    setSaveState('saving')
    const t = setTimeout(() => {
      updateDraft(draftId, { data: ctx, status: 'completed' })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'))
    }, 2000)
    return () => clearTimeout(t)
  }, [ctx, draftId])

  const updateSection = useCallback((key: string, content: string | string[]) => {
    setCtx((prev) => {
      const gen = prev.generated_sections || {}
      return { ...prev, generated_sections: { ...gen, [key]: content } }
    })
    dirtyRef.current = true
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

  // Tentukan section apa saja yang perlu di-generate/edit
  const sections = buildSectionList(ctx)

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__row">
          <h1>
            <Link to={`/wizard/${draftId}`}>← Kembali ke Form Data</Link> &nbsp;|&nbsp; Review &amp; Edit: {title}
          </h1>
          <span className="save-indicator">
            {saveState === 'saving' && 'menyimpan draf…'}
            {saveState === 'saved' && 'tersimpan otomatis ✓'}
          </span>
        </div>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Gunakan AI untuk menyusun draf naratif tiap bagian laporan secara akademis (KBBI). Kamu bisa menyunting hasilnya secara langsung.
        </p>
      </header>

      <div className="editor-grid">
        {/* Editor Main Content */}
        <div className="editor-sections">
          {sections.map((sec) => (
            <div id={`section-${sec.key}`} key={sec.key}>
              <SectionEditor
                sectionKey={sec.key}
                title={sec.title}
                ctx={ctx}
                value={(ctx.generated_sections || {})[sec.key] || ''}
                onChange={(val) => updateSection(sec.key, val)}
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

            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'var(--paper-2, #ece8de)', borderRadius: '8px', border: '1px solid var(--line, #ddd6c8)' }}>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem' }}>📝 Bahasa Data Kurang Formal?</h4>
              <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.85rem', lineHeight: 1.45 }}>
                Gunakan AI untuk memformalkan data mentah menjadi kalimat akademis resmi. Kamu dapat melihat perbandingannya terlebih dahulu.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  background: isDocxReady ? 'var(--green-700)' : 'var(--green-600)',
                  color: '#ffffff',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.88rem',
                }}
                disabled={enhancing || downloading}
                onClick={async () => {
                  if (!draftId) return
                  setEnhancing(true)
                  try {
                    const res = await enhanceContext(ctx)
                    setPendingEnhancedCtx(res.context_data)
                    setShowDiffModal(true)
                  } catch (err: any) {
                    alert(err?.message || 'Gagal merapikan data.')
                  } finally {
                    setEnhancing(false)
                  }
                }}
              >
                {enhancing ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="animate-spin" style={{ width: '16px', height: '16px', marginRight: '8px' }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memformalkan Bahasa…
                  </span>
                ) : isDocxReady ? '✓ Data Sudah Akademis (Tinjau Ulang)' : '📝 Formalkan Teks ke Bahasa Akademis (KBBI)'}
              </button>
            </div>

            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.85rem' }}>
              Pastikan seluruh bagian laporan telah ditinjau dengan rapi sebelum mengunduh file `.docx`.
            </p>

            <button
              type="button"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.98rem',
                fontWeight: 600,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                ...(isDocxReady
                  ? {
                      background: 'var(--green-600)',
                      color: '#ffffff',
                      border: '1px solid var(--green-700)',
                      cursor: downloading ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(22, 101, 52, 0.2)',
                    }
                  : {
                      background: '#e2e8f0',
                      color: '#94a3b8',
                      border: '1px solid #cbd5e1',
                      cursor: 'not-allowed',
                    }),
              }}
              disabled={!isDocxReady || downloading}
              onClick={async () => {
                if (!draftId || !isDocxReady) return
                setDownloading(true)
                setGenError('')
                setGenIssues([])
                setGenQuestions([])
                try {
                  await updateDraft(draftId, { data: ctx, status: 'completed' })
                  const notice = await generateDocx(draftId)
                  setPolishNotice(notice || '')
                } catch (err: any) {
                  const detail = err?.response?.data?.detail
                  if (typeof detail === 'string') {
                    setGenError(detail)
                  } else {
                    setGenError(detail?.message || err?.message || 'Gagal generate dokumen')
                    setGenIssues(detail?.issues || [])
                    setGenQuestions(detail?.requestions || [])
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
              ) : '📥 Download .docx (Siap Cetak)'}
            </button>

            {genError && (genIssues.length > 0 || genQuestions.length > 0 ? (
              <RequestionPanel message={genError} issues={genIssues} requestions={genQuestions} />
            ) : (
              <p style={{ color: 'var(--red-600)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{genError}</p>
            ))}

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
                ⚠️ {polishNotice}
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
          onApply={(finalCtx) => {
            setCtx(finalCtx)
            dirtyRef.current = true
            setIsDocxReady(true)
            setShowDiffModal(false)
          }}
          onCancel={() => {
            setShowDiffModal(false)
          }}
        />
      )}
    </div>
  )
}

function buildSectionList(ctx: PklContext) {
  const bab = ctx.config?.bab_modules || []
  const list: { key: string; title: string }[] = []

  // BAB I PENDAHULUAN — termasuk profil perusahaan (sub-bab 1.3-1.6)
  if (bab.includes('PENDAHULUAN')) {
    list.push({ key: 'latar_belakang', title: 'Latar Belakang (1.1)' })
    list.push({ key: 'tujuan_pkl', title: 'Tujuan PKL (1.2)' })
    list.push({ key: 'profil_sejarah', title: 'Sejarah Singkat Perusahaan (1.3)' })
    list.push({ key: 'narasi_struktur', title: 'Narasi Struktur Organisasi (1.5)' })
  }
  if (bab.includes('LANDASAN_TEORI') || bab.includes('TINJAUAN_PUSTAKA')) {
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
  if (bab.includes('PEMBAHASAN')) {
    list.push({ key: 'pembahasan', title: 'Pembahasan & Analisis (BAB V)' })
  }
  if (bab.includes('PENUTUP') || bab.includes('KESIMPULAN_SARAN')) {
    list.push({ key: 'kesimpulan_saran', title: 'Kesimpulan dan Saran (BAB VI)' })
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
}: {
  sectionKey: string
  title: string
  ctx: PklContext
  value: string | string[]
  onChange: (val: any) => void
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
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!instruction) {
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
      alert(err?.response?.data?.detail || err?.message || 'Gagal memperbarui draf')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {!textValue && !loading && (
          <button type="button" className="btn-sm btn-primary" onClick={handleGenerate}>
            ✨ Tulis Draf dengan AI
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
            onChange={(e) => {
              if (isArrayType) {
                const lines = e.target.value.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean)
                onChange(lines)
              } else {
                onChange(e.target.value)
              }
            }}
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {!regen ? (
              <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(true)}>
                🔄 Perbaiki &amp; Tulis Ulang
              </button>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  style={{ flex: 1, padding: '0.35rem 0.6rem' }}
                  placeholder="Instruksi: contoh 'Lebih padat', 'Gunakan istilah TKJ yang baku'"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                />
                <button type="button" className="btn-sm" onClick={handleRegenerate}>
                  Proses
                </button>
                <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(false)}>
                  Batal
                </button>
              </>
            )}
          </div>

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
        </>
      )}

      {!loading && !textValue && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--paper-2, #ece8de)', borderRadius: '8px' }}>
          <p className="muted" style={{ marginBottom: '1rem' }}>Belum ada draf tulisan untuk bagian ini.</p>
          <button type="button" className="btn-primary" onClick={handleGenerate}>
            ✨ Buat Draf Naratif Sekarang
          </button>
        </div>
      )}
    </div>
  )
}
