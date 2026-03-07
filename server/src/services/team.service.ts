import { eq, desc, asc, sql, like, inArray } from 'drizzle-orm'
import { db } from '../db'
import { teams, employees, strengths, aiTeamAnalysis } from '../db/schema'

export interface TeamFilters {
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TeamCreateInput {
  name: string
  description?: string | null
  managerId?: string | null
}

type StrengthDomain = 'executing' | 'influencing' | 'relationship' | 'strategic'

// Domain mapping for strengths
const STRENGTH_DOMAINS: Record<string, StrengthDomain> = {
  achiever: 'executing', arranger: 'executing', belief: 'executing', consistency: 'executing',
  deliberative: 'executing', discipline: 'executing', focus: 'executing', responsibility: 'executing', restorative: 'executing',
  activator: 'influencing', command: 'influencing', communication: 'influencing', competition: 'influencing',
  maximizer: 'influencing', self_assurance: 'influencing', significance: 'influencing', woo: 'influencing',
  adaptability: 'relationship', connectedness: 'relationship', developer: 'relationship', empathy: 'relationship',
  harmony: 'relationship', includer: 'relationship', individualization: 'relationship', positivity: 'relationship', relator: 'relationship',
  analytical: 'strategic', context: 'strategic', futuristic: 'strategic', ideation: 'strategic',
  input: 'strategic', intellection: 'strategic', learner: 'strategic', strategic: 'strategic',
}

export class TeamService {
  async findAll(filters: TeamFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, limit = 20, sortOrder = 'asc' } = pagination
    const offset = (page - 1) * limit

    const conditions = []
    if (filters.search) {
      conditions.push(like(teams.name, `%${filters.search}%`))
    }

    const whereClause = conditions.length > 0 ? conditions[0] : undefined

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          managerId: teams.managerId,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .where(whereClause)
        .orderBy(sortOrder === 'desc' ? desc(teams.name) : asc(teams.name))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(teams)
        .where(whereClause),
    ])

    // Get member counts and manager info
    const teamsWithDetails = await Promise.all(
      data.map(async (team) => {
        const [memberCountResult, manager] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.teamId, team.id)),
          team.managerId
            ? db.select({ id: employees.id, name: employees.name, avatarUrl: employees.avatarUrl }).from(employees).where(eq(employees.id, team.managerId)).limit(1)
            : Promise.resolve([]),
        ])

        return {
          ...team,
          memberCount: Number(memberCountResult[0]?.count || 0),
          manager: manager[0] || null,
        }
      })
    )

    const total = Number(countResult[0]?.count || 0)

    return {
      data: teamsWithDetails,
      total,
      page,
      limit,
      hasMore: offset + data.length < total,
    }
  }

  async findById(id: string) {
    const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1)

    if (!team) return null

    const [members, manager, aiAnalysis] = await Promise.all([
      db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          avatarUrl: employees.avatarUrl,
          jobTitle: employees.jobTitle,
          jobType: employees.jobType,
          role: employees.role,
          hireDate: employees.hireDate,
          isActive: employees.isActive,
        })
        .from(employees)
        .where(eq(employees.teamId, id)),
      team.managerId
        ? db.select({ id: employees.id, name: employees.name, avatarUrl: employees.avatarUrl }).from(employees).where(eq(employees.id, team.managerId)).limit(1)
        : Promise.resolve([]),
      db.select().from(aiTeamAnalysis).where(eq(aiTeamAnalysis.teamId, id)).orderBy(desc(aiTeamAnalysis.generatedAt)).limit(1),
    ])

    // Calculate strengths summary
    const memberIds = members.map(m => m.id)
    const memberStrengths = memberIds.length > 0
      ? await db.select().from(strengths).where(inArray(strengths.employeeId, memberIds))
      : []

    const strengthsSummary = this.calculateStrengthsSummary(memberStrengths)

    return {
      ...team,
      manager: manager[0] || null,
      members,
      memberCount: members.length,
      aiAnalysis: aiAnalysis[0] || null,
      strengthsSummary,
    }
  }

  private calculateStrengthsSummary(memberStrengths: { strengthsOrder: string[] }[]) {
    const domainCounts: Record<StrengthDomain, number> = {
      executing: 0,
      influencing: 0,
      relationship: 0,
      strategic: 0,
    }
    const strengthCounts: Record<string, number> = {}

    for (const ms of memberStrengths) {
      const top5 = ms.strengthsOrder.slice(0, 5)
      for (const strengthId of top5) {
        const domain = STRENGTH_DOMAINS[strengthId]
        if (domain) {
          domainCounts[domain]++
        }
        strengthCounts[strengthId] = (strengthCounts[strengthId] || 0) + 1
      }
    }

    const topStrengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({
        id,
        name: id, // Will be resolved on client side
        count,
        domain: STRENGTH_DOMAINS[id] || 'strategic',
      }))

    const missingDomains = (Object.entries(domainCounts) as [StrengthDomain, number][])
      .filter(([, count]) => count === 0)
      .map(([domain]) => domain)

    return {
      domainDistribution: domainCounts,
      topStrengths,
      missingDomains,
    }
  }

  async create(data: TeamCreateInput) {
    const [team] = await db.insert(teams).values({
      name: data.name,
      description: data.description,
      managerId: data.managerId,
    }).returning()
    return team
  }

  async update(id: string, data: Partial<TeamCreateInput>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.managerId !== undefined) updateData.managerId = data.managerId

    const [team] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, id))
      .returning()
    return team
  }

  async delete(id: string) {
    // First, unassign employees from this team
    await db.update(employees).set({ teamId: null }).where(eq(employees.teamId, id))

    const [team] = await db.delete(teams).where(eq(teams.id, id)).returning()
    return team
  }
}

export const teamService = new TeamService()
