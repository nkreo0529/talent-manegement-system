// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager' | 'member'

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          name: string
          name_kana: string | null
          avatar_url: string | null
          team_id: string | null
          job_title: string | null
          job_type: JobType | null
          role: UserRole
          hire_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          name: string
          name_kana?: string | null
          avatar_url?: string | null
          team_id?: string | null
          job_title?: string | null
          job_type?: JobType | null
          role?: UserRole
          hire_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          email?: string
          name?: string
          name_kana?: string | null
          avatar_url?: string | null
          team_id?: string | null
          job_title?: string | null
          job_type?: JobType | null
          role?: UserRole
          hire_date?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      strengths: {
        Row: {
          id: string
          employee_id: string
          strengths_order: string[] // 34資質の順序（TOP5は先頭5つ）
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          strengths_order: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          strengths_order?: string[]
          updated_at?: string
        }
      }
      spi_results: {
        Row: {
          id: string
          employee_id: string
          personality_traits: SpiPersonalityTraits
          work_style: SpiWorkStyle
          aptitude_scores: SpiAptitudeScores
          test_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          personality_traits: SpiPersonalityTraits
          work_style: SpiWorkStyle
          aptitude_scores: SpiAptitudeScores
          test_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          personality_traits?: SpiPersonalityTraits
          work_style?: SpiWorkStyle
          aptitude_scores?: SpiAptitudeScores
          test_date?: string | null
          updated_at?: string
        }
      }
      careers: {
        Row: {
          id: string
          employee_id: string
          company_name: string
          position: string
          start_date: string
          end_date: string | null
          description: string | null
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_name: string
          position: string
          start_date: string
          end_date?: string | null
          description?: string | null
          is_current?: boolean
          created_at?: string
        }
        Update: {
          company_name?: string
          position?: string
          start_date?: string
          end_date?: string | null
          description?: string | null
          is_current?: boolean
        }
      }
      evaluations: {
        Row: {
          id: string
          employee_id: string
          evaluator_id: string
          period: string // e.g., "2024H1", "2024H2"
          overall_grade: EvaluationGrade
          strengths_comment: string | null
          improvements_comment: string | null
          goals: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          evaluator_id: string
          period: string
          overall_grade: EvaluationGrade
          strengths_comment?: string | null
          improvements_comment?: string | null
          goals?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          overall_grade?: EvaluationGrade
          strengths_comment?: string | null
          improvements_comment?: string | null
          goals?: string | null
          updated_at?: string
        }
      }
      one_on_one_notes: {
        Row: {
          id: string
          employee_id: string
          manager_id: string
          meeting_date: string
          topics: string[]
          notes: string | null
          action_items: string[]
          mood: MoodRating | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          manager_id: string
          meeting_date: string
          topics?: string[]
          notes?: string | null
          action_items?: string[]
          mood?: MoodRating | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          meeting_date?: string
          topics?: string[]
          notes?: string | null
          action_items?: string[]
          mood?: MoodRating | null
          updated_at?: string
        }
      }
      ai_profiles: {
        Row: {
          id: string
          employee_id: string
          profile_summary: string
          work_style_analysis: string
          collaboration_tips: string
          development_suggestions: string
          generated_at: string
          model_version: string
        }
        Insert: {
          id?: string
          employee_id: string
          profile_summary: string
          work_style_analysis: string
          collaboration_tips: string
          development_suggestions: string
          generated_at?: string
          model_version?: string
        }
        Update: {
          profile_summary?: string
          work_style_analysis?: string
          collaboration_tips?: string
          development_suggestions?: string
          generated_at?: string
          model_version?: string
        }
      }
      ai_team_analysis: {
        Row: {
          id: string
          team_id: string
          team_dynamics: string
          strengths_distribution: string
          potential_challenges: string
          recommendations: string
          generated_at: string
          model_version: string
        }
        Insert: {
          id?: string
          team_id: string
          team_dynamics: string
          strengths_distribution: string
          potential_challenges: string
          recommendations: string
          generated_at?: string
          model_version?: string
        }
        Update: {
          team_dynamics?: string
          strengths_distribution?: string
          potential_challenges?: string
          recommendations?: string
          generated_at?: string
          model_version?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      job_type: JobType
      evaluation_grade: EvaluationGrade
      mood_rating: MoodRating
    }
  }
}

// Enum types
export type JobType =
  | 'engineer'
  | 'designer'
  | 'product_manager'
  | 'sales'
  | 'marketing'
  | 'hr'
  | 'finance'
  | 'operations'
  | 'other'

export type EvaluationGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export type MoodRating = 1 | 2 | 3 | 4 | 5

// SPI Related Types
export interface SpiPersonalityTraits {
  extroversion: number      // 外向性 1-10
  agreeableness: number     // 協調性 1-10
  conscientiousness: number // 誠実性 1-10
  neuroticism: number       // 神経症的傾向 1-10
  openness: number          // 開放性 1-10
}

export interface SpiWorkStyle {
  leadership: number        // リーダーシップ 1-10
  independence: number      // 独立性 1-10
  teamwork: number          // チームワーク 1-10
  persistence: number       // 粘り強さ 1-10
  flexibility: number       // 柔軟性 1-10
  stress_tolerance: number  // ストレス耐性 1-10
}

export interface SpiAptitudeScores {
  verbal: number            // 言語 1-10
  numerical: number         // 数理 1-10
  logical: number           // 論理 1-10
}

// Helper type for table rows
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
