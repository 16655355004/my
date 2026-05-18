<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { emojiCursor, type CursorEffectResult } from "cursor-effects";
import Loader from "./components/LoaderOptimized.vue";
import Navbar from "./components/Navbar.vue";
import { statisticsService } from "./services/statisticsService";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const route = useRoute();
let cursorEffect: CursorEffectResult | null = null;

const handleLoaderComplete = () => {
  gsap.to(".page-content", {
    opacity: 1,
    y: 0,
    duration: 0.55,
    ease: "power2.out",
  });

  gsap.fromTo(
    ".navbar-inner",
    { opacity: 0, y: 32, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: "power3.out" },
  );

  gsap.from(".nav-link, .menu-btn", {
    opacity: 0,
    y: 12,
    duration: 0.42,
    ease: "power2.out",
    stagger: 0.045,
    delay: 0.18,
  });

  ScrollTrigger.refresh();
};

onMounted(() => {
  statisticsService.recordVisit(route.fullPath).catch(() => {
    // Visit tracking should not block the app shell.
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!prefersReducedMotion && finePointer) {
    cursorEffect = emojiCursor({
      emoji: ["🐾", "🐱", "✨"],
      delay: 26,
    });
  }

  document.addEventListener("loader-complete", handleLoaderComplete);
});

onUnmounted(() => {
  cursorEffect?.destroy();
  document.removeEventListener("loader-complete", handleLoaderComplete);
});

watch(() => route.fullPath, (path) => {
  statisticsService.recordVisit(path).catch(() => {
    // Route tracking should not block navigation.
  });
});
</script>

<template>
  <div class="app-shell">
    <div class="stage-bg" aria-hidden="true">
      <div class="stage-gradient stage-a"></div>
      <div class="stage-gradient stage-b"></div>
      <div class="stage-rails"></div>
      <div class="stage-noise"></div>
    </div>

    <Loader />
    <Navbar />

    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
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
    radial-gradient(circle at 20% 8%, rgba(83, 198, 176, 0.16), transparent 28rem),
    linear-gradient(135deg, #080a0f 0%, #11141b 48%, #17100d 100%);
}

.stage-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.stage-gradient {
  position: absolute;
  width: 34vw;
  min-width: 320px;
  aspect-ratio: 1;
  border-radius: 999px;
  filter: blur(46px);
  opacity: 0.32;
  animation: drift 12s ease-in-out infinite;
}

.stage-a {
  top: -16%;
  right: -8%;
  background: #f0b35b;
}

.stage-b {
  left: -14%;
  bottom: 8%;
  background: #53c6b0;
  animation-duration: 15s;
  animation-delay: -4s;
}

.stage-rails {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 16%, black 72%, transparent 100%);
}

.stage-noise {
  position: absolute;
  inset: 0;
  opacity: 0.11;
  background-image:
    repeating-radial-gradient(circle at 20% 30%, rgba(255,255,255,0.45) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}

.page-content {
  position: relative;
  z-index: 1;
  padding-bottom: 124px;
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 760px) {
  .page-content {
    padding-bottom: 128px;
  }
}
</style>
