import { eq } from 'drizzle-orm'
import { db } from './index'
import { teams, employees, strengths, spiResults, careers, evaluations } from './schema'
import { STRENGTHS_34 } from '@talent/types'

// Shuffle array utility
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Random date in range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

// Sample data
const teamNames = [
  { name: 'プロダクト開発部', description: 'プロダクトの設計・開発を担当するチーム' },
  { name: 'マーケティング部', description: 'マーケティング戦略の立案・実行を担当' },
  { name: '営業部', description: '顧客開拓と売上目標の達成を担当' },
  { name: '人事部', description: '採用・育成・評価制度の運営を担当' },
  { name: 'カスタマーサクセス部', description: '顧客の成功支援を担当' },
]

const firstNames = [
  '太郎', '花子', '健太', '美咲', '翔太', '愛', '大輔', '真由美', '拓也', '由美子',
  '雄介', '麻衣', '直樹', '裕子', '和也', '恵子', '智也', '明美', '誠', '久美子',
  '浩二', '里美', '達也', '陽子', '剛', '純子', '秀樹', '洋子', '宏', '幸子',
  '俊介', '佳代', '慎一', '千恵', '正樹', '美穂', '康平', '絵里', '啓介', '沙織',
]

const lastNames = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
]

const jobTitles = [
  'シニアエンジニア', 'エンジニア', 'プロダクトマネージャー', 'デザイナー',
  'マーケター', '営業マネージャー', '営業担当', '人事マネージャー', '人事担当',
  'カスタマーサクセスマネージャー', 'アカウントマネージャー', 'リードエンジニア',
  'テックリード', 'UIデザイナー', 'UXリサーチャー',
]

const jobTypes = ['engineer', 'designer', 'product_manager', 'sales', 'marketing', 'hr', 'operations'] as const

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await db.delete(evaluations)
  await db.delete(careers)
  await db.delete(spiResults)
  await db.delete(strengths)
  await db.delete(employees)
  await db.delete(teams)

  // Create teams
  console.log('📁 Creating teams...')
  const createdTeams = await db.insert(teams).values(teamNames).returning()
  console.log(`  Created ${createdTeams.length} teams`)

  // Create employees
  console.log('👥 Creating employees...')
  const employeeData: Array<{
    email: string
    name: string
    nameKana: string
    teamId: string
    jobTitle: string
    jobType: typeof jobTypes[number]
    role: 'admin' | 'manager' | 'member'
    hireDate: string
    isActive: boolean
  }> = []

  for (let i = 0; i < 40; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[Math.floor(i / 2) % lastNames.length]
    const name = `${lastName} ${firstName}`
    const email = `${lastName.toLowerCase()}.${firstName.toLowerCase()}${i}@example.com`
    const team = createdTeams[i % createdTeams.length]
    const isManager = i < 5 // First 5 are managers
    const hireDate = randomDate(new Date('2018-01-01'), new Date('2024-01-01'))

    employeeData.push({
      email,
      name,
      nameKana: `${lastName} ${firstName}`.replace(/./g, (c) => c), // Simplified kana
      teamId: team.id,
      jobTitle: jobTitles[i % jobTitles.length],
      jobType: jobTypes[i % jobTypes.length],
      role: isManager ? 'manager' : 'member',
      hireDate,
      isActive: i < 38, // 2 inactive employees
    })
  }

  // Add admin user
  employeeData[0].role = 'admin'
  employeeData[0].email = 'admin@example.com'
  employeeData[0].name = '管理者'

  const createdEmployees = await db.insert(employees).values(employeeData).returning()
  console.log(`  Created ${createdEmployees.length} employees`)

  // Assign managers to teams
  console.log('👔 Assigning managers to teams...')
  for (let i = 0; i < createdTeams.length; i++) {
    await db.update(teams)
      .set({ managerId: createdEmployees[i].id })
      .where(eq(teams.id, createdTeams[i].id))
  }

  // Create strengths for each employee
  console.log('💪 Creating strengths...')
  const strengthIds = STRENGTHS_34.map(s => s.id)
  const strengthsData = createdEmployees.map(emp => ({
    employeeId: emp.id,
    strengthsOrder: shuffle(strengthIds),
  }))
  await db.insert(strengths).values(strengthsData)
  console.log(`  Created strengths for ${strengthsData.length} employees`)

  // Create SPI results for some employees
  console.log('📊 Creating SPI results...')
  const spiData = createdEmployees.slice(0, 30).map(emp => ({
    employeeId: emp.id,
    personalityTraits: {
      extroversion: randomInt(3, 9),
      agreeableness: randomInt(3, 9),
      conscientiousness: randomInt(3, 9),
      neuroticism: randomInt(2, 7),
      openness: randomInt(4, 9),
    },
    workStyle: {
      leadership: randomInt(3, 9),
      independence: randomInt(4, 9),
      teamwork: randomInt(4, 9),
      persistence: randomInt(4, 9),
      flexibility: randomInt(3, 8),
      stressTolerance: randomInt(3, 8),
    },
    aptitudeScores: {
      verbal: randomInt(4, 9),
      numerical: randomInt(4, 9),
      logical: randomInt(4, 9),
    },
    testDate: randomDate(new Date('2023-01-01'), new Date('2024-06-01')),
  }))
  await db.insert(spiResults).values(spiData)
  console.log(`  Created SPI results for ${spiData.length} employees`)

  // Create careers
  console.log('📈 Creating career histories...')
  const careerData: Array<{
    employeeId: string
    companyName: string
    position: string
    startDate: string
    endDate: string | null
    isCurrent: boolean
    description: string | null
  }> = []
  for (const emp of createdEmployees.slice(0, 25)) {
    const numCareers = randomInt(1, 3)
    let currentDate = new Date('2024-06-01')

    for (let j = 0; j < numCareers; j++) {
      const isCurrent = j === 0
      const endDate = isCurrent ? null : currentDate.toISOString().split('T')[0]
      const startDate = new Date(currentDate.getTime() - randomInt(365, 1095) * 24 * 60 * 60 * 1000)

      careerData.push({
        employeeId: emp.id,
        companyName: isCurrent ? '現職' : `株式会社サンプル${j + 1}`,
        position: jobTitles[randomInt(0, jobTitles.length - 1)],
        startDate: startDate.toISOString().split('T')[0],
        endDate,
        isCurrent,
        description: isCurrent ? '現在の職務内容' : '過去の職務経験',
      })

      currentDate = startDate
    }
  }
  if (careerData.length > 0) {
    await db.insert(careers).values(careerData)
  }
  console.log(`  Created ${careerData.length} career records`)

  // Create evaluations
  console.log('📝 Creating evaluations...')
  const grades = ['S', 'A', 'B', 'C', 'D'] as const
  const periods = ['2023年度上期', '2023年度下期', '2024年度上期']
  const evaluationData: Array<{
    employeeId: string
    evaluatorId: string
    period: string
    overallGrade: 'S' | 'A' | 'B' | 'C' | 'D'
    strengthsComment: string | null
    improvementsComment: string | null
    goals: string | null
  }> = []

  for (const emp of createdEmployees.slice(5, 35)) {
    const numEvals = randomInt(1, 3)
    const evaluator = createdEmployees[randomInt(0, 4)] // Managers evaluate

    for (let j = 0; j < numEvals && j < periods.length; j++) {
      evaluationData.push({
        employeeId: emp.id,
        evaluatorId: evaluator.id,
        period: periods[j],
        overallGrade: grades[randomInt(0, 2)], // Mostly S, A, B
        strengthsComment: '業務への積極的な取り組みが評価できます。',
        improvementsComment: '更なるスキルアップを期待します。',
        goals: '次期の目標を達成する。',
      })
    }
  }
  if (evaluationData.length > 0) {
    await db.insert(evaluations).values(evaluationData)
  }
  console.log(`  Created ${evaluationData.length} evaluation records`)

  console.log('✅ Seeding complete!')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
