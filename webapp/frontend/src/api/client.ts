/**
 * API client axios. Semua request lewat prefix `/api` yang di-proxy Vite
 * ke backend FastAPI. Token JWT auto-attach dari auth store.
 */
import axios from 'axios'
import { compressImageIfExceeds2MB } from '@/utils/imageCompressor'
import type { PklContext } from '@/types/pkl'
import { emptyContext } from '@/types/pkl'
import type {
  BabRecommendation,
  DraftOut,
  DraftSummary,
  HealthResponse,
  TokenOut,
  UserOut,
  ValidationResult,
} from '@/types/api'

export function sanitizePklContext(raw?: any): PklContext {
  const base = emptyContext()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    siswa: { ...base.siswa, ...(raw.siswa || {}) },
    sekolah: {
      ...base.sekolah,
      ...(raw.sekolah || {}),
      kop: { ...base.sekolah.kop, ...(raw.sekolah?.kop || {}) },
      kepala_sekolah: { ...base.sekolah.kepala_sekolah, ...(raw.sekolah?.kepala_sekolah || {}) },
      waka_humas: { ...base.sekolah.waka_humas, ...(raw.sekolah?.waka_humas || {}) },
      ketua_kk: { ...base.sekolah.ketua_kk, ...(raw.sekolah?.ketua_kk || {}) },
      pembimbing_sekolah: { ...base.sekolah.pembimbing_sekolah, ...(raw.sekolah?.pembimbing_sekolah || {}) },
    },
    perusahaan: {
      ...base.perusahaan,
      ...(raw.perusahaan || {}),
      pimpinan: { ...base.perusahaan.pimpinan, ...(raw.perusahaan?.pimpinan || {}) },
      hrd: { ...base.perusahaan.hrd, ...(raw.perusahaan?.hrd || {}) },
      pembimbing_industri: { ...base.perusahaan.pembimbing_industri, ...(raw.perusahaan?.pembimbing_industri || {}) },
    },
    pkl: { ...base.pkl, ...(raw.pkl || {}) },
    profil_perusahaan: { ...base.profil_perusahaan, ...(raw.profil_perusahaan || {}) },
    kegiatan: Array.isArray(raw.kegiatan) ? raw.kegiatan : base.kegiatan,
    detail_kegiatan: Array.isArray(raw.detail_kegiatan) ? raw.detail_kegiatan : (base.detail_kegiatan || []),
    studi_kasus: { ...base.studi_kasus, ...(raw.studi_kasus || {}) },
    peralatan: Array.isArray(raw.peralatan) ? raw.peralatan : base.peralatan,
    kendala: Array.isArray(raw.kendala) ? raw.kendala : base.kendala,
    pelajaran: Array.isArray(raw.pelajaran) ? raw.pelajaran : base.pelajaran,
    tujuan_pkl: Array.isArray(raw.tujuan_pkl) ? raw.tujuan_pkl : (base.tujuan_pkl || []),
    asas_pkl: Array.isArray(raw.asas_pkl) ? raw.asas_pkl : (base.asas_pkl || []),
    saran_intro: typeof raw.saran_intro === 'string' ? raw.saran_intro : (base.saran_intro || ''),
    saran_items: Array.isArray(raw.saran_items) ? raw.saran_items : (base.saran_items || []),
    kata_pengantar: { ...base.kata_pengantar, ...(raw.kata_pengantar || {}) },
    daftar_pustaka: Array.isArray(raw.daftar_pustaka) ? raw.daftar_pustaka : base.daftar_pustaka,
    lampiran: {
      ...base.lampiran,
      ...(raw.lampiran || {}),
      foto_kegiatan: Array.isArray(raw.lampiran?.foto_kegiatan) ? raw.lampiran.foto_kegiatan : (base.lampiran?.foto_kegiatan || []),
    },
    assets: Array.isArray(raw.assets) ? raw.assets : base.assets,
    generated_sections: raw.generated_sections && typeof raw.generated_sections === 'object' ? raw.generated_sections : {},
    judul_override: raw.judul_override && typeof raw.judul_override === 'object' ? raw.judul_override : {},
  }
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 240_000,
})

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.defaults.headers.common['X-Access-Token'] = token
  } else {
    delete api.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['X-Access-Token']
  }
}

// --------------------------------------------------------------------------- //
//  Interceptor: auto-attach Bearer token & handle 401 expiration              //
// --------------------------------------------------------------------------- //
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pkl-auth')
  if (raw) {
    try {
      const { token } = JSON.parse(raw)
      if (token && config.headers) {
        if (typeof (config.headers as any).set === 'function') {
          ;(config.headers as any).set('Authorization', `Bearer ${token}`)
          ;(config.headers as any).set('X-Access-Token', token)
        } else {
          config.headers['Authorization'] = `Bearer ${token}`
          config.headers.Authorization = `Bearer ${token}`
          config.headers['X-Access-Token'] = token
        }
      }
    } catch {
      /* ignore corrupt data */
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthRoute =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/logout')

      if (!isAuthRoute) {
        localStorage.removeItem('pkl-auth')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-unauthorized'))
        }
      }
    }
    return Promise.reject(error)
  }
)

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

export const logoutApi = () =>
  api.post<{ status: string }>('/auth/logout').then((r) => r.data).catch(() => {})

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
  api.get<DraftOut>(`/drafts/${id}`).then((r) => ({
    ...r.data,
    data: sanitizePklContext(r.data.data),
  }))

export const updateDraft = (
  id: string,
  patch: { title?: string; status?: string; data?: PklContext },
) => api.put<DraftOut>(`/drafts/${id}`, patch).then((r) => ({
  ...r.data,
  data: sanitizePklContext(r.data.data),
}))

export const deleteDraft = (id: string) =>
  api.delete(`/drafts/${id}`).then((r) => r.data)

// --------------------------------------------------------------------------- //
//  Generate .docx                                                              //
// --------------------------------------------------------------------------- //
export const generateDocx = async (draftId: string): Promise<string> => {
  try {
    const response = await api.post(`/generate/${draftId}`, null, {
      responseType: 'blob',
      timeout: 240_000, // docx generation may take longer
    })

    // Extract filename from Content-Disposition header or use default
    const disposition = response.headers['content-disposition'] || ''
    const match = disposition.match(/filename\*?=(?:UTF-8'')?(['"]?)([^'";\n]*)\1/i)
    let filename = match?.[2] ? decodeURIComponent(match[2]) : `Laporan-PKL-${draftId}.docx`

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

    // Bila sebagian polish AI gagal, backend menyertakan pesan notifikasi
    // di header — kembalikan agar UI bisa menampilkannya ke user.
    const noticeHeader = response.headers['x-polish-message']
    if (noticeHeader) {
      try {
        return decodeURIComponent(noticeHeader)
      } catch {
        return noticeHeader
      }
    }
    return ''
  } catch (err: any) {
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const parsed = JSON.parse(text)
        if (parsed.detail) {
          const message = typeof parsed.detail === 'string'
            ? parsed.detail
            : parsed.detail.message || parsed.detail.error || 'Gagal generate dokumen'
          const customErr: any = new Error(message)
          customErr.detail = parsed.detail
          customErr.response = { ...err.response, data: parsed }
          throw customErr
        }
      } catch (parseErr: any) {
        if (parseErr.detail) throw parseErr
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr
        }
      }
    }
    throw err
  }
}

// --------------------------------------------------------------------------- //
//  AI Generation & Model Management                                           //
// --------------------------------------------------------------------------- //
export interface AiModelsResponse {
  available_models: string[]
  active_model: string
  model_endpoints?: Record<string, string>
}

export const getAiModels = () =>
  api.get<AiModelsResponse>('/ai/models').then((r) => r.data)

export const setActiveAiModel = (model: string) =>
  api.post<{ status: string; active_model: string; available_models: string[] }>('/ai/models/active', { model }).then((r) => r.data)

export const addAiModel = (model: string, baseUrl?: string) =>
  api.post<{ status: string; available_models: string[]; model_endpoints?: Record<string, string> }>('/ai/models/add', { model, base_url: baseUrl }).then((r) => r.data)

export const testAiConnection = () =>
  api.get<{ status: string; message: string }>('/ai/test').then((r) => r.data)

export const getAcademicFallback = (sectionKey: string, contextData: PklContext) =>
  api.post<{ content: string }>('/ai/academic-fallback', { section_key: sectionKey, context_data: contextData }).then((r) => r.data)

export const draftSection = (sectionKey: string, contextData: PklContext, model?: string) =>
  api.post<{ content: string }>('/ai/draft-section', {
    section_key: sectionKey,
    context_data: contextData,
    ...(model ? { model } : {}),
  }, { timeout: 120_000 }).then((r) => r.data)

export async function draftSectionStream(
  sectionKey: string,
  contextData: PklContext,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  model?: string
): Promise<string> {
  const rawAuth = localStorage.getItem('pkl-auth')
  let token = ''
  if (rawAuth) {
    try {
      token = JSON.parse(rawAuth).token || ''
    } catch {
      /* ignore */
    }
  }

  try {
    const response = await fetch('/api/ai/draft-section-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'X-Access-Token': token } : {}),
      },
      body: JSON.stringify({
        section_key: sectionKey,
        context_data: contextData,
        ...(model ? { model } : {}),
      }),
      signal,
    })

    if (!response.ok || !response.body) {
      if (signal?.aborted) throw new Error('Aborted')
      const fallback = await draftSection(sectionKey, contextData, model)
      if (signal?.aborted) throw new Error('Aborted')
      onChunk(fallback.content)
      return fallback.content
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let fullText = ''
    let buffer = ''

    let isStreamDone = false

    while (true) {
      const { done, value } = await reader.read()
      if (done || isStreamDone) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed === 'data: [DONE]') {
          isStreamDone = true
          break
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6))
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            if (parsed.content) {
              fullText += parsed.content
              onChunk(parsed.content)
            }
          } catch (e: any) {
            if (e?.message && e.message.includes('error')) throw e
            /* ignore partial JSON parse errors */
          }
        }
      }
    }

    if (!fullText && !signal?.aborted) {
      const fallback = await draftSection(sectionKey, contextData, model)
      if (signal?.aborted) throw new Error('Aborted')
      onChunk(fallback.content)
      return fallback.content
    }

    return fullText
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw err
    }
    const fallback = await draftSection(sectionKey, contextData, model)
    if (signal?.aborted) throw new Error('Aborted')
    onChunk(fallback.content)
    return fallback.content
  }
}

export async function batchDraftSectionsStream(
  sectionKeys: string[],
  contextData: PklContext,
  onSectionChunk: (key: string, chunk: string) => void,
  onSectionDone: (key: string, content: string) => void,
  signal?: AbortSignal,
  model?: string
): Promise<Record<string, string>> {
  const rawAuth = localStorage.getItem('pkl-auth')
  let token = ''
  if (rawAuth) {
    try {
      token = JSON.parse(rawAuth).token || ''
    } catch {
      /* ignore */
    }
  }

  const results: Record<string, string> = {}

  try {
    const response = await fetch('/api/ai/batch-draft-sections-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'X-Access-Token': token } : {}),
      },
      body: JSON.stringify({
        section_keys: sectionKeys,
        context_data: contextData,
        ...(model ? { model } : {}),
      }),
      signal,
    })

    if (!response.ok || !response.body) {
      if (signal?.aborted) throw new Error('Aborted')
      for (const key of sectionKeys) {
        if (signal?.aborted) throw new Error('Aborted')
        const single = await draftSection(key, contextData, model)
        results[key] = single.content
        onSectionChunk(key, single.content)
        onSectionDone(key, single.content)
      }
      return results
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let isStreamDone = false

    while (true) {
      const { done, value } = await reader.read()
      if (done || isStreamDone) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed === 'data: [DONE]') {
          isStreamDone = true
          break
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6))
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            const key = parsed.section_key
            if (key) {
              if (parsed.done) {
                const finalSectionText = parsed.content && parsed.content.trim() ? parsed.content : (results[key] || '')
                results[key] = finalSectionText
                onSectionDone(key, finalSectionText)
              } else if (parsed.content) {
                results[key] = (results[key] || '') + parsed.content
                onSectionChunk(key, parsed.content)
              }
            }
          } catch (e: any) {
            if (e?.message && e.message.includes('error')) throw e
          }
        }
      }
    }

    return results
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw err
    }
    for (const key of sectionKeys) {
      if (!results[key]) {
        if (signal?.aborted) throw new Error('Aborted')
        try {
          const single = await draftSection(key, contextData, model)
          results[key] = single.content
          onSectionChunk(key, single.content)
          onSectionDone(key, single.content)
        } catch {
          /* ignore */
        }
      }
    }
    return results
  }
}

export const regenerateSection = (oldText: string, instruction: string, model?: string) =>
  api.post<{ content: string }>('/ai/regenerate', {
    old_text: oldText,
    instruction: instruction,
    ...(model ? { model } : {}),
  }, { timeout: 120_000 }).then((r) => r.data)

export const parseFullStory = (cerita: string, jurusanKey: string, model?: string) =>
  api.post<{ kegiatan: any[], peralatan: any[], kendala: any[], pelajaran: any[], recommended_bab: string[] }>('/ai/parse-full-story', {
    cerita,
    jurusan_key: jurusanKey,
    ...(model ? { model } : {}),
  }, { timeout: 120_000 }).then((r) => r.data)

export const enhanceContext = (contextData: PklContext, model?: string) =>
  api.post<{ context_data: PklContext }>('/ai/enhance-context', {
    context_data: contextData,
    ...(model ? { model } : {}),
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
  const processedFile = await compressImageIfExceeds2MB(file)
  const formData = new FormData()
  formData.append('file', processedFile)
  formData.append('type', type)
  const res = await api.post<AssetInfo>('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return res.data
}

// --------------------------------------------------------------------------- //
//  Admin Router Endpoints                                                     //
// --------------------------------------------------------------------------- //
import type {
  AdminDraftItem,
  AdminStats,
  AssetAuditItem,
  AuditLogItem,
  DebugLogItem,
  HealthDetailResponse,
  SystemConfigData,
  UserManagementItem,
} from '@/types/api'

export const getAdminStats = () => api.get<AdminStats>('/admin/stats').then((r) => r.data)

export const listAdminUsers = (params?: { search?: string; role?: string; skip?: number; limit?: number }) =>
  api.get<{ total: number; items: UserManagementItem[] }>('/admin/users', { params }).then((r) => r.data)

export const createAdminUser = (payload: { email: string; name: string; password: string; role: string }) =>
  api.post<{ status: string; message: string; user_id: string }>('/admin/users', payload).then((r) => r.data)

export const updateUserRole = (userId: string, role: string) =>
  api.put<{ status: string; message: string }>(`/admin/users/${userId}/role`, { role }).then((r) => r.data)

export const toggleUserStatus = (userId: string, isActive: boolean) =>
  api.put<{ status: string; message: string }>(`/admin/users/${userId}/status`, { is_active: isActive }).then((r) => r.data)

export const resetUserPassword = (userId: string, newPassword: string) =>
  api.post<{ status: string; message: string }>(`/admin/users/${userId}/reset-password`, { new_password: newPassword }).then((r) => r.data)

export const deleteUser = (userId: string) =>
  api.delete<{ status: string; message: string }>(`/admin/users/${userId}`).then((r) => r.data)

export const adminInjectUserSimulation = (userId: string) =>
  api.post<{ status: string; message: string; draft_id: string }>(`/admin/users/${userId}/inject-simulation`).then((r) => r.data)

export const adminInjectDraftSimulation = (draftId: string) =>
  api.post<{ status: string; message: string; draft_id: string }>(`/admin/drafts/${draftId}/inject-simulation`).then((r) => r.data)

export const listAdminDrafts = (params?: { status_filter?: string; search?: string; skip?: number; limit?: number }) =>
  api.get<{ total: number; items: AdminDraftItem[] }>('/admin/drafts', { params }).then((r) => r.data)

export const inspectAdminDraft = (draftId: string) =>
  api.get<any>(`/admin/drafts/${draftId}`).then((r) => r.data)

export const forceDeleteDraft = (draftId: string) =>
  api.delete<{ status: string; message: string }>(`/admin/drafts/${draftId}`).then((r) => r.data)

export const auditAssets = () =>
  api.get<{ total_files: number; total_bytes: number; total_mb: number; orphaned_count: number; items: AssetAuditItem[] }>('/admin/assets').then((r) => r.data)

export const cleanupOrphanedAssets = () =>
  api.post<{ status: string; message: string; cleaned_count: number; freed_bytes: number }>('/admin/assets/cleanup').then((r) => r.data)

export const getSystemSettings = () =>
  api.get<{ key: string; data: SystemConfigData }>('/admin/settings').then((r) => r.data)

export const updateSystemSettings = (data: SystemConfigData) =>
  api.put<{ status: string; message: string }>('/admin/settings', data).then((r) => r.data)

export const listAuditLogs = (params?: { skip?: number; limit?: number }) =>
  api.get<{ total: number; items: AuditLogItem[] }>('/admin/logs', { params }).then((r) => r.data)

export const getHealthDetail = () =>
  api.get<HealthDetailResponse>('/admin/health-detail').then((r) => r.data)

export const getDebugLogs = (params?: { level?: string; category?: string; search?: string; limit?: number; since_id?: number }) =>
  api.get<{ total: number; since_id: number; items: DebugLogItem[] }>('/admin/debug/logs', { params }).then((r) => r.data)

export const clearDebugLogs = () =>
  api.post<{ status: string; message: string }>('/admin/debug/clear').then((r) => r.data)

export const simulateDebugErrorLogs = () =>
  api.post<{ status: string; message: string }>('/admin/debug/simulate-error').then((r) => r.data)
