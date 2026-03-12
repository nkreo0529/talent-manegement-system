import type { Employee, EmployeeWithDetails, Team, TeamWithMembers, JobType, UserRole } from '@talent/types'
import { STRENGTHS_34, getStrengthById } from '@talent/types'

// Teams
export const demoTeams: Team[] = [
  { id: 'team-1', name: '開発チーム', description: 'プロダクト開発を担当', managerId: 'emp-1', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'team-2', name: 'デザインチーム', description: 'UI/UXデザインを担当', managerId: 'emp-11', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'team-3', name: '営業チーム', description: '顧客開拓と関係構築', managerId: 'emp-21', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'team-4', name: 'マーケティングチーム', description: 'ブランディングと集客', managerId: 'emp-31', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'team-5', name: '経営企画チーム', description: '戦略立案と組織運営', managerId: 'emp-36', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
]

// Japanese names for dummy data
const firstNames = ['太郎', '花子', '一郎', '美咲', '健太', '陽子', '大輔', '愛', '翔太', '麻衣', '拓也', '彩', '雄介', '真由', '直樹', '沙織', '和也', '恵', '隆', '由美']
const lastNames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']

function generateEmail(lastName: string, _firstName: string, index: number): string {
  const romanji: Record<string, string> = {
    '田中': 'tanaka', '佐藤': 'sato', '鈴木': 'suzuki', '高橋': 'takahashi', '伊藤': 'ito',
    '渡辺': 'watanabe', '山本': 'yamamoto', '中村': 'nakamura', '小林': 'kobayashi', '加藤': 'kato',
    '吉田': 'yoshida', '山田': 'yamada', '佐々木': 'sasaki', '山口': 'yamaguchi', '松本': 'matsumoto',
    '井上': 'inoue', '木村': 'kimura', '林': 'hayashi', '斎藤': 'saito', '清水': 'shimizu',
  }
  return `${romanji[lastName] || 'user'}${index}@example.com`
}

function generateStrengthsOrder(): string[] {
  const shuffled = [...STRENGTHS_34].sort(() => Math.random() - 0.5)
  return shuffled.map(s => s.id)
}

function generateSpiTraits() {
  return {
    extroversion: Math.floor(Math.random() * 7) + 3,
    agreeableness: Math.floor(Math.random() * 7) + 3,
    conscientiousness: Math.floor(Math.random() * 7) + 3,
    neuroticism: Math.floor(Math.random() * 7) + 2,
    openness: Math.floor(Math.random() * 7) + 3,
  }
}

function generateSpiWorkStyle() {
  return {
    leadership: Math.floor(Math.random() * 7) + 3,
    independence: Math.floor(Math.random() * 7) + 3,
    teamwork: Math.floor(Math.random() * 7) + 3,
    persistence: Math.floor(Math.random() * 7) + 3,
    flexibility: Math.floor(Math.random() * 7) + 3,
    stressTolerance: Math.floor(Math.random() * 7) + 3,
  }
}

function generateSpiAptitude() {
  return {
    verbal: Math.floor(Math.random() * 5) + 5,
    numerical: Math.floor(Math.random() * 5) + 5,
    logical: Math.floor(Math.random() * 5) + 5,
  }
}

function getTeamForIndex(index: number): string {
  if (index < 10) return 'team-1'
  if (index < 15) return 'team-2'
  if (index < 25) return 'team-3'
  if (index < 35) return 'team-4'
  return 'team-5'
}

function getJobTypeForIndex(index: number): JobType {
  if (index < 10) return 'engineer'
  if (index < 15) return 'designer'
  if (index < 18) return 'product_manager'
  if (index < 25) return 'sales'
  if (index < 32) return 'marketing'
  if (index < 35) return 'hr'
  if (index < 38) return 'finance'
  return 'operations'
}

function getRoleForIndex(index: number): UserRole {
  if ([0, 10, 20, 30, 35].includes(index)) return 'manager'
  if (index === 36) return 'admin'
  return 'member'
}

const jobTitles = ['シニアエンジニア', 'エンジニア', 'リードデザイナー', 'デザイナー', 'PM', '営業マネージャー', '営業', 'マーケター', 'HR', '経理', '戦略企画']

const employeesData: EmployeeWithDetails[] = Array.from({ length: 40 }, (_, i) => {
  const lastName = lastNames[i % lastNames.length] as string
  const firstName = firstNames[i % firstNames.length] as string
  const name = `${lastName} ${firstName}`
  const strengthsOrder = generateStrengthsOrder()

  return {
    id: `emp-${i + 1}`,
    authUserId: null,
    email: generateEmail(lastName, firstName, i + 1),
    name,
    nameKana: name,
    avatarUrl: null,
    teamId: getTeamForIndex(i),
    team: demoTeams.find(t => t.id === getTeamForIndex(i)) || null,
    jobTitle: jobTitles[i % jobTitles.length] ?? null,
    jobType: getJobTypeForIndex(i),
    role: getRoleForIndex(i),
    hireDate: `20${18 + Math.floor(i / 8)}-0${(i % 12) + 1}-01`,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    strengths: {
      id: `str-${i + 1}`,
      strengthsOrder: strengthsOrder,
    },
    spiResults: {
      id: `spi-${i + 1}`,
      personalityTraits: generateSpiTraits(),
      workStyle: generateSpiWorkStyle(),
      aptitudeScores: generateSpiAptitude(),
      testDate: '2023-06-01',
    },
    aiProfile: {
      id: `ai-${i + 1}`,
      profileSummary: `${name}さんは、${getStrengthById(strengthsOrder[0] ?? '')?.name ?? '達成欲'}と${getStrengthById(strengthsOrder[1] ?? '')?.name ?? '学習欲'}を強みとする人材です。チームへの貢献度が高く、特に${['問題解決', '創造的なアイデア出し', 'チームビルディング', '戦略立案'][i % 4] ?? '問題解決'}において力を発揮します。`,
      workStyleAnalysis: `${getStrengthById(strengthsOrder[0] ?? '')?.name ?? '達成欲'}の資質から、${['着実に成果を積み上げる', '周囲を巻き込む', '人間関係を大切にする', '長期的な視点で考える'][i % 4] ?? '着実に成果を積み上げる'}スタイルで仕事を進めます。`,
      collaborationTips: `${name}さんと協働する際は、${['具体的な目標設定', '自由な発想の余地', '定期的なコミュニケーション', 'データに基づいた議論'][i % 4] ?? '具体的な目標設定'}を心がけると効果的です。`,
      developmentSuggestions: `今後の成長のために、${['リーダーシップスキル', 'プレゼンテーション力', '専門性の深化', '異分野への挑戦'][i % 4] ?? 'リーダーシップスキル'}を伸ばすことをお勧めします。`,
      generatedAt: '2024-01-15T10:00:00Z',
    },
    careers: [
      {
        id: `career-${i + 1}-1`,
        employeeId: `emp-${i + 1}`,
        companyName: '現職株式会社',
        position: jobTitles[i % jobTitles.length] as string,
        startDate: `20${18 + Math.floor(i / 8)}-0${(i % 12) + 1}-01`,
        endDate: null,
        description: '現在の職務',
        isCurrent: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
    evaluations: i % 3 === 0 ? [
      {
        id: `eval-${i + 1}-1`,
        employeeId: `emp-${i + 1}`,
        evaluatorId: 'emp-1',
        period: '2024H1',
        overallGrade: (['S', 'A', 'B', 'A', 'B'] as const)[i % 5] ?? 'B',
        strengthsComment: '業務遂行能力が高く、チームへの貢献も顕著',
        improvementsComment: 'より広い視野での課題発見を期待',
        goals: '次期プロジェクトでのリーダーシップ発揮',
        createdAt: '2024-07-01T00:00:00Z',
        updatedAt: '2024-07-01T00:00:00Z',
      },
    ] : [],
  }
})

export function getDemoEmployees(): Employee[] {
  return employeesData.map(({ strengths, spiResults, aiProfile, careers, evaluations, ...employee }) => employee)
}

export function getDemoEmployeeById(id: string): EmployeeWithDetails | null {
  return employeesData.find(e => e.id === id) || null
}

export function getDemoTeams(): Team[] {
  return demoTeams
}

export function getDemoTeamById(id: string): TeamWithMembers | null {
  const team = demoTeams.find(t => t.id === id)
  if (!team) return null

  const members = employeesData
    .filter(e => e.teamId === id)
    .map(({ strengths, spiResults, aiProfile, careers, evaluations, ...emp }) => emp)

  return {
    ...team,
    members,
    memberCount: members.length,
  }
}

export function getAllDemoEmployeesWithDetails(): EmployeeWithDetails[] {
  return employeesData
}
