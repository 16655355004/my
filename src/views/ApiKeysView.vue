<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import apiKeyService, { type ApiKey, type ApiKeyInput } from "../services/apiKeyService";

const isAuthenticated = ref(false);
const password = ref("");
const apiKeys = ref<ApiKey[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);

const showAddForm = ref(false);
const editingKey = ref<ApiKey | null>(null);
const formData = ref<ApiKeyInput>({ website: "", mainSite: "", apiKey: "", balance: 0, expiryDate: "" });

const revealedKeys = ref<Set<number>>(new Set());

// 统计
const totalKeys    = computed(() => apiKeys.value.length);
const activeKeys   = computed(() => apiKeys.value.filter(k => apiKeyService.getKeyStatus(k.expiryDate) === "active").length);
const totalBalance = computed(() => apiKeys.value.reduce((s, k) => s + k.balance, 0));

const isFormValid = computed(
  () => formData.value.website.trim() && formData.value.mainSite.trim() &&
        formData.value.apiKey.trim() && formData.value.expiryDate
);

const authenticate = async () => {
  if (!password.value.trim()) { error.value = "请输入管理员密码"; return; }
  loading.value = true; error.value = null;
  try {
    const ok = await apiKeyService.verifyAdminPassword(password.value);
    if (ok) { apiKeyService.setAdminToken(password.value); isAuthenticated.value = true; await loadApiKeys(); }
    else error.value = "密码错误";
  } catch { error.value = "验证失败"; }
  finally { loading.value = false; }
};

const loadApiKeys = async () => {
  loading.value = true;
  try {
    const res = await apiKeyService.getAllApiKeys();
    apiKeys.value = res.success && res.data ? res.data : [];
    if (!res.success) error.value = res.error ?? "加载失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const refreshData = async () => { refreshing.value = true; await loadApiKeys(); refreshing.value = false; };

const resetForm = () => {
  formData.value = { website: "", mainSite: "", apiKey: "", balance: 0, expiryDate: "" };
  editingKey.value = null; showAddForm.value = false;
};

const showAdd = () => {
  resetForm();
  const d = new Date(); d.setFullYear(d.getFullYear() + 1);
  formData.value.expiryDate = d.toISOString().split("T")[0];
  showAddForm.value = true;
};

const showEdit = (k: ApiKey) => {
  formData.value = { website: k.website, mainSite: k.mainSite, apiKey: k.apiKey, balance: k.balance, expiryDate: k.expiryDate.split("T")[0] };
  editingKey.value = k; showAddForm.value = true;
};

const submitForm = async () => {
  if (!isFormValid.value) return;
  try { new URL(formData.value.mainSite); } catch { error.value = "请输入有效的网址"; return; }
  loading.value = true; error.value = null;
  try {
    const res = editingKey.value
      ? await apiKeyService.updateApiKey(editingKey.value.id, formData.value)
      : await apiKeyService.addApiKey(formData.value);
    if (res.success) { await loadApiKeys(); resetForm(); }
    else error.value = res.error ?? "操作失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const deleteKey = async (k: ApiKey) => {
  if (!confirm(`确定删除 "${k.website}" 的密钥？`)) return;
  loading.value = true;
  try {
    const res = await apiKeyService.deleteApiKey(k.id);
    if (res.success) await loadApiKeys();
    else error.value = res.error ?? "删除失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const copyKey = (text: string) => { navigator.clipboard.writeText(text); };
const toggleReveal = (id: number) => {
  if (revealedKeys.value.has(id)) revealedKeys.value.delete(id);
  else revealedKeys.value.add(id);
};

const statusLabel = (s: string) => ({ active: "有效", expiring: "即将过期", expired: "已过期" }[s] ?? s);

const logout = () => {
  apiKeyService.clearAdminToken();
  isAuthenticated.value = false; password.value = "";
  apiKeys.value = []; resetForm();
};

onMounted(() => {
  const tok = apiKeyService.getAdminToken();
  if (tok) { password.value = tok; isAuthenticated.value = true; loadApiKeys(); }
});
</script>

<template>
  <div class="apikeys-view">
    <div class="container">
      <!-- ── 登录 ── -->
      <div v-if="!isAuthenticated" class="login-wrap">
        <div class="login-box">
          <span class="page-tag">API KEYS</span>
          <h1 class="login-title">密钥管理系统</h1>
          <p class="login-sub">请输入管理员密码以管理 API 密钥</p>
          <form @submit.prevent="authenticate" class="login-form">
            <input v-model="password" type="password" placeholder="管理员密码" :disabled="loading" />
            <button type="submit" class="btn" :disabled="loading || !password.trim()">
              {{ loading ? "验证中…" : "登录" }}
            </button>
          </form>
          <p v-if="error" class="error-tip">{{ error }}</p>
        </div>
      </div>

      <!-- ── 管理 ── -->
      <template v-else>
        <div class="admin-head">
          <div>
            <span class="page-tag">API KEYS</span>
            <h1 class="page-title">密钥管理</h1>
          </div>
          <div class="head-btns">
            <button class="btn" @click="showAdd">+ 添加</button>
            <button class="btn btn-ghost" @click="refreshData" :disabled="refreshing">
              <svg :class="{ spin: refreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              刷新
            </button>
            <button class="btn btn-ghost" @click="logout">退出</button>
          </div>
        </div>

        <!-- 统计 -->
        <div class="stats-row">
          <div class="stat-chip">
            <span class="stat-label">总密钥</span>
            <span class="stat-val">{{ totalKeys }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">有效</span>
            <span class="stat-val">{{ activeKeys }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">总余额</span>
            <span class="stat-val">{{ apiKeyService.formatBalance(totalBalance) }}</span>
          </div>
        </div>

        <p v-if="error" class="error-banner">
          {{ error }}
          <button @click="error = null">✕</button>
        </p>

        <div v-if="loading && !showAddForm" class="state-box">
          <div class="spinner"></div>
        </div>

        <div v-else>
          <div v-if="apiKeys.length === 0" class="state-box">
            <p class="state-title">暂无密钥记录</p>
            <p class="state-sub">点击"+ 添加"开始添加</p>
          </div>

          <div v-else class="keys-grid">
            <div v-for="k in apiKeys" :key="k.id" class="key-card">
              <div class="key-card-head">
                <div>
                  <h3 class="key-site">{{ k.website }}</h3>
                  <a :href="k.mainSite" target="_blank" class="key-url">{{ k.mainSite.replace("https://","") }}</a>
                </div>
                <span :class="['status-badge', apiKeyService.getKeyStatus(k.expiryDate)]">
                  {{ statusLabel(apiKeyService.getKeyStatus(k.expiryDate)) }}
                </span>
              </div>

              <div class="info-rows">
                <div class="info-row">
                  <span class="lbl">密钥</span>
                  <div class="key-val-wrap">
                    <code class="key-code">{{ revealedKeys.has(k.id) ? k.apiKey : apiKeyService.maskApiKey(k.apiKey) }}</code>
                    <button @click="toggleReveal(k.id)" class="icon-action" title="显示/隐藏">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                        <path v-if="revealedKeys.has(k.id)" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke-linecap="round" stroke-linejoin="round"/>
                        <path v-else d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button @click="copyKey(k.apiKey)" class="icon-action" title="复制">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                        <rect x="9" y="9" width="13" height="13" rx="1" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="info-row">
                  <span class="lbl">余额</span>
                  <span>{{ apiKeyService.formatBalance(k.balance) }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">有效期</span>
                  <span>{{ k.expiryDate.split("T")[0] }}</span>
                </div>
              </div>

              <div class="key-actions">
                <button class="btn btn-ghost sm" @click="showEdit(k)">编辑</button>
                <button class="btn btn-ghost sm" @click="deleteKey(k)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── 模态框 ── -->
    <div v-if="showAddForm" class="modal-overlay" @click="resetForm">
      <div class="modal-box" @click.stop>
        <div class="modal-head">
          <h2>{{ editingKey ? "编辑密钥" : "添加密钥" }}</h2>
          <button @click="resetForm" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-field">
            <label>服务名称 *</label>
            <input v-model="formData.website" type="text" placeholder="OpenAI" required />
          </div>
          <div class="form-field">
            <label>官网 URL *</label>
            <input v-model="formData.mainSite" type="url" placeholder="https://openai.com" required />
          </div>
          <div class="form-field">
            <label>API 密钥 *</label>
            <input v-model="formData.apiKey" type="text" placeholder="sk-…" class="mono" required />
          </div>
          <div class="form-row2">
            <div class="form-field">
              <label>余额 ($)</label>
              <input v-model.number="formData.balance" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-field">
              <label>有效期 *</label>
              <input v-model="formData.expiryDate" type="date" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="resetForm">取消</button>
            <button type="submit" class="btn" :disabled="loading || !isFormValid">
              {{ loading ? "保存中…" : (editingKey ? "更新" : "添加") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apikeys-view {
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
}

/* ── 登录 ── */
.login-wrap {
  min-height: 80vh; display: flex; align-items: center; justify-content: center;
}
.login-box {
  width: 100%; max-width: 380px; border: 1px solid var(--border); padding: 2.5rem;
}
.page-tag {
  display: block; font-size: 0.7rem; letter-spacing: 0.35em;
  text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.75rem;
}
.login-title { font-size: 1.8rem; font-weight: 300; color: var(--text); margin-bottom: 0.4rem; }
.login-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem; }
.login-form { display: flex; flex-direction: column; gap: 1rem; }
.login-form input {
  background: transparent; border: 1px solid var(--border); border-radius: 2px;
  color: var(--text); font-size: 0.9rem; padding: 0.7rem 1rem; outline: none;
  font-family: inherit; transition: border-color var(--transition);
}
.login-form input:focus { border-color: var(--border-active); }
.login-form input::placeholder { color: var(--text-dim); }
.error-tip { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem; }

/* ── 头部 ── */
.admin-head {
  padding: 3rem 0 2rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem;
  display: flex; justify-content: space-between; align-items: flex-end;
  flex-wrap: wrap; gap: 1rem;
}
.page-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: var(--text); }
.head-btns { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 统计 ── */
.stats-row { display: flex; gap: 0; border: 1px solid var(--border); margin-bottom: 2rem; }
.stat-chip {
  flex: 1; padding: 1.25rem 1.5rem; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 0.3rem;
}
.stat-chip:last-child { border-right: none; }
.stat-label { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim); }
.stat-val { font-size: 1.6rem; font-weight: 300; color: var(--text); font-variant-numeric: tabular-nums; }

/* ── 错误 ── */
.error-banner {
  border: 1px solid var(--border-hover); padding: 0.75rem 1rem; margin-bottom: 1.5rem;
  font-size: 0.85rem; color: var(--text-muted);
  display: flex; justify-content: space-between; align-items: center;
}

/* ── 密钥网格 ── */
.keys-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1px;
  border: 1px solid var(--border);
}

.key-card {
  padding: 1.5rem; background: var(--bg);
  display: flex; flex-direction: column; gap: 1.25rem;
  transition: background var(--transition);
}

.key-card:hover { background: var(--bg-2); }

.key-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.key-site { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
.key-url { font-size: 0.75rem; color: var(--text-dim); font-family: monospace; }

.status-badge {
  font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;
  border: 1px solid var(--border); padding: 0.2rem 0.5rem; flex-shrink: 0;
  color: var(--text-dim);
}
.status-badge.active   { border-color: var(--border-hover); color: var(--text-muted); }
.status-badge.expiring { border-color: var(--border-hover); color: var(--text-muted); }
.status-badge.expired  { color: var(--text-dim); }

.info-rows { display: flex; flex-direction: column; gap: 0.6rem; }
.info-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); }
.lbl { min-width: 50px; font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; }

.key-val-wrap { display: flex; align-items: center; gap: 0.4rem; flex: 1; overflow: hidden; }
.key-code {
  font-family: monospace; font-size: 0.8rem; color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}

.icon-action {
  color: var(--text-dim); cursor: pointer; padding: 2px;
  display: flex; align-items: center; justify-content: center;
  transition: color var(--transition); flex-shrink: 0;
}
.icon-action:hover { color: var(--text); }

.key-actions { display: flex; gap: 0.5rem; }
.btn.sm { padding: 0.4rem 0.9rem; font-size: 0.8rem; }

/* ── 状态 ── */
.state-box {
  padding: 4rem 0; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.state-title { font-size: 1rem; color: var(--text); }
.state-sub { font-size: 0.85rem; color: var(--text-dim); }
.spinner {
  width: 22px; height: 22px;
  border: 1px solid var(--border-hover);
  border-top-color: var(--text); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── 模态框 ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.88);
  display: flex; align-items: center; justify-content: center;
  z-index: 800; padding: 1.5rem;
}
.modal-box {
  background: var(--bg-2); border: 1px solid var(--border);
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
}
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
}
.modal-head h2 { font-size: 1rem; font-weight: 600; color: var(--text); }
.close-btn { font-size: 0.9rem; color: var(--text-muted); cursor: pointer; }
.modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

.form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.form-field label { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
.form-field input, .form-field select {
  background: transparent; border: 1px solid var(--border); border-radius: 2px;
  color: var(--text); font-size: 0.9rem; padding: 0.65rem 0.9rem; outline: none;
  font-family: inherit; transition: border-color var(--transition);
}
.form-field input:focus, .form-field select:focus { border-color: var(--border-active); }
.form-field input::placeholder { color: var(--text-dim); }
.mono { font-family: monospace !important; }
.form-field select option { background: var(--bg-2); }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding-top: 0.75rem; border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stat-chip { border-right: none; border-bottom: 1px solid var(--border); }
  .stat-chip:last-child { border-bottom: none; }
  .keys-grid { grid-template-columns: 1fr; }
  .form-row2 { grid-template-columns: 1fr; }
}
</style>
