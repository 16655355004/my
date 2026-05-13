<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import apiKeyService, { type ApiKey, type ApiKeyInput } from "../services/apiKeyService";

const isAuthenticated = ref(false);
const password = ref("");
const apiKeys = ref<ApiKey[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);
const showAddForm = ref(false);
const editingKey = ref<ApiKey | null>(null);
const revealedKeys = ref<Set<number>>(new Set());

const formData = ref<ApiKeyInput>({
  website: "",
  mainSite: "",
  apiKey: "",
  balance: 0,
  expiryDate: "",
});

const totalKeys = computed(() => apiKeys.value.length);
const activeKeys = computed(() => apiKeys.value.filter((key) => apiKeyService.getKeyStatus(key.expiryDate) === "active").length);
const totalBalance = computed(() => apiKeys.value.reduce((sum, key) => sum + key.balance, 0));
const isFormValid = computed(() =>
  formData.value.website.trim() &&
  formData.value.mainSite.trim() &&
  formData.value.apiKey.trim() &&
  formData.value.expiryDate
);

const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入管理员密码";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const ok = await apiKeyService.verifyAdminPassword(password.value);
    if (ok) {
      apiKeyService.setAdminToken(password.value);
      isAuthenticated.value = true;
      await loadApiKeys();
    } else {
      error.value = "密码错误";
    }
  } catch {
    error.value = "验证失败";
  } finally {
    loading.value = false;
  }
};

const loadApiKeys = async () => {
  loading.value = true;
  try {
    const result = await apiKeyService.getAllApiKeys();
    apiKeys.value = result.success && result.data ? result.data : [];
    if (!result.success) error.value = "密钥列表加载失败。";
  } catch {
    error.value = "密钥列表加载失败。";
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  refreshing.value = true;
  await loadApiKeys();
  refreshing.value = false;
};

const resetForm = () => {
  formData.value = { website: "", mainSite: "", apiKey: "", balance: 0, expiryDate: "" };
  editingKey.value = null;
  showAddForm.value = false;
};

const showAdd = () => {
  resetForm();
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  formData.value.expiryDate = expiry.toISOString().split("T")[0];
  showAddForm.value = true;
};

const showEdit = (key: ApiKey) => {
  formData.value = {
    website: key.website,
    mainSite: key.mainSite,
    apiKey: key.apiKey,
    balance: key.balance,
    expiryDate: key.expiryDate.split("T")[0],
  };
  editingKey.value = key;
  showAddForm.value = true;
};

const submitForm = async () => {
  if (!isFormValid.value) return;
  try {
    new URL(formData.value.mainSite);
  } catch {
    error.value = "请输入有效 URL";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const result = editingKey.value
      ? await apiKeyService.updateApiKey(editingKey.value.id, formData.value)
      : await apiKeyService.addApiKey(formData.value);
    if (result.success) {
      await loadApiKeys();
      resetForm();
    } else {
      error.value = "密钥保存失败。";
    }
  } catch {
    error.value = "密钥保存失败。";
  } finally {
    loading.value = false;
  }
};

const deleteKey = async (key: ApiKey) => {
  if (!confirm(`确定删除 ${key.website} 的密钥？`)) return;
  loading.value = true;
  try {
    const result = await apiKeyService.deleteApiKey(key.id);
    if (result.success) await loadApiKeys();
    else error.value = "密钥删除失败。";
  } catch {
    error.value = "密钥删除失败。";
  } finally {
    loading.value = false;
  }
};

const toggleReveal = (id: number) => {
  if (revealedKeys.value.has(id)) revealedKeys.value.delete(id);
  else revealedKeys.value.add(id);
};

const copyKey = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

const statusLabel = (status: string) => ({ active: "有效", expiring: "即将过期", expired: "已过期" }[status] ?? status);

const logout = () => {
  apiKeyService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  apiKeys.value = [];
  resetForm();
};

onMounted(() => {
  const token = apiKeyService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadApiKeys();
  }
});
</script>

<template>
  <div class="apikeys-view page-shell">
    <div class="container">
      <section v-if="!isAuthenticated" class="login-layout">
        <div>
          <span class="page-tag">API Keys</span>
          <h1 class="page-title">密钥管理</h1>
          <p class="page-sub">集中查看服务密钥、余额和有效期，减少过期和遗漏。</p>
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
            <span class="page-tag">API Keys</span>
            <h1 class="page-title">密钥库存</h1>
            <p class="page-sub">查看余额、过期状态，并维护服务密钥。</p>
          </div>
          <div class="head-actions">
            <button class="btn" @click="showAdd">添加</button>
            <button class="btn btn-ghost" @click="refreshData" :disabled="refreshing">{{ refreshing ? "刷新中" : "刷新" }}</button>
            <button class="btn btn-ghost" @click="logout">退出</button>
          </div>
        </header>

        <section class="metrics">
          <div class="metric panel"><span>总数</span><strong>{{ totalKeys }}</strong></div>
          <div class="metric panel"><span>有效</span><strong>{{ activeKeys }}</strong></div>
          <div class="metric panel"><span>余额</span><strong>{{ apiKeyService.formatBalance(totalBalance) }}</strong></div>
        </section>

        <p v-if="error" class="soft-alert">{{ error }} <button @click="error = null">关闭</button></p>

        <div v-if="loading && !showAddForm" class="state-box panel">
          <div class="spinner"></div>
        </div>

        <section v-else class="key-grid">
          <article v-for="key in apiKeys" :key="key.id" class="key-card panel">
            <header>
              <div>
                <h2>{{ key.website }}</h2>
                <a :href="key.mainSite" target="_blank">{{ key.mainSite.replace(/^https?:\/\//, "") }}</a>
              </div>
              <span :class="['status-pill', apiKeyService.getKeyStatus(key.expiryDate)]">
                {{ statusLabel(apiKeyService.getKeyStatus(key.expiryDate)) }}
              </span>
            </header>
            <div class="key-line">
              <code>{{ revealedKeys.has(key.id) ? key.apiKey : apiKeyService.maskApiKey(key.apiKey) }}</code>
              <button class="icon-btn" @click="toggleReveal(key.id)" title="显示或隐藏">显示</button>
              <button class="icon-btn" @click="copyKey(key.apiKey)" title="复制">复制</button>
            </div>
            <div class="meta">
              <span>余额 {{ apiKeyService.formatBalance(key.balance) }}</span>
              <span>有效期 {{ key.expiryDate.split("T")[0] }}</span>
            </div>
            <footer>
              <button class="btn btn-ghost" @click="showEdit(key)">编辑</button>
              <button class="btn btn-ghost" @click="deleteKey(key)">删除</button>
            </footer>
          </article>

          <div v-if="apiKeys.length === 0" class="state-box panel empty">
            <p>暂无密钥记录。</p>
          </div>
        </section>
      </template>
    </div>

    <div v-if="showAddForm" class="modal-overlay" @click="resetForm">
      <form class="modal panel" @click.stop @submit.prevent="submitForm">
        <header>
          <h2>{{ editingKey ? "编辑密钥" : "添加密钥" }}</h2>
          <button type="button" @click="resetForm">关闭</button>
        </header>
        <label>服务名<input v-model="formData.website" required placeholder="OpenAI" /></label>
        <label>官网 URL<input v-model="formData.mainSite" type="url" required placeholder="https://openai.com" /></label>
        <label>API Key<input v-model="formData.apiKey" required placeholder="sk-..." /></label>
        <div class="form-row">
          <label>余额<input v-model.number="formData.balance" type="number" step="0.01" /></label>
          <label>有效期<input v-model="formData.expiryDate" type="date" required /></label>
        </div>
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
.modal h2 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
}

.login-panel p,
.soft-alert {
  color: var(--text-soft);
}

.head-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.metric {
  min-height: 132px;
  display: grid;
  align-content: end;
  padding: 20px;
}

.metric span {
  color: var(--text-muted);
  font-weight: 800;
}

.metric strong {
  color: var(--accent);
  font-size: 2.4rem;
  line-height: 1;
  font-weight: 800;
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.key-card {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.key-card header,
.key-card footer,
.meta,
.key-line,
.modal header,
.modal footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.key-card h2 {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
}

.key-card a,
.meta {
  color: var(--text-soft);
  font-size: 0.82rem;
}

.status-pill.active {
  border-color: rgba(83, 198, 176, 0.5);
  color: var(--accent-2);
}

.status-pill.expiring {
  border-color: rgba(240, 179, 91, 0.6);
  color: var(--accent);
}

.status-pill.expired {
  border-color: rgba(239, 111, 108, 0.6);
  color: var(--accent-3);
}

.key-line {
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
}

.key-line .icon-btn {
  width: auto;
  padding: 0 10px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
}

code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
}

.empty {
  grid-column: 1 / -1;
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
  width: min(520px, 100%);
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

@media (max-width: 760px) {
  .login-layout,
  .metrics,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
