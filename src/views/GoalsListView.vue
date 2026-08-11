<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { getGoalProgress } from '../utils/progress'
import GrowthRing from '../components/GrowthRing.vue'
import { useI18n } from 'vue-i18n'
import GoalFormModal from '../components/modals/GoalFormModal.vue'

const { t } = useI18n()

const goalsStore = useGoalsStore()
const goals = computed(() => goalsStore.activeGoals)

const isModalOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleCreate(payload: { title: string; description: string; color: string }) {
  goalsStore.addGoal(payload.title, payload.description || undefined, payload.color)
}

async function handleExport() {
  const json = await goalsStore.exportBackup()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `goal-tree-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const text = await file.text()
  const mode = goalsStore.goals.length > 0
    ? (confirm(t('backup.confirmReplace')) ? 'replace' : 'merge')
    : 'replace'

  try {
    await goalsStore.importBackup(text, mode)
  } catch {
    alert(t('backup.importError'))
  }

  // сбрасываем value - иначе повторный выбор того же файла не вызовет change
  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-8 flex-wrap">
      <h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">
        {{ $t('goalsList.title') }}
      </h1>

      <div class="flex items-center gap-2">
        <button type="button" class="min-h-11 px-3 rounded-full border border-sage/25 text-sage text-sm font-medium hover:bg-sage/10 hover:border-sage/40 hover:text-ink dark:hover:text-paper transition" @click="handleExport">
          {{ $t('goalsList.export') }}
        </button>
        <button type="button" class="min-h-11 px-3 rounded-full border border-sage/25 text-sage text-sm font-medium hover:bg-sage/10 hover:border-sage/40 hover:text-ink dark:hover:text-paper transition" @click="triggerImport">
          {{ $t('goalsList.import') }}
        </button>
        <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="handleFileChange">

        <button type="button" class="min-h-11 px-4 rounded-full bg-moss text-paper font-medium text-sm hover:bg-moss-dark hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:translate-y-0 transition" @click="isModalOpen = true">
          {{ $t('goalsList.addGoal') }}
        </button>
      </div>
    </div>

    <p v-if="goals.length === 0" class="text-sage">
      {{ $t('goalsList.empty') }}
    </p>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="goal in goals"
        :key="goal.id"
        :to="`/goal/${goal.id}`"
        class="flex items-start gap-4 p-5 rounded-2xl border border-sage/20 bg-white dark:bg-dusk-dim hover:border-moss/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <GrowthRing :progress="getGoalProgress(goal)" :size="44" :stroke-width="3" />
        <div class="min-w-0">
          <h2 class="font-display font-semibold text-ink dark:text-paper truncate">
            {{ goal.title }}
          </h2>
          <p v-if="goal.description" class="text-sm text-sage mt-0.5 line-clamp-2">
            {{ goal.description }}
          </p>
        </div>
      </router-link>
    </div>

    <GoalFormModal v-model="isModalOpen" @submit="handleCreate" />
  </div>
</template>