<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

const isScrolled = ref(false);
const isMenuOpen = ref(false);
const route = useRoute();
const router = useRouter();

const links = [
  { label: "首页", meta: "Home", to: "/", section: "home" },
  { label: "作品", meta: "Works", to: "/", section: "projects" },
  { label: "影像", meta: "Gallery", to: "/", section: "gallery" },
  { label: "状态", meta: "Signal", to: "/", section: "status" },
  { label: "留言", meta: "Message", to: "/messages" },
];

const toolLinks = [
  { label: "图片", to: "/image" },
  { label: "书签", to: "/bookmarks" },
  { label: "短链", to: "/links" },
  { label: "教程", to: "/tutorial" },
  { label: "密钥", to: "/apikeys" },
  { label: "访问", to: "/visits" },
  { label: "后台", to: "/admin" },
];

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = "";
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";
};

const navigateHome = async (sectionId = "home") => {
  closeMenu();
  if (route.path !== "/") {
    await router.push("/");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 120);
    return;
  }
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 18;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  document.body.style.overflow = "";
});

watch(() => route.fullPath, closeMenu);
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="container navbar-inner">
      <nav class="nav-desktop" aria-label="主导航">
        <template v-for="link in links" :key="link.label">
          <button v-if="link.section" class="nav-link" type="button" @click="navigateHome(link.section)">
            <span>{{ link.label }}</span>
            <small>{{ link.meta }}</small>
          </button>
          <RouterLink v-else class="nav-link" :to="link.to">
            <span>{{ link.label }}</span>
            <small>{{ link.meta }}</small>
          </RouterLink>
        </template>

        <div class="tools-menu">
          <button class="nav-link tools-trigger" type="button">
            <span>工具</span>
            <small>Tools</small>
          </button>
          <div class="tools-popover">
            <RouterLink v-for="link in toolLinks" :key="link.label" class="tool-link" :to="link.to">
              {{ link.label }}
            </RouterLink>
          </div>
        </div>
      </nav>

      <button
        class="menu-btn"
        :class="{ open: isMenuOpen }"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        aria-label="打开菜单"
        @click="toggleMenu"
      >
        <span></span>
        <span></span>
      </button>
    </div>

    <div id="mobile-navigation" class="mobile-panel" :class="{ open: isMenuOpen }">
      <div class="container mobile-links">
        <template v-for="link in links" :key="link.label">
          <button v-if="link.section" class="mobile-link" type="button" @click="navigateHome(link.section)">
            {{ link.label }}
          </button>
          <RouterLink v-else class="mobile-link" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </template>

        <div class="mobile-tools">
          <span>工具入口</span>
          <RouterLink v-for="link in toolLinks" :key="link.label" class="mobile-link tool" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  inset: auto 0 calc(16px + env(safe-area-inset-bottom));
  z-index: 1000;
  pointer-events: none;
}

.navbar-inner {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.035)),
    rgba(8, 10, 15, 0.42);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(14px);
  transition: background var(--transition), border-color var(--transition), box-shadow var(--transition), transform var(--transition);
  pointer-events: auto;
}

.navbar.scrolled .navbar-inner {
  border-color: rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    rgba(8, 10, 15, 0.82);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.nav-desktop {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  min-width: 0;
  width: 100%;
  height: 54px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  margin: 0;
  border: 0;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
  transition: color var(--transition), background var(--transition), transform var(--transition);
}

.nav-link span,
.nav-link small {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  line-height: 1;
}

.nav-link small {
  color: var(--text-soft);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  background:
    radial-gradient(circle at 50% 0%, rgba(240, 179, 91, 0.2), transparent 58%),
    rgba(255, 255, 255, 0.1);
  color: var(--text);
  transform: translateY(-4px);
}

.nav-link:hover small,
.nav-link.router-link-active small {
  color: rgba(247, 242, 232, 0.68);
}

.nav-link.router-link-active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent-glow);
  transform: translateX(-50%);
}

.tools-menu {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 54px;
}

.tools-menu .nav-link {
  width: 100%;
  height: 54px;
}

.tools-popover {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: 168px;
  display: grid;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
  background: rgba(8, 10, 15, 0.92);
  box-shadow: var(--shadow-soft);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
  transition: opacity var(--transition), transform var(--transition);
}

.tools-menu:hover .tools-popover,
.tools-menu:focus-within .tools-popover {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.tool-link {
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 700;
}

.tool-link:hover,
.tool-link.router-link-active {
  color: var(--text);
  background: rgba(255, 255, 255, 0.08);
}

.menu-btn {
  display: none;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.06);
  transition: background var(--transition), border-color var(--transition);
}

.menu-btn:hover,
.menu-btn.open {
  border-color: rgba(240, 179, 91, 0.38);
  background: rgba(255, 255, 255, 0.11);
}

.menu-btn span {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--text);
  transition: transform var(--transition);
}

.menu-btn.open span:first-child {
  transform: translateY(4.5px) rotate(45deg);
}

.menu-btn.open span:last-child {
  transform: translateY(-4.5px) rotate(-45deg);
}

.mobile-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 10px);
  opacity: 0;
  pointer-events: none;
  transform: translateY(14px);
  transition: opacity var(--transition), transform var(--transition);
}

.mobile-links {
  display: grid;
  gap: 7px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    rgba(8, 10, 15, 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.mobile-link {
  min-height: 46px;
  display: flex;
  align-items: center;
  border-radius: var(--radius);
  padding: 0 14px;
  color: var(--text-muted);
  font-weight: 800;
  transition: background var(--transition), color var(--transition), transform var(--transition);
}

.mobile-tools {
  display: grid;
  gap: 7px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-tools > span {
  color: var(--text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mobile-link.tool {
  color: var(--text-soft);
}

.mobile-link.router-link-active,
.mobile-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  transform: translateX(2px);
}

@media (max-width: 760px) {
  .navbar {
    inset: auto 0 calc(12px + env(safe-area-inset-bottom));
  }

  .navbar-inner {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    height: 58px;
    padding: 8px 10px 8px 12px;
  }

  .nav-desktop {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .mobile-panel.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}
</style>
