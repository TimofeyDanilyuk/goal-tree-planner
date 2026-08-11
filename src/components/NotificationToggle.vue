<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotifications } from '../composables/useNotifications'

const { t } = useI18n()
const notifications = useNotifications()
const enabled = ref(false)

onMounted(() => {
  if (notifications.permissionGranted.value) enabled.value = true
})

async function toggle() {
  if (enabled.value) {
    enabled.value = false
    localStorage.setItem('goal-tree:notifications', 'off')
    return
  }
  const ok = await notifications.requestPermission()
  enabled.value = ok
  if (ok) localStorage.setItem('goal-tree:notifications', 'on')
}

onMounted(() => {
  const saved = localStorage.getItem('goal-tree:notifications')
  if (saved === 'on' && notifications.permissionGranted.value) enabled.value = true
})
</script>

<template>
  <button
    type="button"
    :aria-label="t('notifications.toggle')"
    :title="t('notifications.toggle')"
    class="h-9 w-9 rounded-full flex items-center justify-center transition"
    :class="enabled ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
    @click="toggle"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4.5 w-4.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  </button>
</template>