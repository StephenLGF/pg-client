import { ref, watch } from 'vue'

const STORAGE_KEY = 'pg-client-theme'
export type Theme = 'light' | 'dark' | 'auto'

const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'auto')

function isDarkMode(t: Theme): boolean {
  if (t === 'dark') return true
  if (t === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(t: Theme) {
  const dark = isDarkMode(t)
  document.documentElement.classList.toggle('dark', dark)
}

watch(theme, (t) => {
  localStorage.setItem(STORAGE_KEY, t)
  applyTheme(t)
}, { immediate: true })

// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', () => {
  if (theme.value === 'auto') {
    applyTheme('auto')
  }
})

export function useTheme() {
  return { theme }
}
