<script setup lang="ts">
import { ref, nextTick, watch, onBeforeUnmount } from 'vue'

export interface MenuItem {
  label: string
  danger?: boolean
  onClick: () => void
}

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  items: MenuItem[]
}>()

const emit = defineEmits<{ close: [] }>()

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(0)
const adjustedY = ref(0)

// подгоняем позицию так, чтобы меню не вылезало за края экрана
async function reposition() {
  adjustedX.value = props.x
  adjustedY.value = props.y
  await nextTick()
  const el = menuRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const margin = 8
  if (rect.right > window.innerWidth - margin) {
    adjustedX.value = Math.max(margin, window.innerWidth - rect.width - margin)
  }
  if (rect.bottom > window.innerHeight - margin) {
    adjustedY.value = Math.max(margin, window.innerHeight - rect.height - margin)
  }
}

function handleClickOutside(event: PointerEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(() => props.visible, (open) => {
  if (open) {
    reposition()
    // вешаем слушатель с отложенным стартом - иначе тот же клик,
    // который открыл меню, тут же его и закроет
    setTimeout(() => window.addEventListener('pointerdown', handleClickOutside), 0)
    window.addEventListener('keydown', handleEscape)
  } else {
    window.removeEventListener('pointerdown', handleClickOutside)
    window.removeEventListener('keydown', handleEscape)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handleClickOutside)
  window.removeEventListener('keydown', handleEscape)
})

function handleItemClick(item: MenuItem) {
  item.onClick()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="fixed z-50 min-w-[190px] py-1.5 rounded-xl border border-sage/20 bg-white dark:bg-dusk-dim shadow-lg"
      :style="{ left: adjustedX + 'px', top: adjustedY + 'px' }"
    >
      <button
        v-for="(item, i) in items"
        :key="i"
        type="button"
        class="w-full text-left px-3.5 h-10 flex items-center text-sm transition-colors"
        :class="item.danger
          ? 'text-red-500/90 hover:bg-red-500/10'
          : 'text-ink dark:text-paper hover:bg-sage/10'"
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>