import type { Goal, Step, Todo } from '../types/goal'

// собираем все тудушки шага, включая вложенные подшаги любой глубины
function collectTodos(step: Step): Todo[] {
  return step.todos.concat(step.children.flatMap(collectTodos))
}

export function getStepProgress(step: Step): number {
  const todos = collectTodos(step)
  if (todos.length === 0) return 0
  return todos.filter(t => t.done).length / todos.length
}

export function getGoalProgress(goal: Goal): number {
  const allTodos = goal.steps.flatMap(collectTodos)
  if (allTodos.length === 0) return 0
  return allTodos.filter(t => t.done).length / allTodos.length
}