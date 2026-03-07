import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { teams, employees, strengths, spiResults, careers, evaluations, aiProfiles } from '../src/db/schema'
import type { SpiPersonalityTraits, SpiWorkStyle, SpiAptitudeScores } from '@talent/types'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

// ストレングスファインダー34資質
const STRENGTHS_IDS = [
  'achiever', 'arranger', 'belief', 'consistency', 'deliberative', 'discipline', 'focus', 'responsibility', 'restorative',
  'activator', 'command', 'communication', 'competition', 'maximizer', 'self_assurance', 'significance', 'woo',
  'adaptability', 'connectedness', 'developer', 'empathy', 'harmony', 'includer', 'individualization', 'positivity', 'relator',
  'analytical', 'context', 'futuristic', 'ideation', 'input', 'intellection', 'learner', 'strategic'
]

// 日本人名サンプル
const FIRST_NAMES = ['太郎', '次郎', '健一', '大輔', '翔太', '拓也', '直樹', '和也', '雄大', '達也', '花子', '美咲', '真由', '彩', '優子', '恵', '由美', '麻衣', '綾', '愛']
const LAST_NAMES = ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']

const JOB_TYPES = ['engineer', 'designer', 'product_manager', 'sales', 'marketing', 'hr', 'finance', 'operations'] as const
const JOB_TITLES: Record<string, string[]> = {
  engineer: ['ソフトウェアエンジニア', 'シニアエンジニア', 'テックリード', 'フロントエンドエンジニア', 'バックエンドエンジニア'],
  designer: ['UIデザイナー', 'UXデザイナー', 'プロダクトデザイナー', 'シニアデザイナー'],
  product_manager: ['プロダクトマネージャー', 'シニアPM', 'プロダクトオーナー'],
  sales: ['営業', '営業マネージャー', 'アカウントエグゼクティブ'],
  marketing: ['マーケター', 'コンテンツマーケター', 'グロースマーケター'],
  hr: ['人事', '採用担当', 'HRマネージャー'],
  finance: ['経理', '財務担当', 'ファイナンスマネージャー'],
  operations: ['オペレーション', '業務推進', 'カスタマーサクセス'],
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateSpiPersonalityTraits(): SpiPersonalityTraits {
  return {
    extroversion: randomInt(3, 9),
    agreeableness: randomInt(3, 9),
    conscientiousness: randomInt(3, 9),
    neuroticism: randomInt(2, 7),
    openness: randomInt(4, 9),
  }
}

function generateSpiWorkStyle(): SpiWorkStyle {
  return {
    leadership: randomInt(3, 9),
    independence: randomInt(3, 9),
    teamwork: randomInt(4, 9),
    persistence: randomInt(4, 9),
    flexibility: randomInt(3, 8),
    stress_tolerance: randomInt(4, 8),
  }
}

function generateSpiAptitudeScores(): SpiAptitudeScores {
  return {
    verbal: randomInt(4, 9),
    numerical: randomInt(4, 9),
    logical: randomInt(4, 9),
  }
}

function generateHireDate(): string {
  const year = randomInt(2018, 2024)
  const month = String(randomInt(1, 12)).padStart(2, '0')
  const day = String(randomInt(1, 28)).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  console.log('Clearing existing data...')
  await db.delete(aiProfiles)
  await db.delete(evaluations)
  await db.delete(careers)
  await db.delete(spiResults)
  await db.delete(strengths)
  await db.delete(employees)
  await db.delete(teams)

  // Create teams
  console.log('Creating teams...')
  const teamData = [
    { name: 'プロダクト開発部', description: 'プロダクトの企画・開発を担当' },
    { name: 'エンジニアリング部', description: '技術基盤とシステム開発を担当' },
    { name: 'デザイン部', description: 'UI/UXデザインを担当' },
    { name: 'セールス部', description: '営業活動と顧客開拓を担当' },
    { name: 'マーケティング部', description: 'マーケティング戦略と実行を担当' },
    { name: '人事部', description: '採用と組織開発を担当' },
    { name: '経営企画部', description: '経営戦略と事業計画を担当' },
  ]

  const insertedTeams = await db.insert(teams).values(teamData).returning()
  console.log(`Created ${insertedTeams.length} teams`)

  // Create employees (40名)
  console.log('Creating employees...')
  const employeeData = []
  const usedEmails = new Set<string>()

  for (let i = 0; i < 40; i++) {
    const firstName = randomElement(FIRST_NAMES)
    const lastName = randomElement(LAST_NAMES)
    const name = `${lastName} ${firstName}`

    let email: string
    do {
      const randomNum = randomInt(1, 999)
      email = `${lastName.toLowerCase()}${firstName.toLowerCase()}${randomNum}@example.com`
    } while (usedEmails.has(email))
    usedEmails.add(email)

    const jobType = randomElement(JOB_TYPES)
    const jobTitle = randomElement(JOB_TITLES[jobType])
    const team = randomElement(insertedTeams)
    const role = i < 3 ? 'admin' : i < 10 ? 'manager' : 'member'

    employeeData.push({
      email,
      name,
      nameKana: `${lastName} ${firstName}`, // 簡略化
      teamId: team.id,
      jobTitle,
      jobType,
      role: role as 'admin' | 'manager' | 'member',
      hireDate: generateHireDate(),
      isActive: Math.random() > 0.05, // 95%がアクティブ
    })
  }

  const insertedEmployees = await db.insert(employees).values(employeeData).returning()
  console.log(`Created ${insertedEmployees.length} employees`)

  // Update team managers
  console.log('Updating team managers...')
  const managers = insertedEmployees.filter(e => e.role === 'manager' || e.role === 'admin')
  for (let i = 0; i < insertedTeams.length && i < managers.length; i++) {
    await db.update(teams)
      .set({ managerId: managers[i].id })
      .where((eb: any) => eb.eq(teams.id, insertedTeams[i].id))
  }

  // Create strengths for each employee
  console.log('Creating strengths...')
  const strengthsData = insertedEmployees.map(emp => ({
    employeeId: emp.id,
    strengthsOrder: shuffleArray(STRENGTHS_IDS),
  }))
  await db.insert(strengths).values(strengthsData)
  console.log(`Created ${strengthsData.length} strength records`)

  // Create SPI results for each employee
  console.log('Creating SPI results...')
  const spiData = insertedEmployees.map(emp => ({
    employeeId: emp.id,
    personalityTraits: generateSpiPersonalityTraits(),
    workStyle: generateSpiWorkStyle(),
    aptitudeScores: generateSpiAptitudeScores(),
    testDate: generateHireDate(),
  }))
  await db.insert(spiResults).values(spiData)
  console.log(`Created ${spiData.length} SPI records`)

  // Create careers (1-3 per employee)
  console.log('Creating careers...')
  const careerData = []
  for (const emp of insertedEmployees) {
    const numCareers = randomInt(1, 3)
    for (let i = 0; i < numCareers; i++) {
      const isCurrent = i === 0
      careerData.push({
        employeeId: emp.id,
        companyName: isCurrent ? '株式会社タレントマネジメント' : `株式会社${randomElement(LAST_NAMES)}テック`,
        position: emp.jobTitle || 'スタッフ',
        startDate: generateHireDate(),
        endDate: isCurrent ? null : generateHireDate(),
        description: isCurrent ? '現職' : '前職での経験',
        isCurrent,
      })
    }
  }
  await db.insert(careers).values(careerData)
  console.log(`Created ${careerData.length} career records`)

  // Create evaluations (for some employees)
  console.log('Creating evaluations...')
  const evaluationData = []
  const periods = ['2023H1', '2023H2', '2024H1', '2024H2']
  const grades = ['S', 'A', 'B', 'C'] as const

  for (const emp of insertedEmployees.slice(0, 30)) {
    const evaluator = randomElement(managers)
    const period = randomElement(periods)
    evaluationData.push({
      employeeId: emp.id,
      evaluatorId: evaluator.id,
      period,
      overallGrade: randomElement(grades),
      strengthsComment: '業務への取り組み姿勢が素晴らしい。チームへの貢献度も高い。',
      improvementsComment: 'より積極的な提案活動を期待。',
      goals: '次期プロジェクトでのリーダーシップ発揮',
    })
  }
  await db.insert(evaluations).values(evaluationData)
  console.log(`Created ${evaluationData.length} evaluation records`)

  // Create AI profiles (for some employees)
  console.log('Creating AI profiles...')
  const aiProfileData = insertedEmployees.slice(0, 20).map(emp => ({
    employeeId: emp.id,
    profileSummary: `${emp.name}さんは、チームの中核を担う存在です。高い専門性と協調性を兼ね備え、プロジェクトの成功に大きく貢献しています。`,
    workStyleAnalysis: '計画的に業務を進める傾向があり、締め切りを厳守します。チームメンバーとの連携を重視し、情報共有を積極的に行います。',
    collaborationTips: 'ミーティングでは具体的なアジェンダを事前に共有すると効果的です。論理的な説明を好むため、データに基づいた提案が有効です。',
    developmentSuggestions: 'リーダーシップスキルの向上が次のステップです。メンタリングの機会を増やすことで、マネジメント能力を伸ばせるでしょう。',
    modelVersion: 'claude-3-opus',
  }))
  await db.insert(aiProfiles).values(aiProfileData)
  console.log(`Created ${aiProfileData.length} AI profile records`)

  console.log('✅ Seeding completed!')
}

seed().catch(console.error)
