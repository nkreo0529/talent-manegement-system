import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  // Employee routes
  {
    path: '/employees',
    name: 'employees',
    component: () => import('@/views/employees/EmployeeListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/employees/:id',
    name: 'employee-detail',
    component: () => import('@/views/employees/EmployeeDetailView.vue'),
    meta: { requiresAuth: true },
  },
  // Team routes
  {
    path: '/teams',
    name: 'teams',
    component: () => import('@/views/teams/TeamListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/teams/:id',
    name: 'team-detail',
    component: () => import('@/views/teams/TeamDetailView.vue'),
    meta: { requiresAuth: true },
  },
  // Analysis routes
  {
    path: '/analysis/strengths',
    name: 'analysis-strengths',
    component: () => import('@/views/analysis/StrengthsAnalysisView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/analysis/spi',
    name: 'analysis-spi',
    component: () => import('@/views/analysis/SpiAnalysisView.vue'),
    meta: { requiresAuth: true },
  },
  // Admin routes
  {
    path: '/admin/employees',
    name: 'admin-employees',
    component: () => import('@/views/admin/AdminEmployeesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/strengths',
    name: 'admin-strengths',
    component: () => import('@/views/admin/AdminStrengthsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/spi',
    name: 'admin-spi',
    component: () => import('@/views/admin/AdminSpiView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/evaluations',
    name: 'admin-evaluations',
    component: () => import('@/views/admin/AdminEvaluationsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/teams',
    name: 'admin-teams',
    component: () => import('@/views/admin/AdminTeamsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/ai-regenerate',
    name: 'admin-ai-regenerate',
    component: () => import('@/views/admin/AdminAiRegenerateView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  // AI Consultation
  {
    path: '/ai-consultation',
    name: 'ai-consultation',
    component: () => import('@/views/ai/AiConsultationView.vue'),
    meta: { requiresAuth: true },
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth state if not done
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (requiresAdmin && !authStore.isAdmin) {
    // Set error message for user feedback
    authStore.error = '管理者権限が必要です。アクセスが拒否されました。'
    next({ name: 'dashboard' })
    return
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
