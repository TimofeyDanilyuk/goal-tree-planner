<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGoalsStore } from '../stores/goals'
import GraphCanvas from '../components/graph/GraphCanvas.vue'
import StepTreeList from '../components/graph/StepTreeList.vue'
import StepModal from '../components/modals/StepModal.vue'
import GoalFormModal from '../components/modals/GoalFormModal.vue'

const props = defineProps<{ id: string }>()
const goalsStore = useGoalsStore()
const router = useRouter()

const goal = computed(() => goalsStore.goals.find(g => g.id === props.id))
const openStepId = ref<string | null>(null)
const isEditModalOpen = ref(false)

const viewMode = ref<'graph' | 'list'>(
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'graph'
)

function handleOpenStep(stepId: string) {
  openStepId.value = stepId
}

function handleEditSubmit(payload: { title: string; description: string; color: string; dueDate?: string }) {
  if (!goal.value) return
  goalsStore.updateGoal(goal.value.id, {
    title: payload.title,
    description: payload.description || undefined,
    color: payload.color,
    dueDate: payload.dueDate,
  })
}

function handleGoalDeleted() {
  router.push('/')
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
          type="button" class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="viewMode === 'graph' ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
          @click="viewMode = 'graph'"
        >
          {{ $t('goalCanvas.graph') }}
        </button>
        <button
          type="button" class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="viewMode === 'list' ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
          @click="viewMode = 'list'"
        >
          {{ $t('goalCanvas.list') }}
        </button>
      </div>
    </div>

    <GraphCanvas
      v-if="viewMode === 'graph'"
      :goal="goal"
      @open-step="handleOpenStep"
      @edit-goal="isEditModalOpen = true"
      @goal-deleted="handleGoalDeleted"
    />
    <StepTreeList v-else :goal="goal" @open-step="handleOpenStep" />

    <StepModal :goal-id="goal.id" :step-id="openStepId" @close="openStepId = null" />

    <GoalFormModal
      v-model="isEditModalOpen"
      mode="edit"
      :initial="goal"
      @submit="handleEditSubmit"
    />
  </div>
  <div v-else class="text-sage">
    {{ $t('goalCanvas.notFound') }}
  </div>
</template>