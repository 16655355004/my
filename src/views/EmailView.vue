<template>
  <div class="email-view">
    <div class="container">
      <!-- 登录界面 -->
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card">
          <h1 class="login-title">管理员登录</h1>
          <p class="login-subtitle">请输入管理员密码以访问邮件系统</p>

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

      <!-- 主界面 -->
      <div v-else>
        <div class="header">
          <h1>邮件定时发送系统</h1>
          <p>配置每日智慧分享邮件</p>
          <button @click="logout" class="logout-btn">退出登录</button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 主要内容 -->
        <div v-else class="content">
          <!-- 系统状态 -->
          <div class="status-card">
            <div class="status-header">
              <h2>系统状态</h2>
              <div class="status-indicator" :class="{ active: config.enabled }">
                {{ config.enabled ? "运行中" : "已停止" }}
              </div>
            </div>
            <div class="status-info">
              <div class="info-item">
                <span class="label">配置邮箱数量:</span>
                <span class="value">{{ config.emails?.length || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="label">发送时间:</span>
                <span class="value">{{ formattedSendTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">下次发送:</span>
                <span class="value">{{ nextSendTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">时区:</span>
                <span class="value">{{ config.timezone || "Asia/Shanghai" }}</span>
              </div>
            </div>
          </div>

          <!-- 邮箱配置 -->
          <div class="config-card">
            <h2>邮箱配置</h2>
            <div class="email-list">
              <div v-for="(email, index) in config.emails" :key="index" class="email-item">
                <input
                  v-model="config.emails[index]"
                  type="email"
                  placeholder="请输入邮箱地址"
                  class="email-input"
                  @blur="validateEmail(index)"
                />
                <button @click="removeEmail(index)" class="remove-btn">
                  <span>删除</span>
                </button>
              </div>
              <button @click="addEmail" class="add-email-btn"><span>+</span> 添加邮箱</button>
            </div>
          </div>

          <!-- 问题设置 -->
          <div class="config-card">
            <h2>问题设置</h2>
            <div class="question-section">
              <label for="question">每日问题:</label>
              <textarea
                id="question"
                v-model="config.question"
                placeholder="请输入您想要AI回答的问题，例如：让人愉快的方法"
                class="question-input"
                rows="3"
              ></textarea>
              <div class="question-hint">
                提示：问题应该积极正面，AI会基于这个问题生成每日的智慧分享内容
              </div>
            </div>
          </div>

          <!-- 时间设置 -->
          <div class="config-card">
            <h2>时间设置</h2>
            <div class="time-section">
              <div class="time-input-group">
                <label for="sendTime">发送时间 (北京时间):</label>
                <input id="sendTime" v-model="config.sendTime" type="time" class="time-input" />
              </div>
              <div class="timezone-info">
                <span>时区: {{ config.timezone || "Asia/Shanghai" }}</span>
              </div>
            </div>
          </div>

          <!-- 系统开关 -->
          <div class="config-card">
            <h2>系统控制</h2>
            <div class="control-section">
              <div class="switch-group">
                <label class="switch">
                  <input v-model="config.enabled" type="checkbox" class="switch-input" />
                  <span class="switch-slider"></span>
                </label>
                <span class="switch-label">
                  {{ config.enabled ? "启用定时发送" : "禁用定时发送" }}
                </span>
              </div>
              <div class="switch-hint">
                {{ config.enabled ? "系统将按设定时间自动发送邮件" : "系统已暂停，不会发送邮件" }}
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <button @click="testSend" :disabled="isTesting" class="test-btn">
              <div v-if="isTesting" class="loading-spinner"></div>
              <span>{{ isTesting ? "发送中..." : "测试发送" }}</span>
            </button>
            <button @click="saveConfig" :disabled="isSaving" class="save-btn">
              <div v-if="isSaving" class="loading-spinner"></div>
              <span>{{ isSaving ? "保存中..." : "保存配置" }}</span>
            </button>
          </div>

          <!-- 消息提示 -->
          <div v-if="message" class="message" :class="message.type">
            <span class="message-icon">
              {{ message.type === "success" ? "✓" : message.type === "error" ? "✗" : "i" }}
            </span>
            <span class="message-text">{{ message.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试发送日志弹窗 -->
    <div v-if="showTestLogModal" class="modal-overlay" @click="closeTestLogModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>测试发送详细日志</h3>
          <button @click="closeTestLogModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="log-container">
            <div v-for="(log, index) in testLogs" :key="index" class="log-entry" :class="log.type">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTestLogModal" class="modal-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import emailService, { type EmailConfig } from "@/services/emailService";
import { bookmarkService } from "@/services/bookmarkService";

// 响应式数据
const isAuthenticated = ref(false);
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

const isSaving = ref(false);
const isTesting = ref(false);
const message = ref<{ type: "success" | "error" | "info"; text: string } | null>(null);

// 测试发送日志相关
const showTestLogModal = ref(false);
const testLogs = ref<Array<{ time: string; message: string; type: string }>>([]);

const config = ref<EmailConfig>({
  emails: [],
  question: "",
  sendTime: "08:00",
  timezone: "Asia/Shanghai",
  enabled: false,
});

// 计算属性
const nextSendTime = computed(() => {
  if (!config.value.enabled || !config.value.sendTime) {
    return "系统已禁用";
  }
  return emailService.getTimeUntilNextSend(config.value.sendTime);
});

const formattedSendTime = computed(() => {
  return emailService.formatTime(config.value.sendTime);
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
    const isValid = await bookmarkService.verifyAdminPassword(password.value);

    if (isValid) {
      bookmarkService.setAdminToken(password.value);
      isAuthenticated.value = true;
      loading.value = true; // 重新设置loading为true以加载配置
      await loadConfig();
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
  bookmarkService.clearAdminToken();
  isAuthenticated.value = false;
  password.value = "";
  error.value = null;
  // 重置配置数据
  config.value = {
    emails: [],
    question: "",
    sendTime: "08:00",
    timezone: "Asia/Shanghai",
    enabled: false,
  };
};

// 检查是否已登录
onMounted(() => {
  const token = bookmarkService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadConfig();
  }
});

// 方法
const loadConfig = async () => {
  try {
    loading.value = true;
    console.log("开始加载邮件配置...");

    const result = await emailService.getConfig();
    console.log("配置加载结果:", result);

    if (result.success && result.data) {
      config.value = { ...config.value, ...result.data };
      // 确保emails是数组
      if (!Array.isArray(config.value.emails)) {
        config.value.emails = [];
      }
      console.log("配置加载成功:", config.value);
    } else {
      const errorMsg = result.error || "未知错误";
      console.error("配置加载失败:", errorMsg);
      showMessage("error", "加载配置失败: " + errorMsg);
    }
  } catch (error) {
    console.error("配置加载异常:", error);
    const errorMsg = error instanceof Error ? error.message : "网络连接失败";
    showMessage("error", "加载配置失败: " + errorMsg);
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  try {
    isSaving.value = true;
    console.log("开始保存配置...", config.value);

    // 验证配置
    const validation = emailService.validateConfig(config.value);
    if (!validation.valid) {
      console.error("配置验证失败:", validation.errors);
      showMessage("error", validation.errors[0]);
      return;
    }

    const result = await emailService.saveConfig(config.value, emailService.getAdminPassword());
    console.log("保存配置结果:", result);

    if (result.success) {
      showMessage("success", "配置保存成功！");
      if (result.data) {
        config.value = result.data;
      }
    } else {
      const errorMsg = result.error || "未知错误";
      console.error("保存配置失败:", errorMsg);
      showMessage("error", "保存失败: " + errorMsg);
    }
  } catch (error) {
    console.error("保存配置异常:", error);
    const errorMsg = error instanceof Error ? error.message : "网络连接失败";
    showMessage("error", "保存失败: " + errorMsg);
  } finally {
    isSaving.value = false;
  }
};

const testSend = async () => {
  try {
    isTesting.value = true;
    testLogs.value = []; // 清空之前的日志

    addTestLog("开始测试发送邮件...", "info");
    console.log("开始测试发送邮件...");

    // 验证配置
    addTestLog("验证邮件配置...", "info");
    const validation = emailService.validateConfig(config.value);
    if (!validation.valid) {
      addTestLog(`配置验证失败: ${validation.errors[0]}`, "error");
      console.error("测试发送验证失败:", validation.errors);
      showMessage("error", validation.errors[0]);
      showTestLogModal.value = true;
      return;
    }
    addTestLog("配置验证通过", "success");

    addTestLog("发送测试邮件请求...", "info");
    const result = await emailService.testSend(emailService.getAdminPassword());
    console.log("测试发送结果:", result);

    if (result.success) {
      addTestLog("测试邮件发送成功！", "success");
      if (result.data && result.data.details) {
        addTestLog(`发送详情: ${JSON.stringify(result.data.details, null, 2)}`, "info");
      }
      showMessage("success", "测试邮件发送成功！请检查您的邮箱。");
      showTestLogModal.value = true;
    } else {
      const errorMsg = result.error || "未知错误";
      addTestLog(`发送失败: ${errorMsg}`, "error");
      console.error("测试发送失败:", errorMsg);
      showMessage("error", "测试发送失败: " + errorMsg);
      showTestLogModal.value = true;
    }
  } catch (error) {
    console.error("测试发送异常:", error);
    const errorMsg = error instanceof Error ? error.message : "网络连接失败";
    addTestLog(`发送异常: ${errorMsg}`, "error");
    showMessage("error", "测试发送失败: " + errorMsg);
    showTestLogModal.value = true;
  } finally {
    isTesting.value = false;
  }
};

const addEmail = () => {
  config.value.emails.push("");
};

const removeEmail = (index: number) => {
  config.value.emails.splice(index, 1);
};

const validateEmail = (index: number) => {
  const email = config.value.emails[index];

  if (email && !emailService.validateEmail(email)) {
    showMessage("error", `邮箱格式不正确: ${email}`);
  }
};

const showMessage = (type: "success" | "error" | "info", text: string) => {
  message.value = { type, text };
  setTimeout(() => {
    message.value = null;
  }, 5000);
};

// 测试日志相关函数
const addTestLog = (message: string, type: string) => {
  const now = new Date();
  testLogs.value.push({
    time: now.toLocaleTimeString(),
    message,
    type,
  });
};

const closeTestLogModal = () => {
  showTestLogModal.value = false;
};
</script>

<style scoped>
.email-view {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
  background-color: rgba(139, 137, 137, 0.616);
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  position: relative;
  text-align: center;
  color: #212529;
  margin-bottom: 30px;
  margin-top: 80px;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
  color: #212529;
}

.header p {
  font-size: 1.1rem;
  color: #6c757d;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #212529;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #212529;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 登录界面样式 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  margin-top: 80px;
}

.login-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 3rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  text-align: left;
}

.form-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: white;
  color: #212529;
}

.form-input:focus {
  outline: none;
  border-color: #212529;
  box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.1);
}

.form-input:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.login-btn {
  padding: 1rem 2rem;
  background: #212529;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-btn:hover:not(:disabled) {
  background: #495057;
  transform: translateY(-1px);
}

.login-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.logout-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background: #495057;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card,
.status-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.config-card:hover,
.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.config-card h2,
.status-card h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-indicator {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.status-indicator.active {
  background: #212529;
  color: white;
  border-color: #212529;
}

.status-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #212529;
}

.info-item .label {
  color: #64748b;
  font-weight: 500;
}

.info-item .value {
  color: #1e293b;
  font-weight: 600;
}

.email-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.email-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: white;
  color: #212529;
}

.email-input:focus {
  outline: none;
  border-color: #212529;
  box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.1);
}

.remove-btn {
  padding: 8px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
}

.remove-btn:hover {
  background: #495057;
}

.add-email-btn {
  padding: 12px 20px;
  background: #212529;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.add-email-btn:hover {
  background: #495057;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-section label {
  font-weight: 600;
  color: #374151;
}

.question-input {
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
  background: white;
  color: #212529;
}

.question-input:focus {
  outline: none;
  border-color: #212529;
  box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.1);
}

.question-hint {
  font-size: 0.9rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #212529;
}

.time-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-input-group label {
  font-weight: 600;
  color: #374151;
}

.time-input {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  max-width: 200px;
  transition: border-color 0.2s ease;
  background: white;
  color: #212529;
}

.time-input:focus {
  outline: none;
  border-color: #212529;
  box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.1);
}

.timezone-info {
  color: #64748b;
  font-size: 0.9rem;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.switch-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.switch-input:checked + .switch-slider {
  background-color: #212529;
}

.switch-input:checked + .switch-slider:before {
  transform: translateX(26px);
}

.switch-label {
  font-weight: 600;
  color: #374151;
  font-size: 1.1rem;
}

.switch-hint {
  font-size: 0.9rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #212529;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
}

.test-btn,
.save-btn {
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: center;
}

.test-btn {
  background: #6c757d;
  color: white;
}

.test-btn:hover:not(:disabled) {
  background: #495057;
  transform: translateY(-2px);
}

.save-btn {
  background: #212529;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #495057;
  transform: translateY(-2px);
}

.test-btn:disabled,
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.test-btn,
.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 20px 24px;
  max-height: 400px;
  overflow-y: auto;
}

.log-container {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
}

.log-entry {
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  border-left: 3px solid #ddd;
}

.log-entry.success {
  background: #d4edda;
  border-left-color: #28a745;
  color: #155724;
}

.log-entry.error {
  background: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

.log-entry.info {
  background: #d1ecf1;
  border-left-color: #17a2b8;
  color: #0c5460;
}

.log-time {
  color: #666;
  margin-right: 12px;
  font-weight: bold;
}

.log-message {
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  background: #212529;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.modal-btn:hover {
  background: #495057;
}

.message {
  padding: 16px 20px;
  border-radius: 12px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.message.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.message-icon {
  font-size: 1.2rem;
}

.message-text {
  flex: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .email-view {
    padding: 10px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .config-card,
  .status-card {
    padding: 20px;
  }

  .status-info {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    gap: 4px;
  }

  .email-item {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    flex-direction: column;
  }

  .test-btn,
  .save-btn {
    width: 100%;
  }

  .switch-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.8rem;
  }

  .config-card,
  .status-card {
    padding: 16px;
  }

  .config-card h2,
  .status-card h2 {
    font-size: 1.3rem;
  }
}
</style>
