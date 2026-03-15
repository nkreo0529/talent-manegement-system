import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { evaluationService } from '../services/evaluation.service'
import { requireAuth, requireRole } from '../middleware/auth'

const evaluationRoutes = new Hono()

// Validation schemas
const evaluationCreateSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().min(1),
  overallGrade: z.enum(['S', 'A', 'B', 'C', 'D']),
  strengthsComment: z.string().optional().nullable(),
  improvementsComment: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
})

const evaluationUpdateSchema = evaluationCreateSchema.partial().omit({ employeeId: true })

// UUID validation helper
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Routes
evaluationRoutes.use('*', requireAuth)

// GET /api/evaluations/employee/:employeeId - Get evaluations by employee ID (manager/admin)
evaluationRoutes.get('/employee/:employeeId', requireRole('admin', 'manager'), async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId || !uuidRegex.test(employeeId)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  const results = await evaluationService.findByEmployeeId(employeeId)
  return c.json({ data: results })
})

// GET /api/evaluations/:id - Get evaluation by ID (manager/admin)
evaluationRoutes.get('/:id', requireRole('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  const result = await evaluationService.findById(id)

  if (!result) {
    return c.json({ error: { message: 'Evaluation not found' } }, 404)
  }

  return c.json({ data: result })
})

// POST /api/evaluations - Create evaluation (manager/admin)
evaluationRoutes.post(
  '/',
  requireRole('admin', 'manager'),
  zValidator('json', evaluationCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')!

    // Check for existing evaluation in same period
    const existing = await evaluationService.findByPeriod(data.employeeId, data.period)
    if (existing) {
      return c.json({ error: { message: 'Evaluation for this period already exists' } }, 400)
    }

    const result = await evaluationService.create({
      employeeId: data.employeeId,
      evaluatorId: user.employeeId || user.id,
      period: data.period,
      overallGrade: data.overallGrade,
      strengthsComment: data.strengthsComment ?? null,
      improvementsComment: data.improvementsComment ?? null,
      goals: data.goals ?? null,
    })
    return c.json({ data: result }, 201)
  }
)

// PUT /api/evaluations/:id - Update evaluation (manager/admin)
evaluationRoutes.put(
  '/:id',
  requireRole('admin', 'manager'),
  zValidator('json', evaluationUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
    const data = c.req.valid('json')

    const existing = await evaluationService.findById(id)
    if (!existing) {
      return c.json({ error: { message: 'Evaluation not found' } }, 404)
    }

    const result = await evaluationService.update(id, data)
    return c.json({ data: result })
  }
)

// DELETE /api/evaluations/:id - Delete evaluation (admin only)
evaluationRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)

  const existing = await evaluationService.findById(id)
  if (!existing) {
    return c.json({ error: { message: 'Evaluation not found' } }, 404)
  }

  await evaluationService.delete(id)
  return c.json({ success: true })
})

export { evaluationRoutes }
