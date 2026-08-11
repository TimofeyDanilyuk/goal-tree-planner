<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoalsStore } from './stores/goals'
import AppHeader from './components/AppHeader.vue'
import InstallPwaButton from './components/InstallPwaButton.vue'

const goalsStore = useGoalsStore()

onMounted(() => {
  goalsStore.init()
})
</script>

<template>
  <div class="min-h-screen bg-paper dark:bg-dusk text-ink dark:text-paper">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-6">
      <router-view />
    </main>
    <InstallPwaButton />
  </div>
</template>