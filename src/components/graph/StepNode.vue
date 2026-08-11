<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { useI18n } from 'vue-i18n'
import GrowthRing from '../GrowthRing.vue'

interface StepNodeData {
  title: string
  progress: number
  status: 'todo' | 'in_progress' | 'done'
  isRoot?: boolean
  onOpen: () => void
  onAddChild: () => void
  onContextMenu?: (x: number, y: number) => void
}

const props = defineProps<NodeProps<StepNodeData>>()
const { t } = useI18n()

const statusDot: Record<string, string> = {
  todo: 'bg-sage',
  in_progress: 'bg-ochre',
  done: 'bg-moss',
}

// правый клик на десктопе
function handleContextMenu(event: MouseEvent) {
  if (!props.data.onContextMenu) return
  event.preventDefault()
  props.data.onContextMenu(event.clientX, event.clientY)
}

// на тач-экранах большинство браузеров тоже шлют contextmenu по долгому нажатию,
// но держим свой таймер как резерв на случай если конкретный браузер этого не делает
let pressTimer: ReturnType<typeof setTimeout> | null = null
let longPressFired = false

function handlePointerDown(event: PointerEvent) {
  if (event.pointerType !== 'touch' || !props.data.onContextMenu) return
  if ((event.target as HTMLElement).closest('button')) return
  longPressFired = false
  pressTimer = setTimeout(() => {
    longPressFired = true
    props.data.onContextMenu?.(event.clientX, event.clientY)
  }, 500)
}

function cancelPress() {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
}

function handleClick() {
  // после долгого нажатия гасим последующий клик - иначе на закрытие меню
  // среагирует ещё и обычное открытие модалки
  if (longPressFired) {
    longPressFired = false
    return
  }
  props.data.onOpen()
}
</script>

<template>
  <div
    class="relative rounded-2xl border bg-white dark:bg-dusk-dim shadow-sm hover:shadow-md hover:border-moss/40 transition-all px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
    :class="props.data.isRoot ? 'border-ink/30 dark:border-paper/30 min-w-[220px]' : 'border-sage/25 min-w-[200px]'"
    @click="handleClick"
    @contextmenu="handleContextMenu"
    @pointerdown="handlePointerDown"
    @pointerup="cancelPress"
    @pointermove="cancelPress"
    @pointerleave="cancelPress"
  >
    <Handle type="target" :position="Position.Top" class="!bg-sage !w-2 !h-2 !border-0" />

    <GrowthRing :progress="props.data.progress" :size="36" :stroke-width="3" :show-label="false" />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span v-if="!props.data.isRoot" class="h-1.5 w-1.5 rounded-full shrink-0" :class="statusDot[props.data.status]" />
        <span class="font-medium text-sm text-ink dark:text-paper truncate">{{ props.data.title }}</span>
      </div>
      <span class="text-xs text-sage font-mono">{{ Math.round(props.data.progress * 100) }}%</span>
    </div>

    <button
      type="button"
      :aria-label="t('stepNode.addChild')"
      class="shrink-0 h-8 w-8 rounded-full bg-moss/90 text-paper flex items-center justify-center text-sm hover:bg-moss hover:scale-110 active:scale-95 transition"
      @click.stop="props.data.onAddChild"
    >
      +
    </button>

    <Handle type="source" :position="Position.Bottom" class="!bg-sage !w-2 !h-2 !border-0" />
  </div>
</template>