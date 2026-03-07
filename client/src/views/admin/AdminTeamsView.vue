<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { getDemoTeams, getDemoEmployees } from '@/data/demoData'
import AppLayout from '@/components/layout/AppLayout.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('チーム管理')
  appStore.setBreadcrumbs([
    { label: '管理' },
    { label: 'チーム管理' },
  ])
})

const teams = getDemoTeams()
const employees = getDemoEmployees()
const showModal = ref(false)
const editingTeam = ref<any>(null)

const getTeamMemberCount = (teamId: string) => {
  return employees.filter(e => e.team_id === teamId).length
}

const getManager = (managerId: string | null) => {
  if (!managerId) return null
  return employees.find(e => e.id === managerId)
}

function openCreateModal() {
  editingTeam.value = {
    id: null,
    name: '',
    description: '',
    manager_id: '',
  }
  showModal.value = true
}

function openEditModal(team: any) {
  editingTeam.value = { ...team }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTeam.value = null
}

function saveTeam() {
  alert('デモモードでは保存できません')
  closeModal()
}

function deleteTeam(_id: string) {
  if (confirm('このチームを削除しますか？')) {
    alert('デモモードでは削除できません')
  }
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">チーム管理</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">チームの追加・編集・削除</p>
        </div>
        <button @click="openCreateModal" class="btn-primary flex items-center">
          <span class="material-icons mr-2">group_add</span>
          チームを追加
        </button>
      </div>

      <!-- Teams grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="team in teams"
          :key="team.id"
          class="card"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ team.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ team.description }}</p>
            </div>
            <div class="flex space-x-1">
              <button @click="openEditModal(team)" class="p-1 text-gray-400 hover:text-primary-600">
                <span class="material-icons text-lg">edit</span>
              </button>
              <button @click="deleteTeam(team.id)" class="p-1 text-gray-400 hover:text-red-600">
                <span class="material-icons text-lg">delete</span>
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {{ getManager(team.manager_id)?.name?.charAt(0) || '?' }}
                  </span>
                </div>
                <div class="text-sm">
                  <p class="text-gray-900 dark:text-white">{{ getManager(team.manager_id)?.name || '未設定' }}</p>
                  <p class="text-xs text-gray-500">マネージャー</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ getTeamMemberCount(team.id) }}</p>
                <p class="text-xs text-gray-500">メンバー</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full">
          <div class="p-6 border-b border-gray-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ editingTeam?.id ? 'チームを編集' : 'チームを追加' }}
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">チーム名</label>
              <input v-model="editingTeam.name" type="text" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">説明</label>
              <textarea v-model="editingTeam.description" rows="3" class="input"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">マネージャー</label>
              <select v-model="editingTeam.manager_id" class="input">
                <option value="">未設定</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
              </select>
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 dark:border-dark-border flex justify-end space-x-3">
            <button @click="closeModal" class="btn-secondary">キャンセル</button>
            <button @click="saveTeam" class="btn-primary">保存</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
