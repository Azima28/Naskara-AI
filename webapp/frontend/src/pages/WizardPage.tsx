import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompletenessBar from '@/components/CompletenessBar'
import { getDraft, updateDraft } from '@/api/client'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'

import SiswaStep from '@/components/wizard/steps/SiswaStep'
import SekolahStep from '@/components/wizard/steps/SekolahStep'
import PerusahaanStep from '@/components/wizard/steps/PerusahaanStep'
import PklStep from '@/components/wizard/steps/PklStep'
import ProfilStep from '@/components/wizard/steps/ProfilStep'
import CeritaStep from '@/components/wizard/steps/CeritaStep'
import ReviewAIStep from '@/components/wizard/steps/ReviewAIStep'
import StudiKasusStep from '@/components/wizard/steps/StudiKasusStep'
import ClosingStep from '@/components/wizard/steps/ClosingStep'
import AssetsStep from '@/components/wizard/steps/AssetsStep'

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
  { id: 'cerita', title: 'Cerita Pengalaman', render: (c, s) => <CeritaStep ctx={c} set={s} /> },
  { id: 'review-ai', title: 'Kegiatan & Peralatan', render: (c, s) => <ReviewAIStep ctx={c} set={s} /> },
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
  const nav = useNavigate()
  const [ctx, setCtx] = useState<PklContext>(emptyContext())
  const [title, setTitle] = useState('Laporan PKL')
  const [stepIdx, setStepIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const dirtyRef = useRef(false)

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

  // Autosave (debounced 2s after last change)
  useEffect(() => {
    if (!dirtyRef.current || !draftId) return
    setSaveState('saving')
    const t = setTimeout(() => {
      updateDraft(draftId, { data: ctx })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'))
    }, 2000)
    return () => clearTimeout(t)
  }, [ctx, draftId])

  const set = useCallback((patch: Partial<PklContext>) => {
    setCtx((prev) => ({ ...prev, ...patch }))
    dirtyRef.current = true
  }, [])

  const current = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  /**
   * Apakah sebuah langkah benar-benar sudah terisi?
   */
  const isStepDone = (i: number) => {
    const filled = (v?: string) => !!v && v.trim().length > 0
    switch (STEPS[i].id) {
      case 'siswa':
        return filled(ctx.siswa.nama) && filled(ctx.siswa.kelas) && filled(ctx.siswa.jurusan)
      case 'sekolah':
        return filled(ctx.sekolah.nama) && filled(ctx.sekolah.kepala_sekolah.nama)
      case 'perusahaan':
        return filled(ctx.perusahaan.nama) && filled(ctx.perusahaan.alamat)
      case 'pkl':
        return filled(ctx.pkl.tanggal_mulai) && filled(ctx.pkl.tanggal_selesai)
      case 'profil':
        return filled(ctx.profil_perusahaan.sejarah) || filled(ctx.profil_perusahaan.visi)
      case 'cerita':
        return filled(ctx.refleksi)
      case 'review-ai':
        return ctx.kegiatan.length > 0
      case 'studi-kasus':
        return filled(ctx.studi_kasus?.judul) || filled(ctx.studi_kasus?.latar_belakang)
      case 'closing':
        return filled(ctx.kata_pengantar.ucapan_syukur) || filled(ctx.kesimpulan_user)
      case 'assets':
        return ctx.assets.length > 0
      default:
        return false
    }
  }

  const next = () => {
    if (isLast) {
      // Last step: autosave then go to editor
      if (draftId) updateDraft(draftId, { data: ctx, status: 'reviewing' })
      nav(`/editor/${draftId}`)
    } else {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))
      window.scrollTo(0, 0)
    }
  }
  const prev = () => {
    setStepIdx((i) => Math.max(i - 1, 0))
    window.scrollTo(0, 0)
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
      <header className="shell__header">
        <div className="shell__row">
          <h1>
            <Link to="/dashboard">←</Link> &nbsp; {title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

      {/* Progress stepper — pil bernomor + nama langkah supaya jelas */}
      <nav className="stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`stepper__dot ${i === stepIdx ? 'is-active' : ''} ${isStepDone(i) ? 'is-done' : ''}`}
            onClick={() => setStepIdx(i)}
            title={s.title}
          >
            <span className="stepper__num">{isStepDone(i) && i !== stepIdx ? '✓' : i + 1}</span>
            <span className="stepper__text">{s.title}</span>
          </button>
        ))}
      </nav>
      <p className="stepper__label">
        Langkah {stepIdx + 1} dari {STEPS.length}: <strong>{current.title}</strong>
      </p>

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
