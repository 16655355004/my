<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import gsap from "gsap";
import apiKeyService, { type ApiKey, type ApiKeyInput } from "../services/apiKeyService";

// 状态管理
const isAuthenticated = ref(false);
const password = ref("");
const apiKeys = ref<ApiKey[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const refreshing = ref(false);

// 表单状态
const showAddForm = ref(false);
const editingKey = ref<ApiKey | null>(null);
const formData = ref<ApiKeyInput>({
  website: "",
  mainSite: "",
  apiKey: "",
  balance: 0,
  expiryDate: "",
});

// 验证管理员密码
const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入管理员密码";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const isValid = await apiKeyService.verifyAdminPassword(password.value);

    if (isValid) {
      apiKeyService.setAdminToken(password.value);
      isAuthenticated.value = true;
      await loadApiKeys();
    } else {
      error.value = "密码错误";
    }
  } catch (err) {
    error.value = "验证失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

// 退出登录
const logout = () => {
  apiKeyService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  apiKeys.value = [];
  resetForm();
};

// 加载API密钥数据
const loadApiKeys = async () => {
  loading.value = true;
  try {
    const response = await apiKeyService.getAllApiKeys();
    if (response.success && response.data) {
      apiKeys.value = response.data;
    } else {
      error.value = response.error || "加载数据失败";
    }
  } catch (err) {
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = async () => {
  refreshing.value = true;
  await loadApiKeys();
  refreshing.value = false;
};

// 重置表单
const resetForm = () => {
  formData.value = {
    website: "",
    mainSite: "",
    apiKey: "",
    balance: 0,
    expiryDate: "",
  };
  editingKey.value = null;
  showAddForm.value = false;
};

// 显示添加表单
const showAdd = () => {
  resetForm();
  // 设置默认有效期为一年后
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  formData.value.expiryDate = nextYear.toISOString().split('T')[0];
  showAddForm.value = true;
};

// 显示编辑表单
const showEdit = (key: ApiKey) => {
  formData.value = {
    website: key.website,
    mainSite: key.mainSite,
    apiKey: key.apiKey,
    balance: key.balance,
    expiryDate: key.expiryDate.split('T')[0],
  };
  editingKey.value = key;
  showAddForm.value = true;
};

// 提交表单
const submitForm = async () => {
  // 表单验证
  if (
    !formData.value.website.trim() ||
    !formData.value.mainSite.trim() ||
    !formData.value.apiKey.trim() ||
    !formData.value.expiryDate
  ) {
    error.value = "请填写所有必填字段";
    return;
  }

  // URL 验证
  try {
    new URL(formData.value.mainSite);
  } catch {
    error.value = "请输入有效的网址";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    let response;
    if (editingKey.value) {
      // 更新
      response = await apiKeyService.updateApiKey(editingKey.value.id, formData.value);
    } else {
      // 添加
      response = await apiKeyService.addApiKey(formData.value);
    }

    if (response.success) {
      await loadApiKeys();
      resetForm();
    } else {
      error.value = response.error || "操作失败";
    }
  } catch (err) {
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

// 删除API密钥
const deleteKey = async (key: ApiKey) => {
  if (!confirm(`确定要删除 "${key.website}" 的密钥吗？`)) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await apiKeyService.deleteApiKey(key.id);
    if (response.success) {
      await loadApiKeys();
    } else {
      error.value = response.error || "删除失败";
    }
  } catch (err) {
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // 可以添加一个简单的提示动画
    const el = document.activeElement as HTMLElement;
    if (el) {
      const originalText = el.innerText;
      el.innerText = "已复制!";
      setTimeout(() => {
        el.innerText = originalText;
      }, 1000);
    }
  });
};

// 切换密钥显示/隐藏
const revealedKeys = ref<Set<number>>(new Set());
const toggleReveal = (id: number) => {
  if (revealedKeys.value.has(id)) {
    revealedKeys.value.delete(id);
  } else {
    revealedKeys.value.add(id);
  }
};

// 计算属性
const isFormValid = computed(() => {
  return (
    formData.value.website.trim() &&
    formData.value.mainSite.trim() &&
    formData.value.apiKey.trim() &&
    formData.value.expiryDate
  );
});

const totalKeys = computed(() => apiKeys.value.length);
const activeKeys = computed(() => apiKeys.value.filter(k => apiKeyService.getKeyStatus(k.expiryDate) === 'active').length);
const totalBalance = computed(() => apiKeys.value.reduce((sum, k) => sum + k.balance, 0));

// 检查是否已登录
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
  <div class="apikeys-view">
    <div class="particle-background"></div>
    
    <div class="container">
      <!-- 登录界面 -->
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card">
          <div class="login-header">
            <div class="login-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="login-title">秘钥管理系统</h1>
            <p class="login-subtitle">请输入管理员密码以管理API秘钥</p>
          </div>

          <form @submit.prevent="authenticate" class="login-form">
            <div class="form-group">
              <input
                v-model="password"
                type="password"
                placeholder="管理员密码"
                class="form-input"
                :disabled="loading"
              />
            </div>

            <button type="submit" class="login-btn" :disabled="loading || !password.trim()">
              <span v-if="loading">验证中...</span>
              <span v-else>登录系统</span>
            </button>
          </form>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
      </div>

      <!-- 管理界面 -->
      <div v-else class="admin-section">
        <!-- 头部 -->
        <div class="admin-header">
          <div class="header-left">
            <h1 class="page-title">秘钥管理</h1>
            <p class="page-subtitle">管理您的API服务秘钥</p>
          </div>
          <div class="header-right">
            <button @click="showAdd" class="add-btn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
              </svg>
              添加秘钥
            </button>
            <button @click="logout" class="logout-btn">退出</button>
          </div>
        </div>

        <!-- 状态卡片 -->
        <div class="status-grid">
          <div class="status-card primary">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="card-content">
              <h3>总秘钥数</h3>
              <p class="value-text">{{ totalKeys }}</p>
            </div>
          </div>

          <div class="status-card success">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="card-content">
              <h3>活跃秘钥</h3>
              <p class="value-text">{{ activeKeys }}</p>
            </div>
          </div>

          <div class="status-card warning">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="card-content">
              <h3>总余额</h3>
              <p class="value-text">{{ apiKeyService.formatBalance(totalBalance) }}</p>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-banner">
          <span class="error-icon">⚠️</span>
          {{ error }}
          <button @click="error = null" class="close-error">×</button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading && !showAddForm" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 秘钥列表 -->
        <div v-else class="keys-list">
          <div class="list-header">
            <h2>秘钥列表</h2>
            <button @click="refreshData" class="refresh-btn" :disabled="refreshing">
              <svg :class="{ spinning: refreshing }" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <path d="M23 4v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              刷新
            </button>
          </div>

          <div v-if="apiKeys.length === 0" class="empty-state">
            <div class="empty-icon">🔑</div>
            <h3>暂无秘钥记录</h3>
            <p>点击上方"添加秘钥"按钮开始添加</p>
          </div>

          <div v-else class="keys-grid">
            <div v-for="key in apiKeys" :key="key.id" class="key-card">
              <div class="key-header">
                <div class="key-title">
                  <h3>{{ key.website }}</h3>
                  <a :href="key.mainSite" target="_blank" class="site-link">
                    {{ key.mainSite }}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </a>
                </div>
                <div class="key-status" :class="apiKeyService.getKeyStatus(key.expiryDate)">
                  {{ apiKeyService.getKeyStatus(key.expiryDate) === 'active' ? '有效' : 
                     apiKeyService.getKeyStatus(key.expiryDate) === 'expiring' ? '即将过期' : '已过期' }}
                </div>
              </div>

              <div class="key-body">
                <div class="info-row">
                  <span class="label">秘钥:</span>
                  <div class="key-value-container">
                    <code class="key-value">
                      {{ revealedKeys.has(key.id) ? key.apiKey : apiKeyService.maskApiKey(key.apiKey) }}
                    </code>
                    <div class="key-actions">
                      <button @click="toggleReveal(key.id)" class="icon-btn" title="显示/隐藏">
                        <svg v-if="revealedKeys.has(key.id)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button @click="copyToClipboard(key.apiKey)" class="icon-btn" title="复制">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="info-row">
                  <span class="label">余额:</span>
                  <span class="balance-value">{{ apiKeyService.formatBalance(key.balance) }}</span>
                </div>

                <div class="info-row">
                  <span class="label">有效期:</span>
                  <span class="date-value">{{ key.expiryDate.split('T')[0] }}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">添加时间:</span>
                  <span class="date-value">{{ new Date(key.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>

              <div class="key-footer">
                <button @click="showEdit(key)" class="edit-btn">编辑</button>
                <button @click="deleteKey(key)" class="delete-btn">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑表单模态框 -->
      <div v-if="showAddForm" class="modal-overlay" @click="resetForm">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingKey ? "编辑秘钥" : "添加秘钥" }}</h2>
            <button @click="resetForm" class="close-btn">×</button>
          </div>

          <form @submit.prevent="submitForm" class="apikey-form">
            <div class="form-group">
              <label>官网 (服务名称) *</label>
              <input
                v-model="formData.website"
                type="text"
                placeholder="例如：OpenAI"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label>主站 (URL) *</label>
              <input
                v-model="formData.mainSite"
                type="url"
                placeholder="https://openai.com"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label>秘钥 (API Key) *</label>
              <input
                v-model="formData.apiKey"
                type="text"
                placeholder="sk-..."
                class="form-input code-input"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>余额 ($) *</label>
                <input
                  v-model.number="formData.balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label>有效期 *</label>
                <input
                  v-model="formData.expiryDate"
                  type="date"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="resetForm" class="cancel-btn">取消</button>
              <button type="submit" class="submit-btn" :disabled="loading || !isFormValid">
                <span v-if="loading">保存中...</span>
                <span v-else>{{ editingKey ? "更新" : "添加" }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apikeys-view {
  min-height: 100vh;
  padding-top: 8rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, var(--background-color) 0%, #0f0f1a 100%);
  color: var(--text-color);
}

.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background: transparent;
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 登录界面样式 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.login-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  color: var(--primary-color);
  background: rgba(0, 212, 255, 0.1);
  border-radius: 50%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: rgba(232, 232, 240, 0.7);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(232, 232, 240, 0.8);
}

.form-input {
  width: 100%;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 10px;
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ff3366;
  font-size: 0.9rem;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(255, 51, 102, 0.1);
  border-radius: 8px;
}

/* 管理界面样式 */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: rgba(232, 232, 240, 0.7);
  font-size: 1.1rem;
}

.header-right {
  display: flex;
  gap: 1rem;
}

.add-btn {
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

.logout-btn {
  background: rgba(255, 51, 102, 0.1);
  color: #ff3366;
  border: 1px solid rgba(255, 51, 102, 0.3);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 51, 102, 0.2);
  border-color: #ff3366;
}

/* 状态卡片 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.status-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.3s ease;
}

.status-card:hover {
  transform: translateY(-5px);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.status-card.primary .card-icon {
  background: rgba(0, 212, 255, 0.1);
  color: var(--primary-color);
}

.status-card.success .card-icon {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
}

.status-card.warning .card-icon {
  background: rgba(255, 165, 0, 0.1);
  color: #ffa500;
}

.card-content h3 {
  font-size: 0.9rem;
  color: rgba(232, 232, 240, 0.6);
  margin-bottom: 0.3rem;
}

.value-text {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
}

/* 秘钥列表 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.keys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.key-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.key-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.key-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.key-title h3 {
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: var(--text-color);
}

.site-link {
  font-size: 0.9rem;
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.site-link:hover {
  text-decoration: underline;
}

.key-status {
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
}

.key-status.active {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.key-status.expiring {
  background: rgba(255, 165, 0, 0.15);
  color: #ffa500;
}

.key-status.expired {
  background: rgba(255, 51, 102, 0.15);
  color: #ff3366;
}

.key-body {
  flex: 1;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
}

.label {
  width: 80px;
  color: rgba(232, 232, 240, 0.6);
  font-size: 0.9rem;
}

.key-value-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

.key-value {
  flex: 1;
  font-family: monospace;
  font-size: 0.9rem;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-actions {
  display: flex;
  gap: 0.2rem;
}

.icon-btn {
  background: none;
  border: none;
  color: rgba(232, 232, 240, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.balance-value {
  font-weight: 600;
  color: #00ff88;
  font-size: 1.1rem;
}

.date-value {
  color: rgba(232, 232, 240, 0.8);
  font-size: 0.9rem;
}

.key-footer {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.edit-btn, .delete-btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: rgba(0, 212, 255, 0.1);
  color: var(--primary-color);
}

.edit-btn:hover {
  background: var(--primary-color);
  color: var(--background-color);
}

.delete-btn {
  background: rgba(255, 51, 102, 0.1);
  color: #ff3366;
}

.delete-btn:hover {
  background: #ff3366;
  color: white;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(232, 232, 240, 0.5);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-color);
}

.apikey-form {
  padding: 2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.code-input {
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(232, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .apikeys-view {
    padding-top: 6rem;
  }
  
  .keys-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
