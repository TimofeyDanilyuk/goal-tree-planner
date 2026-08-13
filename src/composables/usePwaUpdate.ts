import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const updateAvailable = ref(false)

const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    void swUrl
    registration?.update().catch(() => {})
  },
  onNeedRefresh() {
    updateAvailable.value = true
  },
  onOfflineReady() {},
})

// независимая проверка версии в обход service worker -
// iOS не всегда вовремя дёргает update() у самого SW, поэтому подстраховываемся отдельно
export async function checkVersion(): Promise<void> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.txt`, { cache: 'no-store' })
    if (!res.ok) return
    const serverBuildId = (await res.text()).trim()
    if (serverBuildId && serverBuildId !== __APP_BUILD_ID__) {
      updateAvailable.value = true
      // форсируем сервис-воркер перепроверить свой скрипт -
      // если реально есть новая версия sw.js, это запустит штатный onNeedRefresh
      const reg = await navigator.serviceWorker.getRegistration()
      await reg?.update()
    }
  } catch {
    // сеть недоступна - пропускаем эту проверку
  }
}

export function usePwaUpdate() {
  return { updateAvailable }
}

export async function applyPwaUpdate() {
  updateAvailable.value = false
  await updateServiceWorker(true)
}