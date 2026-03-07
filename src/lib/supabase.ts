import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Error handling helper
export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  return '予期せぬエラーが発生しました'
}
