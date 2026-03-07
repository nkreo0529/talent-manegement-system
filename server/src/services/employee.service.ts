import { eq, like, and, or, desc, asc, sql } from 'drizzle-orm'
import { db } from '../db'
import { employees, strengths, spiResults, aiProfiles, careers, evaluations, teams } from '../db/schema'

export interface EmployeeFilters {
  teamId?: string
  jobType?: string
  role?: string
  isActive?: boolean
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EmployeeCreateInput {
  email: string
  name: string
  nameKana?: string | null
  teamId?: string | null
  jobTitle?: string | null
  jobType?: 'engineer' | 'designer' | 'product_manager' | 'sales' | 'marketing' | 'hr' | 'finance' | 'operations' | 'other' | null
  role?: 'admin' | 'manager' | 'member'
  hireDate?: string | null
  isActive?: boolean
}

export class EmployeeService {
  async findAll(filters: EmployeeFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, limit = 20, sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const conditions = []

    if (filters.teamId) {
      conditions.push(eq(employees.teamId, filters.teamId))
    }
    if (filters.jobType) {
      conditions.push(eq(employees.jobType, filters.jobType as typeof employees.jobType.enumValues[number]))
    }
    if (filters.role) {
      conditions.push(eq(employees.role, filters.role as typeof employees.role.enumValues[number]))
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(employees.isActive, filters.isActive))
    }
    if (filters.search) {
      conditions.push(
        or(
          like(employees.name, `%${filters.search}%`),
          like(employees.email, `%${filters.search}%`),
          like(employees.nameKana, `%${filters.search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: employees.id,
          email: employees.email,
          name: employees.name,
          nameKana: employees.nameKana,
          avatarUrl: employees.avatarUrl,
          teamId: employees.teamId,
          jobTitle: employees.jobTitle,
          jobType: employees.jobType,
          role: employees.role,
          hireDate: employees.hireDate,
          isActive: employees.isActive,
          createdAt: employees.createdAt,
          updatedAt: employees.updatedAt,
          teamName: teams.name,
        })
        .from(employees)
        .leftJoin(teams, eq(employees.teamId, teams.id))
        .where(whereClause)
        .orderBy(sortOrder === 'desc' ? desc(employees.createdAt) : asc(employees.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(whereClause),
    ])

    const total = Number(countResult[0]?.count || 0)

    return {
      data: data.map((emp) => ({
        ...emp,
        team: emp.teamId ? { id: emp.teamId, name: emp.teamName } : null,
      })),
      total,
      page,
      limit,
      hasMore: offset + data.length < total,
    }
  }

  async findById(id: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1)

    if (!employee) return null

    const [team, strengthsData, spiData, aiProfile, careersData, evaluationsData] = await Promise.all([
      employee.teamId
        ? db.select().from(teams).where(eq(teams.id, employee.teamId)).limit(1)
        : Promise.resolve([]),
      db.select().from(strengths).where(eq(strengths.employeeId, id)).limit(1),
      db.select().from(spiResults).where(eq(spiResults.employeeId, id)).limit(1),
      db.select().from(aiProfiles).where(eq(aiProfiles.employeeId, id)).limit(1),
      db.select().from(careers).where(eq(careers.employeeId, id)).orderBy(desc(careers.isCurrent), desc(careers.startDate)),
      db.select().from(evaluations).where(eq(evaluations.employeeId, id)).orderBy(desc(evaluations.createdAt)),
    ])

    return {
      ...employee,
      team: team[0] ? { id: team[0].id, name: team[0].name } : null,
      strengths: strengthsData[0] || null,
      spiResults: spiData[0] || null,
      aiProfile: aiProfile[0] || null,
      careers: careersData,
      evaluations: evaluationsData,
    }
  }

  async create(data: EmployeeCreateInput) {
    const [employee] = await db.insert(employees).values({
      email: data.email,
      name: data.name,
      nameKana: data.nameKana,
      teamId: data.teamId,
      jobTitle: data.jobTitle,
      jobType: data.jobType,
      role: data.role ?? 'member',
      hireDate: data.hireDate,
      isActive: data.isActive ?? true,
    }).returning()
    return employee
  }

  async update(id: string, data: Partial<EmployeeCreateInput>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.email !== undefined) updateData.email = data.email
    if (data.name !== undefined) updateData.name = data.name
    if (data.nameKana !== undefined) updateData.nameKana = data.nameKana
    if (data.teamId !== undefined) updateData.teamId = data.teamId
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle
    if (data.jobType !== undefined) updateData.jobType = data.jobType
    if (data.role !== undefined) updateData.role = data.role
    if (data.hireDate !== undefined) updateData.hireDate = data.hireDate
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning()
    return employee
  }

  async delete(id: string) {
    const [employee] = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning()
    return employee
  }

  async findByEmail(email: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1)
    return employee
  }

  async findByAuthUserId(authUserId: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.authUserId, authUserId))
      .limit(1)
    return employee
  }
}

export const employeeService = new EmployeeService()
