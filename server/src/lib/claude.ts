import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Extract first complete JSON object from text using balanced bracket matching
function extractFirstJson(text: string): string | null {
  const startIndex = text.indexOf('{')
  if (startIndex === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"' && !escape) {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{') depth++
      else if (char === '}') {
        depth--
        if (depth === 0) {
          return text.slice(startIndex, i + 1)
        }
      }
    }
  }

  return null
}

export interface StreamCallbacks {
  onText?: (text: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

export async function streamConsultation(
  messages: Message[],
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  let fullText = ''

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text
        fullText += text
        callbacks.onText?.(text)
      }
    }

    callbacks.onComplete?.(fullText)
  } catch (error) {
    callbacks.onError?.(error as Error)
    throw error
  }
}

export async function generateEmployeeProfile(
  employeeData: {
    name: string
    jobTitle?: string
    jobType?: string
    strengths?: string[]
    spiResults?: {
      personalityTraits: Record<string, number>
      workStyle: Record<string, number>
      aptitudeScores: Record<string, number>
    }
  }
): Promise<{
  profileSummary: string
  workStyleAnalysis: string
  collaborationTips: string
  developmentSuggestions: string
}> {
  const prompt = `
あなたは人材開発の専門家です。以下の従業員データを分析し、日本語でプロフィールを生成してください。

従業員情報:
- 名前: ${employeeData.name}
- 職種: ${employeeData.jobTitle || '未設定'}
- 職種カテゴリ: ${employeeData.jobType || '未設定'}
- ストレングスファインダーTOP5: ${employeeData.strengths?.slice(0, 5).join(', ') || '未測定'}
- SPI性格特性: ${employeeData.spiResults ? JSON.stringify(employeeData.spiResults.personalityTraits) : '未測定'}
- SPI働き方: ${employeeData.spiResults ? JSON.stringify(employeeData.spiResults.workStyle) : '未測定'}

以下の4つのセクションに分けてJSON形式で回答してください:
1. profileSummary: この人物の全体的な特徴（100-150文字）
2. workStyleAnalysis: 働き方の傾向と強み（150-200文字）
3. collaborationTips: この人と協働する際のコツ（150-200文字）
4. developmentSuggestions: 成長のためのアドバイス（150-200文字）

JSON形式のみで回答してください。
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    // Try parsing the entire response first (when response is pure JSON)
    try {
      return JSON.parse(content.text.trim())
    } catch {
      // Extract JSON from response using balanced bracket matching
      const jsonStr = extractFirstJson(content.text)
      if (!jsonStr) {
        throw new Error('No JSON found in response')
      }
      return JSON.parse(jsonStr)
    }
  } catch {
    // Fallback if parsing fails
    return {
      profileSummary: `${employeeData.name}さんのプロフィールを生成中にエラーが発生しました。`,
      workStyleAnalysis: '分析データを取得できませんでした。',
      collaborationTips: '情報が不足しています。',
      developmentSuggestions: 'データを再取得してください。',
    }
  }
}

export async function generateTeamAnalysis(
  teamData: {
    name: string
    memberCount: number
    strengthsDistribution: Record<string, number>
    jobTypeDistribution: Record<string, number>
  }
): Promise<{
  teamDynamics: string
  strengthsDistribution: string
  potentialChallenges: string
  recommendations: string
}> {
  const prompt = `
あなたはチームビルディングの専門家です。以下のチームデータを分析し、日本語でレポートを生成してください。

チーム情報:
- チーム名: ${teamData.name}
- メンバー数: ${teamData.memberCount}名
- 強みドメイン分布: ${JSON.stringify(teamData.strengthsDistribution)}
- 職種分布: ${JSON.stringify(teamData.jobTypeDistribution)}

以下の4つのセクションに分けてJSON形式で回答してください:
1. teamDynamics: チームの特徴とダイナミクス（150-200文字）
2. strengthsDistribution: 強みの分布分析（150-200文字）
3. potentialChallenges: 潜在的な課題（100-150文字）
4. recommendations: 改善提案（150-200文字）

JSON形式のみで回答してください。
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    // Try parsing the entire response first (when response is pure JSON)
    try {
      return JSON.parse(content.text.trim())
    } catch {
      // Extract JSON from response using balanced bracket matching
      const jsonStr = extractFirstJson(content.text)
      if (!jsonStr) {
        throw new Error('No JSON found in response')
      }
      return JSON.parse(jsonStr)
    }
  } catch {
    return {
      teamDynamics: `${teamData.name}の分析中にエラーが発生しました。`,
      strengthsDistribution: '分析データを取得できませんでした。',
      potentialChallenges: '情報が不足しています。',
      recommendations: 'データを再取得してください。',
    }
  }
}
