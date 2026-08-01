import { useState } from 'react'
import type { DataAngka, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import JurusanExampleCard from '@/components/wizard/JurusanExampleCard'
import JurusanDocxPreviewModal from '@/components/wizard/JurusanDocxPreviewModal'
import { getJurusanExample } from '@/utils/jurusanExamples'
import { IconDocument, IconSearch } from '@/components/common/Icons'

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const [showDocxModal, setShowDocxModal] = useState(false)
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan)
  const sampleData = jurusanExample.studiKasus.data_angka
  const sample1 = sampleData[0] || { label: 'Jumlah Dokumen / Unit Diproses', sebelum: '0 Berkas', sesudah: '45 Berkas', nilai: '45 Berkas' }

  const updAngka = (i: number, patch: Partial<DataAngka>) => {
    const next = [...sk.data_angka]
    next[i] = { ...next[i], ...patch }
    upd({ data_angka: next })
  }

  return (
    <>
      <h2>Topik Utama &amp; Pengalaman Kerja Paling Berkesan (BAB IV &amp; V)</h2>
      <p className="muted">
        Ceritakan 1 pekerjaan utama yang paling sering atau berkesan selama kamu PKL. AI akan membantu merapikan tulisan kamu menjadi narasi alur cerita laporan resmi yang bagus.
      </p>

      {/* Storyline Flow Progress Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          margin: '1.25rem 0',
          padding: '0.65rem 1rem',
          background: 'var(--green-50, #f0fdf4)',
          border: '1px solid var(--green-500, #4ade80)',
          borderRadius: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--green-700, #14614a)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}><IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Alur Cerita Pekerjaan:</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>1. Tugas Diterima</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>2. Masalah Awal (Sebelum)</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>3. Langkah Kerja</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>4. Hasil Akhir (Sesudah)</span>
      </div>

      <FieldGroup title="Alur Pengalaman &amp; Pelaksanaan Pekerjaan Utama">
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn-sm btn-outline btn-mobile-full"
            onClick={() => setShowDocxModal(true)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', background: '#ffffff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <IconSearch size={14} /> Lihat Contoh Pembahasan &amp; Alur Pekerjaan Jurusan Ini (.docx)
          </button>
        </div>

        <TextField
          label="1. Pekerjaan / Tugas Apa yang Kamu Kerjakan?"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.judul}"`}
          hint="Tuliskan nama tugas atau proyek utama yang kamu tangani."
        />
        <TextareaField
          label="2. Bagaimana Kondisi Awal / Masalah Sebelum Kamu Kerjakan?"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.latar_belakang}"`}
          hint="Bagaimana kondisi awal atau kendala sebelum pekerjaan kamu selesaikan?"
        />
        <TextareaField
          label="3. Langkah-Langkah yang Kamu Lakukan untuk Menyelesaikannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}):\n${jurusanExample.studiKasus.proses_atau_formula}`}
          hint="Tuliskan urutan kegiatan pengerjaannya dari awal sampai selesai (bisa pakai nomor 1, 2, 3)."
        />
        <TextareaField
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.studiKasus.hasil}"`}
          hint="Bagaimana hasil akhir setelah pekerjaan tersebut selesai kamu lakukan?"
        />
      </FieldGroup>

      {/* Data Angka / Perbandingan Sebelum vs Sesudah (OPSIONAL) */}
      <FieldGroup title="Hasil yang Bisa Diukur &amp; Perbandingan (Sebelum vs Sesudah)" full>
        <div className="field field--full">
          <span className="field__label">
            Tabel Data Angka Perbandingan <span className="field__badge field__badge--opsional">OPSIONAL</span>
          </span>
          <p className="muted" style={{ margin: '0.25rem 0 0.85rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Ada hasil pekerjaanmu yang bisa dibandingkan sebelum dan sesudah diperbaiki? (Bebas menggunakan satuan: <strong>detik, menit, jam, hari, MB, %, Rp, unit, dll.</strong>)<br />
            Jika ada, tuliskan di sini. Jika tidak ada, bagian ini boleh dikosongkan.
          </p>

          {/* Dynamic Major-Specific Example Card with Docx Preview */}
          <JurusanExampleCard
            jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
          />

          <div className="array">
            {sk.data_angka.map((d, i) => {
              const sampleRow = sampleData[i % sampleData.length] || sample1
              return (
                <div key={i} className="array__row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label="Apa yang diukur / dibandingkan?"
                      value={d.label}
                      onChange={(v) => updAngka(i, { label: v })}
                      placeholder={`Contoh: ${sampleRow.label}`}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label="Hasil Perbandingan (Sebelum ➔ Sesudah)"
                      value={d.nilai}
                      onChange={(v) => updAngka(i, { nilai: v })}
                      placeholder={`Contoh: Sebelum ${sampleRow.sebelum} ➔ Sesudah ${sampleRow.sesudah}`}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-sm btn-danger array__remove"
                    onClick={() => upd({ data_angka: sk.data_angka.filter((_, idx) => idx !== i) })}
                    aria-label="Hapus baris data angka"
                    title="Hapus baris ini"
                    style={{ marginTop: '1.8rem' }}
                  >
                    ✕ Hapus
                  </button>
                </div>
              )
            })}
            <button
              type="button"
              className="btn-sm btn-outline array__add"
              onClick={() => upd({ data_angka: [...sk.data_angka, emptyDataAngka()] })}
            >
              + Tambah Data Perbandingan
            </button>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Foto &amp; Dokumen Pendukung (Opsional)">
        <ImageArrayUploadField label="Upload Foto Dokumentasi Pekerjaan Ini" items={sk.assets} onChange={(assets) => upd({ assets })} hint="Unggah foto saat kamu mengerjakan tugas ini atau foto kondisi barang sebelum/sesudah." />
      </FieldGroup>

      <JurusanDocxPreviewModal
        isOpen={showDocxModal}
        onClose={() => setShowDocxModal(false)}
        initialJurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
      />
    </>
  )
}
