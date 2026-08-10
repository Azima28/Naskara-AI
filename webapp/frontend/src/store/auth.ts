/**
 * Auth store (zustand) — token + user, persist ke localStorage.
 * Semua komponen yang butuh auth pakai hook `useAuth()`.
 */
import { create } from 'zustand'
import type { UserOut } from '@/types/api'
import * as api from '@/api/client'

const STORAGE_KEY = 'pkl-auth'

interface AuthState {
  token: string | null
  user: UserOut | null
  loading: boolean
  initialized: boolean

  restore: () => Promise<void>
  setAuth: (token: string, user: UserOut) => void
  login: (email: string, password: string) => Promise<UserOut>
  register: (email: string, name: string, password: string) => Promise<UserOut>
  logout: () => void
  isAdmin: () => boolean
  isStaff: () => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  initialized: false,

  /** Restore dari localStorage secara sinkron & refresh data user dari /auth/me di background */
  restore: async () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      api.setAuthHeader(null)
      set({ initialized: true })
      return
    }
    try {
      const { token, user } = JSON.parse(raw)
      if (token && user) {
        // Set header Authorization & X-Access-Token secara langsung ke Axios
        api.setAuthHeader(token)
        set({ token, user, initialized: true })

        // Refresh profil user dari backend di background (tapi jangan logout jika hanya kendala jaringan)
        try {
          const freshUser = await api.getMe()
          if (freshUser && freshUser.id) {
            set({ user: freshUser, initialized: true })
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: freshUser }))
          }
        } catch (err: any) {
          // Hanya hapus sesi jika backend secara eksplisit mengembalikan HTTP 401 (token benar-benar expired/invalid)
          if (err?.response?.status === 401) {
            console.warn('[Auth Restore] Sesi kedaluwarsa (401 Unauthorized), melakukan logout.')
            api.setAuthHeader(null)
            localStorage.removeItem(STORAGE_KEY)
            set({ token: null, user: null, initialized: true })
          } else {
            console.warn('[Auth Restore] Gagal memperbarui profil di background, menggunakan sesi terarsip:', err?.message)
          }
        }
      } else {
        api.setAuthHeader(null)
        set({ initialized: true })
      }
    } catch {
      api.setAuthHeader(null)
      localStorage.removeItem(STORAGE_KEY)
      set({ token: null, user: null, initialized: true })
    }
  },

  setAuth: (token, user) => {
    api.setAuthHeader(token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user, initialized: true })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await api.login(email, password)
      get().setAuth(res.access_token, res.user)
      return res.user
    } finally {
      set({ loading: false })
    }
  },

  register: async (email, name, password) => {
    set({ loading: true })
    try {
      const res = await api.register(email, name, password)
      get().setAuth(res.access_token, res.user)
      return res.user
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    api.logoutApi()
    api.setAuthHeader(null)
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null, initialized: true })
  },

  isAdmin: () => get().user?.role === 'admin',
  isStaff: () => get().user?.role === 'admin',
}))

if (typeof window !== 'undefined') {
  window.addEventListener('auth-unauthorized', () => {
    useAuth.getState().logout()
  })
}
