<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

const isLoading = ref(true);
const progress = ref(0);

onMounted(() => {
  gsap.to(progress, {
    value: 100,
    duration: 1.05,
    ease: "power2.inOut",
    onUpdate: () => {
      progress.value = Math.round(progress.value);
    },
    onComplete: () => {
      gsap.to(".loader-screen", {
        opacity: 0,
        duration: 0.42,
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
    <div class="loader-mark">
      <span class="loader-kicker">JISOOLOVE</span>
      <h1>JisooLove</h1>
      <div class="loader-bar">
        <span :style="{ width: progress + '%' }"></span>
      </div>
      <p>{{ progress }}%</p>
    </div>
  </div>
</template>

<style scoped>
.loader-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 30%, rgba(240, 179, 91, 0.2), transparent 28rem),
    #080a0f;
}

.loader-mark {
  width: min(420px, calc(100% - 48px));
  text-align: center;
}

.loader-kicker {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.26em;
}

h1 {
  margin: 10px 0 24px;
  color: var(--text);
  font-size: clamp(2.2rem, 8vw, 4.5rem);
  font-weight: 800;
}

.loader-bar {
  height: 8px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.loader-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 22px var(--accent-glow);
}

p {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}
</style>
