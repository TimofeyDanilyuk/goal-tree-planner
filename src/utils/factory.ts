import type { Goal, Step, Todo } from '../types/goal'

export function createGoal(title: string, description?: string, color?: string): Goal {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    color,
    createdAt: new Date().toISOString(),
    status: 'active',
    steps: [],
  }
}

export function createStep(title: string, parentId: string | null = null): Step {
  return {
    id: crypto.randomUUID(),
    parentId,
    title,
    status: 'todo',
    children: [],
    todos: [],
  }
}

export function createTodo(text: string): Todo {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: new Date().toISOString(),
  }
}