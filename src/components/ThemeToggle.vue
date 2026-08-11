<script setup lang="ts">
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="themeStore.mode === 'dark'"
    aria-label="Переключить тему"
    class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-moss dark:focus-visible:ring-offset-dusk"
    :class="themeStore.mode === 'dark' ? 'bg-dusk-dim hover:bg-dusk' : 'bg-sage/30 hover:bg-sage/40'"
    @click="themeStore.toggle"
  >
    <span
      class="absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper shadow-sm transition-transform duration-300"
      :class="themeStore.mode === 'dark' ? 'translate-x-6' : 'translate-x-0'"
    >
      <svg v-if="themeStore.mode === 'light'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 text-ochre">
        <circle cx="12" cy="12" r="4" />
        <path stroke-linecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66 4.93 19.07M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 text-ink">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    </span>
  </button>
</template>