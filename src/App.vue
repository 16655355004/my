<script setup lang="ts">
import { RouterView } from "vue-router";
import { onMounted, onUnmounted } from "vue";
import Navbar from "./components/Navbar.vue";
import Loader from "./components/LoaderOptimized.vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// 页面加载完成后入场
onMounted(() => {
  document.addEventListener("loader-complete", () => {
    gsap.to(".page-content", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
    });
    ScrollTrigger.refresh();
  });
});
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
  </div>
</template>

<style>
@import "./assets/main.css";
@import "./assets/animations.css";

.app {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.page-content {
  position: relative;
  opacity: 0;
  transform: translateY(12px);
  z-index: 1;
}
</style>
