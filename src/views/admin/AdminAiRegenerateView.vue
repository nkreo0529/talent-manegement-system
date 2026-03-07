<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { getDemoEmployees, getDemoTeams } from '@/data/demoData'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('AI再生成')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: 'AI再生成' },
  ])
})

const employees = getDemoEmployees()
const teams = getDemoTeams()

const selectedEmployees = ref<string[]>([])
const selectedTeams = ref<string[]>([])
const isGenerating = ref(false)
const generationLog = ref<string[]>([])

function toggleEmployeeSelection(id: string) {
  const index = selectedEmployees.value.indexOf(id)
  if (index === -1) {
    selectedEmployees.value.push(id)
  } else {
    selectedEmployees.value.splice(index, 1)
  }
}

function toggleTeamSelection(id: string) {
  const index = selectedTeams.value.indexOf(id)
  if (index === -1) {
    selectedTeams.value.push(id)
  } else {
    selectedTeams.value.splice(index, 1)
  }
}

function selectAllEmployees() {
  if (selectedEmployees.value.length === employees.length) {
    selectedEmployees.value = []
  } else {
    selectedEmployees.value = employees.map(e => e.id)
  }
}

function selectAllTeams() {
  if (selectedTeams.value.length === teams.length) {
    selectedTeams.value = []
  } else {
    selectedTeams.value = teams.map(t => t.id)
  }
}

async function generateProfiles() {
  if (selectedEmployees.value.length === 0) {
    alert('社員を選択してください')
    return
  }

  isGenerating.value = true
  generationLog.value = []

  for (const empId of selectedEmployees.value) {
    const emp = employees.find(e => e.id === empId)
    generationLog.value.push(`🔄 ${emp?.name}のプロフィールを生成中...`)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    generationLog.value.push(`✅ ${emp?.name}のプロフィール生成完了`)
  }

  generationLog.value.push('')
  generationLog.value.push('🎉 すべての生成が完了しました（デモモード）')
  isGenerating.value = false
}

async function generateTeamAnalysis() {
  if (selectedTeams.value.length === 0) {
    alert('チームを選択してください')
    return
  }

  isGenerating.value = true
  generationLog.value = []

  for (const teamId of selectedTeams.value) {
    const team = teams.find(t => t.id === teamId)
    generationLog.value.push(`🔄 ${team?.name}の分析を生成中...`)

    await new Promise(resolve => setTimeout(resolve, 500))

    generationLog.value.push(`✅ ${team?.name}の分析完了`)
  }

  generationLog.value.push('')
  generationLog.value.push('🎉 すべての生成が完了しました（デモモード）')
  isGenerating.value = false
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AI再生成</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">AIプロフィールとチーム分析を再生成</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Employee profiles -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">社員プロフィール</h2>
            <button @click="selectAllEmployees" class="text-sm text-primary-600 hover:underline">
              {{ selectedEmployees.length === employees.length ? '選択解除' : 'すべて選択' }}
            </button>
          </div>

          <div class="max-h-64 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-lg mb-4">
            <div
              v-for="emp in employees"
              :key="emp.id"
              @click="toggleEmployeeSelection(emp.id)"
              class="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
              :class="selectedEmployees.includes(emp.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
            >
              <input
                type="checkbox"
                :checked="selectedEmployees.includes(emp.id)"
                class="mr-3"
                @click.stop
              />
              <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                <span class="text-primary-600 text-sm">{{ emp.name.charAt(0) }}</span>
              </div>
              <span class="text-sm text-gray-900 dark:text-white">{{ emp.name }}</span>
            </div>
          </div>

          <button
            @click="generateProfiles"
            :disabled="isGenerating || selectedEmployees.length === 0"
            class="w-full btn-primary flex items-center justify-center"
          >
            <span class="material-icons mr-2">auto_awesome</span>
            プロフィールを生成 ({{ selectedEmployees.length }}名)
          </button>
        </div>

        <!-- Team analysis -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">チーム分析</h2>
            <button @click="selectAllTeams" class="text-sm text-primary-600 hover:underline">
              {{ selectedTeams.length === teams.length ? '選択解除' : 'すべて選択' }}
            </button>
          </div>

          <div class="max-h-64 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-lg mb-4">
            <div
              v-for="team in teams"
              :key="team.id"
              @click="toggleTeamSelection(team.id)"
              class="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
              :class="selectedTeams.includes(team.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
            >
              <input
                type="checkbox"
                :checked="selectedTeams.includes(team.id)"
                class="mr-3"
                @click.stop
              />
              <span class="material-icons text-gray-400 mr-3">groups</span>
              <span class="text-sm text-gray-900 dark:text-white">{{ team.name }}</span>
            </div>
          </div>

          <button
            @click="generateTeamAnalysis"
            :disabled="isGenerating || selectedTeams.length === 0"
            class="w-full btn-primary flex items-center justify-center"
          >
            <span class="material-icons mr-2">analytics</span>
            チーム分析を生成 ({{ selectedTeams.length }}チーム)
          </button>
        </div>
      </div>

      <!-- Generation log -->
      <div v-if="generationLog.length > 0" class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">生成ログ</h2>
        <div class="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm text-green-400 max-h-64 overflow-y-auto">
          <p v-for="(log, index) in generationLog" :key="index" class="py-0.5">
            {{ log }}
          </p>
          <p v-if="isGenerating" class="animate-pulse">▌</p>
        </div>
      </div>

      <!-- Info -->
      <div class="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div class="flex items-start space-x-4">
          <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
          <div class="text-sm text-blue-800 dark:text-blue-300">
            <p class="font-medium mb-2">AI生成について</p>
            <ul class="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• 社員プロフィール: SF結果、SPI結果、評価情報を基にAIが分析</li>
              <li>• チーム分析: チームメンバーの資質分布を基にAIが分析</li>
              <li>• 使用モデル: Claude (claude-sonnet-4-5-20250929)</li>
              <li>• 本番環境では Anthropic API を使用します</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
