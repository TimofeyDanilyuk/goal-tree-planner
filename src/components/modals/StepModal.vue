<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import { useGoalsStore } from '../../stores/goals'
import { findStepById } from '../../utils/tree'
import { getStepProgress } from '../../utils/progress'
import GrowthRing from '../GrowthRing.vue'
import { confirmDialog } from '../../composables/useConfirm'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  goalId: string
  stepId: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const goalsStore = useGoalsStore()

const goal = computed(() => goalsStore.goals.find(g => g.id === props.goalId))
const step = computed(() => {
  if (!goal.value || !props.stepId) return null
  return findStepById(goal.value.steps, props.stepId)
})

const isOpen = computed(() => !!step.value)
const progress = computed(() => (step.value ? getStepProgress(step.value) : 0))
const allTodosDone = computed(() =>
  !!step.value && step.value.todos.length > 0 && step.value.todos.every(t => t.done)
)

const titleDraft = ref('')
const descriptionDraft = ref('')
const newTodoText = ref('')
const draggedTodoId = ref<string | null>(null)

// подтягиваем актуальные значения в драфты при каждом открытии нового шага
watch(step, (s) => {
  titleDraft.value = s?.title ?? ''
  descriptionDraft.value = s?.description ?? ''
}, { immediate: true })

function saveTitle() {
  if (!step.value || !titleDraft.value.trim()) return
  goalsStore.updateStep(props.goalId, step.value.id, { title: titleDraft.value.trim() })
}

function saveDescription() {
  if (!step.value) return
  goalsStore.updateStep(props.goalId, step.value.id, { description: descriptionDraft.value.trim() })
}

function addTodo() {
  if (!step.value || !newTodoText.value.trim()) return
  goalsStore.addTodo(props.goalId, step.value.id, newTodoText.value.trim())
  newTodoText.value = ''
}

function toggleTodo(todoId: string) {
  if (!step.value) return
  goalsStore.toggleTodo(props.goalId, step.value.id, todoId)
}

function removeTodo(todoId: string) {
  if (!step.value) return
  goalsStore.deleteTodo(props.goalId, step.value.id, todoId)
}

function markDone() {
  if (!step.value) return
  goalsStore.updateStep(props.goalId, step.value.id, { status: 'done' })
}

async function deleteStep() {
  if (!step.value) return
  const message = step.value.children.length > 0
    ? t('stepModal.confirmDeleteStepWithChildren', { title: step.value.title })
    : t('stepModal.confirmDeleteStep', { title: step.value.title })
  const ok = await confirmDialog({ title: t('stepModal.deleteStep'), message, danger: true })
  if (!ok) return
  goalsStore.deleteStep(props.goalId, step.value.id)
  emit('close')
}

function handleDragStart(todoId: string) {
  draggedTodoId.value = todoId
}

function handleDrop(targetTodoId: string) {
  if (!step.value || !draggedTodoId.value || draggedTodoId.value === targetTodoId) return
  const todos = step.value.todos
  const fromIdx = todos.findIndex(t => t.id === draggedTodoId.value)
  const toIdx = todos.findIndex(t => t.id === targetTodoId)
  if (fromIdx === -1 || toIdx === -1) return
  const reordered = [...todos]
  const [moved] = reordered.splice(fromIdx, 1)
  reordered.splice(toIdx, 0, moved)
  goalsStore.reorderTodos(props.goalId, step.value.id, reordered.map(t => t.id))
  draggedTodoId.value = null
}
</script>

<template>
  <BaseModal
    :model-value="isOpen"
    title="Шаг"
    @update:model-value="(val) => !val && emit('close')"
  >
    <div v-if="step" class="space-y-5">
      <input
        v-model="titleDraft"
        type="text"
        class="w-full text-lg font-display font-semibold bg-transparent border-b border-transparent focus:border-sage/40 focus:outline-none text-ink dark:text-paper pb-1"
        @blur="saveTitle"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
      >

      <textarea
        v-model="descriptionDraft"
        rows="2"
        :placeholder="$t('stepModal.descriptionPlaceholder')"
        class="w-full text-sm bg-transparent border-b border-transparent focus:border-sage/40 focus:outline-none text-sage placeholder:text-sage/50 resize-none"
        @blur="saveDescription"
      />

      <div class="flex items-center gap-3">
        <GrowthRing :progress="progress" :size="40" :stroke-width="3" :show-label="false" />
        <span class="text-sm text-sage">
          {{ $t('stepModal.progress', { done: step.todos.filter(t => t.done).length, total: step.todos.length }) }}
        </span>
      </div>

      <div
        v-if="allTodosDone && step.status !== 'done'"
        class="flex items-center justify-between gap-3 p-3 rounded-xl bg-moss-soft dark:bg-moss/10 text-sm"
      >
        <span class="text-ink dark:text-paper">{{ $t('stepModal.allDone') }}</span>
        <button type="button" class="shrink-0 px-3 h-8 rounded-full bg-moss text-paper text-xs font-medium hover:bg-moss-dark hover:shadow-sm" @click="markDone">
          {{ $t('stepModal.markDone') }}
        </button>
      </div>

      <div class="space-y-1">
        <div
          v-for="todo in step.todos"
          :key="todo.id"
          draggable="true"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sage/5 cursor-grab active:cursor-grabbing"
          @dragstart="handleDragStart(todo.id)"
          @dragover.prevent
          @drop="handleDrop(todo.id)"
        >
          <span class="text-sage/40 text-xs select-none">⋮⋮</span>
          <button
            type="button"
            :aria-label="todo.done ? 'Снять отметку' : 'Отметить выполненным'"
            class="shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition"
           :class="todo.done ? 'bg-moss border-moss hover:bg-moss-dark' : 'border-sage/40 hover:border-moss/60 hover:bg-moss/5'"
            @click="toggleTodo(todo.id)"
          >
            <svg v-if="todo.done" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" class="h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <span class="flex-1 text-sm" :class="todo.done ? 'line-through text-sage' : 'text-ink dark:text-paper'">
            {{ todo.text }}
          </span>
          <button
            type="button"
            aria-label="Удалить пункт"
            class="shrink-0 h-7 w-7 rounded-full hover:bg-red-500/10 text-sage/60 hover:text-red-500/80 text-xs transition"
            @click="removeTodo(todo.id)"
          >
            ✕
          </button>
        </div>
      </div>

      <form class="flex gap-2" @submit.prevent="addTodo">
        <input
          v-model="newTodoText"
          type="text"
          :placeholder="$t('stepModal.addTodoPlaceholder')"
          class="flex-1 h-10 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-sm text-ink dark:text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-moss"
        >
        <button type="submit" class="h-10 px-4 rounded-xl bg-moss/10 text-moss text-sm font-medium hover:bg-moss/25 hover:text-moss-dark transition">
          {{ $t('stepModal.add') }}
        </button>
      </form>

      <button type="button" class="text-sm text-red-500/80 hover:text-red-500 hover:underline transition" @click="deleteStep">
        {{ step.children.length ? $t('stepModal.deleteStepWithChildren') : $t('stepModal.deleteStep') }}
      </button>
    </div>
  </BaseModal>
</template>