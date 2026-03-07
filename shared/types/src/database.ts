// 共通データベース型定義（Supabase非依存、camelCase）

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type UserRole = 'admin' | 'manager' | 'member'

export type JobType =
  | 'engineer'
  | 'designer'
  | 'product_manager'
  | 'sales'
  | 'marketing'
  | 'hr'
  | 'finance'
  | 'operations'
  | 'other'

export type EvaluationGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export type MoodRating = 1 | 2 | 3 | 4 | 5

// SPI Related Types
export interface SpiPersonalityTraits {
  extroversion: number      // 外向性 1-10
  agreeableness: number     // 協調性 1-10
  conscientiousness: number // 誠実性 1-10
  neuroticism: number       // 神経症的傾向 1-10
  openness: number          // 開放性 1-10
}

export interface SpiWorkStyle {
  leadership: number        // リーダーシップ 1-10
  independence: number      // 独立性 1-10
  teamwork: number          // チームワーク 1-10
  persistence: number       // 粘り強さ 1-10
  flexibility: number       // 柔軟性 1-10
  stressTolerance: number   // ストレス耐性 1-10
}

export interface SpiAptitudeScores {
  verbal: number            // 言語 1-10
  numerical: number         // 数理 1-10
  logical: number           // 論理 1-10
}

// Base entity types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Table Row Types (camelCase to match Drizzle schema)
export interface TeamRow extends BaseEntity {
  name: string
  description: string | null
  managerId: string | null
}

export interface EmployeeRow extends BaseEntity {
  authUserId: string | null
  email: string
  name: string
  nameKana: string | null
  avatarUrl: string | null
  teamId: string | null
  jobTitle: string | null
  jobType: JobType | null
  role: UserRole
  hireDate: string | null
  isActive: boolean
}

export interface StrengthsRow extends BaseEntity {
  employeeId: string
  strengthsOrder: string[]
}

export interface SpiResultRow extends BaseEntity {
  employeeId: string
  personalityTraits: SpiPersonalityTraits
  workStyle: SpiWorkStyle
  aptitudeScores: SpiAptitudeScores
  testDate: string | null
}

export interface CareerRow {
  id: string
  employeeId: string
  companyName: string
  position: string
  startDate: string
  endDate: string | null
  description: string | null
  isCurrent: boolean
  createdAt: string
}

export interface EvaluationRow extends BaseEntity {
  employeeId: string
  evaluatorId: string
  period: string
  overallGrade: EvaluationGrade
  strengthsComment: string | null
  improvementsComment: string | null
  goals: string | null
}

export interface OneOnOneNoteRow extends BaseEntity {
  employeeId: string
  managerId: string
  meetingDate: string
  topics: string[]
  notes: string | null
  actionItems: string[]
  mood: MoodRating | null
}

export interface AiProfileRow {
  id: string
  employeeId: string
  profileSummary: string
  workStyleAnalysis: string
  collaborationTips: string
  developmentSuggestions: string
  generatedAt: string
  modelVersion: string
}

export interface AiTeamAnalysisRow {
  id: string
  teamId: string
  teamDynamics: string
  strengthsDistribution: string
  potentialChallenges: string
  recommendations: string
  generatedAt: string
  modelVersion: string
}

// Insert types (id, createdAt, updatedAt are optional)
export type TeamInsert = Partial<Pick<TeamRow, 'id' | 'createdAt' | 'updatedAt'>> & Omit<TeamRow, 'id' | 'createdAt' | 'updatedAt'>

export type EmployeeInsert = Partial<Pick<EmployeeRow, 'id' | 'createdAt' | 'updatedAt' | 'authUserId' | 'nameKana' | 'avatarUrl' | 'teamId' | 'jobTitle' | 'jobType' | 'hireDate'>> &
  Pick<EmployeeRow, 'email' | 'name'> & { role?: UserRole; isActive?: boolean }

export type StrengthsInsert = Partial<Pick<StrengthsRow, 'id' | 'createdAt' | 'updatedAt'>> & Omit<StrengthsRow, 'id' | 'createdAt' | 'updatedAt'>

export type SpiResultInsert = Partial<Pick<SpiResultRow, 'id' | 'createdAt' | 'updatedAt' | 'testDate'>> & Omit<SpiResultRow, 'id' | 'createdAt' | 'updatedAt' | 'testDate'>

export type CareerInsert = Partial<Pick<CareerRow, 'id' | 'createdAt' | 'endDate' | 'description' | 'isCurrent'>> & Omit<CareerRow, 'id' | 'createdAt' | 'endDate' | 'description' | 'isCurrent'>

export type EvaluationInsert = Partial<Pick<EvaluationRow, 'id' | 'createdAt' | 'updatedAt' | 'strengthsComment' | 'improvementsComment' | 'goals'>> &
  Omit<EvaluationRow, 'id' | 'createdAt' | 'updatedAt' | 'strengthsComment' | 'improvementsComment' | 'goals'>

export type OneOnOneNoteInsert = Partial<Pick<OneOnOneNoteRow, 'id' | 'createdAt' | 'updatedAt' | 'topics' | 'notes' | 'actionItems' | 'mood'>> &
  Omit<OneOnOneNoteRow, 'id' | 'createdAt' | 'updatedAt' | 'topics' | 'notes' | 'actionItems' | 'mood'>

export type AiProfileInsert = Partial<Pick<AiProfileRow, 'id' | 'generatedAt' | 'modelVersion'>> &
  Omit<AiProfileRow, 'id' | 'generatedAt' | 'modelVersion'>

export type AiTeamAnalysisInsert = Partial<Pick<AiTeamAnalysisRow, 'id' | 'generatedAt' | 'modelVersion'>> &
  Omit<AiTeamAnalysisRow, 'id' | 'generatedAt' | 'modelVersion'>

// Update types (all fields optional except id)
export type TeamUpdate = Partial<Omit<TeamRow, 'id' | 'createdAt'>>
export type EmployeeUpdate = Partial<Omit<EmployeeRow, 'id' | 'createdAt'>>
export type StrengthsUpdate = Partial<Pick<StrengthsRow, 'strengthsOrder' | 'updatedAt'>>
export type SpiResultUpdate = Partial<Omit<SpiResultRow, 'id' | 'employeeId' | 'createdAt'>>
export type CareerUpdate = Partial<Omit<CareerRow, 'id' | 'employeeId' | 'createdAt'>>
export type EvaluationUpdate = Partial<Omit<EvaluationRow, 'id' | 'employeeId' | 'createdAt'>>
export type OneOnOneNoteUpdate = Partial<Omit<OneOnOneNoteRow, 'id' | 'employeeId' | 'createdAt'>>
export type AiProfileUpdate = Partial<Omit<AiProfileRow, 'id' | 'employeeId'>>
export type AiTeamAnalysisUpdate = Partial<Omit<AiTeamAnalysisRow, 'id' | 'teamId'>>
