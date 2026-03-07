import type { TeamRow } from './database'
import type { Employee, StrengthDomain } from './employee'

export interface Team extends TeamRow {
  manager?: Pick<Employee, 'id' | 'name' | 'avatarUrl'> | null
  memberCount?: number
}

export interface TeamWithMembers extends Team {
  members: Employee[]
}

export interface TeamWithAnalysis extends TeamWithMembers {
  aiAnalysis?: {
    id: string
    teamDynamics: string
    strengthsDistribution: string
    potentialChallenges: string
    recommendations: string
    generatedAt: string
  } | null
  strengthsSummary?: TeamStrengthsSummary
}

export interface TeamStrengthsSummary {
  domainDistribution: Record<StrengthDomain, number>
  topStrengths: Array<{
    id: string
    name: string
    count: number
    domain: StrengthDomain
  }>
  missingDomains: StrengthDomain[]
}

// Team statistics
export interface TeamStats {
  totalMembers: number
  jobTypeDistribution: Record<string, number>
  avgTenureMonths: number
  strengthsCoverage: number // 0-100, how many unique strengths in top 5
}
