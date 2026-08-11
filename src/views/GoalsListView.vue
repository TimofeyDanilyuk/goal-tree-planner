<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '../stores/goals'
import { getGoalProgress } from '../utils/progress'
import { sortGoalsByDueDate, isGoalOverdue } from '../utils/dueDate'
import { confirmDialog, alertDialog } from '../composables/useConfirm'
import GrowthRing from '../components/GrowthRing.vue'
import GoalFormModal from '../components/modals/GoalFormModal.vue'
import ContextMenu, { type MenuItem } from '../components/ContextMenu.vue'
import type { Goal } from '../types/goal'

const goalsStore = useGoalsStore()
const router = useRouter()
const { t } = useI18n()

const search = ref('')
const statusFilter = ref<'active' | 'archived'>('active')

const filteredGoals = computed(() => {
  const source = statusFilter.value === 'active' ? goalsStore.activeGoals : goalsStore.archivedGoals
  const query = search.value.trim().toLowerCase()
  const matches = query ? source.filter(g => g.title.toLowerCase().includes(query)) : [...source]
  return sortGoalsByDueDate(matches)
})

const emptyMessage = computed(() => {
  if (search.value.trim()) return t('goalsList.emptySearch')
  return statusFilter.value === 'active' ? t('goalsList.empty') : t('goalsList.emptyArchived')
})

// --- создание / редактирование цели ---
const isModalOpen = ref(false)
const editingGoal = ref<Goal | null>(null)

function openCreateModal() {
  editingGoal.value = null
  isModalOpen.value = true
}

function openEditModal(goal: Goal) {
  editingGoal.value = goal
  isModalOpen.value = true
}

function formatDueDate(dueDate: string): string {
  const [yy, mm, dd] = dueDate.split('-').map(Number)
  return new Date(yy, (mm ?? 1) - 1, dd ?? 1).toLocaleDateString()
}

function handleSubmit(payload: { title: string; description: string; color: string; dueDate?: string }) {
  if (editingGoal.value) {
    goalsStore.updateGoal(editingGoal.value.id, {
      title: payload.title,
      description: payload.description || undefined,
      color: payload.color,
      dueDate: payload.dueDate,
    })
  } else {
    goalsStore.addGoal(payload.title, payload.description || undefined, payload.color, payload.dueDate)
  }
}

// --- архивация / удаление ---
async function toggleArchive(goal: Goal) {
  goalsStore.setGoalStatus(goal.id, goal.status === 'archived' ? 'active' : 'archived')
}

async function handleDelete(goal: Goal) {
  const ok = await confirmDialog({
    title: t('goalsList.confirmDeleteTitle'),
    message: t('goalsList.confirmDelete', { title: goal.title }),
    danger: true,
  })
  if (!ok) return
  goalsStore.deleteGoal(goal.id)
}

// --- контекстное меню карточки (правый клик / долгий тап) ---
const menuState = ref<{ visible: boolean; x: number; y: number; goal: Goal | null }>({
  visible: false, x: 0, y: 0, goal: null,
})

function openCardMenu(goal: Goal, x: number, y: number) {
  menuState.value = { visible: true, x, y, goal }
}

const cardMenuItems = computed<MenuItem[]>(() => {
  const goal = menuState.value.goal
  if (!goal) return []
  return [
    { label: t('goalsList.menuOpen'), onClick: () => router.push(`/goal/${goal.id}`) },
    { label: t('goalsList.menuEdit'), onClick: () => openEditModal(goal) },
    {
      label: goal.status === 'archived' ? t('goalsList.menuUnarchive') : t('goalsList.menuArchive'),
      onClick: () => toggleArchive(goal),
    },
    { label: t('goalsList.menuDelete'), danger: true, onClick: () => handleDelete(goal) },
  ]
})

let pressTimer: ReturnType<typeof setTimeout> | null = null
let longPressFired = false

function handlePointerDown(event: PointerEvent, goal: Goal) {
  if (event.pointerType !== 'touch') return
  longPressFired = false
  pressTimer = setTimeout(() => {
    longPressFired = true
    openCardMenu(goal, event.clientX, event.clientY)
  }, 500)
}

function cancelPress() {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
}

function handleCardClick(goal: Goal) {
  if (longPressFired) {
    longPressFired = false
    return
  }
  router.push(`/goal/${goal.id}`)
}

function handleCardContextMenu(event: MouseEvent, goal: Goal) {
  event.preventDefault()
  openCardMenu(goal, event.clientX, event.clientY)
}

// --- бэкап ---
const fileInput = ref<HTMLInputElement | null>(null)

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
    ? ((await confirmDialog({ title: t('backup.confirmReplaceTitle'), message: t('backup.confirmReplace') })) ? 'replace' : 'merge')
    : 'replace'

  try {
    await goalsStore.importBackup(text, mode)
  } catch {
    await alertDialog(t('backup.importError'), t('backup.importErrorTitle'))
  }

  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
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

        <button type="button" class="min-h-11 px-4 rounded-full bg-moss text-paper font-medium text-sm hover:bg-moss-dark hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:translate-y-0 transition" @click="openCreateModal">
          {{ $t('goalsList.addGoal') }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <div class="flex rounded-full border border-sage/25 p-0.5 bg-white dark:bg-dusk-dim">
        <button
          type="button" class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="statusFilter === 'active' ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
          @click="statusFilter = 'active'"
        >
          {{ $t('goalsList.filterActive') }}
        </button>
        <button
          type="button" class="h-9 px-3 rounded-full text-sm font-medium transition"
          :class="statusFilter === 'archived' ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
          @click="statusFilter = 'archived'"
        >
          {{ $t('goalsList.filterArchived') }}
        </button>
      </div>

      <input
        v-model="search" type="search" :placeholder="$t('goalsList.searchPlaceholder')"
        class="flex-1 min-w-[180px] h-9 px-3 rounded-full border border-sage/25 bg-white dark:bg-dusk-dim text-sm text-ink dark:text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-moss"
      >
    </div>

    <p v-if="filteredGoals.length === 0" class="text-sage">
      {{ emptyMessage }}
    </p>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="goal in filteredGoals" :key="goal.id"
        class="flex items-start gap-4 p-5 rounded-2xl border border-sage/20 bg-white dark:bg-dusk-dim hover:border-moss/50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer select-none"
        @click="handleCardClick(goal)"
        @contextmenu="handleCardContextMenu($event, goal)"
        @pointerdown="handlePointerDown($event, goal)"
        @pointerup="cancelPress"
        @pointermove="cancelPress"
        @pointerleave="cancelPress"
      >
        <GrowthRing
          :progress="getGoalProgress(goal)" :size="44" :stroke-width="3"
          :color="goal.color"
        />
        <div class="min-w-0 flex-1">
          <h2 class="font-display font-semibold text-ink dark:text-paper truncate">
            {{ goal.title }}
          </h2>
          <p v-if="goal.description" class="text-sm text-sage mt-0.5 line-clamp-2">
            {{ goal.description }}
          </p>
          <span
            v-if="goal.dueDate"
            class="inline-flex items-center gap-1 text-xs mt-1.5 font-medium"
            :class="isGoalOverdue(goal) ? 'text-red-500' : 'text-sage'"
          >
            <svg v-if="isGoalOverdue(goal)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ $t('goalsList.dueDateLabel', { date: formatDueDate(goal.dueDate) }) }}
          </span>
        </div>
      </div>
    </div>

    <GoalFormModal
      v-model="isModalOpen"
      :mode="editingGoal ? 'edit' : 'create'"
      :initial="editingGoal ?? undefined"
      @submit="handleSubmit"
    />

    <ContextMenu
      :visible="menuState.visible"
      :x="menuState.x"
      :y="menuState.y"
      :items="cardMenuItems"
      @close="menuState.visible = false"
    />
  </div>
</template>