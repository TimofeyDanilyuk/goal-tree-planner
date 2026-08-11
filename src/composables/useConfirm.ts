import { reactive } from 'vue'
import { i18n } from '../i18n'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string | null // null = без кнопки отмены (режим alert)
  danger?: boolean
}

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string | null
  danger: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  confirmLabel: '',
  cancelLabel: null,
  danger: false,
  resolve: null,
})

export function useConfirmState() {
  return state
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  const t = i18n.global.t
  return new Promise((resolve) => {
    state.title = options.title
    state.message = options.message
    state.confirmLabel = options.confirmLabel ?? t('common.confirm')
    state.cancelLabel = options.cancelLabel === undefined ? t('common.cancel') : options.cancelLabel
    state.danger = options.danger ?? false
    state.visible = true
    state.resolve = resolve
  })
}

export function alertDialog(message: string, title: string): Promise<void> {
  const t = i18n.global.t
  return confirmDialog({ title, message, confirmLabel: t('common.ok'), cancelLabel: null }).then(() => undefined)
}

export function resolveConfirm(value: boolean) {
  state.visible = false
  state.resolve?.(value)
  state.resolve = null
}