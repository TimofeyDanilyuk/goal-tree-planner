import type { Goal, Step } from '../types/goal'

interface LayoutResult {
  id: string
  x: number
  y: number
}

const SIBLING_SPACING = 110 // вертикальный отступ между соседями одного уровня
const DEPTH_SPACING = 320 // горизонтальный отступ между уровнями глубины

export function layoutGoalTree(goal: Goal): LayoutResult[] {
  const positions: LayoutResult[] = []

  function subtreeWidth(step: Step): number {
    if (step.children.length === 0) return 1
    return step.children.reduce((sum, c) => sum + subtreeWidth(c), 0)
  }

  function place(step: Step, depth: number, topSlot: number): number {
    const width = subtreeWidth(step)
    const centerSlot = topSlot + width / 2
    positions.push({ id: step.id, x: depth * DEPTH_SPACING, y: centerSlot * SIBLING_SPACING })

    let cursor = topSlot
    for (const child of step.children) {
      cursor += place(child, depth + 1, cursor)
    }
    return width
  }

  const rootWidth = goal.steps.reduce((sum, s) => sum + subtreeWidth(s), 0)
  positions.push({ id: goal.id, x: 0, y: (rootWidth * SIBLING_SPACING) / 2 })

  let cursor = 0
  for (const step of goal.steps) {
    cursor += place(step, 1, cursor)
  }

  return positions
}