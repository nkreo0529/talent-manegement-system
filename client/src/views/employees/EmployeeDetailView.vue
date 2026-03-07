<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useEmployee } from '@/composables/useEmployee'
import { usePermission } from '@/composables/usePermission'
import { JOB_TYPE_LABELS, ROLE_LABELS, getTop5Strengths, DOMAIN_COLORS, DOMAIN_NAMES, STRENGTHS_34, type StrengthDomain } from '@/types/employee'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { currentEmployee, loading, error, fetchEmployeeById } = useEmployee()
const { canViewEvaluations } = usePermission()

const activeTab = ref('profile')
const tabs = [
  { id: 'profile', label: '基本情報', icon: 'person' },
  { id: 'tendency', label: '傾向', icon: 'psychology' },
  { id: 'howto', label: 'この人の活かし方', icon: 'lightbulb' },
  { id: 'strengths', label: 'SF分析', icon: 'star' },
  { id: 'spi', label: 'SPI分析', icon: 'analytics' },
  { id: 'evaluation', label: '評価履歴', icon: 'grade' },
]

const employeeId = computed(() => route.params.id as string)

onMounted(async () => {
  await loadEmployee()
})

watch(() => route.params.id, async () => {
  await loadEmployee()
})

async function loadEmployee() {
  await fetchEmployeeById(employeeId.value)
  if (currentEmployee.value) {
    appStore.setPageTitle(currentEmployee.value.name)
    appStore.setBreadcrumbs([
      { label: '社員一覧', to: '/employees' },
      { label: currentEmployee.value.name },
    ])
  }
}

const top5Strengths = computed(() => {
  if (!currentEmployee.value?.strengths) return []
  return getTop5Strengths(currentEmployee.value.strengths.strengthsOrder)
})

const domainCounts = computed(() => {
  const counts: Record<StrengthDomain, number> = {
    executing: 0,
    influencing: 0,
    relationship: 0,
    strategic: 0,
  }
  top5Strengths.value.forEach(s => {
    if (s) counts[s.domain]++
  })
  return counts
})

function goBack() {
  router.push('/employees')
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

// SPI traits labels
const spiTraitLabels: Record<string, string> = {
  extroversion: '外向性',
  agreeableness: '協調性',
  conscientiousness: '誠実性',
  neuroticism: '神経症的傾向',
  openness: '開放性',
}

const spiWorkStyleLabels: Record<string, string> = {
  leadership: 'リーダーシップ',
  independence: '独立性',
  teamwork: 'チームワーク',
  persistence: '粘り強さ',
  flexibility: '柔軟性',
  stress_tolerance: 'ストレス耐性',
}

const spiAptitudeLabels: Record<string, string> = {
  verbal: '言語',
  numerical: '数理',
  logical: '論理',
}

// Evaluation grade colors
const gradeColors: Record<string, string> = {
  S: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
        社員一覧に戻る
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
        <button @click="loadEmployee" class="btn-primary mt-4">再試行</button>
      </div>

      <!-- Employee not found -->
      <div v-else-if="!currentEmployee" class="card text-center py-12">
        <span class="material-icons text-5xl text-gray-300">person_off</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">社員が見つかりません</h3>
        <button @click="goBack" class="btn-primary mt-4">一覧に戻る</button>
      </div>

      <!-- Employee detail -->
      <template v-else>
        <!-- Header card -->
        <div class="card">
          <div class="flex flex-col md:flex-row md:items-center gap-6">
            <!-- Avatar -->
            <div class="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="text-primary-600 dark:text-primary-400 font-bold text-4xl">
                {{ currentEmployee.name.charAt(0) }}
              </span>
            </div>

            <!-- Info -->
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currentEmployee.name }}
                </h1>
                <span
                  v-if="currentEmployee.role !== 'member'"
                  class="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {{ ROLE_LABELS[currentEmployee.role] }}
                </span>
              </div>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ currentEmployee.jobTitle || JOB_TYPE_LABELS[currentEmployee.jobType || 'other'] }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {{ currentEmployee.team?.name || '未所属' }} • {{ currentEmployee.email }}
              </p>

              <!-- Top 5 Strengths -->
              <div class="flex flex-wrap gap-2 mt-4">
                <span
                  v-for="(strength, index) in top5Strengths"
                  :key="strength?.id"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm"
                  :class="[
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.bg,
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.text,
                    DOMAIN_COLORS[strength?.domain as StrengthDomain]?.border,
                    'border',
                  ]"
                >
                  <span class="font-medium mr-1">{{ index + 1 }}.</span>
                  {{ strength?.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-dark-border">
          <nav class="flex space-x-4 overflow-x-auto" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="flex items-center px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              :class="[
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
            >
              <span class="material-icons text-lg mr-2">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab content -->
        <div class="card">
          <!-- Profile tab -->
          <div v-if="activeTab === 'profile'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">基本情報</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">氏名</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ currentEmployee.name }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">ふりがな</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ currentEmployee.nameKana || '-' }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">メールアドレス</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ currentEmployee.email }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">所属チーム</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ currentEmployee.team?.name || '未所属' }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">職種</label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ JOB_TYPE_LABELS[currentEmployee.jobType || 'other'] }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">役職</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ currentEmployee.jobTitle || '-' }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">入社日</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(currentEmployee.hireDate) }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">権限</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ ROLE_LABELS[currentEmployee.role] }}</p>
              </div>
            </div>

            <!-- Career history -->
            <div v-if="currentEmployee.careers && currentEmployee.careers.length > 0" class="mt-8">
              <h3 class="text-md font-semibold text-gray-900 dark:text-white mb-4">経歴</h3>
              <div class="space-y-4">
                <div
                  v-for="career in currentEmployee.careers"
                  :key="career.id"
                  class="border-l-2 border-primary-600 pl-4"
                >
                  <p class="font-medium text-gray-900 dark:text-white">{{ career.position }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ career.companyName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {{ formatDate(career.startDate) }} - {{ career.isCurrent ? '現在' : formatDate(career.endDate) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tendency tab -->
          <div v-else-if="activeTab === 'tendency'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">傾向分析</h2>

            <!-- Domain distribution -->
            <div>
              <h3 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">4領域バランス</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  v-for="(domain, key) in DOMAIN_NAMES"
                  :key="key"
                  class="p-4 rounded-lg border"
                  :class="[DOMAIN_COLORS[key as StrengthDomain].bg, DOMAIN_COLORS[key as StrengthDomain].border]"
                >
                  <p class="text-sm" :class="DOMAIN_COLORS[key as StrengthDomain].text">{{ domain.ja }}</p>
                  <p class="text-3xl font-bold mt-1" :class="DOMAIN_COLORS[key as StrengthDomain].text">
                    {{ domainCounts[key as StrengthDomain] }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">/ TOP5</p>
                </div>
              </div>
            </div>

            <!-- Strengths/Weaknesses -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div class="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <h4 class="font-medium text-green-800 dark:text-green-400 flex items-center">
                  <span class="material-icons mr-2">thumb_up</span>
                  得意なこと
                </h4>
                <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li v-for="strength in top5Strengths.slice(0, 3)" :key="strength?.id" class="flex items-start">
                    <span class="material-icons text-green-600 text-sm mr-2 mt-0.5">check_circle</span>
                    {{ strength?.name }}の資質を活かした活動
                  </li>
                </ul>
              </div>
              <div class="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <h4 class="font-medium text-amber-800 dark:text-amber-400 flex items-center">
                  <span class="material-icons mr-2">info</span>
                  注意が必要なこと
                </h4>
                <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li class="flex items-start">
                    <span class="material-icons text-amber-600 text-sm mr-2 mt-0.5">warning</span>
                    弱い領域のタスクには適切なサポートを
                  </li>
                  <li class="flex items-start">
                    <span class="material-icons text-amber-600 text-sm mr-2 mt-0.5">warning</span>
                    強みの過剰使用に注意
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- How-to tab (AI Profile) -->
          <div v-else-if="activeTab === 'howto'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span class="material-icons text-primary-600 mr-2">smart_toy</span>
              この人の活かし方
            </h2>

            <div v-if="currentEmployee.aiProfile" class="space-y-6">
              <div class="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                <h3 class="font-medium text-primary-800 dark:text-primary-400 mb-2">プロフィールサマリー</h3>
                <p class="text-gray-700 dark:text-gray-300">{{ currentEmployee.aiProfile.profileSummary }}</p>
              </div>

              <div>
                <h3 class="font-medium text-gray-900 dark:text-white mb-2">ワークスタイル分析</h3>
                <p class="text-gray-600 dark:text-gray-400">{{ currentEmployee.aiProfile.workStyleAnalysis }}</p>
              </div>

              <div>
                <h3 class="font-medium text-gray-900 dark:text-white mb-2">協働のコツ</h3>
                <p class="text-gray-600 dark:text-gray-400">{{ currentEmployee.aiProfile.collaborationTips }}</p>
              </div>

              <div>
                <h3 class="font-medium text-gray-900 dark:text-white mb-2">成長提案</h3>
                <p class="text-gray-600 dark:text-gray-400">{{ currentEmployee.aiProfile.developmentSuggestions }}</p>
              </div>

              <p class="text-xs text-gray-400 dark:text-gray-500">
                生成日: {{ formatDate(currentEmployee.aiProfile.generatedAt) }}
              </p>
            </div>
            <div v-else class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300">auto_awesome</span>
              <p class="mt-2 text-gray-500 dark:text-gray-400">AIプロフィールは未生成です</p>
            </div>
          </div>

          <!-- Strengths tab -->
          <div v-else-if="activeTab === 'strengths'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">ストレングスファインダー分析</h2>

            <div v-if="currentEmployee.strengths" class="space-y-6">
              <!-- Top 5 detailed -->
              <div>
                <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-4">TOP 5 資質</h3>
                <div class="space-y-3">
                  <div
                    v-for="(strength, index) in top5Strengths"
                    :key="strength?.id"
                    class="flex items-center p-4 rounded-lg border"
                    :class="[DOMAIN_COLORS[strength?.domain as StrengthDomain].bg, DOMAIN_COLORS[strength?.domain as StrengthDomain].border]"
                  >
                    <span class="text-2xl font-bold mr-4" :class="DOMAIN_COLORS[strength?.domain as StrengthDomain].text">
                      {{ index + 1 }}
                    </span>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">{{ strength?.name }}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ strength?.nameEn }} • {{ DOMAIN_NAMES[strength?.domain as StrengthDomain]?.ja }}
                      </p>
                    </div>
                    <span
                      class="px-3 py-1 text-xs rounded-full"
                      :class="[DOMAIN_COLORS[strength?.domain as StrengthDomain].text, DOMAIN_COLORS[strength?.domain as StrengthDomain].bg]"
                    >
                      {{ DOMAIN_NAMES[strength?.domain as StrengthDomain]?.ja }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- All 34 (first 10) -->
              <div>
                <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-4">全34資質（TOP10）</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(strengthId, index) in currentEmployee.strengths.strengthsOrder.slice(0, 10)"
                    :key="strengthId"
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm border"
                    :class="index < 5 ? 'font-medium' : 'opacity-60'"
                  >
                    <span class="mr-2 text-gray-400">{{ index + 1 }}.</span>
                    {{ STRENGTHS_34.find(s => s.id === strengthId)?.name }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300">star_border</span>
              <p class="mt-2 text-gray-500 dark:text-gray-400">SF結果は未登録です</p>
            </div>
          </div>

          <!-- SPI tab -->
          <div v-else-if="activeTab === 'spi'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">SPI分析</h2>

            <div v-if="currentEmployee.spiResults" class="space-y-8">
              <!-- Personality traits -->
              <div>
                <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-4">性格特性</h3>
                <div class="space-y-4">
                  <div
                    v-for="(value, key) in currentEmployee.spiResults.personalityTraits"
                    :key="key"
                  >
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-600 dark:text-gray-400">{{ spiTraitLabels[key] }}</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ value }}/10</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                      <div
                        class="h-full bg-primary-600 rounded-full transition-all"
                        :style="{ width: `${value * 10}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Work style -->
              <div>
                <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-4">ワークスタイル</h3>
                <div class="space-y-4">
                  <div
                    v-for="(value, key) in currentEmployee.spiResults.workStyle"
                    :key="key"
                  >
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-600 dark:text-gray-400">{{ spiWorkStyleLabels[key] }}</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ value }}/10</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                      <div
                        class="h-full bg-green-600 rounded-full transition-all"
                        :style="{ width: `${value * 10}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Aptitude -->
              <div>
                <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-4">能力適性</h3>
                <div class="grid grid-cols-3 gap-4">
                  <div
                    v-for="(value, key) in currentEmployee.spiResults.aptitudeScores"
                    :key="key"
                    class="text-center p-4 bg-gray-50 dark:bg-dark-border rounded-lg"
                  >
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ spiAptitudeLabels[key] }}</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ value }}</p>
                    <p class="text-xs text-gray-400">/10</p>
                  </div>
                </div>
              </div>

              <p class="text-xs text-gray-400 dark:text-gray-500">
                テスト日: {{ formatDate(currentEmployee.spiResults.testDate) }}
              </p>
            </div>
            <div v-else class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300">analytics</span>
              <p class="mt-2 text-gray-500 dark:text-gray-400">SPI結果は未登録です</p>
            </div>
          </div>

          <!-- Evaluation tab -->
          <div v-else-if="activeTab === 'evaluation'" class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">評価履歴</h2>

            <template v-if="canViewEvaluations(currentEmployee.id)">
              <div v-if="currentEmployee.evaluations && currentEmployee.evaluations.length > 0" class="space-y-4">
                <div
                  v-for="evaluation in currentEmployee.evaluations"
                  :key="evaluation.id"
                  class="p-4 border border-gray-200 dark:border-dark-border rounded-lg"
                >
                  <div class="flex items-center justify-between mb-4">
                    <span class="text-lg font-medium text-gray-900 dark:text-white">{{ evaluation.period }}</span>
                    <span
                      class="px-3 py-1 text-lg font-bold rounded-lg"
                      :class="gradeColors[evaluation.overallGrade]"
                    >
                      {{ evaluation.overallGrade }}
                    </span>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div v-if="evaluation.strengthsComment">
                      <span class="text-gray-500 dark:text-gray-400">強み:</span>
                      <p class="text-gray-700 dark:text-gray-300 mt-1">{{ evaluation.strengthsComment }}</p>
                    </div>
                    <div v-if="evaluation.improvementsComment">
                      <span class="text-gray-500 dark:text-gray-400">改善点:</span>
                      <p class="text-gray-700 dark:text-gray-300 mt-1">{{ evaluation.improvementsComment }}</p>
                    </div>
                    <div v-if="evaluation.goals">
                      <span class="text-gray-500 dark:text-gray-400">次期目標:</span>
                      <p class="text-gray-700 dark:text-gray-300 mt-1">{{ evaluation.goals }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <span class="material-icons text-4xl text-gray-300">grade</span>
                <p class="mt-2 text-gray-500 dark:text-gray-400">評価履歴はありません</p>
              </div>
            </template>
            <div v-else class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300">lock</span>
              <p class="mt-2 text-gray-500 dark:text-gray-400">閲覧権限がありません</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>
