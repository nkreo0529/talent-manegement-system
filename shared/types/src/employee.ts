import type {
  EmployeeRow,
  CareerRow,
  EvaluationRow,
  OneOnOneNoteRow,
  JobType,
  UserRole,
  SpiPersonalityTraits,
  SpiWorkStyle,
  SpiAptitudeScores,
} from './database'

// Employee with related data
export interface Employee extends EmployeeRow {
  team?: {
    id: string
    name: string
  } | null
}

export interface EmployeeWithDetails extends Employee {
  strengths?: {
    id: string
    strengthsOrder: string[]
  } | null
  spiResults?: {
    id: string
    personalityTraits: SpiPersonalityTraits
    workStyle: SpiWorkStyle
    aptitudeScores: SpiAptitudeScores
    testDate: string | null
  } | null
  aiProfile?: {
    id: string
    profileSummary: string
    workStyleAnalysis: string
    collaborationTips: string
    developmentSuggestions: string
    generatedAt: string
  } | null
  careers?: CareerRow[]
  evaluations?: EvaluationRow[]
  oneOnOneNotes?: OneOnOneNoteRow[]
}

// ストレングスファインダー 34資質
export const STRENGTHS_34 = [
  // 実行力 (Executing) - Purple
  { id: 'achiever', name: '達成欲', domain: 'executing', nameEn: 'Achiever' },
  { id: 'arranger', name: 'アレンジ', domain: 'executing', nameEn: 'Arranger' },
  { id: 'belief', name: '信念', domain: 'executing', nameEn: 'Belief' },
  { id: 'consistency', name: '公平性', domain: 'executing', nameEn: 'Consistency' },
  { id: 'deliberative', name: '慎重さ', domain: 'executing', nameEn: 'Deliberative' },
  { id: 'discipline', name: '規律性', domain: 'executing', nameEn: 'Discipline' },
  { id: 'focus', name: '目標志向', domain: 'executing', nameEn: 'Focus' },
  { id: 'responsibility', name: '責任感', domain: 'executing', nameEn: 'Responsibility' },
  { id: 'restorative', name: '回復志向', domain: 'executing', nameEn: 'Restorative' },

  // 影響力 (Influencing) - Amber/Orange
  { id: 'activator', name: '活発性', domain: 'influencing', nameEn: 'Activator' },
  { id: 'command', name: '指令性', domain: 'influencing', nameEn: 'Command' },
  { id: 'communication', name: 'コミュニケーション', domain: 'influencing', nameEn: 'Communication' },
  { id: 'competition', name: '競争性', domain: 'influencing', nameEn: 'Competition' },
  { id: 'maximizer', name: '最上志向', domain: 'influencing', nameEn: 'Maximizer' },
  { id: 'self_assurance', name: '自己確信', domain: 'influencing', nameEn: 'Self-Assurance' },
  { id: 'significance', name: '自我', domain: 'influencing', nameEn: 'Significance' },
  { id: 'woo', name: '社交性', domain: 'influencing', nameEn: 'Woo' },

  // 人間関係構築力 (Relationship Building) - Blue
  { id: 'adaptability', name: '適応性', domain: 'relationship', nameEn: 'Adaptability' },
  { id: 'connectedness', name: '運命思考', domain: 'relationship', nameEn: 'Connectedness' },
  { id: 'developer', name: '成長促進', domain: 'relationship', nameEn: 'Developer' },
  { id: 'empathy', name: '共感性', domain: 'relationship', nameEn: 'Empathy' },
  { id: 'harmony', name: '調和性', domain: 'relationship', nameEn: 'Harmony' },
  { id: 'includer', name: '包含', domain: 'relationship', nameEn: 'Includer' },
  { id: 'individualization', name: '個別化', domain: 'relationship', nameEn: 'Individualization' },
  { id: 'positivity', name: 'ポジティブ', domain: 'relationship', nameEn: 'Positivity' },
  { id: 'relator', name: '親密性', domain: 'relationship', nameEn: 'Relator' },

  // 戦略的思考力 (Strategic Thinking) - Green
  { id: 'analytical', name: '分析思考', domain: 'strategic', nameEn: 'Analytical' },
  { id: 'context', name: '原点思考', domain: 'strategic', nameEn: 'Context' },
  { id: 'futuristic', name: '未来志向', domain: 'strategic', nameEn: 'Futuristic' },
  { id: 'ideation', name: '着想', domain: 'strategic', nameEn: 'Ideation' },
  { id: 'input', name: '収集心', domain: 'strategic', nameEn: 'Input' },
  { id: 'intellection', name: '内省', domain: 'strategic', nameEn: 'Intellection' },
  { id: 'learner', name: '学習欲', domain: 'strategic', nameEn: 'Learner' },
  { id: 'strategic', name: '戦略性', domain: 'strategic', nameEn: 'Strategic' },
] as const

export type StrengthId = typeof STRENGTHS_34[number]['id']
export type StrengthDomain = 'executing' | 'influencing' | 'relationship' | 'strategic'

export const DOMAIN_COLORS: Record<StrengthDomain, { bg: string; text: string; border: string }> = {
  executing: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  influencing: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  relationship: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  strategic: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
}

export const DOMAIN_NAMES: Record<StrengthDomain, { ja: string; en: string }> = {
  executing: { ja: '実行力', en: 'Executing' },
  influencing: { ja: '影響力', en: 'Influencing' },
  relationship: { ja: '人間関係構築力', en: 'Relationship Building' },
  strategic: { ja: '戦略的思考力', en: 'Strategic Thinking' },
}

// Helper function to get strength info by ID
export function getStrengthById(id: string) {
  return STRENGTHS_34.find(s => s.id === id)
}

// Helper function to get top 5 strengths
export function getTop5Strengths(strengthsOrder: string[]) {
  return strengthsOrder.slice(0, 5).map(id => getStrengthById(id)).filter(Boolean)
}

// Job type labels
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  engineer: 'エンジニア',
  designer: 'デザイナー',
  product_manager: 'プロダクトマネージャー',
  sales: '営業',
  marketing: 'マーケティング',
  hr: '人事',
  finance: '経理・財務',
  operations: 'オペレーション',
  other: 'その他',
}

// Role labels
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  member: 'メンバー',
}
