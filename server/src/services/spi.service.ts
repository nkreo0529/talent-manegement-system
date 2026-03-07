import { eq } from 'drizzle-orm'
import { db } from '../db'
import { spiResults } from '../db/schema'

interface SpiPersonalityTraits {
  extroversion: number
  agreeableness: number
  conscientiousness: number
  neuroticism: number
  openness: number
}

interface SpiWorkStyle {
  leadership: number
  independence: number
  teamwork: number
  persistence: number
  flexibility: number
  stressTolerance: number
}

interface SpiAptitudeScores {
  verbal: number
  numerical: number
  logical: number
}

export interface SpiResultInput {
  personalityTraits: SpiPersonalityTraits
  workStyle: SpiWorkStyle
  aptitudeScores: SpiAptitudeScores
  testDate?: string | null
}

export class SpiService {
  async findByEmployeeId(employeeId: string) {
    const [result] = await db
      .select()
      .from(spiResults)
      .where(eq(spiResults.employeeId, employeeId))
      .limit(1)
    return result
  }

  async create(employeeId: string, data: SpiResultInput) {
    const [result] = await db.insert(spiResults).values({
      employeeId,
      personalityTraits: data.personalityTraits,
      workStyle: data.workStyle,
      aptitudeScores: data.aptitudeScores,
      testDate: data.testDate,
    }).returning()
    return result
  }

  async update(employeeId: string, data: Partial<SpiResultInput>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.personalityTraits !== undefined) updateData.personalityTraits = data.personalityTraits
    if (data.workStyle !== undefined) updateData.workStyle = data.workStyle
    if (data.aptitudeScores !== undefined) updateData.aptitudeScores = data.aptitudeScores
    if (data.testDate !== undefined) updateData.testDate = data.testDate

    const [result] = await db
      .update(spiResults)
      .set(updateData)
      .where(eq(spiResults.employeeId, employeeId))
      .returning()
    return result
  }

  async upsert(employeeId: string, data: SpiResultInput) {
    const existing = await this.findByEmployeeId(employeeId)

    if (existing) {
      return this.update(employeeId, data)
    } else {
      return this.create(employeeId, data)
    }
  }

  async delete(employeeId: string) {
    const [result] = await db
      .delete(spiResults)
      .where(eq(spiResults.employeeId, employeeId))
      .returning()
    return result
  }
}

export const spiService = new SpiService()
