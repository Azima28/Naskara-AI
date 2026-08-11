import { useEffect, useState } from 'react'
import { getHealth } from '@/api/client'
import { IconAlert } from './Icons'

export function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let isMounted = true
    getHealth()
      .then((res) => {
        if (isMounted && res.maintenance_mode) {
          setIsMaintenance(true)
        }
      })
      .catch(() => {
        /* ignore error */
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (!isMaintenance || dismissed) return null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ marginTop: '2px', color: '#d97706', flexShrink: 0 }}>
          <IconAlert size={22} color="#d97706" />
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#92400e', marginBottom: '2px' }}>
            ⚠️ Perhatian: Mode Pemeliharaan Sistem Aktif
          </strong>
          <span style={{ fontSize: '0.85rem', color: '#b45309', lineHeight: 1.4, display: 'block' }}>
            Saat ini Naskara AI Engine sedang menjalani pemeliharaan rutin. Anda tetap dapat melanjutkan pengisian data dan draf, namun beberapa fitur otomatisasi AI mungkin membutuhkan waktu sedikit lebih lama.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#b45309',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          opacity: 0.7,
        }}
        title="Tutup peringatan"
      >
        ✕
      </button>
    </div>
  )
}
