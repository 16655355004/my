<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import { statisticsService, type Statistics } from "../services/statisticsService";

const panelRef = ref<HTMLElement | null>(null);
const statistics = ref<Statistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
let gsapContext: gsap.Context | null = null;

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

const animatePanel = async () => {
  await nextTick();
  if (!panelRef.value) return;

  gsapContext?.revert();
  gsapContext = gsap.context(() => {
    gsap.from(".stats-head, .stat-item, .stat-note", {
      opacity: 0,
      y: 18,
      duration: 0.56,
      ease: "power2.out",
      stagger: 0.06,
    });
  }, panelRef.value);
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
    await animatePanel();
  }
};

const formatNumber = (value: number) =>
  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M`
  : value >= 1000 ? `${(value / 1000).toFixed(1)}K`
  : value.toString();

onMounted(fetchStatistics);

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <div ref="panelRef" class="stats-panel panel">
    <div class="stats-head">
      <div>
        <span class="section-kicker">Signal</span>
        <h2>站点实时状态</h2>
      </div>
      <button class="btn btn-ghost" @click="fetchStatistics" :disabled="loading">
        {{ loading ? "更新中" : "刷新" }}
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>正在读取站点状态</p>
    </div>

    <div v-else-if="statistics" class="stat-grid">
      <div class="stat-item">
        <strong>{{ formatNumber(statistics.totalVisitors) }}</strong>
        <span>累计访问</span>
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

    <p v-if="error" class="stat-note warning">{{ error }}</p>
    <p v-else class="stat-note">访问、响应和运行时长会在这里汇总。</p>
  </div>
</template>

<style scoped>
.stats-panel {
  padding: 24px;
}

.stats-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.stats-head h2 {
  margin-top: 8px;
  color: var(--text);
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  font-weight: 850;
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
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
    rgba(8, 10, 15, 0.58);
}

strong {
  color: var(--text);
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  line-height: 1;
  font-weight: 850;
}

.stat-item span {
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

.stat-note.warning {
  color: var(--accent);
}

@media (max-width: 740px) {
  .stats-head {
    align-items: start;
    flex-direction: column;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
