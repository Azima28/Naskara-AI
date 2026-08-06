import { useState, useRef, useCallback } from 'react'
import type { PklContext } from '@/types/pkl'
import { uploadAsset } from '@/api/client'

export default function AssetsStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  const assets = ctx.assets

  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')

    const newAssets = [...assets]
    for (const file of Array.from(files)) {
      try {
        // Semua upload di step ini adalah foto lampiran. Logo perusahaan
        // diunggah di step Profil Perusahaan, bukan di sini.
        const result = await uploadAsset(file, 'foto')
        newAssets.push({
          id: result.id,
          filename: result.filename,
          original_name: result.original_name,
          type: 'foto',
          caption: '',
          used_in_bab: null,
          path: '',
        })
      } catch (err: any) {
        const msg = err?.response?.data?.detail || `Gagal upload ${file.name}`
        setUploadError(msg)
      }
    }
    set({ assets: newAssets })
    setUploading(false)
    // Reset input file — tanpa ini, memilih file yang sama dua kali tidak
    // memicu onChange sehingga terasa "tidak bisa menambah lagi".
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [assets, set])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const removeAsset = (id: string) => {
    set({ assets: assets.filter((a) => a.id !== id) })
  }

  const updateCaption = (id: string, caption: string) => {
    set({ assets: assets.map((a) => (a.id === id ? { ...a, caption } : a)) })
  }

  /** Geser posisi foto — urutan di sini = urutan tercetak di halaman LAMPIRAN. */
  const moveAsset = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= assets.length) return
    const next = [...assets]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    set({ assets: next })
  }

  return (
    <>
      <h2>Lampiran & Gambar</h2>

      <div className="field-group">
        <h3 className="field-group__title">
          Foto Dokumentasi Kegiatan <span className="field__badge field__badge--wajib" style={{ marginLeft: '0.5rem', background: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>WAJIB (MINIMAL 1 FOTO)</span>
        </h3>
        <p className="muted" style={{ marginTop: 0, marginBottom: '1rem' }}>
          Foto yang diupload di sini akan tercetak di halaman <strong>LAMPIRAN</strong> laporan,
          lengkap dengan keterangannya — contoh: foto kantor, foto bersama karyawan,
          foto saat mengerjakan tugas. Jangan lupa isi kolom keterangan tiap foto.
          (Logo perusahaan &amp; bagan struktur diunggah di step <strong>Profil Perusahaan</strong>, bukan di sini.)
        </p>

        {/* Drop Zone */}
        <div
          id="field-lampiran.foto_kegiatan"
          data-field="lampiran.foto_kegiatan"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--green-600)' : 'var(--line-strong)'}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'var(--green-50)' : 'var(--surface)',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <p style={{ margin: 0, color: 'var(--green-700)', fontWeight: 600 }}>Sedang mengupload…</p>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>
                Seret & letakkan foto di sini
              </p>
              <p className="muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                atau klik untuk pilih file (PNG, JPG, WEBP, maks 10MB)
              </p>
            </>
          )}
        </div>

        {uploadError && (
          <p style={{ color: 'var(--red-600)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{uploadError}</p>
        )}

        {/* Asset List */}
        {assets.length === 0 ? (
          <p className="muted">Belum ada gambar yang diupload.</p>
        ) : (
          <>
            <div className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Total foto: {assets.length} — urutan di bawah ini = urutan foto di halaman LAMPIRAN.
              Pakai tombol ↑ ↓ untuk mengatur.
            </div>

            {assets.map((a, idx) => (
              <div key={a.id} className="nested-card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                  {/* Pratinjau gambar */}
                  <img
                    src={`/api/uploads/assets/${a.filename}`}
                    alt={a.caption || a.original_name}
                    style={{
                      width: 110, height: 82, objectFit: 'cover', flexShrink: 0,
                      borderRadius: 6, border: '1px solid var(--line)',
                      background: 'var(--paper-2)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem',
                    }}>
                      <strong style={{
                        fontSize: '0.85rem', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {idx + 1}. {a.original_name || a.filename}
                      </strong>
                      <span style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                        <button
                          type="button" className="btn-sm btn-outline"
                          onClick={() => moveAsset(idx, -1)} disabled={idx === 0}
                          title="Geser ke atas"
                        >↑</button>
                        <button
                          type="button" className="btn-sm btn-outline"
                          onClick={() => moveAsset(idx, 1)} disabled={idx === assets.length - 1}
                          title="Geser ke bawah"
                        >↓</button>
                        <button type="button" className="btn-sm btn-danger" onClick={() => removeAsset(a.id)}>✕</button>
                      </span>
                    </div>
                    <input
                      className="field__input"
                      type="text"
                      placeholder="Keterangan foto — tercetak di bawah foto di halaman LAMPIRAN (cth: Foto bersama karyawan)"
                      value={a.caption}
                      onChange={(e) => updateCaption(a.id, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Catatan Pengingat Berkas Cetak & Lampiran Fisik (Informasional) */}
      <div className="field-group" style={{ background: 'var(--paper-2, #ece8de)', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid var(--line, #ddd6c8)', marginTop: '2rem' }}>
        <h3 className="field-group__title" style={{ margin: '0 0 0.4rem', color: '#187257' }}>
          📌 Catatan Pengingat Berkas Fisik saat Mencetak Laporan
        </h3>
        <p className="muted" style={{ margin: '0 0 0.85rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Berkas-berkas berikut merupakan dokumen fisik bertanda tangan basah / cap asli yang biasanya dijilid di halaman paling belakang saat laporan dicetak:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>📄 Jurnal Kegiatan</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>📄 Absensi PKL</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>📜 Sertifikat PKL</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>📝 Lembar Penilaian</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>✉️ Surat Permohonan</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>✉️ Surat Balasan</span>
          <span className="chip" style={{ background: '#ffffff', cursor: 'default', opacity: 0.9 }}>🖼️ Foto Dokumentasi</span>
        </div>
      </div>
    </>
  )
}
