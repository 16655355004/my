<script setup lang="ts">
import { onMounted, ref } from "vue";
import { statisticsService, type Statistics } from "../services/statisticsService";

const statistics = ref<Statistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fallback: Statistics = {
  totalVisitors: 12880,
  todayVisitors: 86,
  responseTime: 120,
  uptime: {
    days: 128,
    hours: 0,
    minutes: 0,
    formatted: "128 days",
  },
  lastUpdated: new Date().toISOString(),
};

const fetchStatistics = async () => {
  loading.value = true;
  error.value = null;
  try {
    const timeout = new Promise((_, reject) => window.setTimeout(() => reject(new Error("请求超时")), 3200));
    const result = (await Promise.race([statisticsService.getStatistics(), timeout])) as {
      success: boolean;
      data?: Statistics;
      error?: string;
    };
    if (result.success && result.data) {
      statistics.value = result.data;
    } else {
      statistics.value = fallback;
      error.value = "站点状态暂时未同步。";
    }
  } catch {
    statistics.value = fallback;
    error.value = "站点状态暂时未同步。";
  } finally {
    loading.value = false;
  }
};

const formatNumber = (value: number) =>
  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M`
  : value >= 1000 ? `${(value / 1000).toFixed(1)}K`
  : value.toString();

onMounted(async () => {
  try {
    await statisticsService.recordVisit();
  } catch {
    // Visitor tracking should not block the page.
  }
  await fetchStatistics();
});
</script>

<template>
  <div class="stats-panel panel">
    <div class="stats-head">
      <span class="section-kicker">Site Status</span>
      <button class="btn btn-ghost" @click="fetchStatistics" :disabled="loading">
        {{ loading ? "刷新中" : "刷新" }}
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>正在读取站点状态</p>
    </div>

    <div v-else-if="statistics" class="stat-grid">
      <div class="stat-item">
        <strong>{{ formatNumber(statistics.totalVisitors) }}</strong>
        <span>总访问</span>
      </div>
      <div class="stat-item">
        <strong>{{ formatNumber(statistics.todayVisitors) }}</strong>
        <span>今日访问</span>
      </div>
      <div class="stat-item">
        <strong>{{ statistics.responseTime }}ms</strong>
        <span>响应</span>
      </div>
      <div class="stat-item">
        <strong>{{ statistics.uptime.days }}天</strong>
        <span>运行</span>
      </div>
    </div>

    <p v-if="error" class="stat-note">{{ error }}</p>
  </div>
</template>

<style scoped>
.stats-panel {
  padding: 24px;
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.stats-head .btn {
  min-height: 36px;
  padding-inline: 14px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--line);
}

.stat-item {
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 18px;
  background: rgba(8, 10, 15, 0.58);
}

strong {
  color: var(--text);
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  line-height: 1;
  font-weight: 800;
}

span {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

.stat-note {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.82rem;
}

@media (max-width: 740px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
