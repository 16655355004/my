<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

const isScrolled = ref(false);
const isMenuOpen = ref(false);
const route = useRoute();
const router = useRouter();

const navigateToSection = (sectionId: string) => {
  closeMenu();
  if (route.path !== "/") {
    router.push("/").then(() => {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  } else {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = "";
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 40;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

watch(route, () => {
  if (isMenuOpen.value) closeMenu();
});
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="container navbar-inner">
      <RouterLink to="/" class="logo" @click="closeMenu">KONG</RouterLink>

      <!-- 桌面端导航 -->
      <nav class="nav-desktop">
        <a @click="navigateToSection('home')" class="nav-link">首页</a>
        <RouterLink to="/bookmarks" class="nav-link">收藏</RouterLink>
        <RouterLink to="/messages"  class="nav-link">留言</RouterLink>
        <RouterLink to="/tutorial"  class="nav-link">教程</RouterLink>
        <RouterLink to="/apikeys"   class="nav-link">密钥</RouterLink>
      </nav>

      <!-- 移动端汉堡按钮 -->
      <button class="hamburger" :class="{ open: isMenuOpen }" @click="toggleMenu" aria-label="菜单">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- 移动端菜单 -->
    <div class="nav-mobile" :class="{ open: isMenuOpen }">
      <a @click="navigateToSection('home')" class="mobile-link">首页</a>
      <RouterLink to="/bookmarks" class="mobile-link" @click="closeMenu">收藏</RouterLink>
      <RouterLink to="/messages"  class="mobile-link" @click="closeMenu">留言</RouterLink>
      <RouterLink to="/tutorial"  class="mobile-link" @click="closeMenu">教程</RouterLink>
      <RouterLink to="/apikeys"   class="mobile-link" @click="closeMenu">密钥</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 200;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.navbar.scrolled {
  background: rgba(8, 8, 8, 0.92);
  border-bottom-color: var(--border);
  backdrop-filter: blur(12px);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

/* ── Logo ── */
.logo {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text);
  text-decoration: none;
  opacity: 1;
  transition: opacity var(--transition);
}

.logo:hover { opacity: 0.6; }

/* ── 桌面导航 ── */
.nav-desktop {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-link {
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-decoration: none;
  cursor: pointer;
  position: relative;
  padding-bottom: 2px;
  transition: color var(--transition);
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--text);
  transition: width 0.25s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text);
  opacity: 1;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

/* ── 汉堡 ── */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
  cursor: pointer;
  background: none;
  border: none;
}

.hamburger span {
  display: block;
  width: 22px;
  height: 1px;
  background: var(--text);
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* ── 移动端菜单 ── */
.nav-mobile {
  display: none;
  flex-direction: column;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  background: rgba(8, 8, 8, 0.98);
  gap: 0;
}

.mobile-link {
  padding: 0.9rem 0;
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: color var(--transition);
}

.mobile-link:last-child { border-bottom: none; }

.mobile-link:hover,
.mobile-link.router-link-active {
  color: var(--text);
}

@media (max-width: 768px) {
  .nav-desktop { display: none; }
  .hamburger   { display: flex; }
  .nav-mobile.open { display: flex; }
}
</style>
