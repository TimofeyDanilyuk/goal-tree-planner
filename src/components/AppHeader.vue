<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import ThemeToggle from './ThemeToggle.vue'
import LocaleToggle from './LocaleToggle.vue'
import NotificationToggle from './NotificationToggle.vue'
import AccountButton from './AccountButton.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.apply()
})
</script>

<template>
  <header class="border-b border-sage/20 bg-paper dark:bg-dusk">
    <div class="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
      <router-link to="/" class="font-display text-lg sm:text-xl font-semibold text-ink dark:text-paper whitespace-nowrap shrink-0">
        {{ $t('header.title') }}
      </router-link>

      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <AccountButton />
        <NotificationToggle />
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>