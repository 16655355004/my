<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

const isAuthenticated = ref(false);
const password = ref("");
const websites = ref<Website[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showAddForm = ref(false);
const editingWebsite = ref<Website | null>(null);

const formData = ref({
  name: "",
  description: "",
  url: "",
  icon: "LK",
  category: "",
  color: "#f0b35b",
});

const categories = ["开发工具", "系统工具", "效率工具", "设计工具", "学习资源", "娱乐", "其他"];
const isFormValid = computed(() => formData.value.name.trim() && formData.value.url.trim() && formData.value.description.trim());

const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入管理员密码";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const ok = await bookmarkService.verifyAdminPassword(password.value);
    if (ok) {
      bookmarkService.setAdminToken(password.value);
      isAuthenticated.value = true;
      await loadWebsites();
    } else {
      error.value = "密码错误";
    }
  } catch {
    error.value = "登录失败，请稍后再试。";
  } finally {
    loading.value = false;
  }
};

const loadWebsites = async () => {
  loading.value = true;
  try {
    const result = await bookmarkService.getAllBookmarks();
    websites.value = result.success && result.data ? result.data : [];
    if (!result.success) error.value = "收藏列表加载失败。";
  } catch {
    error.value = "收藏列表加载失败。";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.value = { name: "", description: "", url: "", icon: "LK", category: "", color: "#f0b35b" };
  editingWebsite.value = null;
  showAddForm.value = false;
};

const showAdd = () => {
  resetForm();
  showAddForm.value = true;
};

const showEdit = (website: Website) => {
  formData.value = {
    name: website.name,
    description: website.description,
    url: website.url,
    icon: website.icon,
    category: website.category,
    color: website.color,
  };
  editingWebsite.value = website;
  showAddForm.value = true;
};

const submitForm = async () => {
  if (!isFormValid.value) return;
  try {
    new URL(formData.value.url);
  } catch {
    error.value = "请输入有效 URL";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const result = editingWebsite.value
      ? await bookmarkService.updateBookmark(editingWebsite.value.id, formData.value)
      : await bookmarkService.addBookmark(formData.value);
    if (result.success) {
      await loadWebsites();
      resetForm();
    } else {
      error.value = "收藏保存失败。";
    }
  } catch {
    error.value = "收藏保存失败。";
  } finally {
    loading.value = false;
  }
};

const deleteWebsite = async (website: Website) => {
  if (!confirm(`确定删除 ${website.name}？`)) return;
  loading.value = true;
  try {
    const result = await bookmarkService.deleteBookmark(website.id);
    if (result.success) await loadWebsites();
    else error.value = "收藏删除失败。";
  } catch {
    error.value = "收藏删除失败。";
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  bookmarkService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  websites.value = [];
  resetForm();
};

onMounted(() => {
  const token = bookmarkService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadWebsites();
  }
});
</script>

<template>
  <div class="admin-view page-shell">
    <div class="container">
      <section v-if="!isAuthenticated" class="login-layout">
        <div>
          <span class="page-tag">Admin</span>
          <h1 class="page-title">收藏管理</h1>
          <p class="page-sub">维护常用站点入口，让首页和收藏页保持干净有序。</p>
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
            <span class="page-tag">Admin</span>
            <h1 class="page-title">收藏后台</h1>
            <p class="page-sub">新增、编辑和删除收藏入口。</p>
          </div>
          <div class="head-actions">
            <button class="btn" @click="showAdd">添加</button>
            <button class="btn btn-ghost" @click="logout">退出</button>
          </div>
        </header>

        <p v-if="error" class="soft-alert">{{ error }} <button @click="error = null">关闭</button></p>

        <div v-if="loading && !showAddForm" class="state-box panel">
          <div class="spinner"></div>
        </div>

        <section v-else class="admin-list">
          <article v-for="website in websites" :key="website.id" class="admin-row panel">
            <div class="site-info">
              <span class="site-icon" :style="{ borderColor: website.color || 'var(--line)' }">
                {{ (website.icon || website.name.slice(0, 2)).slice(0, 2) }}
              </span>
              <div>
                <h2>{{ website.name }}</h2>
                <p>{{ website.description }}</p>
                <small>{{ website.category }} · {{ website.url }}</small>
              </div>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost" @click="showEdit(website)">编辑</button>
              <button class="btn btn-ghost" @click="deleteWebsite(website)">删除</button>
            </div>
          </article>

          <div v-if="websites.length === 0" class="state-box panel">
            <p>暂无收藏记录。</p>
          </div>
        </section>
      </template>
    </div>

    <div v-if="showAddForm" class="modal-overlay" @click="resetForm">
      <form class="modal panel" @click.stop @submit.prevent="submitForm">
        <header>
          <h2>{{ editingWebsite ? "编辑收藏" : "添加收藏" }}</h2>
          <button type="button" @click="resetForm">关闭</button>
        </header>
        <div class="form-row">
          <label>名称<input v-model="formData.name" required placeholder="GitHub" /></label>
          <label>图标<input v-model="formData.icon" maxlength="2" placeholder="GH" /></label>
        </div>
        <label>描述<textarea v-model="formData.description" required rows="4" placeholder="简短描述"></textarea></label>
        <label>网址<input v-model="formData.url" type="url" required placeholder="https://" /></label>
        <div class="form-row">
          <label>分类
            <select v-model="formData.category">
              <option value="">选择分类</option>
              <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>
          <label>颜色<input v-model="formData.color" type="color" /></label>
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

.head-actions,
.row-actions,
.modal header,
.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-list {
  display: grid;
  gap: 12px;
}

.admin-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px;
}

.site-info {
  min-width: 0;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.site-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-weight: 800;
}

.admin-row h2 {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 800;
}

.admin-row p {
  color: var(--text-muted);
}

.admin-row small {
  color: var(--text-soft);
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
  grid-template-columns: 1fr 120px;
  gap: 12px;
}

input[type="color"] {
  min-height: 48px;
  padding: 6px;
}

@media (max-width: 760px) {
  .login-layout,
  .form-row {
    grid-template-columns: 1fr;
  }

  .admin-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
