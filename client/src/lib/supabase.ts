// Legacy Supabase file - kept for compatibility during migration
// This file is no longer used as we've migrated to Better Auth

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return false
}

// Error handling helper
export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  return '予期せぬエラーが発生しました'
}
