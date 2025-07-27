<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

// 注册GSAP插件
gsap.registerPlugin(SplitText);

const isScrolled = ref(false);
const isMenuOpen = ref(false);
const logoRef = ref(null);
const route = useRoute();
const router = useRouter();

// 导航到锚点的函数
const navigateToSection = (sectionId: string) => {
  isMenuOpen.value = false;

  // 如果不在首页，先跳转到首页
  if (route.path !== "/") {
    router.push("/").then(() => {
      // 等待页面加载后滚动到指定区域
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    });
  } else {
    // 如果已在首页，直接滚动
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }
};

const handleScroll = () => {
  if (window.scrollY > 50) {
    if (!isScrolled.value) {
      isScrolled.value = true;
      // 向下滚动时添加动画
      gsap.to(".navbar", {
        padding: "1rem 0",
        backgroundColor: "rgba(34, 40, 49, 0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  } else {
    if (isScrolled.value) {
      isScrolled.value = false;
      // 回到顶部时添加动画
      gsap.to(".navbar", {
        padding: "1.5rem 0",
        backgroundColor: "transparent",
        backdropFilter: "blur(0px)",
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";

  // 添加菜单打开/关闭的动画 - 优化速度
  if (isMenuOpen.value) {
    // 先显示背景
    gsap.to(".nav-background", {
      opacity: 1,
      visibility: "visible",
      duration: 0.2,
    });

    // 然后显示菜单
    gsap.to(".nav-menu", {
      opacity: 1,
      visibility: "visible",
      x: 0,
      duration: 0.3,
      ease: "power2.out",
    });

    // 菜单项依次显示 - 更快的动画
    gsap.from(".nav-item", {
      opacity: 0,
      y: 20,
      stagger: 0.05,
      duration: 0.25,
      delay: 0.1,
      ease: "power2.out",
    });
  } else {
    // 关闭菜单 - 更快的关闭动画
    gsap.to(".nav-menu", {
      opacity: 0,
      x: "100%",
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(".nav-menu", { visibility: "hidden" });
      },
    });

    // 隐藏背景
    gsap.to(".nav-background", {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        gsap.set(".nav-background", { visibility: "hidden" });
      },
    });
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);

  // Logo动画
  if (logoRef.value) {
    const logoText = new SplitText(logoRef.value, { type: "chars" });

    gsap.from(logoText.chars, {
      opacity: 0,
      scale: 0,
      y: 20,
      rotationX: -90,
      stagger: 0.05,
      duration: 0.8,
      delay: 2.5, // 等待加载动画完成
      ease: "back.out(1.7)",
    });
  }

  // 导航链接动画
  gsap.from(".nav-item", {
    opacity: 0,
    y: -20,
    stagger: 0.1,
    duration: 0.6,
    delay: 2.8, // 在logo之后显示
    ease: "power2.out",
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 监听路由变化，自动关闭菜单
watch(route, () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false;
  }
});
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="container navbar-container">
      <RouterLink to="/" class="logo">
        <span ref="logoRef">空空</span>
      </RouterLink>

      <div class="hamburger" @click="toggleMenu">
        <div :class="['hamburger-line', { active: isMenuOpen }]"></div>
      </div>

      <nav :class="['nav-menu', { active: isMenuOpen }]">
        <div class="nav-background"></div>
        <ul class="nav-list">
          <li class="nav-item">
            <a @click="navigateToSection('home')" class="nav-link">首页</a>
          </li>

          <li class="nav-item" @click="isMenuOpen = false">
            <RouterLink to="/playground" class="nav-link">动画实验室</RouterLink>
          </li>

          <li class="nav-item" @click="isMenuOpen = false">
            <RouterLink to="/bookmarks" class="nav-link">网站收藏</RouterLink>
          </li>

          <li class="nav-item" @click="isMenuOpen = false">
            <RouterLink to="/messages" class="nav-link">留言板</RouterLink>
          </li>

          <li class="nav-item" @click="isMenuOpen = false">
            <RouterLink to="/tutorial" class="nav-link">KV教程</RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem 0;
  z-index: 100;
  transition: all var(--transition-medium);
  will-change: padding, background-color, box-shadow;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
  position: relative;
  z-index: 101;
  will-change: transform, opacity;
}

.logo span {
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  will-change: transform, opacity;
  position: relative;
  animation: lightning 4s infinite;
}

/* 闪烁雷电动画 */
@keyframes lightning {
  0% {
    text-shadow: none;
    filter: brightness(1);
  }
  45% {
    text-shadow: none;
    filter: brightness(1);
  }
  46% {
    text-shadow: 0 0 5px rgba(0, 212, 255, 0.7), 0 0 10px rgba(0, 212, 255, 0.7);
    filter: brightness(1.2);
  }
  47% {
    text-shadow: none;
    filter: brightness(1);
  }
  48% {
    text-shadow: 0 0 5px rgba(0, 212, 255, 0.7), 0 0 15px rgba(0, 212, 255, 0.7),
      0 0 25px rgba(0, 212, 255, 0.7);
    filter: brightness(1.5);
  }
  50% {
    text-shadow: none;
    filter: brightness(1);
  }
  52% {
    text-shadow: 0 0 5px rgba(0, 212, 255, 0.7), 0 0 10px rgba(0, 212, 255, 0.7),
      0 0 15px rgba(0, 212, 255, 0.7), 0 0 30px rgba(0, 212, 255, 0.7);
    filter: brightness(1.8);
  }
  54% {
    text-shadow: none;
    filter: brightness(1);
  }
  100% {
    text-shadow: none;
    filter: brightness(1);
  }
}

.logo span::before {
  content: "";
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 0;
  background: linear-gradient(to bottom, transparent, var(--primary-color));
  opacity: 0;
  animation: lightning-strike 4s infinite;
}

@keyframes lightning-strike {
  0% {
    height: 0;
    opacity: 0;
  }
  46% {
    height: 0;
    opacity: 0;
  }
  48% {
    height: 20px;
    opacity: 0.6;
  }
  52% {
    height: 0;
    opacity: 0;
  }
  100% {
    height: 0;
    opacity: 0;
  }
}

.hamburger {
  display: none;
  cursor: pointer;
  width: 30px;
  height: 20px;
  position: relative;
  z-index: 101;
}

.hamburger-line {
  width: 30px;
  height: 2px;
  background-color: var(--text-color);
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  transition: all 0.3s;
}

.hamburger-line::before,
.hamburger-line::after {
  content: "";
  position: absolute;
  width: 30px;
  height: 2px;
  background-color: var(--text-color);
  transition: all 0.3s;
}

.hamburger-line::before {
  transform: translateY(-8px);
}

.hamburger-line::after {
  transform: translateY(8px);
}

.hamburger-line.active {
  background-color: transparent;
}

.hamburger-line.active::before {
  transform: rotate(45deg);
}

.hamburger-line.active::after {
  transform: rotate(-45deg);
}

.nav-menu {
  display: flex;
  align-items: center;
}

.nav-list {
  display: flex;
  list-style: none;
}

.nav-item {
  margin-left: 2.5rem;
}

.nav-link {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  position: relative;
  padding: 0.3rem 0;
  cursor: pointer;
  text-decoration: none;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: width var(--transition-medium);
  will-change: width;
}

.nav-link:hover::after,
.router-link-active::after {
  width: 100%;
}

.nav-background {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(34, 40, 49, 0.98);
  z-index: 99;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-medium);
}

@media (max-width: 768px) {
  .hamburger {
    display: block;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    flex-direction: column;
    justify-content: center;
    transform: translateX(100%);
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-medium);
    z-index: 100;
    will-change: transform, opacity;
  }

  .nav-background {
    display: block;
  }

  .nav-list {
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 100;
  }

  .nav-item {
    margin: 1.5rem 0;
    will-change: transform, opacity;
  }

  .nav-link {
    font-size: 1.5rem;
  }
}
</style>
