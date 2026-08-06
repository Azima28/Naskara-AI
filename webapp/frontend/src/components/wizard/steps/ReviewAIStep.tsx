import { useEffect } from 'react'
import type { PklContext, Kegiatan, Kendala, Peralatan } from '@/types/pkl'
import { emptyKegiatan, emptyKendala, emptyPeralatan, emptyTugas } from '@/types/pkl'
import { getJurusanExample } from '@/utils/jurusanExamples'
import {
  FieldGroup,
  ImageUploadField,
  StringArrayField,
  TextareaField,
  TextField,
} from '@/components/fields/FormFields'

export default function ReviewAIStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const { kegiatan, kendala, pelajaran, peralatan, config } = ctx
  const jurusanExample = getJurusanExample(ctx.siswa?.jurusan_key || ctx.siswa?.jurusan)

  const upd = (patch: Partial<PklContext>) => set(patch)

  // Auto-initialize 1 default item if empty
  useEffect(() => {
    let hasChanges = false
    const patch: Partial<PklContext> = {}

    if (!kegiatan || kegiatan.length === 0) {
      patch.kegiatan = [emptyKegiatan()]
      hasChanges = true
    } else {
      // Pastikan setiap kegiatan yang ada memiliki minimal 1 tugas
      const fixKegiatan = kegiatan.map(k => {
        if (!k.tugas || k.tugas.length === 0) {
          hasChanges = true
          return { ...k, tugas: [emptyTugas()] }
        }
        return k
      })
      if (hasChanges) patch.kegiatan = fixKegiatan
    }

    if (!peralatan || peralatan.length === 0) {
      patch.peralatan = [emptyPeralatan()]
      hasChanges = true
    }
    if (!kendala || kendala.length === 0) {
      patch.kendala = [emptyKendala()]
      hasChanges = true
    }
    if (!pelajaran || pelajaran.length === 0) {
      patch.pelajaran = ['']
      hasChanges = true
    }

    if (hasChanges) {
      upd(patch)
    }
  }, [kegiatan, peralatan, kendala, pelajaran])

  // -- Helpers for Kegiatan --
  const updKegiatan = (i: number, patch: Partial<Kegiatan>) => {
    const next = [...kegiatan]
    const currentTugas = patch.tugas !== undefined ? patch.tugas : (next[i]?.tugas || [])
    next[i] = { ...next[i], ...patch, tugas: currentTugas.length === 0 ? [emptyTugas()] : currentTugas }
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
      <p className="muted" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
        Di sini kamu akan menceritakan <strong>apa yang kamu kerjakan selama PKL, alat yang kamu gunakan, masalah yang kamu temui, dan apa yang kamu pelajari.</strong>
      </p>

      {/* Info Penjelas Bahasa Formal & AI */}
      <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.5 }}>
        <strong>💡 Tidak perlu menggunakan bahasa formal.</strong>
        <br />
        Tulis berdasarkan pengalamanmu sehari-hari — AI akan membantu merapikannya menjadi bahasa laporan.
      </div>

      {/* Recommended BAB Info (if available) */}
      {config?.bab_modules && config.bab_modules.length > 0 && (
        <div style={{ padding: '0.85rem 1rem', background: 'var(--green-50)', borderLeft: '4px solid var(--green-600)', marginBottom: '1.5rem', borderRadius: '6px' }}>
          <strong style={{ color: 'var(--green-800)', fontSize: '0.85rem' }}>Rekomendasi Struktur BAB dari AI:</strong>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: 'var(--green-700)' }}>
            {config.bab_modules.join(' ➔ ')}
          </p>
        </div>
      )}

      {/* ── 1. Kegiatan Selama PKL ────────────────────────────────────────── */}
      <FieldGroup title="Kegiatan Selama PKL" full>
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.88rem' }}>
          Ceritakan bagian/divisi tempat kamu bekerja dan tugas yang kamu lakukan.
        </p>

        {/* Contoh Kegiatan & 1-Click Button Berdasarkan Jurusan */}
        {jurusanExample.contohKegiatan && jurusanExample.contohKegiatan.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            <div style={{ marginBottom: '0.4rem' }}>
              <strong style={{ color: '#0f172a' }}>
                💡 Contoh Kegiatan / Divisi ({jurusanExample.label}):
              </strong>
            </div>
            {jurusanExample.contohKegiatan.map((ck, idx) => (
              <div key={idx} style={{ marginTop: '0.3rem' }}>
                <strong>• {ck.bidang}:</strong> {ck.deskripsi_umum}
              </div>
            ))}
          </div>
        )}

        {kegiatan.length === 0 && (
          <p className="muted" style={{ fontStyle: 'italic', fontSize: '0.88rem' }}>
            Belum ada kegiatan tersimpan. Klik "+ Gunakan Contoh Kegiatan Jurusan Ini" di atas atau "+ Tambah Kegiatan / Divisi" di bawah.
          </p>
        )}
        {kegiatan.map((k, i) => {
          const sampleKegiatan = jurusanExample.contohKegiatan?.[i % (jurusanExample.contohKegiatan.length || 1)] || jurusanExample.contohKegiatan?.[0]
          return (
            <div key={i} className="nested-card" style={{ marginBottom: '1.25rem' }}>
              <div className="nested-card__head">
                <strong>Kegiatan / Divisi {i + 1}</strong>
                <button type="button" className="btn-sm btn-danger" onClick={() => removeKegiatan(i)}>✕</button>
              </div>
              <TextField
                label="Di divisi atau bagian mana kamu ditempatkan selama PKL?"
                value={k.bidang}
                onChange={(v) => updKegiatan(i, { bidang: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${sampleKegiatan?.bidang || 'Divisi Operasional'}"`}
                importance="wajib"
              />
              <TextareaField
                label="Ceritakan secara singkat apa yang biasanya kamu kerjakan di divisi ini."
                value={k.deskripsi_umum}
                onChange={(v) => updKegiatan(i, { deskripsi_umum: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${sampleKegiatan?.deskripsi_umum || 'Melaksanakan tugas operasional harian'}"`}
                importance="wajib"
              />

              <div style={{ marginTop: '1.25rem' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Tugas yang kamu lakukan:</strong>
                {k.tugas.map((t, j) => {
                  const sampleTugas = sampleKegiatan?.tugas?.[j % (sampleKegiatan.tugas.length || 1)] || sampleKegiatan?.tugas?.[0]
                  return (
                    <div key={j} className="array__row" style={{ marginTop: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                        <input
                          type="text"
                          className="field__input"
                          placeholder={`Nama Tugas (cth: ${sampleTugas?.nama || 'Nama Tugas'})`}
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
                          placeholder={`Detail (cth: ${sampleTugas?.detail || 'Rincian tugas'})`}
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
                  )
                })}
                <button
                  type="button"
                  className="btn-sm btn-outline"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => updKegiatan(i, { tugas: [...k.tugas, emptyTugas()] })}
                >
                  + Tambah Tugas Lain di Divisi Ini
                </button>
              </div>
            </div>
          )
        })}
        <button type="button" className="btn-sm btn-outline" onClick={addKegiatan}>+ Tambah Kegiatan / Divisi</button>
      </FieldGroup>

      {/* ── 2. Peralatan yang Kamu Gunakan ──────────────────────────────────── */}
      <FieldGroup title="Peralatan yang Kamu Gunakan" full>
        <p className="muted" style={{ margin: '-0.5rem 0 0.5rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Tuliskan alat yang kamu gunakan selama PKL, misalnya <strong>komputer, laptop, printer, kamera, mesin, atau peralatan khusus lainnya.</strong>
        </p>
        <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.83rem', color: '#6b7280', fontStyle: 'italic' }}>
          * Tidak perlu menambahkan alat yang hanya kamu lihat tetapi tidak kamu gunakan.
        </p>

        {/* Contoh Peralatan Berdasarkan Jurusan */}
        {jurusanExample.contohPeralatan && jurusanExample.contohPeralatan.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            <div style={{ marginBottom: '0.35rem' }}>
              <strong style={{ color: '#0f172a' }}>
                💡 Contoh Peralatan ({jurusanExample.label}):
              </strong>
            </div>
            {jurusanExample.contohPeralatan.map((cp, idx) => (
              <div key={idx} style={{ marginTop: '0.25rem' }}>
                <strong>• {cp.nama}:</strong> {cp.deskripsi}
              </div>
            ))}
          </div>
        )}

        {(peralatan || []).length === 0 && (
          <p className="muted" style={{ fontStyle: 'italic', fontSize: '0.88rem' }}>
            Belum ada peralatan tersimpan. Klik "+ Tambah Peralatan" di bawah.
          </p>
        )}
        {(peralatan || []).map((p, i) => {
          const samplePeralatan = jurusanExample.contohPeralatan?.[i % (jurusanExample.contohPeralatan?.length || 1)] || jurusanExample.contohPeralatan?.[0]
          return (
            <div key={i} className="nested-card" style={{ marginBottom: '1.25rem' }}>
              <div className="nested-card__head">
                <strong>Peralatan {i + 1}</strong>
                <button type="button" className="btn-sm btn-danger" onClick={() => removePeralatan(i)}>✕</button>
              </div>
              <TextField
                label="Nama peralatan"
                value={p.nama}
                onChange={(v) => updPeralatan(i, { nama: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${samplePeralatan?.nama || 'Nama Peralatan'}"`}
                importance="wajib"
              />
              <TextareaField
                label="Digunakan untuk"
                value={p.deskripsi}
                onChange={(v) => updPeralatan(i, { deskripsi: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${samplePeralatan?.deskripsi || 'Penggunaan peralatan'}"`}
                importance="wajib"
              />
              <ImageUploadField
                label="Foto peralatan"
                value={p.gambar}
                onChange={(v) => updPeralatan(i, { gambar: v })}
                importance="wajib"
                hint="Unggah foto alat yang kamu gunakan (JPG/PNG)."
              />
            </div>
          )
        })}
        <button type="button" className="btn-sm btn-outline" onClick={addPeralatan}>+ Tambah Peralatan</button>
      </FieldGroup>

      {/* ── 3. Kendala & Cara Mengatasinya ─────────────────────────────────── */}
      <FieldGroup title="Kendala & Cara Mengatasinya" full>
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.88rem' }}>
          Pernah mengalami masalah atau kesulitan selama PKL? Ceritakan masalahnya dan bagaimana kamu mengatasinya.
        </p>

        {/* Contoh Kendala Berdasarkan Jurusan */}
        {jurusanExample.contohKendala && jurusanExample.contohKendala.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            <div style={{ marginBottom: '0.35rem' }}>
              <strong style={{ color: '#0f172a' }}>
                💡 Contoh Kendala &amp; Solusi ({jurusanExample.label}):
              </strong>
            </div>
            {jurusanExample.contohKendala.map((ck, idx) => (
              <div key={idx} style={{ marginTop: '0.25rem' }}>
                • <strong>Kendala:</strong> {ck.masalah} ➔ <strong>Solusi:</strong> {ck.solusi}
              </div>
            ))}
          </div>
        )}

        {kendala.length === 0 && (
          <p className="muted" style={{ fontStyle: 'italic', fontSize: '0.88rem' }}>
            Belum ada kendala tersimpan. Klik "+ Tambah Kendala Lain" di bawah.
          </p>
        )}
        {kendala.map((k, i) => {
          const sampleKendala = jurusanExample.contohKendala?.[i % (jurusanExample.contohKendala?.length || 1)] || jurusanExample.contohKendala?.[0]
          return (
            <div key={i} className="nested-card" style={{ marginBottom: '1.25rem' }}>
              <div className="nested-card__head">
                <strong>Kendala {i + 1}</strong>
                <button type="button" className="btn-sm btn-danger" onClick={() => removeKendala(i)}>✕</button>
              </div>
              <TextField
                label="Apa kendalanya?"
                value={k.masalah}
                onChange={(v) => updKendala(i, { masalah: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${sampleKendala?.masalah || 'Masalah kendala'}"`}
                importance="wajib"
              />
              <TextareaField
                label="Bagaimana kamu mengatasinya?"
                value={k.solusi}
                onChange={(v) => updKendala(i, { solusi: v })}
                placeholder={`Contoh (${jurusanExample.label}): "${sampleKendala?.solusi || 'Solusi mengatasi'}"`}
                importance="wajib"
              />
            </div>
          )
        })}
        <button type="button" className="btn-sm btn-outline" onClick={addKendala}>+ Tambah Kendala Lain</button>
      </FieldGroup>

      {/* ── 4. Pengalaman & Hal yang Kamu Pelajari ─────────────────────────── */}
      <FieldGroup title="Pengalaman & Hal yang Kamu Pelajari" full>
        <p className="muted" style={{ margin: '-0.5rem 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Tuliskan poin-poin pelajaran serta cerita pengalaman harianmu selama PKL.
        </p>

        {/* 1. Poin-poin Pelajaran Utama */}
        <div style={{ marginBottom: '1.25rem' }}>
          {/* Contoh Pelajaran Khusus Jurusan */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.85rem', fontSize: '0.85rem', color: '#334155' }}>
            <div style={{ marginBottom: '0.35rem' }}>
              <strong style={{ color: '#0f172a' }}>
                💡 Contoh Poin Pelajaran ({jurusanExample.label}):
              </strong>
            </div>
            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', lineHeight: 1.5 }}>
              {(jurusanExample.contohPelajaran || []).map((cp, idx) => (
                <li key={idx}>{cp}</li>
              ))}
            </ul>
          </div>

          <StringArrayField
            label="Apa pelajaran utama yang kamu dapatkan?"
            items={pelajaran}
            onChange={(items) => upd({ pelajaran: items })}
            importance="wajib"
            placeholder={`Contoh (${jurusanExample.label}): "${jurusanExample.contohPelajaran?.[0] || 'Meningkatkan kedisiplinan dan keterampilan kerja.'}"`}
            addLabel="+ Tambah Poin Pelajaran"
          />
        </div>

        {/* 2. Box Panduan & Cerita Pengalaman */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--line, #cbd5e1)' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.92rem', color: 'var(--ink)' }}>
            Cerita Pengalaman Selama PKL
          </strong>

          {/* Box Panduan Inspirasi Cerita */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#334155' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>Panduan Menulis Cerita (Bahasa Sehari-hari):</strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.6 }}>
              <li>Apa yang paling kamu pelajari di tempat PKL?</li>
              <li>Apa yang awalnya sulit, lalu sekarang sudah bisa kamu lakukan?</li>
              <li>Pengalaman atau kejadian apa yang paling berkesan bagimu?</li>
            </ul>
            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '0.4rem' }}>
              <strong>Contoh ({jurusanExample.label}):</strong> "Awalnya saya merasa canggung dan kesulitan saat pertama kali bertugas. Namun setelah beberapa kali mencoba dan bertanya kepada pembimbing di bidang {jurusanExample.label}, saya akhirnya bisa melakukannya sendiri dengan lancar."
            </div>
          </div>

          <TextareaField
            label="Ceritakan Pengalamanmu di Sini"
            value={ctx.refleksi_bab5 || ''}
            onChange={(v) => upd({ refleksi_bab5: v })}
            importance="wajib"
            placeholder={`Contoh (${jurusanExample.label}): "Selama PKL di bidang ${jurusanExample.label}, saya belajar banyak hal baru mulai dari kedisiplinan kerja, cara berkomunikasi dengan tim, hingga menangani tugas harian..."`}
            hint="🤖 AI akan membantu merapikan ceritamu menjadi paragraf laporan akademik."
            rows={5}
          />
        </div>
      </FieldGroup>

      {/* ── 5. Kesimpulan & Saran ────────────────────────────────────────── */}
      <FieldGroup title="Kesimpulan & Saran" full>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#166534' }}>
          <strong>💡 Tidak perlu menulis panjang.</strong> 1–3 kalimat sudah cukup. AI akan membantu mengembangkannya menjadi bagian laporan resmi.
        </div>

        <TextareaField
          label="Apa yang kamu dapatkan setelah mengikuti PKL? (Kesimpulan)"
          value={ctx.kesimpulan_user || ''}
          onChange={(v) => upd({ kesimpulan_user: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "Selama PKL saya belajar bekerja sama, lebih disiplin, dan memahami bagaimana pekerjaan di bidang ${jurusanExample.label} dilakukan di dunia kerja nyata."`}
          rows={3}
        />
        <TextareaField
          label="Apa yang ingin kamu sarankan untuk sekolah atau perusahaan? (Saran)"
          value={ctx.saran_user || ''}
          onChange={(v) => upd({ saran_user: v })}
          importance="wajib"
          placeholder={`Contoh (${jurusanExample.label}): "Sekolah dapat menambah jam kegiatan praktik ${jurusanExample.label} agar siswa lebih siap menghadapi dunia kerja."`}
          rows={3}
        />
      </FieldGroup>
    </>
  )
}
