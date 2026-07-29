import type { DataAngka, PklContext, StudiKasus } from '@/types/pkl'
import { emptyDataAngka } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import JurusanExampleCard from '@/components/wizard/JurusanExampleCard'

export default function StudiKasusStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const sk = ctx.studi_kasus
  const upd = (patch: Partial<StudiKasus>) => set({ studi_kasus: { ...sk, ...patch } })

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
      />

      <FieldGroup title="Alur Pengalaman & Pelaksanaan Pekerjaan">
        <TextField
          label="1. Pekerjaan / Tugas Apa yang Kamu Kerjakan?"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="opsional"
          placeholder="Contoh: Service Tune-Up Mesin EFI / Input Rekap Keuangan Bulanan / Setting Router WiFi Kantor"
          hint="Tuliskan nama tugas atau proyek utama yang kamu tangani."
        />
        <TextareaField
          label="2. Bagaimana Kondisi Awal / Masalah Sebelum Kamu Kerjakan?"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="opsional"
          placeholder="Contoh: Karena tarikan mesin mobil pelanggan terasa berat dan lampu indikator check engine menyala, sehingga perlu diperbaiki."
          hint="Apa kendala atau kondisi barang/sistem sebelum kamu tangani?"
        />
        <TextareaField
          label="3. Langkah-Langkah yang Kamu Lakukan untuk Menyelesaikannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="opsional"
          placeholder="1. Melakukan pemeriksaan awal dengan OBD-II Scanner.&#10;2. Membersihkan busi dan injektor bahan bakar.&#10;3. Melakukan pengujian tes jalan dan tes idle mesin."
          hint="Tuliskan urutan kegiatan pengerjaannya dari awal sampai selesai (bisa pakai nomor 1, 2, 3)."
        />
        <TextareaField
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="opsional"
          placeholder="Contoh: Mesin mobil kembali halus di 750 RPM, tarikan responsif, dan siap diserahkan ke pelanggan."
          hint="Bagaimana kondisi barang/sistem setelah selesai kamu perbaiki atau selesaikan?"
        />
      </FieldGroup>

      {/* Data Angka Embedded Directly Under Step 4 as Evidence */}
      <FieldGroup title="Bukti Catatan Angka / Ukuran Hasil Pekerjaan (Opsional)" full>
        <div className="field field--full">
          <span className="field__label">
            Catatan Angka / Hasil Ukur <span className="field__badge field__badge--opsional">Opsional</span>
          </span>
          <span className="field__hint" style={{ marginBottom: '0.6rem' }}>
            Jika pekerjaan kamu memiliki catatan angka atau pengukuran (contoh: "RPM Mesin" → "750 RPM", "Total Berkas Selesai" → "45 Berkas", "Kecepatan WiFi" → "50 Mbps"), tuliskan di bawah ini.
          </span>
          <div className="array">
            {sk.data_angka.map((d, i) => (
              <div key={i} className="array__row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nama Ukuran / Parameter' : ''}
                    value={d.label}
                    onChange={(v) => updAngka(i, { label: v })}
                    placeholder="Contoh: Kecepatan WiFi / RPM Mesin / Total Berkas"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nilai / Angka Hasil' : ''}
                    value={d.nilai}
                    onChange={(v) => updAngka(i, { nilai: v })}
                    placeholder="Contoh: 50 Mbps / 750 RPM / 45 Berkas"
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
            ))}
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
