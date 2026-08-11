<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ProjectLinks from "../components/ProjectLinks.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";
import { statisticsService } from "../services/statisticsService";

const pageRef = ref<HTMLElement | null>(null);
const todayVisitors = ref<number | null>(null);
let gsapContext: gsap.Context | null = null;

const now = new Date();

const greeting = computed(() => {
  const hour = now.getHours();
  if (hour >= 22 || hour < 5) return "夜深了";
  if (hour < 8) return "清晨好";
  if (hour < 12) return "早上好";
  if (hour < 14) return "午安";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const greetingNote = computed(() => {
  const hour = now.getHours();
  if (hour >= 22 || hour < 5) return "这个时间还醒着的人，应该有很多心事吧。";
  if (hour < 8) return "星星刚睡下，你就来了。";
  if (hour < 12) return "今天也请多关照。";
  if (hour < 14) return "适合眯一会儿，或者随便翻翻。";
  if (hour < 18) return "泡杯茶，慢慢看。";
  return "晚风把你吹到这里来了。";
});

const dateLine = now.toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

const visitorLine = computed(() => {
  if (todayVisitors.value === null) return "今天也有人悄悄路过这里。";
  return `你是今天路过这里的第 ${todayVisitors.value} 个人。`;
});

const navigateToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

onMounted(async () => {
  if (pageRef.value) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsapContext = gsap.context(() => {
      const entry = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
      entry
        .from(".journal-date, .journal-greeting", { opacity: 0, y: 14, duration: 0.5, stagger: 0.1 })
        .from(".journal-title span", { opacity: 0, y: 34, duration: 0.7, stagger: 0.1 }, "-=0.2")
        .from(".journal-script, .journal-intro, .journal-visitor, .journal-actions", { opacity: 0, y: 18, duration: 0.5, stagger: 0.09 }, "-=0.3")
        .from(".journal-side", { opacity: 0, x: 10, duration: 0.6 }, "-=0.5");

      if (prefersReducedMotion) {
        entry.progress(1);
      } else {
        requestAnimationFrame(() => entry.play(0));
      }
    }, pageRef.value);
  }

  try {
    const result = await statisticsService.getStatistics();
    if (result.success && result.data) {
      todayVisitors.value = result.data.todayVisitors;
    }
  } catch {
    // 拿不到数字时保留占位句即可
  }
});

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <div ref="pageRef" class="home-view">
    <section class="journal" id="home">
      <div class="container journal-grid">
        <aside class="journal-side" aria-hidden="true">
          <span class="v-kicker">空空的深夜手帐</span>
          <span class="side-stamp">空</span>
        </aside>

        <div class="journal-page">
          <p class="journal-date">{{ dateLine }}</p>

          <p class="journal-greeting">
            {{ greeting }}。<em>{{ greetingNote }}</em>
          </p>

          <h1 class="journal-title">
            <span>这里是空空</span>
            <span>写给深夜的一页。</span>
          </h1>

          <p class="journal-script script" aria-hidden="true">Kongkong's Midnight Journal</p>

          <p class="journal-intro">
            没有什么宏大的作品集，只有正在维护的两个小空间、一些真实的数字，
            和一个随时可以留下字迹的地方。慢慢看，不着急。
          </p>

          <p class="journal-visitor">✦ {{ visitorLine }}</p>

          <div class="journal-actions">
            <button class="btn" type="button" @click="navigateToSection('projects')">翻到作品那页</button>
            <button class="btn btn-ghost" type="button" @click="navigateToSection('status')">看看此刻</button>
          </div>
        </div>
      </div>
    </section>

    <ProjectLinks />

    <section class="now-section section" id="status">
      <div class="container">
        <div class="now-head">
          <span class="section-kicker">此刻</span>
          <h2 class="section-title">这一页记的是真实的数字。</h2>
          <p class="section-copy">
            不是装饰品——访问、响应和运行时长都来自后台真实的记录，每次打开都不一样。
          </p>
        </div>
        <WebsiteStatistics />
      </div>
    </section>
  </div>
</template>

<style scoped>
.journal {
  min-height: 100svh;
  display: grid;
  align-items: start;
  padding: clamp(36px, 5vh, 64px) 0 calc(128px + env(safe-area-inset-bottom));
}

.journal-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: clamp(28px, 5vw, 64px);
  align-items: stretch;
}

.journal-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 0;
  border-right: 1px dashed var(--line-strong);
  padding-right: clamp(16px, 2.5vw, 32px);
}

.side-stamp {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1.5px solid rgba(242, 160, 181, 0.7);
  border-radius: 10px;
  color: var(--accent);
  font-size: 1.4rem;
  font-weight: 900;
  transform: rotate(-6deg);
}

.journal-page {
  max-width: 760px;
}

.journal-date {
  color: var(--text-soft);
  font-size: 0.92rem;
  letter-spacing: 0.14em;
}

.journal-greeting {
  margin-top: 18px;
  color: var(--text);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}

.journal-greeting em {
  color: var(--text-muted);
  font-style: normal;
}

.journal-title {
  margin-top: 22px;
  color: var(--text);
  font-size: clamp(2.4rem, 5.6vw, 4.6rem);
  font-weight: 900;
  line-height: 1.28;
}

.journal-title span {
  display: block;
}

.journal-title span:last-child {
  text-decoration: underline;
  text-decoration-color: rgba(242, 160, 181, 0.55);
  text-decoration-thickness: 3px;
  text-underline-offset: 12px;
}

.journal-script {
  margin-top: 20px;
  color: var(--accent-2);
  font-size: clamp(1.3rem, 2.6vw, 1.9rem);
  opacity: 0.85;
}

.journal-intro {
  max-width: 620px;
  margin-top: 20px;
  color: var(--text-muted);
  font-size: 1.04rem;
}

.journal-visitor {
  margin-top: 22px;
  color: var(--accent-3);
  font-size: 0.96rem;
  letter-spacing: 0.04em;
}

.journal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.now-head {
  max-width: 640px;
  margin-bottom: 28px;
}

@media (max-width: 820px) {
  .journal {
    min-height: auto;
    padding: 80px 0 calc(112px + env(safe-area-inset-bottom));
  }

  .journal-grid {
    grid-template-columns: 1fr;
  }

  .journal-side {
    flex-direction: row;
    border-right: 0;
    border-bottom: 1px dashed var(--line-strong);
    padding: 0 0 14px;
  }
}
</style>
