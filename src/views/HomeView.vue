<script setup lang="ts">
import { onMounted } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ProjectLinks from "../components/ProjectLinks.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";
import heroImage from "../assets/001.png";

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  { title: "界面作品", desc: "用清晰的布局、细腻的动效和可靠的响应式体验呈现项目。", stat: "UI" },
  { title: "实用工具", desc: "把视频、图片、提醒、收藏等常用入口集中到一个站点里。", stat: "TOOL" },
  { title: "影像空间", desc: "用于展示照片、封面、灵感图和之后持续更新的视觉素材。", stat: "IMG" },
  { title: "内容沉淀", desc: "把教程、留言、收藏和个人记录整理成长期可访问的页面。", stat: "DOC" },
];

const gallery = [
  { title: "主视觉", desc: "JisooLove 形象图", src: heroImage },
  { title: "灵感板", desc: "照片与素材合集", src: heroImage },
  { title: "项目封面", desc: "作品展示图位", src: heroImage },
];

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  gsap.from(".hero-copy > *", {
    opacity: 0,
    y: 26,
    duration: 0.75,
    stagger: 0.08,
    ease: "power2.out",
  });

  gsap.from(".portrait-card", {
    opacity: 0,
    y: 34,
    rotate: -2,
    duration: 0.9,
    ease: "power2.out",
  });

  gsap.utils.toArray<HTMLElement>(".reveal-block").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
      },
    });
  });
});
</script>

<template>
  <div class="home-view">
    <section class="hero" id="home">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">JisooLove Studio</span>
          <h1>一个收纳作品、工具、影像和灵感的个人主页。</h1>
          <p>
            这里集中展示我的项目入口、常用工具、图片内容和技术记录。页面以沉浸式视觉为主，适合浏览，也方便之后持续扩展。
          </p>
          <div class="hero-actions">
            <button class="btn" @click="navigateToSection('gallery')">浏览图片</button>
            <button class="btn btn-ghost" @click="navigateToSection('projects')">查看项目</button>
          </div>
        </div>

        <aside class="portrait-card">
          <div class="portrait-frame">
            <img :src="heroImage" alt="JisooLove 主视觉图片" />
          </div>
          <div class="portrait-meta">
            <span>VISUAL 01</span>
            <strong>主视觉图片区</strong>
          </div>
        </aside>
      </div>

      <div class="ticker" aria-hidden="true">
        <div class="ticker-track">
          <span>作品展示</span><span>图片空间</span><span>工具入口</span><span>技术记录</span><span>留言互动</span>
          <span>作品展示</span><span>图片空间</span><span>工具入口</span><span>技术记录</span><span>留言互动</span>
        </div>
      </div>
    </section>

    <section class="capability-section section reveal-block" id="about">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">What Is Inside</span>
          <h2 class="section-title">清晰的内容分区，配合更有记忆点的视觉动效。</h2>
        </div>
        <div class="capability-grid">
          <article v-for="item in capabilities" :key="item.title" class="capability-card">
            <span>{{ item.stat }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <ProjectLinks />

    <section class="gallery-section section reveal-block" id="gallery">
      <div class="container">
        <div class="section-head two-col">
          <div>
            <span class="section-kicker">Gallery</span>
            <h2 class="section-title">影像展示区</h2>
          </div>
          <p class="section-copy">
            用来陈列照片、封面、灵感图和个人视觉素材。图片区会成为整个站点最直观的视觉记忆点。
          </p>
        </div>

        <div class="gallery-grid">
          <article v-for="item in gallery" :key="item.title" class="gallery-card">
            <img :src="item.src" :alt="item.title" />
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="stats-section section reveal-block">
      <div class="container">
        <WebsiteStatistics />
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: grid;
  align-items: center;
  padding: 118px 0 40px;
  position: relative;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.72fr);
  gap: 42px;
  align-items: center;
}

.hero-copy h1 {
  max-width: 880px;
  margin-top: 18px;
  color: var(--text);
  font-size: clamp(3rem, 7vw, 6.9rem);
  font-weight: 800;
}

.hero-copy p {
  max-width: 680px;
  margin-top: 22px;
  color: var(--text-muted);
  font-size: 1.08rem;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.portrait-card {
  position: relative;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
  box-shadow: var(--shadow);
  animation: floatCard 6s ease-in-out infinite;
}

.portrait-frame {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--bg-soft);
}

.portrait-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 4px 0;
}

.portrait-meta span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.portrait-meta strong {
  color: var(--text);
  font-size: 0.9rem;
}

.ticker {
  overflow: hidden;
  margin-top: 56px;
  border-block: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.035);
}

.ticker-track {
  width: max-content;
  display: flex;
  gap: 42px;
  padding: 14px 0;
  animation: marquee 22s linear infinite;
}

.ticker span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.section-head {
  margin-bottom: 28px;
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
  gap: 28px;
  align-items: end;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.capability-card {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.06);
}

.capability-card span {
  color: var(--accent-2);
  font-weight: 800;
  letter-spacing: 0.18em;
}

.capability-card h3 {
  margin-top: 34px;
  color: var(--text);
  font-size: 1.24rem;
  font-weight: 800;
}

.capability-card p {
  margin-top: 10px;
  color: var(--text-muted);
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
  min-height: 480px;
}

.gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.06) contrast(1.02);
  transition: transform 600ms ease;
}

.gallery-card:hover img {
  transform: scale(1.04);
}

.gallery-card div {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-sm);
  background: rgba(8, 10, 15, 0.68);
  backdrop-filter: blur(14px);
}

.gallery-card strong {
  color: var(--text);
  font-weight: 800;
}

.gallery-card span {
  color: var(--text-muted);
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .hero-grid,
  .two-col,
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .capability-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .hero {
    padding-top: 102px;
  }

  .hero-copy h1 {
    font-size: clamp(2.5rem, 15vw, 4.6rem);
  }

  .capability-grid {
    grid-template-columns: 1fr;
  }

  .gallery-card,
  .gallery-card:first-child {
    min-height: 320px;
  }
}
</style>
