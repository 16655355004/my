<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import displayImage from "../assets/001.png";

gsap.registerPlugin(ScrollTrigger);

const pageRef = ref<HTMLElement | null>(null);
let gsapContext: gsap.Context | null = null;

const images = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  return {
    id: number,
    src: displayImage,
    title: `Image ${String(number).padStart(2, "0")}`,
    tone: ["Warm", "Soft", "Bright", "Clean", "Focus"][index % 5],
  };
});

onMounted(() => {
  const page = pageRef.value;
  if (!page) return;

  gsapContext = gsap.context(() => {
    gsap.from(".image-hero > *", {
      opacity: 0,
      y: 24,
      duration: 0.72,
      stagger: 0.08,
      ease: "power2.out",
    });

    gsap.utils.toArray<HTMLElement>(".image-card").forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 34,
        scale: 0.96,
        duration: 0.62,
        delay: (index % 6) * 0.035,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
        },
      });
    });
  }, page);
});

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <main ref="pageRef" class="image-page">
    <section class="container image-hero">
      <span class="page-tag">Gallery</span>
      <h1 class="page-title">图片展示</h1>
      <p class="page-sub">整理了 50 张图片展示位，使用 GSAP 做入场和滚动动效。</p>
    </section>

    <section class="container image-grid-section">
      <div class="image-grid">
        <article
          v-for="image in images"
          :key="image.id"
          class="image-card"
          :class="{ wide: image.id % 11 === 1, tall: image.id % 7 === 0 }"
        >
          <img :src="image.src" :alt="image.title" loading="lazy" />
          <div class="image-meta">
            <strong>{{ image.title }}</strong>
            <span>{{ image.tone }}</span>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.image-page {
  min-height: 100vh;
  padding: 112px 0 72px;
}

.image-hero {
  display: grid;
  gap: 10px;
}

.image-hero .page-title {
  margin-top: 0;
}

.image-grid-section {
  margin-top: 18px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 14px;
}

.image-card {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
}

.image-card.wide {
  grid-column: span 2;
}

.image-card.tall {
  grid-row: span 2;
  min-height: 454px;
}

.image-card img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  filter: saturate(1.06) contrast(1.02);
  transition: transform 600ms ease, filter 600ms ease;
}

.image-card:hover img {
  transform: scale(1.05);
  filter: saturate(1.14) contrast(1.05);
}

.image-meta {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(8, 10, 15, 0.7);
  backdrop-filter: blur(12px);
}

.image-meta strong {
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 800;
}

.image-meta span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 1120px) {
  .image-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .image-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .image-page {
    padding-top: 96px;
  }

  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .image-card,
  .image-card.tall {
    min-height: 210px;
  }

  .image-card.wide {
    grid-column: span 2;
  }

  .image-card.tall {
    grid-row: span 1;
  }
}
</style>
