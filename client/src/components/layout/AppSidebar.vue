<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { employee, isAdmin, signOut, isDemoMode } = useAuth()

const navigation = computed(() => [
  {
    name: 'ダッシュボード',
    to: '/',
    icon: 'dashboard',
    show: true,
  },
  {
    name: '社員一覧',
    to: '/employees',
    icon: 'people',
    show: true,
  },
  {
    name: 'チーム',
    to: '/teams',
    icon: 'groups',
    show: true,
  },
  {
    name: '分析',
    icon: 'analytics',
    show: true,
    children: [
      { name: 'ストレングスファインダー', to: '/analysis/strengths' },
      { name: 'SPI分析', to: '/analysis/spi' },
    ],
  },
  {
    name: 'AI相談',
    to: '/ai-consultation',
    icon: 'smart_toy',
    show: true,
  },
  {
    name: '管理',
    icon: 'settings',
    show: isAdmin.value,
    children: [
      { name: '社員管理', to: '/admin/employees' },
      { name: 'SF入力', to: '/admin/strengths' },
      { name: 'SPI入力', to: '/admin/spi' },
      { name: '評価管理', to: '/admin/evaluations' },
      { name: 'チーム管理', to: '/admin/teams' },
      { name: 'AI再生成', to: '/admin/ai-regenerate' },
    ],
  },
])

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-40 h-screen bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border transition-all duration-300"
    :class="appStore.sidebarOpen ? 'w-64' : 'w-20'"
  >
    <!-- Logo -->
    <div class="flex items-center justify-center h-16 border-b border-gray-200 dark:border-dark-border">
      <div v-if="appStore.sidebarOpen" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">T</span>
        </div>
        <span class="font-bold text-lg text-gray-900 dark:text-white">TMS</span>
      </div>
      <div v-else class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-xl">T</span>
      </div>
    </div>

    <!-- Demo mode badge -->
    <div v-if="isDemoMode" class="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div v-if="appStore.sidebarOpen" class="text-xs text-amber-700 dark:text-amber-400 text-center">
        🔧 デモモード
      </div>
      <div v-else class="text-center">
        <span class="text-amber-600">🔧</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <template v-for="item in navigation" :key="item.name">
        <template v-if="item.show">
          <!-- Single item -->
          <router-link
            v-if="item.to"
            :to="item.to"
            class="flex items-center px-3 py-2 rounded-lg transition-colors"
            :class="[
              isActive(item.to)
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border',
            ]"
          >
            <span class="material-icons text-xl" :class="!appStore.sidebarOpen && 'mx-auto'">
              {{ item.icon }}
            </span>
            <span v-if="appStore.sidebarOpen" class="ml-3 text-sm font-medium">
              {{ item.name }}
            </span>
          </router-link>

          <!-- Dropdown -->
          <div v-else-if="item.children" class="space-y-1">
            <div
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400"
              :class="!appStore.sidebarOpen && 'justify-center'"
            >
              <span class="material-icons text-xl">{{ item.icon }}</span>
              <span v-if="appStore.sidebarOpen" class="ml-3 text-xs font-semibold uppercase tracking-wider">
                {{ item.name }}
              </span>
            </div>
            <template v-if="appStore.sidebarOpen">
              <router-link
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="flex items-center pl-10 pr-3 py-2 text-sm rounded-lg transition-colors"
                :class="[
                  isActive(child.to)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border',
                ]"
              >
                {{ child.name }}
              </router-link>
            </template>
          </div>
        </template>
      </template>
    </nav>

    <!-- User section -->
    <div class="border-t border-gray-200 dark:border-dark-border p-4">
      <div
        v-if="appStore.sidebarOpen"
        class="flex items-center space-x-3"
      >
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ employee?.name?.charAt(0) || 'U' }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ employee?.name || 'User' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ employee?.email || '' }}
          </p>
        </div>
        <button
          @click="handleLogout"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="ログアウト"
        >
          <span class="material-icons text-xl">logout</span>
        </button>
      </div>
      <button
        v-else
        @click="handleLogout"
        class="w-full flex justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        title="ログアウト"
      >
        <span class="material-icons text-xl">logout</span>
      </button>
    </div>
  </aside>
</template>
