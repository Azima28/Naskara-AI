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

  restore: () => void
  setAuth: (token: string, user: UserOut) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,

  /** Restore dari localStorage saat app load. */
  restore: () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const { token, user } = JSON.parse(raw)
      if (token && user) set({ token, user })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await api.login(email, password)
      get().setAuth(res.access_token, res.user)
    } finally {
      set({ loading: false })
    }
  },

  register: async (email, name, password) => {
    set({ loading: true })
    try {
      const res = await api.register(email, name, password)
      get().setAuth(res.access_token, res.user)
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
}))
