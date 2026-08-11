import { defineStore } from 'pinia'

const STORAGE_KEY = 'goal-tree-theme'

function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // если пользователь ещё не выбирал вручную - смотрим на системную тему
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: getInitialTheme(),
  }),

  actions: {
    apply() {
      document.documentElement.classList.toggle('dark', this.mode === 'dark')
    },

    toggle() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, this.mode)
      this.apply()
    },
  },
})