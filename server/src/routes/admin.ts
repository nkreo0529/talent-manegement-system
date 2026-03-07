import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import { employees, teams, strengths, spiResults, evaluations, aiProfiles, aiTeamAnalysis } from '../db/schema'
import { requireAuth, requireRole } from '../middleware/auth'
import { aiService } from '../services/ai.service'

const adminRoutes = new Hono()

// All admin routes require admin role
adminRoutes.use('*', requireAuth, requireRole('admin'))

// GET /api/admin/stats - Get system statistics
adminRoutes.get('/stats', async (c) => {
  const [
    employeeCount,
    teamCount,
    strengthsCount,
    spiCount,
    evaluationCount,
    aiProfileCount,
    aiTeamAnalysisCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(employees),
    db.select({ count: sql<number>`count(*)` }).from(teams),
    db.select({ count: sql<number>`count(*)` }).from(strengths),
    db.select({ count: sql<number>`count(*)` }).from(spiResults),
    db.select({ count: sql<number>`count(*)` }).from(evaluations),
    db.select({ count: sql<number>`count(*)` }).from(aiProfiles),
    db.select({ count: sql<number>`count(*)` }).from(aiTeamAnalysis),
  ])

  return c.json({
    data: {
      employees: Number(employeeCount[0]?.count || 0),
      teams: Number(teamCount[0]?.count || 0),
      strengths: Number(strengthsCount[0]?.count || 0),
      spiResults: Number(spiCount[0]?.count || 0),
      evaluations: Number(evaluationCount[0]?.count || 0),
      aiProfiles: Number(aiProfileCount[0]?.count || 0),
      aiTeamAnalysis: Number(aiTeamAnalysisCount[0]?.count || 0),
    },
  })
})

// POST /api/admin/ai/regenerate-all-profiles - Regenerate all AI profiles
adminRoutes.post('/ai/regenerate-all-profiles', async (c) => {
  const allEmployees = await db.select({ id: employees.id }).from(employees)

  const results = {
    total: allEmployees.length,
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const emp of allEmployees) {
    try {
      await aiService.generateProfile(emp.id)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${emp.id}: ${(error as Error).message}`)
    }
  }

  return c.json({ data: results })
})

// POST /api/admin/ai/regenerate-all-team-analysis - Regenerate all team analyses
adminRoutes.post('/ai/regenerate-all-team-analysis', async (c) => {
  const allTeams = await db.select({ id: teams.id }).from(teams)

  const results = {
    total: allTeams.length,
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const team of allTeams) {
    try {
      await aiService.generateTeamAnalysis(team.id)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${team.id}: ${(error as Error).message}`)
    }
  }

  return c.json({ data: results })
})

// GET /api/admin/employees/without-strengths - Get employees without strengths
adminRoutes.get('/employees/without-strengths', async (c) => {
  const result = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
    })
    .from(employees)
    .leftJoin(strengths, sql`${employees.id} = ${strengths.employeeId}`)
    .where(sql`${strengths.id} IS NULL`)

  return c.json({ data: result })
})

// GET /api/admin/employees/without-spi - Get employees without SPI results
adminRoutes.get('/employees/without-spi', async (c) => {
  const result = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
    })
    .from(employees)
    .leftJoin(spiResults, sql`${employees.id} = ${spiResults.employeeId}`)
    .where(sql`${spiResults.id} IS NULL`)

  return c.json({ data: result })
})

export { adminRoutes }
