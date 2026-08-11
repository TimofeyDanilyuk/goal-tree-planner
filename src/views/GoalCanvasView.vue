<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGoalsStore } from '../stores/goals'
import GraphCanvas from '../components/graph/GraphCanvas.vue'
import StepTreeList from '../components/graph/StepTreeList.vue'
import StepModal from '../components/modals/StepModal.vue'

const props = defineProps<{ id: string }>()
const goalsStore = useGoalsStore()

const goal = computed(() => goalsStore.goals.find(g => g.id === props.id))
const openStepId = ref<string | null>(null)

// на узких экранах граф неудобен для точного тапа - по умолчанию открываем список
const viewMode = ref<'graph' | 'list'>(
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'graph'
)

function handleOpenStep(stepId: string | null) {
  if (stepId) openStepId.value = stepId
}
</script>

<template>
  <div v-if="goal">
    <router-link to="/" class="text-sm text-sage hover:underline">{{ $t('goalCanvas.back') }}</router-link>

    <div class="flex items-center justify-between gap-3 mt-1 mb-4">
      <h1 class="font-display text-2xl font-semibold text-ink dark:text-paper truncate">
        {{ goal.title }}
      </h1>

      <div class="shrink-0 flex rounded-full border border-sage/25 p-0.5 bg-white dark:bg-dusk-dim">
        <button
          type="button"
          class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="viewMode === 'graph' ? 'bg-moss text-paper' : 'text-sage'"
          @click="viewMode = 'graph'"
        >
          {{ $t('goalCanvas.graph') }}
        </button>
        <button
          type="button"
          class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="viewMode === 'list' ? 'bg-moss text-paper' : 'text-sage'"
          @click="viewMode = 'list'"
        >
          {{ $t('goalCanvas.list') }}
        </button>
      </div>
    </div>

    <GraphCanvas v-if="viewMode === 'graph'" :goal="goal" @open-step="handleOpenStep" />
    <StepTreeList v-else :goal="goal" @open-step="handleOpenStep" />

    <StepModal :goal-id="goal.id" :step-id="openStepId" @close="openStepId = null" />
  </div>
  <div v-else class="text-sage">
    {{ $t('goalCanvas.notFound') }}
  </div>
</template>