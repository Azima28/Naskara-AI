import type { DataAngka, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import JurusanExampleCard from '@/components/wizard/JurusanExampleCard'
import { getJurusanExample } from '@/utils/jurusanExamples'
import { IconDocument } from '@/components/common/Icons'

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan)
  const sampleData = jurusanExample.studiKasus.data_angka
  const sample1 = sampleData[0] || { label: 'RPM Mesin', nilai: '750 RPM' }
  const sample2 = sampleData[1] || { label: 'Kecepatan Internet', nilai: '50 Mbps' }

  const updAngka = (i: number, patch: Partial<DataAngka>) => {
    const next = [...sk.data_angka]
    next[i] = { ...next[i], ...patch }
    upd({ data_angka: next })
  }

  return (
    <>
      <h2>Topik Utama & Pengalaman Kerja Paling Berkesan (BAB IV & V)</h2>
      <p className="muted">
        Opsional. Ceritakan 1 pekerjaan utama yang paling sering atau berkesan selama kamu PKL. AI akan membantu merapikan tulisan kamu menjadi narasi alur cerita laporan resmi yang bagus.
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
        <span style={{ opacity: 0.8, flexShrink: 0 }}>2. Masalah Awal</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>3. Langkah Kerja</span>
        <span style={{ color: 'var(--green-600)', flexShrink: 0 }}>➔</span>
        <span style={{ opacity: 0.8, flexShrink: 0 }}>4. Hasil & Angka</span>
      </div>

      {/* Dynamic Major-Specific Example Card */}
      <JurusanExampleCard
        jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
      />

      <FieldGroup title={`Alur Pengalaman & Pelaksanaan Pekerjaan (${jurusanExample.badge})`}>
        <TextField
          label="1. Pekerjaan / Tugas Apa yang Kamu Kerjakan?"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.badge}): "${jurusanExample.studiKasus.judul}"`}
          hint="Tuliskan nama tugas atau proyek utama yang kamu tangani."
        />
        <TextareaField
          label="2. Bagaimana Kondisi Awal / Masalah Sebelum Kamu Kerjakan?"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.badge}): "${jurusanExample.studiKasus.latar_belakang}"`}
          hint="Apa kendala atau kondisi barang/sistem sebelum kamu tangani?"
        />
        <TextareaField
          label="3. Langkah-Langkah yang Kamu Lakukan untuk Menyelesaikannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.badge}):\n${jurusanExample.studiKasus.proses_atau_formula}`}
          hint="Tuliskan urutan kegiatan pengerjaannya dari awal sampai selesai (bisa pakai nomor 1, 2, 3)."
        />
        <TextareaField
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.badge}): "${jurusanExample.studiKasus.hasil}"`}
          hint="Bagaimana kondisi barang/sistem setelah selesai kamu perbaiki atau selesaikan?"
        />
      </FieldGroup>

      {/* Data Angka Embedded Directly Under Step 4 as Evidence */}
      <FieldGroup title={`Bukti Catatan Angka / Ukuran Hasil Pekerjaan (${jurusanExample.badge})`} full>
        <div className="field field--full">
          <span className="field__label">
            Catatan Angka / Hasil Ukur <span className="field__badge field__badge--opsional">Opsional</span>
          </span>
          <span className="field__hint" style={{ marginBottom: '0.6rem' }}>
            Jika pekerjaan kamu memiliki catatan angka atau pengukuran khas jurusan <strong>{jurusanExample.badge}</strong> (contoh: <em>"{sample1.label}" → "{sample1.nilai}"</em>, <em>"{sample2.label}" → "{sample2.nilai}"</em>), tuliskan di bawah ini.
          </span>
          <div className="array">
            {sk.data_angka.map((d, i) => {
              const sampleRow = sampleData[i % sampleData.length] || sample1
              return (
                <div key={i} className="array__row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label={i === 0 ? 'Nama Ukuran / Parameter' : ''}
                      value={d.label}
                      onChange={(v) => updAngka(i, { label: v })}
                      placeholder={`Contoh: ${sampleRow.label}`}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label={i === 0 ? 'Nilai / Angka Hasil' : ''}
                      value={d.nilai}
                      onChange={(v) => updAngka(i, { nilai: v })}
                      placeholder={`Contoh: ${sampleRow.nilai}`}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-sm btn-danger array__remove"
                    onClick={() => upd({ data_angka: sk.data_angka.filter((_, idx) => idx !== i) })}
                    aria-label="Hapus baris data angka"
                    title="Hapus baris ini"
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
              + Tambah Catatan Angka
            </button>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Foto & Dokumen Pendukung (Opsional)">
        <ImageArrayUploadField label="Upload Foto Dokumentasi Pekerjaan Ini" items={sk.assets} onChange={(assets) => upd({ assets })} hint="Unggah foto saat kamu mengerjakan tugas ini atau foto kondisi barang sebelum/sesudah." />
      </FieldGroup>
    </>
  )
}
