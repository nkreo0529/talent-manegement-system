import type { Context, Next } from 'hono'
import { eq } from 'drizzle-orm'
import { auth } from '../lib/auth'
import { db } from '../db'
import { employees } from '../db/schema'

type UserRole = 'admin' | 'manager' | 'member'

// Session user type
export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  employeeId?: string
}

// Extend Hono context
declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser | null
    requestId: string
  }
}

// Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session?.user) {
      // Fetch employee role from database
      const [employee] = await db
        .select({ id: employees.id, role: employees.role })
        .from(employees)
        .where(eq(employees.authUserId, session.user.id))
        .limit(1)

      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: (employee?.role || 'member') as UserRole,
        employeeId: employee?.id,
      })
    } else {
      c.set('user', null)
    }
  } catch {
    c.set('user', null)
  }

  await next()
}

// Require authentication
export const requireAuth = async (c: Context, next: Next) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: { message: 'Unauthorized' } }, 401)
  }

  await next()
}

// Require specific role
export const requireRole = (...roles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: { message: 'Unauthorized' } }, 401)
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: { message: 'Forbidden' } }, 403)
    }

    await next()
  }
}

// Permission check helper
export function hasPermission(user: SessionUser | null, requiredRole: UserRole): boolean {
  if (!user) return false

  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    manager: 2,
    member: 1,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}
