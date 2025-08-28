<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { statisticsService, type Statistics } from "../services/statisticsService";

// 响应式数据
const statistics = ref<Statistics | null>(null);
const loading = ref(false); // 改为false，不自动加载
const error = ref<string | null>(null);
const updateInterval = ref<number | null>(null);
const isVisible = ref(false); // 控制统计数据是否显示
const hasLoaded = ref(false); // 标记是否已经加载过数据

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 设置加载超时，避免无限加载
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("请求超时")), 3000); // 3秒超时
    });

    const response = (await Promise.race([
      statisticsService.getStatistics(),
      timeoutPromise,
    ])) as any;

    if (response.success && response.data) {
      statistics.value = response.data;
      error.value = null;
      hasLoaded.value = true;
      // 调试信息：记录响应时间更新
      console.log(
        `Response time updated: ${
          response.data.responseTime
        }ms at ${new Date().toLocaleTimeString()}`
      );
    } else {
      error.value = response.error || "获取统计数据失败";
      console.log("Statistics API failed");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "网络错误";
    console.error("Failed to fetch statistics:", err);
  } finally {
    loading.value = false;
  }
};

// 记录访问
const recordVisit = async () => {
  try {
    await statisticsService.recordVisit();
  } catch (err) {
    console.error("Failed to record visit:", err);
  }
};

// 启动实时更新
const startRealTimeUpdates = () => {
  // 每30秒更新一次统计数据
  updateInterval.value = window.setInterval(fetchStatistics, 30000);
};

// 停止实时更新
const stopRealTimeUpdates = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
};

// 手动加载统计数据
const loadStatistics = async () => {
  if (!isVisible.value) {
    isVisible.value = true;
    if (!hasLoaded.value) {
      await fetchStatistics();
      // 只有在成功加载后才启动实时更新
      if (statistics.value && !error.value) {
        startRealTimeUpdates();
      }
    }
  } else {
    // 如果已经显示，则隐藏
    isVisible.value = false;
    stopRealTimeUpdates();
  }
};

// 组件挂载时的操作
onMounted(async () => {
  // 只记录访问，不自动加载统计数据
  await recordVisit();
});

// 组件卸载时清理
onUnmounted(() => {
  stopRealTimeUpdates();
});

// 格式化数字显示
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// 获取响应时间状态
const getResponseTimeStatus = (time: number): string => {
  if (time < 100) return "excellent";
  if (time < 300) return "good";
  if (time < 500) return "fair";
  return "poor";
};

// 重置响应时间数据（调试用）
const resetResponseTime = async () => {
  try {
    const result = await statisticsService.resetResponseTimeData();
    if (result.success) {
      console.log("Response time data reset successfully");
      // 重新获取统计数据
      await fetchStatistics();
    } else {
      console.error("Failed to reset response time data:", result.error);
    }
  } catch (error) {
    console.error("Error resetting response time data:", error);
  }
};
</script>

<template>
  <div class="website-statistics">
    <div class="container">
      <!-- 统计数据触发按钮 -->
      <div class="stats-trigger">
        <button @click="loadStatistics" class="stats-toggle-btn" :class="{ active: isVisible }">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 19C9 20.1046 9.89543 21 11 21H13C14.1046 21 15 20.1046 15 19V5C15 3.89543 14.1046 3 13 3H11C9.89543 3 9 3.89543 9 5V19Z"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M3 13C3 14.1046 3.89543 15 5 15H7C8.10457 15 9 14.1046 9 13V11C9 9.89543 8.10457 9 7 9H5C3.89543 9 3 9.89543 3 11V13Z"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M15 17C15 18.1046 15.8954 19 17 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H17C15.8954 5 15 5.89543 15 7V17Z"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span>{{ isVisible ? "隐藏统计" : "查看网站统计" }}</span>
          <svg
            class="chevron-icon"
            :class="{ rotated: isVisible }"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <!-- 统计数据内容区域 -->
      <div v-if="isVisible" class="stats-content">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载统计数据中...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <p>{{ error }}</p>
          <button @click="fetchStatistics" class="retry-btn">重试</button>
        </div>

        <div v-else-if="statistics" class="stats-grid">
          <!-- 总访问量 -->
          <div class="stat-card total-visitors">
            <div class="stat-icon-wrapper">
              <svg
                class="stat-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(statistics.totalVisitors) }}</div>
              <div class="stat-label">总访问量</div>
            </div>
          </div>

          <!-- 今日访问量 -->
          <div class="stat-card today-visitors">
            <div class="stat-icon-wrapper">
              <svg
                class="stat-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(statistics.todayVisitors) }}</div>
              <div class="stat-label">今日访问</div>
            </div>
          </div>

          <!-- 响应时间 -->
          <div
            class="stat-card response-time"
            :class="getResponseTimeStatus(statistics.responseTime)"
          >
            <div class="stat-icon-wrapper">
              <svg
                class="stat-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">
                {{ statistics.responseTime }}<span class="unit">ms</span>
              </div>
              <div class="stat-label">响应时间</div>
            </div>
            <div class="stat-status">
              <div class="status-indicator"></div>
            </div>
          </div>

          <!-- 运行时间 -->
          <div class="stat-card uptime">
            <div class="stat-icon-wrapper">
              <svg
                class="stat-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 16.5C3 15 3 12.5 3 12S3 9 4.5 7.5C6 6 8.5 6 12 6S18 6 19.5 7.5C21 9 21 12.5 21 12S21 15 19.5 16.5C18 18 15.5 18 12 18S6 18 4.5 16.5Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 8V12L15 15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">
                {{ statistics.uptime.days }}<span class="unit">天</span>
              </div>
              <div class="stat-label">运行时间</div>
              <div class="stat-detail">
                {{ statistics.uptime.hours }}小时 {{ statistics.uptime.minutes }}分钟
              </div>
            </div>
          </div>
        </div>
        <!-- Close stats-grid -->
      </div>
      <!-- Close stats-content -->
    </div>
  </div>
</template>

<style scoped>
.website-statistics {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

/* 统计数据触发按钮 */
.stats-trigger {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.stats-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(156, 39, 176, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: #00d4ff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.1);
}

.stats-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(156, 39, 176, 0.2));
  border-color: rgba(0, 212, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
}

.stats-toggle-btn.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(156, 39, 176, 0.2));
  border-color: rgba(0, 212, 255, 0.6);
  color: #ffffff;
}

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* 统计数据内容区域 */
.stats-content {
  animation: slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
}

/* 统计标题 */
.stats-header {
  text-align: center;
  margin-bottom: 3rem;
}

.stats-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(120deg, var(--primary-color), #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.stats-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-10px, -10px) rotate(5deg);
  }
}

.container {
  position: relative;
  z-index: 2;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 212, 255, 0.3);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: var(--primary-color-dark);
  transform: translateY(-2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  /* 入场动画 */
  animation: slideInUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  opacity: 0;
  transform: translateY(30px);
}

/* 为每个卡片设置不同的延迟 */
.stat-card:nth-child(1) {
  animation-delay: 0.1s;
}
.stat-card:nth-child(2) {
  animation-delay: 0.2s;
}
.stat-card:nth-child(3) {
  animation-delay: 0.3s;
}
.stat-card:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 212, 255, 0.15);
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--purple-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(156, 39, 176, 0.2));
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(156, 39, 176, 0.3));
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: #00d4ff;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  color: #ffffff;
}

/* 不同卡片的主题色 */
.total-visitors .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 150, 255, 0.2));
}

.total-visitors:hover .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 150, 255, 0.3));
}

.today-visitors .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2));
}

.today-visitors:hover .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.3));
}

.today-visitors .stat-icon {
  color: #ffc107;
}

.response-time .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2));
}

.response-time:hover .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.3));
}

.response-time .stat-icon {
  color: #4caf50;
}

.uptime .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(233, 30, 99, 0.2));
}

.uptime:hover .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(233, 30, 99, 0.3));
}

.uptime .stat-icon {
  color: #9c27b0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #00d4ff;
  line-height: 1;
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #00d4ff, #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card:hover .stat-number {
  transform: scale(1.05);
}

.stat-number .unit {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.stat-detail {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.stat-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--success-color);
  animation: pulse 2s infinite;
}

.response-time.excellent .status-indicator {
  background: #00ff88;
}

.response-time.good .status-indicator {
  background: #ffeb3b;
}

.response-time.fair .status-indicator {
  background: #ff9800;
}

.response-time.poor .status-indicator {
  background: #f44336;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .website-statistics {
    padding: 1rem;
  }

  .stats-trigger {
    margin-bottom: 1.5rem;
  }

  .stats-toggle-btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }

  .btn-icon {
    width: 18px;
    height: 18px;
  }

  .stats-header {
    margin-bottom: 2rem;
  }

  .stats-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .stat-number {
    font-size: 1.25rem;
  }

  .stat-icon {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .stats-toggle-btn {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    gap: 0.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
    flex-direction: row;
    text-align: left;
  }
}
</style>
