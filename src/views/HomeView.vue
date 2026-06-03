<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ProjectLinks from "../components/ProjectLinks.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";

gsap.registerPlugin(ScrollTrigger);

const pageRef = ref<HTMLElement | null>(null);
let gsapContext: gsap.Context | null = null;

const signals = [
  { label: "名字", value: "空空", note: "温柔、清醒、带一点闪光" },
  { label: "氛围", value: "二次元 / 星光", note: "暗场、星光、柔色切片" },
  { label: "互动", value: "轻动效", note: "停顿、呼吸、滑入" },
];

const principles = [
  { title: "第一眼有画面", desc: "星夜、柔色切片和二次元氛围先把情绪拉起来，名字自然留在视线里。", stat: "01" },
  { title: "作品有路径", desc: "视频和提醒入口保持清晰，浏览时不需要猜下一步去哪。", stat: "02" },
  { title: "细节有温度", desc: "微动效、悬停反馈和可爱光点让页面更像空空自己的小宇宙。", stat: "03" },
];

const process = [
  { label: "Night", title: "黑色背景压住噪音，星光和人物把第一屏带进安静的夜里。" },
  { label: "Soft", title: "柔色卡片、星光切片和细小反馈，让浏览节奏慢下来。" },
  { label: "Spark", title: "一点可爱、一点二次元、一点闪光，组成空空自己的识别感。" },
];

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  if (!pageRef.value) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsapContext = gsap.context(() => {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
    heroTimeline
      .from(".hero-visual__layer", { opacity: 0, scale: 1.06, duration: 1.05, stagger: 0.06 })
      .from(".hero-kicker", { opacity: 0, y: 16, duration: 0.5 }, "-=0.72")
      .from(".hero-title span", { opacity: 0, y: 46, duration: 0.78, stagger: 0.08 }, "-=0.22")
      .from(".hero-copy p, .hero-actions", { opacity: 0, y: 22, duration: 0.58, stagger: 0.08 }, "-=0.34")
      .from(".proof-pill", { opacity: 0, y: 14, duration: 0.42, stagger: 0.06 }, "-=0.22")
      .from(".signal-card", { opacity: 0, y: 22, duration: 0.55, stagger: 0.08 }, "-=0.2");

    if (prefersReducedMotion) {
      heroTimeline.progress(1);
      return;
    } else {
      requestAnimationFrame(() => heroTimeline.play(0));
    }

    gsap.to(".hero-visual__glow", {
      yPercent: -10,
      scale: 1.06,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
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
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>(".principle-card, .project-card").forEach((card, index) => {
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
          once: true,
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
          once: true,
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
        <div class="hero-visual__layer hero-visual__sky" />
        <div class="hero-visual__layer hero-visual__aurora" />
        <div class="hero-visual__layer hero-visual__stars" />
        <div class="hero-visual__layer hero-visual__glow" />
        <svg class="hero-visual__layer hero-visual__silhouette" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1a1030" />
              <stop offset="100%" stop-color="#0a0612" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffd9c8" />
              <stop offset="100%" stop-color="#e8b4a0" />
            </linearGradient>
          </defs>
          <ellipse cx="620" cy="120" rx="70" ry="70" fill="#fff8e8" opacity="0.92" />
          <ellipse cx="600" cy="130" rx="62" ry="58" fill="#c9d4ff" opacity="0.35" />
          <path d="M0 420 Q200 380 400 400 T800 390 L800 600 L0 600 Z" fill="#0d1220" />
          <path d="M0 460 Q280 430 520 450 T800 440 L800 600 L0 600 Z" fill="#12182a" opacity="0.85" />
          <path d="M480 600 C470 480 490 360 520 280 C535 230 560 200 590 195 C610 192 630 210 640 250 C655 310 660 400 650 600 Z" fill="url(#hairGrad)" />
          <path d="M540 280 C555 240 580 220 605 225 C625 228 635 250 630 280 C620 320 590 340 560 335 C545 332 535 310 540 280 Z" fill="url(#skinGrad)" />
          <path d="M530 300 C520 340 500 380 485 420 C475 450 465 490 460 530 C458 545 470 555 485 550 C510 540 535 500 550 450 C560 420 565 360 560 310 C558 295 545 290 530 300 Z" fill="url(#hairGrad)" opacity="0.9" />
          <circle cx="595" cy="268" r="4" fill="#2a1838" />
          <circle cx="615" cy="268" r="4" fill="#2a1838" />
          <path d="M598 282 Q605 288 612 282" fill="none" stroke="#d4847a" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="585" cy="275" rx="8" ry="5" fill="#ffb8c6" opacity="0.35" />
          <ellipse cx="625" cy="275" rx="8" ry="5" fill="#ffb8c6" opacity="0.35" />
        </svg>
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
            这里收着作品、状态和留言。暗色镜头、星光切片和一点可爱的互动，让每次进入都像打开一间安静的小房间。
          </p>

          <div class="hero-actions">
            <button class="btn" type="button" @click="navigateToSection('projects')">查看作品</button>
            <button class="btn btn-ghost" type="button" @click="navigateToSection('status')">查看状态</button>
          </div>

          <div class="hero-proof" aria-label="站点特征">
            <span class="proof-pill">星夜氛围</span>
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
      </div>

      <div class="kinetic-strip" aria-hidden="true">
        <div class="kinetic-track">
          <span class="kinetic-word">空空</span>
          <span class="kinetic-word">作品</span>
          <span class="kinetic-word">状态</span>
          <span class="kinetic-word">动效</span>
          <span class="kinetic-word">留言</span>
          <span class="kinetic-word">空空</span>
          <span class="kinetic-word">作品</span>
          <span class="kinetic-word">状态</span>
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
            页面从名字、画面和作品开始，往下是状态和留言。每一段都保持清楚的节奏，让人愿意停一会儿。
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

.hero-visual {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  background: #07040f;
}

.hero-visual__layer {
  position: absolute;
  inset: 0;
}

.hero-visual__sky {
  background:
    radial-gradient(ellipse 80% 60% at 72% 18%, rgba(255, 230, 180, 0.28) 0%, transparent 55%),
    radial-gradient(ellipse 90% 70% at 20% 80%, rgba(120, 80, 200, 0.35) 0%, transparent 50%),
    linear-gradient(165deg, #12082a 0%, #1a0e3a 35%, #0a0618 70%, #05070b 100%);
}

.hero-visual__aurora {
  background:
    radial-gradient(ellipse 50% 40% at 65% 30%, rgba(255, 120, 200, 0.22) 0%, transparent 60%),
    radial-gradient(ellipse 40% 35% at 40% 50%, rgba(100, 180, 255, 0.18) 0%, transparent 55%);
  animation: aurora-drift 12s ease-in-out infinite alternate;
}

.hero-visual__stars {
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 45%, rgba(255, 255, 255, 0.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 40% 15%, rgba(255, 255, 255, 0.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 60%, rgba(255, 255, 255, 0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 30%, rgba(255, 255, 255, 0.75) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 85% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 70%, rgba(255, 255, 255, 0.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 12%, rgba(255, 255, 255, 0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 48% 82%, rgba(255, 255, 255, 0.65) 0%, transparent 100%),
    radial-gradient(2px 2px at 32% 28%, rgba(201, 160, 255, 0.9) 0%, transparent 100%);
  animation: stars-twinkle 6s ease-in-out infinite alternate;
}

.hero-visual__glow {
  background: radial-gradient(ellipse 45% 55% at 68% 55%, rgba(201, 160, 255, 0.14) 0%, transparent 65%);
}

.hero-visual__silhouette {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% bottom;
  opacity: 0.92;
}

@keyframes aurora-drift {
  from { transform: translateX(-2%) scale(1); opacity: 0.85; }
  to { transform: translateX(2%) scale(1.04); opacity: 1; }
}

@keyframes stars-twinkle {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.hero-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(5, 7, 11, 0.94) 0%, rgba(5, 7, 11, 0.72) 34%, rgba(5, 7, 11, 0.18) 70%, rgba(5, 7, 11, 0.74) 100%),
    linear-gradient(0deg, rgba(5, 7, 11, 0.96) 0%, rgba(5, 7, 11, 0.24) 48%, rgba(5, 7, 11, 0.45) 100%);
}

.hero-overlay {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
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

@media (max-width: 980px) {
  .hero-overlay,
  .two-col,
  .story-grid {
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
    padding: 88px 0 182px;
  }

  .hero-title {
    font-size: clamp(2.2rem, 12vw, 4.1rem);
  }

  .hero-signal {
    grid-template-columns: 1fr;
  }

  .hero-shade {
    background:
      linear-gradient(90deg, rgba(5, 7, 11, 0.92), rgba(5, 7, 11, 0.5)),
      linear-gradient(0deg, rgba(5, 7, 11, 0.96), rgba(5, 7, 11, 0.24));
  }

  .kinetic-strip {
    bottom: 92px;
  }
}
</style>
