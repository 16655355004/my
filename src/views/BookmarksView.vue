<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

const websites = ref<Website[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedCategory = ref("全部");

const fallbackBookmarks = (): Website[] => [
  { id: 1, name: "Reqable", description: "接口调试、抓包分析和 API 测试工具。", url: "https://reqable.com/", icon: "RQ", category: "开发工具", color: "#f0b35b" },
  { id: 2, name: "PowerToys", description: "Windows 系统增强工具集合。", url: "https://learn.microsoft.com/zh-cn/windows/powertoys/install", icon: "PT", category: "系统工具", color: "#53c6b0" },
  { id: 3, name: "Flow Launcher", description: "快速启动应用、搜索文件和执行命令。", url: "https://www.flowlauncher.com/", icon: "FL", category: "效率工具", color: "#ef6f6c" },
  { id: 4, name: "GitHub", description: "代码托管、协作开发和自动化工作流平台。", url: "https://github.com/", icon: "GH", category: "开发工具", color: "#f0b35b" },
  { id: 5, name: "VS Code", description: "轻量、灵活、插件丰富的代码编辑器。", url: "https://code.visualstudio.com/", icon: "VS", category: "开发工具", color: "#53c6b0" },
  { id: 6, name: "Figma", description: "用于界面设计、原型和团队协作的设计工具。", url: "https://www.figma.com/", icon: "FG", category: "设计工具", color: "#ef6f6c" },
];

const categories = computed(() => {
  const set = new Set(websites.value.map((site) => site.category).filter(Boolean));
  return ["全部", ...Array.from(set)];
});

const filtered = computed(() => {
  let list = websites.value;
  if (selectedCategory.value !== "全部") {
    list = list.filter((site) => site.category === selectedCategory.value);
  }
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter((site) =>
      site.name.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query)
    );
  }
  return list;
});

const openWebsite = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const loadBookmarks = async () => {
  loading.value = true;
  error.value = null;
  try {
    const result = await bookmarkService.getAllBookmarks();
    websites.value = result.success && result.data?.length ? result.data : fallbackBookmarks();
    if (!result.success) error.value = "收藏列表暂时同步失败，已显示精选入口。";
  } catch {
    websites.value = fallbackBookmarks();
    error.value = "收藏列表暂时同步失败，已显示精选入口。";
  } finally {
    loading.value = false;
  }
};

onMounted(loadBookmarks);
</script>

<template>
  <div class="bookmarks-view page-shell">
    <div class="container">
      <header class="page-hero">
        <div>
          <span class="page-tag">Bookmarks</span>
          <h1 class="page-title">常用网站收藏</h1>
          <p class="page-sub">把开发、设计、系统和效率工具集中整理，打开后可以快速搜索和跳转。</p>
        </div>
        <div class="hero-card panel">
          <strong>{{ websites.length }}</strong>
          <span>个入口</span>
        </div>
      </header>

      <section class="toolbar panel">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="搜索站点、描述或工具名" />
        </div>
        <div class="category-tabs">
          <button
            v-for="category in categories"
            :key="category"
            :class="['chip', { active: selectedCategory === category }]"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </section>

      <p v-if="error" class="soft-alert">{{ error }}</p>

      <div v-if="loading" class="state-box panel">
        <div class="spinner"></div>
        <p>正在加载收藏</p>
      </div>

      <section v-else class="bookmark-grid">
        <article
          v-for="site in filtered"
          :key="site.id"
          class="bookmark-card"
          role="link"
          tabindex="0"
          @click="openWebsite(site.url)"
          @keydown.enter="openWebsite(site.url)"
        >
          <div class="bookmark-top">
            <span class="site-icon" :style="{ borderColor: site.color || 'var(--line)' }">
              {{ (site.icon || site.name.slice(0, 2)).slice(0, 2) }}
            </span>
            <span class="chip">{{ site.category }}</span>
          </div>
          <h2>{{ site.name }}</h2>
          <p>{{ site.description }}</p>
          <small>{{ site.url.replace(/^https?:\/\//, "") }}</small>
        </article>

        <div v-if="filtered.length === 0" class="state-box panel empty">
          <p>没有找到匹配的收藏。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-card {
  min-height: 150px;
  display: grid;
  align-content: end;
  padding: 22px;
}

.hero-card strong {
  color: var(--accent);
  font-size: 3rem;
  line-height: 1;
  font-weight: 800;
}

.hero-card span {
  color: var(--text-muted);
  font-weight: 800;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 420px) 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px;
  margin-bottom: 18px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip.active {
  color: var(--ink);
  border-color: var(--accent);
  background: var(--accent);
}

.soft-alert {
  margin: 0 0 18px;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.bookmark-card {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: transform var(--transition), border-color var(--transition), background var(--transition);
}

.bookmark-card:hover {
  transform: translateY(-5px);
  border-color: var(--line-strong);
  background: rgba(255, 255, 255, 0.1);
}

.bookmark-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: auto;
}

.site-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-weight: 800;
}

h2 {
  margin-top: 34px;
  color: var(--text);
  font-size: 1.35rem;
  font-weight: 800;
}

p {
  margin-top: 10px;
  color: var(--text-muted);
}

small {
  margin-top: 18px;
  color: var(--text-soft);
  font-size: 0.78rem;
}

.empty {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
