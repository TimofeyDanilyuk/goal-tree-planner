<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'

const { locale } = useI18n()
</script>

<template>
  <div class="flex rounded-full border border-sage/25 p-0.5 bg-paper dark:bg-dusk">
    <button
      type="button"
      class="h-8 px-2.5 rounded-full text-xs font-mono font-medium transition"
      :class="locale === 'ru' ? 'bg-moss text-paper' : 'text-sage hover:bg-sage/10 hover:text-ink dark:hover:text-paper'"
      @click="setLocale('ru')"
    >
      RU
    </button>
    <button
      type="button"
      class="h-8 px-2.5 rounded-full text-xs font-mono font-medium transition"
      :class="locale === 'en' ? 'bg-moss text-paper' : 'text-sage'"
      @click="setLocale('en')"
    >
      EN
    </button>
  </div>
</template>