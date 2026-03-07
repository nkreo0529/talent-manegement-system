import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { strengthsService } from '../services/strengths.service'
import { requireAuth, requireRole } from '../middleware/auth'

const strengthsRoutes = new Hono()

// Validation schema
const strengthsUpsertSchema = z.object({
  strengthsOrder: z.array(z.string()).length(34),
})

// Routes
strengthsRoutes.use('*', requireAuth)

// GET /api/strengths/:employeeId - Get strengths by employee ID
strengthsRoutes.get('/:employeeId', async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId) return c.json({ error: { message: 'Employee ID is required' } }, 400)
  const result = await strengthsService.findByEmployeeId(employeeId)

  if (!result) {
    return c.json({ error: { message: 'Strengths not found' } }, 404)
  }

  return c.json({ data: result })
})

// PUT /api/strengths/:employeeId - Upsert strengths (admin/manager)
strengthsRoutes.put(
  '/:employeeId',
  requireRole('admin', 'manager'),
  zValidator('json', strengthsUpsertSchema),
  async (c) => {
    const employeeId = c.req.param('employeeId')
    if (!employeeId) return c.json({ error: { message: 'Employee ID is required' } }, 400)
    const { strengthsOrder } = c.req.valid('json')

    const result = await strengthsService.upsert(employeeId, strengthsOrder)
    return c.json({ data: result })
  }
)

// DELETE /api/strengths/:employeeId - Delete strengths (admin only)
strengthsRoutes.delete('/:employeeId', requireRole('admin'), async (c) => {
  const employeeId = c.req.param('employeeId')
  if (!employeeId) return c.json({ error: { message: 'Employee ID is required' } }, 400)
  await strengthsService.delete(employeeId)
  return c.json({ success: true })
})

export { strengthsRoutes }
