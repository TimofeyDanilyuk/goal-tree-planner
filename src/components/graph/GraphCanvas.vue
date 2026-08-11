<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useI18n } from 'vue-i18n'
import type { Goal, Step } from '../../types/goal'
import { useGoalsStore } from '../../stores/goals'
import { getStepProgress, getGoalProgress } from '../../utils/progress'
import { layoutGoalTree } from '../../utils/treeLayout'
import { findStepById } from '../../utils/tree'
import StepNode from './StepNode.vue'
import ContextMenu, { type MenuItem } from '../ContextMenu.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const props = defineProps<{ goal: Goal }>()
const emit = defineEmits<{ 'open-step': [stepId: string | null] }>()

const goalsStore = useGoalsStore()
const { t } = useI18n()
const nodeTypes = { step: markRaw(StepNode) }

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap(s => [s, ...flattenSteps(s.children)])
}

const menuState = ref<{ visible: boolean; x: number; y: number; stepId: string | null }>({
  visible: false,
  x: 0,
  y: 0,
  stepId: null,
})

function openContextMenu(stepId: string, x: number, y: number) {
  menuState.value = { visible: true, x, y, stepId }
}

function closeContextMenu() {
  menuState.value.visible = false
}

const activeStep = computed(() => {
  if (!menuState.value.stepId) return null
  return findStepById(props.goal.steps, menuState.value.stepId)
})

const contextMenuItems = computed(() => {
  const step = activeStep.value
  if (!step) return []

  const items: MenuItem[] = [
    { label: t('stepNode.menuOpen'), onClick: () => emit('open-step', step.id) },
    { label: t('stepNode.menuAddChild'), onClick: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep'), step.id) },
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
    onClick: () => {
      const message = step.children.length
        ? t('stepModal.confirmDeleteStepWithChildren', { title: step.title })
        : t('stepModal.confirmDeleteStep', { title: step.title })
      if (!confirm(message)) return
      goalsStore.deleteStep(props.goal.id, step.id)
    },
  })

  return items
})

const nodes = computed(() => {
  const layout = layoutGoalTree(props.goal)
  const layoutMap = new Map(layout.map(l => [l.id, l]))
  const allSteps = flattenSteps(props.goal.steps)

  const rootNode = {
    id: props.goal.id,
    type: 'step',
    position: layoutMap.get(props.goal.id) ?? { x: 0, y: 0 },
    data: {
      title: props.goal.title,
      progress: getGoalProgress(props.goal),
      status: 'in_progress' as const,
      isRoot: true,
      onOpen: () => emit('open-step', null),
      onAddChild: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep')),
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
      onOpen: () => emit('open-step', step.id),
      onAddChild: () => goalsStore.addStep(props.goal.id, t('stepNode.newStep'), step.id),
      onContextMenu: (x: number, y: number) => openContextMenu(step.id, x, y),
    },
  }))

  return [rootNode, ...stepNodes]
})

const edges = computed(() => {
  const allSteps = flattenSteps(props.goal.steps)
  return allSteps.map(step => ({
    id: `e-${step.parentId ?? props.goal.id}-${step.id}`,
    source: step.parentId ?? props.goal.id,
    target: step.id,
    type: 'smoothstep',
    style: { stroke: 'var(--color-sage)', strokeWidth: 2 },
  }))
})

function handleNodeDragStop({ node }: { node: { id: string; position: { x: number; y: number } } }) {
  if (node.id === props.goal.id) return
  goalsStore.updateStep(props.goal.id, node.id, { position: node.position })
}
</script>

<template>
  <div class="h-[70vh] h-[70dvh] min-h-[420px] rounded-2xl border border-sage/20 overflow-hidden bg-paper-dim/40 dark:bg-dusk-dim/40">
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

    <ContextMenu
      :visible="menuState.visible"
      :x="menuState.x"
      :y="menuState.y"
      :items="contextMenuItems"
      @close="closeContextMenu"
    />
  </div>
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