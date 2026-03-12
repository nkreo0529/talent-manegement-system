<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { STRENGTHS_34, DOMAIN_COLORS, DOMAIN_NAMES, getStrengthById, type StrengthDomain } from '@/types/employee'
import { getAllDemoEmployeesWithDetails, getDemoTeams } from '@/data/demoData'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('ストレングスファインダー分析')
  appStore.setBreadcrumbs([
    { label: '分析' },
    { label: 'ストレングスファインダー' },
  ])
})

const employees = getAllDemoEmployeesWithDetails()
const teams = getDemoTeams()

// Selected filters
const selectedTeam = ref('')
const selectedJobType = ref('')

// Filtered employees
const filteredEmployees = computed(() => {
  let result = employees
  if (selectedTeam.value) {
    result = result.filter(e => e.teamId === selectedTeam.value)
  }
  if (selectedJobType.value) {
    result = result.filter(e => e.job_type === selectedJobType.value)
  }
  return result
})

// Domain distribution
const domainDistribution = computed(() => {
  const counts: Record<StrengthDomain, number> = {
    executing: 0,
    influencing: 0,
    relationship: 0,
    strategic: 0,
  }

  filteredEmployees.value.forEach(emp => {
    if (emp.strengths) {
      const top5 = emp.strengths.strengthsOrder.slice(0, 5)
      top5.forEach(id => {
        const strength = getStrengthById(id)
        if (strength) counts[strength.domain]++
      })
    }
  })

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return Object.entries(counts).map(([domain, count]) => ({
    domain: domain as StrengthDomain,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))
})

// Strength ranking
const strengthRanking = computed(() => {
  const counts: Record<string, number> = {}

  filteredEmployees.value.forEach(emp => {
    if (emp.strengths) {
      const top5 = emp.strengths.strengthsOrder.slice(0, 5)
      top5.forEach(id => {
        counts[id] = (counts[id] || 0) + 1
      })
    }
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const strength = getStrengthById(id)
      return {
        id: strength?.id || id,
        name: strength?.name || '',
        nameEn: strength?.nameEn || '',
        domain: strength?.domain || 'executing' as StrengthDomain,
        count,
        percentage: Math.round((count / filteredEmployees.value.length) * 100),
      }
    })
})

// Team comparison
const teamComparison = computed(() => {
  return teams.map(team => {
    const teamMembers = employees.filter(e => e.teamId === team.id)
    const domainCounts: Record<StrengthDomain, number> = {
      executing: 0,
      influencing: 0,
      relationship: 0,
      strategic: 0,
    }

    teamMembers.forEach(emp => {
      if (emp.strengths) {
        const top5 = emp.strengths.strengthsOrder.slice(0, 5)
        top5.forEach(id => {
          const strength = getStrengthById(id)
          if (strength) domainCounts[strength.domain]++
        })
      }
    })

    const total = Object.values(domainCounts).reduce((a, b) => a + b, 0)

    return {
      team,
      memberCount: teamMembers.length,
      domains: Object.entries(domainCounts).map(([domain, count]) => ({
        domain: domain as StrengthDomain,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      })),
    }
  })
})

// Rare strengths (bottom 5 in company)
const rareStrengths = computed(() => {
  const counts: Record<string, number> = {}
  STRENGTHS_34.forEach(s => counts[s.id] = 0)

  employees.forEach(emp => {
    if (emp.strengths) {
      const top5 = emp.strengths.strengthsOrder.slice(0, 5)
      top5.forEach(id => {
        counts[id] = (counts[id] || 0) + 1
      })
    }
  })

  return Object.entries(counts)
    .sort((a, b) => a[1] - b[1])
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
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ストレングスファインダー分析</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          全社員の強み分布を分析
        </p>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="flex flex-col md:flex-row gap-4">
          <select v-model="selectedTeam" class="input md:w-48">
            <option value="">全チーム</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
          <select v-model="selectedJobType" class="input md:w-48">
            <option value="">全職種</option>
            <option value="engineer">エンジニア</option>
            <option value="designer">デザイナー</option>
            <option value="product_manager">PM</option>
            <option value="sales">営業</option>
            <option value="marketing">マーケティング</option>
          </select>
          <div class="flex-1 text-right">
            <span class="text-sm text-gray-500">
              対象: {{ filteredEmployees.length }}名
            </span>
          </div>
        </div>
      </div>

      <!-- Domain Distribution -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">4領域分布</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            v-for="item in domainDistribution"
            :key="item.domain"
            class="p-6 rounded-lg border text-center"
            :class="[DOMAIN_COLORS[item.domain].bg, DOMAIN_COLORS[item.domain].border]"
          >
            <p class="text-sm font-medium" :class="DOMAIN_COLORS[item.domain].text">
              {{ DOMAIN_NAMES[item.domain].ja }}
            </p>
            <p class="text-4xl font-bold mt-2" :class="DOMAIN_COLORS[item.domain].text">
              {{ item.count }}
            </p>
            <p class="text-sm text-gray-500 mt-1">{{ item.percentage }}%</p>
          </div>
        </div>

        <!-- Bar chart representation -->
        <div class="h-8 rounded-full overflow-hidden flex">
          <div
            v-for="item in domainDistribution"
            :key="item.domain"
            :style="{ width: `${item.percentage}%` }"
            :class="DOMAIN_COLORS[item.domain].bg.replace('-100', '-500').replace('dark:bg-', '')"
            class="flex items-center justify-center text-white text-xs font-medium"
          >
            {{ item.percentage > 10 ? `${item.percentage}%` : '' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Strength Ranking -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">資質ランキング TOP10</h2>
          <div class="space-y-3">
            <div
              v-for="(strength, index) in strengthRanking"
              :key="strength?.id"
              class="flex items-center"
            >
              <span class="w-6 text-lg font-bold text-gray-400">{{ index + 1 }}</span>
              <div class="flex-1 ml-3">
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="px-2 py-1 text-sm rounded-full"
                    :class="[
                      DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                      DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                    ]"
                  >
                    {{ strength?.name }}
                  </span>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ strength?.count }}名 ({{ strength?.percentage }}%)
                  </span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg.replace('-100', '-500')"
                    :style="{ width: `${strength?.percentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rare Strengths -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">希少な資質</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            全社TOP5に含まれることが少ない資質
          </p>
          <div class="space-y-3">
            <div
              v-for="strength in rareStrengths"
              :key="strength?.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-border rounded-lg"
            >
              <div class="flex items-center">
                <span
                  class="px-2 py-1 text-sm rounded-full mr-3"
                  :class="[
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                  ]"
                >
                  {{ strength?.name }}
                </span>
                <span class="text-xs text-gray-500">{{ strength?.nameEn }}</span>
              </div>
              <span class="text-lg font-bold text-gray-900 dark:text-white">
                {{ strength?.count }}名
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Comparison -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">チーム別比較</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-dark-border">
                <th class="text-left py-3 px-4 font-medium text-gray-500">チーム</th>
                <th class="text-center py-3 px-4 font-medium text-gray-500">人数</th>
                <th
                  v-for="domain in Object.keys(DOMAIN_NAMES)"
                  :key="domain"
                  class="text-center py-3 px-4 font-medium"
                  :class="DOMAIN_COLORS[domain as StrengthDomain].text"
                >
                  {{ DOMAIN_NAMES[domain as StrengthDomain].ja }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in teamComparison"
                :key="item.team.id"
                class="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border"
              >
                <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
                  {{ item.team.name }}
                </td>
                <td class="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                  {{ item.memberCount }}
                </td>
                <td
                  v-for="domain in item.domains"
                  :key="domain.domain"
                  class="py-3 px-4 text-center"
                >
                  <span class="font-bold" :class="DOMAIN_COLORS[domain.domain].text">
                    {{ domain.count }}
                  </span>
                  <span class="text-xs text-gray-400 ml-1">({{ domain.percentage }}%)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
