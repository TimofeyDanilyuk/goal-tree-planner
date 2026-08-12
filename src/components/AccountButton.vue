<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import ContextMenu, { type MenuItem } from './ContextMenu.vue'
import AuthModal from './modals/AuthModal.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const isAuthModalOpen = ref(false)
const menuState = ref({ visible: false, x: 0, y: 0 })

function handleClick(event: MouseEvent) {
  if (!authStore.isAuthenticated) {
    isAuthModalOpen.value = true
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  menuState.value = { visible: true, x: rect.left, y: rect.bottom + 4 }
}

const menuItems = computed<MenuItem[]>(() => [
  { label: t('auth.logout'), danger: true, onClick: () => authStore.logout() },
])
</script>

<template>
  <button
    type="button"
    class="h-9 px-3 rounded-full flex items-center gap-1.5 text-sm font-medium transition"
    :class="authStore.isAuthenticated ? 'bg-moss/10 text-moss' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
    @click="handleClick"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <span v-if="authStore.isAuthenticated" class="hidden sm:inline max-w-[80px] truncate">{{ authStore.username }}</span>
  </button>

  <ContextMenu :visible="menuState.visible" :x="menuState.x" :y="menuState.y" :items="menuItems" @close="menuState.visible = false" />
  <AuthModal v-model="isAuthModalOpen" />
</template>