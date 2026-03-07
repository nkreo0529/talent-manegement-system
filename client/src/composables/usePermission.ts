import { computed } from 'vue'
import { useAuth } from './useAuth'

export function usePermission() {
  const { isAdmin, isManager, hasPermission, isDemoMode } = useAuth()

  const canViewEvaluations = (targetEmployeeId: string) => {
    if (isDemoMode.value) return true
    return hasPermission(['admin', 'manager'], targetEmployeeId)
  }

  const canEditEvaluations = (_targetEmployeeId: string) => {
    if (isDemoMode.value) return true
    return isAdmin.value || isManager.value
  }

  const canViewOneOnOne = (targetEmployeeId: string) => {
    if (isDemoMode.value) return true
    return hasPermission(['admin', 'manager'], targetEmployeeId)
  }

  const canEditOneOnOne = computed(() => {
    if (isDemoMode.value) return true
    return isAdmin.value || isManager.value
  })

  const canManageEmployees = computed(() => {
    if (isDemoMode.value) return true
    return isAdmin.value
  })

  const canManageTeams = computed(() => {
    if (isDemoMode.value) return true
    return isAdmin.value
  })

  const canRegenerateAI = computed(() => {
    if (isDemoMode.value) return true
    return isAdmin.value
  })

  const canAccessAdmin = computed(() => {
    if (isDemoMode.value) return true
    return isAdmin.value
  })

  return {
    canViewEvaluations,
    canEditEvaluations,
    canViewOneOnOne,
    canEditOneOnOne,
    canManageEmployees,
    canManageTeams,
    canRegenerateAI,
    canAccessAdmin,
  }
}
