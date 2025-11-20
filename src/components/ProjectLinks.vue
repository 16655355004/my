<script setup lang="ts">
import { ref, onMounted } from "vue";
import gsap from "gsap";

// 项目数据
const projects = ref([
  {
    id: "video-player",
    title: "视频播放器",
    description: "在线视频播放平台，支持多种格式，流畅播放体验",
    url: "https://video.jisoolove.top",
    icon: "video",
    color: "#ff6b6b",
    gradient: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
  },
  {
    id: "image-hosting",
    title: "图床服务",
    description: "集成Telegram频道的图片托管服务，快速分享图片",
    url: "https://img.jisoolove.top",
    icon: "image",
    color: "#4ecdc4",
    gradient: "linear-gradient(135deg, #4ecdc4, #44a08d)",
  },
  {
    id: "subscription-manager",
    title: "订阅管理",
    description: "智能订阅提醒系统，Telegram通知，不错过重要内容",
    url: "https://remind.jisoolove.top",
    icon: "bell",
    color: "#45b7d1",
    gradient: "linear-gradient(135deg, #45b7d1, #96c93d)",
  },
]);

// 打开项目链接
const openProject = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

// 组件挂载后的动画
onMounted(() => {
  try {
    // 确保卡片首先是可见的
    gsap.set(".project-card", { opacity: 1, y: 0, scale: 1 });

    // 项目卡片入场动画
    gsap.fromTo(
      ".project-card",
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 0.3,
      }
    );

    // 悬停动画效果
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          scale: 1.05,
          rotationY: 5,
          duration: 0.3,
          ease: "power2.out",
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          scale: 1,
          rotationY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
  } catch (error) {
    console.warn("GSAP animation failed, using fallback:", error);
    // Fallback: ensure cards are visible
    document.querySelectorAll(".project-card").forEach((card) => {
      (card as HTMLElement).style.opacity = "1";
      (card as HTMLElement).style.transform = "translateY(0) scale(1)";
    });
  }
});
</script>

<template>
  <div class="project-links">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">我的项目</h2>
        <p class="section-subtitle">探索我开发的实用工具和服务</p>
      </div>

      <div class="projects-grid">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card"
          @click="openProject(project.url)"
          :style="{ '--project-color': project.color }"
        >
          <!-- 项目图标 -->
          <div class="project-icon-wrapper" :style="{ background: project.gradient }">
            <!-- 视频播放器图标 -->
            <svg
              v-if="project.icon === 'video'"
              class="project-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                stroke-width="2"
              />
              <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
            </svg>

            <!-- 图片图标 -->
            <svg
              v-else-if="project.icon === 'image'"
              class="project-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <!-- 铃铛图标 -->
            <svg
              v-else-if="project.icon === 'bell'"
              class="project-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- 项目内容 -->
          <div class="project-content">
            <h3 class="project-title">{{ project.title }}</h3>
            <p class="project-description">{{ project.description }}</p>
            <div class="project-url">{{ project.url.replace("https://", "") }}</div>
          </div>

          <!-- 外部链接图标 -->
          <div class="external-link-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- 悬停效果背景 -->
          <div class="hover-bg" :style="{ background: project.gradient }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-links {
  padding: 6rem 0;
  position: relative;
  z-index: 2;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.project-links::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    rgba(0,0,0,0.4) 0%, 
    rgba(0,0,0,0.2) 50%, 
    rgba(0,0,0,0.4) 100%);
  z-index: 1;
}

.project-links .container {
  position: relative;
  z-index: 2;
}

[data-theme="dark"] .project-links {
  background-image: url('https://mail.jisoolove.top/2.webp');
}

[data-theme="light"] .project-links {
  background-image: url('https://mail.jisoolove.top/77.webp');
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--text-color, #eeeeee), var(--primary-color, #00adb5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  /* Fallback color in case gradient doesn't work */
  color: #eeeeee;
}

.section-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.project-card {
  position: relative;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  opacity: 1;
  visibility: visible;
}

.project-card:hover {
  border-color: var(--project-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.project-card:hover .hover-bg {
  opacity: 0.1;
}

.hover-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.project-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* Ensure icon wrapper is visible */
  opacity: 1;
}

.project-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.project-content {
  flex: 1;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.project-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.project-url {
  font-size: 0.9rem;
  color: var(--project-color, #00adb5);
  font-weight: 500;
  font-family: "Courier New", monospace;
}

.external-link-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.project-card:hover .external-link-icon {
  color: var(--project-color);
  transform: translate(2px, -2px);
}

.external-link-icon svg {
  width: 100%;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-links {
    padding: 4rem 0;
  }

  .container {
    padding: 0 1rem;
  }

  .section-title {
    font-size: 2.5rem;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .project-card {
    padding: 1.5rem;
  }

  .project-icon-wrapper {
    width: 50px;
    height: 50px;
  }

  .project-icon {
    width: 28px;
    height: 28px;
  }

  .project-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 2rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .project-card {
    padding: 1.25rem;
  }
}
</style>
