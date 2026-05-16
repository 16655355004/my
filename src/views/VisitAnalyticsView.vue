<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import type { ECharts } from "echarts";
import { statisticsService } from "../services/statisticsService";
import siteReportService, { type DailySiteReport, type DailySiteReportSummary } from "../services/siteReportService";
import { visitAnalyticsService, type AccessAnalytics } from "../services/visitAnalyticsService";

const analytics = ref<AccessAnalytics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const mapEl = ref<HTMLDivElement | null>(null);
const mapMode = ref<"scatter" | "heatmap">("scatter");
const reportPassword = ref("");
const reportAuthenticated = ref(false);
const reportLoading = ref(false);
const reportError = ref<string | null>(null);
const reportSummaries = ref<DailySiteReportSummary[]>([]);
const selectedReport = ref<DailySiteReport | null>(null);
let chart: ECharts | null = null;

const topCountries = computed(() => analytics.value?.countries.slice(0, 8) ?? []);
const recentLogs = computed(() => analytics.value?.recent ?? []);
const topPaths = computed(() => analytics.value?.topPaths ?? []);
const hourly = computed(() => analytics.value?.hourly ?? []);
const today = computed(() => new Date().toISOString().split("T")[0]);

const formatTime = (value: string) => new Date(value).toLocaleString();
const formatLocation = (log: { country?: string; region?: string; city?: string }) =>
  [log.country, log.region, log.city].filter(Boolean).join(" / ") || "-";
const maxHourly = computed(() => Math.max(1, ...hourly.value.map((item) => item.value)));

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
    visualMap: mapMode.value === "heatmap" ? {
      min: 0,
      max: Math.max(1, ...analytics.value.chinaHeatmap.map((item) => item[2])),
      calculable: true,
      right: 10,
      bottom: 10,
      textStyle: { color: "#f7efe2" },
      inRange: { color: ["rgba(83,198,176,0.18)", "#f0b35b", "#ef6f6c"] },
    } : undefined,
    series: [
      mapMode.value === "heatmap"
        ? {
            name: "访问热力",
            type: "heatmap",
            coordinateSystem: "geo",
            data: analytics.value.chinaHeatmap,
            pointSize: 16,
            blurSize: 18,
          }
        : {
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

const switchMapMode = async (mode: "scatter" | "heatmap") => {
  mapMode.value = mode;
  await nextTick();
  await renderMap();
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

const authenticateReports = async () => {
  if (!reportPassword.value.trim()) return;
  reportLoading.value = true;
  reportError.value = null;
  const result = await siteReportService.verifyAdminPassword(reportPassword.value.trim());
  if (result.success && result.data) {
    reportAuthenticated.value = true;
    reportSummaries.value = result.data.reports;
    await loadReport(reportSummaries.value[0]?.date || today.value);
  } else {
    reportError.value = result.error || "日报密码验证失败";
  }
  reportLoading.value = false;
};

const loadReportSummaries = async () => {
  const result = await siteReportService.getReportSummaries(14);
  if (result.success && result.data) reportSummaries.value = result.data.reports;
  else reportError.value = result.error || "日报列表加载失败";
};

const loadReport = async (date: string) => {
  if (!date) return;
  reportLoading.value = true;
  reportError.value = null;
  const result = await siteReportService.getDailyReport(date);
  if (result.success && result.data) selectedReport.value = result.data;
  else reportError.value = result.error || "日报加载失败";
  reportLoading.value = false;
};

const regenerateReport = async () => {
  if (!selectedReport.value) return;
  reportLoading.value = true;
  const result = await siteReportService.regenerateDailyReport(selectedReport.value.date);
  if (result.success && result.data) {
    selectedReport.value = result.data;
    await loadReportSummaries();
  } else {
    reportError.value = result.error || "日报刷新失败";
  }
  reportLoading.value = false;
};

const resize = () => chart?.resize();

onMounted(() => {
  window.addEventListener("resize", resize);
  statisticsService.recordVisit().catch(() => {
    // Visit tracking should not block the analytics page.
  });
  const token = siteReportService.getAdminToken();
  if (token) {
    reportPassword.value = token;
    reportAuthenticated.value = true;
    loadReportSummaries().then(() => loadReport(reportSummaries.value[0]?.date || today.value));
  }
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
          <article class="metric-card panel">
            <span>热门路径</span>
            <strong>{{ topPaths.length }}</strong>
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
            <div class="segmented">
              <button :class="{ active: mapMode === 'scatter' }" @click="switchMapMode('scatter')">散点</button>
              <button :class="{ active: mapMode === 'heatmap' }" @click="switchMapMode('heatmap')">热力</button>
            </div>
          </div>
          <div ref="mapEl" class="map-box">
            <span v-if="!analytics.chinaCities.length">暂无中国城市访问点</span>
          </div>
        </section>

        <section class="insight-grid">
          <div class="panel analytics-panel mini-panel">
            <div class="panel-head compact">
              <div>
                <span class="section-kicker">Paths</span>
                <h2>热门路径</h2>
              </div>
            </div>
            <div class="rank-list">
              <p v-for="item in topPaths" :key="item.name"><span>{{ item.name }}</span><strong>{{ item.value }}</strong></p>
              <p v-if="!topPaths.length"><span>暂无数据</span><strong>0</strong></p>
            </div>
          </div>

          <div class="panel analytics-panel mini-panel">
            <div class="panel-head compact">
              <div>
                <span class="section-kicker">Hourly</span>
                <h2>24 小时分布</h2>
              </div>
            </div>
            <div class="hour-bars">
              <span v-for="item in hourly" :key="item.hour" :style="{ height: `${Math.max(8, item.value / maxHourly * 100)}%` }" :title="`${item.hour}:00 · ${item.value}`"></span>
            </div>
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

        <section class="panel analytics-panel reports-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Daily Report</span>
              <h2>每日站点日报</h2>
            </div>
            <button v-if="reportAuthenticated && selectedReport" class="btn btn-ghost" :disabled="reportLoading" @click="regenerateReport">
              {{ reportLoading ? "刷新中" : "重生成" }}
            </button>
          </div>

          <form v-if="!reportAuthenticated" class="report-login" @submit.prevent="authenticateReports">
            <input v-model="reportPassword" type="password" placeholder="管理员密码" />
            <button class="btn" :disabled="reportLoading || !reportPassword.trim()">{{ reportLoading ? "验证中" : "查看日报" }}</button>
          </form>

          <template v-else>
            <div class="report-days">
              <button
                v-for="report in reportSummaries"
                :key="report.date"
                :class="['chip', { active: selectedReport?.date === report.date }]"
                @click="loadReport(report.date)"
              >
                {{ report.date }} · {{ report.visits }}
              </button>
            </div>

            <div v-if="selectedReport" class="report-detail">
              <div class="report-metrics">
                <article><span>访客</span><strong>{{ selectedReport.visitors }}</strong></article>
                <article><span>访问</span><strong>{{ selectedReport.visits }}</strong></article>
                <article><span>短链点击</span><strong>{{ selectedReport.shortlinks.totalClicks }}</strong></article>
                <article><span>响应</span><strong>{{ selectedReport.responseTime }}ms</strong></article>
              </div>
              <div class="report-lists">
                <div>
                  <h3>热门路径</h3>
                  <p v-for="item in selectedReport.topPaths" :key="item.name"><span>{{ item.name }}</span><strong>{{ item.value }}</strong></p>
                  <p v-if="!selectedReport.topPaths.length"><span>暂无数据</span><strong>0</strong></p>
                </div>
                <div>
                  <h3>国家</h3>
                  <p v-for="item in selectedReport.countries" :key="item.name"><span>{{ item.name }}</span><strong>{{ item.value }}</strong></p>
                  <p v-if="!selectedReport.countries.length"><span>暂无数据</span><strong>0</strong></p>
                </div>
                <div>
                  <h3>短链</h3>
                  <p v-for="item in selectedReport.shortlinks.topLinks" :key="item.code"><span>{{ item.name }}</span><strong>{{ item.value }}</strong></p>
                  <p v-if="!selectedReport.shortlinks.topLinks.length"><span>暂无数据</span><strong>0</strong></p>
                </div>
              </div>
              <p class="report-foot">图片 {{ selectedReport.images.total }} 张，今日上传 {{ selectedReport.images.uploadedToday }} 张；留言 {{ selectedReport.messages.total }} 条，今日 {{ selectedReport.messages.createdToday }} 条。</p>
            </div>
          </template>

          <p v-if="reportError" class="soft-alert">{{ reportError }}</p>
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.panel-head.compact {
  align-items: start;
  margin-bottom: 12px;
}

.segmented {
  display: flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
}

.segmented button,
.report-days .chip {
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
}

.segmented button.active,
.report-days .chip.active {
  background: var(--accent);
  color: var(--ink);
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

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mini-panel {
  min-height: 260px;
}

.rank-list,
.report-lists > div {
  display: grid;
  gap: 10px;
}

.rank-list p,
.report-lists p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.rank-list span,
.report-lists span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-list strong,
.report-lists strong {
  color: var(--text);
}

.hour-bars {
  height: 164px;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  align-items: end;
  gap: 4px;
  padding-top: 18px;
}

.hour-bars span {
  min-height: 8px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, var(--accent), rgba(83, 198, 176, 0.42));
}

.report-login {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.report-days {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.report-detail {
  display: grid;
  gap: 16px;
}

.report-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.report-metrics article {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.045);
}

.report-metrics span,
.report-foot {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

.report-metrics strong {
  color: var(--accent-2);
  font-size: 1.6rem;
}

.report-lists {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.report-lists h3 {
  color: var(--text);
}

.soft-alert {
  margin-top: 12px;
  color: var(--accent-3);
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
  .metric-grid,
  .insight-grid,
  .report-metrics,
  .report-lists,
  .report-login {
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
