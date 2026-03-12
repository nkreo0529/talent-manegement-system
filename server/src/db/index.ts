import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Check for DATABASE_URL - server requires database connection
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL not set.')
  console.warn('   For demo mode: Run only the frontend with "cd client && npx pnpm dev"')
  console.warn('   For full mode: Set DATABASE_URL in .env file')
  process.exit(0) // Graceful exit for demo mode
}

// Neon serverless connection
const sql = neon(databaseUrl)

// Drizzle ORM instance
export const db = drizzle(sql, { schema })

export type DB = typeof db
