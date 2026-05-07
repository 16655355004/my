<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

const isAuthenticated = ref(false);
const password = ref("");
const websites = ref<Website[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showAddForm = ref(false);
const editingWebsite = ref<Website | null>(null);
const formData = ref({
  name: "", description: "", url: "", icon: "🔗", category: "", color: "#ffffff",
});

const predefinedCategories = ["开发工具", "系统工具", "效率工具", "设计工具", "学习资源", "娱乐", "其他"];

const isFormValid = computed(
  () => formData.value.name.trim() && formData.value.url.trim() && formData.value.description.trim()
);

const authenticate = async () => {
  if (!password.value.trim()) { error.value = "请输入管理员密码"; return; }
  loading.value = true; error.value = null;
  try {
    const ok = await bookmarkService.verifyAdminPassword(password.value);
    if (ok) { bookmarkService.setAdminToken(password.value); isAuthenticated.value = true; await loadWebsites(); }
    else error.value = "密码错误";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const loadWebsites = async () => {
  loading.value = true;
  try {
    const res = await bookmarkService.getAllBookmarks();
    websites.value = res.success && res.data ? res.data : [];
    if (!res.success) error.value = res.error ?? "加载失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const resetForm = () => {
  formData.value = { name: "", description: "", url: "", icon: "🔗", category: "", color: "#ffffff" };
  editingWebsite.value = null; showAddForm.value = false;
};

const showAdd  = () => { resetForm(); showAddForm.value = true; };
const showEdit = (w: Website) => { formData.value = { ...w }; editingWebsite.value = w; showAddForm.value = true; };

const submitForm = async () => {
  if (!isFormValid.value) return;
  try { new URL(formData.value.url); } catch { error.value = "请输入有效的网址"; return; }
  loading.value = true; error.value = null;
  try {
    const res = editingWebsite.value
      ? await bookmarkService.updateBookmark(editingWebsite.value.id, formData.value)
      : await bookmarkService.addBookmark(formData.value);
    if (res.success) { await loadWebsites(); resetForm(); }
    else error.value = res.error ?? "操作失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const deleteWebsite = async (w: Website) => {
  if (!confirm(`确定要删除 "${w.name}" 吗？`)) return;
  loading.value = true;
  try {
    const res = await bookmarkService.deleteBookmark(w.id);
    if (res.success) await loadWebsites();
    else error.value = res.error ?? "删除失败";
  } catch { error.value = "网络连接失败"; }
  finally { loading.value = false; }
};

const logout = () => {
  bookmarkService.clearAdminToken();
  isAuthenticated.value = false; password.value = "";
  websites.value = []; resetForm();
};

onMounted(() => {
  const tok = bookmarkService.getAdminToken();
  if (tok) { password.value = tok; isAuthenticated.value = true; loadWebsites(); }
});
</script>

<template>
  <div class="admin-view">
    <div class="container">
      <!-- ── 登录 ── -->
      <div v-if="!isAuthenticated" class="login-wrap">
        <div class="login-box">
          <span class="page-tag">ADMIN</span>
          <h1 class="login-title">管理员登录</h1>
          <p class="login-sub">输入密码以管理书签内容</p>
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
            <span class="page-tag">ADMIN</span>
            <h1 class="page-title">书签管理</h1>
          </div>
          <div class="head-btns">
            <button class="btn" @click="showAdd">+ 添加</button>
            <button class="btn btn-ghost" @click="logout">退出</button>
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
          <div v-if="websites.length === 0" class="state-box">
            <p class="state-title">暂无书签</p>
            <p class="state-sub">点击"+ 添加"开始添加</p>
          </div>
          <div v-else class="site-list">
            <div v-for="w in websites" :key="w.id" class="site-row">
              <div class="site-info">
                <span class="site-icon-text">{{ w.icon }}</span>
                <div>
                  <p class="site-name">{{ w.name }}</p>
                  <p class="site-desc-small">{{ w.description }}</p>
                  <p class="site-meta">
                    <span class="tag">{{ w.category }}</span>
                    <span class="url-text">{{ w.url }}</span>
                  </p>
                </div>
              </div>
              <div class="row-actions">
                <button class="btn btn-ghost" @click="showEdit(w)">编辑</button>
                <button class="btn btn-ghost danger" @click="deleteWebsite(w)">删除</button>
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
          <h2>{{ editingWebsite ? "编辑书签" : "添加书签" }}</h2>
          <button @click="resetForm" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-grid">
            <div class="form-field">
              <label>网站名称 *</label>
              <input v-model="formData.name" type="text" placeholder="GitHub" required />
            </div>
            <div class="form-field small">
              <label>图标</label>
              <input v-model="formData.icon" type="text" placeholder="🔗" />
            </div>
          </div>
          <div class="form-field">
            <label>描述 *</label>
            <textarea v-model="formData.description" placeholder="简短描述…" required></textarea>
          </div>
          <div class="form-field">
            <label>网址 *</label>
            <input v-model="formData.url" type="url" placeholder="https://" required />
          </div>
          <div class="form-field">
            <label>分类</label>
            <select v-model="formData.category">
              <option value="">选择分类</option>
              <option v-for="c in predefinedCategories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="resetForm">取消</button>
            <button type="submit" class="btn" :disabled="loading || !isFormValid">
              {{ loading ? "保存中…" : (editingWebsite ? "更新" : "添加") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
}

/* ── 登录 ── */
.login-wrap {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 100%;
  max-width: 380px;
  border: 1px solid var(--border);
  padding: 2.5rem;
}

.page-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
}

.login-title {
  font-size: 1.8rem;
  font-weight: 300;
  color: var(--text);
  margin-bottom: 0.4rem;
}

.login-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem; }

.login-form { display: flex; flex-direction: column; gap: 1rem; }

.login-form input {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 0.7rem 1rem;
  outline: none;
  font-family: inherit;
  transition: border-color var(--transition);
}
.login-form input:focus { border-color: var(--border-active); }
.login-form input::placeholder { color: var(--text-dim); }

.error-tip { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem; }

/* ── 管理头部 ── */
.admin-head {
  padding: 3rem 0 2rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: var(--text); }
.head-btns { display: flex; gap: 0.75rem; }

/* ── 错误横幅 ── */
.error-banner {
  border: 1px solid var(--border-hover);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ── 列表 ── */
.site-list { display: flex; flex-direction: column; }

.site-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border);
}

.site-row:first-child { border-top: 1px solid var(--border); }

.site-info { display: flex; align-items: flex-start; gap: 1rem; flex: 1; }
.site-icon-text { font-size: 1.2rem; width: 30px; flex-shrink: 0; margin-top: 2px; }
.site-name { font-size: 0.95rem; font-weight: 600; color: var(--text); margin-bottom: 0.2rem; }
.site-desc-small { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem; }
.site-meta { display: flex; gap: 0.75rem; align-items: center; }

.tag {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  padding: 0.1rem 0.4rem;
  color: var(--text-dim);
}

.url-text { font-size: 0.75rem; color: var(--text-dim); font-family: monospace; }

.row-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

.btn.danger { color: var(--text-muted); }
.btn.danger:hover { background: var(--text); color: var(--bg); }

/* ── 状态 ── */
.state-box {
  padding: 4rem 0;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}

.state-title { font-size: 1rem; color: var(--text); }
.state-sub { font-size: 0.85rem; color: var(--text-dim); }

.spinner {
  width: 22px; height: 22px;
  border: 1px solid var(--border-hover);
  border-top-color: var(--text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 模态框 ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 800; padding: 1.5rem;
}

.modal-box {
  background: var(--bg-2);
  border: 1px solid var(--border);
  width: 100%; max-width: 540px;
  max-height: 90vh; overflow-y: auto;
}

.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-head h2 { font-size: 1rem; font-weight: 600; color: var(--text); }
.close-btn { font-size: 0.9rem; color: var(--text-muted); cursor: pointer; }

.modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

.form-grid { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: end; }

.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.form-field.small input { max-width: 80px; text-align: center; }

.form-field label { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }

.form-field input,
.form-field textarea,
.form-field select {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 0.65rem 0.9rem;
  outline: none;
  font-family: inherit;
  transition: border-color var(--transition);
  resize: vertical;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus { border-color: var(--border-active); }

.form-field input::placeholder,
.form-field textarea::placeholder { color: var(--text-dim); }

.form-field select option { background: var(--bg-2); }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding-top: 0.75rem; border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .site-row { flex-direction: column; align-items: flex-start; }
  .row-actions { align-self: flex-end; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
