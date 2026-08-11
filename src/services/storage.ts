import { openDB, type IDBPDatabase } from 'idb'
import type { Goal, Step } from '../types/goal'

const DB_NAME = 'goal-tree-planner'
const DB_VERSION = 1
const STORE_NAME = 'goals'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// IndexedDB не умеет клонировать Vue reactive proxy - снимаем реактивность перед записью
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export async function loadGoals(): Promise<Goal[]> {
  const db = await getDb()
  const goals = await db.getAll(STORE_NAME)
  return goals.map(normalizeGoal)
}

function normalizeGoal(goal: Goal): Goal {
  return {
    ...goal,
    dueDate: goal.dueDate ?? undefined,
    steps: (goal.steps ?? []).map(normalizeStep),
  }
}

function normalizeStep(step: Step): Step {
  return {
    ...step,
    dueDate: step.dueDate ?? undefined,
    children: (step.children ?? []).map(normalizeStep),
    todos: step.todos ?? [],
  }
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDb()
  await db.put(STORE_NAME, toPlain(goal))
}

export async function deleteGoalFromDb(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export async function replaceAllGoals(goals: Goal[]): Promise<void> {
  const db = await getDb()
  const plainGoals = toPlain(goals)
  const tx = db.transaction(STORE_NAME, 'readwrite')
  await tx.store.clear()
  await Promise.all(plainGoals.map(g => tx.store.put(g)))
  await tx.done
}

export function exportGoalsAsJson(goals: Goal[]): string {
  return JSON.stringify(toPlain(goals), null, 2)
}

export function parseGoalsJson(json: string): Goal[] {
  return JSON.parse(json)
}