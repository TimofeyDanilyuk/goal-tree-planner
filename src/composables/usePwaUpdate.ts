import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const updateAvailable = ref(false)

let needsRefresh = false

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    registration?.update().catch(() => {})
    void swUrl
  },
  onNeedRefresh() {
    needsRefresh = true
    updateAvailable.value = true
  },
  onOfflineReady() {
  },
})

// независимая проверка версии в обход service worker -
// iOS не всегда вовремя дёргает update() у самого SW, поэтому подстраховываемся отдельно
export async function checkVersion(): Promise<void> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.txt`, { cache: 'no-store' })
    if (!res.ok) return
    const serverBuildId = (await res.text()).trim()
    if (serverBuildId && serverBuildId !== __APP_BUILD_ID__) {
      needsRefresh = true
      updateAvailable.value = true
    }
  } catch {
    // сеть недоступна - молча пропускаем эту проверку
  }
}

export function usePwaUpdate() {
  return {
    updateAvailable,
    needsRefresh,
  }
}

export function applyPwaUpdate() {
  needsRefresh = false
  updateAvailable.value = false
  if (typeof window !== 'undefined') window.location.reload()
}