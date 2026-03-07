import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authClient } from '@/lib/auth-client'
import { api } from '@/lib/api'
import type { UserRole } from '@talent/types'

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  employeeId?: string
}

interface Employee {
  id: string
  email: string
  name: string
  nameKana: string | null
  avatarUrl: string | null
  teamId: string | null
  jobTitle: string | null
  jobType: string | null
  role: UserRole
  hireDate: string | null
  isActive: boolean
  team?: { id: string; name: string } | null
}

// Extended Better Auth user type with custom fields
interface BetterAuthUser {
  id: string
  email: string
  name: string
  role?: UserRole
  employeeId?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const employee = ref<Employee | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)

  // Demo mode for development without backend
  const isDemoMode = ref(import.meta.env.VITE_DEMO_MODE === 'true')

  const isAuthenticated = computed(() => {
    if (isDemoMode.value) return true
    return !!user.value
  })

  const isAdmin = computed(() => {
    if (isDemoMode.value) return true
    return user.value?.role === 'admin' || employee.value?.role === 'admin'
  })

  const isManager = computed(() => {
    if (isDemoMode.value) return true
    const role = user.value?.role || employee.value?.role
    return role === 'manager' || role === 'admin'
  })

  const currentRole = computed((): UserRole => {
    if (isDemoMode.value) return 'admin'
    return user.value?.role || employee.value?.role || 'member'
  })

  async function initialize() {
    if (initialized.value) return

    if (isDemoMode.value) {
      // Demo mode - set mock employee
      employee.value = {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'デモユーザー',
        nameKana: 'デモユーザー',
        avatarUrl: null,
        teamId: null,
        jobTitle: '管理者',
        jobType: 'other',
        role: 'admin',
        hireDate: '2020-04-01',
        isActive: true,
      }
      user.value = {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'デモユーザー',
        role: 'admin',
      }
      initialized.value = true
      return
    }

    loading.value = true
    try {
      const session = await authClient.getSession()

      if (session.data?.user) {
        const sessionUser = session.data.user as BetterAuthUser
        user.value = {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name || '',
          role: sessionUser.role || 'member',
          employeeId: sessionUser.employeeId,
        }

        // Fetch employee data if employeeId exists
        if (sessionUser.employeeId) {
          await fetchEmployee(sessionUser.employeeId)
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      error.value = 'Failed to initialize authentication'
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function fetchEmployee(employeeId: string) {
    try {
      const response = await api<{ data: Employee }>(`/api/employees/${employeeId}`)
      employee.value = response.data
    } catch (err) {
      console.error('Error fetching employee:', err)
    }
  }

  async function signInWithEmail(email: string, password: string) {
    if (isDemoMode.value) {
      return { error: null }
    }

    loading.value = true
    error.value = null

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        error.value = result.error.message || 'ログインに失敗しました'
        return { error: result.error }
      }

      // Reinitialize to fetch user data
      initialized.value = false
      await initialize()

      return { error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'ログインに失敗しました'
      return { error: { message: error.value } }
    } finally {
      loading.value = false
    }
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    if (isDemoMode.value) {
      return { error: null }
    }

    loading.value = true
    error.value = null

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })

      if (result.error) {
        error.value = result.error.message || '登録に失敗しました'
        return { error: result.error }
      }

      return { error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登録に失敗しました'
      return { error: { message: error.value } }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    if (isDemoMode.value) {
      return
    }

    loading.value = true
    try {
      await authClient.signOut()
      user.value = null
      employee.value = null
    } finally {
      loading.value = false
    }
  }

  function hasPermission(
    requiredRole: UserRole | UserRole[],
    targetEmployeeId?: string
  ): boolean {
    if (isDemoMode.value) return true

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const userRole = user.value?.role || employee.value?.role

    // Admin can do everything
    if (userRole === 'admin') return true

    // Check if user's role is in required roles
    if (userRole && roles.includes(userRole)) return true

    // Check if target is self
    if (targetEmployeeId && (employee.value?.id === targetEmployeeId || user.value?.employeeId === targetEmployeeId)) {
      return true
    }

    return false
  }

  return {
    user,
    employee,
    loading,
    initialized,
    error,
    isDemoMode,
    isAuthenticated,
    isAdmin,
    isManager,
    currentRole,
    initialize,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    hasPermission,
  }
})
