<script setup lang="ts">
import { onMounted, Suspense } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const { initialize, initialized } = useAuth()

onMounted(async () => {
  await initialize()
})
</script>

<template>
  <div v-if="!initialized" class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
    <div class="text-center">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
    </div>
  </div>
  <Suspense v-else>
    <RouterView />
    <template #fallback>
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    </template>
  </Suspense>
</template>
