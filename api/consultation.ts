import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  configureCors,
  validateAuth,
  hasRequiredRole,
  validators,
  setSecurityHeaders,
} from './_utils/security'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface EmployeeContext {
  name: string
  team: string
  jobTitle: string
  top5Strengths: string[]
  spiTraits?: Record<string, number>
  aiProfile?: string
}

interface ConsultationRequest {
  messages: Message[]
  employeeContext?: EmployeeContext[]
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

  // Check role permissions
  if (!hasRequiredRole(authResult.role, ['admin', 'manager', 'member'])) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }

  try {
    const body = req.body as ConsultationRequest

    // Input validation
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const { messages, employeeContext } = body

    // Validate messages
    if (!validators.isValidMessageArray(messages)) {
      return res.status(400).json({
        error: 'Invalid messages format. Expected array of {role, content} objects.',
      })
    }

    // Validate employee context if provided
    if (employeeContext) {
      if (!Array.isArray(employeeContext) || employeeContext.length > 10) {
        return res.status(400).json({
          error: 'Invalid employeeContext. Expected array with max 10 items.',
        })
      }

      for (const ctx of employeeContext) {
        if (!validators.isValidString(ctx.name, 100) ||
            !validators.isValidString(ctx.team, 100) ||
            !validators.isValidString(ctx.jobTitle, 100)) {
          return res.status(400).json({
            error: 'Invalid employee context data.',
          })
        }
      }
    }

    // Sanitize message content
    const sanitizedMessages = messages.map(m => ({
      role: m.role,
      content: validators.sanitizeString(m.content),
    }))

    // Build system prompt with employee context
    let systemPrompt = `あなたは社内タレントマネジメントシステムのAIアシスタントです。
社員の強み（ストレングスファインダー）、SPI結果、評価情報を基に、
チーム編成、人材配置、育成アドバイスを提供します。

以下のガイドラインに従ってください：
- 日本語で回答してください
- 具体的で実用的なアドバイスを提供してください
- ストレングスファインダーの34資質について深い知識を持っています
- チームダイナミクスと補完関係を考慮してアドバイスします
- 個人の強みを活かす視点でアドバイスします
- 機密性の高い情報は共有しないでください`

    if (employeeContext && employeeContext.length > 0) {
      systemPrompt += '\n\n以下は相談に関連する社員情報です：\n'
      employeeContext.forEach(emp => {
        systemPrompt += `\n【${validators.sanitizeString(emp.name)}】\n`
        systemPrompt += `- 所属: ${validators.sanitizeString(emp.team)}\n`
        systemPrompt += `- 役職: ${validators.sanitizeString(emp.jobTitle)}\n`
        if (emp.top5Strengths?.length) {
          systemPrompt += `- TOP5資質: ${emp.top5Strengths.slice(0, 5).map(s => validators.sanitizeString(s)).join(', ')}\n`
        }
        if (emp.aiProfile) {
          systemPrompt += `- AIプロフィール: ${validators.sanitizeString(emp.aiProfile).slice(0, 500)}\n`
        }
      })
    }

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
        system: systemPrompt,
        messages: sanitizedMessages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return res.status(response.status).json({ error: 'AI API request failed' })
    }

    const data = await response.json()

    return res.status(200).json({
      content: data.content[0].text,
      usage: data.usage,
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
