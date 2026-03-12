<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { getDemoEmployees, getAllDemoEmployeesWithDetails } from '@/data/demoData'
import { STRENGTHS_34, getTop5Strengths, DOMAIN_COLORS, type StrengthDomain } from '@/types/employee'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('ストレングスファインダー入力')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: 'SF入力' },
  ])
})

const employees = getDemoEmployees()
const allEmployeesWithDetails = getAllDemoEmployeesWithDetails()
const selectedEmployeeId = ref('')
const searchQuery = ref('')

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees
  const q = searchQuery.value.toLowerCase()
  return employees.filter(e => e.name.toLowerCase().includes(q))
})

const selectedEmployee = computed(() => {
  if (!selectedEmployeeId.value) return null
  return allEmployeesWithDetails.find(e => e.id === selectedEmployeeId.value)
})

const currentStrengths = computed(() => {
  if (!selectedEmployee.value?.strengths) return []
  return selectedEmployee.value.strengths.strengthsOrder
})

const top5 = computed(() => {
  if (!currentStrengths.value.length) return []
  return getTop5Strengths(currentStrengths.value)
})

function saveStrengths() {
  alert('デモモードでは保存できません')
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ストレングスファインダー入力</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">社員のSF結果を入力・編集</p>
      </div>

      <!-- Employee selection -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">社員を選択</label>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="名前で検索..."
                class="input"
              />
            </div>
            <div class="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-lg">
              <button
                v-for="emp in filteredEmployees"
                :key="emp.id"
                @click="selectedEmployeeId = emp.id"
                class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
                :class="selectedEmployeeId === emp.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
              >
                <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                  <span class="text-primary-600 text-sm">{{ emp.name.charAt(0) }}</span>
                </div>
                <span class="text-sm text-gray-900 dark:text-white">{{ emp.name }}</span>
              </button>
            </div>
          </div>

          <!-- Current TOP5 -->
          <div v-if="selectedEmployee">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">現在のTOP5</label>
            <div class="space-y-2">
              <div
                v-for="(strength, index) in top5"
                :key="strength?.id"
                class="flex items-center p-3 rounded-lg border"
                :class="[DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg, DOMAIN_COLORS[strength?.domain as StrengthDomain]?.border]"
              >
                <span class="text-lg font-bold mr-3" :class="DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text">
                  {{ index + 1 }}
                </span>
                <span class="text-gray-900 dark:text-white">{{ strength?.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Strengths input (simplified) -->
      <div v-if="selectedEmployee" class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">34資質リスト</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ※本番環境ではドラッグ&ドロップで順序を変更できます
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="(domain, domainKey) in { executing: '実行力', influencing: '影響力', relationship: '人間関係構築力', strategic: '戦略的思考力' }"
            :key="domainKey"
          >
            <h3
              class="font-medium mb-2 px-2 py-1 rounded"
              :class="DOMAIN_COLORS[domainKey as StrengthDomain]?.text"
            >
              {{ domain }}
            </h3>
            <div class="space-y-1">
              <div
                v-for="strength in STRENGTHS_34.filter(s => s.domain === domainKey)"
                :key="strength.id"
                class="px-3 py-2 text-sm rounded cursor-move hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                :class="currentStrengths.slice(0, 5).includes(strength.id) ? DOMAIN_COLORS[domainKey as StrengthDomain]?.bg : ''"
              >
                {{ strength.name }}
                <span
                  v-if="currentStrengths.indexOf(strength.id) < 5 && currentStrengths.indexOf(strength.id) >= 0"
                  class="ml-2 text-xs text-gray-400"
                >
                  #{{ currentStrengths.indexOf(strength.id) + 1 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="saveStrengths" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
