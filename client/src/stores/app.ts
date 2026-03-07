import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const darkMode = ref(false)
  const pageTitle = ref('ダッシュボード')
  const breadcrumbs = ref<Array<{ label: string; to?: string }>>([])

  // Initialize dark mode from localStorage or system preference
  function initializeDarkMode() {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      darkMode.value = stored === 'true'
    } else {
      darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyDarkMode()
  }

  function applyDarkMode() {
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', String(darkMode.value))
    applyDarkMode()
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setPageTitle(title: string) {
    pageTitle.value = title
    document.title = `${title} | タレントマネジメントシステム`
  }

  function setBreadcrumbs(items: Array<{ label: string; to?: string }>) {
    breadcrumbs.value = items
  }

  // Watch for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (localStorage.getItem('darkMode') === null) {
        darkMode.value = e.matches
        applyDarkMode()
      }
    })
  }

  // Initialize on creation
  initializeDarkMode()

  return {
    sidebarOpen,
    darkMode,
    pageTitle,
    breadcrumbs,
    toggleDarkMode,
    toggleSidebar,
    setPageTitle,
    setBreadcrumbs,
    initializeDarkMode,
  }
})
