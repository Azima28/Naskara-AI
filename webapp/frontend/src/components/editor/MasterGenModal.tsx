import { useEffect, useRef, useState } from 'react'
import type { PklContext } from '@/types/pkl'
import { draftSectionStream, batchDraftSectionsStream, updateDraft } from '@/api/client'
import { IconCheck, IconAlert, IconSparkles, IconLightning, IconRefresh } from '@/components/common/Icons'
import { polishAcademicText, polishAcademicList } from '@/utils/textPolish'
import { AiModelSelector } from '@/components/common/AiModelSelector'

export interface MasterGenModalProps {
  isOpen: boolean
  ctx: PklContext
  draftId: string
  allSections: { key: string; title: string }[]
  onComplete: (updatedCtx: PklContext) => void
  onClose: () => void
}

interface ItemProgress {
  key: string
  title: string
  phase: 1 | 2
}

const POLISH_ITEMS: { key: 'profil_sejarah' | 'visi_misi' | 'tata_tertib_perusahaan' | 'job_descriptions'; title: string }[] = [
  { key: 'profil_sejarah', title: 'Sejarah Perusahaan (BAB II)' },
  { key: 'visi_misi', title: 'Visi & Misi Perusahaan (BAB II)' },
  { key: 'tata_tertib_perusahaan', title: 'Tata Tertib Khusus Perusahaan' },
  { key: 'job_descriptions', title: 'Job Description (Tugas per Jabatan)' },
]

const ARRAY_SECTION_KEYS = [
  'tujuan',
  'tujuan_pkl',
  'manfaat',
  'kesimpulan',
  'saran',
  'rumusan_masalah',
  'kesimpulan_saran',
]

// ── Helpers Parsing Output AI Pemolesan ───────────────────────────────────── //

function parseVisiMisi(text: string): { visi: string; misi: string[] } {
  let visi = ''
  const misi: string[] = []
  let mode: 'visi' | 'misi' | null = null

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '[VISI]' || trimmed.toUpperCase().startsWith('VISI:')) {
      mode = 'visi'
      const content = trimmed.replace(/^\[VISI\]/i, '').replace(/^VISI:\s*/i, '').trim()
      if (content) visi = content
      continue
    }
    if (trimmed === '[MISI]' || trimmed.toUpperCase().startsWith('MISI:')) {
      mode = 'misi'
      const content = trimmed.replace(/^\[MISI\]/i, '').replace(/^MISI:\s*/i, '').trim()
      if (content) misi.push(content)
      continue
    }
    if (!trimmed) continue

    if (mode === 'visi' && !visi) {
      visi = trimmed
    } else if (mode === 'misi') {
      const cleaned = trimmed.replace(/^\d+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim()
      if (cleaned) misi.push(cleaned)
    }
  }

  // Fallback: If no explicit VISI/MISI headers found, use line splitting
  if (!visi && !misi.length) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0) visi = lines[0]
    if (lines.length > 1) misi.push(...lines.slice(1))
  }

  return { visi, misi }
}

function parseNumberedList(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim().replace(/^\d+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim())
    .filter((line) => {
      if (!line || line.startsWith('[') || line.startsWith('#')) return false
      // Only reject intro header lines if line is very short
      if ((line.toLowerCase().startsWith('berikut adalah') || line.toLowerCase().startsWith('tata tertib perusahaan')) && line.length < 35) return false
      return true
    })
    .map((line) => {
      if (line.length > 200) {
        const firstDot = line.indexOf('.')
        if (firstDot > 10 && firstDot < 200) {
          return line.slice(0, firstDot + 1)
        }
      }
      return line
    })

  // Fallback: If strict list filter produced 0 items, use line splitting
  return lines.length > 0 ? lines : text.split('\n').map((l) => l.trim().replace(/^\d+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim()).filter((l) => l.length > 3)
}

function parseJobDescriptions(text: string): Array<{ posisi: string; tugas: string[] }> {
  const jobs: Array<{ posisi: string; tugas: string[] }> = []
  let currentJob: { posisi: string; tugas: string[] } | null = null

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const posMatch = trimmed.match(/^(?:\[POSISI:\s*|Jabatan:\s*|Posisi:\s*|\*\*)(.+?)[\]*:]*$/i)
    if (posMatch && posMatch[1].length < 60) {
      if (currentJob) jobs.push(currentJob)
      currentJob = { posisi: posMatch[1].trim(), tugas: [] }
    } else if (currentJob) {
      const task = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
      if (task) currentJob.tugas.push(task)
    } else {
      // Fallback first job position header
      currentJob = { posisi: 'Staf Operasional / Teknisi', tugas: [trimmed.replace(/^[-•*]\s*/, '')] }
    }
  }
  if (currentJob) jobs.push(currentJob)
  return jobs.length > 0 ? jobs : [{ posisi: 'Staf Operasional / Teknisi Industri', tugas: [text.trim()] }]
}

// ── Persistence Helpers (localStorage State Rehydration) ──────────────────── //

export interface MasterGenPersistedState {
  draftId: string
  statuses: Record<string, 'pending' | 'generating' | 'success' | 'failed'>
  errorDetails: Record<string, string>
  activePhase: 1 | 2
  activeItemTitle: string
  isDoneAll: boolean
  dismissed?: boolean
  lastUpdated: number
}

const STORAGE_PREFIX = 'naskara_master_gen_'

export function getPersistedGenState(draftId: string): MasterGenPersistedState | null {
  if (!draftId) return null
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${draftId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MasterGenPersistedState
    if (parsed && typeof parsed === 'object' && parsed.draftId === draftId) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function savePersistedGenState(draftId: string, patch: Partial<MasterGenPersistedState>) {
  if (!draftId) return
  try {
    const existing = getPersistedGenState(draftId) || {
      draftId,
      statuses: {},
      errorDetails: {},
      activePhase: 1,
      activeItemTitle: '',
      isDoneAll: false,
      dismissed: false,
      lastUpdated: Date.now(),
    }
    const updated: MasterGenPersistedState = {
      ...existing,
      ...patch,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(`${STORAGE_PREFIX}${draftId}`, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}

export function dismissPersistedGenState(draftId: string) {
  if (!draftId) return
  try {
    const existing = getPersistedGenState(draftId)
    if (existing) {
      existing.dismissed = true
      localStorage.setItem(`${STORAGE_PREFIX}${draftId}`, JSON.stringify(existing))
    }
  } catch {
    /* ignore */
  }
}

export function clearPersistedGenState(draftId: string) {
  if (!draftId) return
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${draftId}`)
  } catch {
    /* ignore */
  }
}

export default function MasterGenModal({
  isOpen,
  ctx,
  draftId,
  allSections,
  onComplete,
  onClose,
}: MasterGenModalProps) {
  const [activePhase, setActivePhase] = useState<1 | 2>(1)
  const [activeItemTitle, setActiveItemTitle] = useState<string>('')
  const [filterPhase, setFilterPhase] = useState<'all' | 1 | 2>('all')

  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'generating' | 'success' | 'failed'>>({})
  const [errorDetails, setErrorDetails] = useState<Record<string, string>>({})
  const [streamText, setStreamText] = useState<string>('')

  const [selectedModel, setSelectedModel] = useState<string>('')
  const selectedModelRef = useRef<string>('')

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    selectedModelRef.current = model
  }

  const currentCtxRef = useRef<PklContext>({ ...ctx })
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamBoxRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Auto-scroll checklist container to keep active generating item vertically centered in view
  useEffect(() => {
    const generatingKey = Object.keys(statuses).find((k) => statuses[k] === 'generating')
    if (generatingKey && itemRefs.current[generatingKey]) {
      itemRefs.current[generatingKey]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [statuses])

  // Filter out any section keys that are handled in Phase 2 POLISH_ITEMS to avoid duplicate generation requests & key collisions
  const phase1Sections = allSections.filter(
    (s) => s.title && s.title.trim() !== '' && s.title.trim() !== '-' && !POLISH_ITEMS.some((p) => p.key === s.key)
  )

  // Sub-items list (100% unique keys)
  const totalItems: ItemProgress[] = [
    ...phase1Sections.map((s) => ({ key: s.key, title: s.title, phase: 1 as const })),
    ...POLISH_ITEMS.map((p) => ({ key: p.key, title: p.title, phase: 2 as const })),
  ]

  const successCount = Object.values(statuses).filter((s) => s === 'success').length
  const failedCount = Object.values(statuses).filter((s) => s === 'failed').length
  const processedCount = successCount + failedCount
  const totalCount = totalItems.length
  const progressPercent = Math.min(100, Math.round((processedCount / (totalCount || 1)) * 100))

  // Dynamically derived completion state (Guarantees UI consistency)
  const isDoneAll = totalItems.length > 5 && totalItems.every(
    (it) => statuses[it.key] === 'success' || statuses[it.key] === 'failed'
  )

  useEffect(() => {
    if (isOpen) {
      currentCtxRef.current = { ...ctx }
      startMasterGeneration()
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const startMasterGeneration = async () => {
    const saved = getPersistedGenState(draftId)
    let restoredStatuses: Record<string, 'pending' | 'generating' | 'success' | 'failed'> = {}
    let restoredErrors: Record<string, string> = {}

    if (saved && saved.statuses && Object.keys(saved.statuses).length > 0) {
      restoredStatuses = { ...saved.statuses }
      Object.keys(restoredStatuses).forEach((k) => {
        if (restoredStatuses[k] === 'generating') {
          restoredStatuses[k] = 'pending'
        }
        const gen = currentCtxRef.current.generated_sections || {}
        const pr = currentCtxRef.current.profil_perusahaan || {}
        let hasData = !!gen[k]
        if (k === 'profil_sejarah') hasData = !!(gen.profil_sejarah || pr.sejarah)
        else if (k === 'visi_misi') hasData = !!(gen.visi_misi || pr.visi || (pr.misi && pr.misi.length > 0))
        else if (k === 'tata_tertib_perusahaan') hasData = !!(gen.tata_tertib || gen.tata_tertib_perusahaan || pr.tata_tertib_perusahaan || pr.tata_tertib)
        else if (k === 'job_descriptions') hasData = !!(gen.job_descriptions || (pr.job_descriptions && pr.job_descriptions.length > 0))

        if (restoredStatuses[k] === 'success' && !hasData) {
          restoredStatuses[k] = 'pending'
        }
      })
      restoredErrors = saved.errorDetails || {}
      if (saved.activePhase) setActivePhase(saved.activePhase)
      if (saved.activeItemTitle) setActiveItemTitle(saved.activeItemTitle)
    }

    totalItems.forEach((it) => {
      if (!restoredStatuses[it.key]) {
        restoredStatuses[it.key] = 'pending'
      }
    })

    setStatuses({ ...restoredStatuses })
    setErrorDetails({ ...restoredErrors })

    // Only skip generation if totalItems has all sections AND every section actually has verified content
    const allDoneInitially = totalItems.length > 5 && totalItems.every((it) => {
      if (restoredStatuses[it.key] !== 'success' && restoredStatuses[it.key] !== 'failed') return false
      if (restoredStatuses[it.key] === 'success') {
        const gen = currentCtxRef.current.generated_sections || {}
        const pr = currentCtxRef.current.profil_perusahaan || {}
        const k = it.key
        let hasData = !!gen[k]
        if (k === 'profil_sejarah') hasData = !!(gen.profil_sejarah || pr.sejarah)
        else if (k === 'visi_misi') hasData = !!(gen.visi_misi || pr.visi || (pr.misi && pr.misi.length > 0))
        else if (k === 'tata_tertib_perusahaan') hasData = !!(gen.tata_tertib || gen.tata_tertib_perusahaan || pr.tata_tertib_perusahaan || pr.tata_tertib)
        else if (k === 'job_descriptions') hasData = !!(gen.job_descriptions || (pr.job_descriptions && pr.job_descriptions.length > 0))
        return hasData
      }
      return true
    })

    if (allDoneInitially) {
      savePersistedGenState(draftId, { isDoneAll: true, statuses: restoredStatuses, errorDetails: restoredErrors })
      onComplete(currentCtxRef.current)
      return
    }

    // ── FASE 1: Sub-bab Utama (1 Batch Request) ────────────────────────── //
    setActivePhase(1)
    const p1KeysToRun = phase1Sections
      .filter((sec) => restoredStatuses[sec.key] !== 'success')
      .map((sec) => sec.key)

    if (p1KeysToRun.length > 0) {
      p1KeysToRun.forEach((k) => {
        restoredStatuses[k] = 'generating'
      })
      setStatuses({ ...restoredStatuses })
      savePersistedGenState(draftId, {
        statuses: restoredStatuses,
        activePhase: 1,
        activeItemTitle: phase1Sections.find((s) => s.key === p1KeysToRun[0])?.title || '',
      })

      abortControllerRef.current = new AbortController()
      let streamAcc = ''

      try {
        await batchDraftSectionsStream(
          p1KeysToRun,
          currentCtxRef.current,
          (secKey, chunk) => {
            const secDef = phase1Sections.find((s) => s.key === secKey)
            if (secDef) setActiveItemTitle(secDef.title)
            streamAcc += chunk
            setStreamText(streamAcc + ' ▌')
            if (streamBoxRef.current) {
              requestAnimationFrame(() => {
                if (streamBoxRef.current) {
                  streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight
                }
              })
            }
          },
          async (secKey, rawContent) => {
            streamAcc = ''
            let cleanRaw = (typeof rawContent === 'string' ? rawContent : '').replace(/<<<.*?>>>/g, '').replace(/===.*?===/g, '').replace(/<<</g, '').replace(/>>>/g, '').trim()
            let parsedContent: string | string[] = cleanRaw
            if (ARRAY_SECTION_KEYS.includes(secKey)) {
              const list = (typeof parsedContent === 'string' ? parsedContent : '')
                .split('\n')
                .map((s: string) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
                .filter(Boolean)
              parsedContent = polishAcademicList(list)
            } else if (typeof parsedContent === 'string') {
              parsedContent = polishAcademicText(parsedContent)
            }

            currentCtxRef.current = {
              ...currentCtxRef.current,
              generated_sections: {
                ...(currentCtxRef.current.generated_sections || {}),
                [secKey]: parsedContent,
              },
            }

            restoredStatuses[secKey] = 'success'
            setStatuses({ ...restoredStatuses })
            savePersistedGenState(draftId, { statuses: restoredStatuses })
            try {
              await updateDraft(draftId, { data: currentCtxRef.current })
            } catch {
              /* ignore */
            }
            onComplete(currentCtxRef.current)
          },
          abortControllerRef.current.signal,
          selectedModelRef.current
        )
      } catch (err: any) {
        console.warn('[MasterGenModal] Phase 1 batch error:', err)
        p1KeysToRun.forEach((k) => {
          if (restoredStatuses[k] !== 'success') {
            restoredStatuses[k] = 'failed'
            restoredErrors[k] = err?.message || 'Gagal batch AI'
          }
        })
        setStatuses({ ...restoredStatuses })
        setErrorDetails({ ...restoredErrors })
        savePersistedGenState(draftId, { statuses: restoredStatuses, errorDetails: restoredErrors })
      }
    }

    // ── FASE 2: Poles Profil Perusahaan (1 Batch Request) ──────────────── //
    setActivePhase(2)
    const p2KeysToRun = POLISH_ITEMS
      .filter((p) => restoredStatuses[p.key] !== 'success')
      .map((p) => p.key)

    if (p2KeysToRun.length > 0) {
      p2KeysToRun.forEach((k) => {
        restoredStatuses[k] = 'generating'
      })
      setStatuses({ ...restoredStatuses })
      savePersistedGenState(draftId, {
        statuses: restoredStatuses,
        activePhase: 2,
        activeItemTitle: POLISH_ITEMS.find((p) => p.key === p2KeysToRun[0])?.title || '',
      })

      abortControllerRef.current = new AbortController()
      let streamAcc = ''

      try {
        await batchDraftSectionsStream(
          p2KeysToRun,
          currentCtxRef.current,
          (pKey, chunk) => {
            const pDef = POLISH_ITEMS.find((p) => p.key === pKey)
            if (pDef) setActiveItemTitle(pDef.title)
            streamAcc += chunk
            setStreamText(streamAcc + ' ▌')
            if (streamBoxRef.current) {
              requestAnimationFrame(() => {
                if (streamBoxRef.current) {
                  streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight
                }
              })
            }
          },
          async (pKey, resultText) => {
            streamAcc = ''
            const finalContent = (resultText || '').replace(/<<<.*?>>>/g, '').replace(/===.*?===/g, '').replace(/<<</g, '').replace(/>>>/g, '').trim()
            const pr = { ...currentCtxRef.current.profil_perusahaan }
            const gen = { ...(currentCtxRef.current.generated_sections || {}) }
            let hasValidContent = false

            if (pKey === 'profil_sejarah') {
              if (finalContent.length > 10) {
                const polished = polishAcademicText(finalContent)
                pr.sejarah = polished
                gen.profil_sejarah = polished
                hasValidContent = true
              } else if (pr.sejarah && pr.sejarah.trim().length > 10) {
                hasValidContent = true
              }
            } else if (pKey === 'visi_misi') {
              if (finalContent.length > 10) {
                const parsed = parseVisiMisi(finalContent)
                if (parsed.visi) pr.visi = polishAcademicText(parsed.visi)
                if (parsed.misi.length > 0) pr.misi = polishAcademicList(parsed.misi)
                gen.visi_misi = finalContent
                hasValidContent = !!(pr.visi || (pr.misi && pr.misi.length > 0))
              } else if (pr.visi || (pr.misi && pr.misi.length > 0)) {
                hasValidContent = true
              }
            } else if (pKey === 'tata_tertib_perusahaan') {
              let list = parseNumberedList(finalContent)
              if (list.length === 0) {
                const existing = pr.tata_tertib_perusahaan || pr.tata_tertib || gen.tata_tertib || []
                list = Array.isArray(existing) && existing.length > 0 ? existing : [
                  'Hadir tepat waktu sesuai jam kerja operasional perusahaan.',
                  'Mengenakan pakaian seragam sekolah atau pakaian kerja rapi dan bersopan santun.',
                  'Mematuhi seluruh standar Keselamatan dan Kesehatan Kerja (K3) industri.',
                  'Menjaga etika komunikasi dan kerahasiaan informasi di tempat kerja.'
                ]
              }
              const polished = polishAcademicList(list)
              pr.tata_tertib_perusahaan = polished
              pr.tata_tertib = polished
              gen.tata_tertib = polished
              gen.tata_tertib_perusahaan = polished
              hasValidContent = true
            } else if (pKey === 'job_descriptions') {
              if (finalContent.length > 10) {
                const parsedJobs = parseJobDescriptions(finalContent).map((j) => ({
                  posisi: polishAcademicText(j.posisi),
                  tugas: polishAcademicList(j.tugas),
                }))
                if (parsedJobs.length > 0) pr.job_descriptions = parsedJobs
                gen.job_descriptions = finalContent
                hasValidContent = (pr.job_descriptions || []).length > 0
              } else if ((pr.job_descriptions || []).length > 0) {
                hasValidContent = true
              }
            }

            if (hasValidContent) {
              currentCtxRef.current = {
                ...currentCtxRef.current,
                profil_perusahaan: pr,
                generated_sections: gen,
              }
              restoredStatuses[pKey] = 'success'
              setStatuses({ ...restoredStatuses })
              savePersistedGenState(draftId, { statuses: restoredStatuses })
              try {
                await updateDraft(draftId, { data: currentCtxRef.current })
              } catch {
                /* ignore */
              }
              onComplete(currentCtxRef.current)
            } else {
              restoredErrors[pKey] = 'Respon AI terlalu pendek'
              setErrorDetails({ ...restoredErrors })
              restoredStatuses[pKey] = 'failed'
              setStatuses({ ...restoredStatuses })
              savePersistedGenState(draftId, { statuses: restoredStatuses, errorDetails: restoredErrors })
            }
          },
          abortControllerRef.current.signal,
          selectedModelRef.current
        )
      } catch (err: any) {
        console.warn('[MasterGenModal] Phase 2 batch error:', err)
        p2KeysToRun.forEach((k) => {
          if (restoredStatuses[k] !== 'success') {
            restoredStatuses[k] = 'failed'
            restoredErrors[k] = err?.message || 'Gagal batch AI'
          }
        })
        setStatuses({ ...restoredStatuses })
        setErrorDetails({ ...restoredErrors })
        savePersistedGenState(draftId, { statuses: restoredStatuses, errorDetails: restoredErrors })
      }
    }

    savePersistedGenState(draftId, {
      isDoneAll: true,
      statuses: restoredStatuses,
      errorDetails: restoredErrors,
      activeItemTitle: '',
    })
    onComplete(currentCtxRef.current)
  }

  const handleRetryItem = async (item: ItemProgress) => {
    setActiveItemTitle(item.title)
    setStatuses((prev) => ({ ...prev, [item.key]: 'generating' }))
    setStreamText('')

    try {
      let accumulated = ''
      abortControllerRef.current = new AbortController()

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout AI')), 90000)
      )

      if (item.phase === 1) {
        const rawContent: string = await Promise.race([
          draftSectionStream(
            item.key,
            currentCtxRef.current,
            (chunk) => {
              accumulated += chunk
              setStreamText(accumulated + ' ▌')
              if (streamBoxRef.current) {
                requestAnimationFrame(() => {
                  if (streamBoxRef.current) {
                    streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight
                  }
                })
              }
            },
            abortControllerRef.current.signal,
            selectedModelRef.current
          ),
          timeoutPromise,
        ])

        let parsedContent: string | string[] = rawContent || accumulated
        if (ARRAY_SECTION_KEYS.includes(item.key)) {
          const list = (typeof parsedContent === 'string' ? parsedContent : '')
            .split('\n')
            .map((s: string) => s.replace(/^[0-9]+\.\s*/, '').replace(/^-\s*/, '').replace(/^[a-z]\.\s*/, '').trim())
            .filter(Boolean)
          parsedContent = polishAcademicList(list)
        } else if (typeof parsedContent === 'string') {
          parsedContent = polishAcademicText(parsedContent)
        }

        currentCtxRef.current = {
          ...currentCtxRef.current,
          generated_sections: {
            ...(currentCtxRef.current.generated_sections || {}),
            [item.key]: parsedContent,
          },
        }
      } else {
        const resultText = await Promise.race([
          draftSectionStream(
            item.key,
            currentCtxRef.current,
            (chunk) => {
              accumulated += chunk
              setStreamText(accumulated + ' ▌')
              if (streamBoxRef.current) {
                requestAnimationFrame(() => {
                  if (streamBoxRef.current) {
                    streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight
                  }
                })
              }
            },
            abortControllerRef.current.signal,
            selectedModelRef.current
          ),
          timeoutPromise,
        ])

        const finalContent = (resultText || accumulated).trim()
        if (finalContent.length > 10) {
          const pr = { ...currentCtxRef.current.profil_perusahaan }
          const gen = { ...(currentCtxRef.current.generated_sections || {}) }

          if (item.key === 'profil_sejarah') {
            const polished = polishAcademicText(finalContent)
            pr.sejarah = polished
            gen.profil_sejarah = polished
          } else if (item.key === 'visi_misi') {
            const parsed = parseVisiMisi(finalContent)
            if (parsed.visi) pr.visi = polishAcademicText(parsed.visi)
            if (parsed.misi.length > 0) pr.misi = polishAcademicList(parsed.misi)
          } else if (item.key === 'tata_tertib_perusahaan') {
            const list = polishAcademicList(parseNumberedList(finalContent))
            if (list.length > 0) {
              pr.tata_tertib_perusahaan = list
              pr.tata_tertib = list
              gen.tata_tertib = list
            }
          } else if (item.key === 'job_descriptions') {
            const parsedJobs = parseJobDescriptions(finalContent).map((j) => ({
              posisi: polishAcademicText(j.posisi),
              tugas: polishAcademicList(j.tugas),
            }))
            if (parsedJobs.length > 0) pr.job_descriptions = parsedJobs
          }

          currentCtxRef.current = {
            ...currentCtxRef.current,
            profil_perusahaan: pr,
            generated_sections: gen,
          }
        }
      }

      setStatuses((prev) => {
        const next = { ...prev, [item.key]: 'success' as const }
        const allDone = totalItems.length > 0 && totalItems.every((it) => next[it.key] === 'success' || next[it.key] === 'failed')
        savePersistedGenState(draftId, { statuses: next, isDoneAll: allDone })
        return next
      })
      await updateDraft(draftId, { data: currentCtxRef.current })
      onComplete(currentCtxRef.current)
    } catch (err: any) {
      const msg = err?.message || 'Timeout/Gagal AI'
      setErrorDetails((prev) => {
        const nextErrs = { ...prev, [item.key]: msg }
        setStatuses((prevSt) => {
          const nextSt = { ...prevSt, [item.key]: 'failed' as const }
          const allDone = totalItems.length > 0 && totalItems.every((it) => nextSt[it.key] === 'success' || nextSt[it.key] === 'failed')
          savePersistedGenState(draftId, { statuses: nextSt, errorDetails: nextErrs, isDoneAll: allDone })
          return nextSt
        })
        return nextErrs
      })
    }
  }

  const handleRetryAllFailed = async () => {
    const failedItems = totalItems.filter((it) => statuses[it.key] === 'failed')
    for (const item of failedItems) {
      await handleRetryItem(item)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        padding: 'clamp(0.5rem, 2vw, 1rem)',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="master-gen-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Modal */}
        <div style={{ background: 'var(--paper-2, #ece8de)', padding: 'clamp(0.85rem, 2.5vw, 1.25rem) clamp(0.85rem, 3vw, 1.5rem)', borderBottom: '1px solid var(--line-strong, #b9b09c)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
            <span style={{ display: 'inline-flex', padding: '0.35rem', background: 'var(--green-100, #e2efe7)', borderRadius: '8px', flexShrink: 0 }}>
              <IconSparkles size={20} color="var(--green-700, #14614a)" />
            </span>
            <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', color: 'var(--ink, #262521)', fontWeight: 700, fontFamily: 'var(--font-serif)', wordBreak: 'break-word', lineHeight: 1.25 }}>
                  Naskara AI Studio — Menyusun Laporan PKL
                </h3>
                <AiModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: 'clamp(0.75rem, 2.3vw, 0.82rem)', color: 'var(--ink-soft, #555)', wordBreak: 'break-word' }}>
                AI sedang menyusun seluruh sub-bab &amp; memoles profil perusahaan secara akademis KBBI
              </p>
            </div>
          </div>

          {/* Phase Indicators (2-Column Grid Side-by-Side Horizontal Pills) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.35rem', marginTop: '0.6rem', width: '100%', boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => setFilterPhase(filterPhase === 1 ? 'all' : 1)}
              style={{
                fontSize: 'clamp(0.68rem, 2vw, 0.76rem)',
                fontWeight: 700,
                padding: '0.35rem 0.4rem',
                borderRadius: '999px',
                background: filterPhase === 1 || (filterPhase === 'all' && activePhase === 1 && !isDoneAll) ? 'var(--green-100, #e2efe7)' : '#ffffff',
                color: filterPhase === 1 || (filterPhase === 'all' && activePhase === 1 && !isDoneAll) ? 'var(--green-700, #14614a)' : 'var(--ink-soft, #64748b)',
                border: filterPhase === 1 || (filterPhase === 'all' && activePhase === 1 && !isDoneAll) ? '1.5px solid var(--green-600, #187257)' : '1px solid var(--line, #cbd5e1)',
                boxSizing: 'border-box',
                textAlign: 'center',
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                gap: '0.25rem',
                transition: 'all 0.15s ease',
              }}
            >
              {!isDoneAll && activePhase === 1 && (
                <span className="spinner" style={{ width: 10, height: 10, border: '2px solid var(--green-600, #187257)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              )}
              {isDoneAll && <IconCheck size={12} color="var(--green-700, #14614a)" style={{ flexShrink: 0 }} />}
              <span>FASE 1: Sub-bab ({allSections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPhase(filterPhase === 2 ? 'all' : 2)}
              style={{
                fontSize: 'clamp(0.68rem, 2vw, 0.76rem)',
                fontWeight: 700,
                padding: '0.35rem 0.4rem',
                borderRadius: '999px',
                background: filterPhase === 2 || (filterPhase === 'all' && activePhase === 2 && !isDoneAll) ? 'var(--green-100, #e2efe7)' : '#ffffff',
                color: filterPhase === 2 || (filterPhase === 'all' && activePhase === 2 && !isDoneAll) ? 'var(--green-700, #14614a)' : 'var(--ink-soft, #64748b)',
                border: filterPhase === 2 || (filterPhase === 'all' && activePhase === 2 && !isDoneAll) ? '1.5px solid var(--green-600, #187257)' : '1px solid var(--line, #cbd5e1)',
                boxSizing: 'border-box',
                textAlign: 'center',
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                gap: '0.25rem',
                transition: 'all 0.15s ease',
              }}
            >
              {!isDoneAll && activePhase === 2 && (
                <span className="spinner" style={{ width: 10, height: 10, border: '2px solid var(--green-600, #187257)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              )}
              {isDoneAll && <IconCheck size={12} color="var(--green-700, #14614a)" style={{ flexShrink: 0 }} />}
              <span>FASE 2: Poles Profil (4)</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'clamp(0.75rem, 2.3vw, 0.82rem)', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--ink, #262521)', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span style={{ wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
                Progres ({processedCount} / {totalCount} Diproses
                {failedCount > 0 ? ` — ${successCount} OK, ${failedCount} Gagal` : ''})
              </span>
              <span style={{ color: 'var(--green-700, #14614a)', fontWeight: 700, flexShrink: 0 }}>{progressPercent}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--line, #e2e8f0)', borderRadius: '999px', overflow: 'hidden', width: '100%' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--green-500, #4ade80) 0%, var(--green-700, #14614a) 100%)',
                  transition: 'width 0.3s ease-in-out',
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 'clamp(0.85rem, 2.5vw, 1.25rem) clamp(0.85rem, 3vw, 1.5rem)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
          {/* Live Streaming Preview Box */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: '10px',
              padding: '0.75rem 0.85rem',
              color: '#f8fafc',
              border: '1px solid var(--green-600, #187257)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 'clamp(0.76rem, 2.3vw, 0.82rem)', fontWeight: 600, color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                {!isDoneAll && <span className="spinner" style={{ width: 12, height: 12, border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                {isDoneAll ? (
                  failedCount > 0 ? (
                    <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <IconAlert size={15} color="#fbbf24" style={{ flexShrink: 0 }} /> Penyusunan Selesai dengan Kendala ({failedCount} Gagal)
                    </span>
                  ) : (
                    <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <IconCheck size={15} color="#4ade80" style={{ flexShrink: 0 }} /> Seluruh Penyusunan Selesai (100%)
                    </span>
                  )
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    <IconLightning size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sedang Menulis: {activeItemTitle}</span>
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>Live AI Stream</span>
            </div>

            <div
              ref={streamBoxRef}
              style={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)',
                lineHeight: 1.5,
                color: '#e2e8f0',
                maxHeight: '110px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                background: '#1e293b',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #475569',
                wordBreak: 'break-word',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {streamText || (
                isDoneAll ? (
                  failedCount > 0
                    ? `Penyusunan telah selesai, namun terdapat ${failedCount} bagian yang belum terisi optimal. Silakan klik 'Coba Lagi' pada bagian yang gagal di bawah.`
                    : 'Penyusunan telah selesai 100% tanpa kendala. Silakan klik tombol di bawah untuk melihat hasil laporan.'
                ) : (
                  'Menyiapkan prompt akademis...'
                )
              )}
            </div>
          </div>

          {/* Checklist Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span style={{ fontSize: 'clamp(0.8rem, 2.4vw, 0.85rem)', fontWeight: 700, color: 'var(--ink, #262521)' }}>
                Daftar Sub-bab &amp; Bagian Laporan {filterPhase !== 'all' ? `(Fase ${filterPhase})` : ''}:
              </span>
              {filterPhase !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterPhase('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green-700, #14614a)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Tampilkan Semua ({totalItems.length})
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.2rem', width: '100%', boxSizing: 'border-box' }}>
              {totalItems
                .filter((item) => filterPhase === 'all' || item.phase === filterPhase)
                .map((item) => {
                const st = statuses[item.key]
                return (
                  <div
                    key={item.key}
                    ref={(el) => {
                      itemRefs.current[item.key] = el
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.42rem 0.65rem',
                      borderRadius: '6px',
                      border: `1px solid ${st === 'generating' ? 'var(--green-600, #187257)' : st === 'success' ? '#86efac' : st === 'failed' ? '#fca5a5' : '#e2e8f0'}`,
                      background: st === 'generating' ? 'var(--green-50, #f0fdf4)' : st === 'success' ? '#f0fdf4' : st === 'failed' ? '#fef2f2' : '#ffffff',
                      fontSize: 'clamp(0.74rem, 2.2vw, 0.8rem)',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ fontWeight: st === 'generating' ? 700 : 500, color: st === 'generating' ? 'var(--green-800, #114e3b)' : 'var(--ink, #262521)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, marginRight: '0.35rem' }}>
                      {item.title}
                    </span>
                    <span style={{ flexShrink: 0 }}>
                      {st === 'success' && <span style={{ color: 'var(--green-700, #14614a)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><IconCheck size={13} color="var(--green-700, #14614a)" /> Selesai</span>}
                      {st === 'generating' && (
                        <span style={{ color: 'var(--green-600, #187257)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="spinner" style={{ width: 11, height: 11, border: '2px solid var(--green-600, #187257)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                          Memproses
                        </span>
                      )}
                      {st === 'failed' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            title={errorDetails[item.key] || 'Koneksi AI terputus/timeout'}
                            style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <IconAlert size={13} color="#dc2626" /> Gagal
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRetryItem(item)
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fca5a5',
                              color: '#b91c1c',
                              borderRadius: '4px',
                              padding: '0.1rem 0.4rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <IconRefresh size={11} color="#b91c1c" style={{ flexShrink: 0 }} /> Coba Lagi
                          </button>
                        </span>
                      )}
                      {st === 'pending' && <span style={{ color: '#94a3b8' }}>Menunggu</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div style={{ background: 'var(--paper-2, #ece8de)', padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(0.85rem, 3vw, 1.5rem)', borderTop: '1px solid var(--line-strong, #b9b09c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 'clamp(0.78rem, 2.3vw, 0.82rem)', color: 'var(--ink-soft, #555)', display: 'inline-flex', alignItems: 'center', flex: '1 1 200px', wordBreak: 'break-word' }}>
            {isDoneAll ? (
              failedCount > 0 ? (
                <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <IconAlert size={15} color="#dc2626" style={{ flexShrink: 0 }} /> Ada {failedCount} bagian yang belum terisi optimal. Klik 'Coba Lagi' di kanan.
                </span>
              ) : (
                <>
                  <IconCheck size={16} color="var(--green-700, #14614a)" style={{ marginRight: '0.35rem', flexShrink: 0 }} /> Seluruh draf laporan berhasil diproses (100%).
                </>
              )
            ) : (
              'Mohon menunggu, jangan tutup peramban...'
            )}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isDoneAll && failedCount > 0 && (
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={handleRetryAllFailed}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.55rem 0.9rem',
                  color: '#b91c1c',
                  borderColor: '#fca5a5',
                  background: '#ffffff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <IconRefresh size={14} color="#b91c1c" style={{ flexShrink: 0 }} /> Coba Lagi Semua yang Gagal ({failedCount})
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              disabled={!isDoneAll}
              onClick={async () => {
                dismissPersistedGenState(draftId)
                try {
                  const res = await updateDraft(draftId, { data: currentCtxRef.current, status: 'completed' })
                  if (res?.data) {
                    onComplete(res.data)
                  } else {
                    onComplete(currentCtxRef.current)
                  }
                } catch {
                  onComplete(currentCtxRef.current)
                }
                onClose()
              }}
              style={{
                opacity: isDoneAll ? 1 : 0.5,
                cursor: isDoneAll ? 'pointer' : 'not-allowed',
                padding: '0.6rem 1.2rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: isDoneAll ? 'var(--green-600, #187257)' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                boxShadow: isDoneAll ? '0 4px 12px rgba(24, 114, 87, 0.3)' : 'none',
              }}
            >
              Buka Editor &amp; Lihat Hasil Laporan →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
