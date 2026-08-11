import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'goals-list',
    component: () => import('../views/GoalsListView.vue'),
  },
  {
    path: '/goal/:id',
    name: 'goal-canvas',
    component: () => import('../views/GoalCanvasView.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router