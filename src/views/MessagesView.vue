<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { messageService, type Message, type MessageInput } from "../services/bookmarkService";

const messages = ref<Message[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);

// 表单数据
const form = ref<MessageInput>({
  name: "",
  content: ""
});

// 表单验证
const isFormValid = computed(() => {
  return form.value.name.trim().length > 0 && form.value.content.trim().length > 0;
});

// 加载留言数据
const loadMessages = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await messageService.getAllMessages();

    if (response.success && response.data) {
      messages.value = response.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      error.value = response.error || "加载留言失败";
      // 如果 API 失败，使用空数组
      messages.value = [];
    }
  } catch (err) {
    console.error("Failed to load messages:", err);
    error.value = "网络连接失败";
    messages.value = [];
  } finally {
    loading.value = false;
  }
};

// 提交留言
const submitMessage = async () => {
  if (!isFormValid.value || submitting.value) return;

  try {
    submitting.value = true;
    
    const response = await messageService.addMessage({
      name: form.value.name.trim(),
      content: form.value.content.trim()
    });

    if (response.success && response.data) {
      // 添加成功，重新加载留言列表
      await loadMessages();
      // 清空表单
      form.value = { name: "", content: "" };
      // 显示成功提示
      showSuccessMessage();
    } else {
      error.value = response.error || "提交留言失败";
    }
  } catch (err) {
    console.error("Failed to submit message:", err);
    error.value = "网络连接失败";
  } finally {
    submitting.value = false;
  }
};

// 显示成功提示
const showSuccessMessage = () => {
  const successEl = document.querySelector('.success-message');
  if (successEl) {
    successEl.classList.add('show');
    setTimeout(() => {
      successEl.classList.remove('show');
    }, 3000);
  }
};

// 格式化时间
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

// 重新加载数据
const refreshMessages = () => {
  loadMessages();
};

// 组件挂载时加载数据
onMounted(() => {
  loadMessages();
});
</script>

<template>
  <div class="messages-view">
    <div class="container">
      <!-- 页面标题 -->
      <div class="messages-header">
        <h1 class="page-title">留言板</h1>
        <p class="page-subtitle">分享你的想法，留下美好的回忆</p>
      </div>

      <!-- 留言表单 -->
      <div class="message-form-section">
        <div class="form-card">
          <h2 class="form-title">写下你的留言</h2>
          <form @submit.prevent="submitMessage" class="message-form">
            <div class="form-group">
              <label for="name" class="form-label">姓名</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="请输入你的姓名"
                class="form-input"
                maxlength="20"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="content" class="form-label">留言内容</label>
              <textarea
                id="content"
                v-model="form.content"
                placeholder="分享你的想法..."
                class="form-textarea"
                rows="4"
                maxlength="500"
                required
              ></textarea>
              <div class="char-count">{{ form.content.length }}/500</div>
            </div>

            <button
              type="submit"
              :disabled="!isFormValid || submitting"
              class="submit-btn"
            >
              <span v-if="submitting">提交中...</span>
              <span v-else>发送留言</span>
            </button>
          </form>
        </div>
      </div>

      <!-- 成功提示 -->
      <div class="success-message">
        <div class="success-content">
          <span class="success-icon">✅</span>
          <span>留言提交成功！</span>
        </div>
      </div>

      <!-- 留言列表 -->
      <div class="messages-section">
        <div class="section-header">
          <h2 class="section-title"> 所有留言</h2>
          <button @click="refreshMessages" class="refresh-btn" :disabled="loading">
            <svg class="refresh-icon" :class="{ spinning: loading }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            刷新
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载留言...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>加载失败</h3>
          <p>{{ error }}</p>
          <button @click="refreshMessages" class="retry-btn">重试</button>
        </div>

        <!-- 留言列表 -->
        <div v-else-if="messages.length > 0" class="messages-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-card"
          >
            <div class="message-header">
              <div class="message-author">
                <div class="author-avatar">{{ message.name.charAt(0).toUpperCase() }}</div>
                <div class="author-info">
                  <h4 class="author-name">{{ message.name }}</h4>
                  <span class="message-time">{{ formatDate(message.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="message-content">
              <p>{{ message.content }}</p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">💭</div>
          <h3>还没有留言</h3>
          <p>成为第一个留言的人吧！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-view {
  min-height: 100vh;
  padding-top: 8rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, var(--background-color) 0%, #0f0f1a 100%);
}

.messages-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.page-subtitle {
  font-size: 1.2rem;
  color: rgba(232, 232, 240, 0.7);
  max-width: 600px;
  margin: 0 auto;
}

.message-form-section {
  margin-bottom: 4rem;
  display: flex;
  justify-content: center;
}

.form-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(10px);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 2rem;
  text-align: center;
}

.message-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  position: relative;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(232, 232, 240, 0.5);
}

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 1rem;
  font-size: 0.8rem;
  color: rgba(232, 232, 240, 0.5);
}

.submit-btn {
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  color: var(--background-color);
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.success-message {
  position: fixed;
  top: 100px;
  right: 20px;
  background: linear-gradient(90deg, #10b981, #059669);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  transform: translateX(400px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
}

.success-message.show {
  transform: translateX(0);
  opacity: 1;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-icon {
  font-size: 1.2rem;
}

.messages-section {
  margin-top: 4rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  padding: 0.8rem 1.5rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.message-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 212, 255, 0.3);
}

.message-header {
  margin-bottom: 1rem;
}

.message-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--background-color);
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.message-time {
  font-size: 0.8rem;
  color: rgba(232, 232, 240, 0.6);
}

.message-content {
  color: rgba(232, 232, 240, 0.8);
  line-height: 1.6;
}

.message-content p {
  margin: 0;
  word-wrap: break-word;
}

/* 加载、错误、空状态样式 */
.loading-state,
.error-state,
.empty-state {
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

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3,
.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.retry-btn {
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

@media (max-width: 768px) {
  .messages-view {
    padding-top: 6rem;
  }

  .page-title {
    font-size: 2.5rem;
  }

  .form-card {
    padding: 2rem;
    margin: 0 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .message-card {
    padding: 1.2rem;
  }

  .author-avatar {
    width: 35px;
    height: 35px;
  }
}
</style>
