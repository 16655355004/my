<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

const isLoading = ref(true);
const progress = ref(0);

onMounted(() => {
  gsap.from(".loader-mark", {
    opacity: 0,
    y: 22,
    scale: 0.98,
    duration: 0.7,
    ease: "power3.out",
  });

  gsap.to(".loader-halo", {
    rotation: 360,
    duration: 10,
    repeat: -1,
    ease: "none",
  });

  gsap.to(progress, {
    value: 100,
    duration: 1.1,
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
      <div class="loader-halo" aria-hidden="true"></div>
      <span class="loader-kicker">空空</span>
      <h1>空空</h1>
      <p class="loader-copy">正在打开个人网站</p>
      <div class="loader-bar">
        <span :style="{ width: progress + '%' }"></span>
      </div>
      <div class="loader-meta" aria-hidden="true">
        <span>视觉</span>
        <span>作品</span>
        <span>动效</span>
      </div>
      <p class="loader-progress">{{ progress }}%</p>
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
  position: relative;
  width: min(420px, calc(100% - 48px));
  text-align: center;
}

.loader-halo {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 210px;
  height: 210px;
  margin: -105px 0 0 -105px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  border-top-color: rgba(240, 179, 91, 0.36);
  border-right-color: rgba(83, 198, 176, 0.24);
  filter: blur(0.3px);
}

.loader-kicker {
  position: relative;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.26em;
}

h1 {
  position: relative;
  margin: 10px 0 12px;
  color: var(--text);
  font-size: clamp(2.2rem, 8vw, 4.5rem);
  font-weight: 800;
}

.loader-copy {
  position: relative;
  color: rgba(247, 242, 232, 0.66);
  font-size: 0.88rem;
  font-weight: 700;
}

.loader-bar {
  position: relative;
  height: 8px;
  overflow: hidden;
  margin-top: 22px;
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

.loader-meta {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.loader-meta span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: rgba(247, 242, 232, 0.68);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.loader-progress {
  position: relative;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}
</style>
