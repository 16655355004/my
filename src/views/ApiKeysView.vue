<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import apiKeyService, { type ApiKey, type ApiKeyInput } from "../services/apiKeyService";
import ServiceLogo from "../components/ServiceLogo.vue";

const providers = [
  { id: "custom", name: "自定义", site: "" },
  { id: "deepseek", name: "DeepSeek", site: "https://platform.deepseek.com" },
  { id: "openai", name: "OpenAI", site: "https://platform.openai.com" },
  { id: "anthropic", name: "Anthropic", site: "https://console.anthropic.com" },
  { id: "gemini", name: "Gemini", site: "https://aistudio.google.com" },
  { id: "github", name: "GitHub", site: "https://github.com" },
];
const isAuthenticated = ref(false);
const password = ref("");
const apiKeys = ref<ApiKey[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);
const formError = ref<string | null>(null);
const notice = ref<string | null>(null);
const showAddForm = ref(false);
const editingKey = ref<ApiKey | null>(null);
const revealedKeys = ref(new Set<number>());
const balanceLoading = ref(new Set<number>());
const balanceErrors = ref<Record<number, string>>({});
const search = ref("");
const failedCopy = "复制失败，请检查浏览器剪贴板权限";
const emptyForm = (): ApiKeyInput => ({ website: "", mainSite: "", apiKey: "", balance: 0, currency: "USD", provider: "custom", logoUrl: "", expiryDate: "" });
const formData = ref<ApiKeyInput>(emptyForm());
const providerOf = (key: ApiKey) => {
  if (key.provider && key.provider !== "custom") return key.provider;
  try {
    const host = new URL(key.mainSite).hostname;
    if (host === "deepseek.com" || host.endsWith(".deepseek.com")) return "deepseek";
  } catch { /* Legacy records may not have a valid URL. */ }
  return "custom";
};
const activeKeys = computed(() => apiKeys.value.filter((key) => apiKeyService.getKeyStatus(key.expiryDate) !== "expired").length);
const balances = computed(() => {
  const totals = new Map<string, number>();
  apiKeys.value.forEach((key) => totals.set(key.currency || "USD", (totals.get(key.currency || "USD") || 0) + key.balance));
  return [...totals];
});
const filteredKeys = computed(() => apiKeys.value.filter((key) => `${key.website} ${key.mainSite}`.toLowerCase().includes(search.value.trim().toLowerCase())));
const isFormValid = computed(() => formData.value.website.trim() && formData.value.mainSite.trim() && formData.value.apiKey.trim() && Number.isFinite(formData.value.balance));
const statusLabel = (date: string) => !date ? "长期有效" : ({ active: "有效", expiring: "即将过期", expired: "已过期" }[apiKeyService.getKeyStatus(date)]);
const siteLabel = (site: string) => site.replace(/^https?:\/\//, "").replace(/\/$/, "");
const updatedLabel = (date?: string) => date ? new Date(date).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "尚未同步";

const loadApiKeys = async () => {
  loading.value = true;
  try {
    const result = await apiKeyService.getAllApiKeys();
    if (result.success && result.data) { apiKeys.value = result.data; error.value = null; }
    else error.value = result.error || "密钥列表加载失败";
  } finally { loading.value = false; }
};
const authenticate = async () => {
  if (!password.value.trim()) return;
  loading.value = true;
  error.value = null;
  try {
    if (await apiKeyService.verifyAdminPassword(password.value)) {
      isAuthenticated.value = true;
      await loadApiKeys();
    } else error.value = "密码错误或验证失败";
  } finally { loading.value = false; }
};
const refreshData = async () => {
  refreshing.value = true;
  try { await loadApiKeys(); } finally { refreshing.value = false; }
};
const resetForm = () => {
  showAddForm.value = false;
  editingKey.value = null;
  formError.value = null;
  formData.value = emptyForm();
};
const showAdd = () => { resetForm(); showAddForm.value = true; };
const showEdit = (key: ApiKey) => {
  editingKey.value = key;
  formError.value = null;
  formData.value = { website: key.website, mainSite: key.mainSite, apiKey: key.apiKey, balance: key.balance, currency: key.currency || "USD", provider: providerOf(key), logoUrl: key.logoUrl || "", expiryDate: key.expiryDate?.split("T")[0] || "" };
  showAddForm.value = true;
};
const selectProvider = (id: string) => {
  const previous = providers.find((item) => item.id === formData.value.provider);
  const provider = providers.find((item) => item.id === id)!;
  if (!formData.value.website || formData.value.website === previous?.name) formData.value.website = id === "custom" ? "" : provider.name;
  if (!formData.value.mainSite || formData.value.mainSite === previous?.site) formData.value.mainSite = provider.site;
  formData.value.provider = id;
};
const submitForm = async () => {
  if (!isFormValid.value || loading.value) return;
  formError.value = null;
  try {
    const site = new URL(formData.value.mainSite);
    if (!["http:", "https:"].includes(site.protocol)) throw new Error();
    if (formData.value.logoUrl && new URL(formData.value.logoUrl).protocol !== "https:") throw new Error();
  } catch { formError.value = "请输入有效官网 URL；自定义 Logo 需为 HTTPS 图片地址"; return; }
  loading.value = true;
  try {
    const payload = { ...formData.value, website: formData.value.website.trim(), mainSite: formData.value.mainSite.trim(), apiKey: formData.value.apiKey.trim(), logoUrl: formData.value.logoUrl?.trim() || "" };
    const result = editingKey.value ? await apiKeyService.updateApiKey(editingKey.value.id, payload) : await apiKeyService.addApiKey(payload);
    if (result.success) { notice.value = editingKey.value ? "密钥已更新" : "密钥已添加"; resetForm(); await loadApiKeys(); }
    else formError.value = result.error || "密钥保存失败";
  } finally { loading.value = false; }
};
const refreshBalance = async (key: ApiKey) => {
  if (balanceLoading.value.has(key.id)) return;
  balanceLoading.value.add(key.id);
  delete balanceErrors.value[key.id];
  try {
    const result = await apiKeyService.refreshBalance(key);
    if (result.success && result.data) {
      const previousKey = key.apiKey;
      const saved = await apiKeyService.updateApiKey(key.id, {
        balance: result.data.balance,
        currency: result.data.currency,
        balanceUpdatedAt: result.data.balanceUpdatedAt,
      });
      if (key.apiKey !== previousKey) return;
      Object.assign(key, result.data);
      if (saved.success) notice.value = `${key.website} 官方余额已查询并保存`;
      else balanceErrors.value[key.id] = `官方余额查询成功，当前显示最新结果，但本站保存失败：${saved.error || '请稍后重试'}。刷新页面后可能恢复旧记录。`;
    } else balanceErrors.value[key.id] = result.error || "余额刷新失败，原余额已保留";
  } finally { balanceLoading.value.delete(key.id); }
};
const deleteKey = async (key: ApiKey) => {
  if (!confirm(`确定删除 ${key.website} 的密钥？`)) return;
  const result = await apiKeyService.deleteApiKey(key.id);
  if (result.success) { apiKeys.value = apiKeys.value.filter((item) => item.id !== key.id); revealedKeys.value.delete(key.id); notice.value = "密钥已删除"; }
  else error.value = result.error || "删除失败";
};
const toggleReveal = (id: number) => { if (revealedKeys.value.has(id)) revealedKeys.value.delete(id); else revealedKeys.value.add(id); };
const copyKey = async (value: string) => {
  try { await navigator.clipboard.writeText(value); notice.value = "密钥已复制"; } catch { error.value = failedCopy; }
};
const logout = () => { apiKeyService.clearAdminToken(); isAuthenticated.value = false; password.value = ""; apiKeys.value = []; revealedKeys.value.clear(); resetForm(); };
let restoreScroll: (() => void) | undefined;
watch(showAddForm, (open) => {
  if (open) {
    const { overflow, paddingRight } = document.body.style;
    const gap = innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${padding + gap}px`;
    restoreScroll = () => { document.body.style.overflow = overflow; document.body.style.paddingRight = paddingRight; };
  } else { restoreScroll?.(); restoreScroll = undefined; }
});
onUnmounted(() => restoreScroll?.());
onMounted(() => { if (apiKeyService.getAdminToken()) { isAuthenticated.value = true; loadApiKeys(); } });
</script>

<template>
  <div class="apikeys-view page-shell">
    <div class="container">
      <section v-if="!isAuthenticated" class="login-layout">
        <div><span class="page-tag">API Keys</span><h1 class="page-title">密钥手帐</h1><p class="page-sub">把服务、余额与有效期，收进一处安静的角落。</p></div>
        <form class="login-panel panel" @submit.prevent="authenticate">
          <span class="section-kicker">Private collection</span><h2>管理员登录</h2>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="管理员密码" :disabled="loading" aria-label="管理员密码" />
          <button class="btn" :disabled="loading || !password.trim()">{{ loading ? "验证中" : "解锁密钥手帐" }}</button><p v-if="error" role="alert">{{ error }}</p>
        </form>
      </section>
      <template v-else>
        <header class="page-hero">
          <div><span class="page-tag">API Keys / Collection</span><h1 class="page-title">密钥手帐<span class="title-dot">.</span></h1><p class="page-sub">每一份连接，都有迹可循。</p></div>
          <div class="head-actions"><button class="btn" @click="showAdd">＋ 添加密钥</button><button class="quiet-btn" :disabled="refreshing" @click="refreshData">{{ refreshing ? "读取中…" : "刷新列表" }}</button><button class="quiet-btn" @click="logout">退出</button></div>
        </header>
        <section class="collection-summary" aria-label="密钥概览">
          <div><small>COLLECTION</small><p><strong>{{ apiKeys.length }}</strong><span>份密钥</span></p></div>
          <div><small>AVAILABLE</small><p><strong>{{ activeKeys }}</strong><span>份未过期</span></p></div>
          <div class="summary-balances"><small>RECORDED BALANCE · 记录余额</small><p v-for="[currency, amount] in balances" :key="currency"><strong>{{ apiKeyService.formatBalance(amount, currency) }}</strong><span>{{ currency }}</span></p><p v-if="!balances.length">—</p></div>
        </section>
        <div class="collection-toolbar"><div><span class="section-kicker">我的收藏</span><small>{{ filteredKeys.length }} / {{ apiKeys.length }}</small></div><input v-model="search" type="search" placeholder="搜索服务或网址…" aria-label="搜索服务或网址" /></div>
        <p v-if="notice" class="soft-alert success" role="status">{{ notice }}<button @click="notice = null">关闭</button></p>
        <p v-if="error" class="soft-alert" role="alert">{{ error }}<button @click="error = null">关闭</button></p>
        <div v-if="loading && !showAddForm" class="state-box panel"><div class="spinner"></div><p>正在整理密钥…</p></div>
        <section v-else class="key-grid">
          <article v-for="key in filteredKeys" :key="key.id" class="key-card">
            <header class="key-heading"><ServiceLogo :provider="providerOf(key)" :name="key.website" :url="key.logoUrl" /><div class="service-identity"><h2>{{ key.website }}</h2><a :href="key.mainSite" target="_blank" rel="noopener noreferrer" :title="key.mainSite">{{ siteLabel(key.mainSite) }} ↗</a></div><span :class="['key-status', apiKeyService.getKeyStatus(key.expiryDate)]"><i></i>{{ statusLabel(key.expiryDate) }}</span></header>
            <div class="balance-block"><div><span class="field-caption">{{ key.balanceUpdatedAt ? "账户余额" : "记录余额" }}</span><p class="balance-value">{{ apiKeyService.formatBalance(key.balance, key.currency || 'USD') }}<small>{{ key.currency || 'USD' }}</small></p></div><button v-if="providerOf(key) === 'deepseek'" class="balance-refresh" :disabled="balanceLoading.has(key.id)" @click="refreshBalance(key)"><span :class="{ spinning: balanceLoading.has(key.id) }">↻</span>{{ balanceLoading.has(key.id) ? "同步中" : "刷新余额" }}</button><span v-else class="manual-tag">手动记录</span></div>
            <p v-if="balanceErrors[key.id]" class="balance-error" role="alert">{{ balanceErrors[key.id] }}</p>
            <div class="key-line"><code :title="revealedKeys.has(key.id) ? '密钥已显示' : '密钥已隐藏'">{{ revealedKeys.has(key.id) ? key.apiKey : apiKeyService.maskApiKey(key.apiKey) }}</code><button :aria-label="revealedKeys.has(key.id) ? '隐藏密钥' : '显示密钥'" :aria-pressed="revealedKeys.has(key.id)" @click="toggleReveal(key.id)">{{ revealedKeys.has(key.id) ? "隐藏" : "显示" }}</button><span class="action-divider"></span><button aria-label="复制密钥" @click="copyKey(key.apiKey)">复制</button></div>
            <div class="key-dates"><span><small>有效期</small>{{ key.expiryDate ? key.expiryDate.split('T')[0] : "未设置" }}</span><span><small>{{ providerOf(key) === 'deepseek' ? '余额同步' : '记录更新' }}</small>{{ updatedLabel(key.balanceUpdatedAt || (providerOf(key) !== 'deepseek' ? key.updatedAt : undefined)) }}</span></div>
            <footer><span class="card-index">KEY / {{ String(key.id).padStart(3, '0') }}</span><div><button class="edit-btn" @click="showEdit(key)">编辑</button><button class="delete-btn" @click="deleteKey(key)">删除</button></div></footer>
          </article>
          <div v-if="!filteredKeys.length" class="state-box panel empty"><p>{{ search ? "没有找到匹配的密钥" : "还没有密钥，添加你的第一份连接。" }}</p><button v-if="!search" class="btn btn-ghost" @click="showAdd">添加密钥</button></div>
        </section>
        <p class="collection-note">余额为最近一次记录或同步结果，不同币种分别统计。</p>
      </template>
    </div>
    <Teleport to="body">
      <div v-if="showAddForm" class="key-modal-overlay" @click="resetForm">
        <form class="key-modal panel" role="dialog" aria-modal="true" aria-labelledby="key-form-title" @click.stop @submit.prevent="submitForm">
          <header><div><span class="section-kicker">{{ editingKey ? 'Edit connection' : 'New connection' }}</span><h2 id="key-form-title">{{ editingKey ? "编辑密钥" : "添加一份连接" }}</h2></div><button type="button" class="quiet-btn" @click="resetForm">关闭</button></header>
          <div class="key-modal-body">
            <fieldset class="provider-field"><legend>服务商 / 内置 Logo</legend><div class="provider-options"><button v-for="provider in providers" :key="provider.id" type="button" :class="{ selected: formData.provider === provider.id }" :aria-pressed="formData.provider === provider.id" @click="selectProvider(provider.id)"><ServiceLogo :provider="provider.id" :name="provider.name" /><span>{{ provider.name }}</span></button></div></fieldset>
            <div class="logo-preview"><ServiceLogo :provider="formData.provider" :name="formData.website" :url="formData.logoUrl" /><label>自定义 Logo URL <span>可选，留空使用内置图标</span><input v-model="formData.logoUrl" type="url" placeholder="https://example.com/logo.png" /></label></div>
            <label>服务名称<input v-model="formData.website" required placeholder="例如 DeepSeek · 主账户" /></label>
            <label>官网 URL<input v-model="formData.mainSite" type="url" required placeholder="https://platform.deepseek.com" /></label>
            <label>API Key<input v-model="formData.apiKey" type="password" required autocomplete="off" spellcheck="false" placeholder="sk-…" /></label>
            <div class="form-row"><label>记录余额<input v-model.number="formData.balance" type="number" step="any" required /></label><label>币种<select v-model="formData.currency"><option value="USD">USD · 美元</option><option value="CNY">CNY · 人民币</option></select></label></div>
            <label>有效期 <span>可选，无固定期限可留空</span><input v-model="formData.expiryDate" type="date" /></label>
            <p v-if="formData.provider === 'deepseek'" class="form-hint">保存后可在卡片中刷新官方账户余额。币种以 DeepSeek 返回结果为准。</p>
            <p v-if="formError" class="soft-alert" role="alert">{{ formError }}</p>
          </div>
          <footer><button type="button" class="btn btn-ghost" @click="resetForm">取消</button><button class="btn" :disabled="loading || !isFormValid">{{ loading ? "保存中…" : "保存密钥" }}</button></footer>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.login-layout { min-height: calc(100vh - 240px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 400px); gap: 32px; align-items: center; }
.login-panel { display: grid; gap: 20px; padding: 28px; background: var(--bg-soft); }
.login-panel h2 { font-size: 1.5rem; }
.title-dot { color: var(--accent); }
.head-actions { display: flex; align-items: center; justify-content: flex-end; gap: 14px; flex-wrap: wrap; }
.quiet-btn { color: var(--text-muted); font-size: .84rem; padding: 8px 0; }
.quiet-btn:hover { color: var(--accent); }
button:disabled { cursor: not-allowed; opacity: .5; }
.collection-summary { display: grid; grid-template-columns: 1fr 1fr 1.5fr; padding: 24px 0; margin-bottom: 30px; border-bottom: 1px solid var(--line); }
.collection-summary > div { padding: 0 24px; border-right: 1px solid var(--line); }
.collection-summary > div:first-child { padding-left: 0; }
.collection-summary > div:last-child { border: 0; }
.collection-summary small, .field-caption { color: var(--text-soft); font-size: .68rem; letter-spacing: .13em; }
.collection-summary p { display: flex; align-items: baseline; flex-wrap: wrap; gap: 12px; }
.collection-summary strong { font-size: 2rem; font-weight: 500; color: var(--text); font-variant-numeric: tabular-nums; }
.collection-summary p span { font-size: .75rem; color: var(--text-soft); }
.summary-balances strong { font-size: 1.65rem; }
.collection-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; }
.collection-toolbar > div { display: flex; gap: 16px; align-items: center; }
.collection-toolbar small { color: var(--text-soft); font-size: .75rem; }
.collection-toolbar input { width: min(260px, 50%); padding: 8px 14px; font-size: .8rem; background: var(--bg-soft); }
.key-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 20px; }
.key-card { min-width: 0; display: flex; flex-direction: column; gap: 22px; border: 1px solid var(--line); border-radius: 18px; padding: 24px; background: linear-gradient(145deg, #171a2c, #101322); box-shadow: 0 8px 24px rgba(0, 0, 0, .12); transition: border-color var(--transition); }
.key-card:hover { border-color: var(--line-strong); }
.key-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
.service-identity { min-width: 0; flex: 1; }
.service-identity h2 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1.08rem; font-weight: 700; }
.service-identity a { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-soft); font-size: .7rem; margin-top: 5px; }
.key-status { display: inline-flex; align-items: center; gap: 5px; flex: none; color: var(--accent-2); font-size: .68rem; }
.key-status i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.key-status.expiring { color: var(--accent); }
.key-status.expired { color: var(--accent-3); }
.balance-block { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.balance-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; font-size: clamp(1.6rem, 3vw, 2rem); line-height: 1.5; color: var(--text); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.balance-value small { color: var(--text-soft); font-size: .65rem; letter-spacing: .08em; }
.balance-refresh { flex: none; display: flex; align-items: center; gap: 5px; color: var(--accent-2); border: 1px solid rgba(160, 140, 255, .22); background: rgba(160, 140, 255, .06); border-radius: 8px; padding: 6px 9px; font-size: .7rem; }
.balance-refresh:hover { background: rgba(160, 140, 255, .13); }
.balance-refresh > span { display: inline-block; font-size: 1.1rem; line-height: 1; }
.manual-tag { color: var(--text-soft); font-size: .65rem; flex: none; }
.key-line { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 11px 12px; border: 1px solid var(--line); background: rgba(5, 7, 17, .4); border-radius: 9px; }
.key-line code { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: .78rem ui-monospace, Consolas, monospace; color: var(--text-muted); }
.key-line button { flex: none; color: var(--text-muted); font-size: .68rem; }
.key-line button:hover { color: var(--accent); }
.action-divider { width: 1px; height: 12px; background: var(--line); }
.key-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.key-dates > span { display: grid; gap: 5px; font-size: .73rem; color: var(--text-muted); }
.key-dates > span:last-child { text-align: right; }
.key-dates small { color: var(--text-soft); font-size: .65rem; }
.key-card footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-index { color: var(--text-soft); font: .62rem ui-monospace, Consolas, monospace; letter-spacing: .12em; }
.key-card footer > div { display: flex; gap: 20px; }
.edit-btn, .delete-btn { font-size: .75rem; color: var(--text-muted); padding: 3px 0; }
.edit-btn:hover { color: var(--accent); }
.delete-btn { color: var(--text-soft); }
.delete-btn:hover { color: #ff9c9c; }
.collection-note { margin-top: 24px; text-align: center; color: var(--text-soft); font-size: .7rem; }
.soft-alert { padding: 12px 16px; border: 1px solid rgba(255, 150, 150, .25); background: rgba(255, 150, 150, .06); border-radius: 9px; font-size: .8rem; margin-bottom: 16px; color: var(--text-muted); }
.soft-alert.success { border-color: rgba(160, 140, 255, .3); background: rgba(160, 140, 255, .06); }
.soft-alert button { margin-left: 14px; color: var(--accent); }
.balance-error { color: #ffb0b0; font-size: .73rem; overflow-wrap: anywhere; }
.empty { grid-column: 1 / -1; }
.key-modal-overlay { position: fixed; inset: 0; z-index: 1500; display: grid; place-items: center; padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); overflow: hidden; overscroll-behavior: contain; background: rgba(0, 0, 0, .72); backdrop-filter: blur(12px); }
.key-modal { width: min(580px, 100%); min-width: 0; max-height: 100%; max-height: min(100%, calc(100dvh - 40px)); display: grid; grid-template-rows: auto minmax(0, 1fr) auto; overflow: hidden; background: linear-gradient(145deg, var(--bg-strong), var(--bg)); }
.key-modal > header, .key-modal > footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; }
.key-modal > header { border-bottom: 1px solid var(--line); }
.key-modal h2 { font-size: 1.35rem; margin-top: 8px; }
.key-modal .section-kicker { font-size: .65rem; }
.key-modal > footer { border-top: 1px solid var(--line); }
.key-modal-body { min-height: 0; min-width: 0; overflow-y: auto; overscroll-behavior: contain; display: grid; gap: 18px; padding: 24px; scrollbar-width: thin; scrollbar-color: var(--accent-2) transparent; }
.key-modal label, .provider-field legend { display: grid; gap: 7px; min-width: 0; color: var(--text-muted); font-size: .78rem; }
.key-modal label > span { font-size: .65rem; color: var(--text-soft); }
.key-modal input, .key-modal select { min-width: 0; font-size: .85rem; padding: 10px 12px; }
.key-modal select { color-scheme: dark; }
.form-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.provider-field { border: 0; min-width: 0; }
.provider-field legend { margin-bottom: 10px; }
.provider-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.provider-options button { display: flex; align-items: center; gap: 7px; padding: 8px; border: 1px solid var(--line); border-radius: 9px; font-size: .68rem; color: var(--text-muted); min-width: 0; }
.provider-options button.selected { border-color: var(--accent-2); background: rgba(160, 140, 255, .08); color: var(--text); }
.provider-options :deep(.service-logo) { width: 26px; height: 26px; border: 0; border-radius: 6px; font-size: 16px; }
.provider-options :deep(svg), .provider-options :deep(img) { width: 18px; height: 18px; }
.logo-preview { display: flex; gap: 14px; align-items: center; }
.logo-preview label { flex: 1; }
.form-hint { font-size: .72rem; color: var(--text-soft); border-left: 2px solid var(--accent-2); padding-left: 12px; }
.spinning { animation: key-spin 1s linear infinite; }
@keyframes key-spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .login-layout { grid-template-columns: 1fr; } .head-actions { justify-content: flex-start; } .collection-summary > div { padding: 0 12px; } .collection-summary strong { font-size: 1.5rem; } .summary-balances strong { font-size: 1.1rem; } .collection-summary small { font-size: .58rem; letter-spacing: .04em; } .key-card { padding: 20px; } }
@media (max-width: 400px) { .collection-summary { grid-template-columns: 1fr 1fr; gap: 20px 0; } .collection-summary .summary-balances { grid-column: 1 / -1; padding: 0; border: 0; } .collection-summary > div:nth-child(2) { border: 0; } .provider-options { grid-template-columns: repeat(2, minmax(0, 1fr)); } .key-modal > header, .key-modal > footer, .key-modal-body { padding: 16px; } .key-status { font-size: .6rem; } .service-identity h2 { font-size: 1rem; } .collection-toolbar { gap: 10px; } .collection-toolbar .section-kicker { font-size: .75rem; } }
</style>
