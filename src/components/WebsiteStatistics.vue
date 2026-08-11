<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
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
    gsap.from(".note-row, .note-foot", {
      opacity: 0,
      y: 14,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.08,
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
      error.value = "数字暂时没同步上，先记个大概。";
    }
  } catch {
    statistics.value = fallback;
    error.value = "数字暂时没同步上，先记个大概。";
  } finally {
    loading.value = false;
    await animatePanel();
  }
};

const formatNumber = (value: number) =>
  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M`
  : value >= 1000 ? `${(value / 1000).toFixed(1)}K`
  : value.toString();

const rows = computed(() => {
  if (!statistics.value) return [];
  return [
    { label: "累计到访", value: `${formatNumber(statistics.value.totalVisitors)} 次` },
    { label: "今日到访", value: `${formatNumber(statistics.value.todayVisitors)} 次` },
    { label: "应答用时", value: `${statistics.value.responseTime} ms` },
    { label: "亮灯天数", value: `${statistics.value.uptime.days} 天` },
  ];
});

onMounted(fetchStatistics);

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <div ref="panelRef" class="stats-note panel">
    <div class="note-head">
      <h3>随手记</h3>
      <button class="btn btn-ghost" @click="fetchStatistics" :disabled="loading">
        {{ loading ? "翻页中" : "再记一笔" }}
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>正在翻开这一页</p>
    </div>

    <dl v-else class="note-list">
      <div v-for="row in rows" :key="row.label" class="note-row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>

    <p v-if="error" class="note-foot warning">{{ error }}</p>
    <p v-else class="note-foot">—— 记于 {{ new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }}</p>
  </div>
</template>

<style scoped>
.stats-note {
  max-width: 640px;
  padding: 28px 30px;
}

.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.note-head h3 {
  color: var(--text);
  font-size: 1.3rem;
  font-weight: 900;
}

.note-head .btn {
  min-height: 36px;
  padding-inline: 14px;
  font-size: 0.86rem;
}

.note-list {
  display: grid;
}

.note-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 13px 0;
}

.note-row + .note-row {
  border-top: 1px dashed var(--line);
}

.note-row dt {
  flex: none;
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* 手帐引导点线 */
.note-row::before {
  content: "";
  order: 2;
  flex: 1;
  border-bottom: 2px dotted rgba(242, 236, 223, 0.22);
  transform: translateY(-4px);
}

.note-row dt {
  order: 1;
}

.note-row dd {
  order: 3;
  color: var(--text);
  font-size: clamp(1.2rem, 2.4vw, 1.6rem);
  font-weight: 900;
}

.note-foot {
  margin-top: 16px;
  color: var(--text-soft);
  font-size: 0.84rem;
  text-align: right;
}

.note-foot.warning {
  color: var(--accent);
  text-align: left;
}
</style>
