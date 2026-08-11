<script setup lang="ts">
const projects = [
  {
    id: "video-player",
    title: "视频空间",
    desc: "长视频、剪辑和观看入口，都收在这个安静的放映厅里。",
    url: "https://video.jisoolove.top",
    no: "TICKET 01",
    seat: "video.jisoolove.top",
    action: "入场",
  },
  {
    id: "subscription-manager",
    title: "提醒中心",
    desc: "订阅、提醒和重要的日子，排进一条可以追踪的时间线。",
    url: "https://remind.jisoolove.top",
    no: "TICKET 02",
    seat: "remind.jisoolove.top",
    action: "入场",
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
        <span class="section-kicker">作品</span>
        <h2 class="section-title">口袋里的两张票根。</h2>
        <p class="section-copy">
          正在维护的两个小空间，各自独立。撕下票根就能进去。
        </p>
      </div>

      <div class="ticket-grid">
        <article
          v-for="project in projects"
          :key="project.id"
          class="ticket"
          role="link"
          tabindex="0"
          @click="openProject(project.url)"
          @keydown.enter="openProject(project.url)"
          @keydown.space.prevent="openProject(project.url)"
        >
          <div class="ticket-stub" aria-hidden="true">
            <span>{{ project.no }}</span>
          </div>
          <div class="ticket-body">
            <div class="ticket-top">
              <span class="ticket-seat">{{ project.seat }}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 17 17 7M17 7H8M17 7v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3>{{ project.title }}</h3>
            <p>{{ project.desc }}</p>
            <small>{{ project.action }} →</small>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-head {
  max-width: 640px;
  margin-bottom: 28px;
}

.ticket-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.ticket {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  min-height: 240px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(150deg, var(--panel), var(--panel-muted));
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
}

.ticket:hover,
.ticket:focus-visible {
  transform: translateY(-4px) rotate(-0.4deg);
  border-color: rgba(242, 160, 181, 0.5);
  box-shadow: 0 18px 44px rgba(242, 160, 181, 0.12);
  outline: none;
}

.ticket-stub {
  position: relative;
  display: grid;
  place-items: center;
  border-right: 2px dashed var(--line-strong);
  background: rgba(242, 160, 181, 0.08);
}

/* 票根撕口的两个半圆缺口 */
.ticket-stub::before,
.ticket-stub::after {
  content: "";
  position: absolute;
  right: -8px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg);
}

.ticket-stub::before {
  top: -7px;
}

.ticket-stub::after {
  bottom: -7px;
}

.ticket-stub span {
  writing-mode: vertical-rl;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3em;
}

.ticket-body {
  display: flex;
  flex-direction: column;
  padding: 22px;
}

.ticket-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-soft);
}

.ticket-seat {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.ticket-top svg {
  width: 20px;
  height: 20px;
  color: var(--accent-2);
  transition: transform var(--transition);
}

.ticket:hover .ticket-top svg {
  transform: translate(2px, -2px);
}

.ticket-body h3 {
  margin-top: auto;
  padding-top: 32px;
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 900;
}

.ticket-body p {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.96rem;
}

.ticket-body small {
  margin-top: 16px;
  color: var(--accent);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

@media (max-width: 820px) {
  .ticket-grid {
    grid-template-columns: 1fr;
  }
}
</style>
