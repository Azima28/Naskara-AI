import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getDraft, updateDraft, generateDocx, draftSection, regenerateSection, enhanceContext } from '@/api/client'
import AntiAIHighlighter from '@/components/editor/AntiAIHighlighter'
import RequestionPanel, { type GenerateIssue, type Requestion } from '@/components/RequestionPanel'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'

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

  const updateSection = useCallback((key: string, content: string) => {
    setCtx((prev) => {
      const gen = prev.generated_sections || {}
      return { ...prev, generated_sections: { ...gen, [key]: content } }
    })
    dirtyRef.current = true
  }, [])

  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Memuat editor…</p>
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
            <Link to={`/wizard/${draftId}`}>←</Link> &nbsp; Review &amp; Edit: {title}
          </h1>
          <span className="save-indicator">
            {saveState === 'saving' && 'menyimpan…'}
            {saveState === 'saved' && 'tersimpan ✓'}
          </span>
        </div>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Gunakan AI untuk membuat draf naratif setiap bagian laporan. Kamu bisa mengedit hasilnya langsung.
        </p>
      </header>

      <div className="editor-grid">
        <div className="editor-sections">
          {sections.map((sec) => (
            <SectionEditor
              key={sec.key}
              sectionKey={sec.key}
              title={sec.title}
              ctx={ctx}
              value={(ctx.generated_sections || {})[sec.key] || ''}
              onChange={(val) => updateSection(sec.key, val)}
            />
          ))}
          {sections.length === 0 && (
            <div className="card">
              <p className="muted">Belum ada bagian yang dikonfigurasi untuk laporan ini.</p>
            </div>
          )}
        </div>

        <div className="editor-sidebar">
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3>Finalisasi</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Progress Draft</span>
                <strong>{Object.keys(ctx.generated_sections || {}).length} / {sections.length}</strong>
              </div>
              <div className="completeness__bar">
                <div 
                  className="completeness__fill is-ready" 
                  style={{ width: `${sections.length > 0 ? (Object.keys(ctx.generated_sections || {}).length / sections.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Data Mentah Kurang Rapi?</h4>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                Jika jawaban di langkah sebelumnya terlalu singkat atau tidak formal (misal: "gatau", "apa aja"), gunakan AI untuk merapikan semuanya menjadi kalimat akademis.
              </p>
              <button
                type="button"
                className="btn-sm btn-outline"
                style={{ width: '100%', borderColor: 'var(--green-600)', color: 'var(--green-700)' }}
                disabled={enhancing || downloading}
                onClick={async () => {
                  if (!draftId) return
                  if (!confirm("AI akan menulis ulang data mentah yang kurang rapi menjadi kalimat formal. Lanjutkan?")) return
                  setEnhancing(true)
                  try {
                    const res = await enhanceContext(ctx)
                    setCtx(res.context_data)
                    dirtyRef.current = true
                    alert("Data mentah berhasil dirapikan! Anda bisa kembali ke halaman wizard sebelumnya jika ingin mengecek/mengubahnya.")
                  } catch (err: any) {
                    alert(err?.message || 'Gagal merapikan data.')
                  } finally {
                    setEnhancing(false)
                  }
                }}
              >
                {enhancing ? 'Sedang merapikan…' : 'Rapikan Data Mentah'}
              </button>
            </div>

            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Pastikan semua bagian sudah terisi dan di-review sebelum men-download.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={downloading}
              onClick={async () => {
                if (!draftId) return
                setDownloading(true)
                setGenError('')
                setGenIssues([])
                setGenQuestions([])
                try {
                  await updateDraft(draftId, { data: ctx, status: 'completed' })
                  await generateDocx(draftId)
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
              {downloading ? 'Menyusun dokumen…' : 'Download .docx'}
            </button>
            {genError && (genIssues.length > 0 || genQuestions.length > 0 ? (
              <RequestionPanel message={genError} issues={genIssues} requestions={genQuestions} />
            ) : (
              <p style={{ color: 'var(--red-600)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{genError}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function buildSectionList(ctx: PklContext) {
  const bab = ctx.config?.bab_modules || []
  const list: { key: string; title: string }[] = []

  if (bab.includes('PENDAHULUAN')) {
    list.push({ key: 'latar_belakang', title: 'Latar Belakang' })
    list.push({ key: 'tujuan_pkl', title: 'Tujuan PKL' })
  }
  if (bab.includes('PROFIL_PERUSAHAAN')) {
    list.push({ key: 'profil_sejarah', title: 'Sejarah Singkat Perusahaan' })
    list.push({ key: 'narasi_struktur', title: 'Narasi Struktur Organisasi' })
  }
  if (bab.includes('LANDASAN_TEORI') || bab.includes('TINJAUAN_PUSTAKA')) {
    list.push({ key: 'landasan_teori', title: 'Landasan Teori' })
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
    list.push({ key: 'kesimpulan_saran', title: 'Kesimpulan dan Saran' })
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

  // Handle value that might be an array (like kesimpulan/saran)
  const textValue = Array.isArray(value) ? value.map((v) => `- ${v}`).join('\\n') : (value as string)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await draftSection(sectionKey, ctx)
      // If it expects array (like tujuan, kesimpulan), split by lines roughly
      if (['tujuan', 'manfaat', 'kesimpulan', 'saran', 'rumusan_masalah'].includes(sectionKey)) {
        const arr = res.content
          .split('\n')
          .map((s) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
          .filter(Boolean)
        onChange(arr)
      } else {
        onChange(res.content)
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Gagal generate draft AI')
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
      if (['tujuan', 'manfaat', 'kesimpulan', 'saran', 'rumusan_masalah'].includes(sectionKey)) {
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
      alert(err?.response?.data?.detail || err?.message || 'Gagal generate ulang')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {!textValue && !loading && (
          <button type="button" className="btn-sm" onClick={handleGenerate}>
            Generate AI
          </button>
        )}
      </div>

      {loading && <p className="muted">AI sedang menulis…</p>}

      {!loading && textValue && (
        <>
          <textarea
            className="input"
            rows={Math.max(5, textValue.split('\\n').length + 1)}
            value={textValue}
            onChange={(e) => {
              if (['tujuan', 'manfaat', 'kesimpulan', 'saran', 'rumusan_masalah'].includes(sectionKey)) {
                onChange(e.target.value.split('\\n').filter(Boolean))
              } else {
                onChange(e.target.value)
              }
            }}
            style={{ width: '100%', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {!regen ? (
              <button type="button" className="btn-sm btn-outline" onClick={() => setRegen(true)}>
                🔄 Regenerate
              </button>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  style={{ flex: 1, padding: '0.25rem 0.5rem' }}
                  placeholder="Instruksi: e.g. 'Lebih singkat' atau 'Jangan pakai kata ini'"
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
          <AntiAIHighlighter text={textValue} />
        </>
      )}

      {!loading && !textValue && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-sunken)', borderRadius: '6px' }}>
          <p className="muted" style={{ marginBottom: '1rem' }}>Belum ada draf untuk bagian ini.</p>
          <button type="button" onClick={handleGenerate}>
            Buat Draf Sekarang
          </button>
        </div>
      )}
    </div>
  )
}
