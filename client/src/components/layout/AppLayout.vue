<script setup lang="ts">
import { watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
const authStore = useAuthStore()

// Auto-dismiss error after 5 seconds
watch(() => authStore.error, (newError) => {
  if (newError) {
    setTimeout(() => {
      authStore.error = null
    }, 5000)
  }
})

function dismissError() {
  authStore.error = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg">
    <AppSidebar />
    <AppHeader />

    <!-- Global error notification -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform -translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-full opacity-0"
    >
      <div
        v-if="authStore.error"
        class="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 py-2"
        :class="appStore.sidebarOpen ? 'ml-64' : 'ml-20'"
      >
        <div class="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-lg">
          <span class="material-icons text-red-600 dark:text-red-400">error</span>
          <span class="text-sm text-red-800 dark:text-red-300">{{ authStore.error }}</span>
          <button
            @click="dismissError"
            class="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
    </Transition>

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
