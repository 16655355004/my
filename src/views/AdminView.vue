<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

// 状态管理
const isAuthenticated = ref(false);
const password = ref("");
const websites = ref<Website[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// 表单状态
const showAddForm = ref(false);
const editingWebsite = ref<Website | null>(null);
const formData = ref({
  name: "",
  description: "",
  url: "",
  icon: "🔗",
  category: "",
  color: "#00d4ff",
});

// 预设分类和颜色
const predefinedCategories = [
  "开发工具",
  "系统工具",
  "效率工具",
  "设计工具",
  "学习资源",
  "娱乐",
  "其他",
];
const predefinedColors = [
  "#00d4ff",
  "#ff3366",
  "#8b5cf6",
  "#00ff88",
  "#ffa500",
  "#ff69b4",
  "#32cd32",
];

// 验证管理员密码
const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入管理员密码";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const isValid = await bookmarkService.verifyAdminPassword(password.value);

    if (isValid) {
      bookmarkService.setAdminToken(password.value);
      isAuthenticated.value = true;
      await loadWebsites();
    } else {
      error.value = "密码错误";
    }
  } catch (err) {
    error.value = "验证失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

// 加载网站数据
const loadWebsites = async () => {
  loading.value = true;
  try {
    const response = await bookmarkService.getAllBookmarks();
    if (response.success && response.data) {
      websites.value = response.data;
    } else {
      error.value = response.error || "加载数据失败";
    }
  } catch (err) {
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    name: "",
    description: "",
    url: "",
    icon: "🔗",
    category: "",
    color: "#00d4ff",
  };
  editingWebsite.value = null;
  showAddForm.value = false;
};

// 显示添加表单
const showAdd = () => {
  resetForm();
  showAddForm.value = true;
};

// 显示编辑表单
const showEdit = (website: Website) => {
  formData.value = { ...website };
  editingWebsite.value = website;
  showAddForm.value = true;
};

// 提交表单
const submitForm = async () => {
  // 表单验证
  if (
    !formData.value.name.trim() ||
    !formData.value.url.trim() ||
    !formData.value.description.trim()
  ) {
    error.value = "请填写所有必填字段";
    return;
  }

  // URL 验证
  try {
    new URL(formData.value.url);
  } catch {
    error.value = "请输入有效的网址";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    let response;
    if (editingWebsite.value) {
      // 更新
      response = await bookmarkService.updateBookmark(editingWebsite.value.id, formData.value);
    } else {
      // 添加
      response = await bookmarkService.addBookmark(formData.value);
    }

    if (response.success) {
      await loadWebsites();
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

// 删除网站
const deleteWebsite = async (website: Website) => {
  if (!confirm(`确定要删除 "${website.name}" 吗？`)) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await bookmarkService.deleteBookmark(website.id);
    if (response.success) {
      await loadWebsites();
    } else {
      error.value = response.error || "删除失败";
    }
  } catch (err) {
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

// 退出登录
const logout = () => {
  bookmarkService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  websites.value = [];
  resetForm();
};

// 检查是否已登录
onMounted(() => {
  const token = bookmarkService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadWebsites();
  }
});

// 计算属性
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() && formData.value.url.trim() && formData.value.description.trim()
  );
});
</script>

<template>
  <div class="admin-view">
    <div class="container">
      <!-- 登录界面 -->
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card">
          <h1 class="login-title">管理员登录</h1>
          <p class="login-subtitle">请输入管理员密码以管理书签</p>

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
              <span v-else>登录</span>
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
            <h1 class="page-title">书签管理</h1>
            <p class="page-subtitle">管理你的网站收藏</p>
          </div>
          <div class="header-right">
            <button @click="showAdd" class="add-btn">
              <span class="btn-icon">+</span>
              添加书签
            </button>
            <button @click="logout" class="logout-btn">退出</button>
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

        <!-- 网站列表 -->
        <div v-else class="websites-list">
          <div v-for="website in websites" :key="website.id" class="website-item">
            <div class="website-info">
              <div class="website-icon">{{ website.icon }}</div>
              <div class="website-details">
                <h3 class="website-name">{{ website.name }}</h3>
                <p class="website-description">{{ website.description }}</p>
                <div class="website-meta">
                  <span class="website-category">{{ website.category }}</span>
                  <span class="website-url">{{ website.url }}</span>
                </div>
              </div>
            </div>
            <div class="website-actions">
              <button @click="showEdit(website)" class="edit-btn">编辑</button>
              <button @click="deleteWebsite(website)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && websites.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>还没有书签</h3>
          <p>点击"添加书签"按钮开始添加你的第一个书签</p>
        </div>
      </div>

      <!-- 添加/编辑表单模态框 -->
      <div v-if="showAddForm" class="modal-overlay" @click="resetForm">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingWebsite ? "编辑书签" : "添加书签" }}</h2>
            <button @click="resetForm" class="close-btn">×</button>
          </div>

          <form @submit.prevent="submitForm" class="bookmark-form">
            <div class="form-row">
              <div class="form-group">
                <label>网站名称 *</label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="例如：GitHub"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label>图标</label>
                <input
                  v-model="formData.icon"
                  type="text"
                  placeholder="🔗"
                  class="form-input icon-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label>网站描述 *</label>
              <textarea
                v-model="formData.description"
                placeholder="简短描述这个网站的用途..."
                class="form-textarea"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>网站地址 *</label>
              <input
                v-model="formData.url"
                type="url"
                placeholder="https://example.com"
                class="form-input"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>分类</label>
                <select v-model="formData.category" class="form-select">
                  <option value="">选择分类</option>
                  <option v-for="cat in predefinedCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>主题色</label>
                <div class="color-picker">
                  <input v-model="formData.color" type="color" class="color-input" />
                  <div class="color-presets">
                    <button
                      v-for="color in predefinedColors"
                      :key="color"
                      type="button"
                      class="color-preset"
                      :style="{ backgroundColor: color }"
                      @click="formData.color = color"
                    ></button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="resetForm" class="cancel-btn">取消</button>
              <button type="submit" class="submit-btn" :disabled="loading || !isFormValid">
                <span v-if="loading">保存中...</span>
                <span v-else>{{ editingWebsite ? "更新" : "添加" }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  padding-top: 8rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, var(--background-color) 0%, #0f0f1a 100%);
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
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.login-subtitle {
  color: rgba(232, 232, 240, 0.7);
  margin-bottom: 2rem;
}

.login-form {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  color: var(--accent-color);
  font-size: 0.9rem;
  margin-top: 1rem;
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
  font-size: 3rem;
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

.btn-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.logout-btn {
  background: rgba(255, 51, 102, 0.2);
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: var(--accent-color);
  color: var(--background-color);
}

/* 错误横幅 */
.error-banner {
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid var(--accent-color);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-color);
}

.error-icon {
  font-size: 1.2rem;
}

.close-error {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: auto;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(232, 232, 240, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 212, 255, 0.3);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 网站列表样式 */
.websites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.website-item {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.website-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.website-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.website-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.website-details {
  flex: 1;
}

.website-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.3rem;
}

.website-description {
  color: rgba(232, 232, 240, 0.7);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.website-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.website-category {
  background: rgba(0, 212, 255, 0.2);
  color: var(--primary-color);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.website-url {
  color: rgba(232, 232, 240, 0.5);
  font-family: monospace;
}

.website-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: rgba(0, 212, 255, 0.2);
  color: var(--primary-color);
}

.edit-btn:hover {
  background: var(--primary-color);
  color: var(--background-color);
}

.delete-btn {
  background: rgba(255, 51, 102, 0.2);
  color: var(--accent-color);
}

.delete-btn:hover {
  background: var(--accent-color);
  color: var(--background-color);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(232, 232, 240, 0.6);
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

/* 模态框样式 */
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
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  color: rgba(232, 232, 240, 0.7);
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.bookmark-form {
  padding: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: end;
}

.form-group label {
  display: block;
  color: var(--text-color);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-textarea {
  width: 100%;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 10px;
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.icon-input {
  max-width: 80px;
  text-align: center;
  font-size: 1.2rem;
}

.form-select {
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

.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
}

.color-presets {
  display: flex;
  gap: 0.5rem;
}

.color-preset {
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.color-preset:hover {
  border-color: var(--text-color);
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(232, 232, 240, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-color);
}

.submit-btn {
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-view {
    padding-top: 6rem;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 2.5rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .website-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .website-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .bookmark-form {
    padding: 1.5rem;
  }
}
</style>
