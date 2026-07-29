/**
 * Panel "perlu dilengkapi" — menampilkan blocking issues + pertanyaan ulang
 * (requestions) dari respons 422 endpoint /generate.
 *
 * Backend sudah menyiapkan pertanyaan yang ramah per field (mis. jawaban
 * "gatau" → "Jurusan kamu apa? contoh: TKJ..."); panel ini tinggal
 * menampilkannya, dipisah antara yang WAJIB dan yang berupa saran.
 */

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

export default function RequestionPanel({
  message, issues, requestions,
}: {
  message: string
  issues: GenerateIssue[]
  requestions: Requestion[]
}) {
  const byField = new Map(requestions.map(r => [r.field, r]))
  // Saran = requestion yang tidak memblokir (wajib=false) dan tidak sudah
  // tercantum sebagai blocking issue.
  const issueFields = new Set(issues.map(i => i.field))
  const saran = requestions.filter(r => !r.wajib && !issueFields.has(r.field))

  return (
    <div
      className="nested-card"
      style={{ borderLeftColor: 'var(--red-600)', marginTop: '1rem' }}
    >
      <strong style={{ color: 'var(--red-600)' }}>{message}</strong>

      {issues.length > 0 && (
        <ol style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.65 }}>
          {issues.map((iss, k) => {
            const rq = byField.get(iss.field)
            return (
              <li key={k} style={{ marginBottom: '0.45rem' }}>
                <strong>{label(iss.field)}</strong>
                {rq?.current_value ? (
                  <span className="muted"> — jawabanmu sekarang: “{rq.current_value}”</span>
                ) : null}
                <br />
                <span>{rq ? rq.question : iss.message}</span>
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
            {saran.map((r, k) => (
              <li key={k} style={{ marginBottom: '0.35rem' }}>
                <strong>{label(r.field)}</strong>
                {r.current_value ? <span className="muted"> (jawabanmu: “{r.current_value}”)</span> : null}
                {' — '}{r.question}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
