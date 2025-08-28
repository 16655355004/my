<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { tutorialService } from "../services/tutorialService";
import gsap from "gsap";

// 状态管理
const isAuthenticated = ref(false);
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const activeSection = ref("introduction");

// 验证教程密码
const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入访问密码";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const isValid = tutorialService.verifyTutorialPassword(password.value);

    if (isValid) {
      tutorialService.setTutorialToken(password.value);
      isAuthenticated.value = true;

      // 登录成功后的动画
      nextTick(() => {
        initAnimations();
      });
    } else {
      error.value = "密码错误";
    }
  } catch (err) {
    error.value = "验证失败";
  } finally {
    loading.value = false;
  }
};

// 退出登录
const logout = () => {
  tutorialService.clearTutorialToken();
  isAuthenticated.value = false;
  password.value = "";
  activeSection.value = "introduction";
};

// 切换章节
const setActiveSection = (section: string) => {
  activeSection.value = section;

  // 添加内容切换动画
  nextTick(() => {
    gsap.fromTo(
      ".content-section",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  });
};

// 检查是否已登录
onMounted(() => {
  if (tutorialService.isAuthenticated()) {
    isAuthenticated.value = true;

    // 添加页面入场动画
    nextTick(() => {
      initAnimations();
    });
  } else {
    // 登录页面动画
    nextTick(() => {
      gsap.fromTo(
        ".login-card",
        { opacity: 0, scale: 0.9, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
      );
    });
  }
});

// 初始化动画
const initAnimations = () => {
  // 页面标题动画
  gsap.fromTo(
    ".page-title",
    { opacity: 0, y: -30 },
    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
  );

  // 导航菜单动画
  gsap.fromTo(
    ".nav-item",
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
  );

  // 主要内容动画
  gsap.fromTo(
    ".content-section",
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.4 }
  );

  // 特性卡片动画
  gsap.fromTo(
    ".feature-card",
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)", delay: 0.6 }
  );

  // 步骤卡片动画
  gsap.fromTo(
    ".step-card",
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.6, stagger: 0.2, ease: "power2.out", delay: 0.8 }
  );
};

// 教程章节
const sections = [
  { id: "introduction", title: "简介", icon: "📚" },
  { id: "setup", title: "环境设置", icon: "⚙️" },
  { id: "basic-operations", title: "基础操作", icon: "🔧" },
  { id: "advanced-features", title: "高级特性", icon: "🚀" },
  { id: "best-practices", title: "最佳实践", icon: "💡" },
  { id: "examples", title: "实战示例", icon: "💻" },
];
</script>

<template>
  <div class="tutorial-view">
    <div class="container">
      <!-- 登录界面 -->
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card">
          <div class="login-header">
            <div class="tutorial-icon">📖</div>
            <h1 class="login-title">Cloudflare KV 教程</h1>
            <p class="login-subtitle">请输入访问密码以查看教程内容</p>
          </div>

          <form @submit.prevent="authenticate" class="login-form">
            <div class="form-group">
              <input
                v-model="password"
                type="password"
                placeholder="访问密码"
                class="form-input"
                :disabled="loading"
              />
            </div>

            <button type="submit" class="login-btn" :disabled="loading || !password.trim()">
              <span v-if="loading">验证中...</span>
              <span v-else>进入教程</span>
            </button>
          </form>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
      </div>

      <!-- 教程界面 -->
      <div v-else class="tutorial-section">
        <!-- 头部 -->
        <div class="tutorial-header">
          <div class="header-left">
            <h1 class="page-title">Cloudflare KV 教程</h1>
            <p class="page-subtitle">全面掌握 Cloudflare Key-Value 存储的使用</p>
          </div>
          <div class="header-right">
            <button @click="logout" class="logout-btn">退出</button>
          </div>
        </div>

        <!-- 教程内容 -->
        <div class="tutorial-content">
          <!-- 侧边栏导航 -->
          <nav class="tutorial-nav">
            <h3 class="nav-title">目录</h3>
            <ul class="nav-list">
              <li
                v-for="section in sections"
                :key="section.id"
                :class="['nav-item', { active: activeSection === section.id }]"
                @click="setActiveSection(section.id)"
              >
                <span class="nav-icon">{{ section.icon }}</span>
                <span class="nav-text">{{ section.title }}</span>
              </li>
            </ul>
          </nav>

          <!-- 主要内容区域 -->
          <main class="tutorial-main">
            <!-- 简介章节 -->
            <div v-if="activeSection === 'introduction'" class="content-section">
              <h2 class="section-title">📚 Cloudflare KV 简介</h2>

              <div class="intro-card">
                <h3>什么是 Cloudflare KV？</h3>
                <p>
                  Cloudflare KV (Key-Value)
                  是一个全球分布式的键值存储系统，专为高性能和低延迟而设计。它允许你在 Cloudflare
                  的边缘网络中存储和检索数据。
                </p>
              </div>

              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon">🌍</div>
                  <h4>全球分布</h4>
                  <p>数据在全球 200+ 个数据中心中复制，确保低延迟访问</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">⚡</div>
                  <h4>高性能</h4>
                  <p>亚毫秒级的读取性能，适合高频访问的数据</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">💰</div>
                  <h4>成本效益</h4>
                  <p>按使用量付费，免费套餐包含 100,000 次读取操作</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">🔧</div>
                  <h4>易于使用</h4>
                  <p>简单的 API 接口，与 Workers 无缝集成</p>
                </div>
              </div>

              <div class="use-cases">
                <h3>常见使用场景</h3>
                <ul class="use-case-list">
                  <li><strong>配置存储：</strong>应用程序配置、功能开关</li>
                  <li><strong>缓存数据：</strong>API 响应、计算结果缓存</li>
                  <li><strong>用户数据：</strong>用户偏好设置、会话数据</li>
                  <li><strong>内容管理：</strong>静态内容、模板数据</li>
                  <li><strong>计数器：</strong>访问统计、限流计数</li>
                </ul>
              </div>
            </div>

            <!-- 环境设置章节 -->
            <div v-if="activeSection === 'setup'" class="content-section">
              <h2 class="section-title">⚙️ 环境设置</h2>

              <div class="setup-steps">
                <div class="step-card">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3>创建 Cloudflare 账户</h3>
                    <p>
                      访问
                      <a href="https://cloudflare.com" target="_blank" class="external-link"
                        >cloudflare.com</a
                      >
                      注册免费账户
                    </p>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3>安装 Wrangler CLI</h3>
                    <div class="code-block">
                      <pre><code>npm install -g wrangler</code></pre>
                    </div>
                    <p>Wrangler 是 Cloudflare Workers 的官方 CLI 工具</p>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3>登录 Wrangler</h3>
                    <div class="code-block">
                      <pre><code>wrangler login</code></pre>
                    </div>
                    <p>这将打开浏览器进行身份验证</p>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h3>创建 KV 命名空间</h3>
                    <div class="code-block">
                      <pre><code>wrangler kv:namespace create "MY_KV"</code></pre>
                    </div>
                    <p>记录返回的命名空间 ID，稍后会用到</p>
                  </div>
                </div>
              </div>

              <div class="config-example">
                <h3>wrangler.toml 配置示例</h3>
                <div class="code-block">
                  <pre><code>name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-15"

[[kv_namespaces]]
binding = "MY_KV"
id = "your-namespace-id-here"
preview_id = "your-preview-namespace-id-here"</code></pre>
                </div>
              </div>
            </div>

            <!-- 基础操作章节 -->
            <div v-if="activeSection === 'basic-operations'" class="content-section">
              <h2 class="section-title">🔧 基础操作</h2>

              <div class="operation-section">
                <h3>📝 写入数据 (PUT)</h3>
                <p>向 KV 存储中写入键值对数据</p>
                <div class="code-block">
                  <pre><code>// 在 Worker 中写入数据
await MY_KV.put("user:123", JSON.stringify({
  name: "张三",
  email: "zhangsan@example.com",
  created: new Date().toISOString()
}));

// 写入带过期时间的数据
await MY_KV.put("session:abc123", "session-data", {
  expirationTtl: 3600 // 1小时后过期
});</code></pre>
                </div>
              </div>

              <div class="operation-section">
                <h3>📖 读取数据 (GET)</h3>
                <p>从 KV 存储中读取数据</p>
                <div class="code-block">
                  <pre><code>// 读取字符串数据
const userData = await MY_KV.get("user:123");
if (userData) {
  const user = JSON.parse(userData);
  console.log(user.name); // "张三"
}

// 直接读取为 JSON
const user = await MY_KV.get("user:123", "json");

// 读取为 ArrayBuffer
const binaryData = await MY_KV.get("file:image.jpg", "arrayBuffer");</code></pre>
                </div>
              </div>

              <div class="operation-section">
                <h3>🗑️ 删除数据 (DELETE)</h3>
                <p>从 KV 存储中删除指定的键</p>
                <div class="code-block">
                  <pre><code>// 删除单个键
await MY_KV.delete("user:123");

// 批量删除
const keysToDelete = ["user:123", "user:456", "user:789"];
await Promise.all(keysToDelete.map(key => MY_KV.delete(key)));</code></pre>
                </div>
              </div>

              <div class="operation-section">
                <h3>📋 列出键 (LIST)</h3>
                <p>列出 KV 存储中的键</p>
                <div class="code-block">
                  <pre><code>// 列出所有键
const allKeys = await MY_KV.list();
console.log(allKeys.keys); // 键的数组

// 按前缀过滤
const userKeys = await MY_KV.list({ prefix: "user:" });

// 分页列出
const firstPage = await MY_KV.list({ limit: 10 });
const nextPage = await MY_KV.list({
  limit: 10,
  cursor: firstPage.cursor
});</code></pre>
                </div>
              </div>
            </div>

            <!-- 高级特性章节 -->
            <div v-if="activeSection === 'advanced-features'" class="content-section">
              <h2 class="section-title">🚀 高级特性</h2>

              <div class="feature-section">
                <h3>⏰ 数据过期 (TTL)</h3>
                <p>KV 支持自动过期功能，可以设置数据的生存时间</p>
                <div class="code-block">
                  <pre><code>// 设置绝对过期时间 (Unix 时间戳)
const expireAt = Math.floor(Date.now() / 1000) + 3600; // 1小时后
await MY_KV.put("temp-data", "value", { expiration: expireAt });

// 设置相对过期时间 (秒)
await MY_KV.put("cache-data", "value", { expirationTtl: 1800 }); // 30分钟</code></pre>
                </div>
              </div>

              <div class="feature-section">
                <h3>🏷️ 元数据存储</h3>
                <p>每个键可以存储额外的元数据信息</p>
                <div class="code-block">
                  <pre><code>// 写入带元数据的数据
await MY_KV.put("user:123", userData, {
  metadata: {
    version: "1.0",
    lastModified: new Date().toISOString(),
    tags: ["user", "active"]
  }
});

// 读取时获取元数据
const result = await MY_KV.getWithMetadata("user:123");
console.log(result.value);    // 数据内容
console.log(result.metadata); // 元数据对象</code></pre>
                </div>
              </div>

              <div class="feature-section">
                <h3>🔄 条件写入</h3>
                <p>使用 ETag 实现乐观锁，避免并发写入冲突</p>
                <div class="code-block">
                  <pre><code>// 读取数据和 ETag
const result = await MY_KV.getWithMetadata("counter");
const currentValue = parseInt(result.value || "0");
const etag = result.metadata?.etag;

// 条件更新
try {
  await MY_KV.put("counter", (currentValue + 1).toString(), {
    metadata: { etag }
  });
} catch (error) {
  // 处理并发冲突
  console.log("数据已被其他进程修改");
}</code></pre>
                </div>
              </div>

              <div class="feature-section">
                <h3>📊 批量操作</h3>
                <p>高效处理多个键值对操作</p>
                <div class="code-block">
                  <pre><code>// 批量写入
const operations = [
  MY_KV.put("key1", "value1"),
  MY_KV.put("key2", "value2"),
  MY_KV.put("key3", "value3")
];
await Promise.all(operations);

// 批量读取
const keys = ["key1", "key2", "key3"];
const values = await Promise.all(
  keys.map(key => MY_KV.get(key))
);</code></pre>
                </div>
              </div>
            </div>

            <!-- 最佳实践章节 -->
            <div v-if="activeSection === 'best-practices'" class="content-section">
              <h2 class="section-title">💡 最佳实践</h2>

              <div class="practice-section">
                <h3>🔑 键命名规范</h3>
                <div class="practice-card good">
                  <h4>✅ 推荐做法</h4>
                  <ul>
                    <li>使用有意义的前缀：<code>user:123</code>, <code>cache:api:users</code></li>
                    <li>保持键名简短但描述性强</li>
                    <li>使用一致的分隔符（如冒号）</li>
                    <li>避免特殊字符和空格</li>
                  </ul>
                </div>
                <div class="practice-card bad">
                  <h4>❌ 避免做法</h4>
                  <ul>
                    <li>过长的键名（超过 512 字节）</li>
                    <li>包含敏感信息的键名</li>
                    <li>随机或无意义的键名</li>
                    <li>频繁变化的键名模式</li>
                  </ul>
                </div>
              </div>

              <div class="practice-section">
                <h3>📈 性能优化</h3>
                <div class="tip-card">
                  <h4>缓存策略</h4>
                  <p>合理设置 TTL，避免存储过期数据</p>
                  <div class="code-block">
                    <pre><code>// 根据数据更新频率设置不同的 TTL
await MY_KV.put("config", data, { expirationTtl: 86400 }); // 配置数据：1天
await MY_KV.put("cache", data, { expirationTtl: 3600 });   // 缓存数据：1小时</code></pre>
                  </div>
                </div>

                <div class="tip-card">
                  <h4>数据压缩</h4>
                  <p>对大型数据进行压缩以节省存储空间</p>
                  <div class="code-block">
                    <pre><code>// 压缩 JSON 数据
const compressed = JSON.stringify(data);
await MY_KV.put("large-data", compressed);</code></pre>
                  </div>
                </div>
              </div>

              <div class="practice-section">
                <h3>🛡️ 安全考虑</h3>
                <div class="security-tips">
                  <div class="security-tip">
                    <h4>🔐 数据加密</h4>
                    <p>敏感数据在存储前进行加密</p>
                  </div>
                  <div class="security-tip">
                    <h4>🚫 访问控制</h4>
                    <p>使用 Worker 实现访问权限验证</p>
                  </div>
                  <div class="security-tip">
                    <h4>📝 审计日志</h4>
                    <p>记录重要操作的日志信息</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 实战示例章节 -->
            <div v-if="activeSection === 'examples'" class="content-section">
              <h2 class="section-title">💻 实战示例</h2>

              <div class="example-section">
                <h3>📚 示例 1：用户会话管理</h3>
                <p>实现一个简单的用户会话存储系统</p>
                <div class="code-block">
                  <pre><code>// 创建会话
async function createSession(userId, sessionData) {
  const sessionId = crypto.randomUUID();
  const session = {
    userId,
    ...sessionData,
    createdAt: new Date().toISOString()
  };

  await MY_KV.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 86400 // 24小时过期
  });

  return sessionId;
}

// 验证会话
async function validateSession(sessionId) {
  const sessionData = await MY_KV.get(`session:${sessionId}`);
  return sessionData ? JSON.parse(sessionData) : null;
}

// 删除会话
async function destroySession(sessionId) {
  await MY_KV.delete(`session:${sessionId}`);
}</code></pre>
                </div>
              </div>

              <div class="example-section">
                <h3>🔢 示例 2：访问计数器</h3>
                <p>实现一个分布式访问计数器</p>
                <div class="code-block">
                  <pre><code>// 增加访问计数
async function incrementCounter(key) {
  const current = await MY_KV.get(`counter:${key}`);
  const count = parseInt(current || "0") + 1;

  await MY_KV.put(`counter:${key}`, count.toString());
  return count;
}

// 获取计数
async function getCounter(key) {
  const count = await MY_KV.get(`counter:${key}`);
  return parseInt(count || "0");
}

// 重置计数器
async function resetCounter(key) {
  await MY_KV.delete(`counter:${key}`);
}</code></pre>
                </div>
              </div>

              <div class="example-section">
                <h3>⚙️ 示例 3：配置管理</h3>
                <p>动态配置管理系统</p>
                <div class="code-block">
                  <pre><code>// 获取配置
async function getConfig(key, defaultValue = null) {
  const config = await MY_KV.get(`config:${key}`);
  return config ? JSON.parse(config) : defaultValue;
}

// 更新配置
async function updateConfig(key, value) {
  await MY_KV.put(`config:${key}`, JSON.stringify({
    value,
    updatedAt: new Date().toISOString()
  }));
}

// 批量获取配置
async function getBatchConfig(keys) {
  const configs = await Promise.all(
    keys.map(async key => {
      const value = await getConfig(key);
      return { key, value };
    })
  );

  return Object.fromEntries(
    configs.map(({ key, value }) => [key, value])
  );
}</code></pre>
                </div>
              </div>

              <div class="example-section">
                <h3>🎯 完整的 Worker 示例</h3>
                <p>一个完整的 Cloudflare Worker 示例，展示 KV 的综合使用</p>
                <div class="code-block">
                  <pre><code>export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 路由处理
    if (path.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // 静态资源缓存
    return handleStatic(request, env);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'GET' && url.pathname === '/api/data') {
    // 从 KV 读取数据
    const data = await env.MY_KV.get('api-data');
    return new Response(data || '{}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (method === 'POST' && url.pathname === '/api/data') {
    // 写入数据到 KV
    const body = await request.text();
    await env.MY_KV.put('api-data', body);
    return new Response('OK');
  }

  return new Response('Not Found', { status: 404 });
}</code></pre>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-view {
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
  max-width: 450px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
}

.login-header {
  margin-bottom: 2rem;
}

.tutorial-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
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

/* 教程界面样式 */
.tutorial-header {
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

.tutorial-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  align-items: start;
}

/* 导航样式 */
.tutorial-nav {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2rem;
  position: sticky;
  top: 2rem;
}

.nav-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.nav-list {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.1);
}

.nav-item.active {
  background: var(--primary-color);
  color: var(--background-color);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-weight: 500;
}

/* 主要内容区域 */
.tutorial-main {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 3rem;
  min-height: 600px;
}

.content-section {
  max-width: none;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 简介页面样式 */
.intro-card {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.intro-card h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h4 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.use-cases {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
}

.use-cases h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.use-case-list {
  list-style: none;
  padding: 0;
}

.use-case-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.use-case-list li:last-child {
  border-bottom: none;
}

/* 设置页面样式 */
.setup-steps {
  margin-bottom: 2rem;
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.step-card:hover {
  border-color: var(--primary-color);
  transform: translateX(5px);
}

.step-number {
  background: var(--primary-color);
  color: var(--background-color);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.step-content h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.config-example {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
}

.config-example h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* 代码块样式 */
.code-block {
  background: #1a1a2e;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  margin: 1rem 0;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  padding: 1.5rem;
  font-family: "Fira Code", "Monaco", "Consolas", monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #e8e8f0;
}

.code-block code {
  background: none;
  padding: 0;
  font-family: inherit;
}

/* 外部链接样式 */
.external-link {
  color: var(--primary-color);
  text-decoration: underline;
  transition: color 0.3s ease;
}

.external-link:hover {
  color: var(--accent-color);
}

/* 操作章节样式 */
.operation-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.operation-section h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.operation-section p {
  margin-bottom: 1rem;
  color: rgba(232, 232, 240, 0.8);
}

/* 高级特性样式 */
.feature-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.feature-section h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

/* 最佳实践样式 */
.practice-section {
  margin-bottom: 3rem;
}

.practice-section h3 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.practice-card {
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1rem;
}

.practice-card.good {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.practice-card.bad {
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.3);
}

.practice-card h4 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.practice-card.good h4 {
  color: var(--success-color);
}

.practice-card.bad h4 {
  color: var(--accent-color);
}

.practice-card ul {
  list-style: none;
  padding: 0;
}

.practice-card li {
  padding: 0.3rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.practice-card li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--primary-color);
}

.practice-card code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: "Monaco", "Consolas", monospace;
  font-size: 0.9rem;
}

.tip-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.tip-card h4 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.security-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.security-tip {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.security-tip h4 {
  color: var(--purple-accent);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

/* 示例样式 */
.example-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.example-section h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tutorial-view {
    padding-top: 6rem;
  }

  .page-title {
    font-size: 2.5rem;
  }

  .tutorial-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .tutorial-nav {
    position: static;
  }

  .login-card {
    padding: 2rem;
    margin: 0 1rem;
  }

  .tutorial-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .step-number {
    align-self: center;
  }

  .security-tips {
    grid-template-columns: 1fr;
  }

  .tutorial-main {
    padding: 2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .code-block pre {
    font-size: 0.8rem;
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .tutorial-main {
    padding: 1.5rem;
  }

  .step-card,
  .operation-section,
  .feature-section,
  .example-section {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.8rem;
  }
}
</style>
