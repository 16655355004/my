<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

const websites = ref<Website[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedCategory = ref("全部");

const categories = computed(() => {
  const set = new Set(websites.value.map((s) => s.category));
  return ["全部", ...Array.from(set)];
});

const filtered = computed(() => {
  let list = websites.value;
  if (selectedCategory.value !== "全部") {
    list = list.filter((s) => s.category === selectedCategory.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }
  return list;
});

const openWebsite = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const getDefaultBookmarks = (): Website[] => [
  { id: 1, name: "Reqable",       description: "API 抓包调试 + API 测试一站式工具",       url: "https://reqable.com/",          icon: "R", category: "开发工具", color: "#fff" },
  { id: 2, name: "PowerToys",     description: "Microsoft Windows 实用工具集",            url: "https://learn.microsoft.com/zh-cn/windows/powertoys/install", icon: "P", category: "系统工具", color: "#fff" },
  { id: 3, name: "Flow Launcher", description: "快速启动器和搜索工具",                    url: "https://www.flowlauncher.com/",  icon: "F", category: "效率工具", color: "#fff" },
  { id: 4, name: "GitHub",        description: "全球最大的代码托管平台",                  url: "https://github.com/",            icon: "G", category: "开发工具", color: "#fff" },
  { id: 5, name: "VS Code",       description: "微软开发的免费代码编辑器",                url: "https://code.visualstudio.com/", icon: "V", category: "开发工具", color: "#fff" },
  { id: 6, name: "Figma",         description: "协作式界面设计工具",                      url: "https://www.figma.com/",         icon: "F", category: "设计工具", color: "#fff" },
];

const loadBookmarks = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await bookmarkService.getAllBookmarks();
    websites.value = res.success && res.data ? res.data : getDefaultBookmarks();
    if (!res.success) error.value = res.error ?? "加载失败";
  } catch {
    websites.value = getDefaultBookmarks();
    error.value = "网络连接失败";
  } finally {
    loading.value = false;
  }
};

onMounted(loadBookmarks);
</script>

<template>
  <div class="bookmarks-view">
    <div class="container">
      <!-- 页头 -->
      <div class="page-head">
        <span class="page-tag">BOOKMARKS</span>
        <h1 class="page-title">网站收藏</h1>
        <p class="page-sub">精选实用工具和网站，提升工作效率</p>
      </div>

      <!-- 搜索 & 分类 -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7.5"/>
            <path d="m20.5 20.5-4.8-4.8" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="搜索网站…"
          />
        </div>

        <div class="category-tabs">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['cat-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat"
          >{{ cat }}</button>
        </div>
      </div>

      <!-- 加载 -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>正在加载…</p>
      </div>

      <!-- 网格 -->
      <div v-else class="websites-grid">
        <div
          v-for="site in filtered"
          :key="site.id"
          class="site-card"
          @click="openWebsite(site.url)"
          role="link"
          tabindex="0"
          @keydown.enter="openWebsite(site.url)"
        >
          <div class="site-head">
            <div class="site-icon">{{ (site.icon ?? site.name.charAt(0)).slice(0,2) }}</div>
            <span class="site-cat">{{ site.category }}</span>
          </div>
          <h3 class="site-name">{{ site.name }}</h3>
          <p class="site-desc">{{ site.description }}</p>
          <div class="site-foot">
            <span class="visit-text">访问</span>
            <svg class="ext-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M7 17L17 7M17 7H7M17 7v10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filtered.length === 0" class="state-box full-width">
          <p class="state-title">没有找到相关网站</p>
          <p class="state-sub">调整关键词或选择其他分类</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmarks-view {
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
}

/* ── 页头 ── */
.page-head {
  padding: 3rem 0 2.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2.5rem;
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
  color: var(--text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 0.95rem;
  color: var(--text-muted);
}

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.search-wrap {
  position: relative;
  max-width: 420px;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-dim);
}

.search-input {
  padding-left: 2.5rem !important;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.9rem;
  border-radius: 2px;
}

.search-input:focus { border-color: var(--border-active); }

.category-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text-muted);
  cursor: pointer;
  background: transparent;
  transition: all var(--transition);
}

.cat-btn:hover {
  border-color: var(--border-hover);
  color: var(--text);
}

.cat-btn.active {
  border-color: var(--text);
  color: var(--text);
  background: var(--bg-3);
}

/* ── 卡片网格 ── */
.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
}

.site-card {
  padding: 1.75rem;
  background: var(--bg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: background var(--transition);
}

.site-card:hover {
  background: var(--bg-2);
}

.site-card:hover .ext-icon {
  transform: translate(3px, -3px);
  opacity: 1;
}

.site-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-icon {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: 2px;
}

.site-cat {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.site-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
}

.site-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
  flex: 1;
}

.site-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.visit-text {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--text-dim);
}

.ext-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  opacity: 0.4;
  transition: transform var(--transition), opacity var(--transition);
}

/* ── 状态 ── */
.state-box {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.state-title {
  font-size: 1rem;
  color: var(--text);
}

.state-sub {
  font-size: 0.85rem;
  color: var(--text-dim);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-hover);
  border-top-color: var(--text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .websites-grid { grid-template-columns: 1fr; }
}
</style>
