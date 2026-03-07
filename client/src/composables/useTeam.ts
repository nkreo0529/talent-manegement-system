import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Team, TeamWithAnalysis, TeamUpdate } from '@talent/types'
import { getDemoTeams, getDemoTeamById, getDemoEmployees } from '@/data/demoData'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export interface TeamFilters {
  search?: string
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

export function useTeam() {
  const teams = ref<Team[]>([])
  const currentTeam = ref<TeamWithAnalysis | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ total: 0, page: 1, limit: 20, hasMore: false })

  async function fetchTeams(filters?: TeamFilters) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        const data = getDemoTeams()
        const employees = getDemoEmployees()

        // Add member count and manager
        const teamsWithCount = data.map(team => ({
          ...team,
          memberCount: employees.filter(e => e.teamId === team.id).length,
          manager: employees.find(e => e.id === team.managerId) || null,
        }))

        // Apply filters
        if (filters?.search) {
          const search = filters.search.toLowerCase()
          teams.value = teamsWithCount.filter(
            t => t.name.toLowerCase().includes(search) ||
                 t.description?.toLowerCase().includes(search)
          )
        } else {
          teams.value = teamsWithCount
        }

        pagination.value = { total: teams.value.length, page: 1, limit: 20, hasMore: false }
        return teams.value
      }

      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const queryString = params.toString()
      const url = `/api/teams${queryString ? `?${queryString}` : ''}`

      const response = await api<PaginatedResponse<Team>>(url)

      teams.value = response.data
      pagination.value = {
        total: response.total,
        page: response.page,
        limit: response.limit,
        hasMore: response.hasMore,
      }

      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'チーム情報の取得に失敗しました'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchTeamById(id: string) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        const data = getDemoTeamById(id)
        if (data) {
          currentTeam.value = {
            ...data,
            aiAnalysis: {
              id: `ai-team-${id}`,
              teamDynamics: `${data.name}は${data.members.length}名で構成されるチームです。多様な強みを持つメンバーが集まっており、バランスの取れた組織構成となっています。`,
              strengthsDistribution: '実行力と戦略的思考力を持つメンバーが多く、課題を発見し解決に導く力があります。',
              potentialChallenges: '影響力の領域が相対的に弱いため、対外的なプレゼンテーションや交渉においてサポートが必要かもしれません。',
              recommendations: 'チーム全体での定期的な振り返りを行い、各メンバーの強みを活かせる役割分担を意識することをお勧めします。',
              generatedAt: '2024-01-15T10:00:00Z',
            },
          }
        }
        return currentTeam.value
      }

      const response = await api<{ data: TeamWithAnalysis }>(`/api/teams/${id}`)
      currentTeam.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'チーム情報の取得に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createTeam(data: { name: string; description?: string; managerId?: string }) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true, data: { ...data, id: 'demo-new' } }
      }

      const response = await api<{ data: Team }>('/api/teams', {
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

  async function updateTeam(id: string, updates: TeamUpdate) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true }
      }

      await api<{ data: Team }>(`/api/teams/${id}`, {
        method: 'PUT',
        body: updates,
      })

      await fetchTeamById(id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新に失敗しました'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function deleteTeam(id: string) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true }
      }

      await api(`/api/teams/${id}`, {
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

  async function generateTeamAnalysis(teamId: string) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        return { success: true }
      }

      await api(`/api/ai/teams/${teamId}/analyze`, {
        method: 'POST',
      })

      await fetchTeamById(teamId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'AI分析の生成に失敗しました'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    teams,
    currentTeam,
    loading,
    error,
    pagination,
    fetchTeams,
    fetchTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    generateTeamAnalysis,
  }
}
