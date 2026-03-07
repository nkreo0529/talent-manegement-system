import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Employee, EmployeeWithDetails, EmployeeFilters } from '@/types'
import { getDemoEmployees, getDemoEmployeeById } from '@/data/demoData'
import { sanitizeSearchInput, isValidId } from '@/utils/sanitize'

export function useEmployee() {
  const employees = ref<Employee[]>([])
  const currentEmployee = ref<EmployeeWithDetails | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isDemoMode = !isSupabaseConfigured()

  async function fetchEmployees(filters?: EmployeeFilters) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        let data = getDemoEmployees()

        // Apply filters
        if (filters?.search) {
          const search = filters.search.toLowerCase()
          data = data.filter(
            (e) =>
              e.name.toLowerCase().includes(search) ||
              e.name_kana?.toLowerCase().includes(search) ||
              e.email.toLowerCase().includes(search)
          )
        }
        if (filters?.team_id) {
          data = data.filter((e) => e.team_id === filters.team_id)
        }
        if (filters?.job_type) {
          data = data.filter((e) => e.job_type === filters.job_type)
        }
        if (filters?.is_active !== undefined) {
          data = data.filter((e) => e.is_active === filters.is_active)
        }

        employees.value = data
        return data
      }

      let query = supabase
        .from('employees')
        .select('*, team:teams(id, name)')
        .order('name')

      if (filters?.search) {
        const sanitizedSearch = sanitizeSearchInput(filters.search)
        if (sanitizedSearch) {
          query = query.or(
            `name.ilike.%${sanitizedSearch}%,name_kana.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`
          )
        }
      }
      if (filters?.team_id) {
        query = query.eq('team_id', filters.team_id)
      }
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      employees.value = data || []
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '社員情報の取得に失敗しました'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeeById(id: string) {
    loading.value = true
    error.value = null

    // Validate ID format
    if (!isValidId(id)) {
      error.value = '無効なIDです'
      loading.value = false
      return null
    }

    try {
      if (isDemoMode) {
        const data = getDemoEmployeeById(id)
        currentEmployee.value = data
        return data
      }

      const { data, error: fetchError } = await supabase
        .from('employees')
        .select(`
          *,
          team:teams(id, name),
          strengths(*),
          spi_results(*),
          ai_profile:ai_profiles(*),
          careers(*),
          evaluations(*),
          one_on_one_notes(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      currentEmployee.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '社員情報の取得に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateEmployee(id: string, updates: Partial<Employee>) {
    loading.value = true
    error.value = null

    // Validate ID format
    if (!isValidId(id)) {
      error.value = '無効なIDです'
      loading.value = false
      return { success: false, error: error.value }
    }

    try {
      if (isDemoMode) {
        // Demo mode - just return success
        return { success: true }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('employees')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError

      // Refresh data
      await fetchEmployeeById(id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新に失敗しました'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    employees,
    currentEmployee,
    loading,
    error,
    fetchEmployees,
    fetchEmployeeById,
    updateEmployee,
  }
}
