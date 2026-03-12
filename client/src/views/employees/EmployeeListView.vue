<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useEmployee } from '@/composables/useEmployee'
import { getDemoTeams, getDemoEmployeeById } from '@/data/demoData'
import { JOB_TYPE_LABELS, getTop5Strengths, DOMAIN_COLORS, type StrengthDomain } from '@/types/employee'
import AppLayout from '@/components/layout/AppLayout.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'

const router = useRouter()
const appStore = useAppStore()
const { employees, loading, fetchEmployees } = useEmployee()

// Filters
const searchQuery = ref('')
const selectedTeam = ref('')
const selectedJobType = ref('')
const viewMode = ref<'grid' | 'list'>('grid')

const teams = getDemoTeams()
const jobTypes = Object.entries(JOB_TYPE_LABELS)

onMounted(async () => {
  appStore.setPageTitle('社員一覧')
  appStore.setBreadcrumbs([{ label: '社員一覧' }])
  await fetchEmployees()
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
})

watch([selectedTeam, selectedJobType], () => {
  applyFilters()
})

async function applyFilters() {
  await fetchEmployees({
    search: searchQuery.value || undefined,
    teamId: selectedTeam.value || undefined,
    jobType: selectedJobType.value || undefined,
  })
}

function clearFilters() {
  searchQuery.value = ''
  selectedTeam.value = ''
  selectedJobType.value = ''
  fetchEmployees()
}

function goToEmployee(id: string) {
  router.push(`/employees/${id}`)
}

// Get employee's top 5 strengths (demo)
function getEmployeeStrengths(employeeId: string) {
  const emp = getDemoEmployeeById(employeeId)
  if (emp?.strengths) {
    return getTop5Strengths(emp.strengths.strengthsOrder)
  }
  return []
}

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedTeam.value || selectedJobType.value
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">社員一覧</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ employees.length }}名の社員
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="viewMode = 'grid'"
            class="p-2 rounded-lg transition-colors"
            :class="viewMode === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border'"
          >
            <span class="material-icons">grid_view</span>
          </button>
          <button
            @click="viewMode = 'list'"
            class="p-2 rounded-lg transition-colors"
            :class="viewMode === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border'"
          >
            <span class="material-icons">view_list</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="名前やメールで検索..."
              class="input pl-10"
            />
          </div>

          <!-- Team filter -->
          <select v-model="selectedTeam" class="input md:w-48">
            <option value="">すべてのチーム</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>

          <!-- Job type filter -->
          <select v-model="selectedJobType" class="input md:w-48">
            <option value="">すべての職種</option>
            <option v-for="[value, label] in jobTypes" :key="value" :value="value">
              {{ label }}
            </option>
          </select>

          <!-- Clear filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="btn-ghost flex items-center whitespace-nowrap"
          >
            <span class="material-icons text-sm mr-1">close</span>
            クリア
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard v-for="i in 6" :key="i" :show-avatar="true" :lines="2" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="employees.length === 0"
        class="card text-center py-12"
      >
        <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">person_search</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">社員が見つかりません</h3>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          検索条件を変更してお試しください
        </p>
        <button @click="clearFilters" class="btn-primary mt-4">
          フィルターをクリア
        </button>
      </div>

      <!-- Grid view -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="employee in employees"
          :key="employee.id"
          @click="goToEmployee(employee.id)"
          class="card hover:shadow-card-hover transition-all cursor-pointer group"
        >
          <div class="flex items-start space-x-4">
            <!-- Avatar -->
            <div class="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span class="text-primary-600 dark:text-primary-400 font-semibold text-xl">
                {{ employee.name.charAt(0) }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ employee.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ employee.jobTitle || JOB_TYPE_LABELS[employee.jobType || 'other'] }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ employee.team?.name || '未所属' }}
              </p>

              <!-- Top 5 Strengths -->
              <div class="flex flex-wrap gap-1 mt-3">
                <span
                  v-for="strength in getEmployeeStrengths(employee.id)"
                  :key="strength?.id"
                  class="inline-flex items-center px-2 py-0.5 text-xs rounded-full"
                  :class="[
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                  ]"
                >
                  {{ strength?.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="card overflow-hidden p-0">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-dark-border">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                社員
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                チーム
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                職種
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                TOP5
              </th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-dark-border">
            <tr
              v-for="employee in employees"
              :key="employee.id"
              @click="goToEmployee(employee.id)"
              class="hover:bg-gray-50 dark:hover:bg-dark-border cursor-pointer transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span class="text-primary-600 dark:text-primary-400 font-medium">
                      {{ employee.name.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ employee.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ employee.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ employee.team?.name || '未所属' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ employee.jobTitle || JOB_TYPE_LABELS[employee.jobType || 'other'] }}
                </span>
              </td>
              <td class="px-6 py-4 hidden xl:table-cell">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="strength in getEmployeeStrengths(employee.id).slice(0, 3)"
                    :key="strength?.id"
                    class="inline-flex items-center px-2 py-0.5 text-xs rounded-full"
                    :class="[
                      DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                      DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                    ]"
                  >
                    {{ strength?.name }}
                  </span>
                  <span
                    v-if="getEmployeeStrengths(employee.id).length > 3"
                    class="text-xs text-gray-400"
                  >
                    +{{ getEmployeeStrengths(employee.id).length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="material-icons text-gray-400">chevron_right</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>
