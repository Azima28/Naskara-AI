/**
 * API client axios. Semua request lewat prefix `/api` yang di-proxy Vite
 * ke backend FastAPI. Token JWT auto-attach dari auth store.
 */
import axios from 'axios'
import type { PklContext } from '@/types/pkl'
import type {
  BabRecommendation,
  DraftOut,
  DraftSummary,
  HealthResponse,
  TokenOut,
  UserOut,
  ValidationResult,
} from '@/types/api'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
})

// --------------------------------------------------------------------------- //
//  Interceptor: auto-attach Bearer token                                       //
// --------------------------------------------------------------------------- //
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pkl-auth')
  if (raw) {
    try {
      const { token } = JSON.parse(raw)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      /* ignore corrupt data */
    }
  }
  return config
})

// --------------------------------------------------------------------------- //
//  Health / Validation                                                         //
// --------------------------------------------------------------------------- //
export const getHealth = () => api.get<HealthResponse>('/health').then((r) => r.data)

export const validateData = (ctx: PklContext) =>
  api.post<ValidationResult>('/validate', ctx).then((r) => r.data)

export const recommendBab = (ctx: PklContext) =>
  api.post<BabRecommendation>('/recommend-bab', ctx).then((r) => r.data)

// --------------------------------------------------------------------------- //
//  Auth                                                                       //
// --------------------------------------------------------------------------- //
export const register = (email: string, name: string, password: string) =>
  api.post<TokenOut>('/auth/register', { email, name, password }).then((r) => r.data)

export const login = (email: string, password: string) =>
  api.post<TokenOut>('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () => api.get<UserOut>('/auth/me').then((r) => r.data)

// --------------------------------------------------------------------------- //
//  Drafts                                                                     //
// --------------------------------------------------------------------------- //
export const listDrafts = () => api.get<DraftSummary[]>('/drafts').then((r) => r.data)

export const createDraft = (title?: string) =>
  api
    .post<DraftOut>('/drafts', title ? { title } : {})
    .then((r) => r.data)

export const getDraft = (id: string) =>
  api.get<DraftOut>(`/drafts/${id}`).then((r) => r.data)

export const updateDraft = (
  id: string,
  patch: { title?: string; status?: string; data?: PklContext },
) => api.put<DraftOut>(`/drafts/${id}`, patch).then((r) => r.data)

export const deleteDraft = (id: string) =>
  api.delete(`/drafts/${id}`).then((r) => r.data)

// --------------------------------------------------------------------------- //
//  Generate .docx                                                              //
// --------------------------------------------------------------------------- //
export const generateDocx = async (draftId: string): Promise<void> => {
  try {
    const response = await api.post(`/generate/${draftId}`, null, {
      responseType: 'blob',
      timeout: 120_000, // docx generation may take longer
    })

    // Extract filename from Content-Disposition header or use default
    const disposition = response.headers['content-disposition'] || ''
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/)
    const filename = match?.[2] || `Laporan-PKL-${draftId}.docx`

    // Trigger browser download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const parsed = JSON.parse(text)
        if (parsed.detail) {
          if (typeof parsed.detail === 'string') {
            throw new Error(parsed.detail)
          } else if (parsed.detail.message) {
            const issuesMsg = parsed.detail.issues && Array.isArray(parsed.detail.issues)
              ? '\n' + parsed.detail.issues.map((i: any) => `• ${i.field || 'Data'}: ${i.message}`).join('\n')
              : ''
            throw new Error(`${parsed.detail.message}${issuesMsg}`)
          }
        }
      } catch (parseErr: any) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr
        }
      }
    }
    throw err
  }
}

// --------------------------------------------------------------------------- //
//  AI Generation                                                              //
// --------------------------------------------------------------------------- //
export const draftSection = (sectionKey: string, contextData: PklContext) =>
  api.post<{ content: string }>('/ai/draft-section', {
    section_key: sectionKey,
    context_data: contextData,
  }, { timeout: 120_000 }).then((r) => r.data)

export const regenerateSection = (oldText: string, instruction: string) =>
  api.post<{ content: string }>('/ai/regenerate', {
    old_text: oldText,
    instruction: instruction,
  }, { timeout: 120_000 }).then((r) => r.data)

export const parseFullStory = (cerita: string, jurusanKey: string) =>
  api.post<{ kegiatan: any[], peralatan: any[], kendala: any[], pelajaran: any[], recommended_bab: string[] }>('/ai/parse-full-story', {
    cerita,
    jurusan_key: jurusanKey,
  }, { timeout: 120_000 }).then((r) => r.data)

export const enhanceContext = (contextData: PklContext) =>
  api.post<{ context_data: PklContext }>('/ai/enhance-context', {
    context_data: contextData,
  }, { timeout: 180_000 }).then((r) => r.data)

// --------------------------------------------------------------------------- //
//  Asset Upload                                                                //
// --------------------------------------------------------------------------- //
export interface AssetInfo {
  id: string
  filename: string
  original_name: string
  type: string
}

export const uploadAsset = async (file: File, type: string = 'foto'): Promise<AssetInfo> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  const res = await api.post<AssetInfo>('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return res.data
}
