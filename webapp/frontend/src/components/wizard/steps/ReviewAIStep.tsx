import type { PklContext, Kegiatan, Kendala, Peralatan } from '@/types/pkl'
import { emptyKegiatan, emptyKendala, emptyPeralatan, emptyTugas } from '@/types/pkl'
import {
  FieldGroup,
  ImageUploadField,
  StringArrayField,
  TextareaField,
  TextField,
} from '@/components/fields/FormFields'

export default function ReviewAIStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const { kegiatan, kendala, pelajaran, peralatan, config } = ctx

  const upd = (patch: Partial<PklContext>) => set(patch)

  // -- Helpers for Kegiatan --
  const updKegiatan = (i: number, patch: Partial<Kegiatan>) => {
    const next = [...kegiatan]
    next[i] = { ...next[i], ...patch }
    upd({ kegiatan: next })
  }
  const addKegiatan = () => upd({ kegiatan: [...kegiatan, emptyKegiatan()] })
  const removeKegiatan = (i: number) => upd({ kegiatan: kegiatan.filter((_, idx) => idx !== i) })

  // -- Helpers for Kendala --
  const updKendala = (i: number, patch: Partial<Kendala>) => {
    const next = [...kendala]
    next[i] = { ...next[i], ...patch }
    upd({ kendala: next })
  }
  const addKendala = () => upd({ kendala: [...kendala, emptyKendala()] })
  const removeKendala = (i: number) => upd({ kendala: kendala.filter((_, idx) => idx !== i) })

  // -- Helpers for Peralatan --
  const updPeralatan = (i: number, patch: Partial<Peralatan>) => {
    const next = [...(peralatan || [])]
    next[i] = { ...next[i], ...patch }
    upd({ peralatan: next })
  }
  const addPeralatan = () => upd({ peralatan: [...(peralatan || []), emptyPeralatan()] })
  const removePeralatan = (i: number) => upd({ peralatan: (peralatan || []).filter((_, idx) => idx !== i) })

  return (
    <>
      <h2>Kegiatan, Peralatan & Kendala</h2>
      <p className="muted">
        Isi bagian ini jadi BAB II, IV, dan V laporanmu: bidang &amp; tugas kegiatan,
        peralatan kantor yang dipakai (dengan fotonya), serta hambatan &amp; solusi.
        Kalau kamu memakai AI di langkah sebelumnya, hasil ekstraksinya sudah
        terisi di sini — tinggal dicek dan dilengkapi.
      </p>

      {/* Recommended BAB Info */}
      {config?.bab_modules && config.bab_modules.length > 0 && (
        <div style={{ padding: '1rem', background: 'var(--green-50)', borderLeft: '4px solid var(--green-600)', marginBottom: '1.5rem', borderRadius: '4px' }}>
          <strong>📑 Rekomendasi Struktur BAB dari AI:</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {config.bab_modules.join(' ➔ ')}
          </p>
        </div>
      )}

      {/* Kegiatan / Pelaksanaan */}
      <FieldGroup title="Data Pengamatan / Kegiatan (BAB IV)" full>
        {kegiatan.length === 0 && <p className="muted">Belum ada kegiatan yang terekstrak.</p>}
        {kegiatan.map((k, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card__head">
              <strong>Bidang {i + 1}</strong>
              <button type="button" className="btn-sm btn-danger" onClick={() => removeKegiatan(i)}>✕</button>
            </div>
            <TextField label="Nama Bidang/Bagian" value={k.bidang} onChange={(v) => updKegiatan(i, { bidang: v })} placeholder="Divisi Umum" />
            <TextareaField label="Deskripsi Umum" value={k.deskripsi_umum} onChange={(v) => updKegiatan(i, { deskripsi_umum: v })} placeholder="Di divisi ini, saya bertanggung jawab untuk..." />
            
            <div style={{ marginTop: '1rem' }}>
              <strong>Tugas-tugas:</strong>
              {k.tugas.map((t, j) => (
                <div key={j} className="array__row" style={{ marginTop: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <input
                      type="text"
                      className="field__input"
                      placeholder="Nama Tugas (misal: Menginput Data)"
                      value={t.nama}
                      onChange={(e) => {
                        const nextTugas = [...k.tugas]
                        nextTugas[j] = { ...t, nama: e.target.value }
                        updKegiatan(i, { tugas: nextTugas })
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: 0, width: '100%' }}>
                    <input
                      type="text"
                      className="field__input"
                      placeholder="Detail (misal: Menggunakan MS Excel)"
                      value={t.detail}
                      onChange={(e) => {
                        const nextTugas = [...k.tugas]
                        nextTugas[j] = { ...t, detail: e.target.value }
                        updKegiatan(i, { tugas: nextTugas })
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-sm btn-danger array__remove"
                    onClick={() => {
                      const nextTugas = k.tugas.filter((_, idx) => idx !== j)
                      updKegiatan(i, { tugas: nextTugas })
                    }}
                    title="Hapus tugas ini"
                  >
                    ✕ Hapus
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-sm btn-outline"
                style={{ marginTop: '0.5rem' }}
                onClick={() => updKegiatan(i, { tugas: [...k.tugas, emptyTugas()] })}
              >
                + Tambah Tugas
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addKegiatan}>+ Tambah Bidang Baru</button>
      </FieldGroup>

      {/* Peralatan & Perlengkapan Kantor (BAB IV) */}
      <FieldGroup title="Peralatan & Perlengkapan Kantor (BAB IV)" full>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          Daftar peralatan/perlengkapan yang digunakan selama PKL. Akan muncul di sub-bab khusus di BAB IV sesuai format Niken.
        </p>
        {(peralatan || []).length === 0 && <p className="muted">Belum ada peralatan. Tambahkan peralatan yang digunakan selama PKL.</p>}
        {(peralatan || []).map((p, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card__head">
              <strong>Peralatan {i + 1}</strong>
              <button type="button" className="btn-sm btn-danger" onClick={() => removePeralatan(i)}>✕</button>
            </div>
            <ImageUploadField
              label="Gambar Peralatan (Wajib)"
              value={p.gambar}
              onChange={(v) => updPeralatan(i, { gambar: v })}
              importance="wajib"
              hint="Format JPG/PNG. Akan ditampilkan di laporan dengan caption nama peralatan."
            />
            <TextField
              label="Nama Peralatan/Perlengkapan"
              value={p.nama}
              onChange={(v) => updPeralatan(i, { nama: v })}
              placeholder="Komputer, Mesin Fotokopi, dll."
            />
            <TextareaField
              label="Deskripsi Fungsi/Kegunaan"
              value={p.deskripsi}
              onChange={(v) => updPeralatan(i, { deskripsi: v })}
              placeholder="Digunakan untuk menginput data customer ke sistem..."
            />
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addPeralatan}>+ Tambah Peralatan</button>
      </FieldGroup>

      {/* Hambatan & Solusi */}
      <FieldGroup title="Hambatan & Solusi (BAB V)" full>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          Daftar masalah yang kamu hadapi dan bagaimana kamu menyelesaikannya.
        </p>
        {kendala.length === 0 && <p className="muted">Tidak ada kendala yang terekstrak.</p>}
        {kendala.map((k, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card__head">
              <strong>Kendala {i + 1}</strong>
              <button type="button" className="btn-sm btn-danger" onClick={() => removeKendala(i)}>✕</button>
            </div>
            <TextField label="Masalah yang dihadapi" value={k.masalah} onChange={(v) => updKendala(i, { masalah: v })} placeholder="Koneksi internet lambat..." />
            <TextareaField label="Solusi" value={k.solusi} onChange={(v) => updKendala(i, { solusi: v })} placeholder="Menggunakan koneksi cadangan..." />
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline" onClick={addKendala}>+ Tambah Kendala</button>
      </FieldGroup>

      {/* Refleksi Pembahasan BAB V */}
      <FieldGroup title="Pembahasan & Refleksi (BAB V)" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Pelajaran yang kamu dapatkan. Jika dikosongkan, AI akan otomatis mengembangkan narasi refleksi dari ceritamu sebelumnya.
        </p>
        <StringArrayField
          label="Pelajaran Utama"
          items={pelajaran}
          onChange={(items) => upd({ pelajaran: items })}
          placeholder="Meningkatkan kedisiplinan..."
        />
        <div style={{ marginTop: '1rem' }}>
          <TextareaField
            label="Cerita Refleksi (Opsional - AI akan menyempurnakan)"
            value={ctx.refleksi_bab5 || ''}
            onChange={(v) => upd({ refleksi_bab5: v })}
            importance="opsional"
            placeholder="Menurut saya, lingkungan kerja sangat membantu..."
            hint="Tulis bebas. AI akan merangkumnya menjadi paragraf profesional untuk sub-bab 'Hal-hal yang perlu diperhatikan'."
          />
        </div>
      </FieldGroup>

      {/* Kesimpulan dan Saran BAB VI */}
      <FieldGroup title="Kesimpulan dan Saran (BAB VI)" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.85rem' }}>
          Tulis kesimpulan & saranmu secara singkat. AI akan mengembangkannya dengan gaya bahasa yang profesional. Jika dikosongkan, AI akan meng-generate otomatis dari keseluruhan data.
        </p>
        <TextareaField
          label="Ide Kesimpulan (Opsional)"
          value={ctx.kesimpulan_user || ''}
          onChange={(v) => upd({ kesimpulan_user: v })}
          importance="opsional"
          placeholder="Kesimpulannya, saya banyak belajar tentang kerja tim..."
        />
        <TextareaField
          label="Ide Saran (Opsional)"
          value={ctx.saran_user || ''}
          onChange={(v) => upd({ saran_user: v })}
          importance="opsional"
          placeholder="Untuk sekolah, perbanyak praktik. Untuk perusahaan, perbaiki AC..."
        />
      </FieldGroup>
    </>
  )
}
