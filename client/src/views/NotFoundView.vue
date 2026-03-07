<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-200 dark:text-dark-border">404</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
        ページが見つかりません
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div class="flex items-center justify-center space-x-4 mt-8">
        <button @click="goBack" class="btn-secondary">
          <span class="material-icons text-sm mr-1">arrow_back</span>
          戻る
        </button>
        <button @click="goHome" class="btn-primary">
          <span class="material-icons text-sm mr-1">home</span>
          ホームへ
        </button>
      </div>
    </div>
  </div>
</template>
