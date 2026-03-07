/**
 * Supabase Seed Script
 *
 * このスクリプトは40名分のダミーデータをSupabaseに投入します。
 *
 * 使用方法:
 * 1. .envファイルにSupabase接続情報を設定
 * 2. npx ts-node scripts/seed.ts を実行
 */

import { createClient } from '@supabase/supabase-js'

// 環境変数から接続情報を取得
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Service Role Key が必要

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数 VITE_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 34資質のID
const STRENGTHS_34 = [
  'achiever', 'arranger', 'belief', 'consistency', 'deliberative', 'discipline', 'focus', 'responsibility', 'restorative',
  'activator', 'command', 'communication', 'competition', 'maximizer', 'self_assurance', 'significance', 'woo',
  'adaptability', 'connectedness', 'developer', 'empathy', 'harmony', 'includer', 'individualization', 'positivity', 'relator',
  'analytical', 'context', 'futuristic', 'ideation', 'input', 'intellection', 'learner', 'strategic',
]

// 名前データ
const firstNames = ['太郎', '花子', '一郎', '美咲', '健太', '陽子', '大輔', '愛', '翔太', '麻衣', '拓也', '彩', '雄介', '真由', '直樹', '沙織', '和也', '恵', '隆', '由美']
const lastNames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function seed() {
  console.log('🌱 シード開始...')

  // 1. チームを作成
  console.log('📁 チームを作成中...')
  const teamsData = [
    { name: '開発チーム', description: 'プロダクト開発を担当' },
    { name: 'デザインチーム', description: 'UI/UXデザインを担当' },
    { name: '営業チーム', description: '顧客開拓と関係構築' },
    { name: 'マーケティングチーム', description: 'ブランディングと集客' },
    { name: '経営企画チーム', description: '戦略立案と組織運営' },
  ]

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .insert(teamsData)
    .select()

  if (teamsError) {
    console.error('チーム作成エラー:', teamsError)
    return
  }
  console.log(`✅ ${teams.length}チーム作成完了`)

  // 2. 社員を作成
  console.log('👥 社員を作成中...')
  const jobTypes = ['engineer', 'designer', 'product_manager', 'sales', 'marketing', 'hr', 'finance', 'operations']

  const employeesData = Array.from({ length: 40 }, (_, i) => {
    const lastName = lastNames[i % lastNames.length]
    const firstName = firstNames[i % firstNames.length]
    const teamIndex = i < 10 ? 0 : i < 15 ? 1 : i < 25 ? 2 : i < 35 ? 3 : 4
    const jobType = i < 10 ? 'engineer' : i < 15 ? 'designer' : i < 18 ? 'product_manager' : i < 25 ? 'sales' : i < 32 ? 'marketing' : jobTypes[randomInt(5, 7)]
    const role = [0, 10, 20, 30, 35].includes(i) ? 'manager' : i === 36 ? 'admin' : 'member'

    return {
      email: `user${i + 1}@example.com`,
      name: `${lastName} ${firstName}`,
      name_kana: `${lastName} ${firstName}`,
      team_id: teams[teamIndex].id,
      job_title: role === 'manager' ? `${jobTypes[teamIndex]}マネージャー` : jobType === 'engineer' ? 'エンジニア' : jobType,
      job_type: jobType,
      role: role,
      hire_date: `20${18 + Math.floor(i / 8)}-0${(i % 12) + 1}-01`,
      is_active: true,
    }
  })

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .insert(employeesData)
    .select()

  if (employeesError) {
    console.error('社員作成エラー:', employeesError)
    return
  }
  console.log(`✅ ${employees.length}名の社員作成完了`)

  // 3. チームのマネージャーを設定
  console.log('👔 マネージャーを設定中...')
  const managerIndices = [0, 10, 20, 30, 35]
  for (let i = 0; i < teams.length; i++) {
    await supabase
      .from('teams')
      .update({ manager_id: employees[managerIndices[i]].id })
      .eq('id', teams[i].id)
  }
  console.log('✅ マネージャー設定完了')

  // 4. ストレングスを作成
  console.log('⭐ ストレングス情報を作成中...')
  const strengthsData = employees.map(emp => ({
    employee_id: emp.id,
    strengths_order: shuffle(STRENGTHS_34),
  }))

  const { error: strengthsError } = await supabase
    .from('strengths')
    .insert(strengthsData)

  if (strengthsError) {
    console.error('ストレングス作成エラー:', strengthsError)
  } else {
    console.log('✅ ストレングス情報作成完了')
  }

  // 5. SPI結果を作成
  console.log('📊 SPI結果を作成中...')
  const spiData = employees.map(emp => ({
    employee_id: emp.id,
    personality_traits: {
      extroversion: randomInt(3, 9),
      agreeableness: randomInt(3, 9),
      conscientiousness: randomInt(3, 9),
      neuroticism: randomInt(2, 8),
      openness: randomInt(3, 9),
    },
    work_style: {
      leadership: randomInt(3, 9),
      independence: randomInt(3, 9),
      teamwork: randomInt(3, 9),
      persistence: randomInt(3, 9),
      flexibility: randomInt(3, 9),
      stress_tolerance: randomInt(3, 9),
    },
    aptitude_scores: {
      verbal: randomInt(5, 9),
      numerical: randomInt(5, 9),
      logical: randomInt(5, 9),
    },
    test_date: '2023-06-01',
  }))

  const { error: spiError } = await supabase
    .from('spi_results')
    .insert(spiData)

  if (spiError) {
    console.error('SPI作成エラー:', spiError)
  } else {
    console.log('✅ SPI結果作成完了')
  }

  console.log('')
  console.log('🎉 シード完了！')
  console.log(`   - チーム: ${teams.length}`)
  console.log(`   - 社員: ${employees.length}`)
}

seed().catch(console.error)
