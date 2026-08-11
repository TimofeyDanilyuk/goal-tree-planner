<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from './stores/goals'
import { usePwaUpdate, applyPwaUpdate } from './composables/usePwaUpdate'
import AppHeader from './components/AppHeader.vue'
import InstallPwaButton from './components/InstallPwaButton.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { watch } from 'vue'
import { syncDueItems } from './composables/usePushSubscription'

const goalsStore = useGoalsStore()
const { t } = useI18n()

// предложение перезагрузить приложение, когда SW подхватил новую версию
const { updateAvailable } = usePwaUpdate()

onMounted(() => {
  goalsStore.init()
})

watch(() => goalsStore.goals, () => {
  if (localStorage.getItem('goal-tree:notifications') === 'on') {
    syncDueItems()
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