import { cors } from 'hono/cors'

// Build unique allowed origins list
function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    'http://localhost:5173',
    'http://localhost:3000',
  ])

  // Add CORS_ORIGIN from env if set
  const envOrigin = process.env.CORS_ORIGIN
  if (envOrigin) {
    origins.add(envOrigin)
  }

  return Array.from(origins)
}

export const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = getAllowedOrigins()

    // Explicitly check if origin is in allowed list
    // Note: origin can be undefined for same-origin requests or non-browser clients
    if (origin && allowedOrigins.includes(origin)) {
      return origin
    }

    // For requests without origin (same-origin, server-to-server), allow through
    // but don't set Access-Control-Allow-Origin header
    if (!origin) {
      return allowedOrigins[0]
    }

    // Origin not in whitelist - deny CORS
    return null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
})
