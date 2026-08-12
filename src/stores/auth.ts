import { defineStore } from 'pinia'

const AUTH_KEY = 'goal-tree:auth'

interface AuthSession {
  token: string
  userId: string
  username: string
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: loadSession() as AuthSession | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    token: (state) => state.session?.token ?? null,
    username: (state) => state.session?.username ?? null,
  },

  actions: {
    setSession(session: AuthSession) {
      this.session = session
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    },
    logout() {
      this.session = null
      localStorage.removeItem(AUTH_KEY)
    },
  },
})