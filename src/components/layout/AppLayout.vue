<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg">
    <AppSidebar />
    <AppHeader />

    <main
      class="pt-16 min-h-screen transition-all duration-300"
      :class="appStore.sidebarOpen ? 'ml-64' : 'ml-20'"
    >
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
