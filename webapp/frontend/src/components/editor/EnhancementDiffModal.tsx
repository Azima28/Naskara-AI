import type { PklContext } from '@/types/pkl'

interface DiffItem {
  label: string
  oldVal: string
  newVal: string
}

interface EnhancementDiffModalProps {
  oldCtx: PklContext
  newCtx: PklContext
  onApply: (finalCtx: PklContext) => void
  onCancel: () => void
}

export default function EnhancementDiffModal({
  oldCtx,
  newCtx,
  onApply,
  onCancel,
}: EnhancementDiffModalProps) {
  const diffs: DiffItem[] = []

  // Check Profil Perusahaan
  if (oldCtx.profil_perusahaan?.sejarah !== newCtx.profil_perusahaan?.sejarah) {
    diffs.push({
      label: 'Sejarah Perusahaan (1.3)',
      oldVal: oldCtx.profil_perusahaan?.sejarah || '(Kosong)',
      newVal: newCtx.profil_perusahaan?.sejarah || '(Kosong)',
    })
  }
  if (oldCtx.profil_perusahaan?.visi !== newCtx.profil_perusahaan?.visi) {
    diffs.push({
      label: 'Visi Perusahaan',
      oldVal: oldCtx.profil_perusahaan?.visi || '(Kosong)',
      newVal: newCtx.profil_perusahaan?.visi || '(Kosong)',
    })
  }
  const oldMisiStr = (oldCtx.profil_perusahaan?.misi || []).join('\n')
  const newMisiStr = (newCtx.profil_perusahaan?.misi || []).join('\n')
  if (oldMisiStr !== newMisiStr) {
    diffs.push({
      label: 'Misi Perusahaan',
      oldVal: oldMisiStr || '(Kosong)',
      newVal: newMisiStr || '(Kosong)',
    })
  }

  // Check Narasi Struktur Organisasi
  if (oldCtx.profil_perusahaan?.narasi_struktur !== newCtx.profil_perusahaan?.narasi_struktur) {
    diffs.push({
      label: 'Narasi Struktur Organisasi (1.5)',
      oldVal: oldCtx.profil_perusahaan?.narasi_struktur || '(Kosong)',
      newVal: newCtx.profil_perusahaan?.narasi_struktur || '(Kosong)',
    })
  }

  // Check Refleksi & Kesimpulan
  if (oldCtx.refleksi !== newCtx.refleksi) {
    diffs.push({
      label: 'Refleksi / Cerita Pengalaman',
      oldVal: oldCtx.refleksi || '(Kosong)',
      newVal: newCtx.refleksi || '(Kosong)',
    })
  }
  if (oldCtx.kesimpulan_user !== newCtx.kesimpulan_user) {
    diffs.push({
      label: 'Kesimpulan Siswa',
      oldVal: oldCtx.kesimpulan_user || '(Kosong)',
      newVal: newCtx.kesimpulan_user || '(Kosong)',
    })
  }
  if (oldCtx.saran_user !== newCtx.saran_user) {
    diffs.push({
      label: 'Saran Siswa',
      oldVal: oldCtx.saran_user || '(Kosong)',
      newVal: newCtx.saran_user || '(Kosong)',
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(38, 37, 33, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface, #fffdf8)',
          border: '1px solid var(--line-strong, #b9b09c)',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--line, #ddd6c8)',
            background: 'var(--paper-2, #ece8de)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              📝 Hasil Penyempurnaan Teks Akademis (KBBI)
            </h3>
            <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              Tinjau perbandingan teks sebelum dan sesudah dirapikan oleh AI sebelum menerapkannya ke dokumen.
            </p>
          </div>
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={onCancel}
            style={{ fontSize: '1.1rem', padding: '0.2rem 0.6rem' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {diffs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="ok">✓ Teks laporanmu sudah rapi dan sesuai standar akademis.</p>
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Tidak ada perubahan signifikan yang perlu diperbarui oleh AI.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {diffs.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--line, #ddd6c8)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--paper-2, #ece8de)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderBottom: '1px solid var(--line, #ddd6c8)',
                      color: 'var(--ink, #262521)',
                    }}
                  >
                    📌 {d.label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--line, #ddd6c8)' }}>
                    {/* Data Mentah (Before) */}
                    <div style={{ background: '#fffdf5', padding: '0.85rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--amber-700, #92610c)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Data Mentah (Sebelum)
                      </span>
                      <p style={{ margin: 0, fontSize: '0.86rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#4a4539' }}>
                        {d.oldVal}
                      </p>
                    </div>

                    {/* Hasil AI (After) */}
                    <div style={{ background: '#f0fdf4', padding: '0.85rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--green-700, #14614a)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Hasil Rapian AI (Sesudah)
                      </span>
                      <p style={{ margin: 0, fontSize: '0.86rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#144736' }}>
                        {d.newVal}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--line, #ddd6c8)',
            background: 'var(--surface, #fffdf8)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button type="button" className="btn-outline" onClick={onCancel}>
            Batal (Gunakan Teks Asli)
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onApply(newCtx)}
            style={{ fontWeight: 600 }}
          >
            ✓ Terapkan Perubahan Teks Akademis
          </button>
        </div>
      </div>
    </div>
  )
}
