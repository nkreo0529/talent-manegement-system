import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://talent-management-system.vercel.app',
  'https://your-custom-domain.com',
  // Development origins
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ] : []),
]

/**
 * Configure CORS headers with origin validation
 */
export function configureCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || ''

  // Check if origin is allowed
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || allowed.includes('*')
  )

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    // Allow any origin in development
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  } else {
    // In production, reject unknown origins
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0] || '')
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }

  return false
}

/**
 * Validate authentication token and return user info
 */
export async function validateAuth(req: VercelRequest): Promise<{
  isValid: boolean
  userId?: string
  role?: string
  error?: string
}> {
  const authHeader = req.headers.authorization

  // In demo mode or development, allow requests without auth
  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
    return { isValid: true, role: 'admin' }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.slice(7)

  // Validate token with Supabase
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    // If Supabase is not configured, fall back to demo mode
    console.warn('Supabase not configured, running in demo mode')
    return { isValid: true, role: 'admin' }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { isValid: false, error: 'Invalid token' }
    }

    // Get employee role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    return {
      isValid: true,
      userId: user.id,
      role: employee?.role || 'member',
    }
  } catch (err) {
    console.error('Auth validation error:', err)
    return { isValid: false, error: 'Authentication failed' }
  }
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: string | undefined,
  requiredRoles: string[]
): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

/**
 * Input validation helpers
 */
export const validators = {
  /**
   * Validate string input
   */
  isValidString(value: unknown, maxLength: number = 1000): boolean {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLength
  },

  /**
   * Validate array of strings
   */
  isValidStringArray(value: unknown, maxItems: number = 100, maxLength: number = 500): boolean {
    if (!Array.isArray(value)) return false
    if (value.length > maxItems) return false
    return value.every(item => this.isValidString(item, maxLength))
  },

  /**
   * Validate message array for consultation
   */
  isValidMessageArray(messages: unknown): boolean {
    if (!Array.isArray(messages)) return false
    if (messages.length === 0 || messages.length > 50) return false

    return messages.every(msg => {
      if (typeof msg !== 'object' || msg === null) return false
      const { role, content } = msg as { role?: unknown; content?: unknown }
      if (role !== 'user' && role !== 'assistant') return false
      if (!this.isValidString(content, 10000)) return false
      return true
    })
  },

  /**
   * Sanitize string input
   */
  sanitizeString(value: string): string {
    return value
      .trim()
      .slice(0, 10000)
      // Remove potential script injections
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  },

  /**
   * Validate UUID format
   */
  isValidUUID(value: unknown): boolean {
    if (typeof value !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  },
}

/**
 * Security headers for responses
 */
export function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
}

/**
 * Rate limiting info (for client-side handling)
 * Actual rate limiting should be done at the edge (Vercel Edge Config or similar)
 */
export function getRateLimitHeaders(): Record<string, string> {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Window': '60',
  }
}
