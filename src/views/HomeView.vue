<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ProjectLinks from "../components/ProjectLinks.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";

gsap.registerPlugin(ScrollTrigger);

const router = useRouter();

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const skills = ref([
  { name: "Vue.js",       level: 90 },
  { name: "JavaScript",   level: 85 },
  { name: "Python",       level: 80 },
  { name: "CSS / SCSS",   level: 85 },
  { name: "TypeScript",   level: 70 },
  { name: "GSAP",         level: 75 },
]);

const features = ref([
  { title: "前端开发",   desc: "精通 Vue.js、React 等现代前端框架，构建响应式界面" },
  { title: "动画设计",   desc: "熟练使用 GSAP 创建流畅的动画效果，提升用户体验" },
  { title: "Python 编程", desc: "掌握 Python 后端开发，构建高效的 API 与数据处理系统" },
  { title: "持续学习",   desc: "保持对新技术的热情，不断探索前沿技术栈" },
]);

onMounted(() => {
  // Hero 入场
  gsap.from(".hero-title", { opacity: 0, y: 60, duration: 1, ease: "power3.out", delay: 0.1 });
  gsap.from(".hero-line",  { scaleX: 0, duration: 0.8, ease: "power3.out", delay: 0.7, transformOrigin: "left" });
  gsap.from(".hero-sub",   { opacity: 0, y: 20, duration: 0.7, ease: "power2.out", delay: 0.9 });
  gsap.from(".hero-btn",   { opacity: 0, y: 16, duration: 0.5, ease: "power2.out", delay: 1.1 });

  // 技能条 ScrollTrigger
  gsap.utils.toArray<HTMLElement>(".skill-fill").forEach((el) => {
    const level = el.dataset.level ?? "0";
    gsap.from(el, {
      scaleX: 0,
      duration: 1,
      ease: "power2.out",
      transformOrigin: "left",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      },
    });
  });

  // Feature cards
  gsap.from(".feature-card", {
    opacity: 0,
    y: 24,
    stagger: 0.1,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".features-grid",
      start: "top 80%",
    },
  });
});
</script>

<template>
  <div class="home-page">
    <!-- ── Hero ── -->
    <section class="hero-section" id="home">
      <!-- 装饰网格 -->
      <div class="hero-grid" aria-hidden="true">
        <div v-for="i in 20" :key="i" class="grid-line-v"></div>
      </div>

      <div class="container hero-content">
        <p class="hero-eyebrow">个人主页</p>
        <h1 class="hero-title">JisooLove</h1>
        <div class="hero-line"></div>
        <p class="hero-sub">专注于创造优雅的数字体验</p>
        <div class="hero-actions">
          <button class="btn hero-btn" @click="navigateToSection('skills')">技能概览</button>
          <button class="btn btn-ghost hero-btn" @click="navigateToSection('projects')">查看项目</button>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="scroll-hint" aria-hidden="true">
        <span class="scroll-line"></span>
        <span class="scroll-label">向下滚动</span>
      </div>
    </section>

    <!-- ── 项目 ── -->
    <div id="projects">
      <ProjectLinks />
    </div>

    <!-- ── 专业技能 ── -->
    <section class="features-section section" id="about">
      <div class="container">
        <div class="section-head">
          <span class="section-tag">ABOUT</span>
          <h2 class="section-title">我的专业技能</h2>
        </div>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 技能熟练度 ── -->
    <section class="skills-section section" id="skills">
      <div class="container">
        <div class="section-head">
          <span class="section-tag">SKILLS</span>
          <h2 class="section-title">技能熟练度</h2>
        </div>
        <div class="skills-grid">
          <div v-for="s in skills" :key="s.name" class="skill-row">
            <div class="skill-meta">
              <span class="skill-name">{{ s.name }}</span>
              <span class="skill-pct">{{ s.level }}%</span>
            </div>
            <div class="skill-track">
              <div class="skill-fill" :data-level="s.level" :style="{ width: s.level + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 网站统计 ── -->
    <section class="stats-section section">
      <div class="container">
        <div class="section-head">
          <span class="section-tag">STATS</span>
          <h2 class="section-title">网站统计</h2>
        </div>
        <WebsiteStatistics />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background: var(--bg);
}

/* ── Hero ── */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景网格 */
.hero-grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.grid-line-v {
  flex: 1;
  border-right: 1px solid var(--border);
}

.hero-content {
  position: relative;
  z-index: 2;
  padding-top: 80px;
}

.hero-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(3.5rem, 10vw, 8rem);
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--text);
  margin-bottom: 1.5rem;
}

.hero-line {
  width: 80px;
  height: 1px;
  background: var(--text);
  margin-bottom: 1.5rem;
}

.hero-sub {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2.5rem;
  max-width: 400px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* 滚动提示 */
.scroll-hint {
  position: absolute;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
}

.scroll-line {
  display: block;
  width: 1px;
  height: 40px;
  background: var(--border-hover);
  animation: scrollPulse 2s ease-in-out infinite;
}

@keyframes scrollPulse {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1; }
}

.scroll-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* ── section 通用头部 ── */
.section-head {
  margin-bottom: 3rem;
}

.section-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 400;
  color: var(--text);
}

/* ── 特性网格 ── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
}

.feature-card {
  padding: 2rem;
  border: none;
  background: var(--bg);
  transition: background var(--transition);
}

.feature-card:hover {
  background: var(--bg-2);
}

.feature-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
  letter-spacing: 0.02em;
}

.feature-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.7;
}

/* ── 技能条 ── */
.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 640px;
}

.skill-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-meta {
  display: flex;
  justify-content: space-between;
}

.skill-name {
  font-size: 0.85rem;
  color: var(--text);
  letter-spacing: 0.02em;
}

.skill-pct {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

.skill-track {
  height: 1px;
  background: var(--border);
  position: relative;
}

.skill-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--text);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .hero-title { font-size: clamp(3rem, 12vw, 5rem); }
  .features-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; align-items: flex-start; }
}
</style>
