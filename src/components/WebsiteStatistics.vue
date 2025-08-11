<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { statisticsService, type Statistics } from "../services/statisticsService";

// 响应式数据
const statistics = ref<Statistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const updateInterval = ref<number | null>(null);

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await statisticsService.getStatistics();
    if (response.success && response.data) {
      statistics.value = response.data;
      error.value = null;
    } else {
      error.value = response.error || "获取统计数据失败";
      // 如果是网络错误，显示默认数据
      if (!statistics.value) {
        statistics.value = {
          totalVisitors: 0,
          todayVisitors: 0,
          responseTime: 0,
          uptime: {
            days: 0,
            hours: 0,
            minutes: 0,
            formatted: "0天 0小时 0分钟",
          },
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    error.value = "网络错误";
    console.error("Failed to fetch statistics:", err);
    // 显示默认数据
    if (!statistics.value) {
      statistics.value = {
        totalVisitors: 0,
        todayVisitors: 0,
        responseTime: 0,
        uptime: {
          days: 0,
          hours: 0,
          minutes: 0,
          formatted: "0天 0小时 0分钟",
        },
        lastUpdated: new Date().toISOString(),
      };
    }
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

// 组件挂载时的操作
onMounted(async () => {
  // 记录访问
  await recordVisit();

  // 获取初始统计数据
  await fetchStatistics();

  // 启动实时更新
  startRealTimeUpdates();

  // 添加入场动画
  gsap.from(".stat-card", {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.6,
    ease: "back.out(1.7)",
    delay: 0.2,
  });
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
</script>

<template>
  <div class="website-statistics">
    <div class="container">
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
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(statistics.totalVisitors) }}</div>
            <div class="stat-label">总访问量</div>
          </div>
        </div>

        <!-- 今日访问量 -->
        <div class="stat-card today-visitors">
          <div class="stat-icon">🌟</div>
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
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.responseTime }}<span class="unit">ms</span></div>
            <div class="stat-label">响应时间</div>
          </div>
          <div class="stat-status">
            <div class="status-indicator"></div>
          </div>
        </div>

        <!-- 运行时间 -->
        <div class="stat-card uptime">
          <div class="stat-icon">🚀</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.uptime.days }}<span class="unit">天</span></div>
            <div class="stat-label">运行时间</div>
            <div class="stat-detail">
              {{ statistics.uptime.hours }}小时 {{ statistics.uptime.minutes }}分钟
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.website-statistics {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  max-width: 400px;
  width: 100%;
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
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--purple-accent));
}

.stat-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  color: #00d4ff;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00d4ff;
  line-height: 1;
  margin-bottom: 0.25rem;
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
    max-width: 100%;
    margin: 0 auto;
  }

  .stats-grid {
    gap: 0.75rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-number {
    font-size: 1.25rem;
  }

  .stat-icon {
    font-size: 1.25rem;
  }
}
</style>
