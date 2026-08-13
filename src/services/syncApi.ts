import { API_BASE } from '../config'
import { useAuthStore } from '../stores/auth'

interface AuthResponse {
  token: string
  userId: string
  username: string
}

const LAST_SYNC_KEY = 'goal-tree:last-sync-at'

export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY)
}

export function setLastSyncedAt(value: string) {
  localStorage.setItem(LAST_SYNC_KEY, value)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data as any)?.error ?? `Ошибка запроса (${res.status})`)
  }
  return data as T
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function pullGoals(): Promise<{ goals: unknown[]; updatedAt: string | null }> {
  return request('/sync', { method: 'GET' })
}

export async function pushGoals(goals: unknown[]): Promise<{ ok: true; updatedAt: string }> {
  const res = await request<{ ok: true; updatedAt: string }>('/sync', { method: 'PUT', body: JSON.stringify({ goals }) })
  setLastSyncedAt(res.updatedAt)
  return res
}