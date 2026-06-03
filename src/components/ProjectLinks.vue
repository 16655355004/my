<script setup lang="ts">
const projects = [
  {
    id: "video-player",
    title: "视频空间",
    desc: "把长视频、剪辑和观看入口整理成一个更安静的作品空间。",
    url: "https://video.jisoolove.top",
    tag: "MEDIA",
    tone: "amber",
    action: "打开空间",
  },
  {
    id: "subscription-manager",
    title: "提醒中心",
    desc: "把订阅、提醒和重要事项放进可追踪的时间线。",
    url: "https://remind.jisoolove.top",
    tag: "SYSTEM",
    tone: "coral",
    action: "进入中心",
  },
];

const openProject = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
</script>

<template>
  <section class="projects-section section" id="projects">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="section-kicker">Works</span>
          <h2 class="section-title">空空正在维护的两个公开入口。</h2>
        </div>
        <p class="section-copy">
          视频和提醒各自独立，想看什么就直接进入，不让多余信息打断浏览。
        </p>
      </div>

      <div class="project-grid">
        <article
          v-for="project in projects"
          :key="project.id"
          :class="['project-card', project.tone]"
          role="link"
          tabindex="0"
          @click="openProject(project.url)"
          @keydown.enter="openProject(project.url)"
          @keydown.space.prevent="openProject(project.url)"
        >
          <div class="project-top">
            <span>{{ project.tag }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M17 7H8M17 7v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3>{{ project.title }}</h3>
          <p>{{ project.desc }}</p>
          <small>{{ project.action }}</small>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
  gap: 28px;
  align-items: end;
  margin-bottom: 28px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.project-card {
  position: relative;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035)),
    radial-gradient(circle at 16% 8%, var(--card-glow), transparent 48%);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform var(--transition), border-color var(--transition), background var(--transition);
}

.project-card::after {
  content: "";
  position: absolute;
  inset: auto 18px 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
  opacity: 0;
  transform: scaleX(0.72);
  transition: opacity var(--transition), transform var(--transition);
}

.project-card:hover,
.project-card:focus-visible {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--line-strong);
  outline: none;
}

.project-card:hover::after,
.project-card:focus-visible::after {
  opacity: 1;
  transform: scaleX(1);
}

.project-card.amber {
  --card-glow: rgba(240, 179, 91, 0.32);
}

.project-card.mint {
  --card-glow: rgba(83, 198, 176, 0.28);
}

.project-card.coral {
  --card-glow: rgba(239, 111, 108, 0.26);
}

.project-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.project-top svg {
  width: 22px;
  height: 22px;
}

h3 {
  margin-top: auto;
  color: var(--text);
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  font-weight: 800;
}

p {
  margin-top: 14px;
  color: var(--text-muted);
}

small {
  margin-top: 24px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .section-head,
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
