<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ProjectLinks from "../components/ProjectLinks.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";
import heroImage from "../assets/001.png";

gsap.registerPlugin(ScrollTrigger);

const pageRef = ref<HTMLElement | null>(null);
let gsapContext: gsap.Context | null = null;

const signals = [
  { label: "名字", value: "空空", note: "温柔、清醒、带一点闪光" },
  { label: "氛围", value: "二次元 / 影像", note: "暗场、星光、柔色切片" },
  { label: "互动", value: "轻动效", note: "停顿、呼吸、滑入" },
];

const principles = [
  { title: "第一眼有画面", desc: "暗色、星光和人物剪影先把情绪拉起来，名字自然留在视线里。", stat: "01" },
  { title: "作品有路径", desc: "视频、图像和提醒入口保持清晰，浏览时不需要猜下一步去哪。", stat: "02" },
  { title: "细节有温度", desc: "微动效、悬停反馈和可爱光点让页面更像空空自己的小宇宙。", stat: "03" },
];

const process = [
  { label: "Night", title: "黑色背景压住噪音，星光和人物把第一屏带进安静的夜里。" },
  { label: "Soft", title: "柔色卡片、漂浮影像和细小反馈，让浏览节奏慢下来。" },
  { label: "Spark", title: "一点可爱、一点二次元、一点闪光，组成空空自己的识别感。" },
];

const gallery = [
  {
    title: "星夜漂浮",
    desc: "像一段安静的开场动画。",
    src: "https://cdn.pixabay.com/photo/2024/09/21/10/53/anime-9063542_1280.png",
    charm: "✦",
  },
  {
    title: "蓝眼小伙伴",
    desc: "把冷色光点带进影像区。",
    src: "https://cdn.pixabay.com/photo/2024/11/29/14/59/ai-generated-9233165_1280.png",
    charm: "♡",
  },
  {
    title: "月色边界",
    desc: "留一点轻盈、梦境和远处的风。",
    src: "https://cdn.pixabay.com/photo/2025/04/17/12/03/girl-9540346_640.jpg",
    charm: "☆",
  },
];

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  if (!pageRef.value) return;

  gsapContext = gsap.context(() => {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
    heroTimeline
      .from(".hero-visual img", { opacity: 0, scale: 1.08, duration: 1.05 })
      .from(".hero-kicker", { opacity: 0, y: 16, duration: 0.5 }, "-=0.72")
      .from(".hero-title span", { opacity: 0, y: 46, duration: 0.78, stagger: 0.08 }, "-=0.22")
      .from(".hero-copy p, .hero-actions", { opacity: 0, y: 22, duration: 0.58, stagger: 0.08 }, "-=0.34")
      .from(".proof-pill", { opacity: 0, y: 14, duration: 0.42, stagger: 0.06 }, "-=0.22")
      .from(".signal-card", { opacity: 0, y: 22, duration: 0.55, stagger: 0.08 }, "-=0.2")
      .from(".hero-frame", { opacity: 0, y: 28, scale: 0.97, duration: 0.72 }, "-=0.44");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroTimeline.progress(1);
    } else {
      requestAnimationFrame(() => heroTimeline.play(0));
    }

    gsap.to(".hero-visual img", {
      yPercent: -8,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    });

    gsap.to(".hero-frame", {
      y: -22,
      rotate: 1.2,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.7,
      },
    });

    gsap.to(".kinetic-track", {
      xPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    });

    gsap.utils.toArray<HTMLElement>(".reveal-block").forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 34,
        duration: 0.72,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
        },
      });
    });

    gsap.utils.toArray<HTMLElement>(".principle-card, .project-card, .gallery-card").forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 30,
        scale: 0.97,
        duration: 0.62,
        delay: (index % 3) * 0.045,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 86%",
        },
      });
    });

    gsap.utils.toArray<HTMLElement>(".story-step").forEach((step, index) => {
      gsap.from(step, {
        opacity: 0.18,
        x: index % 2 === 0 ? -34 : 34,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: step,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });
    });

    gsap.to(".gallery-card", {
      y: (index) => (index % 2 === 0 ? -10 : -18),
      rotate: (index) => (index % 2 === 0 ? 0.8 : -0.8),
      duration: 2.8,
      ease: "sine.inOut",
      stagger: 0.18,
      repeat: -1,
      yoyo: true,
    });

    gsap.to(".gallery-charm", {
      y: -12,
      scale: 1.12,
      opacity: 0.95,
      duration: 1.8,
      ease: "sine.inOut",
      stagger: 0.22,
      repeat: -1,
      yoyo: true,
    });
  }, pageRef.value);
});

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <div ref="pageRef" class="home-view">
    <section class="hero" id="home">
      <div class="hero-visual" aria-hidden="true">
        <img :src="heroImage" alt="" />
      </div>
      <div class="hero-shade" aria-hidden="true"></div>

      <div class="container hero-overlay">
        <div class="hero-copy">
          <span class="hero-kicker">空空 / Personal Site</span>
          <h1 class="hero-title">
            <span>空空的</span>
            <span>轻幻想</span>
            <span>个人现场。</span>
          </h1>
          <p>
            这里收着作品、影像、状态和留言。暗色镜头、星光切片和一点可爱的互动，让每次进入都像打开一间安静的小房间。
          </p>

          <div class="hero-actions">
            <button class="btn" type="button" @click="navigateToSection('projects')">查看作品</button>
            <button class="btn btn-ghost" type="button" @click="navigateToSection('gallery')">进入影像</button>
          </div>

          <div class="hero-proof" aria-label="站点特征">
            <span class="proof-pill">星夜影像</span>
            <span class="proof-pill">二次元切片</span>
            <span class="proof-pill">轻互动</span>
          </div>

          <div class="hero-signal" aria-label="页面状态">
            <article v-for="item in signals" :key="item.label" class="signal-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </article>
          </div>
        </div>

        <aside class="hero-frame panel">
          <span class="frame-tag">Kongkong Mood</span>
          <img :src="heroImage" alt="空空个人网站视觉预览" />
          <div class="frame-copy">
            <strong>今晚的空空</strong>
            <p>黑色背景、星光、影像和一点可爱反应，先把情绪放到前面。</p>
          </div>
        </aside>
      </div>

      <div class="kinetic-strip" aria-hidden="true">
        <div class="kinetic-track">
          <span class="kinetic-word">空空</span>
          <span class="kinetic-word">作品</span>
          <span class="kinetic-word">影像</span>
          <span class="kinetic-word">动效</span>
          <span class="kinetic-word">留言</span>
          <span class="kinetic-word">空空</span>
          <span class="kinetic-word">作品</span>
          <span class="kinetic-word">影像</span>
          <span class="kinetic-word">动效</span>
          <span class="kinetic-word">留言</span>
        </div>
      </div>
    </section>

    <section class="principles-section section reveal-block" id="about">
      <div class="container">
        <div class="section-head two-col">
          <div>
            <span class="section-kicker">Direction</span>
            <h2 class="section-title">把空空放在第一眼。</h2>
          </div>
          <p class="section-copy">
            页面从名字、画面和作品开始，往下是影像、状态和留言。每一段都保持清楚的节奏，让人愿意停一会儿。
          </p>
        </div>

        <div class="principle-grid">
          <article v-for="item in principles" :key="item.title" class="principle-card">
            <span>{{ item.stat }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <ProjectLinks />

    <section class="story-section section reveal-block">
      <div class="container story-grid">
        <div class="story-copy">
          <span class="section-kicker">Flow</span>
          <h2 class="section-title">从第一眼到最后一屏，都像在看一段短片。</h2>
        </div>

        <div class="story-list">
          <article v-for="item in process" :key="item.label" class="story-step">
            <span>{{ item.label }}</span>
            <h3>{{ item.title }}</h3>
          </article>
        </div>
      </div>
    </section>

    <section class="gallery-section section reveal-block" id="gallery">
      <div class="container">
        <div class="section-head two-col">
          <div>
            <span class="section-kicker">Gallery</span>
            <h2 class="section-title">影像区换成更有二次元气质的画面。</h2>
          </div>
          <p class="section-copy">
            星夜、月色、蓝眼光点和柔软角色，让第二段视觉从暗场里亮起来。
          </p>
        </div>

        <div class="gallery-grid">
          <article v-for="item in gallery" :key="item.title" class="gallery-card">
            <span class="gallery-charm" aria-hidden="true">{{ item.charm }}</span>
            <img :src="item.src" :alt="item.title" loading="lazy" />
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="stats-section section reveal-block" id="status">
      <div class="container">
        <WebsiteStatistics />
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  min-height: 100svh;
  position: relative;
  display: grid;
  align-items: end;
  overflow: hidden;
  isolation: isolate;
  padding: 112px 0 182px;
  background: #05070b;
}

.hero-visual,
.hero-shade {
  position: absolute;
  inset: 0;
  z-index: -2;
}

.hero-visual img {
  width: 100%;
  height: 112%;
  object-fit: cover;
  object-position: 56% center;
  filter: saturate(1.06) contrast(1.06);
}

.hero-shade {
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(5, 7, 11, 0.94) 0%, rgba(5, 7, 11, 0.72) 34%, rgba(5, 7, 11, 0.18) 70%, rgba(5, 7, 11, 0.74) 100%),
    linear-gradient(0deg, rgba(5, 7, 11, 0.96) 0%, rgba(5, 7, 11, 0.24) 48%, rgba(5, 7, 11, 0.45) 100%);
}

.hero-overlay {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: 38px;
  align-items: end;
}

.hero-copy {
  max-width: 960px;
}

.hero-kicker {
  display: inline-flex;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  margin-top: 18px;
  color: var(--text);
  font-size: clamp(2.6rem, 6vw, 6.1rem);
  font-weight: 900;
  letter-spacing: 0;
}

.hero-title span {
  display: block;
}

.hero-copy p {
  max-width: 720px;
  margin-top: 24px;
  color: rgba(247, 242, 232, 0.78);
  font-size: 1.08rem;
}

.hero-actions,
.hero-proof {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.hero-proof {
  margin-top: 20px;
}

.proof-pill {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(8, 10, 15, 0.36);
  color: rgba(247, 242, 232, 0.68);
  font-size: 0.78rem;
  font-weight: 800;
}

.hero-signal {
  max-width: 780px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-top: 30px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--line);
}

.signal-card {
  min-height: 112px;
  display: grid;
  align-content: end;
  gap: 6px;
  padding: 18px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
    rgba(8, 10, 15, 0.62);
}

.signal-card span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.signal-card strong {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 850;
}

.signal-card small {
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 800;
}

.hero-frame {
  min-height: 430px;
  display: grid;
  gap: 14px;
  align-content: end;
  padding: 16px;
}

.hero-frame img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: center;
  border-radius: var(--radius-sm);
  filter: saturate(1.04) contrast(1.04);
}

.frame-tag {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.frame-copy {
  display: grid;
  gap: 6px;
}

.frame-copy strong {
  color: var(--text);
  font-size: 1.02rem;
  font-weight: 850;
}

.frame-copy p {
  color: var(--text-muted);
  font-size: 0.86rem;
}

.kinetic-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 98px;
  overflow: hidden;
  border-block: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(5, 7, 11, 0.36);
}

.kinetic-track {
  width: max-content;
  display: flex;
  gap: clamp(32px, 6vw, 88px);
  padding: 13px 0;
}

.kinetic-word {
  color: rgba(247, 242, 232, 0.48);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.section-head {
  margin-bottom: 30px;
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
  gap: 28px;
  align-items: end;
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.principle-card {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.055);
}

.principle-card span {
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 900;
}

.principle-card h3 {
  margin-top: 42px;
  color: var(--text);
  font-size: 1.45rem;
  font-weight: 850;
}

.principle-card p {
  margin-top: 12px;
  color: var(--text-muted);
}

.story-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
  gap: 38px;
  align-items: start;
}

.story-copy {
  position: sticky;
  top: 120px;
}

.story-list {
  display: grid;
  gap: 14px;
}

.story-step {
  min-height: 190px;
  display: grid;
  align-content: end;
  padding: 24px;
  border-left: 2px solid var(--accent);
  background: linear-gradient(90deg, rgba(240, 179, 91, 0.1), rgba(255, 255, 255, 0.035));
}

.story-step span {
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.story-step h3 {
  max-width: 720px;
  margin-top: 14px;
  color: var(--text);
  font-size: clamp(1.6rem, 3vw, 2.6rem);
}

.gallery-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 0.9fr;
  gap: 14px;
}

.gallery-card {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-soft);
}

.gallery-card:first-child {
  min-height: 500px;
}

.gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(1.06) contrast(1.02);
  transition: transform 700ms ease;
}

.gallery-charm {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: rgba(8, 10, 15, 0.58);
  color: #fff1c8;
  font-size: 1.24rem;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.24), 0 0 24px rgba(240, 179, 91, 0.22);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.gallery-card:hover img {
  transform: scale(1.045);
}

.gallery-card div {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(8, 10, 15, 0.7);
  backdrop-filter: blur(12px);
}

.gallery-card strong {
  color: var(--text);
  font-weight: 850;
}

.gallery-card span {
  color: var(--text-muted);
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .hero-overlay,
  .two-col,
  .story-grid,
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .story-copy {
    position: static;
  }

  .principle-grid {
    grid-template-columns: 1fr;
  }

  .hero-frame {
    min-height: auto;
  }
}

@media (max-width: 620px) {
  .hero {
    min-height: 100svh;
    padding: 88px 0 182px;
  }

  .hero-title {
    font-size: clamp(2.2rem, 12vw, 4.1rem);
  }

  .hero-signal {
    grid-template-columns: 1fr;
  }

  .hero-frame {
    display: none;
  }

  .hero-shade {
    background:
      linear-gradient(90deg, rgba(5, 7, 11, 0.92), rgba(5, 7, 11, 0.5)),
      linear-gradient(0deg, rgba(5, 7, 11, 0.96), rgba(5, 7, 11, 0.24));
  }

  .kinetic-strip {
    bottom: 92px;
  }

  .gallery-card,
  .gallery-card:first-child {
    min-height: 320px;
  }
}
</style>
