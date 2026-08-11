<script setup lang="ts">
import { ref } from 'vue'
import type { Step } from '../../types/goal'
import { getStepProgress } from '../../utils/progress'

defineOptions({ name: 'StepTreeItem' })

const props = defineProps<{
  step: Step
  depth: number
}>()

const emit = defineEmits<{ open: [stepId: string] }>()

// верхние два уровня разворачиваем сразу, глубже - по клику, чтобы не заваливать экран
const expanded = ref(props.depth < 2)
const progress = getStepProgress(props.step)

const statusDot: Record<string, string> = {
  todo: 'bg-sage',
  in_progress: 'bg-ochre',
  done: 'bg-moss',
}
</script>

<template>
  <div>
    <div class="flex items-center gap-1 min-h-11 rounded-lg hover:bg-sage/10 transition" :style="{ paddingLeft: `${depth * 18}px` }">
      <button
        v-if="step.children.length"
        type="button"
        aria-label="Свернуть/развернуть"
        class="shrink-0 h-8 w-8 flex items-center justify-center text-sage hover:bg-sage/10 rounded-full transition-colors"
        @click="expanded = !expanded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          class="h-3.5 w-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else class="shrink-0 w-8" />

      <button type="button" class="flex-1 flex items-center gap-2 min-h-11 text-left" @click="emit('open', step.id)">
        <span class="h-2 w-2 rounded-full shrink-0" :class="statusDot[step.status]" />
        <span class="flex-1 text-sm text-ink dark:text-paper truncate">{{ step.title }}</span>
        <span class="text-xs text-sage font-mono shrink-0">{{ Math.round(progress * 100) }}%</span>
      </button>
    </div>

    <div v-if="expanded && step.children.length" class="border-l border-sage/15 ml-4">
      <StepTreeItem
        v-for="child in step.children"
        :key="child.id"
        :step="child"
        :depth="depth + 1"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>