export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export type StepStatus = 'todo' | 'in_progress' | 'done'
export type GoalStatus = 'active' | 'done' | 'archived'

export interface Step {
  id: string
  parentId: string | null
  title: string
  description?: string
  status: StepStatus
  position?: { x: number; y: number }
  children: Step[]
  todos: Todo[]
}

export interface Goal {
  id: string
  title: string
  description?: string
  color?: string
  createdAt: string
  status: GoalStatus
  steps: Step[]
}