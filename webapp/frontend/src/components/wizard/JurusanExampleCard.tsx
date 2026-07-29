import { getJurusanExample, type JurusanExample } from '@/utils/jurusanExamples'
import type { StudiKasus } from '@/types/pkl'

interface JurusanExampleCardProps {
  jurusanKey?: string
  onApplyExample?: (sample: StudiKasus['data_angka'] extends Array<infer T> ? {
    judul: string
    latar_belakang: string
    proses_atau_formula: string
    hasil: string
    data_angka: T[]
  } : never) => void
}

export default function JurusanExampleCard({ jurusanKey, onApplyExample }: JurusanExampleCardProps) {
  const example: JurusanExample = getJurusanExample(jurusanKey)
  const sk = example.studiKasus

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1.1rem 1.25rem',
        backgroundColor: 'var(--paper-2, #ece8de)',
        border: '1px solid var(--line-strong, #b9b09c)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{example.icon}</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontFamily: 'var(--font-serif)', color: 'var(--ink, #262521)' }}>
              Contoh Pembahasan & Tabel Data ({example.label})
            </h4>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              Contoh nyata data laporan yang paling relevan dengan jurusan kamu
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: 'var(--green-100, #e2efe7)',
            color: 'var(--green-700, #14614a)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {example.badge}
        </span>
      </div>

      {/* Visual Table Mockup */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--line, #ddd6c8)',
          borderRadius: '8px',
          padding: '0.9rem 1rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--green-700, #14614a)', marginBottom: '0.4rem' }}>
          📌 Sample Judul: "{sk.judul}"
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft, #555)', margin: '0 0 0.6rem 0', lineHeight: 1.45 }}>
          {sk.latar_belakang}
        </p>

        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink, #262521)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
          📊 Contoh Tabel Data Angka / Perbandingan di Dokumen (.docx):
        </div>

        <div className="table-scroll" style={{ marginTop: '0.25rem' }}>
          <table className="simple-table" style={{ marginTop: 0, fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--paper-2, #ece8de)' }}>
                <th style={{ padding: '0.35rem 0.6rem' }}>#</th>
                <th style={{ padding: '0.35rem 0.6rem' }}>Nama / Label Data</th>
                <th style={{ padding: '0.35rem 0.6rem' }}>Nilai / Pengukuran</th>
              </tr>
            </thead>
            <tbody>
              {sk.data_angka.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ width: '30px', padding: '0.35rem 0.6rem', color: 'var(--ink-soft)' }}>{idx + 1}</td>
                  <td style={{ padding: '0.35rem 0.6rem', fontWeight: 500 }}>{item.label}</td>
                  <td style={{ padding: '0.35rem 0.6rem', color: 'var(--green-700)', fontWeight: 600 }}>{item.nilai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {onApplyExample && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={() => onApplyExample(sk)}
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', background: '#ffffff' }}
          >
            ⚡ Isikan Contoh Jurusan Ini ke Form Saya
          </button>
        </div>
      )}
    </div>
  )
}
