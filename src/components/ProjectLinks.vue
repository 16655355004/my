<script setup lang="ts">
import { ref, onMounted } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const projects = ref([
  {
    id: "video-player",
    title: "视频播放器",
    desc: "在线视频播放平台，支持多种格式，流畅播放体验",
    url: "https://video.jisoolove.top",
    tag: "MEDIA",
  },
  {
    id: "image-hosting",
    title: "图床服务",
    desc: "集成 Telegram 频道的图片托管服务，快速分享图片",
    url: "https://img.jisoolove.top",
    tag: "TOOLS",
  },
  {
    id: "subscription-manager",
    title: "订阅管理",
    desc: "智能订阅提醒系统，Telegram 通知，不错过重要内容",
    url: "https://remind.jisoolove.top",
    tag: "PRODUCTIVITY",
  },
]);

const openProject = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

onMounted(() => {
  gsap.from(".project-item", {
    opacity: 0,
    y: 20,
    stagger: 0.12,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".projects-list",
      start: "top 82%",
    },
  });
});
</script>

<template>
  <section class="project-links section">
    <div class="container">
      <div class="section-head">
        <span class="section-tag">PROJECTS</span>
        <h2 class="section-title">我的项目</h2>
      </div>

      <div class="projects-list">
        <div
          v-for="p in projects"
          :key="p.id"
          class="project-item"
          @click="openProject(p.url)"
          role="link"
          tabindex="0"
          @keydown.enter="openProject(p.url)"
        >
          <div class="project-left">
            <span class="project-tag">{{ p.tag }}</span>
            <h3 class="project-title">{{ p.title }}</h3>
            <p class="project-desc">{{ p.desc }}</p>
          </div>
          <div class="project-right">
            <span class="project-url">{{ p.url.replace("https://", "") }}</span>
            <!-- 外链箭头 -->
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M7 17L17 7M17 7H7M17 7v10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.project-links {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

/* ── 通用 section 头部（与 HomeView 保持一致） */
.section-head {
  margin-bottom: 2.5rem;
}

.section-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 400;
  color: var(--text);
}

/* ── 项目列表 ── */
.projects-list {
  display: flex;
  flex-direction: column;
}

.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all var(--transition);
}

.project-item:first-child {
  border-top: 1px solid var(--border);
}

.project-item:hover {
  padding-left: 0.75rem;
}

.project-item:hover .arrow-icon {
  transform: translate(3px, -3px);
  opacity: 1;
}

/* ── 左侧内容 ── */
.project-left {
  flex: 1;
}

.project-tag {
  display: inline-block;
  font-size: 0.65rem;
  letter-spacing: 0.25em;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.project-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 0.4rem;
}

.project-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ── 右侧 ── */
.project-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.project-url {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-family: "Courier New", monospace;
}

.arrow-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  opacity: 0.5;
  transition: transform var(--transition), opacity var(--transition);
}

@media (max-width: 640px) {
  .project-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .project-right { align-items: flex-start; flex-direction: row; }
}
</style>
