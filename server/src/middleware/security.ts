import { secureHeaders } from 'hono/secure-headers'
import type { Context, Next } from 'hono'

export const securityMiddleware = secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", process.env.CORS_ORIGIN || ''].filter(Boolean),
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      }
    : undefined,
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
})

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = (limit: number = 100, windowMs: number = 60000) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()

    const record = rateLimitStore.get(ip)

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    } else if (record.count >= limit) {
      return c.json({ error: { message: 'Too many requests' } }, 429)
    } else {
      record.count++
    }

    await next()
  }
}

// Request ID middleware
export const requestIdMiddleware = async (c: Context, next: Next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)
  await next()
}

// Note: Input sanitization is handled by:
// - Drizzle ORM parameterized queries (SQL injection prevention)
// - Zod validation in route handlers (input validation)
// - DOMPurify on frontend for HTML content (XSS prevention)
