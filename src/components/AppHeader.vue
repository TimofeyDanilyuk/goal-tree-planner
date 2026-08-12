<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useGoalsStore } from '../stores/goals'
import ThemeToggle from './ThemeToggle.vue'
import LocaleToggle from './LocaleToggle.vue'
import NotificationToggle from './NotificationToggle.vue'

const themeStore = useThemeStore()
const goalsStore = useGoalsStore()

onMounted(() => {
  themeStore.apply()
})

goalsStore.init()
</script>

<template>
  <header class="border-b border-sage/20 bg-paper dark:bg-dusk">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <router-link to="/" class="font-display text-xl font-semibold text-ink dark:text-paper">
        {{ $t('header.title') }}
      </router-link>

      <div class="flex items-center gap-2">
        <NotificationToggle />
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>