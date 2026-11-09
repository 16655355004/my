<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import AgentSectionBuild from "./AgentSectionBuild.vue";
import type { BoxSpec } from "./agentBuild";

const projectSpecs: BoxSpec[] = [
  { sel: ".section-kicker", label: "kicker", fill: "line" },
  { sel: ".section-title", label: "title", fill: "title" },
  { sel: ".section-copy", label: "copy", fill: "lines" },
  { sel: ".ticket", label: "ticket", fill: "none", all: true },
  { sel: ".ticket-stub", label: "stub", fill: "rail", all: true },
  { sel: ".ticket-top", label: "top", fill: "line", all: true },
  { sel: ".ticket-body h3", label: "h3", fill: "line", all: true },
  { sel: ".ticket-body p", label: "p", fill: "lines", all: true },
  { sel: ".ticket-body small", label: "cta", fill: "line", all: true },
];

const statusSpecs: BoxSpec[] = [
  { sel: ".section-kicker", label: "kicker", fill: "line" },
  { sel: ".section-title", label: "title", fill: "title" },
  { sel: ".section-copy", label: "copy", fill: "lines" },
  { sel: ".stats-note", label: "panel", fill: "none" },
  { sel: ".note-head", label: "head", fill: "line" },
  { sel: ".note-row", label: "row", fill: "line", all: true },
  { sel: ".note-foot", label: "foot", fill: "line" },
];

const projectBuild = ref<InstanceType<typeof AgentSectionBuild> | null>(null);
const statusBuild = ref<InstanceType<typeof AgentSectionBuild> | null>(null);

let cancelled = false;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

// 匀速推进，不用 scroll-behavior: smooth，才能保证一路上不停顿
function animateScroll(targetY: number, duration: number): Promise<void> {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) {
      resolve();
      return;
    }

    const started = performance.now();
    const step = () => {
      if (cancelled) {
        resolve();
        return;
      }
      const progress = Math.min(1, (performance.now() - started) / duration);
      window.scrollTo({ top: startY + delta * progress, behavior: "instant" as ScrollBehavior });
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

async function waitForIntro(timeout = 12000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (cancelled) return false;
    if (!document.querySelector(".ai-intro")) return true;
    await sleep(90);
  }
  return !cancelled && !document.querySelector(".ai-intro");
}

async function tour() {
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  if (maxY < 80) return;

  // 一口气滑到底：滚到哪一块，哪一块就开始被搭出来
  const descendMs = Math.min(Math.max((maxY / 300) * 1000, 3600), 12000);
  await animateScroll(maxY, descendMs);
  if (cancelled) return;

  // 等最后一块收尾，再回到顶部
  await Promise.race([statusBuild.value?.run() ?? Promise.resolve(), sleep(4500)]);
  if (cancelled) return;

  await sleep(420);
  if (cancelled) return;

  await animateScroll(0, 1600);
}

const stop = () => {
  cancelled = true;
};

const stopEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

onMounted(async () => {
  await nextTick();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // 只有「刚进入页面」才自动播放；从别的页面跳回来就交给滚动触发
  if (!document.querySelector(".ai-intro")) return;

  stopEvents.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));

  if (!(await waitForIntro())) return;
  await sleep(60);
  await tour();
});

onBeforeUnmount(() => {
  cancelled = true;
  stopEvents.forEach((name) => window.removeEventListener(name, stop));
});
</script>

<template>
  <AgentSectionBuild ref="projectBuild" section-sel="#projects" :specs="projectSpecs" />
  <AgentSectionBuild ref="statusBuild" section-sel="#status" :specs="statusSpecs" />
</template>
