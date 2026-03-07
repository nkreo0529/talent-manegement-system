import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Employee, UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const employee = ref<Employee | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)

  // Demo mode for when Supabase is not configured
  const isDemoMode = ref(!isSupabaseConfigured())

  const isAuthenticated = computed(() => {
    if (isDemoMode.value) return true
    return !!user.value
  })

  const isAdmin = computed(() => {
    if (isDemoMode.value) return true
    return employee.value?.role === 'admin'
  })

  const isManager = computed(() => {
    if (isDemoMode.value) return true
    return employee.value?.role === 'manager' || employee.value?.role === 'admin'
  })

  const currentRole = computed((): UserRole => {
    if (isDemoMode.value) return 'admin'
    return employee.value?.role || 'member'
  })

  async function initialize() {
    if (initialized.value) return

    if (isDemoMode.value) {
      // Demo mode - set mock employee
      employee.value = {
        id: 'demo-user',
        auth_user_id: null,
        email: 'demo@example.com',
        name: 'デモユーザー',
        name_kana: 'デモユーザー',
        avatar_url: null,
        team_id: null,
        job_title: '管理者',
        job_type: 'other',
        role: 'admin',
        hire_date: '2020-04-01',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      initialized.value = true
      return
    }

    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user
        await fetchEmployee(session.user.id)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        user.value = session?.user || null
        if (session?.user) {
          await fetchEmployee(session.user.id)
        } else {
          employee.value = null
        }
      })
    } catch (err) {
      console.error('Auth initialization error:', err)
      error.value = 'Failed to initialize authentication'
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function fetchEmployee(authUserId: string) {
    const { data, error: fetchError } = await supabase
      .from('employees')
      .select('*, team:teams(id, name)')
      .eq('auth_user_id', authUserId)
      .single()

    if (fetchError) {
      console.error('Error fetching employee:', fetchError)
      return
    }

    employee.value = data
  }

  async function signInWithEmail(email: string, password: string) {
    if (isDemoMode.value) {
      // Demo mode - just return success
      return { error: null }
    }

    loading.value = true
    error.value = null

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        error.value = signInError.message
        return { error: signInError }
      }

      return { error: null }
    } finally {
      loading.value = false
    }
  }

  async function signInWithMagicLink(email: string) {
    if (isDemoMode.value) {
      return { error: null }
    }

    loading.value = true
    error.value = null

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (signInError) {
        error.value = signInError.message
        return { error: signInError }
      }

      return { error: null }
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
      await supabase.auth.signOut()
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

    // Admin can do everything
    if (employee.value?.role === 'admin') return true

    // Check if user's role is in required roles
    if (employee.value?.role && roles.includes(employee.value.role)) return true

    // Check if target is self
    if (targetEmployeeId && employee.value?.id === targetEmployeeId) return true

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
    signInWithMagicLink,
    signOut,
    hasPermission,
  }
})
