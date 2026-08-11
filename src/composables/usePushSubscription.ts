import { useGoalsStore } from '../stores/goals'
import { daysUntil } from '../utils/dueDate'
import type { Goal, Step } from '../types/goal'

const PUSH_WORKER_URL = 'https://goal-tree-push-worker.timofei-danilyuk.workers.dev'
const VAPID_PUBLIC_KEY = 'BM0XiYBtH6TZqNfJW2_68RgMp-eV0YgNaFHly7Kv68AqmqRKhwZUKuj3nAtRp7bhgXrKJdmK_L41KtP9keAdCVo'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const array = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return array
}

function collectDueItems(goals: Goal[]) {
  const items: { key: string; title: string; dueDate: string; url: string }[] = []

  function walk(steps: Step[], goalId: string, goalTitle: string) {
    for (const step of steps) {
      if (step.dueDate && step.status !== 'done') {
        items.push({
          key: `${goalId}:${step.id}`,
          title: `${goalTitle} · ${step.title}`,
          dueDate: step.dueDate,
          url: `#/goal/${goalId}`,
        })
      }
      walk(step.children, goalId, goalTitle)
    }
  }

  for (const goal of goals) {
    if (goal.status !== 'active') continue
    if (goal.dueDate) {
      items.push({ key: `${goal.id}:goal`, title: goal.title, dueDate: goal.dueDate, url: `#/goal/${goal.id}` })
    }
    walk(goal.steps, goal.id, goal.title)
  }

  return items.filter(i => (daysUntil(i.dueDate) ?? 0) <= 7)
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  await syncDueItems(subscription)
  return true
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await fetch(`${PUSH_WORKER_URL}/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  }).catch(() => {})

  await subscription.unsubscribe()
}

export async function syncDueItems(subscriptionArg?: PushSubscription): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = subscriptionArg ?? (await registration.pushManager.getSubscription())
  if (!subscription) return

  const goalsStore = useGoalsStore()
  const items = collectDueItems(goalsStore.goals)

  await fetch(`${PUSH_WORKER_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON(), items }),
  }).catch(() => {})
}