import { cors } from 'hono/cors'

// Build allowed origins list from environment
function getAllowedOrigins(): string[] {
  const envOrigin = process.env.CORS_ORIGIN
  if (envOrigin) {
    // In production, use only explicitly configured origins
    return [envOrigin]
  }
  // Development fallback
  return ['http://localhost:5173', 'http://localhost:3000']
}

export const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = getAllowedOrigins()

    // Explicitly check if origin is in allowed list
    // Note: origin can be undefined for same-origin requests or non-browser clients
    if (origin && allowedOrigins.includes(origin)) {
      return origin
    }

    // For requests without origin (same-origin, server-to-server)
    if (!origin) {
      // In production, reject requests without explicit origin
      if (process.env.NODE_ENV === 'production') {
        return null
      }
      return allowedOrigins[0]
    }

    // Origin not in whitelist - deny CORS
    return null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
})
