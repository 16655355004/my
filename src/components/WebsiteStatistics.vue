<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { statisticsService, type Statistics } from "../services/statisticsService";

const statistics = ref<Statistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const updateInterval = ref<number | null>(null);

const fetchStatistics = async () => {
  loading.value = true;
  error.value = null;
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("请求超时")), 3000));
    const res = (await Promise.race([statisticsService.getStatistics(), timeout])) as any;
    if (res.success && res.data) statistics.value = res.data;
    else error.value = res.error ?? "获取统计失败";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "网络错误";
  } finally {
    loading.value = false;
  }
};

const formatNumber = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
  : n >= 1000   ? (n / 1000).toFixed(1) + "K"
  : n.toString();

onMounted(async () => {
  try { await statisticsService.recordVisit(); } catch {}
  await fetchStatistics();
});

onUnmounted(() => {
  if (updateInterval.value) clearInterval(updateInterval.value);
});
</script>

<template>
  <div class="stat-widget">
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>加载中…</p>
    </div>

    <div v-else-if="error" class="state-box">
      <p>{{ error }}</p>
      <button class="btn btn-ghost" @click="fetchStatistics">重试</button>
    </div>

    <div v-else-if="statistics" class="stat-row">
      <div class="stat-item">
        <span class="stat-val">{{ formatNumber(statistics.totalVisitors) }}</span>
        <span class="stat-key">总访问量</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-val">{{ formatNumber(statistics.todayVisitors) }}</span>
        <span class="stat-key">今日访问</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-val">{{ statistics.responseTime }}<sup>ms</sup></span>
        <span class="stat-key">响应时间</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-val">{{ statistics.uptime.days }}<sup>天</sup></span>
        <span class="stat-key">运行时长</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-widget { padding: 1rem 0; }

.stat-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border);
}

.stat-item {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-divider {
  width: 1px;
  background: var(--border);
  flex-shrink: 0;
}

.stat-val {
  font-size: 1.8rem;
  font-weight: 300;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-val sup {
  font-size: 0.6em;
  color: var(--text-dim);
  vertical-align: super;
  margin-left: 1px;
}

.stat-key {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* 状态 */
.state-box {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.spinner {
  width: 20px; height: 20px;
  border: 1px solid var(--border-hover);
  border-top-color: var(--text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .stat-row { flex-direction: column; }
  .stat-divider { width: 100%; height: 1px; }
}
</style>
