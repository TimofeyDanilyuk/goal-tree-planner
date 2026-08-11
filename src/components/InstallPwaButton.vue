<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isVisible = ref(false)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    isVisible.value = true
  })
  window.addEventListener('appinstalled', () => {
    isVisible.value = false
  })
})

async function install() {
  if (!deferredPrompt.value) return
  await deferredPrompt.value.prompt()
  await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  isVisible.value = false
}
</script>

<template>
  <button
    v-if="isVisible"
    type="button"
    class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-72 z-40 flex items-center justify-between gap-3 px-4 h-12 rounded-full bg-ink dark:bg-paper text-paper dark:text-ink shadow-lg"
    @click="install"
  >
    <span class="text-sm font-medium">{{ $t('pwa.installPrompt') }}</span>
    <span class="text-xs font-mono opacity-70">{{ $t('pwa.installAction') }}</span>
  </button>
</template>