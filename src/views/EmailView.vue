<template>
  <div class="email-view">
    <div class="particle-background"></div>

    <div class="container">
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card" ref="loginCard">
          <div class="login-header">
            <div class="login-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h1 class="login-title">邮件系统管理</h1>
            <p class="login-subtitle">请输入管理员密码以访问邮件定时发送系统</p>
          </div>

          <form @submit.prevent="authenticate" class="login-form">
            <div class="form-group">
              <div class="input-wrapper">
                <input
                  v-model="password"
                  type="password"
                  placeholder="管理员密码"
                  class="form-input"
                  :disabled="loading"
                  ref="passwordInput"
                />
                <div class="input-focus-line"></div>
              </div>
            </div>

            <button
              type="submit"
              class="login-btn"
              :disabled="loading || !password.trim()"
              ref="loginBtn"
            >
              <span class="btn-content">
                <div v-if="loading" class="loading-spinner"></div>
                <span>{{ loading ? "验证中..." : "登录系统" }}</span>
              </span>
            </button>
          </form>

          <div v-if="error" class="error-message" ref="errorMessage">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" />
            </svg>
            {{ error }}
          </div>
        </div>
      </div>

      <div v-else class="main-interface" ref="mainInterface">
        <div class="top-nav" ref="topNav">
          <div class="nav-content">
            <div class="nav-left">
              <div class="system-logo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" />
                </svg>
                <span>邮件系统</span>
              </div>
              <div class="system-status-mini" :class="{ active: config.enabled }">
                <div class="status-dot"></div>
                <span>{{ config.enabled ? "运行中" : "已停止" }}</span>
              </div>
            </div>
            <button @click="logout" class="logout-btn" ref="logoutBtn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="16,17 21,12 16,7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              退出
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-overlay" ref="loadingOverlay">
          <div class="loading-content">
            <div class="loading-spinner-modern"></div>
            <p>正在加载系统配置...</p>
          </div>
        </div>

        <div v-else class="dashboard-content" ref="dashboardContent">
          <div class="status-dashboard" ref="statusDashboard">
            <div class="dashboard-header">
              <h2>系统概览</h2>
              <div class="header-actions">
                <button @click="refreshStatus" class="refresh-btn" :disabled="refreshing">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    :class="{ spinning: refreshing }"
                  >
                    <path
                      d="M1 4V10H7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M23 20V14H17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="status-grid">
              <div class="status-card primary" :class="{ active: config.enabled }">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <polyline
                      points="12,6 12,12 16,14"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="card-content">
                  <h3>系统状态</h3>
                  <p class="status-text">{{ config.enabled ? "运行中" : "已停止" }}</p>
                  <div class="status-indicator" :class="{ active: config.enabled }"></div>
                </div>
              </div>

              <div class="status-card">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" />
                  </svg>
                </div>
                <div class="card-content">
                  <h3>邮箱数量</h3>
                  <p class="value-text">{{ config.emails?.length || 0 }}</p>
                  <span class="label-text">个配置邮箱</span>
                </div>
              </div>

              <div class="status-card">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="card-content">
                  <h3>发送模式</h3>
                  <p class="value-text">每日自动</p>
                  <span class="label-text">基于日期发送</span>
                </div>
              </div>

              <div class="status-card">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="card-content">
                  <h3>发送状态</h3>
                  <p class="value-text">{{ config.enabled ? "已启用" : "已禁用" }}</p>
                  <span class="label-text">系统状态</span>
                </div>
              </div>
            </div>
          </div>

          <div class="config-panels" ref="configPanels">
            <div class="config-panel" ref="emailPanel">
              <div class="panel-header">
                <div class="panel-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" />
                  </svg>
                </div>
                <h2>邮箱配置</h2>
                <div class="panel-badge">{{ config.emails?.length || 0 }}</div>
              </div>

              <div class="panel-content">
                <div class="email-list">
                  <div
                    v-for="(_, index) in config.emails"
                    :key="index"
                    class="email-item"
                    ref="emailItems"
                  >
                    <div class="email-input-wrapper">
                      <input
                        v-model="config.emails[index]"
                        type="email"
                        placeholder="请输入邮箱地址"
                        class="email-input"
                        @blur="validateEmail(index)"
                        @focus="onEmailInputFocus"
                      />
                      <div class="input-underline"></div>
                    </div>
                    <button
                      @click="removeEmail(index)"
                      class="remove-btn"
                      :class="{ 'animate-out': false }"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                        <line
                          x1="15"
                          y1="9"
                          x2="9"
                          y2="15"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <line
                          x1="9"
                          y1="9"
                          x2="15"
                          y2="15"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                    </button>
                  </div>

                  <button @click="addEmail" class="add-email-btn" ref="addEmailBtn">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" />
                      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span>添加邮箱</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="config-panel" ref="questionPanel">
              <div class="panel-header">
                <div class="panel-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <path
                      d="M9.09 9A3 3 0 0 1 12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="12"
                      y1="17"
                      x2="12.01"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <h2>问题设置</h2>
                <div
                  class="panel-badge"
                  :class="{ active: config.question && config.question.trim() }"
                >
                  {{ config.question && config.question.trim() ? "已配置" : "未配置" }}
                </div>
              </div>

              <div class="panel-content">
                <div class="question-section">
                  <label for="question" class="section-label">每日问题</label>
                  <div class="textarea-wrapper">
                    <textarea
                      id="question"
                      v-model="config.question"
                      placeholder="请输入您想要AI回答的问题，例如：让人愉快的方法"
                      class="question-input"
                      rows="4"
                      @focus="onQuestionInputFocus"
                      ref="questionInput"
                    ></textarea>
                    <div class="textarea-underline"></div>
                  </div>
                </div>

                <!-- 系统控制整合到问题设置面板 -->
                <div class="control-section">
                  <div class="switch-container">
                    <div class="switch-info">
                      <h3>定时发送功能</h3>
                      <p>
                        {{ config.enabled ? "系统将每日自动发送邮件" : "系统已暂停，不会发送邮件" }}
                      </p>
                    </div>
                    <label class="modern-switch" :class="{ active: config.enabled }">
                      <input v-model="config.enabled" type="checkbox" class="switch-input" />
                      <span class="switch-slider">
                        <span class="switch-button"></span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-panel" ref="actionPanel">
            <div class="panel-header">
              <div class="panel-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon
                    points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <h2>系统操作</h2>
            </div>

            <div class="panel-content">
              <div class="action-grid">
                <button
                  @click="testSend"
                  :disabled="isTesting"
                  class="action-btn primary"
                  ref="testBtn"
                >
                  <div class="btn-icon">
                    <svg
                      v-if="!isTesting"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22 2L11 13"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <polygon
                        points="22,2 15,22 11,13 2,9 22,2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <div v-else class="loading-spinner-btn"></div>
                  </div>
                  <div class="btn-content">
                    <span class="btn-title">{{ isTesting ? "发送中..." : "测试发送" }}</span>
                    <span class="btn-subtitle">立即发送测试邮件</span>
                  </div>
                </button>

                <button
                  @click="resetTodayEmail"
                  :disabled="isResetting"
                  class="action-btn warning"
                  ref="resetBtn"
                >
                  <div class="btn-icon">
                    <svg
                      v-if="!isResetting"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <polyline
                        points="1,4 1,10 7,10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M3.51 15A9 9 0 0 0 21 12A9 9 0 0 0 5.64 5.64L1 10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <div v-else class="loading-spinner-btn"></div>
                  </div>
                  <div class="btn-content">
                    <span class="btn-title">{{ isResetting ? "重置中..." : "重置发送" }}</span>
                    <span class="btn-subtitle">重置今日发送记录</span>
                  </div>
                </button>

                <button
                  @click="saveConfig"
                  :disabled="isSaving"
                  class="action-btn success"
                  ref="saveBtn"
                >
                  <div class="btn-icon">
                    <svg
                      v-if="!isSaving"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <polyline
                        points="17,21 17,13 7,13 7,21"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <polyline
                        points="7,3 7,8 15,8"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <div v-else class="loading-spinner-btn"></div>
                  </div>
                  <div class="btn-content">
                    <span class="btn-title">{{ isSaving ? "保存中..." : "保存配置" }}</span>
                    <span class="btn-subtitle">保存所有设置</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="message" class="message" :class="message.type">
          <span class="message-icon">
            {{ message.type === "success" ? "✓" : message.type === "error" ? "✗" : "i" }}
          </span>
          <span class="message-text">{{ message.text }}</span>
        </div>
      </div>
    </div>

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
import { ref, onMounted, nextTick } from "vue";
import gsap from "gsap";
import emailService, { type EmailConfig } from "@/services/emailService";
import { bookmarkService } from "@/services/bookmarkService";

// 响应式数据
const isAuthenticated = ref(false);
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

const isSaving = ref(false);
const isTesting = ref(false);
const isResetting = ref(false);
const refreshing = ref(false);
const message = ref<{ type: "success" | "error" | "info"; text: string } | null>(null);

// 测试发送日志相关
const showTestLogModal = ref(false);
const testLogs = ref<Array<{ time: string; message: string; type: string }>>([]);

const config = ref<EmailConfig>({
  emails: [],
  question: "",
  enabled: false,
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
    enabled: false,
  };
};

// 添加邮箱动画
const addEmail = () => {
  // 确保 emails 数组存在
  if (!Array.isArray(config.value.emails)) {
    config.value.emails = [];
  }

  config.value.emails.push("");

  // nextTick(() => {
  //   const emailItems = document.querySelectorAll('.email-item');
  //   const newItem = emailItems[emailItems.length - 1];
  //   if (newItem) {
  //     gsap.fromTo(newItem,
  //       {
  //         opacity: 0,
  //         x: -30,
  //         scale: 0.8
  //       },
  //       {
  //         opacity: 1,
  //         x: 0,
  //         scale: 1,
  //         duration: 0.5,
  //         ease: "back.out(1.7)"
  //       }
  //     );
  //   }
  // });
};

// 删除邮箱 - 修复显示bug
const removeEmail = (index: number) => {
  // 确保索引有效
  if (index < 0 || index >= config.value.emails.length) {
    return;
  }

  // 直接删除数组元素，确保响应式更新
  config.value.emails.splice(index, 1);

  // 添加简单的视觉反馈
  nextTick(() => {
    const emailItems = document.querySelectorAll(".email-item");
    emailItems.forEach((item, i) => {
      if (i >= index) {
        gsap.fromTo(
          item,
          { x: -10, opacity: 0.8 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    });
  });
};

// 按钮点击动画
const animateButtonClick = (buttonRef: HTMLElement) => {
  gsap.to(buttonRef, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  });
};

// 保存配置动画
const saveConfig = async () => {
  const saveBtn = document.querySelector(".action-btn.success") as HTMLElement;
  if (saveBtn) {
    animateButtonClick(saveBtn);
  }

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

      // 成功动画
      if (saveBtn) {
        gsap.to(saveBtn, {
          backgroundColor: "rgba(0, 255, 136, 0.3)",
          duration: 0.3,
          yoyo: true,
          repeat: 1,
        });
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

// 测试发送动画
const testSend = async () => {
  const testBtn = document.querySelector(".action-btn.primary") as HTMLElement;
  if (testBtn) {
    animateButtonClick(testBtn);
  }

  try {
    isTesting.value = true;
    testLogs.value = [];

    addTestLog("开始测试发送邮件...", "info");
    console.log("开始测试发送邮件...");

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

      // 成功动画
      if (testBtn) {
        gsap.to(testBtn, {
          backgroundColor: "rgba(0, 255, 136, 0.3)",
          duration: 0.3,
          yoyo: true,
          repeat: 1,
        });
      }
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

// 重置今日邮件发送记录
const resetTodayEmail = async () => {
  if (!confirm("确定要重置今日邮件发送记录吗？重置后可以重新测试定时发送功能。")) {
    return;
  }

  try {
    isResetting.value = true;
    testLogs.value = []; // 清空之前的日志
    addTestLog("开始重置今日发送记录...", "info");
    console.log("开始重置今日发送记录...");

    const result = await emailService.resetTodayEmailSent();
    console.log("重置发送记录结果:", result);

    if (result.success) {
      addTestLog("重置成功！现在可以重新测试发送", "success");
      addTestLog("提示：请设置发送时间为当前时间+3分钟进行测试", "info");
      showMessage("success", "今日发送记录已重置，现在可以重新测试定时发送功能");
      showTestLogModal.value = true;
    } else {
      const errorMsg = result.error || "未知错误";
      addTestLog(`重置失败: ${errorMsg}`, "error");
      console.error("重置发送记录失败:", errorMsg);
      showMessage("error", "重置失败: " + errorMsg);
      showTestLogModal.value = true;
    }
  } catch (error) {
    console.error("重置发送记录异常:", error);
    const errorMsg = error instanceof Error ? error.message : "网络连接失败";
    addTestLog(`重置异常: ${errorMsg}`, "error");
    showMessage("error", "重置失败: " + errorMsg);
    showTestLogModal.value = true;
  } finally {
    isResetting.value = false;
  }
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

// 刷新状态
const refreshStatus = async () => {
  refreshing.value = true;
  await loadConfig();
  refreshing.value = false;
};

// GSAP动画初始化
onMounted(() => {
  const token = bookmarkService.getAdminToken();
  if (token) {
    password.value = token;
    isAuthenticated.value = true;
    loadConfig();

    // 初始化主界面动画
    nextTick(() => {
      initMainInterfaceAnimations();
    });
  } else {
    // 初始化登录界面动画
    nextTick(() => {
      initLoginAnimations();
    });
  }
});

// 登录界面动画
const initLoginAnimations = () => {
  const loginCard = document.querySelector(".login-card");
  const loginIcon = document.querySelector(".login-icon");
  const loginTitle = document.querySelector(".login-title");
  const loginSubtitle = document.querySelector(".login-subtitle");
  const loginForm = document.querySelector(".login-form");

  if (loginCard) {
    gsap.fromTo(
      loginCard,
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
      }
    );

    gsap.fromTo(
      loginIcon,
      {
        opacity: 0,
        scale: 0,
        rotation: -180,
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        delay: 0.3,
        ease: "back.out(1.7)",
      }
    );

    gsap.fromTo(
      [loginTitle, loginSubtitle],
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.5,
        stagger: 0.1,
      }
    );

    gsap.fromTo(
      loginForm,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.7,
      }
    );
  }
};

// 主界面动画
const initMainInterfaceAnimations = () => {
  const topNav = document.querySelector(".top-nav");
  const statusDashboard = document.querySelector(".status-dashboard");
  const configPanels = document.querySelectorAll(".config-panel, .control-panel, .action-panel");

  if (topNav) {
    gsap.fromTo(
      topNav,
      {
        opacity: 0,
        y: -50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      }
    );
  }

  if (statusDashboard) {
    gsap.fromTo(
      statusDashboard,
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.out",
      }
    );

    // 状态卡片动画
    const statusCards = document.querySelectorAll(".status-card");
    gsap.fromTo(
      statusCards,
      {
        opacity: 0,
        y: 20,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)",
      }
    );
  }

  // 配置面板动画
  gsap.fromTo(
    configPanels,
    {
      opacity: 0,
      y: 40,
      scale: 0.95,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      delay: 0.6,
      stagger: 0.15,
      ease: "power2.out",
    }
  );
};

// 输入框焦点处理
const onEmailInputFocus = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const wrapper = input.closest(".email-input-wrapper");
  if (wrapper) {
    gsap.to(wrapper, { scale: 1.02, duration: 0.2, ease: "power2.out" });
  }
};

const onQuestionInputFocus = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  const wrapper = textarea.closest(".textarea-wrapper");
  if (wrapper) {
    gsap.to(wrapper, { scale: 1.01, duration: 0.2, ease: "power2.out" });
  }
};
</script>

<style scoped>
/* 现代化黑色主题邮件系统样式 */
.email-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1d1d1d 0%, #2b2a2a 50%, #3d3b3b 100%);
  /* background-color: black; */
  position: relative;
  overflow-x: hidden;
}
/* 粒子背景 */
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  z-index: 0;
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
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
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  max-width: 450px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.login-header {
  margin-bottom: 2rem;
}

.login-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-icon svg {
  width: 32px;
  height: 32px;
}

.login-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  text-align: left;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 1.2rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  backdrop-filter: blur(10px);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.form-input:disabled {
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.input-focus-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.form-input:focus + .input-focus-line {
  width: 100%;
}

.login-btn {
  padding: 1.2rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover:not(:disabled)::before {
  left: 100%;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
  transform: none;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 主界面样式 */
.main-interface {
  min-height: 100vh;
  padding-top: 80px;
}

/* 顶部导航栏 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* background: rgba(10, 10, 10, 0.95); */
  backdrop-filter: blur(20px);
  /* border-bottom: 1px solid rgba(255, 255, 255, 0.1); */
  margin-top: 80px;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.system-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
  font-weight: 600;
  font-size: 1.1rem;
}

.system-logo svg {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.system-status-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
  transition: background-color 0.3s ease;
}

.system-status-mini.active .status-dot {
  background: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn svg {
  width: 16px;
  height: 16px;
}

.logout-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  transform: translateY(-1px);
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.loading-content {
  text-align: center;
  color: #ffffff;
}

.loading-spinner-modern {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

/* 仪表板内容 */
.dashboard-content {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 50px;
}

/* 状态仪表板 */
.status-dashboard {
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-btn {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* 状态网格 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-card:hover::before {
  opacity: 1;
}

.status-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.status-card.primary.active::before {
  background: linear-gradient(90deg, #00ff88, #00d4ff);
  opacity: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-content h3 {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-text,
.value-text {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.label-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6c757d !important;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: #00ff88 !important;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
}

/* 配置面板 */
.config-panels {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.config-panel,
.control-panel,
.action-panel {
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.config-panel:hover,
.control-panel:hover,
.action-panel:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.panel-icon svg {
  width: 24px;
  height: 24px;
}

.panel-header h2 {
  flex: 1;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.panel-badge {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.panel-badge.active {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.panel-content {
  padding: 2rem;
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

/* 邮箱配置样式 */
.email-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.email-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  animation: slideInUp 0.3s ease;
}

.email-input-wrapper {
  flex: 1;
  position: relative;
}

.email-input {
  width: 100%;
  padding: 1rem 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  backdrop-filter: blur(10px);
}

.email-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.email-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.input-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.email-input:focus + .input-underline {
  width: 100%;
}

.remove-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 117, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 12px;
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn svg {
  width: 20px;
  height: 20px;
}

.remove-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.05);
}

.add-email-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.add-email-btn svg {
  width: 20px;
  height: 20px;
}

.add-email-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}

/* 通用标签样式 */
.section-label {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.remove-btn {
  padding: 8px 12px;
  background: #f36303;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
}

.remove-btn:hover {
  background: #f70101;
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

/* 问题设置样式 */
.question-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.textarea-wrapper {
  position: relative;
}

.question-input {
  width: 100%;
  padding: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  backdrop-filter: blur(10px);
  line-height: 1.5;
}

.question-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.question-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.textarea-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.question-input:focus + .textarea-underline {
  width: 100%;
}

.question-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(102, 126, 234, 0.1);
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  line-height: 1.4;
}

.question-hint svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #667eea;
}

/* 时间设置样式 */
.time-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-input-wrapper {
  position: relative;
  max-width: 250px;
}

.time-input {
  width: 100%;
  padding: 1rem 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  backdrop-filter: blur(10px);
}

.time-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.time-input:focus + .input-underline {
  width: 100%;
}

.timezone-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
}

.timezone-info svg {
  width: 16px;
  height: 16px;
  color: #667eea;
}

/* 系统控制样式 */
.control-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.switch-info h3 {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.switch-info p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.modern-switch {
  position: relative;
  display: inline-block;
  width: 80px;
  height: 44px;
  cursor: pointer;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 22px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.switch-button {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 32px;
  height: 32px;
  background: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.modern-switch.active .switch-slider {
  background: linear-gradient(135deg, #04b4fa 0%, #cbe979 100%);
  border-color: #0d0e0d;
}

.modern-switch.active .switch-button {
  transform: translateX(36px);
  background: #ffffff;
}

/* 操作按钮样式 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.action-btn.primary {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-color: rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.2);
}

.action-btn.warning {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
  border-color: rgba(255, 193, 7, 0.3);
}

.action-btn.warning:hover {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.3) 0%, rgba(255, 152, 0, 0.3) 100%);
  box-shadow: 0 15px 35px rgba(255, 193, 7, 0.2);
}

.action-btn.success {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 212, 255, 0.2) 100%);
  border-color: rgba(0, 255, 136, 0.3);
}

.action-btn.success:hover {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.3) 0%, rgba(0, 212, 255, 0.3) 100%);
  box-shadow: 0 15px 35px rgba(0, 255, 136, 0.2);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

.btn-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-icon svg {
  width: 24px;
  height: 24px;
  color: #ffffff;
}

.btn-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-title {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.loading-spinner-btn {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 动画效果 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 消息提示样式 */
.message {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  animation: slideInUp 0.3s ease;
  backdrop-filter: blur(10px);
}

.message.success {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.message.error {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.message.info {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.message-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message-text {
  flex: 1;
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
@media (max-width: 1024px) {
  .container {
    padding: 0 15px;
  }

  .status-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-interface {
    padding-top: 70px;
  }

  .nav-content {
    padding: 0 15px;
    height: 60px;
  }

  .nav-left {
    gap: 1rem;
  }

  .system-logo {
    font-size: 1rem;
  }

  .system-status-mini {
    display: none;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .logout-btn span {
    display: none;
  }

  .dashboard-content {
    padding: 1rem 0;
    gap: 1.5rem;
  }

  .status-dashboard,
  .config-panel,
  .control-panel,
  .action-panel {
    padding: 1.5rem;
  }

  .panel-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .panel-content {
    padding: 1.5rem;
  }

  .status-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .switch-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .email-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .remove-btn {
    align-self: flex-end;
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 10px;
  }

  .login-card {
    padding: 2rem;
    margin: 10px;
  }

  .login-title {
    font-size: 1.8rem;
  }

  .login-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
  }

  .dashboard-content {
    gap: 1rem;
  }

  .status-dashboard,
  .config-panel,
  .control-panel,
  .action-panel {
    padding: 1rem;
  }

  .panel-header {
    padding: 1rem 1rem 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .panel-content {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .dashboard-header h2 {
    font-size: 1.3rem;
  }

  .panel-header h2 {
    font-size: 1.2rem;
  }

  .action-btn {
    padding: 1.25rem;
  }

  .btn-title {
    font-size: 1rem;
  }

  .time-input-wrapper {
    max-width: 100%;
  }
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .email-view {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0a0a0a 100%);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .login-card,
  .status-dashboard,
  .config-panel,
  .control-panel,
  .action-panel {
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .form-input,
  .email-input,
  .question-input,
  .time-input {
    border-width: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
