// Re-export all types
export * from './database'
export * from './employee'
export * from './team'

// Additional utility types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Filter types
export interface EmployeeFilters {
  search?: string
  team_id?: string
  job_type?: string
  role?: string
  is_active?: boolean
}

export interface TeamFilters {
  search?: string
  has_manager?: boolean
}

// AI Consultation types
export interface ConsultationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  mentioned_employees?: string[] // Employee IDs mentioned with @
}

export interface ConsultationContext {
  employees: Array<{
    id: string
    name: string
    summary: string
  }>
}
