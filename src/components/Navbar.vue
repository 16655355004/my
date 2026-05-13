<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

const isScrolled = ref(false);
const isMenuOpen = ref(false);
const route = useRoute();
const router = useRouter();

const links = [
  { label: "首页", to: "/", section: "home" },
  { label: "收藏", to: "/bookmarks" },
  { label: "留言", to: "/messages" },
  { label: "教程", to: "/tutorial" },
  { label: "密钥", to: "/apikeys" },
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

watch(route, closeMenu);
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="container navbar-inner">
      <button class="brand" @click="navigateHome('home')" aria-label="回到首页">
        <span class="brand-mark">JL</span>
        <span class="brand-text">JisooLove</span>
      </button>

      <nav class="nav-desktop" aria-label="主导航">
        <template v-for="link in links" :key="link.label">
          <button v-if="link.section" class="nav-link" @click="navigateHome(link.section)">
            {{ link.label }}
          </button>
          <RouterLink v-else class="nav-link" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </template>
      </nav>

      <button class="menu-btn" :class="{ open: isMenuOpen }" @click="toggleMenu" aria-label="打开菜单">
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="mobile-panel" :class="{ open: isMenuOpen }">
      <div class="container mobile-links">
        <template v-for="link in links" :key="link.label">
          <button v-if="link.section" class="mobile-link" @click="navigateHome(link.section)">
            {{ link.label }}
          </button>
          <RouterLink v-else class="mobile-link" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  inset: 16px 0 auto;
  z-index: 1000;
  pointer-events: none;
}

.navbar-inner {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 14px;
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

.navbar.scrolled .navbar-inner,
.mobile-panel.open {
  border-color: rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    rgba(8, 10, 15, 0.82);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px 0 2px;
  border-radius: var(--radius);
  font-weight: 800;
  transition: background var(--transition), transform var(--transition);
}

.brand:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 11px;
  background: linear-gradient(135deg, var(--accent), #ffd08a 52%, var(--accent-2));
  color: var(--ink);
  font-size: 0.84rem;
  box-shadow: 0 10px 24px rgba(240, 179, 91, 0.28);
}

.brand-text {
  color: var(--text);
  font-size: 0.98rem;
  letter-spacing: 0.02em;
}

.nav-desktop {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.045);
}

.nav-link {
  position: relative;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 15px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 700;
  transition: color var(--transition), background var(--transition), transform var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  transform: translateY(-1px);
}

.nav-link.router-link-active::after {
  content: "";
  position: absolute;
  left: 15px;
  right: 15px;
  bottom: 6px;
  height: 2px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent-glow);
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
  display: none;
  margin-top: 10px;
  pointer-events: auto;
}

.mobile-links {
  display: grid;
  gap: 7px;
  padding: 12px;
  border-radius: var(--radius-lg);
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

.mobile-link.router-link-active,
.mobile-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  transform: translateX(2px);
}

@media (max-width: 760px) {
  .navbar {
    inset: 12px 0 auto;
  }

  .navbar-inner {
    height: 58px;
    padding-left: 12px;
  }

  .brand-mark {
    width: 34px;
    height: 34px;
  }

  .brand-text {
    font-size: 0.94rem;
  }

  .nav-desktop {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .mobile-panel.open {
    display: block;
  }
}
</style>
