import { ref } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { daysUntil } from '../utils/dueDate'
import type { Goal, Step } from '../types/goal'

const permissionGranted = ref(false)
const permissionDenied = ref(false)
const permissionLoading = ref(false)

// ключ, по которому запоминаем, о каких дедлайнах уже уведомляли
const NOTIFIED_KEY = 'goal-tree:notified-due'
const ENABLED_KEY = 'goal-tree:notifications'

function getNotified(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]')
  } catch {
    return []
  }
}

function setNotified(ids: string[]) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids))
}

function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function useNotifications() {
  const goalsStore = useGoalsStore()

  async function requestPermission(): Promise<boolean> {
    if (!supportsNotifications()) return false
    permissionLoading.value = true
    try {
      const result = await Notification.requestPermission()
      permissionGranted.value = result === 'granted'
      permissionDenied.value = result === 'denied'
      return permissionGranted.value
    } finally {
      permissionLoading.value = false
    }
  }

  function notify(title: string, body?: string, url?: string): void {
    if (!supportsNotifications() || Notification.permission !== 'granted') return
    const notification = new Notification(title, { body, icon: '/pwa-192x192.png' })
    if (url) {
      notification.onclick = () => {
        window.focus()
        if (url) window.location.hash = url
        notification.close()
      }
    }
  }

  function collectDued(goal: Goal): { key: string; title: string; dueDate: string; url: string }[] {
    const result: { key: string; title: string; dueDate: string; url: string }[] = []
    const root = { title: goal.title, dueDate: goal.dueDate }
    if (root.dueDate) {
      result.push({ key: `${goal.id}:goal`, title: goal.title, dueDate: root.dueDate, url: `#/goal/${goal.id}` })
    }
    const walk = (steps: Step[], parentTitle: string) => {
      for (const step of steps) {
        if (step.dueDate && step.status !== 'done') {
          result.push({
            key: `${goal.id}:${step.id}`,
            title: `${parentTitle} · ${step.title}`,
            dueDate: step.dueDate,
            url: `#/goal/${goal.id}`,
          })
        }
        walk(step.children, parentTitle)
      }
    }
    walk(goal.steps, goal.title)
    return result
  }

  // проверяем просроченные и ближайшие дедлайны; шлём уведомление один раз на объект
  function checkDueDates(): void {
    if (!supportsNotifications()) return
    if (Notification.permission !== 'granted') return
    if (localStorage.getItem(ENABLED_KEY) === 'off') return
    const notified = new Set(getNotified())

    for (const goal of goalsStore.goals) {
      if (goal.status !== 'active') continue
      for (const item of collectDued(goal)) {
        const days = daysUntil(item.dueDate) ?? 0
        // уведомляем за 1 день, в день дедлайна и о просроченных
        if (days <= 1) {
          if (notified.has(item.key)) continue
          notified.add(item.key)
          const body = days === 0
            ? 'Сегодня'
            : days < 0
              ? `Просрочено на ${-days} дн.`
              : 'Завтра'
          notify(item.title, body, item.url)
        }
      }
    }

    setNotified(Array.from(notified))
  }

  // периодическая проверка пока приложение открыто (раз в час)
  let timer: ReturnType<typeof setInterval> | null = null
  function startPolling(intervalMs = 60 * 60 * 1000): void {
    stopPolling()
    // небольшая задержка, чтобы к этому моменту подгрузились данные из IndexedDB
    setTimeout(checkDueDates, 1500)
    timer = setInterval(checkDueDates, intervalMs)
  }

  function stopPolling(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    permissionGranted,
    permissionDenied,
    permissionLoading,
    requestPermission,
    notify,
    checkDueDates,
    startPolling,
    stopPolling,
  }
}