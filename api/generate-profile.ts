import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  configureCors,
  validateAuth,
  hasRequiredRole,
  validators,
  setSecurityHeaders,
} from './_utils/security'

interface GenerateProfileRequest {
  employeeId: string
  employeeData: {
    name: string
    team: string
    jobTitle: string
    jobType: string
    strengths?: string[]
    spiTraits?: {
      personality: Record<string, number>
      workStyle: Record<string, number>
    }
    evaluations?: Array<{
      period: string
      grade: string
      strengths: string
      improvements: string
    }>
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers
  setSecurityHeaders(res)

  // Handle CORS
  if (configureCors(req, res)) {
    return // Preflight request handled
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate authentication
  const authResult = await validateAuth(req)
  if (!authResult.isValid) {
    return res.status(401).json({ error: authResult.error || 'Unauthorized' })
  }

  // Only admin can regenerate profiles
  if (!hasRequiredRole(authResult.role, ['admin'])) {
    return res.status(403).json({ error: 'Only administrators can regenerate AI profiles' })
  }

  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }

  try {
    const body = req.body as GenerateProfileRequest

    // Input validation
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const { employeeId, employeeData } = body

    // Validate employee ID
    if (!validators.isValidUUID(employeeId) && !employeeId?.startsWith('emp-')) {
      return res.status(400).json({ error: 'Invalid employee ID format' })
    }

    // Validate employee data
    if (!employeeData || typeof employeeData !== 'object') {
      return res.status(400).json({ error: 'Invalid employee data' })
    }

    if (!validators.isValidString(employeeData.name, 100) ||
        !validators.isValidString(employeeData.team, 100) ||
        !validators.isValidString(employeeData.jobTitle, 100) ||
        !validators.isValidString(employeeData.jobType, 50)) {
      return res.status(400).json({
        error: 'Invalid employee data fields',
      })
    }

    // Validate strengths if provided
    if (employeeData.strengths) {
      if (!validators.isValidStringArray(employeeData.strengths, 34, 50)) {
        return res.status(400).json({ error: 'Invalid strengths array' })
      }
    }

    // Validate evaluations if provided
    if (employeeData.evaluations) {
      if (!Array.isArray(employeeData.evaluations) || employeeData.evaluations.length > 10) {
        return res.status(400).json({ error: 'Invalid evaluations array' })
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      name: validators.sanitizeString(employeeData.name),
      team: validators.sanitizeString(employeeData.team),
      jobTitle: validators.sanitizeString(employeeData.jobTitle),
      jobType: validators.sanitizeString(employeeData.jobType),
      strengths: employeeData.strengths?.map(s => validators.sanitizeString(s)),
      spiTraits: employeeData.spiTraits,
      evaluations: employeeData.evaluations?.map(e => ({
        period: validators.sanitizeString(e.period),
        grade: validators.sanitizeString(e.grade),
        strengths: validators.sanitizeString(e.strengths),
        improvements: validators.sanitizeString(e.improvements),
      })),
    }

    const prompt = `以下の社員情報を基に、4つの観点から分析してください。
各セクションは簡潔に2-3文でまとめてください。

【社員情報】
- 名前: ${sanitizedData.name}
- 所属: ${sanitizedData.team}
- 役職: ${sanitizedData.jobTitle}
- 職種: ${sanitizedData.jobType}
${sanitizedData.strengths ? `- TOP5資質: ${sanitizedData.strengths.slice(0, 5).join(', ')}` : ''}
${sanitizedData.spiTraits ? `- 性格特性: ${JSON.stringify(sanitizedData.spiTraits.personality)}
- ワークスタイル: ${JSON.stringify(sanitizedData.spiTraits.workStyle)}` : ''}
${sanitizedData.evaluations?.length ? `- 直近の評価: ${sanitizedData.evaluations[0].grade}
  強み: ${sanitizedData.evaluations[0].strengths}
  改善点: ${sanitizedData.evaluations[0].improvements}` : ''}

以下のJSON形式で回答してください：
{
  "profile_summary": "この人物の総合的なプロフィール",
  "work_style_analysis": "仕事の進め方や働き方の特徴",
  "collaboration_tips": "この人と効果的に協働するためのアドバイス",
  "development_suggestions": "今後の成長に向けた提案"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return res.status(response.status).json({ error: 'AI API request failed' })
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }

    const profile = JSON.parse(jsonMatch[0])

    return res.status(200).json({
      profile,
      model_version: 'claude-sonnet-4-5-20250929',
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
