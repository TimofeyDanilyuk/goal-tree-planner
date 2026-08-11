<script setup lang="ts">
const props = withDefaults(defineProps<{
  progress: number // 0..1
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}>(), {
  size: 48,
  strokeWidth: 4,
  showLabel: true,
})

const clamped = Math.min(Math.max(props.progress, 0), 1)
const radius = props.size / 2 - props.strokeWidth
const circumference = 2 * Math.PI * radius
const offset = circumference * (1 - clamped)
</script>

<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <g class="-rotate-90 origin-center">
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke-width="strokeWidth"
        class="text-sage/25" stroke="currentColor"
      />
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke-width="strokeWidth"
        stroke="currentColor" stroke-linecap="round"
        class="text-moss transition-[stroke-dashoffset] duration-500 ease-out"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </g>
    <text
      v-if="showLabel"
      x="50%" y="50%"
      dominant-baseline="middle" text-anchor="middle"
      class="font-mono fill-current text-ink dark:text-paper"
      :style="{ fontSize: size * 0.22 + 'px' }"
    >
      {{ Math.round(clamped * 100) }}
    </text>
  </svg>
</template>