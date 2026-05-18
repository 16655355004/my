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
  { label: "身份", value: "空空", note: "个人网站" },
  { label: "内容", value: "作品 / 影像", note: "前台优先展示" },
  { label: "节奏", value: "GSAP Motion", note: "滚动驱动层次" },
];

const principles = [
  { title: "先看见人", desc: "首屏先交代空空是谁，再让作品、影像和入口自然展开。", stat: "01" },
  { title: "内容收束", desc: "前台只放访问者该看到的东西，管理入口收进工具菜单。", stat: "02" },
  { title: "动效服务内容", desc: "动画用来建立节奏、层次和方向，不抢走作品本身。", stat: "03" },
];

const process = [
  { label: "Scene", title: "先用一张有气质的视觉定调，让首页第一眼像作品封面。" },
  { label: "Motion", title: "用进场、滚动和悬停动效把页面串成一条叙事线。" },
  { label: "Focus", title: "把工具和后台能力收拢，只保留作品、影像、状态和留言。" },
];

const gallery = [
  { title: "首屏影像", desc: "负责建立第一记忆点。", src: heroImage },
  { title: "作品封面", desc: "后续用于承载真实项目截图。", src: heroImage },
  { title: "情绪切片", desc: "让页面从工具感里脱离出来。", src: heroImage },
];

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  if (!pageRef.value) return;

  gsapContext = gsap.context(() => {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTimeline
      .from(".hero-visual img", { opacity: 0, scale: 1.08, duration: 1.05 })
      .from(".hero-kicker", { opacity: 0, y: 16, duration: 0.5 }, "-=0.72")
      .from(".hero-title span", { opacity: 0, y: 46, duration: 0.78, stagger: 0.08 }, "-=0.22")
      .from(".hero-copy p, .hero-actions", { opacity: 0, y: 22, duration: 0.58, stagger: 0.08 }, "-=0.34")
      .from(".proof-pill", { opacity: 0, y: 14, duration: 0.42, stagger: 0.06 }, "-=0.22")
      .from(".signal-card", { opacity: 0, y: 22, duration: 0.55, stagger: 0.08 }, "-=0.2")
      .from(".hero-frame", { opacity: 0, y: 28, scale: 0.97, duration: 0.72 }, "-=0.44");

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
            <span>空空。</span>
            <span>一个更像作品的</span>
            <span>个人网站。</span>
          </h1>
          <p>
            前台先给气质、作品和影像，后台能力收进工具菜单。页面的重点是让访问者停下来，而不是把一堆入口塞到最上面。
          </p>

          <div class="hero-actions">
            <button class="btn" type="button" @click="navigateToSection('projects')">查看作品</button>
            <button class="btn btn-ghost" type="button" @click="navigateToSection('gallery')">进入影像</button>
          </div>

          <div class="hero-proof" aria-label="站点特征">
            <span class="proof-pill">Vue 3</span>
            <span class="proof-pill">GSAP Motion</span>
            <span class="proof-pill">Responsive Layout</span>
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
          <span class="frame-tag">Current Layer</span>
          <img :src="heroImage" alt="空空个人网站视觉预览" />
          <div class="frame-copy">
            <strong>当前焦点</strong>
            <p>名字、作品和影像先出现，数据和工具在后续章节展开。</p>
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
            <h2 class="section-title">把个人站从入口合集，改成能被记住的现场。</h2>
          </div>
          <p class="section-copy">
            首页不再强调平台、部署和后台能力，而是把空空、作品和影像放到第一层。管理功能继续存在，但不会抢前台表达。
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
          <h2 class="section-title">页面应该有节奏，而不是一屏把所有信息塞满。</h2>
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
            <h2 class="section-title">影像区负责建立第二层记忆点。</h2>
          </div>
          <p class="section-copy">
            当前先用主视觉撑起节奏，后续可以替换成真实摄影、项目封面、动态截图和视觉碎片。
          </p>
        </div>

        <div class="gallery-grid">
          <article v-for="item in gallery" :key="item.title" class="gallery-card">
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
  font-size: clamp(3.4rem, 8vw, 8.2rem);
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
    font-size: clamp(2.8rem, 16vw, 5rem);
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
