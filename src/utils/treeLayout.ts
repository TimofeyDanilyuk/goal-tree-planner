import type { Goal, Step } from '../types/goal'

interface LayoutResult {
  id: string
  x: number
  y: number
}

const NODE_SPACING = 240
const LEVEL_HEIGHT = 170

export function layoutGoalTree(goal: Goal): LayoutResult[] {
  const positions: LayoutResult[] = []

  // ширина поддерева в "слотах" - нужна чтобы соседние ветки не накладывались
  function subtreeWidth(step: Step): number {
    if (step.children.length === 0) return 1
    return step.children.reduce((sum, c) => sum + subtreeWidth(c), 0)
  }

  function place(step: Step, depth: number, leftSlot: number): number {
    const width = subtreeWidth(step)
    const centerSlot = leftSlot + width / 2
    positions.push({ id: step.id, x: centerSlot * NODE_SPACING, y: depth * LEVEL_HEIGHT })

    let cursor = leftSlot
    for (const child of step.children) {
      cursor += place(child, depth + 1, cursor)
    }
    return width
  }

  const rootWidth = goal.steps.reduce((sum, s) => sum + subtreeWidth(s), 0)
  positions.push({ id: goal.id, x: (rootWidth * NODE_SPACING) / 2, y: 0 })

  let cursor = 0
  for (const step of goal.steps) {
    cursor += place(step, 1, cursor)
  }

  return positions
}