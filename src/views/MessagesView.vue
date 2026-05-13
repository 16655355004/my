<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { messageService, type Message, type MessageInput } from "../services/bookmarkService";

const messages = ref<Message[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);
const toastVisible = ref(false);
const form = ref<MessageInput>({ name: "", content: "" });

const isFormValid = computed(() => form.value.name.trim().length > 0 && form.value.content.trim().length > 0);

const loadMessages = async () => {
  loading.value = true;
  error.value = null;
  try {
    const result = await messageService.getAllMessages();
    if (result.success && result.data) {
      messages.value = (result.data.messages ?? []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      messages.value = [];
      error.value = "留言暂时没有同步成功。";
    }
  } catch {
    messages.value = [];
    error.value = "留言暂时没有同步成功。";
  } finally {
    loading.value = false;
  }
};

const submitMessage = async () => {
  if (!isFormValid.value || submitting.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const result = await messageService.addMessage({
      name: form.value.name.trim(),
      content: form.value.content.trim(),
    });
    if (result.success) {
      form.value = { name: "", content: "" };
      await loadMessages();
      toastVisible.value = true;
      window.setTimeout(() => (toastVisible.value = false), 2600);
    } else {
      error.value = "留言发送失败，请稍后再试。";
    }
  } catch {
    error.value = "留言发送失败，请稍后再试。";
  } finally {
    submitting.value = false;
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

onMounted(loadMessages);
</script>

<template>
  <div class="messages-view page-shell">
    <div class="container">
      <header class="page-hero">
        <div>
          <span class="page-tag">Messages</span>
          <h1 class="page-title">留言墙</h1>
          <p class="page-sub">把想说的话留在这里。每条留言都会成为这个站点的一部分。</p>
        </div>
        <div class="panel count-card">
          <strong>{{ messages.length }}</strong>
          <span>条留言</span>
        </div>
      </header>

      <div class="message-layout">
        <form class="message-form panel" @submit.prevent="submitMessage">
          <span class="section-kicker">Write</span>
          <h2>写下留言</h2>
          <label>
            姓名
            <input v-model="form.name" maxlength="20" placeholder="你的名字" required />
          </label>
          <label>
            内容
            <textarea v-model="form.content" maxlength="500" rows="6" placeholder="写下想留下的话" required></textarea>
          </label>
          <div class="form-foot">
            <span>{{ form.content.length }} / 500</span>
            <button class="btn" type="submit" :disabled="!isFormValid || submitting">
              {{ submitting ? "发送中" : "发送留言" }}
            </button>
          </div>
        </form>

        <section class="message-list">
          <div class="list-head">
            <span class="section-kicker">Wall</span>
            <button class="btn btn-ghost" @click="loadMessages" :disabled="loading">
              {{ loading ? "刷新中" : "刷新" }}
            </button>
          </div>

          <p v-if="error" class="soft-alert">{{ error }}</p>

          <div v-if="loading" class="state-box panel">
            <div class="spinner"></div>
            <p>正在加载留言</p>
          </div>

          <div v-else-if="messages.length" class="cards">
            <article v-for="message in messages" :key="message.id" class="message-card panel">
              <div class="avatar">{{ message.name.charAt(0).toUpperCase() }}</div>
              <div>
                <header>
                  <strong>{{ message.name }}</strong>
                  <span>{{ formatDate(message.createdAt) }}</span>
                </header>
                <p>{{ message.content }}</p>
              </div>
            </article>
          </div>

          <div v-else class="state-box panel">
            <p>还没有留言，第一条可以从这里开始。</p>
          </div>
        </section>
      </div>
    </div>

    <div :class="['toast', { visible: toastVisible }]">留言已发送</div>
  </div>
</template>

<style scoped>
.count-card {
  min-height: 150px;
  display: grid;
  align-content: end;
  padding: 22px;
}

.count-card strong {
  color: var(--accent-2);
  font-size: 3rem;
  line-height: 1;
  font-weight: 800;
}

.count-card span {
  color: var(--text-muted);
  font-weight: 800;
}

.message-layout {
  display: grid;
  grid-template-columns: minmax(280px, 420px) 1fr;
  gap: 18px;
  align-items: start;
}

.message-form {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 16px;
  padding: 22px;
}

h2 {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
}

label {
  display: grid;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 800;
}

.form-foot,
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-foot span,
.soft-alert {
  color: var(--text-soft);
  font-size: 0.86rem;
}

.list-head {
  margin-bottom: 14px;
}

.cards {
  display: grid;
  gap: 12px;
}

.message-card {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 14px;
  padding: 18px;
}

.avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--ink);
  font-weight: 800;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

header strong {
  color: var(--text);
  font-weight: 800;
}

header span {
  color: var(--text-soft);
  font-size: 0.8rem;
}

.message-card p {
  margin-top: 8px;
  color: var(--text-muted);
  word-break: break-word;
}

.toast {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 1200;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--ink);
  font-weight: 800;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity var(--transition), transform var(--transition);
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 860px) {
  .message-layout {
    grid-template-columns: 1fr;
  }

  .message-form {
    position: static;
  }
}
</style>
