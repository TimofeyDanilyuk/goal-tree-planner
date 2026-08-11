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