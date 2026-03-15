import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { spiService } from '../services/spi.service'
import { requireAuth, requireRole } from '../middleware/auth'

const spiRoutes = new Hono()

// Validation schema
const spiUpsertSchema = z.object({
  personalityTraits: z.object({
    extroversion: z.number().min(1).max(10),
    agreeableness: z.number().min(1).max(10),
    conscientiousness: z.number().min(1).max(10),
    neuroticism: z.number().min(1).max(10),
    openness: z.number().min(1).max(10),
  }),
  workStyle: z.object({
    leadership: z.number().min(1).max(10),
    independence: z.number().min(1).max(10),
    teamwork: z.number().min(1).max(10),
    persistence: z.number().min(1).max(10),
    flexibility: z.number().min(1).max(10),
    stressTolerance: z.number().min(1).max(10),
  }),
  aptitudeScores: z.object({
    verbal: z.number().min(1).max(10),
    numerical: z.number().min(1).max(10),
    logical: z.number().min(1).max(10),
  }),
  testDate: z.string().optional().nullable(),
})

// UUID validation helper
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Routes
spiRoutes.use('*', requireAuth)

// GET /api/spi/:employeeId - Get SPI results by employee ID (manager/admin)
spiRoutes.get('/:employeeId', requireRole('admin', 'manager'), async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId || !uuidRegex.test(employeeId)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  const result = await spiService.findByEmployeeId(employeeId)

  if (!result) {
    return c.json({ error: { message: 'SPI results not found' } }, 404)
  }

  return c.json({ data: result })
})

// PUT /api/spi/:employeeId - Upsert SPI results (admin/manager)
spiRoutes.put(
  '/:employeeId',
  requireRole('admin', 'manager'),
  zValidator('json', spiUpsertSchema),
  async (c) => {
    const employeeId = c.req.param('employeeId')
    if (!employeeId || !uuidRegex.test(employeeId)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
    const data = c.req.valid('json')

    const result = await spiService.upsert(employeeId, {
      personalityTraits: data.personalityTraits,
      workStyle: data.workStyle,
      aptitudeScores: data.aptitudeScores,
      testDate: data.testDate ?? null,
    })
    return c.json({ data: result })
  }
)

// DELETE /api/spi/:employeeId - Delete SPI results (admin only)
spiRoutes.delete('/:employeeId', requireRole('admin'), async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId || !uuidRegex.test(employeeId)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  await spiService.delete(employeeId)
  return c.json({ success: true })
})

export { spiRoutes }
