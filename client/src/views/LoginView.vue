<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const route = useRoute()
const { signInWithEmail, loading, error, isDemoMode, isAuthenticated } = useAuth()

const email = ref('')
const password = ref('')
const localError = ref('')

// Validate redirect URL to prevent Open Redirect attacks
function getSafeRedirect(redirect: unknown): string {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/'
}

onMounted(() => {
  if (isDemoMode.value || isAuthenticated.value) {
    router.push(getSafeRedirect(route.query.redirect))
  }
})

const handleSubmit = async () => {
  localError.value = ''

  if (!email.value) {
    localError.value = 'メールアドレスを入力してください'
    return
  }

  if (!password.value) {
    localError.value = 'パスワードを入力してください'
    return
  }

  const { error: signInError } = await signInWithEmail(email.value, password.value)
  if (!signInError) {
    router.push(getSafeRedirect(route.query.redirect))
  } else {
    localError.value = signInError.message || '認証エラーが発生しました'
  }
}

const enterDemoMode = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: linear-gradient(to bottom right, #eff6ff, #dbeafe)">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <span class="text-white font-bold text-3xl">T</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          タレントマネジメントシステム
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          社員の才能を最大限に活かす
        </p>
      </div>

      <!-- Demo mode notice -->
      <div v-if="isDemoMode" class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div class="flex items-start">
          <span class="material-icons text-amber-500 mr-3">info</span>
          <div>
            <h3 class="font-medium text-amber-800 dark:text-amber-300">デモモード</h3>
            <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Supabaseが設定されていないため、デモモードで動作しています。
            </p>
            <button
              @click="enterDemoMode"
              class="mt-3 btn-primary text-sm"
            >
              デモを開始
            </button>
          </div>
        </div>
      </div>

      <!-- Login form -->
      <div v-else class="card">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              v-model="email"
              type="email"
              class="input"
              placeholder="email@example.com"
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              パスワード
            </label>
            <input
              v-model="password"
              type="password"
              class="input"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <!-- Error message -->
          <div
            v-if="localError || error"
            class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ localError || error }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary flex items-center justify-center space-x-2 py-3"
          >
            <LoadingSpinner v-if="loading" size="sm" color="white" />
            <span>ログイン</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        © 2024 Talent Management System
      </p>
    </div>
  </div>
</template>
