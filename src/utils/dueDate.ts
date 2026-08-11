import type { Goal, Step } from '../types/goal'

// нормализуем дату-строку до полночи локального времени
function parseDueDate(dueDate?: string): Date | null {
  if (!dueDate) return null
  const [y, m, d] = dueDate.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// просрочен ли дедлайн
export function isOverdue(dueDate?: string, status?: 'done'): boolean {
  if (!dueDate || status === 'done') return false
  const due = parseDueDate(dueDate)
  if (!due) return false
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return due.getTime() < today.getTime()
}

// количество дней до/после дедлайна
export function daysUntil(dueDate?: string): number | null {
  const due = parseDueDate(dueDate)
  if (!due) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

export function formatDueLabel(dueDate: string, locale: string): string {
  const days = daysUntil(dueDate) ?? 0
  const [yy, mm, dd] = dueDate.split('-').map(Number)
  const dateLabel = new Date(yy, (mm ?? 1) - 1, dd ?? 1)
    .toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  if (days === 0) return `${dateLabel} · ${i18nToday(locale)}`
  if (days === 1) return `${dateLabel} · ${i18nTomorrow(locale)}`
  if (days === -1) return `${dateLabel} · ${i18nYesterday(locale)}`
  if (days < 0) return `${dateLabel} · ${i18nOverdue(locale, -days)}`
  return dateLabel
}

function i18nToday(locale: string): string {
  return locale.startsWith('ru') ? 'сегодня' : 'today'
}
function i18nTomorrow(locale: string): string {
  return locale.startsWith('ru') ? 'завтра' : 'tomorrow'
}
function i18nYesterday(locale: string): string {
  return locale.startsWith('ru') ? 'вчера' : 'yesterday'
}
function i18nOverdue(locale: string, days: number): string {
  return locale.startsWith('ru')
    ? `просрочено на ${days} дн.`
    : `${days} day${days === 1 ? '' : 's'} overdue`
}

// есть ли у цели/шага дедлайн и он просрочен
export function isGoalOverdue(goal: Goal): boolean {
  return isOverdue(goal.dueDate, goal.status === 'done' ? 'done' : undefined)
}

// ближайший дедлайн среди цели и всех её шагов
export function nearestDueDate(goal: Goal): string | null {
  const candidates: (string | undefined)[] = [goal.dueDate, ...collectStepDueDates(goal.steps)]
  const present = candidates.filter((d): d is string => !!d)
  if (present.length === 0) return null
  present.sort((a, b) => a.localeCompare(b))
  return present[0]
}

function collectStepDueDates(steps: Step[]): (string | undefined)[] {
  return steps.flatMap(s => [s.dueDate, ...collectStepDueDates(s.children)])
}

// сортировка целей по сроку цели без срока в конце
export function sortGoalsByDueDate(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const da = nearestDueDate(a)
    const db = nearestDueDate(b)
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.localeCompare(db)
  })
}