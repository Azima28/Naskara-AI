import { useState } from 'react'
import { getJurusanExample, type JurusanExample } from '@/utils/jurusanExamples'
import type { JenisTabel } from '@/types/pkl'
import JurusanDocxPreviewModal from './JurusanDocxPreviewModal'
import { IconDocument, IconSearch } from '@/components/common/Icons'

interface JurusanExampleCardProps {
  jurusanKey?: string
  jenisTabel?: JenisTabel
}

export default function JurusanExampleCard({ jurusanKey, jenisTabel }: JurusanExampleCardProps) {
  const [showModal, setShowModal] = useState(false)
  const example: JurusanExample = getJurusanExample(jurusanKey)
  const sk = example.studiKasus

  const effectiveType = jenisTabel || 'optimasi'

  const HEADER_MAP = {
    optimasi: {
      title: 'CONTOH TABEL DATA PERBANDINGAN (SEBELUM VS SESUDAH) DI DOKUMEN (.DOCX):',
      label: 'NAMA / PARAMETER DATA',
      awal: 'KONDISI SEBELUM (AWAL)',
      akhir: 'KONDISI SESUDAH (HASIL AKHIR)'
    },
    pencapaian: {
      title: 'CONTOH TABEL PENCAPAIAN TARGET KERJA DI DOKUMEN (.DOCX):',
      label: 'INDIKATOR / PARAMETER TARGET',
      awal: 'TARGET PERUSAHAAN',
      akhir: 'REALISASI PELAKSANAAN'
    },
    kesesuaian: {
      title: 'CONTOH TABEL KESESUAIAN STANDAR SOP DI DOKUMEN (.DOCX):',
      label: 'PROSEDUR / STANDAR KERJA',
      awal: 'STANDAR SOP / TEORI',
      akhir: 'PELAKSANAAN DI LAPANGAN'
    },
    troubleshooting: {
      title: 'CONTOH TABEL TROUBLESHOOTING & PENANGANAN MASALAH DI DOKUMEN (.DOCX):',
      label: 'KASUS / GEJALA KERUSAKAN',
      awal: 'ANALISIS PENYEBAB',
      akhir: 'TINDAKAN / SOLUSI'
    }
  }

  const h = HEADER_MAP[effectiveType] || HEADER_MAP.optimasi

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: 'clamp(0.6rem, 2vw, 0.95rem) clamp(0.35rem, 2vw, 0.85rem)',
        backgroundColor: 'var(--paper-2, #ece8de)',
        border: '1px solid var(--line-strong, #b9b09c)',
        borderLeft: '4px solid var(--green-600, #187257)',
        borderRadius: '10px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{example.icon || '📌'}</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontFamily: 'var(--font-serif)', color: 'var(--ink, #262521)' }}>
              Contoh Pembahasan &amp; Tabel Data ({example.label})
            </h4>
            <p className="muted" style={{ margin: '0.1rem 0 0', fontSize: '0.8rem' }}>
              Contoh nyata data perbandingan laporan sebagai gambaran/referensi penulisan jurusan kamu
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
          padding: 'clamp(0.45rem, 1.8vw, 0.75rem) clamp(0.3rem, 2vw, 0.65rem)',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--green-700, #14614a)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <IconDocument size={16} /> Sample Judul: "{sk.judul}"
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft, #555)', margin: '0 0 0.6rem 0', lineHeight: 1.45 }}>
          {sk.latar_belakang}
        </p>

        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink, #262521)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
          {h.title}
        </div>

        {/* Table View */}
        <div className="table-scroll compact-example-table" style={{ marginTop: '0.25rem' }}>
          <table className="simple-table" style={{ marginTop: 0 }}>
            <thead>
              <tr style={{ background: 'var(--paper-2, #ece8de)' }}>
                <th className="col-num" style={{ width: '20px' }}>#</th>
                <th>{h.label}</th>
                <th style={{ color: '#92610c' }}>{h.awal}</th>
                <th style={{ color: 'var(--green-700)' }}>{h.akhir}</th>
              </tr>
            </thead>
            <tbody>
              {sk.data_angka.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-num" style={{ color: 'var(--ink-soft)' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.label}</td>
                  <td style={{ color: '#92610c' }}>{item.nilai_awal || item.sebelum || '-'}</td>
                  <td style={{ color: 'var(--green-700)', fontWeight: 600 }}>{item.nilai_akhir || item.sesudah || item.nilai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn-sm btn-outline btn-mobile-full"
          onClick={() => setShowModal(true)}
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', background: '#ffffff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <IconSearch size={14} /> Lihat Contoh Tampilan Laporan Jurusan Ini (.docx)
        </button>
      </div>

      <JurusanDocxPreviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialJurusanKey={jurusanKey}
      />
    </div>
  )
}
