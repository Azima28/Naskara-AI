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
      <h2>Studi Kasus / Analisis Teknis</h2>
      <p className="muted">
        Opsional. Ceritakan satu pekerjaan yang paling menarik/menantang selama PKL. Ini akan jadi bab pembahasan (analisis) di laporan kamu.
      </p>

      {/* Dynamic Major-Specific Example Card */}
      <JurusanExampleCard
        jurusanKey={ctx.siswa?.jurusan_key || ctx.siswa?.jurusan}
        onApplyExample={handleApplyExample}
      />

      <FieldGroup title="Studi Kasus">
        <TextField label="Judul Studi Kasus" value={sk.judul} onChange={(v) => upd({ judul: v })} importance="opsional" hint="Contoh: Proses Instalasi Jaringan, atau Cara Perhitungan Diskon" />
        <TextareaField label="Latar Belakang / Masalah" value={sk.latar_belakang} onChange={(v) => upd({ latar_belakang: v })} importance="opsional" hint="Kenapa pekerjaan ini penting atau menarik?" />
        <TextareaField label="Proses / Cara Kerja" value={sk.proses_atau_formula} onChange={(v) => upd({ proses_atau_formula: v })} importance="opsional" hint="Langkah-langkah pengerjaannya secara urut" />
        <TextareaField label="Hasil / Kesimpulan" value={sk.hasil} onChange={(v) => upd({ hasil: v })} importance="opsional" hint="Bagaimana hasil akhirnya?" />
      </FieldGroup>

      <FieldGroup title="Data Angka" full>
        <div className="field field--full">
          <span className="field__label">
            Data Angka / Perbandingan <span className="field__badge field__badge--opsional">Opsional</span>
          </span>
          <span className="field__hint" style={{ marginBottom: '0.6rem' }}>
            Tambahkan angka perbandingan atau statistik hasil pekerjaan (contoh: "Waktu Query Sebelum Opti" → "3.8 Detik").
          </span>
          <div className="array">
            {sk.data_angka.map((d, i) => (
              <div key={i} className="array__row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nama / Label Data' : ''}
                    value={d.label}
                    onChange={(v) => updAngka(i, { label: v })}
                    placeholder="Contoh: Waktu Query Sebelum Opti"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={i === 0 ? 'Nilai / Hasil' : ''}
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
