import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompletenessBar from '@/components/CompletenessBar'
import { getDraft, updateDraft } from '@/api/client'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'
import { IconDocument } from '@/components/common/Icons'
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner'

import SiswaStep from '@/components/wizard/steps/SiswaStep'
import SekolahStep from '@/components/wizard/steps/SekolahStep'
import PerusahaanStep from '@/components/wizard/steps/PerusahaanStep'
import PklStep from '@/components/wizard/steps/PklStep'
import ProfilStep from '@/components/wizard/steps/ProfilStep'
import ReviewAIStep from '@/components/wizard/steps/ReviewAIStep'
import StudiKasusStep from '@/components/wizard/steps/StudiKasusStep'
import ClosingStep from '@/components/wizard/steps/ClosingStep'
import AssetsStep from '@/components/wizard/steps/AssetsStep'

import { findFirstInvalidField } from '@/utils/validationHelpers'

interface StepDef {
  id: string
  title: string
  render: (ctx: PklContext, set: (patch: Partial<PklContext>) => void) => React.ReactNode
}

const STEPS: StepDef[] = [
  { id: 'siswa', title: 'Data Siswa', render: (c, s) => <SiswaStep ctx={c} set={s} /> },
  { id: 'sekolah', title: 'Data Sekolah', render: (c, s) => <SekolahStep ctx={c} set={s} /> },
  { id: 'perusahaan', title: 'Data Perusahaan', render: (c, s) => <PerusahaanStep ctx={c} set={s} /> },
  { id: 'pkl', title: 'Periode PKL', render: (c, s) => <PklStep ctx={c} set={s} /> },
  { id: 'profil', title: 'Profil Perusahaan (BAB II)', render: (c, s) => <ProfilStep ctx={c} set={s} /> },
  { id: 'review-ai', title: 'Kegiatan, Peralatan & Kendala', render: (c, s) => <ReviewAIStep ctx={c} set={s} /> },
  { id: 'studi-kasus', title: 'Studi Kasus Teknis', render: (c, s) => <StudiKasusStep ctx={c} set={s} /> },
  { id: 'closing', title: 'Penutup & Kesimpulan', render: (c, s) => <ClosingStep ctx={c} set={s} /> },
  { id: 'assets', title: 'Lampiran & Foto', render: (c, s) => <AssetsStep ctx={c} set={s} /> },
]

export default function WizardPage() {
  return (
    <ProtectedRoute>
      <WizardInner />
    </ProtectedRoute>
  )
}

function WizardInner() {
  const { draftId } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const [ctx, setCtx] = useState<PklContext>(emptyContext())
  const [title, setTitle] = useState('Laporan PKL')
  const [stepIdx, setStepIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [valError, setValError] = useState<{ message: string; fieldKey: string } | null>(null)
  const dirtyRef = useRef(false)

  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const draftIdRef = useRef(draftId)
  draftIdRef.current = draftId

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const savingPromiseRef = useRef<Promise<any> | null>(null)

  const highlightField = useCallback((fieldKey: string) => {
    setTimeout(() => {
      const cleanKey = fieldKey.includes('.') ? fieldKey.split('.').pop()! : fieldKey
      const target =
        document.getElementById(`field-${fieldKey}`) ||
        document.querySelector(`[data-field="${fieldKey}"]`) ||
        document.querySelector(`[name="${fieldKey}"]`) ||
        document.getElementById(`field-${cleanKey}`) ||
        document.querySelector(`[data-field="${cleanKey}"]`) ||
        document.querySelector(`[data-field*="${cleanKey}"]`) ||
        document.querySelector(`[name="${cleanKey}"]`)

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('field--highlight-invalid')
        const inputEl = target.querySelector('input, select, textarea') as HTMLElement
        if (inputEl) {
          inputEl.focus()
        }
        const removeHighlight = () => {
          target.classList.remove('field--highlight-invalid')
        }
        target.addEventListener('input', removeHighlight, { once: true })
        target.addEventListener('change', removeHighlight, { once: true })
        setTimeout(removeHighlight, 6000)
      }
    }, 350)
  }, [])

  const flushSave = useCallback(async (extraStatus?: string) => {
    if (savingPromiseRef.current) {
      try {
        await savingPromiseRef.current
      } catch {
        /* ignore prior save errors */
      }
    }
    if (loadingRef.current || !dirtyRef.current || !draftIdRef.current) return

    setSaveState('saving')
    const patch: { data: PklContext; status?: string } = { data: ctxRef.current }
    if (extraStatus) patch.status = extraStatus

    const promise = updateDraft(draftIdRef.current, patch)
      .then((updated) => {
        setCtx(updated.data)
        setSaveState('saved')
        dirtyRef.current = false
      })
      .catch((err) => {
        setSaveState('idle')
        if (err?.response?.status === 404) {
          dirtyRef.current = false
          nav('/dashboard')
        }
        throw err
      })
      .finally(() => {
        savingPromiseRef.current = null
      })

    savingPromiseRef.current = promise
    await promise
  }, [nav])

  // Handle URL query parameter step navigation & field highlight (e.g., ?step=assets&field=lampiran.foto_kegiatan)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    const fieldParam = searchParams.get('field')

    if (stepParam) {
      const idx = STEPS.findIndex((s) => s.id === stepParam)
      if (idx !== -1) {
        setStepIdx(idx)
      } else if (!isNaN(Number(stepParam))) {
        const num = Number(stepParam)
        if (num >= 0 && num < STEPS.length) {
          setStepIdx(num)
        }
      }
    }

    if (fieldParam) {
      highlightField(fieldParam)
    }
  }, [searchParams, highlightField])

  // Load draft
  useEffect(() => {
    if (!draftId) return
    setLoading(true)
    getDraft(draftId)
      .then((d) => {
        setCtx(d.data)
        setTitle(d.title)
        dirtyRef.current = false

        if (searchParams.get('valError') === 'true') {
          const invalid = findFirstInvalidField(d.data)
          if (invalid) {
            setValError({
              message: `⚠️ Form Data Wizard belum lengkap. Kolom WAJIB "${invalid.fieldLabel}" pada ${invalid.stepTitle} belum diisi/dipilih. Silakan lengkapi terlebih dahulu!`,
              fieldKey: invalid.fieldKey,
            })
            setStepIdx(invalid.stepIdx)
            setTimeout(() => {
              highlightField(invalid.fieldKey)
            }, 300)
          }
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          dirtyRef.current = false
          nav('/dashboard')
        }
      })
      .finally(() => setLoading(false))
  }, [draftId, nav, searchParams, highlightField])

  // Autosave (debounced 2s after last change)
  useEffect(() => {
    if (loading || !dirtyRef.current || !draftId) return
    setSaveState('saving')
    const t = setTimeout(() => {
      flushSave()
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
        updateDraft(draftIdRef.current, { data: ctxRef.current })
      }
    }
  }, [])

  const set = useCallback((patch: Partial<PklContext>) => {
    setCtx((prev) => ({ ...prev, ...patch }))
    dirtyRef.current = true
  }, [])

  const handleManualSave = async () => {
    if (!draftId || loading) return
    dirtyRef.current = true
    await flushSave()
  }

  const handleStepChange = async (newIdx: number, clearError = true) => {
    if (clearError) {
      setValError(null)
    }
    await flushSave()
    setStepIdx(newIdx)
    window.scrollTo(0, 0)
  }

  const current = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  /**
   * Status penyelesaian per langkah untuk indikator stepper.
   */
  const isStepDone = (i: number) => {
    const filled = (v?: string) => !!v && v.trim().length > 0
    switch (STEPS[i].id) {
      case 'siswa':
        return filled(ctx.siswa?.nama) && filled(ctx.siswa?.kelas) && filled(ctx.siswa?.jurusan)
      case 'sekolah':
        return filled(ctx.sekolah?.nama) && filled(ctx.sekolah?.kepala_sekolah?.nama)
      case 'perusahaan':
        return filled(ctx.perusahaan?.nama) && filled(ctx.perusahaan?.alamat)
      case 'pkl':
        return filled(ctx.pkl?.tanggal_mulai) && filled(ctx.pkl?.tanggal_selesai)
      case 'profil':
        return filled(ctx.profil_perusahaan?.sejarah) || filled(ctx.profil_perusahaan?.visi)
      case 'review-ai':
        return (ctx.kegiatan || []).length > 0
      case 'studi-kasus':
        return filled(ctx.studi_kasus?.judul) || filled(ctx.studi_kasus?.latar_belakang)
      case 'closing':
        return filled(ctx.kata_pengantar?.ucapan_syukur) || filled(ctx.kesimpulan_user)
      case 'assets':
        return (ctx.assets && ctx.assets.length > 0) || (ctx.lampiran?.foto_kegiatan && ctx.lampiran.foto_kegiatan.length > 0)
      default:
        return false
    }
  }

  const next = async () => {
    // Validasi kelengkapan kolom WAJIB HANYA dipicu saat tombol akhir "Review & Edit Laporan →" diklik
    if (isLast) {
      const currentCtx = ctxRef.current
      const invalid = findFirstInvalidField(currentCtx)
      if (invalid) {
        setValError({
          message: `⚠️ Kolom WAJIB "${invalid.fieldLabel}" pada ${invalid.stepTitle} belum diisi/dipilih. Silakan lengkapi terlebih dahulu!`,
          fieldKey: invalid.fieldKey,
        })
        if (stepIdx !== invalid.stepIdx) {
          await handleStepChange(invalid.stepIdx, false)
        }
        highlightField(invalid.fieldKey)
        return
      }

      setValError(null)
      await flushSave('reviewing')
      const hasGen = Object.keys(currentCtx.generated_sections || {}).length > 0
      nav(`/editor/${draftId}${hasGen ? '' : '?batch=true'}`)
    } else {
      setValError(null)
      await handleStepChange(Math.min(stepIdx + 1, STEPS.length - 1))
    }
  }

  const prev = async () => {
    setValError(null)
    await handleStepChange(Math.max(stepIdx - 1, 0))
  }

  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Memuat draft…</p>
      </div>
    )
  }

  return (
    <div className="shell">
      <MaintenanceBanner />

      <header className="shell__header">
        <div className="shell__row">
          <h1>
            <Link to="/dashboard">←</Link> &nbsp; {title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              {saveState === 'saving' && 'menyimpan…'}
              {saveState === 'saved' && 'tersimpan ✓'}
            </span>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <CompletenessBar ctx={ctx} />
        </div>
      </header>

      {/* Progress stepper — pil bernomor DENGAN label */}
      <nav className="stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`stepper__dot ${i === stepIdx ? 'is-active' : ''} ${isStepDone(i) ? 'is-done' : ''}`}
            onClick={() => handleStepChange(i)}
            title={s.title}
          >
            <span className="stepper__num">{i + 1}</span>
            <span className="stepper__text">{s.title}</span>
          </button>
        ))}
      </nav>
      <p className="stepper__label">
        Langkah {stepIdx + 1} dari {STEPS.length}: <strong>{current.title}</strong>
      </p>

      {/* Validation Warning Alert */}
      {valError && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #ef4444',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            color: '#991b1b',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
          }}
        >
          <span>{valError.message}</span>
          <button
            type="button"
            onClick={() => setValError(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Active step */}
      <section className="card">{current.render(ctx, set)}</section>

      {/* Nav buttons */}
      <div className="wizard-nav">
        <button type="button" className="btn-sm btn-outline" onClick={prev} disabled={stepIdx === 0}>
          ← Sebelumnya
        </button>
        <button type="button" className="btn-primary" onClick={next}>
          {isLast ? 'Review & Edit Laporan →' : 'Selanjutnya →'}
        </button>
      </div>
    </div>
  )
}
