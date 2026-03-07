import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Employee, EmployeeWithDetails, EmployeeUpdate } from '@talent/types'
import { getDemoEmployees, getDemoEmployeeById } from '@/data/demoData'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export interface EmployeeFilters {
  search?: string
  teamId?: string
  jobType?: string
  role?: string
  isActive?: boolean
  page?: number
  limit?: number
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export function useEmployee() {
  const employees = ref<Employee[]>([])
  const currentEmployee = ref<EmployeeWithDetails | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ total: 0, page: 1, limit: 20, hasMore: false })

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
              e.nameKana?.toLowerCase().includes(search) ||
              e.email.toLowerCase().includes(search)
          )
        }
        if (filters?.teamId) {
          data = data.filter((e) => e.teamId === filters.teamId)
        }
        if (filters?.jobType) {
          data = data.filter((e) => e.jobType === filters.jobType)
        }
        if (filters?.isActive !== undefined) {
          data = data.filter((e) => e.isActive === filters.isActive)
        }

        employees.value = data
        pagination.value = { total: data.length, page: 1, limit: 20, hasMore: false }
        return data
      }

      // Build query params
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.teamId) params.set('teamId', filters.teamId)
      if (filters?.jobType) params.set('jobType', filters.jobType)
      if (filters?.role) params.set('role', filters.role)
      if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive))
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const queryString = params.toString()
      const url = `/api/employees${queryString ? `?${queryString}` : ''}`

      const response = await api<PaginatedResponse<Employee>>(url)

      employees.value = response.data
      pagination.value = {
        total: response.total,
        page: response.page,
        limit: response.limit,
        hasMore: response.hasMore,
      }

      return response.data
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

    try {
      if (isDemoMode) {
        const data = getDemoEmployeeById(id)
        currentEmployee.value = data
        return data
      }

      const response = await api<{ data: EmployeeWithDetails }>(`/api/employees/${id}`)
      currentEmployee.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '社員情報の取得に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true, data: { ...data, id: 'demo-new', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Employee }
      }

      const response = await api<{ data: Employee }>('/api/employees', {
        method: 'POST',
        body: data,
      })

      return { success: true, data: response.data }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '作成に失敗しました'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateEmployee(id: string, updates: EmployeeUpdate) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true }
      }

      await api<{ data: Employee }>(`/api/employees/${id}`, {
        method: 'PUT',
        body: updates,
      })

      await fetchEmployeeById(id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新に失敗しました'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function deleteEmployee(id: string) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true }
      }

      await api(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '削除に失敗しました'
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
    pagination,
    fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  }
}
