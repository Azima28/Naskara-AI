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
  const [errorMsg, setErrorMsg] = useState<string>('')

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
    if (!trimmed) {
      setErrorMsg('Nama model tidak boleh kosong')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await addAiModel(trimmed)
      const updatedList = res.available_models || [...models, trimmed]
      setModels(updatedList)
      setActiveModel(trimmed)
      localStorage.setItem('naskara_selected_ai_model', trimmed)
      if (onModelChange) onModelChange(trimmed)
      setIsAdding(false)
      setNewModelInput('')
    } catch {
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

  const formatModelLabel = (m: string) => {
    if (m === 'deepseek-opencode') return 'DeepSeek OpenCode'
    if (m === 'gemini') return 'Gemini (Port 20128)'
    return m
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {isAdding ? (
        <form onSubmit={handleAddModel} className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
          <input
            type="text"
            placeholder="Ketik nama model (contoh: gemini)"
            value={newModelInput}
            onChange={(e) => {
              setNewModelInput(e.target.value)
              setErrorMsg('')
            }}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 w-44 font-medium"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !newModelInput.trim()}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Simpan...' : 'Tambah'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setNewModelInput('')
              setErrorMsg('')
            }}
            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 rounded border border-slate-200 bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          {errorMsg && <span className="text-red-600 text-xs">{errorMsg}</span>}
        </form>
      ) : (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 shadow-xs hover:border-slate-400 transition">
          <IconSparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          {!compact && <span className="text-slate-600 font-medium">Model AI:</span>}
          <select
            value={activeModel}
            onChange={handleSelectChange}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer pr-1"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {formatModelLabel(m)}
              </option>
            ))}
            <option value="__ADD_NEW__">+ Tambah Model Baru...</option>
          </select>
        </div>
      )}
    </div>
  )
}
