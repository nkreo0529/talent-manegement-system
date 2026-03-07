<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { getDemoEmployees, getAllDemoEmployeesWithDetails } from '@/data/demoData'
import type { SpiPersonalityTraits, SpiWorkStyle, SpiAptitudeScores } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('SPI入力')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: 'SPI入力' },
  ])
})

const employees = getDemoEmployees()
const allEmployeesWithDetails = getAllDemoEmployeesWithDetails()
const selectedEmployeeId = ref('')

const selectedEmployee = computed(() => {
  if (!selectedEmployeeId.value) return null
  return allEmployeesWithDetails.find(e => e.id === selectedEmployeeId.value)
})

// Form data
const personalityTraits = ref<SpiPersonalityTraits>({
  extroversion: 5,
  agreeableness: 5,
  conscientiousness: 5,
  neuroticism: 5,
  openness: 5,
})

const workStyle = ref<SpiWorkStyle>({
  leadership: 5,
  independence: 5,
  teamwork: 5,
  persistence: 5,
  flexibility: 5,
  stress_tolerance: 5,
})

const aptitudeScores = ref<SpiAptitudeScores>({
  verbal: 5,
  numerical: 5,
  logical: 5,
})

const testDate = ref('')

// Load existing data when employee is selected
watch(selectedEmployeeId, () => {
  if (selectedEmployee.value?.spi_results) {
    const spi = selectedEmployee.value.spi_results
    personalityTraits.value = { ...spi.personality_traits }
    workStyle.value = { ...spi.work_style }
    aptitudeScores.value = { ...spi.aptitude_scores }
    testDate.value = spi.test_date || ''
  } else {
    // Reset to defaults
    personalityTraits.value = { extroversion: 5, agreeableness: 5, conscientiousness: 5, neuroticism: 5, openness: 5 }
    workStyle.value = { leadership: 5, independence: 5, teamwork: 5, persistence: 5, flexibility: 5, stress_tolerance: 5 }
    aptitudeScores.value = { verbal: 5, numerical: 5, logical: 5 }
    testDate.value = ''
  }
})

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

const aptitudeLabels: Record<keyof SpiAptitudeScores, string> = {
  verbal: '言語',
  numerical: '数理',
  logical: '論理',
}

function saveSpi() {
  alert('デモモードでは保存できません')
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SPI入力</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">社員のSPI結果を入力・編集</p>
      </div>

      <!-- Employee selection -->
      <div class="card">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">社員を選択</label>
        <select v-model="selectedEmployeeId" class="input max-w-md">
          <option value="">選択してください</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.name }}
          </option>
        </select>
      </div>

      <template v-if="selectedEmployee">
        <!-- Personality Traits -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">性格特性</h2>
          <div class="space-y-6">
            <div v-for="(label, key) in traitLabels" :key="key">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</label>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ personalityTraits[key as keyof SpiPersonalityTraits] }}/10</span>
              </div>
              <input
                v-model.number="personalityTraits[key as keyof SpiPersonalityTraits]"
                type="range"
                min="1"
                max="10"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-dark-border"
              />
            </div>
          </div>
        </div>

        <!-- Work Style -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">ワークスタイル</h2>
          <div class="space-y-6">
            <div v-for="(label, key) in workStyleLabels" :key="key">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</label>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ workStyle[key as keyof SpiWorkStyle] }}/10</span>
              </div>
              <input
                v-model.number="workStyle[key as keyof SpiWorkStyle]"
                type="range"
                min="1"
                max="10"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-dark-border"
              />
            </div>
          </div>
        </div>

        <!-- Aptitude -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">能力適性</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="(label, key) in aptitudeLabels" :key="key">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ label }}</label>
              <input
                v-model.number="aptitudeScores[key as keyof SpiAptitudeScores]"
                type="number"
                min="1"
                max="10"
                class="input"
              />
            </div>
          </div>
        </div>

        <!-- Test Date -->
        <div class="card">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">テスト実施日</label>
          <input v-model="testDate" type="date" class="input max-w-xs" />
        </div>

        <!-- Save -->
        <div class="flex justify-end">
          <button @click="saveSpi" class="btn-primary">保存</button>
        </div>
      </template>
    </div>
  </AppLayout>
</template>
