<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { getAllDemoEmployeesWithDetails, getDemoTeams } from '@/data/demoData'
import type { SpiPersonalityTraits, SpiWorkStyle } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('SPI分析')
  appStore.setBreadcrumbs([
    { label: '分析' },
    { label: 'SPI分析' },
  ])
})

const employees = getAllDemoEmployeesWithDetails()
const teams = getDemoTeams()

const selectedTeam = ref('')

const filteredEmployees = computed(() => {
  if (!selectedTeam.value) return employees
  return employees.filter(e => e.team_id === selectedTeam.value)
})

// Trait labels
const traitLabels: Record<keyof SpiPersonalityTraits, string> = {
  extroversion: '外向性',
  agreeableness: '協調性',
  conscientiousness: '誠実性',
  neuroticism: '神経症的傾向',
  openness: '開放性',
}

const workStyleLabels: Record<keyof SpiWorkStyle, string> = {
  leadership: 'リーダーシップ',
  independence: '独立性',
  teamwork: 'チームワーク',
  persistence: '粘り強さ',
  flexibility: '柔軟性',
  stress_tolerance: 'ストレス耐性',
}

// Company average personality traits
const companyAverageTraits = computed(() => {
  const emps = filteredEmployees.value.filter(e => e.spi_results)
  if (emps.length === 0) return null

  const totals: Record<string, number> = {}
  Object.keys(traitLabels).forEach(key => totals[key] = 0)

  emps.forEach(emp => {
    if (emp.spi_results) {
      Object.entries(emp.spi_results.personality_traits).forEach(([key, value]) => {
        totals[key] += value
      })
    }
  })

  return Object.entries(totals).map(([key, total]) => ({
    key,
    label: traitLabels[key as keyof SpiPersonalityTraits],
    average: Math.round((total / emps.length) * 10) / 10,
  }))
})

// Company average work style
const companyAverageWorkStyle = computed(() => {
  const emps = filteredEmployees.value.filter(e => e.spi_results)
  if (emps.length === 0) return null

  const totals: Record<string, number> = {}
  Object.keys(workStyleLabels).forEach(key => totals[key] = 0)

  emps.forEach(emp => {
    if (emp.spi_results) {
      Object.entries(emp.spi_results.work_style).forEach(([key, value]) => {
        totals[key] += value
      })
    }
  })

  return Object.entries(totals).map(([key, total]) => ({
    key,
    label: workStyleLabels[key as keyof SpiWorkStyle],
    average: Math.round((total / emps.length) * 10) / 10,
  }))
})

// Team comparison
const teamComparison = computed(() => {
  return teams.map(team => {
    const teamMembers = employees.filter(e => e.team_id === team.id && e.spi_results)
    if (teamMembers.length === 0) return { team, traits: null, workStyle: null }

    const traitTotals: Record<string, number> = {}
    const workStyleTotals: Record<string, number> = {}
    Object.keys(traitLabels).forEach(key => traitTotals[key] = 0)
    Object.keys(workStyleLabels).forEach(key => workStyleTotals[key] = 0)

    teamMembers.forEach(emp => {
      if (emp.spi_results) {
        Object.entries(emp.spi_results.personality_traits).forEach(([key, value]) => {
          traitTotals[key] += value
        })
        Object.entries(emp.spi_results.work_style).forEach(([key, value]) => {
          workStyleTotals[key] += value
        })
      }
    })

    return {
      team,
      memberCount: teamMembers.length,
      traits: Object.entries(traitTotals).map(([key, total]) => ({
        key,
        average: Math.round((total / teamMembers.length) * 10) / 10,
      })),
      workStyle: Object.entries(workStyleTotals).map(([key, total]) => ({
        key,
        average: Math.round((total / teamMembers.length) * 10) / 10,
      })),
    }
  })
})

// Distribution buckets for personality traits
const traitDistribution = computed(() => {
  const emps = filteredEmployees.value.filter(e => e.spi_results)

  return Object.keys(traitLabels).map(traitKey => {
    const buckets = { low: 0, medium: 0, high: 0 }

    emps.forEach(emp => {
      const value = emp.spi_results?.personality_traits[traitKey as keyof SpiPersonalityTraits] || 0
      if (value <= 3) buckets.low++
      else if (value <= 7) buckets.medium++
      else buckets.high++
    })

    return {
      key: traitKey,
      label: traitLabels[traitKey as keyof SpiPersonalityTraits],
      buckets,
      total: emps.length,
    }
  })
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SPI分析</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          全社員の性格特性・ワークスタイル分析
        </p>
      </div>

      <!-- Filter -->
      <div class="card">
        <div class="flex flex-col md:flex-row gap-4">
          <select v-model="selectedTeam" class="input md:w-48">
            <option value="">全チーム</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
          <div class="flex-1 text-right">
            <span class="text-sm text-gray-500">
              対象: {{ filteredEmployees.length }}名
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Personality Traits Average -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">性格特性（平均）</h2>
          <div v-if="companyAverageTraits" class="space-y-4">
            <div v-for="trait in companyAverageTraits" :key="trait.key">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600 dark:text-gray-400">{{ trait.label }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ trait.average }}/10</span>
              </div>
              <div class="h-3 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-600 rounded-full transition-all"
                  :style="{ width: `${trait.average * 10}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Style Average -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">ワークスタイル（平均）</h2>
          <div v-if="companyAverageWorkStyle" class="space-y-4">
            <div v-for="style in companyAverageWorkStyle" :key="style.key">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600 dark:text-gray-400">{{ style.label }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ style.average }}/10</span>
              </div>
              <div class="h-3 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-600 rounded-full transition-all"
                  :style="{ width: `${style.average * 10}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trait Distribution -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">性格特性分布</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="trait in traitDistribution"
            :key="trait.key"
            class="p-4 bg-gray-50 dark:bg-dark-border rounded-lg"
          >
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">{{ trait.label }}</h3>
            <div class="flex items-center space-x-2">
              <div class="flex-1 h-6 rounded-full overflow-hidden flex">
                <div
                  class="bg-blue-400 flex items-center justify-center text-white text-xs"
                  :style="{ width: `${(trait.buckets.low / trait.total) * 100}%` }"
                >
                  {{ trait.buckets.low > 0 ? trait.buckets.low : '' }}
                </div>
                <div
                  class="bg-green-400 flex items-center justify-center text-white text-xs"
                  :style="{ width: `${(trait.buckets.medium / trait.total) * 100}%` }"
                >
                  {{ trait.buckets.medium > 0 ? trait.buckets.medium : '' }}
                </div>
                <div
                  class="bg-amber-400 flex items-center justify-center text-white text-xs"
                  :style="{ width: `${(trait.buckets.high / trait.total) * 100}%` }"
                >
                  {{ trait.buckets.high > 0 ? trait.buckets.high : '' }}
                </div>
              </div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>低 (1-3)</span>
              <span>中 (4-7)</span>
              <span>高 (8-10)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Comparison -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">チーム別比較（性格特性）</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-dark-border">
                <th class="text-left py-3 px-4 font-medium text-gray-500">チーム</th>
                <th
                  v-for="(label, key) in traitLabels"
                  :key="key"
                  class="text-center py-3 px-4 font-medium text-gray-500 text-sm"
                >
                  {{ label }}
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
                  <span class="text-xs text-gray-400 ml-1">({{ item.memberCount }}名)</span>
                </td>
                <template v-if="item.traits">
                  <td
                    v-for="trait in item.traits"
                    :key="trait.key"
                    class="py-3 px-4 text-center"
                  >
                    <span
                      class="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                      :class="{
                        'bg-blue-100 text-blue-800': trait.average <= 4,
                        'bg-green-100 text-green-800': trait.average > 4 && trait.average <= 7,
                        'bg-amber-100 text-amber-800': trait.average > 7,
                      }"
                    >
                      {{ trait.average }}
                    </span>
                  </td>
                </template>
                <td v-else :colspan="Object.keys(traitLabels).length" class="py-3 px-4 text-center text-gray-400">
                  データなし
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Insights -->
      <div class="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <span class="material-icons text-primary-600 dark:text-primary-400">insights</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">分析インサイト</h3>
            <ul class="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li class="flex items-start">
                <span class="material-icons text-primary-600 text-sm mr-2 mt-0.5">check_circle</span>
                全社的に協調性とチームワークが高い傾向にあり、チームでの協働に向いている組織です。
              </li>
              <li class="flex items-start">
                <span class="material-icons text-primary-600 text-sm mr-2 mt-0.5">check_circle</span>
                開発チームはリーダーシップと独立性が高く、自律的な働き方が可能です。
              </li>
              <li class="flex items-start">
                <span class="material-icons text-amber-600 text-sm mr-2 mt-0.5">info</span>
                ストレス耐性の平均がやや低めのため、業務負荷の分散に注意が必要かもしれません。
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
