<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import siteReportService, { type DailySiteReport, type DailySiteReportSummary } from "../services/siteReportService";
import { visitAnalyticsService, type AccessAnalytics } from "../services/visitAnalyticsService";

const analytics = ref<AccessAnalytics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const mapMode = ref<"scatter" | "heatmap">("scatter");
const reportPassword = ref("");
const reportAuthenticated = ref(false);
const reportLoading = ref(false);
const reportError = ref<string | null>(null);
const reportSummaries = ref<DailySiteReportSummary[]>([]);
const selectedReport = ref<DailySiteReport | null>(null);

const topCountries = computed(() => analytics.value?.countries.slice(0, 8) ?? []);
const recentLogs = computed(() => analytics.value?.recent ?? []);
const topPaths = computed(() => analytics.value?.topPaths ?? []);
const hourly = computed(() => analytics.value?.hourly ?? []);
const today = computed(() => new Date().toISOString().split("T")[0]);
const mapPoints = computed(() => {
  const points = analytics.value?.chinaCities ?? [];
  const maxValue = Math.max(1, ...points.map((item) => item.value[2]));

  return points.map((item) => {
    const [lng, lat, value] = item.value;
    const x = ((lng - 73) / (135 - 73)) * 100;
    const y = (1 - (lat - 18) / (54 - 18)) * 100;
    return {
      name: item.name,
      value,
      x: Math.min(96, Math.max(4, x)),
      y: Math.min(92, Math.max(8, y)),
      size: mapMode.value === "heatmap"
        ? Math.max(28, Math.min(96, 24 + value / maxValue * 72))
        : Math.max(10, Math.min(30, 8 + value / maxValue * 22)),
      opacity: mapMode.value === "heatmap"
        ? Math.max(0.26, Math.min(0.72, value / maxValue))
        : 0.9,
    };
  });
});

const formatTime = (value: string) => new Date(value).toLocaleString();
const formatLocation = (log: { country?: string; region?: string; city?: string }) =>
  [log.country, log.region, log.city].filter(Boolean).join(" / ") || "-";
const maxHourly = computed(() => Math.max(1, ...hourly.value.map((item) => item.value)));

const switchMapMode = (mode: "scatter" | "heatmap") => {
  mapMode.value = mode;
};

const loadAnalytics = async () => {
  loading.value = true;
  error.value = null;
  const result = await visitAnalyticsService.getAnalytics();
  if (result.success && result.data) {
    analytics.value = result.data;
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

onMounted(() => {
  const token = siteReportService.getAdminToken();
  if (token) {
    reportPassword.value = token;
    reportAuthenticated.value = true;
    loadReportSummaries().then(() => loadReport(reportSummaries.value[0]?.date || today.value));
  }
  loadAnalytics();
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
          <div class="map-box" :class="mapMode">
            <div class="map-frame" aria-hidden="true">
              <span class="grid-line horizontal top"></span>
              <span class="grid-line horizontal mid"></span>
              <span class="grid-line horizontal bottom"></span>
              <span class="grid-line vertical left"></span>
              <span class="grid-line vertical mid"></span>
              <span class="grid-line vertical right"></span>
              <span
                v-for="point in mapPoints"
                :key="`${point.name}-${point.x}-${point.y}`"
                class="map-point"
                :style="{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: `${point.size}px`,
                  height: `${point.size}px`,
                  opacity: point.opacity,
                }"
                :title="`${point.name} · ${point.value}`"
              ></span>
            </div>
            <div v-if="mapPoints.length" class="map-labels">
              <span v-for="point in mapPoints.slice(0, 8)" :key="point.name">{{ point.name }} · {{ point.value }}</span>
            </div>
            <span v-else>暂无中国城市访问点</span>
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
  position: relative;
  width: 100%;
  height: 460px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background:
    radial-gradient(circle at 68% 45%, rgba(83, 198, 176, 0.12), transparent 26%),
    radial-gradient(circle at 48% 54%, rgba(240, 179, 91, 0.12), transparent 24%),
    rgba(8, 10, 15, 0.44);
}

.map-box > span {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-weight: 800;
}

.map-frame {
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
}

.grid-line.horizontal {
  left: 0;
  right: 0;
  height: 1px;
}

.grid-line.vertical {
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line.top {
  top: 18%;
}

.grid-line.mid {
  top: 50%;
}

.grid-line.bottom {
  bottom: 18%;
}

.grid-line.left {
  left: 22%;
}

.grid-line.mid.vertical {
  left: 50%;
}

.grid-line.right {
  right: 22%;
}

.map-point {
  position: absolute;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 28px rgba(240, 179, 91, 0.42);
  transform: translate(-50%, -50%);
}

.map-box.heatmap .map-point {
  background: radial-gradient(circle, rgba(239, 111, 108, 0.92), rgba(240, 179, 91, 0.36) 42%, transparent 70%);
  filter: blur(1px);
  box-shadow: none;
}

.map-labels {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.map-labels span {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(8, 10, 15, 0.68);
  color: var(--text-muted);
  font-size: 0.72rem;
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
