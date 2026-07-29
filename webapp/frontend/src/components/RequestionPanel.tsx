/**
 * Panel "perlu dilengkapi" — menampilkan blocking issues + pertanyaan ulang
 * (requestions) dari respons 422 endpoint /generate.
 *
 * Menyediakan tombol navigasi langsung ke langkah form wizard yang belum lengkap.
 */
import { useNavigate } from 'react-router-dom'

export interface GenerateIssue {
  field: string
  message: string
}

export interface Requestion {
  field: string
  current_value: string
  question: string
  wajib: boolean
}

/** Nama field teknis → label yang dimengerti siswa. */
const FIELD_LABELS: Record<string, string> = {
  'siswa.nama': 'Nama siswa',
  'siswa.nis': 'NIS',
  'siswa.jurusan': 'Jurusan',
  'sekolah.nama': 'Nama sekolah',
  'sekolah.kota': 'Kota sekolah',
  'perusahaan.nama': 'Nama tempat PKL',
  'perusahaan.alamat': 'Alamat tempat PKL',
  'perusahaan.pimpinan.nama': 'Nama pimpinan perusahaan',
  'perusahaan.pembimbing_industri.nama': 'Nama pembimbing industri',
  'sekolah.pembimbing_sekolah.nama': 'Nama guru pembimbing',
  'sekolah.ketua_kk.nama': 'Nama ketua jurusan',
  'pkl.tanggal_mulai': 'Tanggal mulai PKL',
  'pkl.tanggal_selesai': 'Tanggal selesai PKL',
  'lampiran.foto_kegiatan': 'Foto dokumentasi (LAMPIRAN)',
  'profil_perusahaan.sejarah': 'Sejarah perusahaan',
  'profil_perusahaan.visi': 'Visi perusahaan',
  'profil_perusahaan.tata_tertib_perusahaan': 'Tata tertib khusus perusahaan',
  'profil_perusahaan.tata_tertib': 'Tata tertib perusahaan',
  'studi_kasus.judul': 'Judul studi kasus teknis',
  'studi_kasus.proses_atau_formula': 'Proses / langkah teknis studi kasus',
  'kata_pengantar.ucapan_syukur': 'Kata Pengantar (Ucapan Syukur)',
}

const label = (field: string) => FIELD_LABELS[field] || field

export function getStepForField(field: string): { stepId: string; stepTitle: string } {
  const f = (field || '').toLowerCase()
  if (f.startsWith('siswa.')) return { stepId: 'siswa', stepTitle: 'Data Siswa' }
  if (f.startsWith('sekolah.')) return { stepId: 'sekolah', stepTitle: 'Data Sekolah' }
  if (f.startsWith('perusahaan.')) return { stepId: 'perusahaan', stepTitle: 'Data Perusahaan' }
  if (f.startsWith('pkl.')) return { stepId: 'pkl', stepTitle: 'Periode PKL' }
  if (f.startsWith('profil_perusahaan.') || f.includes('tata_tertib') || f.includes('sejarah') || f.includes('visi')) {
    return { stepId: 'profil', stepTitle: 'Profil Perusahaan' }
  }
  if (f.startsWith('studi_kasus.')) return { stepId: 'studi-kasus', stepTitle: 'Studi Kasus' }
  if (f.startsWith('kata_pengantar.') || f.includes('kesimpulan') || f.includes('saran')) {
    return { stepId: 'closing', stepTitle: 'Penutup & Kesimpulan' }
  }
  if (f.startsWith('lampiran.') || f.includes('foto') || f.includes('assets') || f.includes('gambar')) {
    return { stepId: 'assets', stepTitle: 'Lampiran & Foto' }
  }
  if (f.includes('kegiatan') || f.includes('peralatan') || f.includes('tugas')) {
    return { stepId: 'review-ai', stepTitle: 'Kegiatan & Peralatan' }
  }
  return { stepId: 'assets', stepTitle: 'Form Data' }
}

export default function RequestionPanel({
  message,
  issues,
  requestions,
  draftId,
}: {
  message: string
  issues: (GenerateIssue | string)[]
  requestions: Requestion[]
  draftId?: string
}) {
  const nav = useNavigate()

  const normalizedIssues: GenerateIssue[] = (issues || []).map((iss) => {
    if (typeof iss === 'string') {
      let body = iss
      for (const prefix of ['❌ WAJIB:', '❌ WAJIB ', 'WAJIB:']) {
        if (body.startsWith(prefix)) {
          body = body.slice(prefix.length).trim()
          break
        }
      }
      if (body.includes(' — ')) {
        const [fieldPart, msgPart] = body.split(' — ')
        const fieldClean = fieldPart.replace(/\skosong$/, '').trim()
        return { field: fieldClean, message: msgPart.trim() }
      }
      return { field: '', message: iss }
    }
    return iss
  })

  const byField = new Map(requestions.map(r => [r.field, r]))
  // Saran = requestion yang tidak memblokir (wajib=false) dan tidak sudah
  // tercantum sebagai blocking issue.
  const issueFields = new Set(normalizedIssues.map(i => i.field).filter(Boolean))
  const saran = requestions.filter(r => !r.wajib && !issueFields.has(r.field))

  const firstIssueField = normalizedIssues.find((i) => i.field)?.field || requestions.find((r) => r.field)?.field || ''
  const firstStep = firstIssueField ? getStepForField(firstIssueField) : { stepId: 'siswa', stepTitle: 'Form Data' }

  const goToStep = (stepId: string, fieldKey?: string) => {
    if (draftId) {
      nav(`/wizard/${draftId}?step=${stepId}${fieldKey ? `&field=${fieldKey}` : ''}`)
    } else {
      nav(-1)
    }
  }

  return (
    <div
      className="nested-card"
      style={{ borderLeftColor: 'var(--red-600)', marginTop: '1rem', background: '#fff' }}
    >
      <div
        style={{
          marginBottom: '0.85rem',
          padding: '0.75rem 1rem',
          background: 'var(--red-50, #fef2f2)',
          border: '1px solid var(--red-200, #fecaca)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <strong style={{ color: 'var(--red-700, #b91c1c)', fontSize: '0.92rem', display: 'block' }}>
            ⚠️ {message}
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--red-900, #7f1d1d)' }}>
            Klik tombol di bawah untuk langsung menuju form yang belum lengkap.
          </span>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{
            fontSize: '0.84rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--red-600, #dc2626)',
            borderColor: 'var(--red-700, #b91c1c)',
            color: '#ffffff',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
          onClick={() => goToStep(firstStep.stepId, firstIssueField)}
        >
          👉 Langsung ke {firstStep.stepTitle} →
        </button>
      </div>

      {normalizedIssues.length > 0 && (
        <ol style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.65 }}>
          {normalizedIssues.map((iss, k) => {
            const rq = iss.field ? byField.get(iss.field) : null
            const step = iss.field ? getStepForField(iss.field) : null
            return (
              <li key={k} style={{ marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    {iss.field ? <strong style={{ color: 'var(--red-700)' }}>{label(iss.field)}</strong> : null}
                    {rq?.current_value ? (
                      <span className="muted"> — jawabanmu sekarang: “{rq.current_value}”</span>
                    ) : null}
                    {iss.field ? <br /> : null}
                    <span>{rq ? rq.question : iss.message}</span>
                  </div>
                  {step && (
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.25rem 0.6rem',
                        whiteSpace: 'nowrap',
                        color: 'var(--red-700)',
                        borderColor: 'var(--red-300, #fca5a5)',
                        background: '#ffffff',
                      }}
                      onClick={() => goToStep(step.stepId, iss.field)}
                    >
                      📍 Buka {step.stepTitle}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {saran.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--line)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--amber-700)' }}>
            Disarankan dilengkapi juga (tidak memblokir):
          </span>
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {saran.map((r, k) => {
              const step = r.field ? getStepForField(r.field) : null
              return (
                <li key={k} style={{ marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong>{label(r.field)}</strong>
                      {r.current_value ? <span className="muted"> (jawabanmu: “{r.current_value}”)</span> : null}
                      {' — '}{r.question}
                    </div>
                    {step && (
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          whiteSpace: 'nowrap',
                          color: 'var(--amber-800)',
                        }}
                        onClick={() => goToStep(step.stepId, r.field)}
                      >
                        📍 {step.stepTitle}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
