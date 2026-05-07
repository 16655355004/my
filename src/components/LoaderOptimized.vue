<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

const isLoading = ref(true);
const progress = ref(0);

onMounted(() => {
  // 模拟加载进度，1.5s 内线性完成
  gsap.to(progress, {
    value: 100,
    duration: 1.4,
    ease: "power1.inOut",
    onUpdate: () => {
      progress.value = Math.round(progress.value);
    },
    onComplete: () => {
      gsap.to(".loader-screen", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          isLoading.value = false;
          document.dispatchEvent(new Event("loader-complete"));
        },
      });
    },
  });
});
</script>

<template>
  <div v-if="isLoading" class="loader-screen">
    <div class="loader-inner">
      <h1 class="loader-title">JisooLove</h1>
      <p class="loader-sub">Personal Website</p>
      <div class="loader-bar-wrap">
        <div class="loader-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="loader-pct">{{ progress }}%</span>
    </div>
  </div>
</template>

<style scoped>
.loader-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #080808;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.loader-title {
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #fff;
}

.loader-sub {
  font-size: 0.8rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.loader-bar-wrap {
  width: 200px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 1.5rem;
  position: relative;
  overflow: hidden;
}

.loader-bar {
  height: 100%;
  background: #fff;
  transition: width 0.05s linear;
}

.loader-pct {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.3);
  font-variant-numeric: tabular-nums;
}
</style>
