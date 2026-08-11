import { defineStore } from 'pinia'
import type { Goal, Step, GoalStatus } from '../types/goal'
import { createGoal, createStep, createTodo } from '../utils/factory'
import { findStepById } from '../utils/tree'
import * as storage from '../services/storage'

function findGoal(goals: Goal[], id: string): Goal | null {
  return goals.find(g => g.id === id) ?? null
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [] as Goal[],
    isLoaded: false,
  }),

  getters: {
    activeGoals: (state) => state.goals.filter(g => g.status === 'active'),
    archivedGoals: (state) => state.goals.filter(g => g.status === 'archived'),
  },

  actions: {
    async init() {
      if (this.isLoaded) return
      this.goals = await storage.loadGoals()
      this.isLoaded = true
    },

    scheduleSave(goal: Goal) {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        storage.saveGoal(goal)
      }, 400)
    },

    addGoal(title: string, description?: string, color?: string) {
      const goal = createGoal(title, description, color)
      this.goals.push(goal)
      storage.saveGoal(goal)
      return goal
    },

    updateGoal(id: string, patch: Partial<Pick<Goal, 'title' | 'description' | 'color' | 'status'>>) {
      const goal = findGoal(this.goals, id)
      if (!goal) return
      Object.assign(goal, patch)
      this.scheduleSave(goal)
    },

    setGoalStatus(id: string, status: GoalStatus) {
      this.updateGoal(id, { status })
    },

    deleteGoal(id: string) {
      this.goals = this.goals.filter(g => g.id !== id)
      storage.deleteGoalFromDb(id)
    },

    addStep(goalId: string, title: string, parentId: string | null = null) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return null
      const step = createStep(title, parentId)
      if (parentId === null) {
        goal.steps.push(step)
      } else {
        const parent = findStepById(goal.steps, parentId)
        if (!parent) return null
        parent.children.push(step)
      }
      this.scheduleSave(goal)
      return step
    },

    updateStep(goalId: string, stepId: string, patch: Partial<Pick<Step, 'title' | 'description' | 'status' | 'position'>>) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return
      const step = findStepById(goal.steps, stepId)
      if (!step) return
      Object.assign(step, patch)
      this.scheduleSave(goal)
    },

    deleteStep(goalId: string, stepId: string) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return

      function removeFrom(steps: Step[]): boolean {
        const idx = steps.findIndex(s => s.id === stepId)
        if (idx !== -1) {
          steps.splice(idx, 1)
          return true
        }
        return steps.some(s => removeFrom(s.children))
      }

      removeFrom(goal.steps)
      this.scheduleSave(goal)
    },

    addTodo(goalId: string, stepId: string, text: string) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return null
      const step = findStepById(goal.steps, stepId)
      if (!step) return null
      const todo = createTodo(text)
      step.todos.push(todo)
      this.scheduleSave(goal)
      return todo
    },

    toggleTodo(goalId: string, stepId: string, todoId: string) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return
      const step = findStepById(goal.steps, stepId)
      if (!step) return
      const todo = step.todos.find(t => t.id === todoId)
      if (!todo) return
      todo.done = !todo.done
      this.scheduleSave(goal)
    },

    deleteTodo(goalId: string, stepId: string, todoId: string) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return
      const step = findStepById(goal.steps, stepId)
      if (!step) return
      step.todos = step.todos.filter(t => t.id !== todoId)
      this.scheduleSave(goal)
    },

    // применяем новый порядок тудушек после drag-переупорядочивания в модалке
    reorderTodos(goalId: string, stepId: string, orderedIds: string[]) {
      const goal = findGoal(this.goals, goalId)
      if (!goal) return
      const step = findStepById(goal.steps, stepId)
      if (!step) return
      const byId = new Map(step.todos.map(t => [t.id, t]))
      step.todos = orderedIds.map(id => byId.get(id)).filter((t): t is typeof step.todos[number] => !!t)
      this.scheduleSave(goal)
    },

    async exportBackup() {
      return storage.exportGoalsAsJson(this.goals)
    },

    async importBackup(json: string, mode: 'replace' | 'merge' = 'replace') {
      const imported = storage.parseGoalsJson(json)
      if (mode === 'replace') {
        this.goals = imported
        await storage.replaceAllGoals(imported)
        return
      }
      const byId = new Map(this.goals.map(g => [g.id, g]))
      for (const g of imported) byId.set(g.id, g)
      this.goals = Array.from(byId.values())
      await storage.replaceAllGoals(this.goals)
    },
  },
})