import type { Step } from '../types/goal'

export function findStepById(steps: Step[], id: string): Step | null {
  for (const step of steps) {
    if (step.id === id) return step
    const found = findStepById(step.children, id)
    if (found) return found
  }
  return null
}