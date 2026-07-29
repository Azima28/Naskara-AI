/**
 * API client axios. Semua request lewat prefix `/api` yang di-proxy Vite
 * ke backend FastAPI. Token JWT auto-attach dari auth store.
 */
import axios from 'axios'
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
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
})

// --------------------------------------------------------------------------- //
//  Interceptor: auto-attach Bearer token & handle 401 expiration              //
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pkl-auth')
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
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
