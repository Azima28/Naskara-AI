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

  const handleApplyExample = (sample: {
    judul: string
    latar_belakang: string
    proses_atau_formula: string
    hasil: string
    data_angka: DataAngka[]
  }) => {
    upd({
      judul: sample.judul,
      latar_belakang: sample.latar_belakang,
      proses_atau_formula: sample.proses_atau_formula,
      hasil: sample.hasil,
      data_angka: sample.data_angka,
    })
  }

  return (
    <>
      <h2>Topik Utama & Pengalaman Kerja Paling Berkesan (BAB IV & V)</h2>
      <p className="muted">
        Opsional. Ceritakan 1 pekerjaan utama yang paling sering atau berkesan selama kamu PKL. AI akan membantu merapikan tulisan kamu menjadi narasi laporan resmi yang bagus.
      </p>

      {/* Dynamic Major-Specific Example Card */}
      <JurusanExampleCard
        jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
        onApplyExample={handleApplyExample}
      />

      <FieldGroup title="Detail Pekerjaan Utama">
        <TextField
          label="1. Nama Pekerjaan Utama"
          value={sk.judul}
          onChange={(v) => upd({ judul: v })}
          importance="opsional"
          placeholder="Contoh: Service Tune-Up Mesin EFI / Input Rekap Keuangan / Setting WiFi Office"
          hint="Apa nama tugas/pekerjaan yang paling berkesan bagi kamu?"
        />
        <TextareaField
          label="2. Mengapa Pekerjaan Ini Perlu Dikerjakan? (Alasan / Masalah)"
          value={sk.latar_belakang}
          onChange={(v) => upd({ latar_belakang: v })}
          importance="opsional"
          placeholder="Contoh: Karena mesin mobil pelanggan tarikannya berat dan lampu indikator check engine menyala, sehingga perlu diperbaiki."
          hint="Jelaskan alasan singkat mengapa pekerjaan ini penting."
        />
        <TextareaField
          label="3. Langkah-Langkah Kamu Mengerjakannya (Urut)"
          value={sk.proses_atau_formula}
          onChange={(v) => upd({ proses_atau_formula: v })}
          importance="opsional"
          placeholder="1. Memasang OBD-II Scanner untuk cek kerusakan.&#10;2. Membersihkan busi dan injektor.&#10;3. Uji coba tes mesin kembali."
          hint="Tuliskan urutan cara kamu mengerjakannya (bisa pakai angka 1, 2, 3)."
        />
        <TextareaField
          label="4. Bagaimana Hasil Akhirnya?"
          value={sk.hasil}
          onChange={(v) => upd({ hasil: v })}
          importance="opsional"
          placeholder="Contoh: Mesin mobil kembali halus di 750 RPM dan siap diserahkan ke pelanggan."
          hint="Bagaimana kondisi akhir setelah pekerjaan kamu selesai?"
        />
      </FieldGroup>

      <FieldGroup title="Catatan Angka Hasil Pekerjaan (Opsional)" full>
        <div className="field field--full">
          <span className="field__label">
            Angka / Statistik Hasil <span className="field__badge field__badge--opsional">Opsional</span>
          </span>
          <span className="field__hint" style={{ marginBottom: '0.6rem' }}>
            Isikan jika pekerjaan kamu memiliki catatan angka (contoh: "Waktu Idle Sebelum Service" → "550 RPM", "Total Berkas" → "50 Surat").
          </span>
          <div className="array">
            {sk.data_angka.map((d, i) => (
              <div key={i} className="array__row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nama / Catatan Data' : ''}
                    value={d.label}
                    onChange={(v) => updAngka(i, { label: v })}
                    placeholder="Contoh: Waktu Query Sebelum Opti"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nilai / Angka' : ''}
                    value={d.nilai}
                    onChange={(v) => updAngka(i, { nilai: v })}
                    placeholder="Contoh: 3.8 Detik"
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
              + Tambah Data Angka
            </button>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Assets terkait (Opsional)">
        <ImageArrayUploadField label="Upload Gambar Tambahan" items={sk.assets} onChange={(assets) => upd({ assets })} hint="Pilih gambar untuk melengkapi pembahasan (contoh: foto sebelum/sesudah perbaikan)." />
      </FieldGroup>
    </>
  )
}
