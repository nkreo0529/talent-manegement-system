import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { corsMiddleware } from './middleware/cors'
import { securityMiddleware, rateLimitMiddleware, requestIdMiddleware } from './middleware/security'
import { authMiddleware } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { employeeRoutes } from './routes/employees'
import { teamRoutes } from './routes/teams'
import { strengthsRoutes } from './routes/strengths'
import { spiRoutes } from './routes/spi'
import { evaluationRoutes } from './routes/evaluations'
import { aiRoutes } from './routes/ai'
import { adminRoutes } from './routes/admin'
import { meRoutes } from './routes/me'

// Create Hono app
const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', securityMiddleware)
app.use('*', corsMiddleware)
app.use('*', requestIdMiddleware)
app.use('*', rateLimitMiddleware(100, 60000)) // 100 requests per minute
app.use('/api/auth/*', rateLimitMiddleware(10, 60000)) // Stricter: 10 req/min for auth
app.use('*', authMiddleware)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API info
app.get('/api', (c) => {
  return c.json({
    message: 'Talent Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      employees: '/api/employees',
      teams: '/api/teams',
      strengths: '/api/strengths',
      spi: '/api/spi',
      evaluations: '/api/evaluations',
      ai: '/api/ai',
      admin: '/api/admin',
    },
  })
})

// Mount routes
app.route('/api/auth', authRoutes)
app.route('/api/employees', employeeRoutes)
app.route('/api/teams', teamRoutes)
app.route('/api/strengths', strengthsRoutes)
app.route('/api/spi', spiRoutes)
app.route('/api/evaluations', evaluationRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/me', meRoutes)

// Error handling
app.onError((err, c) => {
  if (process.env.NODE_ENV === 'production') {
    console.error(`[Error] ${err.message}`)
  } else {
    console.error(`[Error] ${err.message}`, err.stack)
  }
  return c.json(
    {
      error: {
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        requestId: c.get('requestId'),
      },
    },
    500
  )
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        message: 'Not Found',
        path: c.req.path,
      },
    },
    404
  )
})

// Start server
const port = Number(process.env.PORT) || 8080

console.log(`🚀 Server is running on http://localhost:${port}`)
console.log(`📚 API documentation: http://localhost:${port}/api`)

serve({
  fetch: app.fetch,
  port,
})

export default app
