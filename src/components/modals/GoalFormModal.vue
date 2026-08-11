<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import GrowthRing from '../GrowthRing.vue'

const props = defineProps<{
  modelValue: boolean
  mode?: 'create' | 'edit'
  initial?: { title: string; description?: string; color?: string; dueDate?: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { title: string; description: string; color: string; dueDate?: string }]
}>()

const { t } = useI18n()
const COLORS = ['#3F7859', '#C98A3E', '#5B7FA6', '#A6577F', '#8FA396']

const title = ref('')
const description = ref('')
const color = ref(COLORS[0])
const dueDate = ref('')

watch(() => props.modelValue, (open) => {
  if (!open) return
  title.value = props.initial?.title ?? ''
  description.value = props.initial?.description ?? ''
  color.value = props.initial?.color ?? COLORS[0]
  dueDate.value = props.initial?.dueDate ?? ''
})

const modalTitle = computed(() => (props.mode === 'edit' ? t('goalForm.editTitle') : t('goalForm.title')))
const submitLabel = computed(() => (props.mode === 'edit' ? t('goalForm.save') : t('goalForm.submit')))

function handleSubmit() {
  if (!title.value.trim()) return
  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim(),
    color: color.value,
    dueDate: dueDate.value || undefined,
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="modalTitle" @update:model-value="emit('update:modelValue', $event)">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="goal-title" class="block text-sm font-medium text-ink dark:text-paper mb-1">
          {{ $t('goalForm.name') }}
        </label>
        <input
          id="goal-title" v-model="title" type="text" required autofocus
          :placeholder="$t('goalForm.namePlaceholder')"
          class="w-full h-11 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-moss"
        >
      </div>

      <div>
        <label for="goal-description" class="block text-sm font-medium text-ink dark:text-paper mb-1">
          {{ $t('goalForm.description') }} <span class="text-sage font-normal">{{ $t('goalForm.optional') }}</span>
        </label>
        <textarea
          id="goal-description" v-model="description" rows="3"
          :placeholder="$t('goalForm.descriptionPlaceholder')"
          class="w-full px-3 py-2 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-moss resize-none"
        />
      </div>

      <div>
        <label for="goal-due" class="block text-sm font-medium text-ink dark:text-paper mb-1">
          {{ $t('goalForm.dueDate') }} <span class="text-sage font-normal">{{ $t('goalForm.optional') }}</span>
        </label>
        <input
          id="goal-due" v-model="dueDate" type="date"
          class="w-full h-11 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-moss"
        >
      </div>

      <div>
        <span class="block text-sm font-medium text-ink dark:text-paper mb-2">{{ $t('goalForm.color') }}</span>
        <div class="flex items-center gap-4">
          <GrowthRing :progress="1" :size="44" :stroke-width="3" :show-label="false" :color="color" />
          <div class="flex gap-2">
            <button
              v-for="c in COLORS" :key="c" type="button" :aria-label="c"
              class="h-9 w-9 rounded-full transition hover:scale-110 ring-offset-2 ring-offset-paper dark:ring-offset-dusk-dim"
              :class="color === c ? 'ring-2 ring-ink dark:ring-paper' : ''"
              :style="{ backgroundColor: c }"
              @click="color = c"
            />
          </div>
        </div>
      </div>

      <button type="submit" class="w-full min-h-11 rounded-xl bg-moss text-paper font-medium hover:bg-moss-dark hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] active:translate-y-0 transition">
        {{ submitLabel }}
      </button>
    </form>
  </BaseModal>
</template>