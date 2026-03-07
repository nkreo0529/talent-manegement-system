import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Validate required environment variable
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set. Please configure your database connection.')
}

// Neon serverless connection
const sql = neon(databaseUrl)

// Drizzle ORM instance
export const db = drizzle(sql, { schema })

export type DB = typeof db
