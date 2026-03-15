import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { teamService } from '../services/team.service'
import { requireAuth, requireRole } from '../middleware/auth'

const teamRoutes = new Hono()

// Validation schemas
const teamQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

const teamCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
})

const teamUpdateSchema = teamCreateSchema.partial()

// UUID validation helper
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Routes
teamRoutes.use('*', requireAuth)

// GET /api/teams - List all teams
teamRoutes.get('/', zValidator('query', teamQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const result = await teamService.findAll(
    { search: query.search },
    {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }
  )

  return c.json(result)
})

// GET /api/teams/:id - Get team by ID with members
teamRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  const team = await teamService.findById(id)

  if (!team) {
    return c.json({ error: { message: 'Team not found' } }, 404)
  }

  return c.json({ data: team })
})

// POST /api/teams - Create team (admin only)
teamRoutes.post('/', requireRole('admin'), zValidator('json', teamCreateSchema), async (c) => {
  const data = c.req.valid('json')
  const team = await teamService.create({
    name: data.name,
    description: data.description ?? null,
    managerId: data.managerId ?? null,
  })
  return c.json({ data: team }, 201)
})

// PUT /api/teams/:id - Update team (admin/manager)
teamRoutes.put('/:id', requireRole('admin', 'manager'), zValidator('json', teamUpdateSchema), async (c) => {
  const id = c.req.param('id')
  if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)
  const data = c.req.valid('json')

  const existing = await teamService.findById(id)
  if (!existing) {
    return c.json({ error: { message: 'Team not found' } }, 404)
  }

  const team = await teamService.update(id, data)
  return c.json({ data: team })
})

// DELETE /api/teams/:id - Delete team (admin only)
teamRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  if (!id || !uuidRegex.test(id)) return c.json({ error: { message: 'Valid UUID is required' } }, 400)

  const existing = await teamService.findById(id)
  if (!existing) {
    return c.json({ error: { message: 'Team not found' } }, 404)
  }

  await teamService.delete(id)
  return c.json({ success: true })
})

export { teamRoutes }
