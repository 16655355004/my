<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

const isLoading = ref(true);
const progress = ref(0);
const glyphs = ["空", "空"];

onMounted(() => {
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  timeline
    .from(".loader-glyph", {
      opacity: 0,
      yPercent: 120,
      rotateX: -82,
      transformOrigin: "50% 100%",
      duration: 0.82,
      stagger: 0.12,
    })
    .from(".loader-ring", { opacity: 0, scale: 0.74, duration: 0.72 }, "-=0.56")
    .from(".loader-scan", { scaleX: 0, duration: 0.74 }, "-=0.42")
    .from(".loader-copy, .loader-meta span", { opacity: 0, y: 14, duration: 0.44, stagger: 0.05 }, "-=0.34");

  gsap.to(".loader-ring", {
    rotation: 360,
    duration: 9,
    repeat: -1,
    ease: "none",
  });

  gsap.to(".loader-orbit", {
    rotation: -360,
    duration: 6,
    repeat: -1,
    ease: "none",
  });

  gsap.to(".loader-scan", {
    xPercent: 118,
    duration: 1.1,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
  });

  gsap.to(progress, {
    value: 100,
    duration: 1.35,
    ease: "power2.inOut",
    onUpdate: () => {
      progress.value = Math.round(progress.value);
    },
    onComplete: () => {
      gsap.timeline({
        onComplete: () => {
          isLoading.value = false;
          document.dispatchEvent(new Event("loader-complete"));
        },
      })
        .to(".loader-mark", { y: -22, scale: 0.96, opacity: 0, duration: 0.38, ease: "power2.in" })
        .to(".loader-screen", { opacity: 0, duration: 0.34, ease: "power2.in" }, "-=0.18");
    },
  });
});
</script>

<template>
  <div v-if="isLoading" class="loader-screen">
    <div class="loader-grid" aria-hidden="true"></div>
    <div class="loader-mark">
      <div class="loader-orbit" aria-hidden="true">
        <span></span>
      </div>
      <div class="loader-ring" aria-hidden="true"></div>
      <div class="glyph-row" aria-label="空空">
        <span v-for="glyph in glyphs" :key="glyph" class="loader-glyph">{{ glyph }}</span>
      </div>
      <div class="loader-scan" aria-hidden="true"></div>
      <p class="loader-copy">正在校准空空的个人现场</p>
      <div class="loader-bar" aria-hidden="true">
        <span :style="{ width: progress + '%' }"></span>
      </div>
      <div class="loader-meta">
        <span>Motion</span>
        <span>{{ progress }}%</span>
        <span>Ready</span>
      </div>
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
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(240, 179, 91, 0.2), transparent 24rem),
    radial-gradient(circle at 16% 82%, rgba(83, 198, 176, 0.13), transparent 24rem),
    #080a0f;
}

.loader-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(circle at center, black 0%, black 42%, transparent 78%);
}

.loader-mark {
  position: relative;
  width: min(440px, calc(100% - 48px));
  min-height: 380px;
  display: grid;
  place-items: center;
  text-align: center;
}

.loader-ring,
.loader-orbit {
  position: absolute;
  inset: 50% auto auto 50%;
  border-radius: 50%;
}

.loader-ring {
  width: 260px;
  height: 260px;
  margin: -130px 0 0 -130px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    conic-gradient(from 40deg, transparent 0 16%, rgba(240, 179, 91, 0.82) 18%, transparent 24% 58%, rgba(83, 198, 176, 0.72) 62%, transparent 70% 100%);
  mask: radial-gradient(circle, transparent 0 71%, black 72% 100%);
}

.loader-orbit {
  width: 310px;
  height: 310px;
  margin: -155px 0 0 -155px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.loader-orbit span {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 24px rgba(240, 179, 91, 0.82);
}

.glyph-row {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 10px;
  perspective: 720px;
}

.loader-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(86px, 22vw, 126px);
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.035)),
    rgba(8, 10, 15, 0.52);
  color: var(--text);
  font-size: clamp(3.8rem, 16vw, 7rem);
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
}

.loader-scan {
  position: absolute;
  top: 50%;
  left: 7%;
  width: 40%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), var(--accent-2), transparent);
  box-shadow: 0 0 26px rgba(240, 179, 91, 0.52);
  transform-origin: left center;
}

.loader-copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 68px;
  color: rgba(247, 242, 232, 0.72);
  font-size: 0.92rem;
  font-weight: 800;
}

.loader-bar {
  position: absolute;
  left: 50%;
  bottom: 42px;
  width: min(320px, 76vw);
  height: 6px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(-50%);
}

.loader-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

.loader-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.loader-meta span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: rgba(247, 242, 232, 0.68);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 560px) {
  .loader-mark {
    min-height: 330px;
  }

  .loader-ring {
    width: 226px;
    height: 226px;
    margin: -113px 0 0 -113px;
  }

  .loader-orbit {
    width: 270px;
    height: 270px;
    margin: -135px 0 0 -135px;
  }
}
</style>
