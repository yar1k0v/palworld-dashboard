import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  // Auth
  password: string | null
  isAuthenticated: boolean

  // Theme
  theme: Theme

  // Actions
  login: (password: string) => void
  logout: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      password: null,
      isAuthenticated: false,
      theme: 'system',

      // Auth actions
      login: (password: string) => {
        set({ password, isAuthenticated: true })
      },

      logout: () => {
        set({ password: null, isAuthenticated: false })
      },

      // Theme actions
      setTheme: (theme: Theme) => {
        set({ theme })
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
      },
    }),
    {
      name: 'palworld-app-storage',
      partialize: (state) => ({
        // Only persist theme to localStorage
        // Password is stored in sessionStorage separately for security
        theme: state.theme,
      }),
    }
  )
)

// Separate session storage for auth (clears on tab close)
const AUTH_STORAGE_KEY = 'palworld-auth'

export function initAuthFromSession() {
  const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (stored) {
    try {
      const { password } = JSON.parse(stored)
      if (password) {
        useAppStore.getState().login(password)
      }
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }
}

export function saveAuthToSession(password: string) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ password }))
}

export function clearAuthFromSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
