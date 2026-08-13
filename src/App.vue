<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from './stores/goals'
import { useAuthStore } from './stores/auth'
import { usePwaUpdate, applyPwaUpdate, checkVersion } from './composables/usePwaUpdate'
import { syncDueItems } from './composables/usePushSubscription'
import * as syncApi from './services/syncApi'
import AppHeader from './components/AppHeader.vue'
import InstallPwaButton from './components/InstallPwaButton.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const goalsStore = useGoalsStore()
const authStore = useAuthStore()
const { t } = useI18n()

const { updateAvailable } = usePwaUpdate()

let pushTimeout: ReturnType<typeof setTimeout> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

// подтягиваем свежие данные с сервера, если там новее, чем последнее известное локально
async function pullIfNewer() {
  if (!authStore.isAuthenticated) return
  try {
    const server = await syncApi.pullGoals()
    const lastKnown = syncApi.getLastSyncedAt()
    if (server.updatedAt && (!lastKnown || server.updatedAt > lastKnown)) {
      await goalsStore.importBackup(JSON.stringify(server.goals), 'replace')
      syncApi.setLastSyncedAt(server.updatedAt)
    }
  } catch {
    // сервер недоступен - остаёмся на локальных данных
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    pullIfNewer()
    checkVersion()
  }
}

onMounted(async () => {
  await goalsStore.init()

  if (authStore.isAuthenticated && goalsStore.goals.length === 0) {
    await pullIfNewer()
  }

  checkVersion()
  pollTimer = setInterval(() => {
    pullIfNewer()
    checkVersion()
  }, 30_000)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(() => goalsStore.goals, () => {
  if (localStorage.getItem('goal-tree:notifications') === 'on') {
    syncDueItems()
  }

  if (authStore.isAuthenticated) {
    if (pushTimeout) clearTimeout(pushTimeout)
    pushTimeout = setTimeout(() => {
      syncApi.pushGoals(goalsStore.goals).catch(() => {})
    }, 1500)
  }
}, { deep: true })

function applyUpdate() {
  applyPwaUpdate()
}
</script>

<template>
  <div class="min-h-screen bg-paper dark:bg-dusk text-ink dark:text-paper">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-6">
      <router-view />
    </main>
    <InstallPwaButton />

    <div v-if="updateAvailable" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-ink dark:bg-paper text-paper dark:text-ink shadow-lg">
      <span class="text-sm">{{ t('pwa.updateAvailable') }}</span>
      <button
        type="button"
        class="shrink-0 px-4 h-9 rounded-xl bg-moss text-paper text-sm font-medium hover:bg-moss-dark transition"
        @click="applyUpdate"
      >
        {{ t('pwa.updateNow') }}
      </button>
    </div>

    <ConfirmDialog />
  </div>
</template>