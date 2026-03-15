<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useTeam } from '@/composables/useTeam'
import AppLayout from '@/components/layout/AppLayout.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'

const router = useRouter()
const appStore = useAppStore()
const { teams, loading, fetchTeams } = useTeam()

const searchQuery = ref('')

onMounted(async () => {
  appStore.setPageTitle('チーム')
  appStore.setBreadcrumbs([{ label: 'チーム' }])
  await fetchTeams()
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchTeams({ search: searchQuery.value || undefined })
  }, 300)
})

function goToTeam(id: string) {
  router.push(`/teams/${id}`)
}

const teamColors = [
  'linear-gradient(to right, #3b82f6, #2563eb)',
  'linear-gradient(to right, #a855f7, #9333ea)',
  'linear-gradient(to right, #22c55e, #16a34a)',
  'linear-gradient(to right, #f59e0b, #d97706)',
  'linear-gradient(to right, #f43f5e, #e11d48)',
]
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">チーム</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ teams.length }}チーム
          </p>
        </div>
      </div>

      <!-- Search -->
      <div class="card">
        <div class="relative">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="チーム名で検索..."
            class="input pl-10"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard v-for="i in 5" :key="i" :lines="3" />
      </div>

      <!-- Teams grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(team, index) in teams"
          :key="team.id"
          @click="goToTeam(team.id)"
          class="card overflow-hidden cursor-pointer hover:shadow-card-hover transition-all group"
        >
          <!-- Header gradient -->
          <div
            class="h-24 -mx-6 -mt-6 mb-4 flex items-center justify-center"
            :style="{ background: teamColors[index % teamColors.length] }"
          >
            <span class="text-white/70 text-6xl font-bold group-hover:scale-110 transition-transform">
              {{ team.name.charAt(0) }}
            </span>
          </div>

          <!-- Content -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ team.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {{ team.description || '説明なし' }}
            </p>

            <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              <!-- Manager -->
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {{ team.manager?.name?.charAt(0) || '?' }}
                  </span>
                </div>
                <div class="text-sm">
                  <p class="text-gray-900 dark:text-white">{{ team.manager?.name || '未設定' }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">マネージャー</p>
                </div>
              </div>

              <!-- Member count -->
              <div class="text-right">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ team.memberCount || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">メンバー</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && teams.length === 0" class="card text-center py-12">
        <span class="material-icons text-5xl text-gray-400">groups</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">チームが見つかりません</h3>
      </div>
    </div>
  </AppLayout>
</template>
