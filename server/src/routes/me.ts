import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'

const meRoutes = new Hono()

// GET /api/me - ログイン中のユーザー情報（role, employeeId含む）を返す
meRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({
    data: {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      employeeId: user!.employeeId,
    },
  })
})

export { meRoutes }
