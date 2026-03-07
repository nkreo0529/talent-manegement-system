import { eq } from 'drizzle-orm'
import { db } from '../db'
import { strengths } from '../db/schema'

export class StrengthsService {
  async findByEmployeeId(employeeId: string) {
    const [result] = await db
      .select()
      .from(strengths)
      .where(eq(strengths.employeeId, employeeId))
      .limit(1)
    return result
  }

  async create(employeeId: string, strengthsOrder: string[]) {
    const [result] = await db.insert(strengths).values({
      employeeId,
      strengthsOrder,
    }).returning()
    return result
  }

  async update(employeeId: string, strengthsOrder: string[]) {
    const [result] = await db
      .update(strengths)
      .set({ strengthsOrder, updatedAt: new Date() })
      .where(eq(strengths.employeeId, employeeId))
      .returning()
    return result
  }

  async upsert(employeeId: string, strengthsOrder: string[]) {
    const existing = await this.findByEmployeeId(employeeId)

    if (existing) {
      return this.update(employeeId, strengthsOrder)
    } else {
      return this.create(employeeId, strengthsOrder)
    }
  }

  async delete(employeeId: string) {
    const [result] = await db
      .delete(strengths)
      .where(eq(strengths.employeeId, employeeId))
      .returning()
    return result
  }
}

export const strengthsService = new StrengthsService()
