<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import shortLinkService, {
  type ShortLinkDailyStats,
  type ShortLinkInput,
  type ShortLinkStatsData,
  type ShortLinkSummary,
  type ShortLinkTotals,
} from "../services/shortLinkService";

const isAuthenticated = ref(false);
const password = ref("");
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);
const showForm = ref(false);
const editingLink = ref<ShortLinkSummary | null>(null);
const selectedStats = ref<ShortLinkStatsData | null>(null);
const statsLoading = ref(false);
const links = ref<ShortLinkSummary[]>([]);
const totals = ref<ShortLinkTotals>({ totalLinks: 0, activeLinks: 0, totalClicks: 0, todayClicks: 0 });

const formData = ref<ShortLinkInput>({
  title: "",
  targetUrl: "",
  code: "",
  description: "",
  enabled: true,
  expiresAt: "",
});

const isFormValid = computed(() => formData.value.title.trim() && formData.value.targetUrl.trim());
const topReferrers = computed(() => mergeTopItems("referrers"));
const topCountries = computed(() => mergeTopItems("countries"));

const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入管理员密码";
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const result = await shortLinkService.verifyAdminPassword(password.value);
    if (result.success && result.data) {
      isAuthenticated.value = true;
      links.value = result.data.links;
      totals.value = result.data.totals;
    } else {
      error.value = result.error || "密码错误";
    }
  } finally {
    loading.value = false;
  }
};

const loadLinks = async () => {
  loading.value = true;
  try {
    const result = await shortLinkService.getAllShortLinks();
    if (result.success && result.data) {
      links.value = result.data.links;
      totals.value = result.data.totals;
      error.value = null;
    } else {
      error.value = result.error || "短链列表加载失败";
    }
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  refreshing.value = true;
  await loadLinks();
  refreshing.value = false;
};

const resetForm = () => {
  formData.value = { title: "", targetUrl: "", code: "", description: "", enabled: true, expiresAt: "" };
  editingLink.value = null;
  showForm.value = false;
};

const showAdd = () => {
  resetForm();
  showForm.value = true;
};

const showEdit = (link: ShortLinkSummary) => {
  editingLink.value = link;
  formData.value = {
    title: link.title,
    targetUrl: link.targetUrl,
    code: link.code,
    description: link.description || "",
    enabled: link.enabled,
    expiresAt: link.expiresAt ? link.expiresAt.split("T")[0] : "",
  };
  showForm.value = true;
};

const submitForm = async () => {
  if (!isFormValid.value) return;

  try {
    const url = new URL(formData.value.targetUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      error.value = "目标 URL 只支持 http 或 https";
      return;
    }
  } catch {
    error.value = "请输入有效 URL";
    return;
  }

  loading.value = true;
  error.value = null;
  const payload: ShortLinkInput = {
    title: formData.value.title.trim(),
    targetUrl: formData.value.targetUrl.trim(),
    description: formData.value.description?.trim() || undefined,
    enabled: formData.value.enabled,
    expiresAt: formData.value.expiresAt || null,
  };

  const result = editingLink.value
    ? await shortLinkService.updateShortLink(editingLink.value.code, payload)
    : await shortLinkService.createShortLink({ ...payload, code: formData.value.code?.trim() || undefined });

  if (result.success) {
    notice.value = editingLink.value ? "短链已更新" : "短链已创建";
    resetForm();
    await loadLinks();
  } else {
    error.value = result.error || "保存失败";
  }
  loading.value = false;
};

const copyShortUrl = async (link: ShortLinkSummary) => {
  await navigator.clipboard.writeText(link.shortUrl || shortLinkService.buildShortUrl(link.code));
  notice.value = "短链已复制";
};

const openShortUrl = (link: ShortLinkSummary) => {
  window.open(link.shortUrl || shortLinkService.buildShortUrl(link.code), "_blank", "noopener,noreferrer");
};

const showStats = async (link: ShortLinkSummary) => {
  statsLoading.value = true;
  selectedStats.value = null;
  const result = await shortLinkService.getShortLinkStats(link.code, 30);
  if (result.success && result.data) selectedStats.value = result.data;
  else error.value = result.error || "统计加载失败";
  statsLoading.value = false;
};

const deleteLink = async (link: ShortLinkSummary) => {
  if (!confirm(`确定删除短链 ${link.code}？`)) return;
  loading.value = true;
  const result = await shortLinkService.deleteShortLink(link.code);
  if (result.success) {
    notice.value = "短链已删除";
    if (selectedStats.value?.code === link.code) selectedStats.value = null;
    await loadLinks();
  } else {
    error.value = result.error || "删除失败";
  }
  loading.value = false;
};

const logout = () => {
  shortLinkService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  links.value = [];
  selectedStats.value = null;
  resetForm();
};

function mergeTopItems(key: "referrers" | "countries") {
  const counts = new Map<string, number>();
  selectedStats.value?.days.forEach((day: ShortLinkDailyStats) => {
    Object.entries(day[key]).forEach(([name, count]) => counts.set(name, (counts.get(name) || 0) + count));
  });
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]).slice(0, 5);
}

onMounted(() => {
  const token = shortLinkService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadLinks();
  }
});
</script>

<template>
  <div class="shortlinks-view page-shell">
    <div class="container">
      <section v-if="!isAuthenticated" class="login-layout">
        <div>
          <span class="page-tag">Short Links</span>
          <h1 class="page-title">短链管理</h1>
          <p class="page-sub">创建可统计访问数据的短链接，用于分享页面、文件或临时活动入口。</p>
        </div>
        <form class="login-panel panel" @submit.prevent="authenticate">
          <h2>管理员登录</h2>
          <input v-model="password" type="password" placeholder="管理员密码" :disabled="loading" />
          <button class="btn" type="submit" :disabled="loading || !password.trim()">
            {{ loading ? "验证中" : "登录" }}
          </button>
          <p v-if="error">{{ error }}</p>
        </form>
      </section>

      <template v-else>
        <header class="page-hero">
          <div>
            <span class="page-tag">Short Links</span>
            <h1 class="page-title">短链中心</h1>
            <p class="page-sub">统一维护 `/s/短码` 跳转，并查看点击、今日访问和独立访客。</p>
          </div>
          <div class="head-actions">
            <button class="btn" @click="showAdd">新建短链</button>
            <button class="btn btn-ghost" @click="refreshData" :disabled="refreshing">{{ refreshing ? "刷新中" : "刷新" }}</button>
            <button class="btn btn-ghost" @click="logout">退出</button>
          </div>
        </header>

        <section class="metrics">
          <div class="metric panel"><span>总链接</span><strong>{{ totals.totalLinks }}</strong></div>
          <div class="metric panel"><span>启用</span><strong>{{ totals.activeLinks }}</strong></div>
          <div class="metric panel"><span>总点击</span><strong>{{ totals.totalClicks }}</strong></div>
          <div class="metric panel"><span>今日点击</span><strong>{{ totals.todayClicks }}</strong></div>
        </section>

        <p v-if="notice" class="soft-alert success">{{ notice }} <button @click="notice = null">关闭</button></p>
        <p v-if="error" class="soft-alert">{{ error }} <button @click="error = null">关闭</button></p>

        <div v-if="loading && !showForm" class="state-box panel">
          <div class="spinner"></div>
          <p>正在读取短链</p>
        </div>

        <section v-else class="link-grid">
          <article v-for="link in links" :key="link.code" class="link-card panel">
            <header>
              <div>
                <h2>{{ link.title }}</h2>
                <a :href="link.targetUrl" target="_blank" rel="noreferrer">{{ link.targetUrl.replace(/^https?:\/\//, "") }}</a>
              </div>
              <span :class="['status-pill', shortLinkService.statusOf(link)]">
                {{ shortLinkService.statusLabel(shortLinkService.statusOf(link)) }}
              </span>
            </header>

            <div class="short-line">
              <code>{{ link.shortUrl }}</code>
              <div class="line-actions">
                <button class="icon-btn" @click="copyShortUrl(link)">复制</button>
                <button class="icon-btn" @click="openShortUrl(link)">打开</button>
              </div>
            </div>

            <div class="stats-row">
              <span>短码 <strong>{{ link.code }}</strong></span>
              <span>总点击 <strong>{{ link.totalClicks }}</strong></span>
              <span>今日 <strong>{{ link.todayClicks }}</strong></span>
              <span>访客 <strong>{{ link.uniqueVisitors }}</strong></span>
            </div>

            <p v-if="link.description" class="description">{{ link.description }}</p>
            <p class="meta">最后访问 {{ shortLinkService.formatDate(link.lastAccessedAt) }}</p>

            <footer class="card-actions">
              <button class="btn btn-ghost" @click="showStats(link)">统计</button>
              <button class="btn btn-ghost" @click="showEdit(link)">编辑</button>
              <button class="btn btn-ghost danger" @click="deleteLink(link)">删除</button>
            </footer>
          </article>

          <div v-if="links.length === 0" class="state-box panel empty">
            <p>暂无短链，先新建一个吧。</p>
          </div>
        </section>

        <section v-if="statsLoading || selectedStats" class="stats-detail panel">
          <div v-if="statsLoading" class="state-box">
            <div class="spinner"></div>
            <p>正在读取统计</p>
          </div>
          <template v-else-if="selectedStats">
            <header>
              <div>
                <span class="section-kicker">Analytics</span>
                <h2>/s/{{ selectedStats.code }}</h2>
              </div>
              <button class="btn btn-ghost" @click="selectedStats = null">关闭</button>
            </header>
            <div class="stats-overview">
              <span>总点击 <strong>{{ selectedStats.total.totalClicks }}</strong></span>
              <span>独立访客 <strong>{{ selectedStats.total.uniqueVisitors }}</strong></span>
              <span>最后访问 <strong>{{ shortLinkService.formatDate(selectedStats.total.lastAccessedAt) }}</strong></span>
            </div>
            <div class="daily-list">
              <div v-for="day in selectedStats.days" :key="day.date" class="daily-item">
                <span>{{ day.date }}</span>
                <strong>{{ day.clicks }}</strong>
                <small>{{ day.uniqueVisitors }} 访客</small>
              </div>
            </div>
            <div class="top-grid">
              <div>
                <h3>来源</h3>
                <p v-for="[name, count] in topReferrers" :key="name"><span>{{ name }}</span><strong>{{ count }}</strong></p>
                <p v-if="topReferrers.length === 0">暂无数据</p>
              </div>
              <div>
                <h3>地区</h3>
                <p v-for="[name, count] in topCountries" :key="name"><span>{{ name }}</span><strong>{{ count }}</strong></p>
                <p v-if="topCountries.length === 0">暂无数据</p>
              </div>
            </div>
          </template>
        </section>
      </template>
    </div>

    <div v-if="showForm" class="modal-overlay" @click="resetForm">
      <form class="modal panel" @click.stop @submit.prevent="submitForm">
        <header>
          <h2>{{ editingLink ? "编辑短链" : "新建短链" }}</h2>
          <button type="button" @click="resetForm">关闭</button>
        </header>
        <label>标题<input v-model="formData.title" required placeholder="项目首页" /></label>
        <label>目标 URL<input v-model="formData.targetUrl" type="url" required placeholder="https://example.com" /></label>
        <div class="form-row">
          <label>短码<input v-model="formData.code" :disabled="!!editingLink" placeholder="留空自动生成" /></label>
          <label>过期时间<input v-model="formData.expiresAt" type="date" /></label>
        </div>
        <label>描述<textarea v-model="formData.description" rows="3" placeholder="可选备注"></textarea></label>
        <label class="check-line"><input v-model="formData.enabled" type="checkbox" /> 启用短链</label>
        <footer>
          <button type="button" class="btn btn-ghost" @click="resetForm">取消</button>
          <button class="btn" type="submit" :disabled="loading || !isFormValid">{{ loading ? "保存中" : "保存" }}</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-layout {
  min-height: calc(100vh - 180px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  gap: 28px;
  align-items: center;
}

.login-panel,
.modal {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.login-panel h2,
.modal h2,
.stats-detail h2 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
}

.login-panel p,
.soft-alert,
.description,
.meta {
  color: var(--text-soft);
}

.head-actions,
.modal header,
.modal footer,
.stats-detail header,
.top-grid p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.head-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.link-card header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.link-card header .status-pill {
  flex-shrink: 0;
  margin-top: 2px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.metric {
  min-height: 124px;
  display: grid;
  align-content: end;
  padding: 20px;
}

.metric span,
.stats-row span,
.daily-item span,
.daily-item small {
  color: var(--text-muted);
  font-weight: 800;
}

.metric strong {
  color: var(--accent);
  font-size: 2.2rem;
  line-height: 1;
  font-weight: 800;
}

.soft-alert {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(239, 111, 108, 0.35);
  border-radius: var(--radius-sm);
  background: rgba(239, 111, 108, 0.08);
}

.soft-alert.success {
  border-color: rgba(83, 198, 176, 0.35);
  background: rgba(83, 198, 176, 0.08);
}

.soft-alert button {
  margin-left: 10px;
  color: var(--accent);
  font-weight: 800;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 14px;
}

.link-card {
  min-width: 0;
  max-width: 100%;
  display: grid;
  gap: 16px;
  padding: 20px;
  box-sizing: border-box;
}

.link-card header > div {
  min-width: 0;
}

.link-card h2 {
  overflow: hidden;
  color: var(--text);
  font-size: 1.18rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-card a {
  display: block;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill.active {
  border-color: rgba(83, 198, 176, 0.5);
  color: var(--accent-2);
}

.status-pill.paused,
.status-pill.expired {
  border-color: rgba(239, 111, 108, 0.6);
  color: var(--accent-3);
}

.short-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
}

.short-line code {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-actions {
  display: flex;
  flex-wrap: nowrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.link-card footer.card-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  min-width: 0;
  align-items: stretch;
}

.short-line .icon-btn {
  width: auto;
  min-width: 48px;
  padding: 0 10px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.link-card footer.card-actions .btn {
  min-height: 38px;
  min-width: 0;
  padding-inline: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.stats-row span,
.stats-overview span {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

.stats-row strong,
.stats-overview strong,
.daily-item strong,
.top-grid strong {
  overflow-wrap: anywhere;
  color: var(--text);
}

.empty {
  grid-column: 1 / -1;
}

.stats-detail {
  display: grid;
  gap: 18px;
  margin-top: 24px;
  padding: 22px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.daily-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.daily-item {
  display: grid;
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.18);
}

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.top-grid > div {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.top-grid h3 {
  color: var(--text);
  font-size: 1rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(12px);
}

.modal {
  width: min(560px, 100%);
}

.modal label {
  display: grid;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 800;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.check-line {
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
}

.check-line input {
  width: auto;
}

.danger {
  color: var(--accent-3);
}

@media (max-width: 760px) {
  .login-layout,
  .metrics,
  .stats-overview,
  .top-grid,
  .form-row {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .link-grid {
    grid-template-columns: 1fr;
  }

  .short-line {
    grid-template-columns: 1fr;
  }

  .line-actions {
    justify-content: stretch;
  }

  .line-actions .icon-btn {
    flex: 1 1 0;
  }
}

</style>
