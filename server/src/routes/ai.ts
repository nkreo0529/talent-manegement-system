import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { aiService } from '../services/ai.service'
import { requireAuth, requireRole } from '../middleware/auth'

const aiRoutes = new Hono()

// Validation schemas
const consultationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  context: z
    .object({
      employeeId: z.string().uuid().optional(),
      teamId: z.string().uuid().optional(),
    })
    .optional(),
})

// Routes
aiRoutes.use('*', requireAuth)

// POST /api/ai/consultation - AI Consultation (streaming)
aiRoutes.post('/consultation', zValidator('json', consultationSchema), async (c) => {
  const { messages, context } = c.req.valid('json')

  return streamSSE(c, async (stream) => {
    try {
      await aiService.streamConsultation(
        messages,
        context || {},
        {
          onText: async (text) => {
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', content: text }) })
          },
          onComplete: async (fullText) => {
            await stream.writeSSE({ data: JSON.stringify({ type: 'done', content: fullText }) })
          },
          onError: async (error) => {
            await stream.writeSSE({ data: JSON.stringify({ type: 'error', content: error.message }) })
          },
        }
      )
    } catch (error) {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'error', content: (error as Error).message }),
      })
    }
  })
})

// POST /api/ai/profiles/:employeeId/generate - Generate AI Profile
aiRoutes.post('/profiles/:employeeId/generate', requireRole('admin', 'manager'), async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId) return c.json({ error: { message: 'Employee ID is required' } }, 400)

  try {
    const profile = await aiService.generateProfile(employeeId)
    return c.json({ data: profile })
  } catch (error) {
    return c.json({ error: { message: (error as Error).message } }, 500)
  }
})

// GET /api/ai/profiles/:employeeId - Get AI Profile
aiRoutes.get('/profiles/:employeeId', async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId) return c.json({ error: { message: 'Employee ID is required' } }, 400)
  const profile = await aiService.getProfile(employeeId)

  if (!profile) {
    return c.json({ error: { message: 'AI profile not found' } }, 404)
  }

  return c.json({ data: profile })
})

// POST /api/ai/teams/:teamId/analyze - Generate Team Analysis
aiRoutes.post('/teams/:teamId/analyze', requireRole('admin', 'manager'), async (c) => {
  const teamId = c.req.param('teamId')
  if (!teamId) return c.json({ error: { message: 'Team ID is required' } }, 400)

  try {
    const analysis = await aiService.generateTeamAnalysis(teamId)
    return c.json({ data: analysis })
  } catch (error) {
    return c.json({ error: { message: (error as Error).message } }, 500)
  }
})

// GET /api/ai/teams/:teamId - Get Team Analysis
aiRoutes.get('/teams/:teamId', async (c) => {
  const teamId = c.req.param('teamId')
  if (!teamId) return c.json({ error: { message: 'Team ID is required' } }, 400)
  const analysis = await aiService.getTeamAnalysis(teamId)

  if (!analysis) {
    return c.json({ error: { message: 'Team analysis not found' } }, 404)
  }

  return c.json({ data: analysis })
})

export { aiRoutes }
