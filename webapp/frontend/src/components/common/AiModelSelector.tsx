import React, { useEffect } from 'react'
import { getAiModels } from '@/api/client'

interface AiModelSelectorProps {
  selectedModel?: string
  onModelChange?: (model: string) => void
  compact?: boolean
  className?: string
}

/**
 * AiModelSelector (Hidden for Regular Users)
 * Seluruh teks/informasi model AI disembunyikan total dari tampilan siswa.
 * Sistem secara otomatis mengeksekusi model aktif resmi yang dikonfigurasi Admin.
 */
export const AiModelSelector: React.FC<AiModelSelectorProps> = ({ onModelChange }) => {
  useEffect(() => {
    let isMounted = true
    getAiModels()
      .then((res) => {
        if (!isMounted) return
        const adminModel = res.active_model || 'deepseek-opencode'
        if (onModelChange) onModelChange(adminModel)
      })
      .catch(() => {
        if (!isMounted) return
        if (onModelChange) onModelChange('deepseek-opencode')
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Sembunyikan total seluruh teks & badge model AI dari tampilan user
  return null
}
