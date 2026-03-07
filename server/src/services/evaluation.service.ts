import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db'
import { evaluations, employees } from '../db/schema'

export interface EvaluationCreateInput {
  employeeId: string
  evaluatorId: string
  period: string
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  strengthsComment?: string | null
  improvementsComment?: string | null
  goals?: string | null
}

export class EvaluationService {
  async findByEmployeeId(employeeId: string) {
    const results = await db
      .select({
        id: evaluations.id,
        employeeId: evaluations.employeeId,
        evaluatorId: evaluations.evaluatorId,
        period: evaluations.period,
        overallGrade: evaluations.overallGrade,
        strengthsComment: evaluations.strengthsComment,
        improvementsComment: evaluations.improvementsComment,
        goals: evaluations.goals,
        createdAt: evaluations.createdAt,
        updatedAt: evaluations.updatedAt,
        evaluatorName: employees.name,
      })
      .from(evaluations)
      .leftJoin(employees, eq(evaluations.evaluatorId, employees.id))
      .where(eq(evaluations.employeeId, employeeId))
      .orderBy(desc(evaluations.period))

    return results.map(r => ({
      ...r,
      evaluator: r.evaluatorId ? { id: r.evaluatorId, name: r.evaluatorName } : null,
    }))
  }

  async findById(id: string) {
    const [result] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, id))
      .limit(1)
    return result
  }

  async create(data: EvaluationCreateInput) {
    const [result] = await db.insert(evaluations).values({
      employeeId: data.employeeId,
      evaluatorId: data.evaluatorId,
      period: data.period,
      overallGrade: data.overallGrade,
      strengthsComment: data.strengthsComment,
      improvementsComment: data.improvementsComment,
      goals: data.goals,
    }).returning()
    return result
  }

  async update(id: string, data: Partial<Omit<EvaluationCreateInput, 'employeeId'>>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.evaluatorId !== undefined) updateData.evaluatorId = data.evaluatorId
    if (data.period !== undefined) updateData.period = data.period
    if (data.overallGrade !== undefined) updateData.overallGrade = data.overallGrade
    if (data.strengthsComment !== undefined) updateData.strengthsComment = data.strengthsComment
    if (data.improvementsComment !== undefined) updateData.improvementsComment = data.improvementsComment
    if (data.goals !== undefined) updateData.goals = data.goals

    const [result] = await db
      .update(evaluations)
      .set(updateData)
      .where(eq(evaluations.id, id))
      .returning()
    return result
  }

  async delete(id: string) {
    const [result] = await db
      .delete(evaluations)
      .where(eq(evaluations.id, id))
      .returning()
    return result
  }

  async findByPeriod(employeeId: string, period: string) {
    const [result] = await db
      .select()
      .from(evaluations)
      .where(and(eq(evaluations.employeeId, employeeId), eq(evaluations.period, period)))
      .limit(1)
    return result
  }
}

export const evaluationService = new EvaluationService()
