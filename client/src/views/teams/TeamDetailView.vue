<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useTeam } from '@/composables/useTeam'
import { JOB_TYPE_LABELS, getTop5Strengths, DOMAIN_COLORS, DOMAIN_NAMES, getStrengthById, type StrengthDomain } from '@/types/employee'
import { getAllDemoEmployeesWithDetails } from '@/data/demoData'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { currentTeam, loading, error, fetchTeamById } = useTeam()

const teamId = computed(() => route.params.id as string)

onMounted(async () => {
  await loadTeam()
})

watch(() => route.params.id, async () => {
  await loadTeam()
})

async function loadTeam() {
  await fetchTeamById(teamId.value)
  if (currentTeam.value) {
    appStore.setPageTitle(currentTeam.value.name)
    appStore.setBreadcrumbs([
      { label: 'チーム', to: '/teams' },
      { label: currentTeam.value.name },
    ])
  }
}

function goBack() {
  router.push('/teams')
}

function goToEmployee(id: string) {
  router.push(`/employees/${id}`)
}

// Calculate team strengths distribution
const teamStrengthsAnalysis = computed(() => {
  if (!currentTeam.value?.members) return null

  const allEmployees = getAllDemoEmployeesWithDetails()
  const teamMembers = allEmployees.filter(e => e.teamId === teamId.value)

  const domainCounts: Record<StrengthDomain, number> = {
    executing: 0,
    influencing: 0,
    relationship: 0,
    strategic: 0,
  }

  const strengthCounts: Record<string, number> = {}

  teamMembers.forEach(member => {
    if (member.strengths) {
      const top5 = member.strengths.strengthsOrder.slice(0, 5)
      top5.forEach(id => {
        const strength = getStrengthById(id)
        if (strength) {
          domainCounts[strength.domain]++
          strengthCounts[id] = (strengthCounts[id] || 0) + 1
        }
      })
    }
  })

  // Get top strengths
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const strength = getStrengthById(id)
      return {
        id: strength?.id || id,
        name: strength?.name || '',
        nameEn: strength?.nameEn || '',
        domain: strength?.domain || 'executing' as StrengthDomain,
        count,
      }
    })

  return {
    domainCounts,
    topStrengths,
    totalMembers: teamMembers.length,
  }
})

// Get member strengths
function getMemberStrengths(employeeId: string) {
  const allEmployees = getAllDemoEmployeesWithDetails()
  const emp = allEmployees.find(e => e.id === employeeId)
  if (emp?.strengths) {
    return getTop5Strengths(emp.strengths.strengthsOrder)
  }
  return []
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Back button -->
      <button
        @click="goBack"
        class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <span class="material-icons text-sm mr-1">arrow_back</span>
        チーム一覧に戻る
      </button>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card text-center py-12">
        <span class="material-icons text-5xl text-red-400">error</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">エラー</h3>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{ error }}</p>
      </div>

      <!-- Team not found -->
      <div v-else-if="!currentTeam" class="card text-center py-12">
        <span class="material-icons text-5xl text-gray-300">group_off</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">チームが見つかりません</h3>
      </div>

      <!-- Team detail -->
      <template v-else>
        <!-- Header -->
        <div class="card bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none">
          <div class="flex flex-col md:flex-row md:items-center gap-6">
            <div class="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <span class="text-4xl font-bold">{{ currentTeam.name.charAt(0) }}</span>
            </div>
            <div class="flex-1">
              <h1 class="text-2xl font-bold">{{ currentTeam.name }}</h1>
              <p class="text-primary-100 mt-1">{{ currentTeam.description }}</p>
              <div class="flex items-center mt-4 space-x-6">
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-primary-200">person</span>
                  <span>マネージャー: {{ currentTeam.manager?.name || '未設定' }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-primary-200">group</span>
                  <span>{{ currentTeam.members?.length || 0 }}名</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Strengths Distribution -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Domain distribution -->
            <div class="card">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                チーム資質分布
              </h2>
              <div v-if="teamStrengthsAnalysis" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  v-for="(domain, key) in DOMAIN_NAMES"
                  :key="key"
                  class="p-4 rounded-lg border text-center"
                  :class="[DOMAIN_COLORS[key as StrengthDomain].bg, DOMAIN_COLORS[key as StrengthDomain].border]"
                >
                  <p class="text-sm" :class="DOMAIN_COLORS[key as StrengthDomain].text">{{ domain.ja }}</p>
                  <p class="text-3xl font-bold mt-1" :class="DOMAIN_COLORS[key as StrengthDomain].text">
                    {{ teamStrengthsAnalysis.domainCounts[key as StrengthDomain] }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Top strengths -->
            <div class="card">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                チームで多い資質 TOP5
              </h2>
              <div v-if="teamStrengthsAnalysis" class="space-y-3">
                <div
                  v-for="(strength, index) in teamStrengthsAnalysis.topStrengths"
                  :key="strength?.id"
                  class="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-dark-border"
                >
                  <span class="text-lg font-bold text-gray-400 mr-4 w-6">{{ index + 1 }}</span>
                  <div class="flex-1">
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-full text-sm"
                      :class="[
                        DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                        DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                      ]"
                    >
                      {{ strength?.name }}
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-xl font-bold text-gray-900 dark:text-white">{{ strength?.count }}</span>
                    <span class="text-sm text-gray-500 ml-1">名</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Analysis -->
            <div v-if="currentTeam.aiAnalysis" class="card">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-primary-600 mr-2">smart_toy</span>
                AI分析
              </h2>
              <div class="space-y-4">
                <div>
                  <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">チームダイナミクス</h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ currentTeam.aiAnalysis.teamDynamics }}</p>
                </div>
                <div>
                  <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">強み分布</h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ currentTeam.aiAnalysis.strengthsDistribution }}</p>
                </div>
                <div>
                  <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">潜在的な課題</h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ currentTeam.aiAnalysis.potentialChallenges }}</p>
                </div>
                <div>
                  <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">提案</h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ currentTeam.aiAnalysis.recommendations }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Members list -->
          <div class="space-y-6">
            <div class="card">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                メンバー ({{ currentTeam.members?.length || 0 }})
              </h2>
              <div class="space-y-3">
                <div
                  v-for="member in currentTeam.members"
                  :key="member.id"
                  @click="goToEmployee(member.id)"
                  class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border cursor-pointer transition-colors"
                >
                  <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <span class="text-primary-600 dark:text-primary-400 font-medium">
                      {{ member.name.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-3 flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white truncate">
                      {{ member.name }}
                      <span
                        v-if="member.id === currentTeam.managerId"
                        class="ml-2 text-xs text-primary-600 dark:text-primary-400"
                      >
                        マネージャー
                      </span>
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {{ member.jobTitle || JOB_TYPE_LABELS[member.jobType || 'other'] }}
                    </p>
                    <!-- Mini strengths -->
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="strength in getMemberStrengths(member.id).slice(0, 3)"
                        :key="strength?.id"
                        class="w-2 h-2 rounded-full"
                        :class="DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg.replace('bg-', 'bg-').replace('-100', '-400')"
                        :title="strength?.name"
                      ></span>
                    </div>
                  </div>
                  <span class="material-icons text-gray-400 text-sm">chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>
