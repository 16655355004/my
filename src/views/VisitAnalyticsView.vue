<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import type { ECharts } from "echarts";
import { statisticsService } from "../services/statisticsService";
import { visitAnalyticsService, type AccessAnalytics } from "../services/visitAnalyticsService";

const analytics = ref<AccessAnalytics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const mapEl = ref<HTMLDivElement | null>(null);
let chart: ECharts | null = null;

const topCountries = computed(() => analytics.value?.countries.slice(0, 8) ?? []);
const recentLogs = computed(() => analytics.value?.recent ?? []);

const formatTime = (value: string) => new Date(value).toLocaleString();
const formatLocation = (log: { country?: string; region?: string; city?: string }) =>
  [log.country, log.region, log.city].filter(Boolean).join(" / ") || "-";

const renderMap = async () => {
  if (!analytics.value || !mapEl.value) return;

  const [echarts, mapModule] = await Promise.all([
    import("echarts"),
    import("china-map-geojson"),
  ]);

  echarts.registerMap("china", mapModule.ChinaData);
  chart?.dispose();
  chart = echarts.init(mapEl.value);
  chart.setOption({
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value?: unknown }) => {
        const value = Array.isArray(params.value) ? params.value : [];
        return value.length >= 3 ? `${params.name}<br/>访问 ${value[2]} 次` : params.name;
      },
    },
    geo: {
      map: "china",
      roam: true,
      zoom: 1.12,
      itemStyle: {
        areaColor: "rgba(255, 255, 255, 0.08)",
        borderColor: "rgba(255, 255, 255, 0.22)",
      },
      emphasis: {
        itemStyle: {
          areaColor: "rgba(240, 179, 91, 0.22)",
        },
      },
    },
    series: [
      {
        name: "访问城市",
        type: "scatter",
        coordinateSystem: "geo",
        data: analytics.value.chinaCities,
        symbolSize: (value: number[]) => Math.max(8, Math.min(34, value[2] * 5)),
        itemStyle: {
          color: "#f0b35b",
        },
      },
    ],
  });
};

const loadAnalytics = async () => {
  loading.value = true;
  error.value = null;
  const result = await visitAnalyticsService.getAnalytics();
  if (result.success && result.data) {
    analytics.value = result.data;
    await nextTick();
    await renderMap();
  } else {
    error.value = result.error || "访问日志暂时不可用";
  }
  loading.value = false;
};

const resize = () => chart?.resize();

onMounted(() => {
  window.addEventListener("resize", resize);
  statisticsService.recordVisit().catch(() => {
    // Visit tracking should not block the analytics page.
  });
  loadAnalytics();
});

onUnmounted(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
});
</script>

<template>
  <main class="page-shell visits-view">
    <section class="container page-hero">
      <div>
        <span class="page-tag">Visit Analytics</span>
        <h1 class="page-title">访问记录</h1>
        <p class="page-sub">查看最近访问 IP、国家分布和中国城市访问点位。</p>
      </div>
      <button class="btn btn-ghost" :disabled="loading" @click="loadAnalytics">
        {{ loading ? "刷新中" : "刷新数据" }}
      </button>
    </section>

    <section class="container analytics-stack">
      <div v-if="loading" class="state-box panel">
        <div class="spinner"></div>
        <p>正在读取访问日志</p>
      </div>

      <div v-else-if="error" class="state-box panel">
        <p>{{ error }}</p>
      </div>

      <template v-else-if="analytics">
        <div class="metric-grid">
          <article class="metric-card panel">
            <span>总记录</span>
            <strong>{{ analytics.total }}</strong>
          </article>
          <article class="metric-card panel">
            <span>国家数量</span>
            <strong>{{ analytics.countries.length }}</strong>
          </article>
          <article class="metric-card panel">
            <span>中国城市</span>
            <strong>{{ analytics.chinaCities.length }}</strong>
          </article>
        </div>

        <section class="panel analytics-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Country</span>
              <h2>国家分布</h2>
            </div>
          </div>
          <div class="country-list">
            <span v-for="item in topCountries" :key="item.name" class="chip">
              {{ item.name }} · {{ item.value }}
            </span>
            <span v-if="!topCountries.length" class="chip">暂无数据</span>
          </div>
        </section>

        <section class="panel analytics-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">China Map</span>
              <h2>中国城市访问地图</h2>
            </div>
          </div>
          <div ref="mapEl" class="map-box">
            <span v-if="!analytics.chinaCities.length">暂无中国城市访问点</span>
          </div>
        </section>

        <section class="panel analytics-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Recent</span>
              <h2>最近访问</h2>
            </div>
          </div>
          <div class="log-table">
            <div class="log-row log-head">
              <span>时间</span>
              <span>IP</span>
              <span>地区</span>
              <span>路径</span>
              <span>状态</span>
            </div>
            <div v-for="log in recentLogs" :key="log.id" class="log-row">
              <span>{{ formatTime(log.time) }}</span>
              <span>{{ log.ip || "-" }}</span>
              <span>{{ formatLocation(log) }}</span>
              <span>{{ log.path }}</span>
              <span>{{ log.status }}</span>
            </div>
            <div v-if="!recentLogs.length" class="state-box">暂无访问记录</div>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.visits-view {
  background:
    radial-gradient(circle at 18% 14%, rgba(240, 179, 91, 0.16), transparent 34%),
    radial-gradient(circle at 85% 4%, rgba(83, 198, 176, 0.12), transparent 32%);
}

.analytics-stack {
  display: grid;
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 20px;
}

.metric-card span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

.metric-card strong {
  margin-top: 8px;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1;
}

.analytics-panel {
  padding: 22px;
}

.panel-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin-top: 8px;
  color: var(--text);
  font-size: 1.55rem;
}

.country-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.map-box {
  width: 100%;
  height: 460px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(8, 10, 15, 0.44);
}

.map-box span {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-weight: 800;
}

.log-table {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.log-row {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1.4fr 1fr 74px;
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 0.84rem;
  align-items: center;
}

.log-row:first-child {
  border-top: 0;
}

.log-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-head {
  background: rgba(255, 255, 255, 0.055);
  color: var(--text);
  font-weight: 800;
}

@media (max-width: 820px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .map-box {
    height: 340px;
  }

  .log-table {
    overflow-x: auto;
  }

  .log-row {
    min-width: 760px;
  }
}
</style>
