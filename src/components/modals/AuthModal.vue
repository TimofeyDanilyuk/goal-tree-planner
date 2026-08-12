<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import { useAuthStore } from '../../stores/auth'
import { useGoalsStore } from '../../stores/goals'
import { confirmDialog } from '../../composables/useConfirm'
import * as syncApi from '../../services/syncApi'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const { t } = useI18n()
const authStore = useAuthStore()
const goalsStore = useGoalsStore()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function close() {
  emit('update:modelValue', false)
  username.value = ''
  password.value = ''
  error.value = ''
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      const session = await syncApi.register(username.value.trim(), password.value)
      authStore.setSession(session)

      if (goalsStore.goals.length > 0) {
        const upload = await confirmDialog({
          title: t('auth.migrateTitle'),
          message: t('auth.migrateMessage'),
        })
        if (upload) await syncApi.pushGoals(goalsStore.goals)
      }
    } else {
      const session = await syncApi.login(username.value.trim(), password.value)
      authStore.setSession(session)

      if (goalsStore.goals.length === 0) {
        const server = await syncApi.pullGoals()
        if (server.goals.length > 0) {
          await goalsStore.importBackup(JSON.stringify(server.goals), 'replace')
        }
      } else {
        const useServer = await confirmDialog({
          title: t('auth.conflictTitle'),
          message: t('auth.conflictMessage'),
          confirmLabel: t('auth.useServerData'),
          cancelLabel: t('auth.keepLocalData'),
        })
        if (useServer) {
          const server = await syncApi.pullGoals()
          await goalsStore.importBackup(JSON.stringify(server.goals), 'replace')
        } else {
          await syncApi.pushGoals(goalsStore.goals)
        }
      }
    }
    close()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="mode === 'login' ? $t('auth.loginTitle') : $t('auth.registerTitle')"
    @update:model-value="close"
  >
    <div class="flex rounded-full border border-sage/25 p-0.5 mb-4 bg-paper dark:bg-dusk">
      <button type="button" class="flex-1 h-9 rounded-full text-sm font-medium transition" :class="mode === 'login' ? 'bg-moss text-paper' : 'text-sage'" @click="mode = 'login'">
        {{ $t('auth.login') }}
      </button>
      <button type="button" class="flex-1 h-9 rounded-full text-sm font-medium transition" :class="mode === 'register' ? 'bg-moss text-paper' : 'text-sage'" @click="mode = 'register'">
        {{ $t('auth.register') }}
      </button>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-ink dark:text-paper mb-1">{{ $t('auth.username') }}</label>
        <input v-model="username" type="text" required minlength="3" autocomplete="username"
          class="w-full h-11 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-moss">
      </div>
      <div>
        <label class="block text-sm font-medium text-ink dark:text-paper mb-1">{{ $t('auth.password') }}</label>
        <input v-model="password" type="password" required minlength="6" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          class="w-full h-11 px-3 rounded-xl border border-sage/30 bg-white dark:bg-dusk text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-moss">
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <button type="submit" :disabled="loading" class="w-full min-h-11 rounded-xl bg-moss text-paper font-medium hover:bg-moss-dark transition disabled:opacity-50">
        {{ loading ? $t('auth.loading') : (mode === 'login' ? $t('auth.login') : $t('auth.register')) }}
      </button>
    </form>
  </BaseModal>
</template>