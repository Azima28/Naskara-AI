import React, { useEffect, useState } from 'react'
import { getAiModels, setActiveAiModel, addAiModel } from '@/api/client'
import { IconSparkles } from '@/components/common/Icons'

interface AiModelSelectorProps {
  selectedModel?: string
  onModelChange?: (model: string) => void
  compact?: boolean
  className?: string
}

export const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  compact = false,
  className = '',
}) => {
  const [models, setModels] = useState<string[]>(['deepseek-opencode', 'gemini'])
  const [activeModel, setActiveModel] = useState<string>('deepseek-opencode')
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [newModelInput, setNewModelInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    // 1. Check local storage for user choice
    const saved = localStorage.getItem('naskara_selected_ai_model')

    // 2. Fetch backend model settings
    getAiModels()
      .then((res) => {
        if (res.available_models && res.available_models.length > 0) {
          setModels(res.available_models)
        }
        const currentActive = saved || selectedModel || res.active_model || 'deepseek-opencode'
        setActiveModel(currentActive)
        if (onModelChange) onModelChange(currentActive)
      })
      .catch(() => {
        const fallback = saved || selectedModel || 'deepseek-opencode'
        setActiveModel(fallback)
      })
  }, [])

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '__ADD_NEW__') {
      setIsAdding(true)
      return
    }

    setActiveModel(val)
    localStorage.setItem('naskara_selected_ai_model', val)
    if (onModelChange) onModelChange(val)

    try {
      await setActiveAiModel(val)
    } catch {
      /* ignore background sync error */
    }
  }

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newModelInput.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const res = await addAiModel(trimmed)
      if (res.available_models) setModels(res.available_models)
      else if (!models.includes(trimmed)) setModels([...models, trimmed])

      setActiveModel(trimmed)
      localStorage.setItem('naskara_selected_ai_model', trimmed)
      if (onModelChange) onModelChange(trimmed)
      setIsAdding(false)
      setNewModelInput('')
    } catch (err) {
      if (!models.includes(trimmed)) setModels([...models, trimmed])
      setActiveModel(trimmed)
      localStorage.setItem('naskara_selected_ai_model', trimmed)
      if (onModelChange) onModelChange(trimmed)
      setIsAdding(false)
      setNewModelInput('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {isAdding ? (
        <form onSubmit={handleAddModel} className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-lg p-1 shadow-sm">
          <input
            type="text"
            placeholder="Nama model (misal: gemini)"
            value={newModelInput}
            onChange={(e) => setNewModelInput(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !newModelInput.trim()}
            className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            {loading ? '...' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-1.5 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-900 shadow-xs hover:border-blue-300 transition">
          <IconSparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          {!compact && <span className="text-gray-500 hidden sm:inline">Model AI:</span>}
          <select
            value={activeModel}
            onChange={handleSelectChange}
            className="bg-transparent font-semibold text-blue-950 focus:outline-none cursor-pointer pr-1"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m === 'gemini' ? '⚡ Gemini (Port 20128)' : m === 'deepseek-opencode' ? '✨ DeepSeek OpenCode' : `🤖 ${m}`}
              </option>
            ))}
            <option value="__ADD_NEW__">➕ Tambah Model Custom...</option>
          </select>
        </div>
      )}
    </div>
  )
}
