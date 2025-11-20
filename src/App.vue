<script setup lang="ts">
import { RouterView } from "vue-router";
import { onMounted, onUnmounted, ref } from "vue";
import Navbar from "./components/Navbar.vue";
import Loader from "./components/LoaderOptimized.vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const showBackToTop = ref(false);

const scrollToTop = () => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: 0 },
    ease: "power2.out",
  });
};

// 监听滚动显示返回顶部按钮
const handleScroll = () => {
  if (window.scrollY > 500) {
    if (!showBackToTop.value) {
      showBackToTop.value = true;
      gsap.to(".back-to-top", {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    }
  } else {
    if (showBackToTop.value) {
      showBackToTop.value = false;
      gsap.to(".back-to-top", {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.in",
      });
    }
  }
};

onMounted(() => {
  // 初始化页面转场动画
  initPageTransitions();

  // 监听滚动事件
  window.addEventListener("scroll", handleScroll, { passive: true });

  // 页面加载完成后的入场动画
  setTimeout(() => {
    const tl = gsap.timeline();

    // 主内容入场动画
    tl.to(".page-content", {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
    });

    // 活跃页面链接效果
    gsap.to(".router-link-active::after", {
      width: "100%",
      duration: 0.6,
      delay: 0.2,
      ease: "power2.out",
    });

    // 刷新ScrollTrigger以处理新元素
    ScrollTrigger.refresh();
  }, 2200); // 等待Loader动画完成
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener("scroll", handleScroll);
});

// 页面转场动画 - 新的实现方式
const initPageTransitions = () => {
  // 监听转场开始事件
  document.addEventListener("page-transition-start", (e: any) => {
    const { direction } = e.detail;
    const overlay = document.querySelector(".page-transition-overlay");

    if (overlay) {
      // 根据方向设置不同的转场效果
      if (direction === "forward") {
        gsap.fromTo(
          overlay,
          { x: "100%", opacity: 0 },
          { x: "0%", opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      } else {
        gsap.fromTo(
          overlay,
          { x: "-100%", opacity: 0 },
          { x: "0%", opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    }
  });

  // 监听转场结束事件
  document.addEventListener("page-transition-end", () => {
    const overlay = document.querySelector(".page-transition-overlay");
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(overlay, { x: "100%" });
          ScrollTrigger.refresh();
        },
      });
    }
  });
};
</script>

<template>
  <div class="app">
    <Loader />

    <Navbar />

    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- 页面转场遮罩 -->
    <div class="page-transition-overlay"></div>

    <!-- 返回顶部按钮
    <button
      @click="scrollToTop"
      :class="['scroll-to-top', { visible: showBackToTop }]"
      aria-label="回到顶部"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button> -->
  </div>
</template>

<style>
@import "./assets/main.css";
@import "./assets/animations.css";

:root {
  --background-color: #0a0a0f;
  --text-color: #e8e8f0;
  --primary-color: #00d4ff;
  --secondary-color: #1a1a2e;
  --accent-color: #ff3366;
  --success-color: #00ff88;
  --purple-accent: #8b5cf6;
  --blue-accent: #3b82f6;
  --transition-fast: 0.3s;
  --transition-medium: 0.5s;
  --transition-slow: 0.8s;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 隐藏滚动条但保留滚动功能 */
body::-webkit-scrollbar {
  width: 6px;
}

body::-webkit-scrollbar-track {
  background-color: var(--background-color);
}

body::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  border-radius: 3px;
}

.app {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.page-content {
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  z-index: 1;
  will-change: transform, opacity;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section {
  padding: 6rem 0;
  position: relative;
}

a {
  color: inherit;
  text-decoration: none;
}

.btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  outline: none;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 0%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  z-index: -1;
}

.btn:hover::before {
  width: 100%;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--background-color);
}

.btn-primary:hover {
  background-color: #00c2cc;
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 173, 181, 0.3);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: var(--background-color);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 173, 181, 0.3);
}

/* 页面转场动画 - 滑动效果 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, opacity;
}

/* 前进动画 */
[data-transition-direction="forward"] .page-transition-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}

[data-transition-direction="forward"] .page-transition-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}

/* 后退动画 */
[data-transition-direction="backward"] .page-transition-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}

[data-transition-direction="backward"] .page-transition-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}

/* 页面转场遮罩 - 现代滑动效果 */
.page-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1) 0%,
    rgba(26, 26, 46, 0.95) 50%,
    rgba(139, 92, 246, 0.1) 100%
  );
  backdrop-filter: blur(10px);
  transform: translateX(100%);
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
  will-change: transform, opacity;
}

/* 添加一些装饰效果 */
.page-transition-overlay::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 3px solid var(--primary-color);
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 返回顶部按钮 */
.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 173, 181, 0.3);
  z-index: 1000;
  opacity: 0;
  scale: 0.8;
  transition: all 0.3s ease;
}

.back-to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 173, 181, 0.4);
}

.back-to-top:active {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }

  .section {
    padding: 4rem 0;
  }

  .back-to-top {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 45px;
    height: 45px;
  }
}
</style>
