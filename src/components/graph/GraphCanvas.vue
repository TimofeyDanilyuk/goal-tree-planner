<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useI18n } from 'vue-i18n'
import type { Goal, Step } from '../../types/goal'
import { useGoalsStore } from '../../stores/goals'
import { getStepProgress, getGoalProgress } from '../../utils/progress'
import { isOverdue } from '../../utils/dueDate'
import { layoutGoalTree } from '../../utils/treeLayout'
import { findStepById } from '../../utils/tree'
import StepNode from './StepNode.vue'
import ContextMenu, { type MenuItem } from '../ContextMenu.vue'
import DueDateModal from '../modals/DueDateModal.vue'

import { confirmDialog } from '../../composables/useConfirm'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const props = defineProps<{ goal: Goal }>()
const emit = defineEmits<{
  'open-step': [stepId: string]
  'edit-goal': []
  'goal-deleted': []
}>()

const goalsStore = useGoalsStore()
const { t } = useI18n()
const nodeTypes = { step: markRaw(StepNode) }
const { fitView, setNodes, setEdges } = useVueFlow()

async function alignGraph() {
  goalsStore.resetStepPositions(props.goal.id)
  await nextTick()
  fitView({ padding: 0.2, duration: 300 })
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap(s => [s, ...flattenSteps(s.children)])
}

const menuState = ref<{ visible: boolean; x: number; y: number; targetId: string | null; isGoal: boolean }>({
  visible: false, x: 0, y: 0, targetId: null, isGoal: false,
})

function openContextMenu(targetId: string, x: number, y: number, isGoal = false) {
  menuState.value = { visible: true, x, y, targetId, isGoal }
}

function closeContextMenu() {
  menuState.value.visible = false
}

const activeStep = computed(() => {
  if (menuState.value.isGoal || !menuState.value.targetId) return null
  return findStepById(props.goal.steps, menuState.value.targetId)
})

const dueDateModal = ref(false)

function openDueDate() {
  closeContextMenu()
  dueDateModal.value = true
}

function saveDueDate(dueDate?: string) {
  if (menuState.value.isGoal) {
    goalsStore.updateGoal(props.goal.id, { dueDate })
  } else if (menuState.value.targetId) {
    goalsStore.updateStep(props.goal.id, menuState.value.targetId, { dueDate })
  }
}

const contextMenuItems = computed<MenuItem[]>(() => {
  if (menuState.value.isGoal) {
    return [
      { label: t('goalsList.menuEdit'), onClick: () => emit('edit-goal') },
      { label: t('dueDateMenu.set'), onClick: openDueDate },
      {
        label: props.goal.status === 'archived' ? t('goalsList.menuUnarchive') : t('goalsList.menuArchive'),
        onClick: () => goalsStore.setGoalStatus(props.goal.id, props.goal.status === 'archived' ? 'active' : 'archived'),
      },
      {
        label: t('goalsList.menuDelete'),
        danger: true,
        onClick: async () => {
          const ok = await confirmDialog({
            title: t('goalsList.confirmDeleteTitle'),
            message: t('goalsList.confirmDelete', { title: props.goal.title }),
            danger: true,
          })
          if (!ok) return
          goalsStore.deleteGoal(props.goal.id)
          emit('goal-deleted')
        },
      },
    ]
  }

  const step = activeStep.value
  if (!step) return []

  const items: MenuItem[] = [
    { label: t('stepNode.menuOpen'), onClick: () => emit('open-step', step.id) },
    { label: t('stepNode.menuAddChild'), onClick: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep'), step.id) },
    { label: t('dueDateMenu.set'), onClick: openDueDate },
  ]

  if (step.status !== 'done') {
    items.push({
      label: t('stepNode.menuMarkDone'),
      onClick: () => goalsStore.updateStep(props.goal.id, step.id, { status: 'done' }),
    })
  }

  items.push({
    label: step.children.length ? t('stepModal.deleteStepWithChildren') : t('stepModal.deleteStep'),
    danger: true,
    onClick: async () => {
      const message = step.children.length
        ? t('stepModal.confirmDeleteStepWithChildren', { title: step.title })
        : t('stepModal.confirmDeleteStep', { title: step.title })
      const ok = await confirmDialog({ title: t('stepModal.deleteStep'), message, danger: true })
      if (!ok) return
      goalsStore.deleteStep(props.goal.id, step.id)
    },
  })

  return items
})

const nodes = computed(() => {
  const layout = layoutGoalTree(props.goal)
  const layoutMap = new Map(layout.map(l => [l.id, l]))
  const allSteps = flattenSteps(props.goal.steps)

  const goalColor = props.goal.color

  const rootNode = {
    id: props.goal.id,
    type: 'step',
    position: layoutMap.get(props.goal.id) ?? { x: 0, y: 0 },
    data: {
      title: props.goal.title,
      progress: getGoalProgress(props.goal),
      status: 'in_progress' as const,
      isRoot: true,
      color: goalColor,
      dueDate: props.goal.dueDate,
      overdue: isOverdue(props.goal.dueDate, props.goal.status === 'done' ? 'done' : undefined),
      onOpen: () => emit('edit-goal'),
      onAddChild: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep')),
      onContextMenu: (x: number, y: number) => openContextMenu(props.goal.id, x, y, true),
    },
  }

  const stepNodes = allSteps.map(step => ({
    id: step.id,
    type: 'step',
    position: step.position ?? layoutMap.get(step.id) ?? { x: 0, y: 0 },
    data: {
      title: step.title,
      progress: getStepProgress(step),
      status: step.status,
      color: goalColor,
      dueDate: step.dueDate,
      overdue: isOverdue(step.dueDate, step.status === 'done' ? 'done' : undefined),
      onOpen: () => emit('open-step', step.id),
      onAddChild: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep'), step.id),
      onContextMenu: (x: number, y: number) => openContextMenu(step.id, x, y),
    },
  }))

  return [rootNode, ...stepNodes]
})

const edges = computed(() => {
  const allSteps = flattenSteps(props.goal.steps)
  const edgeColor = props.goal.color ?? 'var(--color-sage)'
  return allSteps.map(step => ({
    id: `e-${step.parentId ?? props.goal.id}-${step.id}`,
    source: step.parentId ?? props.goal.id,
    target: step.id,
    type: 'smoothstep',
    style: { stroke: edgeColor, strokeWidth: 2 },
  }))
})

watch(nodes, (val) => setNodes(val))
watch(edges, (val) => setEdges(val))

function handleNodeDragStop({ node }: { node: { id: string; position: { x: number; y: number } } }) {
  if (node.id === props.goal.id) return
  goalsStore.updateStep(props.goal.id, node.id, { position: node.position })
}
</script>

<template>
  <div
    class="relative min-h-105 rounded-2xl border border-sage/20 overflow-hidden bg-paper-dim/40 dark:bg-dusk-dim/40"
    style="height: 70vh; height: 70dvh"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :nodes-connectable="false"
      :pan-on-drag="true"
      :zoom-on-pinch="true"
      :zoom-on-scroll="true"
      :zoom-on-double-click="false"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      @node-drag-stop="handleNodeDragStop"
    >
      <Background :gap="24" pattern-color="var(--color-sage)" />
      <Controls />
    </VueFlow>

    <button
      type="button"
      :aria-label="t('goalCanvas.alignGraph')"
      :title="t('goalCanvas.alignGraph')"
      class="absolute top-3 right-3 z-10 h-9 w-9 rounded-full flex items-center justify-center bg-white dark:bg-dusk-dim border border-sage/25 text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper shadow-sm transition"
      @click="alignGraph"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h16" />
      </svg>
    </button>

    <ContextMenu
      :visible="menuState.visible"
      :x="menuState.x"
      :y="menuState.y"
      :items="contextMenuItems"
      @close="closeContextMenu"
    />
  </div>

  <DueDateModal
    v-model="dueDateModal"
    :title="menuState.isGoal ? t('dueDateMenu.goal') : t('dueDateMenu.step')"
    :initial="menuState.isGoal
      ? props.goal.dueDate
      : (activeStep?.dueDate ?? undefined)"
    @submit="saveDueDate"
  />
</template>

<style scoped>
:deep(.vue-flow__pane) {
  touch-action: none;
}

:deep(.vue-flow__controls-button) {
  width: 44px;
  height: 44px;
}

:deep(.vue-flow__controls-button:hover) {
  background-color: var(--color-sage) !important;
  opacity: 0.15;
}
</style>