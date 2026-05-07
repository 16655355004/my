<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { messageService, type Message, type MessageInput } from "../services/bookmarkService";

const messages = ref<Message[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);
const toastVisible = ref(false);

const form = ref<MessageInput>({ name: "", content: "" });

const isFormValid = computed(
  () => form.value.name.trim().length > 0 && form.value.content.trim().length > 0
);

const loadMessages = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await messageService.getAllMessages();
    if (res.success && res.data) {
      messages.value = (res.data.messages ?? []).sort(
        (a: Message, b: Message) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      error.value = res.error ?? "加载留言失败";
      messages.value = [];
    }
  } catch {
    error.value = "网络连接失败";
    messages.value = [];
  } finally {
    loading.value = false;
  }
};

const submitMessage = async () => {
  if (!isFormValid.value || submitting.value) return;
  submitting.value = true;
  try {
    const res = await messageService.addMessage({
      name: form.value.name.trim(),
      content: form.value.content.trim(),
    });
    if (res.success) {
      await loadMessages();
      form.value = { name: "", content: "" };
      showToast();
    } else {
      error.value = res.error ?? "提交失败";
    }
  } catch {
    error.value = "网络连接失败";
  } finally {
    submitting.value = false;
  }
};

const showToast = () => {
  toastVisible.value = true;
  setTimeout(() => { toastVisible.value = false; }, 3000);
};

const formatDate = (d: string) => {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1)  return "刚刚";
  if (hr  < 1)  return `${min}分钟前`;
  if (day < 1)  return `${hr}小时前`;
  if (day < 30) return `${day}天前`;
  return date.toLocaleDateString("zh-CN");
};

onMounted(loadMessages);
</script>

<template>
  <div class="messages-view">
    <div class="container">
      <!-- 页头 -->
      <div class="page-head">
        <span class="page-tag">MESSAGES</span>
        <h1 class="page-title">留言板</h1>
        <p class="page-sub">分享你的想法，留下美好的回忆</p>
      </div>

      <!-- 表单 -->
      <div class="form-section">
        <h2 class="form-title">写下留言</h2>
        <form @submit.prevent="submitMessage" class="msg-form">
          <div class="form-row">
            <label class="form-label">姓名</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="请输入姓名"
              maxlength="20"
              required
            />
          </div>

          <div class="form-row">
            <label class="form-label">
              内容
              <span class="char-hint">{{ form.content.length }} / 500</span>
            </label>
            <textarea
              v-model="form.content"
              class="form-input"
              placeholder="分享你的想法…"
              rows="4"
              maxlength="500"
              required
            ></textarea>
          </div>

          <button type="submit" class="btn" :disabled="!isFormValid || submitting">
            {{ submitting ? "提交中…" : "发送留言" }}
          </button>
        </form>
      </div>

      <!-- 留言列表 -->
      <div class="list-section">
        <div class="list-head">
          <h2 class="list-title">所有留言</h2>
          <button class="btn btn-ghost" @click="loadMessages" :disabled="loading">
            <svg class="icon-refresh" :class="{ spin: loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            刷新
          </button>
        </div>

        <!-- 加载 -->
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <p>正在加载…</p>
        </div>

        <!-- 错误 -->
        <div v-else-if="error && messages.length === 0" class="state-box">
          <p class="state-title">{{ error }}</p>
          <button class="btn" @click="loadMessages">重试</button>
        </div>

        <!-- 列表 -->
        <div v-else-if="messages.length > 0" class="msg-list">
          <div v-for="msg in messages" :key="msg.id" class="msg-card">
            <div class="msg-head">
              <div class="avatar">{{ msg.name.charAt(0).toUpperCase() }}</div>
              <div class="msg-meta">
                <span class="msg-name">{{ msg.name }}</span>
                <span class="msg-time">{{ formatDate(msg.createdAt) }}</span>
              </div>
            </div>
            <p class="msg-content">{{ msg.content }}</p>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="state-box">
          <p class="state-title">还没有留言</p>
          <p class="state-sub">成为第一个留言的人吧！</p>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <div :class="['toast', { visible: toastVisible }]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      留言提交成功！
    </div>
  </div>
</template>

<style scoped>
.messages-view {
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
}

/* ── 页头 ── */
.page-head {
  padding: 3rem 0 2.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.page-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.page-sub { font-size: 0.95rem; color: var(--text-muted); }

/* ── 表单 ── */
.form-section {
  max-width: 560px;
  margin-bottom: 4rem;
  padding-bottom: 4rem;
  border-bottom: 1px solid var(--border);
}

.form-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 1.75rem;
  letter-spacing: 0.02em;
}

.msg-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row { display: flex; flex-direction: column; gap: 0.4rem; }

.form-label {
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-hint { color: var(--text-dim); font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.form-input {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color var(--transition);
  resize: vertical;
  font-family: inherit;
}

.form-input:focus { border-color: var(--border-active); }
.form-input::placeholder { color: var(--text-dim); }

/* ── 留言列表 ── */
.list-section {}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-title { font-size: 1rem; font-weight: 500; color: var(--text); }

.icon-refresh {
  width: 14px;
  height: 14px;
  transition: transform var(--transition);
}

.icon-refresh.spin { animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

.msg-list {
  display: flex;
  flex-direction: column;
}

.msg-card {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--border);
}

.msg-card:first-child { border-top: 1px solid var(--border); }

.msg-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.msg-meta { display: flex; flex-direction: column; }
.msg-name { font-size: 0.9rem; font-weight: 500; color: var(--text); }
.msg-time { font-size: 0.75rem; color: var(--text-dim); }

.msg-content {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.7;
  word-break: break-word;
  padding-left: calc(32px + 0.85rem);
}

/* ── 状态 ── */
.state-box {
  padding: 4rem 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.state-title { font-size: 1rem; color: var(--text); }
.state-sub   { font-size: 0.85rem; color: var(--text-dim); }

.spinner {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-hover);
  border-top-color: var(--text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.5rem;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 1.5rem;
  background: var(--text);
  color: var(--bg);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: translateY(16px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  z-index: 500;
  pointer-events: none;
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
