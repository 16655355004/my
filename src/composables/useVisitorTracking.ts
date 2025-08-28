import { ref, onMounted, onUnmounted } from 'vue'
import { statisticsService } from '../services/statisticsService'

// 访问者跟踪组合式函数
export function useVisitorTracking() {
  const isTracking = ref(false)
  const visitorId = ref<string | null>(null)
  const sessionStartTime = ref<number>(0)
  const pageViewCount = ref(0)
  const heartbeatInterval = ref<number | null>(null)
  const lastVisibilityChange = ref<number>(0)

  // 初始化访问者跟踪
  const initializeTracking = async () => {
    if (isTracking.value) return

    // 在开发环境中禁用统计跟踪
    if (import.meta.env.DEV) {
      console.log('Visitor tracking disabled in development mode')
      return
    }

    // 临时禁用统计跟踪（如果需要完全停止）
    // if (true) {
    //   console.log('Visitor tracking temporarily disabled')
    //   return
    // }

    try {
      isTracking.value = true
      sessionStartTime.value = Date.now()
      visitorId.value = statisticsService.getVisitorId()

      // 记录页面访问
      await recordPageView()

      // 启动心跳检测（每30分钟发送一次）
      startHeartbeat()

      // 监听页面可见性变化
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // 监听页面卸载
      window.addEventListener('beforeunload', handlePageUnload)

      console.log('Visitor tracking initialized:', visitorId.value)
    } catch (error) {
      console.error('Failed to initialize visitor tracking:', error)
      isTracking.value = false
    }
  }

  // 记录页面访问
  const recordPageView = async () => {
    try {
      pageViewCount.value++

      // 记录访问到后端
      const result = await statisticsService.recordVisit()

      if (result.success) {
        console.log('Page view recorded successfully')
      } else {
        console.warn('Failed to record page view:', result.error)
      }

      // 更新本地存储
      updateLocalStorage()
    } catch (error) {
      console.error('Error recording page view:', error)
    }
  }

  // 启动心跳检测
  const startHeartbeat = () => {
    // 每30分钟发送一次心跳（减少频率）
    heartbeatInterval.value = window.setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          await statisticsService.recordVisit()
          console.log('Heartbeat sent')
        } catch (error) {
          console.error('Heartbeat failed:', error)
        }
      }
    }, 30 * 60 * 1000) // 30分钟
  }

  // 停止心跳检测
  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  // 处理页面可见性变化
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now()
      // 防抖：至少间隔5分钟才记录新的访问
      if (now - lastVisibilityChange.value > 5 * 60 * 1000) {
        lastVisibilityChange.value = now
        recordPageView()
      }
    }
  }

  // 处理页面卸载
  const handlePageUnload = () => {
    // 记录会话结束时间
    const sessionDuration = Date.now() - sessionStartTime.value

    // 使用 sendBeacon 发送最后的统计数据（如果支持）
    if (navigator.sendBeacon && statisticsService.getVisitorId()) {
      const data = JSON.stringify({
        visitorId: statisticsService.getVisitorId(),
        sessionDuration,
        pageViews: pageViewCount.value,
        timestamp: new Date().toISOString()
      })

      try {
        navigator.sendBeacon(
          `${statisticsService['baseUrl']}/api/statistics/session-end`,
          data
        )
      } catch (error) {
        console.error('Failed to send beacon:', error)
      }
    }

    // 更新本地存储
    updateLocalStorage()
  }

  // 更新本地存储
  const updateLocalStorage = () => {
    try {
      const sessionData = {
        visitorId: visitorId.value,
        sessionStartTime: sessionStartTime.value,
        pageViewCount: pageViewCount.value,
        lastActivity: Date.now()
      }

      localStorage.setItem('visitor_session', JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to update localStorage:', error)
    }
  }

  // 从本地存储恢复会话数据
  const restoreSessionData = () => {
    try {
      const sessionData = localStorage.getItem('visitor_session')
      if (sessionData) {
        const data = JSON.parse(sessionData)

        // 检查会话是否过期（超过30分钟）
        const now = Date.now()
        const lastActivity = data.lastActivity || 0
        const sessionTimeout = 30 * 60 * 1000 // 30分钟

        if (now - lastActivity < sessionTimeout) {
          visitorId.value = data.visitorId
          sessionStartTime.value = data.sessionStartTime || now
          pageViewCount.value = data.pageViewCount || 0
        } else {
          // 会话过期，清除数据
          localStorage.removeItem('visitor_session')
        }
      }
    } catch (error) {
      console.error('Failed to restore session data:', error)
    }
  }

  // 获取会话统计信息
  const getSessionStats = () => {
    const now = Date.now()
    const sessionDuration = now - sessionStartTime.value

    return {
      visitorId: visitorId.value,
      sessionDuration,
      pageViewCount: pageViewCount.value,
      sessionStartTime: sessionStartTime.value,
      isFirstVisit: statisticsService.isTodayFirstVisit()
    }
  }

  // 清理跟踪
  const cleanup = () => {
    stopHeartbeat()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', handlePageUnload)
    isTracking.value = false
  }

  // 组件挂载时初始化
  onMounted(() => {
    restoreSessionData()
    initializeTracking()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    isTracking,
    visitorId,
    pageViewCount,
    sessionStartTime,
    initializeTracking,
    recordPageView,
    getSessionStats,
    cleanup
  }
}
