import type { Tables } from './database'
import type { Employee, StrengthDomain } from './employee'

export interface Team extends Tables<'teams'> {
  manager?: Pick<Employee, 'id' | 'name' | 'avatar_url'> | null
  member_count?: number
}

export interface TeamWithMembers extends Team {
  members: Employee[]
}

export interface TeamWithAnalysis extends TeamWithMembers {
  ai_analysis?: {
    id: string
    team_dynamics: string
    strengths_distribution: string
    potential_challenges: string
    recommendations: string
    generated_at: string
  } | null
  strengths_summary?: TeamStrengthsSummary
}

export interface TeamStrengthsSummary {
  domain_distribution: Record<StrengthDomain, number>
  top_strengths: Array<{
    id: string
    name: string
    count: number
    domain: StrengthDomain
  }>
  missing_domains: StrengthDomain[]
}

// Team statistics
export interface TeamStats {
  total_members: number
  job_type_distribution: Record<string, number>
  avg_tenure_months: number
  strengths_coverage: number // 0-100, how many unique strengths in top 5
}
