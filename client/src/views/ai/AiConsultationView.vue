<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { getDemoEmployees, getAllDemoEmployeesWithDetails } from '@/data/demoData'
import { getTop5Strengths } from '@/types/employee'
import AppLayout from '@/components/layout/AppLayout.vue'
import DOMPurify from 'dompurify'

// Configure DOMPurify to allow only safe tags
const ALLOWED_TAGS = ['strong', 'em', 'code', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4']
const ALLOWED_ATTR = ['class']

function sanitizeAndFormatMessage(content: string): string {
  // 1. Escape all HTML entities first to neutralize any injected HTML
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  // 2. Apply safe markdown-like formatting on escaped content
  const formatted = escaped
    .replace(/\n/g, '<br>')
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold mt-3">$1</h2>')

  // 3. Final DOMPurify pass as defense-in-depth
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('AI相談')
  appStore.setBreadcrumbs([{ label: 'AI相談' }])
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const employees = getDemoEmployees()
const allEmployees = getAllDemoEmployeesWithDetails()

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const showMentionDropdown = ref(false)
const mentionQuery = ref('')
const mentionStartIndex = ref(-1)

// Template questions
const templateQuestions = [
  { icon: 'groups', label: 'チーム編成', question: 'エンジニアチームを新設する場合、どのようなメンバー構成が最適ですか？' },
  { icon: 'person_search', label: '人材配置', question: '新規プロジェクトのリーダーに適した人材を教えてください。' },
  { icon: 'diversity_3', label: 'チーム相性', question: '開発チームとデザインチームの協業を円滑にするには？' },
  { icon: 'trending_up', label: '育成', question: '@田中太郎 さんの成長を支援するためのアドバイスをください。' },
]

const filteredEmployees = computed(() => {
  if (!mentionQuery.value) return employees.slice(0, 5)
  const query = mentionQuery.value.toLowerCase()
  return employees.filter(e =>
    e.name.toLowerCase().includes(query)
  ).slice(0, 5)
})

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  const cursorPos = target.selectionStart || 0

  // Check for @ mention
  const lastAtIndex = value.lastIndexOf('@', cursorPos - 1)
  if (lastAtIndex !== -1) {
    const textAfterAt = value.slice(lastAtIndex + 1, cursorPos)
    if (!textAfterAt.includes(' ')) {
      mentionQuery.value = textAfterAt
      mentionStartIndex.value = lastAtIndex
      showMentionDropdown.value = true
      return
    }
  }

  showMentionDropdown.value = false
}

function selectMention(employee: typeof employees[0]) {
  const before = inputMessage.value.slice(0, mentionStartIndex.value)
  const after = inputMessage.value.slice(mentionStartIndex.value + mentionQuery.value.length + 1)
  inputMessage.value = `${before}@${employee.name} ${after}`
  showMentionDropdown.value = false
}

function getEmployeeContext(name: string) {
  const emp = allEmployees.find(e => e.name === name)
  if (!emp) return null

  const strengths = emp.strengths ? getTop5Strengths(emp.strengths.strengthsOrder) : []
  return {
    name: emp.name,
    team: emp.team?.name || '未所属',
    jobTitle: emp.jobTitle,
    top5: strengths.map(s => s?.name).join(', '),
    aiProfile: emp.aiProfile?.profileSummary,
  }
}

async function sendMessage(message?: string) {
  const text = message || inputMessage.value.trim()
  if (!text || isLoading.value) return

  // Extract mentioned employees
  const mentionedNames = text.match(/@([^\s@]+(?:\s[^\s@]+)?)/g)?.map(m => m.slice(1)) || []
  const mentionedContexts = mentionedNames
    .map(name => getEmployeeContext(name))
    .filter(Boolean)

  // Add user message
  messages.value.push({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: text,
    timestamp: new Date(),
  })

  inputMessage.value = ''
  scrollToBottom()
  isLoading.value = true

  try {
    // In demo mode, simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    let response = ''

    if (mentionedContexts.length > 0) {
      const ctx = mentionedContexts[0]
      response = `**${ctx?.name}さん** について分析しました。\n\n`
      response += `📍 **所属**: ${ctx?.team}\n`
      response += `💼 **役職**: ${ctx?.jobTitle}\n`
      response += `⭐ **TOP5資質**: ${ctx?.top5}\n\n`
      response += `### プロフィール\n${ctx?.aiProfile}\n\n`
      response += `### 協働のヒント\n`
      response += `- ${ctx?.name}さんの資質を活かすには、強みに合った役割を任せることが効果的です\n`
      response += `- 定期的なフィードバックを通じて、成長機会を提供しましょう\n`
      response += `- チームでの貢献を可視化し、モチベーションを高めましょう`
    } else if (text.includes('チーム編成') || text.includes('メンバー構成')) {
      response = `## チーム編成のアドバイス\n\n`
      response += `理想的なチーム構成には、以下の4つの領域のバランスが重要です：\n\n`
      response += `1. **実行力** - プロジェクトを確実に完遂するメンバー\n`
      response += `2. **影響力** - チームを動機づけ、対外的な交渉を担うメンバー\n`
      response += `3. **人間関係構築力** - チームの結束を高めるメンバー\n`
      response += `4. **戦略的思考力** - 長期的な視点で方向性を示すメンバー\n\n`
      response += `現在のエンジニアチームは**戦略的思考力**が強い傾向にあります。\n`
      response += `**影響力**を持つメンバーを加えると、より良いバランスになるでしょう。`
    } else if (text.includes('リーダー') || text.includes('適した人材')) {
      response = `## リーダー候補の分析\n\n`
      response += `プロジェクトリーダーに求められる資質：\n\n`
      response += `- **達成欲** または **目標志向** - 目標に向かってチームを導く\n`
      response += `- **指令性** または **リーダーシップ** - 決断力と方向性の提示\n`
      response += `- **コミュニケーション** - チーム内外との効果的な対話\n\n`
      response += `現在のチームでは、**田中太郎**さんと**鈴木一郎**さんが\n`
      response += `これらの資質を持っており、リーダー候補として適しています。`
    } else {
      response = `ご質問ありがとうございます。\n\n`
      response += `社員のタレント情報を基にアドバイスを提供できます。\n\n`
      response += `**ヒント**: 特定の社員について知りたい場合は、\n`
      response += `\`@名前\` で社員をメンションしてください。\n\n`
      response += `例: 「@田中太郎 さんの強みを教えて」`
    }

    messages.value.push({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    })
  } catch (error) {
    messages.value.push({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'エラーが発生しました。もう一度お試しください。',
      timestamp: new Date(),
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

function useTemplate(question: string) {
  inputMessage.value = question
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <AppLayout>
    <div class="h-[calc(100vh-8rem)] flex flex-col">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <span class="material-icons text-primary-600 mr-2">smart_toy</span>
          AI相談
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          社員のタレント情報を基にAIがアドバイスします
        </p>
      </div>

      <div class="flex-1 flex gap-6 min-h-0">
        <!-- Chat area -->
        <div class="flex-1 flex flex-col bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <!-- Messages -->
          <div
            ref="chatContainer"
            class="flex-1 overflow-y-auto p-4 space-y-4"
          >
            <!-- Welcome message -->
            <div v-if="messages.length === 0" class="text-center py-12">
              <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-primary-600 dark:text-primary-400 text-3xl">psychology</span>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">AIアシスタント</h2>
              <p class="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
                社員の強み、チーム編成、人材配置などについてご相談ください。
                @メンションで特定の社員について質問できます。
              </p>
            </div>

            <!-- Messages -->
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-2xl px-4 py-3"
                :class="message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-white rounded-bl-none'"
              >
                <div
                  class="prose prose-sm max-w-none"
                  :class="message.role === 'user' ? 'prose-invert' : 'dark:prose-invert'"
                  v-html="sanitizeAndFormatMessage(message.content)"
                ></div>
                <p
                  class="text-xs mt-2 opacity-70"
                  :class="message.role === 'user' ? 'text-right' : ''"
                >
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="isLoading" class="flex justify-start">
              <div class="bg-gray-100 dark:bg-dark-border rounded-2xl rounded-bl-none px-4 py-3">
                <div class="flex space-x-2">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input area -->
          <div class="border-t border-gray-200 dark:border-dark-border p-4">
            <div class="relative">
              <!-- Mention dropdown -->
              <div
                v-if="showMentionDropdown && filteredEmployees.length > 0"
                class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden"
              >
                <div
                  v-for="emp in filteredEmployees"
                  :key="emp.id"
                  @click="selectMention(emp)"
                  class="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-border cursor-pointer"
                >
                  <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-2">
                    <span class="text-primary-600 text-sm">{{ emp.name.charAt(0) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ emp.name }}</p>
                    <p class="text-xs text-gray-500">{{ emp.team?.name }}</p>
                  </div>
                </div>
              </div>

              <div class="flex space-x-2">
                <input
                  v-model="inputMessage"
                  @input="handleInput"
                  @keydown.enter="sendMessage()"
                  type="text"
                  placeholder="メッセージを入力... (@で社員をメンション)"
                  class="flex-1 input"
                  :disabled="isLoading"
                />
                <button
                  @click="sendMessage()"
                  :disabled="isLoading || !inputMessage.trim()"
                  class="btn-primary px-4"
                >
                  <span class="material-icons">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar - Templates -->
        <div class="w-72 shrink-0 hidden lg:block">
          <div class="card h-full">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-4">テンプレート</h3>
            <div class="space-y-2">
              <button
                v-for="template in templateQuestions"
                :key="template.label"
                @click="useTemplate(template.question)"
                class="w-full flex items-start p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
              >
                <span class="material-icons text-primary-600 mr-3 mt-0.5">{{ template.icon }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ template.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{{ template.question }}</p>
                </div>
              </button>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">💡 ヒント</h4>
              <ul class="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <li>• @名前 で社員をメンション</li>
                <li>• 複数名のメンションも可能</li>
                <li>• チーム名で質問もOK</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
