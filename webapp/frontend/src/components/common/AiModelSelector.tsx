import React, { useEffect, useState } from 'react'
import { getAiModels } from '@/api/client'
import { IconSparkles } from '@/components/common/Icons'

interface AiModelSelectorProps {
  selectedModel?: string
  onModelChange?: (model: string) => void
  compact?: boolean
  className?: string
}

/**
 * AiModelSelector (Read-Only Status Badge)
 * Pemilihan model AI telah dikunci (disabled) untuk pengguna biasa.
 * Model AI yang dipakai secara otomatis mengikuti konfigurasi terpusat dari Admin Settings.
 */
export const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  onModelChange,
  compact = false,
  className = '',
}) => {
  const [activeModel, setActiveModel] = useState<string>('deepseek-opencode')

  useEffect(() => {
    let isMounted = true
    // Selalu ambil model aktif resmi yang ditetapkan Admin dari backend
    getAiModels()
      .then((res) => {
        if (!isMounted) return
        const adminModel = res.active_model || 'deepseek-opencode'
        setActiveModel(adminModel)
        if (onModelChange) onModelChange(adminModel)
      })
      .catch(() => {
        if (!isMounted) return
        setActiveModel('deepseek-opencode')
        if (onModelChange) onModelChange('deepseek-opencode')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const formatModelLabel = (m: string) => {
    if (m === 'deepseek-opencode') return 'DeepSeek OpenCode'
    if (m === 'gemini') return 'Gemini'
    return m
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#334155',
          userSelect: 'none',
        }}
        title="Model AI dikunci sesuai konfigurasi resmi Admin"
      >
        <IconSparkles size={14} color="#166534" />
        {!compact && <span style={{ color: '#64748b', fontWeight: 500 }}>Model AI:</span>}
        <strong style={{ color: '#0f172a' }}>{formatModelLabel(activeModel)}</strong>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '1px 5px',
            borderRadius: '4px',
            background: '#e2e8f0',
            color: '#475569',
            fontWeight: 700,
          }}
        >
          🔒 Admin Default
        </span>
      </div>
    </div>
  )
}
