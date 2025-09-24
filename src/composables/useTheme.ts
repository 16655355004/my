import { ref, computed, watch, onMounted } from 'vue'
import { gsap } from 'gsap'

export type Theme = 'dark' | 'light'

export interface ThemeColors {
  '--background-color': string
  '--text-color': string
  '--text-secondary': string
  '--text-muted': string
  '--primary-color': string
  '--secondary-color': string
  '--surface-color': string
  '--card-background': string
  '--border-color': string
  '--divider-color': string
  '--accent-color': string
  '--success-color': string
  '--purple-accent': string
  '--blue-accent': string
  '--shadow-color': string
  '--warning-color': string
  '--error-color': string
  '--info-color': string
}

const themes: Record<Theme, ThemeColors> = {
  dark: {
    '--background-color': '#0a0a0f',
    '--text-color': '#e8e8f0',
    '--text-secondary': '#b8b8c8',
    '--text-muted': '#888899',
    '--primary-color': '#00d4ff',
    '--secondary-color': '#1a1a2e',
    '--surface-color': '#1a1a2e',
    '--card-background': 'rgba(26, 26, 46, 0.8)',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--divider-color': 'rgba(255, 255, 255, 0.05)',
    '--accent-color': '#ff3366',
    '--success-color': '#00ff88',
    '--purple-accent': '#8b5cf6',
    '--blue-accent': '#3b82f6',
    '--shadow-color': 'rgba(0, 212, 255, 0.2)',
    '--warning-color': '#ffc107',
    '--error-color': '#dc3545',
    '--info-color': '#17a2b8'
  },
  light: {
    '--background-color': 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.08) 0%, transparent 50%), linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #f1f5f9 60%, #e2e8f0 100%)',
    '--text-color': '#1e293b',
    '--text-secondary': '#475569',
    '--text-muted': '#64748b',
    '--primary-color': '#3b82f6',
    '--secondary-color': '#f1f5f9',
    '--surface-color': '#ffffff',
    '--card-background': 'rgba(255, 255, 255, 0.8)',
    '--border-color': 'rgba(59, 130, 246, 0.12)',
    '--divider-color': 'rgba(59, 130, 246, 0.08)',
    '--accent-color': '#6366f1',
    '--success-color': '#10b981',
    '--purple-accent': '#8b5cf6',
    '--blue-accent': '#3b82f6',
    '--shadow-color': 'rgba(59, 130, 246, 0.08)',
    '--warning-color': '#f59e0b',
    '--error-color': '#ef4444',
    '--info-color': '#06b6d4'
  }
}

// 响应式主题状态
const currentTheme = ref<Theme>('dark')
const isTransitioning = ref(false)

// 背景图片预加载缓存
const imageCache = new Map<string, HTMLImageElement>()
const backgroundImages = {
  dark: {
    hero: '/src/assets/1.png',
    features: '/src/assets/3.png',
    skills: '/src/assets/4.png'
  },
  light: {
    hero: '/src/assets/66.png',
    features: '/src/assets/88.png',
    skills: '/src/assets/99.png'
  }
}

// 预加载背景图片
const preloadImages = () => {
  Object.values(backgroundImages).forEach(themeImages => {
    Object.values(themeImages).forEach(imagePath => {
      if (!imageCache.has(imagePath)) {
        const img = new Image()
        img.src = imagePath
        imageCache.set(imagePath, img)
      }
    })
  })
}

// 从本地存储读取主题设置
const savedTheme = localStorage.getItem('theme') as Theme
if (savedTheme && themes[savedTheme]) {
  currentTheme.value = savedTheme
}

// 创建主题切换遮罩
const createThemeOverlay = () => {
  let overlay = document.getElementById('theme-transition-overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'theme-transition-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at center, rgba(0, 212, 255, 0.1), rgba(139, 92, 246, 0.1));
      backdrop-filter: blur(20px);
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.8);
    `
    document.body.appendChild(overlay)
  }
  return overlay
}

// GSAP主题切换动画
const animateThemeTransition = (theme: Theme) => {
  if (isTransitioning.value) return
  isTransitioning.value = true
  
  const overlay = createThemeOverlay()
  const tl = gsap.timeline({
    onComplete: () => {
      isTransitioning.value = false
      overlay.remove()
    }
  })
  
  // 阶段1: 遮罩进入动画
  tl.to(overlay, {
    opacity: 1,
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  })
  
  // 阶段2: 主题切换（在遮罩完全显示时）
  tl.call(() => {
    applyThemeInstantly(theme)
  })
  
  // 阶段3: 遮罩退出动画
  tl.to(overlay, {
    opacity: 0,
    scale: 1.2,
    duration: 0.4,
    ease: 'power2.in'
  }, '+=0.1')
  
  return tl
}

// 立即应用主题（无动画）
const applyThemeInstantly = (theme: Theme) => {
  const root = document.documentElement
  const themeColors = themes[theme]
  
  // 批量更新CSS变量
  Object.entries(themeColors).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
  
  // 设置主题数据属性
  document.body.setAttribute('data-theme', theme)
}

// 应用主题到DOM（带动画）
const applyTheme = (theme: Theme) => {
  return animateThemeTransition(theme)
}

// 初始化主题（无动画）
applyThemeInstantly(currentTheme.value)
// 预加载图片
preloadImages()

export function useTheme() {
  // 防抖切换主题
  let toggleTimeout: NodeJS.Timeout | null = null
  const toggleTheme = () => {
    if (isTransitioning.value) return
    
    if (toggleTimeout) {
      clearTimeout(toggleTimeout)
    }
    
    toggleTimeout = setTimeout(() => {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      toggleTimeout = null
    }, 100)
  }

  // 设置特定主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }

  // 计算属性
  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')
  const themeIcon = computed(() => isDark.value ? '🌙' : '☀️')
  const themeLabel = computed(() => isDark.value ? '深色模式' : '浅色模式')

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    if (!isTransitioning.value) {
      applyTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }, { immediate: false })

  return {
    currentTheme: computed(() => currentTheme.value),
    isDark,
    isLight,
    themeIcon,
    themeLabel,
    toggleTheme,
    setTheme,
    themes,
    isTransitioning: computed(() => isTransitioning.value),
    preloadImages
  }
}
