import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Team, TeamWithAnalysis, TeamFilters } from '@/types'
import { getDemoTeams, getDemoTeamById, getDemoEmployees } from '@/data/demoData'
import { sanitizeSearchInput, isValidId } from '@/utils/sanitize'

export function useTeam() {
  const teams = ref<Team[]>([])
  const currentTeam = ref<TeamWithAnalysis | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isDemoMode = !isSupabaseConfigured()

  async function fetchTeams(filters?: TeamFilters) {
    loading.value = true
    error.value = null

    try {
      if (isDemoMode) {
        let data = getDemoTeams()
        const employees = getDemoEmployees()

        // Add member count
        const teamsWithCount = data.map(team => ({
          ...team,
          member_count: employees.filter(e => e.team_id === team.id).length,
          manager: employees.find(e => e.id === team.manager_id) || null,
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

        return teams.value
      }

      let query = supabase
        .from('teams')
        .select(`
          *,
          manager:employees!teams_manager_id_fkey(id, name, avatar_url)
        `)
        .order('name')

      if (filters?.search) {
        const sanitizedSearch = sanitizeSearchInput(filters.search)
        if (sanitizedSearch) {
          query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Get member counts
      const { data: counts } = await supabase
        .from('employees')
        .select('team_id')
        .not('team_id', 'is', null)

      const countMap: Record<string, number> = {}
      counts?.forEach(({ team_id }) => {
        if (team_id) countMap[team_id] = (countMap[team_id] || 0) + 1
      })

      teams.value = (data || []).map(team => {
        const t = team as Team
        return {
          ...t,
          member_count: countMap[t.id] || 0,
        }
      })

      return teams.value
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

    // Validate ID format
    if (!isValidId(id)) {
      error.value = '無効なIDです'
      loading.value = false
      return null
    }

    try {
      if (isDemoMode) {
        const data = getDemoTeamById(id)
        if (data) {
          currentTeam.value = {
            ...data,
            ai_analysis: {
              id: `ai-team-${id}`,
              team_dynamics: `${data.name}は${data.members.length}名で構成されるチームです。多様な強みを持つメンバーが集まっており、バランスの取れた組織構成となっています。`,
              strengths_distribution: '実行力と戦略的思考力を持つメンバーが多く、課題を発見し解決に導く力があります。',
              potential_challenges: '影響力の領域が相対的に弱いため、対外的なプレゼンテーションや交渉においてサポートが必要かもしれません。',
              recommendations: 'チーム全体での定期的な振り返りを行い、各メンバーの強みを活かせる役割分担を意識することをお勧めします。',
              generated_at: '2024-01-15T10:00:00Z',
            },
          }
        }
        return currentTeam.value
      }

      const { data, error: fetchError } = await supabase
        .from('teams')
        .select(`
          *,
          manager:employees!teams_manager_id_fkey(id, name, avatar_url),
          members:employees!employees_team_id_fkey(*),
          ai_analysis:ai_team_analysis(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      currentTeam.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'チーム情報の取得に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    teams,
    currentTeam,
    loading,
    error,
    fetchTeams,
    fetchTeamById,
  }
}
