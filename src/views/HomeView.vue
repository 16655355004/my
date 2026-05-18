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

const principles = [
  { title: "视觉入口", desc: "用强主视觉、清晰层级和稳定节奏建立第一印象。", stat: "01" },
  { title: "作品导航", desc: "把真正重要的项目放到前台，把管理工具收进后台。", stat: "02" },
  { title: "轻量体验", desc: "动画服务于叙事，只把性能预算花在关键段落上。", stat: "03" },
];

const process = [
  { label: "Concept", title: "把想法压缩成一个清楚的页面结构。" },
  { label: "Motion", title: "用滚动、遮罩和时间线建立可感知的节奏。" },
  { label: "Ship", title: "部署到 Cloudflare，把图片、短链和统计接进真实环境。" },
];

const gallery = [
  { title: "主视觉", desc: "暗色角色图与个人站的第一记忆点", src: heroImage },
  { title: "作品封面", desc: "后续用于承载项目截图和设计稿", src: heroImage },
  { title: "影像素材", desc: "沉淀图片、灵感和视觉碎片", src: heroImage },
];

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  if (!pageRef.value) return;

  gsapContext = gsap.context(() => {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTimeline
      .from(".hero-visual img", { opacity: 0, scale: 1.08, duration: 1.1 })
      .from(".hero-kicker", { opacity: 0, y: 18, duration: 0.55 }, "-=0.75")
      .from(".hero-title span", { opacity: 0, yPercent: 110, duration: 0.82, stagger: 0.08 }, "-=0.25")
      .from(".hero-copy p, .hero-actions, .hero-proof, .hero-index", { opacity: 0, y: 22, duration: 0.65, stagger: 0.08 }, "-=0.35")
      .from(".kinetic-word", { opacity: 0, y: 18, duration: 0.52, stagger: 0.05 }, "-=0.35");

    gsap.to(".hero-visual img", {
      yPercent: -9,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
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

    gsap.utils.toArray<HTMLElement>(".story-step").forEach((step, index) => {
      gsap.from(step, {
        opacity: 0.28,
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
          <span class="hero-kicker">JisooLove Personal Site</span>
          <h1 class="hero-title">
            <span>不是工具箱。</span>
            <span>是一个有镜头感的</span>
            <span>个人数字现场。</span>
          </h1>
          <p>
            前台只留下作品、影像和站点气质；后台负责图片、短链、密钥和访问分析。视觉先抓住人，工具藏在该在的位置。
          </p>
          <div class="hero-actions">
            <button class="btn" @click="navigateToSection('projects')">查看作品</button>
            <button class="btn btn-ghost" @click="navigateToSection('gallery')">进入影像</button>
          </div>
          <div class="hero-proof" aria-label="站点特征">
            <span>Vue 3</span>
            <span>Cloudflare Pages</span>
            <span>GSAP Motion</span>
          </div>
        </div>

        <aside class="hero-index">
          <span>LIVE INDEX</span>
          <strong>Pages · R2 · KV · Motion</strong>
          <p>公开页面负责表达，管理入口收束到工具菜单。</p>
        </aside>
      </div>

      <div class="kinetic-strip" aria-hidden="true">
        <div class="kinetic-track">
          <span class="kinetic-word">Portfolio</span>
          <span class="kinetic-word">Gallery</span>
          <span class="kinetic-word">Motion</span>
          <span class="kinetic-word">Cloudflare</span>
          <span class="kinetic-word">Studio</span>
          <span class="kinetic-word">Portfolio</span>
          <span class="kinetic-word">Gallery</span>
          <span class="kinetic-word">Motion</span>
          <span class="kinetic-word">Cloudflare</span>
          <span class="kinetic-word">Studio</span>
        </div>
      </div>
    </section>

    <section class="principles-section section reveal-block" id="about">
      <div class="container">
        <div class="section-head two-col">
          <div>
            <span class="section-kicker">Direction</span>
            <h2 class="section-title">从工具合集，转成真正的个人数字名片。</h2>
          </div>
          <p class="section-copy">
            首页只承载公开表达和关键入口，复杂管理能力收进后台，让访客看到的是作品和气质，而不是维护面板。
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
          <span class="section-kicker">Workflow</span>
          <h2 class="section-title">页面的节奏应该像作品集，而不是后台目录。</h2>
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
            <h2 class="section-title">影像区负责建立记忆点。</h2>
          </div>
          <p class="section-copy">
            当前先用主视觉撑起节奏，后续可以替换为真实项目截图、摄影、封面和动效帧，让网站从模板感里脱离出来。
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
  padding: 118px 0 120px;
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
  filter: saturate(1.05) contrast(1.06);
}

.hero-shade {
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(5, 7, 11, 0.92) 0%, rgba(5, 7, 11, 0.74) 35%, rgba(5, 7, 11, 0.18) 68%, rgba(5, 7, 11, 0.72) 100%),
    linear-gradient(0deg, rgba(5, 7, 11, 0.94) 0%, rgba(5, 7, 11, 0.18) 45%, rgba(5, 7, 11, 0.42) 100%);
}

.hero-overlay {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 330px);
  gap: 36px;
  align-items: end;
}

.hero-copy {
  max-width: 980px;
}

.hero-kicker {
  display: inline-flex;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  margin-top: 18px;
  color: var(--text);
  font-size: clamp(3.4rem, 8.5vw, 8.6rem);
  font-weight: 900;
  letter-spacing: 0;
}

.hero-title span {
  display: block;
  overflow: hidden;
}

.hero-copy p {
  max-width: 700px;
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

.hero-proof span {
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

.hero-index {
  display: grid;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(240, 179, 91, 0.44);
}

.hero-index span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.hero-index strong {
  color: var(--text);
  font-size: 1.05rem;
}

.hero-index p {
  color: rgba(247, 242, 232, 0.62);
  font-size: 0.88rem;
}

.kinetic-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 28px;
  overflow: hidden;
  border-block: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(5, 7, 11, 0.34);
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
}

@media (max-width: 620px) {
  .hero {
    min-height: 100svh;
    padding-top: 100px;
  }

  .hero-title {
    font-size: clamp(2.7rem, 15vw, 5rem);
  }

  .hero-shade {
    background:
      linear-gradient(90deg, rgba(5, 7, 11, 0.92), rgba(5, 7, 11, 0.48)),
      linear-gradient(0deg, rgba(5, 7, 11, 0.96), rgba(5, 7, 11, 0.24));
  }

  .hero-index {
    display: none;
  }

  .gallery-card,
  .gallery-card:first-child {
    min-height: 320px;
  }
}
</style>
