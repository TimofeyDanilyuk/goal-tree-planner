<script setup lang="ts">
import type { Goal } from '../../types/goal'
import StepTreeItem from './StepTreeItem.vue'

defineProps<{ goal: Goal }>()
const emit = defineEmits<{ 'open-step': [stepId: string] }>()
</script>

<template>
  <div class="rounded-2xl border border-sage/20 bg-white dark:bg-dusk-dim p-2">
    <p v-if="goal.steps.length === 0" class="text-sm text-sage px-3 py-6 text-center">
      {{ $t('stepTree.empty') }}
    </p>
    <StepTreeItem
      v-for="step in goal.steps"
      :key="step.id"
      :step="step"
      :depth="0"
      @open="emit('open-step', $event)"
    />
  </div>
</template>