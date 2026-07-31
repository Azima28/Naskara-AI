import { useState } from 'react'
import type { PklContext } from '@/types/pkl'
import { parseFullStory } from '@/api/client'

export default function CeritaStep({ ctx, set }: { ctx: PklContext; set: (p: Partial<PklContext>) => void }) {
  // Simpan cerita sementara di state lokal atau bisa tambah field di ctx khusus "cerita_mentah"
  const [cerita, setCerita] = useState(ctx.refleksi || '')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const wordCount = cerita.trim().split(/\s+/).filter(x => x.length > 0).length

  /** Hard gate: AI tidak bisa mengekstrak apa pun di bawah ini. */
  const MIN_WORDS = 100
  /** Target ideal: hasil ekstraksi jauh lebih lengkap di atas ini. */
  const IDEAL_WORDS = 300

  const belowMinimum = wordCount < MIN_WORDS

  const handleParse = async () => {
    if (belowMinimum) {
      setError(`Cerita terlalu pendek. Minimal ${MIN_WORDS} kata agar AI bisa bekerja.`)
      return
    }

    setParsing(true)
    setError('')
    setSuccess(false)

    try {
      const res = await parseFullStory(cerita, ctx.siswa.jurusan_key || 'lainnya')
      
      // Update ctx dengan hasil AI
      set({
        kegiatan: res.kegiatan || [],
        peralatan: res.peralatan || [],
        kendala: res.kendala || [],
        pelajaran: res.pelajaran || [],
        refleksi: cerita, // Simpan cerita aslinya di refleksi untuk referensi
        config: {
          ...ctx.config,
          bab_modules: (res.recommended_bab as PklContext['config']['bab_modules']) || ctx.config.bab_modules
        }
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Gagal memproses cerita. Coba lagi nanti.')
    } finally {
      setParsing(false)
    }
  }

  return (
    <>
      <h2>Tulis Cerita Bebas Pengalaman PKL</h2>
      <p className="muted">
        Tidak perlu pusing memikirkan format! Ceritakan saja secara bebas apa saja yang kamu kerjakan,
        alat apa yang kamu pakai, masalah apa yang terjadi, dan pelajaran yang didapat.
      </p>

      {/* Info Penjelas Alur Cerita -> Kegiatan */}
      <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.5 }}>
        <strong>💡 Bagaimana cara kerjanya?</strong>
        <br />
        Cerita yang kamu tulis di kolom di bawah ini adalah <strong>bahan mentah</strong>. Setelah kamu menekan tombol <strong>"Susun Jadi Bagian Laporan"</strong>, AI akan otomatis menganalisis dan memecah ceritamu menjadi formulir terstruktur (<strong>Kegiatan, Peralatan Kantor, Kendala &amp; Solusi</strong>) di langkah berikutnya (<strong>Kegiatan, Peralatan &amp; Kendala</strong>).
      </div>

      <div className="nested-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem' }}>
          Tulis bebas di sini
        </h3>
        <textarea
          className="field__input field__textarea"
          rows={12}
          value={cerita}
          onChange={(e) => setCerita(e.target.value)}
          placeholder="Contoh: Selama PKL di PT Bank Lampung, kegiatan sehari-hari saya banyak berkisar di bagian Operation. Setiap pagi saya memulai dengan merapikan dokumen nasabah yang akan disetorkan... Alat yang sering saya gunakan adalah mesin fotokopi, scanner, dan komputer... Sesekali saya mengalami masalah ketika sistem sedang offline, solusinya saya mencatat secara manual terlebih dahulu..."
          style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.97rem', lineHeight: 1.6 }}
        />

        {/* Tiga keadaan yang berbeda — jangan disatukan jadi satu angka,
            karena batas wajib (100) tidak sama dengan target ideal (300). */}
        <div style={{ marginBottom: '1rem' }}>
          {belowMinimum ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--red-600)', fontWeight: 600 }}>
              {wordCount} kata — masih perlu {MIN_WORDS - wordCount} kata lagi untuk bisa diproses
            </span>
          ) : wordCount < IDEAL_WORDS ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 600 }}>
              {wordCount} kata — sudah cukup untuk diproses
              <span style={{ fontWeight: 400, opacity: 0.85 }}>
                {' '}(sekitar {IDEAL_WORDS} kata hasilnya lebih lengkap)
              </span>
            </span>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 600 }}>
              {wordCount} kata — panjangnya sudah ideal
            </span>
          )}
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'var(--red-100)', color: 'var(--red-600)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '0.75rem', background: 'var(--green-100)', color: 'var(--green-700)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Berhasil diproses. Lanjut ke langkah berikutnya untuk me-review hasilnya.
          </div>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={handleParse}
          disabled={parsing || belowMinimum}
          style={{ width: '100%', padding: '0.75rem' }}
        >
          {parsing
            ? 'AI sedang menganalisis ceritamu…'
            : belowMinimum
              ? `Tulis minimal ${MIN_WORDS} kata dulu`
              : 'Susun Jadi Bagian Laporan'}
        </button>
      </div>
    </>
  )
}
