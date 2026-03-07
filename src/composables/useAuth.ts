import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const {
    user,
    employee,
    loading,
    initialized,
    error,
    isDemoMode,
    isAuthenticated,
    isAdmin,
    isManager,
    currentRole,
  } = storeToRefs(store)

  return {
    // State
    user,
    employee,
    loading,
    initialized,
    error,
    isDemoMode,
    isAuthenticated,
    isAdmin,
    isManager,
    currentRole,

    // Actions
    initialize: store.initialize,
    signInWithEmail: store.signInWithEmail,
    signInWithMagicLink: store.signInWithMagicLink,
    signOut: store.signOut,
    hasPermission: store.hasPermission,
  }
}
