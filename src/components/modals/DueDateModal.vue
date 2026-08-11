<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'

const props = defineProps<{
  modelValue: boolean
  initial?: string
  title: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [dueDate?: string]
}>()

const draft = ref('')

watch(() => props.modelValue, (open) => {
  if (open) draft.value = props.initial ?? ''
})

function handleSubmit() {
  emit('submit', draft.value || undefined)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="emit('update:modelValue', $event)">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <input
        v-model="draft" type="date"
        class="w-full h-11 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-moss"
      >
      <button type="submit" class="w-full min-h-11 rounded-xl bg-moss text-paper font-medium hover:bg-moss-dark hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] active:translate-y-0 transition">
        {{ $t('dueDateModal.save') }}
      </button>
    </form>
  </BaseModal>
</template>