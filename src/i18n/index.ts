import { createI18n } from 'vue-i18n'
import ru from './locales/ru'
import en from './locales/en'

const STORAGE_KEY = 'goal-tree-locale'

function getInitialLocale(): 'ru' | 'en' {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'ru' || saved === 'en') return saved
  // если пользователь ещё не выбирал вручную - смотрим на язык браузера
  return navigator.language.startsWith('ru') ? 'ru' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { ru, en },
})

export function setLocale(locale: 'ru' | 'en') {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}