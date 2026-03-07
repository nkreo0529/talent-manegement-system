<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
  <header
    class="fixed top-0 right-0 z-30 h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border transition-all duration-300"
    :class="appStore.sidebarOpen ? 'left-64' : 'left-20'"
  >
    <div class="flex items-center justify-between h-full px-6">
      <!-- Left section -->
      <div class="flex items-center space-x-4">
        <!-- Toggle sidebar -->
        <button
          @click="appStore.toggleSidebar"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
        >
          <span class="material-icons text-xl">
            {{ appStore.sidebarOpen ? 'menu_open' : 'menu' }}
          </span>
        </button>

        <!-- Breadcrumbs -->
        <nav v-if="appStore.breadcrumbs.length > 0" class="flex items-center space-x-2 text-sm">
          <template v-for="(crumb, index) in appStore.breadcrumbs" :key="index">
            <span v-if="index > 0" class="text-gray-400">/</span>
            <router-link
              v-if="crumb.to"
              :to="crumb.to"
              class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else class="text-gray-900 dark:text-white font-medium">
              {{ crumb.label }}
            </span>
          </template>
        </nav>
        <h1 v-else class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ appStore.pageTitle }}
        </h1>
      </div>

      <!-- Right section -->
      <div class="flex items-center space-x-3">
        <!-- Search -->
        <div class="relative hidden md:block">
          <input
            type="text"
            placeholder="検索..."
            class="w-64 pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-dark-border border-none rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-dark-surface transition-colors"
          />
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
        </div>

        <!-- Notifications -->
        <button class="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
          <span class="material-icons text-xl">notifications</span>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Dark mode toggle -->
        <button
          @click="appStore.toggleDarkMode"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
          :title="appStore.darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
        >
          <span class="material-icons text-xl">
            {{ appStore.darkMode ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>
