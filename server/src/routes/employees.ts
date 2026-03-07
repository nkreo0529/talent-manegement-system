import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { employeeService } from '../services/employee.service'
import { requireAuth, requireRole } from '../middleware/auth'

const employeeRoutes = new Hono()

// Validation schemas
const employeeQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  teamId: z.string().uuid().optional(),
  jobType: z.string().optional(),
  role: z.enum(['admin', 'manager', 'member']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const employeeCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  nameKana: z.string().optional(),
  teamId: z.string().uuid().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  jobType: z.enum(['engineer', 'designer', 'product_manager', 'sales', 'marketing', 'hr', 'finance', 'operations', 'other']).optional().nullable(),
  role: z.enum(['admin', 'manager', 'member']).optional().default('member'),
  hireDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const employeeUpdateSchema = employeeCreateSchema.partial()

// Routes
employeeRoutes.use('*', requireAuth)

// GET /api/employees - List all employees
employeeRoutes.get('/', zValidator('query', employeeQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const result = await employeeService.findAll(
    {
      teamId: query.teamId,
      jobType: query.jobType,
      role: query.role,
      isActive: query.isActive,
      search: query.search,
    },
    {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }
  )

  return c.json(result)
})

// GET /api/employees/:id - Get employee by ID
employeeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!id) return c.json({ error: { message: 'ID is required' } }, 400)
  const employee = await employeeService.findById(id)

  if (!employee) {
    return c.json({ error: { message: 'Employee not found' } }, 404)
  }

  return c.json({ data: employee })
})

// POST /api/employees - Create employee (admin only)
employeeRoutes.post('/', requireRole('admin'), zValidator('json', employeeCreateSchema), async (c) => {
  const data = c.req.valid('json')

  // Check for existing email
  const existing = await employeeService.findByEmail(data.email)
  if (existing) {
    return c.json({ error: { message: 'Email already exists' } }, 400)
  }

  const employee = await employeeService.create({
    email: data.email,
    name: data.name,
    nameKana: data.nameKana ?? null,
    teamId: data.teamId ?? null,
    jobTitle: data.jobTitle ?? null,
    jobType: data.jobType ?? null,
    role: data.role ?? 'member',
    hireDate: data.hireDate ?? null,
    isActive: data.isActive ?? true,
  })
  return c.json({ data: employee }, 201)
})

// PUT /api/employees/:id - Update employee (admin/manager)
employeeRoutes.put('/:id', requireRole('admin', 'manager'), zValidator('json', employeeUpdateSchema), async (c) => {
  const id = c.req.param('id')
  if (!id) return c.json({ error: { message: 'ID is required' } }, 400)
  const data = c.req.valid('json')

  const existing = await employeeService.findById(id)
  if (!existing) {
    return c.json({ error: { message: 'Employee not found' } }, 404)
  }

  // Check email uniqueness if changed
  if (data.email && data.email !== existing.email) {
    const emailExists = await employeeService.findByEmail(data.email)
    if (emailExists) {
      return c.json({ error: { message: 'Email already exists' } }, 400)
    }
  }

  const employee = await employeeService.update(id, data)
  return c.json({ data: employee })
})

// DELETE /api/employees/:id - Delete employee (admin only)
employeeRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  if (!id) return c.json({ error: { message: 'ID is required' } }, 400)

  const existing = await employeeService.findById(id)
  if (!existing) {
    return c.json({ error: { message: 'Employee not found' } }, 404)
  }

  await employeeService.delete(id)
  return c.json({ success: true })
})

export { employeeRoutes }
