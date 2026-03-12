<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { getAllDemoEmployeesWithDetails } from '@/data/demoData'
import type { EvaluationGrade } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('評価管理')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: '評価管理' },
  ])
})

const employees = getAllDemoEmployeesWithDetails()
const showModal = ref(false)
const selectedPeriod = ref('2024H1')

// Flatten evaluations
const allEvaluations = employees.flatMap(emp =>
  (emp.evaluations || []).map(ev => ({
    ...ev,
    employee: emp,
  }))
)

const periods = ['2024H2', '2024H1', '2023H2', '2023H1']
const grades: EvaluationGrade[] = ['S', 'A', 'B', 'C', 'D']

const gradeColors: Record<string, string> = {
  S: 'bg-purple-100 text-purple-800',
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-amber-100 text-amber-800',
  D: 'bg-red-100 text-red-800',
}

// New evaluation form
const newEvaluation = ref({
  employeeId: '',
  period: '2024H1',
  overallGrade: 'B' as EvaluationGrade,
  strengthsComment: '',
  improvementsComment: '',
  goals: '',
})

function openCreateModal() {
  newEvaluation.value = {
    employeeId: '',
    period: selectedPeriod.value,
    overallGrade: 'B',
    strengthsComment: '',
    improvementsComment: '',
    goals: '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function saveEvaluation() {
  alert('デモモードでは保存できません')
  closeModal()
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">評価管理</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">社員評価の入力・管理</p>
        </div>
        <button @click="openCreateModal" class="btn-primary flex items-center">
          <span class="material-icons mr-2">add</span>
          評価を追加
        </button>
      </div>

      <!-- Period filter -->
      <div class="card">
        <div class="flex items-center space-x-4">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">期間:</label>
          <div class="flex space-x-2">
            <button
              v-for="period in periods"
              :key="period"
              @click="selectedPeriod = period"
              class="px-4 py-2 text-sm rounded-lg transition-colors"
              :class="selectedPeriod === period
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-300'"
            >
              {{ period }}
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluations list -->
      <div class="card overflow-hidden p-0">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-dark-border">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">社員</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期間</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">評価</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">強み</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-dark-border">
            <tr
              v-for="ev in allEvaluations.filter(e => e.period === selectedPeriod)"
              :key="ev.id"
              class="hover:bg-gray-50 dark:hover:bg-dark-border"
            >
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ ev.employee.name }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ ev.period }}</td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center justify-center w-10 h-10 text-lg font-bold rounded-lg"
                  :class="gradeColors[ev.overallGrade]"
                >
                  {{ ev.overallGrade }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                <p class="line-clamp-1">{{ ev.strengthsComment || '-' }}</p>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-1 text-gray-400 hover:text-primary-600">
                  <span class="material-icons text-lg">edit</span>
                </button>
              </td>
            </tr>
            <tr v-if="allEvaluations.filter(e => e.period === selectedPeriod).length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                この期間の評価はありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grade summary -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">評価分布</h2>
        <div class="flex space-x-4">
          <div
            v-for="grade in grades"
            :key="grade"
            class="flex-1 text-center p-4 rounded-lg"
            :class="gradeColors[grade]"
          >
            <p class="text-3xl font-bold">
              {{ allEvaluations.filter(e => e.period === selectedPeriod && e.overallGrade === grade).length }}
            </p>
            <p class="text-sm mt-1">{{ grade }}評価</p>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">評価を追加</h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">社員</label>
              <select v-model="newEvaluation.employeeId" class="input">
                <option value="">選択してください</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">期間</label>
              <select v-model="newEvaluation.period" class="input">
                <option v-for="period in periods" :key="period" :value="period">{{ period }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">総合評価</label>
              <div class="flex space-x-2">
                <button
                  v-for="grade in grades"
                  :key="grade"
                  @click="newEvaluation.overallGrade = grade"
                  class="w-12 h-12 rounded-lg font-bold transition-all"
                  :class="newEvaluation.overallGrade === grade
                    ? gradeColors[grade] + ' ring-2 ring-offset-2 ring-primary-500'
                    : 'bg-gray-100 text-gray-600'"
                >
                  {{ grade }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">強み</label>
              <textarea v-model="newEvaluation.strengthsComment" rows="2" class="input"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">改善点</label>
              <textarea v-model="newEvaluation.improvementsComment" rows="2" class="input"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">次期目標</label>
              <textarea v-model="newEvaluation.goals" rows="2" class="input"></textarea>
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 dark:border-dark-border flex justify-end space-x-3">
            <button @click="closeModal" class="btn-secondary">キャンセル</button>
            <button @click="saveEvaluation" class="btn-primary">保存</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
