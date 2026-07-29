import type { DataAngka, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import JurusanExampleCard from '@/components/wizard/JurusanExampleCard'
import { getJurusanExample } from '@/utils/jurusanExamples'

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan)
  const sampleData = jurusanExample.studiKasus.data_angka
  const sample1 = sampleData[0] || { label: 'RPM Mesin', nilai: '750 RPM' }
  const sample2 = sampleData[1] || { label: 'Kecepatan Internet', nilai: '50 Mbps' }

  const handleApplyExample = () => {
    upd({
      judul: jurusanExample.studiKasus.judul,
      latar_belakang: jurusanExample.studiKasus.latar_belakang,
      proses_atau_formula: jurusanExample.studiKasus.proses_atau_formula,
      hasil: jurusanExample.studiKasus.hasil,
      data_angka: [...jurusanExample.studiKasus.data_angka],
    })
  }

  const handleClearForm = () => {
    upd({
      judul: '',
      latar_belakang: '',
      proses_atau_formula: '',
      hasil: '',
      data_angka: [],
    })
  }

  const hasData = !!(sk.judul || sk.latar_belakang || sk.proses_atau_formula || sk.hasil || sk.data_angka.length > 0)

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
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--green-700, #14614a)',
          whiteSpace: 'nowrap',
        }}
      >
        <span>📌 Alur Cerita Pekerjaan:</span>
        <span style={{ opacity: 0.8 }}>1. Tugas Diterima</span>
        <span style={{ color: 'var(--green-600)' }}>➔</span>
        <span style={{ opacity: 0.8 }}>2. Kondisi / Masalah Awal</span>
        <span style={{ color: 'var(--green-600)' }}>➔</span>
        <span style={{ opacity: 0.8 }}>3. Langkah Pengerjaan</span>
        <span style={{ color: 'var(--green-600)' }}>➔</span>
        <span style={{ opacity: 0.8 }}>4. Hasil Akhir & Ukuran Data</span>
      </div>

      {/* Dynamic Major-Specific Example Card */}
      <JurusanExampleCard
        jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
        onApplyExample={handleApplyExample}
        onClearForm={handleClearForm}
      />

      {/* Alert Notice Banner for Switching Major Data */}
      {hasData && (
        <div
          style={{
            margin: '0.5rem 0 1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--amber-100, #fffbe6)',
            border: '1px solid var(--amber-700, #ffe58f)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            fontSize: '0.83rem',
            color: 'var(--ink, #262521)',
          }}
        >
          <div>
            💡 <strong>Kelola Isian Form Saat Ini:</strong> Jika kamu baru saja mengganti jurusan ke <strong>{jurusanExample.badge}</strong>, kamu bisa menyalin draf contoh jurusan ini atau mengosongkan form untuk mengetik draf baru.
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={handleApplyExample}
              style={{ fontSize: '0.78rem', padding: '0.28rem 0.65rem' }}
            >
              ⚡ Salin Draf {jurusanExample.badge}
            </button>
            <button
              type="button"
              className="btn-sm btn-outline btn-danger"
              onClick={handleClearForm}
              style={{ fontSize: '0.78rem', padding: '0.28rem 0.65rem' }}
            >
              🧹 Kosongkan Form
            </button>
          </div>
        </div>
      )}

      <FieldGroup title={`Alur Pengalaman & Pelaksanaan Pekerjaan (${jurusanExample.badge})`}>
        <TextField
          label="1. Pekerjaan / Tugas Apa yang Kamu Kerjakan?"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="opsional"
          placeholder={`Contoh (${jurusanExample.badge}): "${jurusanExample.studiKasus.judul}"`}
          hint="Tuliskan nama tugas atau proyek utama yang kamu tangani."
        />
        <TextareaField
          label="2. Bagaimana Kondisi Awal / Masalah Sebelum Kamu Kerjakan?"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="opsional"
          placeholder={`Contoh (${jurusanExample.badge}): "${jurusanExample.studiKasus.latar_belakang}"`}
          hint="Apa kendala atau kondisi barang/sistem sebelum kamu tangani?"
        />
        <TextareaField
          label="3. Langkah-Langkah yang Kamu Lakukan untuk Menyelesaikannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="opsional"
          placeholder={`Contoh (${jurusanExample.badge}):\n${jurusanExample.studiKasus.proses_atau_formula}`}
          hint="Tuliskan urutan kegiatan pengerjaannya dari awal sampai selesai (bisa pakai nomor 1, 2, 3)."
        />
        <TextareaField
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="opsional"
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
                <div key={i} className="array__row" style={{ alignItems: 'flex-start' }}>
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
                    style={{ marginTop: i === 0 ? '1.65rem' : '0' }}
                    onClick={() => upd({ data_angka: sk.data_angka.filter((_, idx) => idx !== i) })}
                    aria-label="Hapus baris data angka"
                    title="Hapus baris ini"
                  >
                    ✕
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
