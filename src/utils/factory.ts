import type { Goal, Step, Todo } from '../types/goal'

export function createGoal(title: string, description?: string, color?: string, dueDate?: string): Goal {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    color,
    dueDate,
    createdAt: new Date().toISOString(),
    status: 'active',
    steps: [],
  }
}

export function createStep(title: string, parentId: string | null = null, dueDate?: string): Step {
  return {
    id: crypto.randomUUID(),
    parentId,
    title,
    status: 'todo',
    dueDate,
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