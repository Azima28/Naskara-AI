import { useEffect, useRef, useState } from 'react'
import type { PklContext, ProfilPerusahaan } from '@/types/pkl'
import { draftSectionStream } from '@/api/client'
import { IconCheck, IconAlert } from '@/components/common/Icons'

export interface ProfilPolishModalProps {
  isOpen: boolean
  ctx: PklContext
  onComplete: (updatedProfil: ProfilPerusahaan) => void
  onClose: () => void
}

interface PolishItem {
  key: 'profil_sejarah' | 'visi_misi' | 'tata_tertib_perusahaan' | 'job_descriptions'
  title: string
  subtitle: string
}

const POLISH_ITEMS: PolishItem[] = [
  { key: 'profil_sejarah', title: '1. Sejarah Perusahaan', subtitle: 'Merapikan alur paragraf narasi sejarah perusahaan' },
  { key: 'visi_misi', title: '2. Visi & Misi Perusahaan', subtitle: 'Memformalkan poin visi & misi ke bahasa Indonesia baku' },
  { key: 'tata_tertib_perusahaan', title: '3. Tata Tertib Perusahaan', subtitle: 'Menata kalimat aturan khusus perusahaan' },
  { key: 'job_descriptions', title: '4. Job Description (Tugas Jabatan)', subtitle: 'Memformalkan deskripsi tugas per jabatan' },
]

// ── Helpers Parsing Output AI ──────────────────────────────────────────────── //

function parseVisiMisi(text: string): { visi: string; misi: string[] } {
  let visi = ''
  const misi: string[] = []
  let mode: 'visi' | 'misi' | null = null

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '[VISI]') {
      mode = 'visi'
      continue
    }
    if (trimmed === '[MISI]') {
      mode = 'misi'
      continue
    }
    if (!trimmed) continue

    if (mode === 'visi' && !visi) {
      visi = trimmed
    } else if (mode === 'misi') {
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '')
      if (cleaned) misi.push(cleaned)
    }
  }
  return { visi, misi }
}

function parseNumberedList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/^[*•]\s*/, ''))
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('#')) return false
      if (trimmed.toLowerCase().includes('berikut adalah') || trimmed.toLowerCase().includes('tata tertib perusahaan')) return false
      return true
    })
    .map((line) => {
      // Jika ada item terlalu panjang (>200 karakter), potong ke kalimat pertama saja
      if (line.length > 200) {
        const firstDot = line.indexOf('.')
        if (firstDot > 10 && firstDot < 200) {
          return line.slice(0, firstDot + 1)
        }
      }
      return line
    })
}

function parseJobDescriptions(text: string): Array<{ posisi: string; tugas: string[] }> {
  const jobs: Array<{ posisi: string; tugas: string[] }> = []
  let currentJob: { posisi: string; tugas: string[] } | null = null

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const posMatch = trimmed.match(/^\[POSISI:\s*(.+?)\]$/i)
    if (posMatch) {
      if (currentJob) jobs.push(currentJob)
      currentJob = { posisi: posMatch[1].trim(), tugas: [] }
    } else if (currentJob) {
      const task = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
      if (task) currentJob.tugas.push(task)
    }
  }
  if (currentJob) jobs.push(currentJob)
  return jobs
}

export default function ProfilPolishModal({ isOpen, ctx, onComplete, onClose }: ProfilPolishModalProps) {
  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'generating' | 'success' | 'failed' | 'no_response'>>({
    profil_sejarah: 'pending',
    visi_misi: 'pending',
    tata_tertib_perusahaan: 'pending',
    job_descriptions: 'pending',
  })

  const [streamTexts, setStreamTexts] = useState<Record<string, string>>({})
  const [isDoneAll, setIsDoneAll] = useState(false)

  const updatedProfilRef = useRef<ProfilPerusahaan>({ ...ctx.profil_perusahaan })
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastChunkTimeRef = useRef<number>(Date.now())
  const heartbeatIntervalRef = useRef<any>(null)
  const hasChunkRef = useRef<boolean>(false)

  // Typewriter Stream Queue refs
  const charQueueRef = useRef<string[]>([])
  const typingTimerRef = useRef<any>(null)
  const displayedTextRef = useRef<string>('')
  const currentItemKeyRef = useRef<string>('')
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const startTypewriterLoop = (itemKey: string) => {
    currentItemKeyRef.current = itemKey
    displayedTextRef.current = ''
    charQueueRef.current = []

    if (typingTimerRef.current) clearInterval(typingTimerRef.current)

    typingTimerRef.current = setInterval(() => {
      if (charQueueRef.current.length > 0) {
        // Dynamic speed adjustment to handle burst chunks smoothly
        const takeCount = charQueueRef.current.length > 60 ? 5 : charQueueRef.current.length > 20 ? 2 : 1
        const chars = charQueueRef.current.splice(0, takeCount).join('')
        displayedTextRef.current += chars
        const currentText = displayedTextRef.current
        setStreamTexts((prev) => ({ ...prev, [itemKey]: currentText + ' ▌' }))

        // Auto-scroll box to keep typing cursor visible
        const el = boxRefs.current[itemKey]
        if (el) {
          el.scrollTop = el.scrollHeight
        }
      }
    }, 12)
  }

  const flushTypewriterQueue = async () => {
    return new Promise<void>((resolve) => {
      const checkDrain = setInterval(() => {
        if (charQueueRef.current.length === 0) {
          clearInterval(checkDrain)
          resolve()
        }
      }, 15)
    })
  }

  const stopTypewriterLoop = (itemKey: string, finalContent?: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
    const textToSet = finalContent !== undefined ? finalContent : displayedTextRef.current.trim()
    setStreamTexts((prev) => ({ ...prev, [itemKey]: textToSet }))
  }

  // Clear timers & abort controller
  const cleanupStream = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    if (isOpen) {
      updatedProfilRef.current = { ...ctx.profil_perusahaan }
      startProcessingQueue()
    } else {
      cleanupStream()
    }
    return () => cleanupStream()
  }, [isOpen])

  const saveItemResult = (key: PolishItem['key'], content: string) => {
    if (!content) return
    if (key === 'profil_sejarah') {
      updatedProfilRef.current.sejarah = content
    } else if (key === 'visi_misi') {
      const parsed = parseVisiMisi(content)
      if (parsed.visi) updatedProfilRef.current.visi = parsed.visi
      if (parsed.misi.length > 0) updatedProfilRef.current.misi = parsed.misi
    } else if (key === 'tata_tertib_perusahaan') {
      const list = parseNumberedList(content)
      if (list.length > 0) {
        updatedProfilRef.current.tata_tertib_perusahaan = list
        updatedProfilRef.current.tata_tertib = list
      }
    } else if (key === 'job_descriptions') {
      const parsedJobs = parseJobDescriptions(content)
      if (parsedJobs.length > 0) {
        updatedProfilRef.current.job_descriptions = parsedJobs
      }
    }
  }

  const checkAllDone = (currentStatuses: Record<string, string>) => {
    const allFinished = POLISH_ITEMS.every(
      (it) => currentStatuses[it.key] === 'success' || currentStatuses[it.key] === 'failed' || currentStatuses[it.key] === 'no_response'
    )
    if (allFinished) {
      setIsDoneAll(true)
      onComplete(updatedProfilRef.current)
    }
  }

  const processItem = async (item: PolishItem) => {
    setStatuses((prev) => ({ ...prev, [item.key]: 'generating' }))
    setStreamTexts((prev) => ({ ...prev, [item.key]: '' }))

    abortControllerRef.current = new AbortController()
    lastChunkTimeRef.current = Date.now()
    hasChunkRef.current = false

    let accumulated = ''
    let isNoResponseTriggered = false

    startTypewriterLoop(item.key)

    // Inactivity heartbeat check:
    // - Batas waktu persiapan/loading model AI & jeda token diset hingga 90 detik (90.000 ms)
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
    heartbeatIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastChunkTimeRef.current
      const timeoutLimit = hasChunkRef.current ? 60000 : 90000

      if (elapsed > timeoutLimit) {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        const currentText = accumulated.trim()
        if (currentText.length > 15) {
          // Jika teks sudah ter-generate (>15 karakter), anggap BERHASIL walau koneksi stream diam di akhir
          stopTypewriterLoop(item.key, currentText)
          saveItemResult(item.key, currentText)
          setStatuses((prev) => {
            const next = { ...prev, [item.key]: 'success' as const }
            checkAllDone(next)
            return next
          })
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
          return
        }

        // Teks benar-benar kosong / < 15 karakter -> Murni AI No-Response
        isNoResponseTriggered = true
        stopTypewriterLoop(item.key, '')
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'no_response' as const }
          checkAllDone(next)
          return next
        })
      }
    }, 1000)

    try {
      const resultText = await draftSectionStream(
        item.key,
        ctx,
        (chunk) => {
          hasChunkRef.current = true
          lastChunkTimeRef.current = Date.now()
          accumulated += chunk
          // Enqueue characters into typewriter stream queue
          charQueueRef.current.push(...chunk.split(''))
        },
        abortControllerRef.current.signal
      )

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      // Tunggu hingga antrean karakter selesai diketikkan secara penuh di UI
      await flushTypewriterQueue()

      const finalContent = (resultText || accumulated).trim()
      stopTypewriterLoop(item.key, finalContent)

      if (finalContent.length > 15) {
        saveItemResult(item.key, finalContent)
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'success' as const }
          checkAllDone(next)
          return next
        })
      } else if (isNoResponseTriggered) {
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'no_response' as const }
          checkAllDone(next)
          return next
        })
      } else {
        // Jika data kosong / di-skip karena input user tidak diisi
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'failed' as const }
          checkAllDone(next)
          return next
        })
      }
    } catch (err: any) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      await flushTypewriterQueue()

      const finalContent = accumulated.trim()
      if (finalContent.length > 15) {
        stopTypewriterLoop(item.key, finalContent)
        saveItemResult(item.key, finalContent)
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'success' as const }
          checkAllDone(next)
          return next
        })
      } else if (err?.name === 'AbortError' || isNoResponseTriggered) {
        stopTypewriterLoop(item.key, '')
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'no_response' as const }
          checkAllDone(next)
          return next
        })
      } else {
        stopTypewriterLoop(item.key, '')
        setStatuses((prev) => {
          const next = { ...prev, [item.key]: 'failed' as const }
          checkAllDone(next)
          return next
        })
      }
    }
  }

  const startProcessingQueue = async () => {
    for (const item of POLISH_ITEMS) {
      try {
        await processItem(item)
      } catch {
        /* jamin antrean tidak terputus */
      }
    }
    setIsDoneAll(true)
    onComplete(updatedProfilRef.current)
  }

  const handleRetryItem = async (item: PolishItem) => {
    try {
      await processItem(item)
    } catch {
      /* jamin tidak uncaught error */
    }
  }

  const handleSkipItem = (key: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [key]: 'failed' as const }
      checkAllDone(next)
      return next
    })
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
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header Modal */}
        <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                Merapikan Profil Perusahaan (BAB II)
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                AI sedang memformalkan Sejarah, Visi-Misi, Aturan, dan Job Description tanpa merubah fakta input.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body / Items List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {POLISH_ITEMS.map((item) => {
            const st = statuses[item.key]
            const text = streamTexts[item.key] || ''

            return (
              <div
                key={item.key}
                style={{
                  border: `1.5px solid ${st === 'generating' ? '#3b82f6' : st === 'no_response' ? '#ef4444' : st === 'success' ? '#10b981' : '#cbd5e1'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  background: st === 'generating' ? '#eff6ff' : st === 'no_response' ? '#fef2f2' : st === 'success' ? '#f0fdf4' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: text ? '0.5rem' : 0 }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{item.title}</strong>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{item.subtitle}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {st === 'generating' && (
                      <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="spinner" style={{ width: 14, height: 14, border: '2px solid #93c5fd', borderTopColor: '#2563eb', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        Memproses...
                      </span>
                    )}

                    {st === 'success' && (
                      <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <IconCheck size={16} /> Selesai
                      </span>
                    )}

                    {st === 'no_response' && (
                      <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <IconAlert size={16} /> AI No-Response
                      </span>
                    )}

                    {st === 'failed' && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Di-skip (Data Asli)</span>
                    )}

                    {st === 'pending' && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Menunggu...</span>
                    )}
                  </div>
                </div>

                {/* Live Streaming Content Box */}
                {text && (
                  <div
                    ref={(el) => {
                      boxRefs.current[item.key] = el
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.83rem',
                      color: '#334155',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      marginTop: '0.5rem',
                    }}
                  >
                    {text}
                  </div>
                )}

                {/* AI No-Response Alert & Retry Controls */}
                {st === 'no_response' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#991b1b', fontWeight: 500 }}>
                      ⚠️ Koneksi AI tidak merespons. Anda dapat mencoba lagi atau melanjutkan menggunakan data asli.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => handleRetryItem(item)}
                        style={{ fontSize: '0.78rem', background: '#ffffff', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        🔄 Coba Lagi
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => handleSkipItem(item.key)}
                        style={{ fontSize: '0.78rem', background: '#475569', color: '#ffffff', border: 'none' }}
                      >
                        Gunakan Data Asli
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Modal */}
        <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            {isDoneAll ? '✅ Seluruh Profil Perusahaan Selesai Dipoles.' : ' Harap tunggu, latar belakang dikunci selama pemolesan...'}
          </span>
          <button
            type="button"
            className="btn-primary"
            disabled={!isDoneAll}
            onClick={() => {
              onComplete(updatedProfilRef.current)
              onClose()
            }}
            style={{
              opacity: isDoneAll ? 1 : 0.5,
              cursor: isDoneAll ? 'pointer' : 'not-allowed',
              padding: '0.55rem 1.25rem',
              fontSize: '0.88rem',
            }}
          >
            {isDoneAll ? 'Selesai & Lanjutkan ke Editor' : 'Memproses...'}
          </button>
        </div>
      </div>
    </div>
  )
}
