<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

// блокируем скролл фона пока модалка открыта
watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        @click.self="close"
        @keydown.escape="close"
      >
        <Transition
          enter-active-class="transition duration-250 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 sm:opacity-0"
          enter-to-class="translate-y-0 sm:opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0 sm:opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 sm:opacity-0"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            class="w-full sm:max-w-md bg-paper dark:bg-dusk-dim rounded-t-3xl sm:rounded-2xl border border-sage/20 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div class="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-paper dark:bg-dusk-dim">
              <h2 class="font-display text-lg font-semibold text-ink dark:text-paper">
                {{ title }}
              </h2>
              <button
                type="button"
                aria-label="Закрыть"
                class="h-9 w-9 flex items-center justify-center rounded-full hover:bg-sage/15 hover:text-ink dark:hover:text-paper hover:rotate-90 text-sage transition"
                @click="close"
              >
                ✕
              </button>
            </div>
            <div class="px-5 pb-5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>