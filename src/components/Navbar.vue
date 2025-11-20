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
  // 立即关闭菜单
  closeMenu();

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

// 关闭菜单的函数
const closeMenu = () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false;
    document.body.style.overflow = "";

    // 关闭菜单动画
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

const handleScroll = () => {
  if (window.scrollY > 50) {
    if (!isScrolled.value) {
      isScrolled.value = true;
      // 向下滚动时添加动画
      gsap.to(".navbar", {
        padding: "1rem 0",
        backgroundColor: "rgba(34, 40, 49, 0.95)",
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
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }
};



// 微交互动画函数
const addMicroInteractions = () => {
  // 导航链接悬停动画
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      gsap.to(link, {
        scale: 1.05,
        color: "#00d4ff",
        textShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
        duration: 0.3,
        ease: "power2.out",
      });
    });

    link.addEventListener("mouseleave", () => {
      gsap.to(link, {
        scale: 1,
        color: "var(--text-color)",
        textShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      });
    });

    // 点击反馈动画
    link.addEventListener("click", () => {
      gsap.to(link, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    });
  });

  // Logo 悬停动画
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("mouseenter", () => {
      gsap.to(logo, {
        scale: 1.1,
        rotation: 5,
        duration: 0.4,
        ease: "back.out(1.7)",
      });

      // Logo 文字发光效果
      gsap.to(logo.querySelector("span"), {
        textShadow: "0 0 20px rgba(0, 212, 255, 0.8), 0 0 30px rgba(0, 212, 255, 0.6)",
        duration: 0.3,
      });
    });

    logo.addEventListener("mouseleave", () => {
      gsap.to(logo, {
        scale: 1,
        rotation: 0,
        duration: 0.4,
        ease: "power2.out",
      });

      gsap.to(logo.querySelector("span"), {
        textShadow: "none",
        duration: 0.3,
      });
    });
  }

  // 汉堡菜单按钮动画
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("mouseenter", () => {
      gsap.to(hamburger, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    hamburger.addEventListener("mouseleave", () => {
      gsap.to(hamburger, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";

  // 汉堡菜单按钮点击动画
  const hamburger = document.querySelector(".hamburger");
  gsap.to(hamburger, {
    scale: 0.9,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  });

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

    // 菜单项依次显示 - 更快的动画，添加弹跳效果
    gsap.from(".nav-item", {
      opacity: 0,
      y: 30,
      scale: 0.8,
      stagger: 0.08,
      duration: 0.4,
      delay: 0.1,
      ease: "back.out(1.7)",
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
  window.addEventListener("scroll", handleScroll, { passive: true });

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

  // 添加微交互动画
  setTimeout(() => {
    addMicroInteractions();
  }, 3000); // 等待初始动画完成后添加交互
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 监听路由变化，自动关闭菜单
watch(route, () => {
  if (isMenuOpen.value) {
    closeMenu();
  }
});
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="container navbar-container">
      <RouterLink to="/" class="logo" @click="closeMenu">
        <span ref="logoRef">KONG</span>
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

          <li class="nav-item" @click="closeMenu">
            <RouterLink to="/bookmarks" class="nav-link">网站收藏</RouterLink>
          </li>

          <li class="nav-item" @click="closeMenu">
            <RouterLink to="/messages" class="nav-link">留言板</RouterLink>
          </li>

          <li class="nav-item" @click="closeMenu">
            <RouterLink to="/tutorial" class="nav-link">教程</RouterLink>
          </li>

          <li class="nav-item" @click="closeMenu">
            <RouterLink to="/apikeys" class="nav-link">秘钥管理</RouterLink>
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
  background-clip: text;
  display: inline-block;
  will-change: transform, opacity;
  position: relative;
  animation: lightning 4s infinite;
  /* 确保文字始终可见的备用颜色 */
  color: var(--primary-color);
  font-family: "Parisienne", "Orbitron", "Arial Black", Arial, sans-serif;
}

/* 闪烁雷电动画 */
@keyframes lightning {
  0% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 1);
    filter: brightness(1);
  }

  45% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.3);
    filter: brightness(1);
  }

  46% {
    text-shadow: 0 0 5px rgba(0, 212, 255, 0.7), 0 0 10px rgba(0, 212, 255, 0.7);
    filter: brightness(1.2);
  }

  47% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.3);
    filter: brightness(1);
  }

  48% {
    text-shadow: 0 0 1px rgba(0, 212, 255, 0.7), 0 0 15px rgba(0, 212, 255, 0.7),
      0 0 25px rgba(0, 212, 255, 0.7);
    filter: brightness(1.5);
  }

  50% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.3);
    filter: brightness(1);
  }

  52% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.7), 0 0 10px rgba(0, 212, 255, 0.7),
      0 0 15px rgba(0, 212, 255, 0.7), 0 0 30px rgba(0, 212, 255, 0.7);
    filter: brightness(1.8);
  }

  54% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.3);
    filter: brightness(1);
  }

  100% {
    text-shadow: 0 0 2px rgba(0, 212, 255, 0.3);
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
  transition: all 0.3s ease;
  will-change: transform;
  padding: 5px;
  border-radius: 4px;
}

.hamburger:hover {
  background-color: rgba(0, 212, 255, 0.1);
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
  transition: all 0.3s ease;
  will-change: transform, color, text-shadow;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width var(--transition-medium);
  will-change: width;
  border-radius: 1px;
}

.nav-link:hover::after,
.router-link-active::after {
  width: 100%;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

/* 添加点击波纹效果 */
.nav-link::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
  pointer-events: none;
}

.nav-link:active::before {
  width: 200px;
  height: 200px;
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
