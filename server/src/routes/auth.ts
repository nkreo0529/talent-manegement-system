import { Hono } from 'hono'
import { auth } from '../lib/auth'

const authRoutes = new Hono()

// Better Auth handler - handles all auth routes
authRoutes.all('/*', async (c) => {
  return auth.handler(c.req.raw)
})

export { authRoutes }
