import { IconAlert, IconSparkles, IconCheck } from '@/components/common/Icons'

export interface NotificationModalProps {
  isOpen: boolean
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
  onClose: () => void
  confirmLabel?: string
  onConfirm?: () => void
}

export default function NotificationModal({
  isOpen,
  title,
  message,
  type = 'error',
  onClose,
  confirmLabel = 'Mengerti & Tutup',
  onConfirm,
}: NotificationModalProps) {
  if (!isOpen) return null

  const getHeaderBadge = () => {
    switch (type) {
      case 'error':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          icon: <IconAlert size={24} color="#059669" />,
          defaultTitle: 'Sistem AI / Informasi Layanan',
        }
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          color: '#d97706',
          icon: <IconAlert size={24} color="#d97706" />,
          defaultTitle: 'Perhatian Sistem',
        }
      case 'success':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          icon: <IconCheck size={24} color="#059669" />,
          defaultTitle: 'Berhasil',
        }
      default:
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          icon: <IconSparkles size={24} color="#059669" />,
          defaultTitle: 'Informasi Naskara AI',
        }
    }
  }

  const badge = getHeaderBadge()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Decorative Bar */}
        <div style={{ height: '5px', backgroundColor: badge.color }} />

        {/* Modal Header & Content */}
        <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: badge.bg,
                border: `1px solid ${badge.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {badge.icon}
            </div>

            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 0.35rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.3,
                }}
              >
                {title || badge.defaultTitle}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.93rem',
                  color: '#475569',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '1rem 1.75rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          {onConfirm ? (
            <>
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
                style={{ fontSize: '0.9rem', padding: '0.55rem 1.1rem', borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                style={{
                  fontSize: '0.9rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: badge.color,
                  borderColor: badge.color,
                }}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{
                width: '100%',
                fontSize: '0.92rem',
                fontWeight: 600,
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: badge.color,
                borderColor: badge.color,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
