<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useEmployee } from '@/composables/useEmployee'
import { getDemoTeams } from '@/data/demoData'
import { JOB_TYPE_LABELS, ROLE_LABELS } from '@/types/employee'
import type { JobType, UserRole } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()
const { employees, fetchEmployees } = useEmployee()

const teams = getDemoTeams()
const showModal = ref(false)
const editingEmployee = ref<any>(null)
const searchQuery = ref('')

onMounted(async () => {
  appStore.setPageTitle('社員管理')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: '社員管理' },
  ])
  await fetchEmployees()
})

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value
  const q = searchQuery.value.toLowerCase()
  return employees.value.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.email.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  editingEmployee.value = {
    id: null,
    name: '',
    email: '',
    team_id: '',
    job_type: 'engineer' as JobType,
    job_title: '',
    role: 'member' as UserRole,
    hire_date: '',
    is_active: true,
  }
  showModal.value = true
}

function openEditModal(emp: any) {
  editingEmployee.value = { ...emp }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingEmployee.value = null
}

function saveEmployee() {
  // Demo mode - just close modal
  alert('デモモードでは保存できません')
  closeModal()
}

function deleteEmployee(_id: string) {
  if (confirm('この社員を削除しますか？')) {
    alert('デモモードでは削除できません')
  }
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">社員管理</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">社員情報の追加・編集・削除</p>
        </div>
        <button @click="openCreateModal" class="btn-primary flex items-center">
          <span class="material-icons mr-2">person_add</span>
          社員を追加
        </button>
      </div>

      <!-- Search -->
      <div class="card">
        <div class="relative">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="名前・メールで検索..."
            class="input pl-10"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden p-0">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-dark-border">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">社員</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">チーム</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">職種</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">権限</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-dark-border">
            <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-gray-50 dark:hover:bg-dark-border">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span class="text-primary-600 dark:text-primary-400 font-medium">{{ emp.name.charAt(0) }}</span>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ emp.name }}</p>
                    <p class="text-xs text-gray-500">{{ emp.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                {{ emp.team?.name || '未所属' }}
              </td>
              <td class="px-6 py-4 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">
                {{ JOB_TYPE_LABELS[emp.job_type || 'other'] }}
              </td>
              <td class="px-6 py-4 hidden lg:table-cell">
                <span class="px-2 py-1 text-xs rounded-full"
                  :class="{
                    'bg-red-100 text-red-800': emp.role === 'admin',
                    'bg-blue-100 text-blue-800': emp.role === 'manager',
                    'bg-gray-100 text-gray-800': emp.role === 'member',
                  }"
                >
                  {{ ROLE_LABELS[emp.role] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2 py-1 text-xs rounded-full"
                  :class="emp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                >
                  {{ emp.is_active ? '有効' : '無効' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="openEditModal(emp)" class="p-1 text-gray-400 hover:text-primary-600">
                  <span class="material-icons text-lg">edit</span>
                </button>
                <button @click="deleteEmployee(emp.id)" class="p-1 text-gray-400 hover:text-red-600">
                  <span class="material-icons text-lg">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ editingEmployee?.id ? '社員を編集' : '社員を追加' }}
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">氏名</label>
              <input v-model="editingEmployee.name" type="text" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">メールアドレス</label>
              <input v-model="editingEmployee.email" type="email" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">チーム</label>
              <select v-model="editingEmployee.team_id" class="input">
                <option value="">未所属</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">職種</label>
              <select v-model="editingEmployee.job_type" class="input">
                <option v-for="(label, value) in JOB_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">権限</label>
              <select v-model="editingEmployee.role" class="input">
                <option v-for="(label, value) in ROLE_LABELS" :key="value" :value="value">{{ label }}</option>
              </select>
            </div>
            <div class="flex items-center">
              <input v-model="editingEmployee.is_active" type="checkbox" id="is_active" class="mr-2" />
              <label for="is_active" class="text-sm text-gray-700 dark:text-gray-300">有効</label>
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 dark:border-dark-border flex justify-end space-x-3">
            <button @click="closeModal" class="btn-secondary">キャンセル</button>
            <button @click="saveEmployee" class="btn-primary">保存</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
