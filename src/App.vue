<script setup lang="ts">
import { RouterView } from "vue-router";
import { onMounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import SplitText from "gsap/SplitText";
import Navbar from "./components/Navbar.vue";
import Loader from "./components/Loader.vue";

const showBackToTop = ref(false);

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

// 返回顶部功能
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
  window.addEventListener("scroll", handleScroll);

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

// 页面转场动画
const initPageTransitions = () => {
  // 监听路由变化
  document.addEventListener("page-transition", () => {
    const tl = gsap.timeline();

    // 页面离开动画
    tl.to(".page-transition-overlay", {
      y: 0,
      duration: 0.5,
      ease: "power2.inOut",
    });

    // 页面进入动画
    tl.to(".page-transition-overlay", {
      y: "-100%",
      duration: 0.5,
      delay: 0.2,
      ease: "power2.inOut",
      onComplete: () => {
        // 刷新ScrollTrigger以确保新页面的动画正常工作
        ScrollTrigger.refresh();
      },
    });
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
  </div>

  <!-- 返回顶部按钮 -->
  <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop" aria-label="返回顶部">
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
  </button>
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

/* 页面转场动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
  will-change: transform, opacity;
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 页面转场遮罩 */
.page-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background-color);
  transform: translateY(-100%);
  z-index: 1000;
  pointer-events: none;
  will-change: transform;
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
