<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bookmarkService, type Website } from "../services/bookmarkService";

const websites = ref<Website[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const searchQuery = ref("");
const selectedCategory = ref("全部");

// 动态计算分类列表
const categories = computed(() => {
  const uniqueCategories = new Set(websites.value.map((site) => site.category));
  return ["全部", ...Array.from(uniqueCategories)];
});

const filteredWebsites = computed(() => {
  let filtered = websites.value;

  if (selectedCategory.value !== "全部") {
    filtered = filtered.filter((site) => site.category === selectedCategory.value);
  }

  if (searchQuery.value) {
    filtered = filtered.filter(
      (site) =>
        site.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        site.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

const openWebsite = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

// 加载书签数据
const loadBookmarks = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await bookmarkService.getAllBookmarks();

    if (response.success && response.data) {
      websites.value = response.data;
    } else {
      error.value = response.error || "加载书签失败";
      // 如果 API 失败，使用默认数据作为后备
      websites.value = getDefaultBookmarks();
    }
  } catch (err) {
    console.error("Failed to load bookmarks:", err);
    error.value = "网络连接失败";
    // 使用默认数据作为后备
    websites.value = getDefaultBookmarks();
  } finally {
    loading.value = false;
  }
};

// 默认书签数据（作为后备）
const getDefaultBookmarks = (): Website[] => [
  {
    id: 1,
    name: "Reqable",
    description: "API抓包调试 + API测试一站式工具",
    url: "https://reqable.com/",
    icon: "🔧",
    category: "开发工具",
    color: "#00d4ff",
  },
  {
    id: 2,
    name: "PowerToys",
    description: "Microsoft Learn - Windows实用工具集",
    url: "https://learn.microsoft.com/zh-cn/windows/powertoys/install",
    icon: "⚡",
    category: "系统工具",
    color: "#ff3366",
  },
  {
    id: 3,
    name: "Flow Launcher",
    description: "快速启动器和搜索工具",
    url: "https://www.flowlauncher.com/",
    icon: "🚀",
    category: "效率工具",
    color: "#8b5cf6",
  },
  {
    id: 4,
    name: "GitHub",
    description: "全球最大的代码托管平台",
    url: "https://github.com/",
    icon: "🐙",
    category: "开发工具",
    color: "#24292e",
  },
  {
    id: 5,
    name: "VS Code",
    description: "微软开发的免费代码编辑器",
    url: "https://code.visualstudio.com/",
    icon: "💻",
    category: "开发工具",
    color: "#007acc",
  },
  {
    id: 6,
    name: "Figma",
    description: "协作式界面设计工具",
    url: "https://www.figma.com/",
    icon: "🎨",
    category: "设计工具",
    color: "#f24e1e",
  },
];

// 重新加载数据
const refreshBookmarks = () => {
  loadBookmarks();
};

// 组件挂载时加载数据
onMounted(() => {
  loadBookmarks();
});
</script>

<template>
  <div class="bookmarks-view">
    <div class="container">
      <!-- 页面标题 -->
      <div class="bookmarks-header">
        <h1 class="page-title">网站收藏</h1>
        <p class="page-subtitle">精选实用工具和网站，提升工作效率</p>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <div class="search-box">
          <svg
            class="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="搜索网站..." class="search-input" />
        </div>
      </div>

      <!-- 分类筛选 -->
      <div class="category-filter">
        <button
          v-for="category in categories"
          :key="category"
          :class="['category-btn', { active: selectedCategory === category }]"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载书签...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="refreshBookmarks" class="retry-btn">重试</button>
      </div>

      <!-- 网站网格 -->
      <div v-else class="websites-grid">
        <div
          v-for="website in filteredWebsites"
          :key="website.id"
          class="website-card"
          @click="openWebsite(website.url)"
          :style="{ '--card-color': website.color }"
        >
          <div class="card-header">
            <div class="website-icon">{{ website.icon }}</div>
            <div class="category-tag">{{ website.category }}</div>
          </div>

          <div class="card-content">
            <h3 class="website-name">{{ website.name }}</h3>
            <p class="website-description">{{ website.description }}</p>
          </div>

          <div class="card-footer">
            <span class="visit-text">点击访问</span>
            <svg
              class="external-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredWebsites.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>没有找到相关网站</h3>
        <p>尝试调整搜索关键词或选择其他分类</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmarks-view {
  min-height: 100vh;
  padding-top: 8rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, var(--background-color) 0%, #0f0f1a 100%);
}

.bookmarks-header {
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

.search-section {
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

.search-box {
  position: relative;
  max-width: 500px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(232, 232, 240, 0.5);
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 50px;
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.search-input::placeholder {
  color: rgba(232, 232, 240, 0.5);
}

.category-filter {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.8rem 1.5rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.category-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.category-btn.active {
  background: var(--primary-color);
  color: var(--background-color);
  border-color: var(--primary-color);
}

.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.website-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.website-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--card-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.website-card:hover::before {
  transform: scaleX(1);
}

.website-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: var(--card-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.website-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
}

.category-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  color: rgba(232, 232, 240, 0.8);
}

.card-content {
  margin-bottom: 1.5rem;
}

.website-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.website-description {
  color: rgba(232, 232, 240, 0.7);
  line-height: 1.6;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--card-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.external-icon {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.website-card:hover .external-icon {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(232, 232, 240, 0.6);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

/* 加载状态样式 */
.loading-state {
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 1.1rem;
  margin-top: 1rem;
}

/* 错误状态样式 */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(232, 232, 240, 0.7);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--accent-color);
}

.error-state p {
  margin-bottom: 2rem;
  color: rgba(232, 232, 240, 0.6);
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
}

.retry-btn:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
}

@media (max-width: 768px) {
  .bookmarks-view {
    padding-top: 6rem;
  }

  .page-title {
    font-size: 2.5rem;
  }

  .websites-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .website-card {
    padding: 1.5rem;
  }

  .category-filter {
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
}
</style>
