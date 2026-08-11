<script setup lang="ts">
import { useConfirmState, resolveConfirm } from '../composables/useConfirm'
import BaseModal from './BaseModal.vue'

const state = useConfirmState()
</script>

<template>
  <BaseModal
    :model-value="state.visible"
    :title="state.title"
    @update:model-value="(val) => !val && resolveConfirm(false)"
  >
    <p class="text-sm text-ink dark:text-paper mb-5">{{ state.message }}</p>
    <div class="flex gap-2 justify-end">
      <button
        v-if="state.cancelLabel"
        type="button"
        class="min-h-11 px-4 rounded-xl text-sm font-medium text-sage hover:bg-sage/10 transition"
        @click="resolveConfirm(false)"
      >
        {{ state.cancelLabel }}
      </button>
      <button
        type="button"
        class="min-h-11 px-4 rounded-xl text-sm font-medium text-paper transition"
        :class="state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-moss hover:bg-moss-dark'"
        @click="resolveConfirm(true)"
      >
        {{ state.confirmLabel }}
      </button>
    </div>
  </BaseModal>
</template>