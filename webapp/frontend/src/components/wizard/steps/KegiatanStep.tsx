import { useState } from 'react'
import type { Kegiatan, PklContext, Tugas } from '@/types/pkl'
import { emptyKegiatan, emptyTugas } from '@/types/pkl'
import { FieldGroup, TextareaField, TextField, ImageArrayUploadField } from '@/components/fields/FormFields'
import { parseFullStory } from '@/api/client'

export default function KegiatanStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const kegiatan = ctx.kegiatan
  const [cerita, setCerita] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  const updKegiatan = (i: number, patch: Partial<Kegiatan>) => {
    const next = [...kegiatan]
    next[i] = { ...next[i], ...patch }
    set({ kegiatan: next })
  }
  const addKegiatan = () => set({ kegiatan: [...kegiatan, emptyKegiatan()] })
  const removeKegiatan = (i: number) => set({ kegiatan: kegiatan.filter((_, idx) => idx !== i) })

  const updTugas = (ki: number, ti: number, patch: Partial<Tugas>) => {
    const next = [...kegiatan]
    const tugas = [...next[ki].tugas]
    tugas[ti] = { ...tugas[ti], ...patch }
    next[ki] = { ...next[ki], tugas }
    set({ kegiatan: next })
  }
  const addTugas = (ki: number) => {
    const next = [...kegiatan]
    next[ki] = { ...next[ki], tugas: [...next[ki].tugas, emptyTugas()] }
    set({ kegiatan: next })
  }
  const removeTugas = (ki: number, ti: number) => {
    const next = [...kegiatan]
    next[ki] = { ...next[ki], tugas: next[ki].tugas.filter((_, idx) => idx !== ti) }
    set({ kegiatan: next })
  }

  const handleAIParse = async () => {
    if (!cerita.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const result = await parseFullStory(cerita, ctx.siswa.jurusan_key)
      if (result.kegiatan && Array.isArray(result.kegiatan)) {
        // Merge: map AI output ke format Kegiatan[]
        const parsed: Kegiatan[] = result.kegiatan.map((k: any) => ({
          bidang: k.bidang || '',
          deskripsi_umum: k.deskripsi_umum || '',
          tugas: (k.tugas || []).map((t: any) => ({
            nama: t.nama_tugas || t.nama || '',
            detail: t.detail || '',
            dokumentasi: t.dokumentasi || '',
            assets: [],
          })),
        }))
        set({ kegiatan: [...kegiatan, ...parsed] })
        setCerita('') // Clear cerita after success
      }
    } catch (err: any) {
      setParseError(err?.response?.data?.detail || 'Gagal mengurai cerita. Coba tulis lebih detail.')
    } finally {
      setParsing(false)
    }
  }

  return (
    <>
      <h2>Kegiatan PKL</h2>
      <p className="muted">
        Ini data inti untuk BAB Pelaksanaan. Wajib minimal 1 bidang dengan 1 tugas.
      </p>

      {/* AI Ceritakan Bebas Section */}
      <div className="nested-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>
          Ceritakan saja pengalaman PKL-mu
        </h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Tulis bebas apa saja yang kamu kerjakan selama PKL. Nanti AI akan otomatis menyusunnya menjadi bidang dan tugas yang rapi.
          Kamu bisa mengedit hasilnya setelah AI selesai menyusun.
        </p>
        <textarea
          className="field__input field__textarea"
          rows={5}
          value={cerita}
          placeholder={"Contoh: Selama PKL di PT Bank Lampung, saya ditempatkan di bagian Operation. Saya mengerjakan scan berkas nasabah, memfotokopi dokumen, menginput data ke sistem, dan membantu filing. Selain itu saya juga membantu di bagian Collection untuk mendata angsuran dan menghitung denda keterlambatan..."}
          onChange={(e) => setCerita(e.target.value)}
          style={{ width: '100%', marginBottom: '0.75rem' }}
        />
        {parseError && (
          <p style={{ color: 'var(--red-600)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{parseError}</p>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={handleAIParse}
          disabled={parsing || !cerita.trim()}
        >
          {parsing ? 'AI sedang menyusun…' : 'Susun Otomatis dengan AI'}
        </button>
      </div>

      {/* Divider */}
      <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
        — atau isi manual di bawah —
      </div>

      {kegiatan.length === 0 && (
        <div className="empty-state">
          <p>Belum ada bidang kegiatan. Ceritakan pengalamanmu di atas, atau tambahkan manual.</p>
          <button type="button" onClick={addKegiatan}>+ Tambah Bidang Pertama</button>
        </div>
      )}

      {kegiatan.map((k, ki) => (
        <div key={ki} className="nested-card nested-card--wide">
          <div className="nested-card__head">
            <strong>Bidang {ki + 1}: {k.bidang || '(kosong)'}</strong>
            <button type="button" className="btn-sm btn-danger" onClick={() => removeKegiatan(ki)}>✕ Hapus Bidang</button>
          </div>

          <FieldGroup title={`Bidang ${ki + 1}`}>
            <TextField label="Nama Bidang" value={k.bidang} onChange={(v) => updKegiatan(ki, { bidang: v })} importance="wajib" placeholder="Operation" />
            <TextareaField label="Deskripsi Umum" value={k.deskripsi_umum} onChange={(v) => updKegiatan(ki, { deskripsi_umum: v })} importance="opsional" hint="Gambaran umum pekerjaan di bidang ini" />
          </FieldGroup>

          <div className="field-group">
            <h4 className="field-group__title">Daftar Tugas</h4>
            {k.tugas.map((t, ti) => (
              <div key={ti} className="nested-card nested-card--inner">
                <div className="nested-card__head">
                  <span>Tugas {ti + 1}</span>
                  <button type="button" className="btn-sm btn-danger" onClick={() => removeTugas(ki, ti)}>✕</button>
                </div>
                <TextField label="Nama Tugas" value={t.nama} onChange={(v) => updTugas(ki, ti, { nama: v })} importance="wajib" placeholder="Scan & folder berkas" />
                <TextareaField label="Detail" value={t.detail} onChange={(v) => updTugas(ki, ti, { detail: v })} importance="penting" hint="Jelaskan langkah kerja secara singkat" />
                <ImageArrayUploadField label="Upload Foto Kegiatan (Opsional)" items={t.assets} onChange={(assets) => updTugas(ki, ti, { assets })} hint="Pilih gambar untuk melengkapi dokumentasi tugas ini." />
              </div>
            ))}
            <button type="button" className="btn-sm btn-outline" onClick={() => addTugas(ki)}>+ Tambah Tugas</button>
          </div>
        </div>
      ))}

      {kegiatan.length > 0 && (
        <button type="button" className="btn-sm btn-outline" onClick={addKegiatan}>+ Tambah Bidang Lain</button>
      )}
    </>
  )
}
