<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { tutorialService } from "../services/tutorialService";

const isAuthenticated = ref(false);
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const selectedTutorial = ref<"kv" | "github-cli">("kv");
const activeSection = ref("overview");

const tutorials = {
  kv: {
    name: "KV",
    desc: "轻量数据存储笔记，记录站点数据如何保存、读取和维护。",
    sections: [
      { id: "overview", title: "概览", body: "键值存储适合保存读多写少的数据，例如收藏、留言、统计和配置。" },
      { id: "setup", title: "环境配置", body: "创建 KV 命名空间后，将它绑定到 Pages Functions 或 Workers，再通过绑定名读写数据。" },
      { id: "usage", title: "读写方式", body: "常见操作包括 put、get、delete 和 list。结构化内容建议统一使用 JSON 保存。" },
      { id: "practice", title: "实践建议", body: "键名使用稳定前缀，例如 bookmarks:、messages:、stats:，后续排查和迁移会更清楚。" },
    ],
  },
  "github-cli": {
    name: "GitHub CLI",
    desc: "命令行工作流笔记，整理仓库、PR 和 Issue 的常用操作。",
    sections: [
      { id: "overview", title: "概览", body: "GitHub CLI 可以把常用仓库操作放回终端，减少在网页和编辑器之间反复切换。" },
      { id: "setup", title: "安装登录", body: "安装 gh 后使用 gh auth login 完成认证，再通过 gh auth status 确认登录状态。" },
      { id: "usage", title: "常用流程", body: "gh repo、gh issue、gh pr 可以覆盖仓库查看、需求管理和合并请求处理。" },
      { id: "practice", title: "实践建议", body: "把重复的检查、发布和 PR 创建流程整理成脚本，能明显减少手动操作。" },
    ],
  },
};

const currentTutorial = computed(() => tutorials[selectedTutorial.value]);
const currentSection = computed(() =>
  currentTutorial.value.sections.find((section) => section.id === activeSection.value) ?? currentTutorial.value.sections[0]
);

const authenticate = async () => {
  if (!password.value.trim()) {
    error.value = "请输入访问密码";
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const ok = tutorialService.verifyTutorialPassword(password.value);
    if (ok) {
      tutorialService.setTutorialToken(password.value);
      isAuthenticated.value = true;
    } else {
      error.value = "密码错误";
    }
  } catch {
    error.value = "验证失败";
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  tutorialService.clearTutorialToken();
  isAuthenticated.value = false;
  password.value = "";
};

const changeTutorial = (key: "kv" | "github-cli") => {
  selectedTutorial.value = key;
  activeSection.value = "overview";
};

onMounted(() => {
  isAuthenticated.value = tutorialService.isAuthenticated();
});
</script>

<template>
  <div class="tutorial-view page-shell">
    <div class="container">
      <section v-if="!isAuthenticated" class="login-layout">
        <div class="login-copy">
          <span class="page-tag">Tutorial</span>
          <h1 class="page-title">私有技术笔记</h1>
          <p class="page-sub">这里整理部署、数据存储、仓库管理和日常开发流程。</p>
        </div>
        <form class="login-panel panel" @submit.prevent="authenticate">
          <h2>访问教程</h2>
          <input v-model="password" type="password" placeholder="访问密码" :disabled="loading" />
          <button class="btn" type="submit" :disabled="loading || !password.trim()">
            {{ loading ? "验证中" : "进入" }}
          </button>
          <p v-if="error">{{ error }}</p>
        </form>
      </section>

      <template v-else>
        <header class="page-hero">
          <div>
            <span class="page-tag">Tutorial</span>
            <h1 class="page-title">技术教程</h1>
            <p class="page-sub">{{ currentTutorial.desc }}</p>
          </div>
          <button class="btn btn-ghost logout-btn" @click="logout">退出</button>
        </header>

        <div class="tutorial-tabs">
          <button :class="['tab', { active: selectedTutorial === 'kv' }]" @click="changeTutorial('kv')">
            KV
          </button>
          <button :class="['tab', { active: selectedTutorial === 'github-cli' }]" @click="changeTutorial('github-cli')">
            GitHub CLI
          </button>
        </div>

        <div class="tutorial-layout">
          <aside class="tutorial-nav panel">
            <span class="section-kicker">Index</span>
            <button
              v-for="section in currentTutorial.sections"
              :key="section.id"
              :class="['nav-item', { active: activeSection === section.id }]"
              @click="activeSection = section.id"
            >
              {{ section.title }}
            </button>
          </aside>

          <article class="reader panel">
            <span class="section-kicker">{{ currentTutorial.name }}</span>
            <h2>{{ currentSection.title }}</h2>
            <p>{{ currentSection.body }}</p>
            <div class="code-card">
              <pre><code>{{ selectedTutorial === "kv" ? "await MY_KV.put('bookmarks:list', JSON.stringify(data))" : "gh auth status && gh pr list" }}</code></pre>
            </div>
          </article>
        </div>
      </template>
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

.login-panel {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.login-panel h2,
.reader h2 {
  color: var(--text);
  font-size: 1.8rem;
  font-weight: 800;
}

.login-panel p {
  color: var(--text-soft);
}

.logout-btn {
  justify-self: end;
}

.tutorial-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.tab {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 800;
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  background: var(--accent);
  color: var(--ink);
  border-color: var(--accent);
}

.tutorial-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 18px;
  align-items: start;
}

.tutorial-nav {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 8px;
  padding: 18px;
}

.nav-item {
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  text-align: left;
  color: var(--text-muted);
  font-weight: 800;
}

.nav-item:hover,
.nav-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.reader {
  min-height: 520px;
  padding: 28px;
}

.reader p {
  max-width: 780px;
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 1.04rem;
}

.code-card {
  margin-top: 28px;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.32);
}

pre {
  margin: 0;
  padding: 18px;
  color: var(--accent-2);
}

@media (max-width: 820px) {
  .login-layout,
  .tutorial-layout {
    grid-template-columns: 1fr;
  }

  .tutorial-nav {
    position: static;
  }
}
</style>
