<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView, useRoute } from "vue-router";
import { fairyDustCursor, type CursorEffectResult } from "cursor-effects";
import Navbar from "./components/Navbar.vue";
import SiteFooter from "./components/SiteFooter.vue";
import { statisticsService } from "./services/statisticsService";

const route = useRoute();
let cursorEffect: CursorEffectResult | null = null;

// 固定种子的伪随机，保证每次渲染星星位置一致
const stars = Array.from({ length: 46 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rand = (offset: number) => (((seed + offset * 131) * 9301 + 49297) % 233280) / 233280;
  return {
    left: `${(rand(1) * 100).toFixed(2)}%`,
    top: `${(rand(2) * 100).toFixed(2)}%`,
    size: rand(3) > 0.82 ? 2.4 : 1.4,
    delay: `${(rand(4) * 6).toFixed(2)}s`,
    duration: `${(3.2 + rand(5) * 4).toFixed(2)}s`,
    tint: rand(6) > 0.75 ? "var(--accent-2)" : rand(6) > 0.5 ? "var(--accent)" : "#f2ecdf",
  };
});

onMounted(() => {
  statisticsService.recordVisit(route.fullPath).catch(() => {
    // Visit tracking should not block the app shell.
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!prefersReducedMotion && finePointer) {
    cursorEffect = fairyDustCursor({
      colors: ["#f2a0b5", "#a08cff", "#ffd98e", "#f2ecdf"],
    });
  }
});

onUnmounted(() => {
  cursorEffect?.destroy();
});
</script>

<template>
  <div class="app-shell">
    <div class="night-sky" aria-hidden="true">
      <div class="sky-wash"></div>
      <span
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.left,
          top: star.top,
          width: `${star.size}px`,
          height: `${star.size}px`,
          background: star.tint,
          animationDelay: star.delay,
          animationDuration: star.duration,
        }"
      ></span>
      <div class="moon"></div>
      <div class="grain"></div>
    </div>

    <Navbar />

    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <SiteFooter />
  </div>
</template>

<style>
@import "./assets/main.css";
@import "./assets/animations.css";

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  background:
    radial-gradient(ellipse 90% 55% at 78% -6%, rgba(160, 140, 255, 0.14), transparent 60%),
    radial-gradient(ellipse 70% 46% at 12% 110%, rgba(242, 160, 181, 0.1), transparent 55%),
    linear-gradient(178deg, #0c0e20 0%, #0a0c18 42%, #090a14 100%);
}

.night-sky {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.sky-wash {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 44% 36% at 80% 12%, rgba(255, 217, 142, 0.07), transparent 65%);
}

.star {
  position: absolute;
  border-radius: 50%;
  animation: twinkle 4s ease-in-out infinite;
}

.moon {
  position: absolute;
  top: 9vh;
  right: 8vw;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #fff8e6 0%, #ffe9b8 58%, #f5d68f 100%);
  opacity: 0.9;
  animation: moon-glow 7s ease-in-out infinite;
}

.grain {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    repeating-radial-gradient(circle at 20% 30%, rgba(242, 236, 223, 0.5) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}

.page-content {
  position: relative;
  z-index: 1;
}

@media (max-width: 760px) {
  .moon {
    top: 7vh;
    right: 6vw;
    width: 40px;
    height: 40px;
  }

}
</style>
