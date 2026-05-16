<script setup lang="ts">
import { onMounted, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import Loader from "./components/LoaderOptimized.vue";
import Navbar from "./components/Navbar.vue";
import { statisticsService } from "./services/statisticsService";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const route = useRoute();

onMounted(() => {
  statisticsService.recordVisit(route.fullPath).catch(() => {
    // Visit tracking should not block the app shell.
  });

  document.addEventListener("loader-complete", () => {
    gsap.to(".page-content", {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power2.out",
    });
    ScrollTrigger.refresh();
  });
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
  width: 42vw;
  min-width: 380px;
  aspect-ratio: 1;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.42;
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
  opacity: 0;
  transform: translateY(12px);
}
</style>
