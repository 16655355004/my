<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import gsap from "gsap";
import AgentWire from "./AgentWire.vue";
import { clearReveal, measureBoxes, playLanes, revealBox, type BoxSpec, type WireBox } from "./agentBuild";

const emit = defineEmits<{ done: [] }>();

// 按真实页面的结构顺序量取：先骨架，后内容
const BOX_SPECS: BoxSpec[] = [
  { sel: ".brand-seal", label: "logo", fill: "line" },
  { sel: ".nav-desktop", label: "nav", fill: "pills" },
  { sel: ".journal-side", label: "side", fill: "rail" },
  { sel: ".journal-page", label: "page", fill: "none" },
  { sel: ".journal-date", label: "meta", fill: "line" },
  { sel: ".journal-greeting", label: "sub", fill: "lines" },
  { sel: ".journal-title", label: "title", fill: "title" },
  { sel: ".journal-script", label: "script", fill: "line" },
  { sel: ".journal-intro", label: "body", fill: "lines" },
  { sel: ".journal-sign", label: "by", fill: "lines" },
  { sel: ".journal-visitor", label: "stat", fill: "line" },
  { sel: ".journal-actions .btn", label: "cta", fill: "line", all: true },
];

const rootRef = ref<HTMLElement | null>(null);
const boxes = shallowRef<WireBox[]>([]);
const progress = ref(0);
const hudText = ref("AI 正在起草这一页");

let timeline: gsap.core.Timeline | null = null;
let hiddenEls: HTMLElement[] = [];
let disposed = false;

function restoreAll() {
  // 只还原「还没被写出来」的元素；正在写的交给它自己的补间收尾
  hiddenEls.forEach((el) => {
    if (el.style.visibility !== "hidden") return;
    el.style.visibility = "";
    clearReveal(el);
  });
  hiddenEls = [];
}

function play() {
  const root = rootRef.value;
  if (!root) return;

  const startedAt = performance.now();
  const items = boxes.value;
  // 真实内容先藏起来（保留布局），框画好就地写进去
  items.forEach((box) => {
    box.el.style.visibility = "hidden";
    hiddenEls.push(box.el);
  });

  const carets = Array.from(root.querySelectorAll<HTMLElement>(".ai-caret"));

  const { timeline: tl, drawEnd, cursorEls } = playLanes(root, items, {
    onFilled: (box) => {
      // 框还在的时候，内容就写进框里；写完框才消失
      box.el.style.visibility = "visible";
      const sketch = root.querySelectorAll<HTMLElement>(".wf-box")[box.id];

      // 骨架条先让位，边框和标签留着陪内容写完
      if (sketch) {
        gsap.to(sketch.querySelectorAll(".wf-bar"), { opacity: 0, duration: 0.22, ease: "power1.out" });
      }

      revealBox(box, {
        caret: carets[box.agent] ?? null,
        onDone: () => {
          if (sketch) gsap.to(sketch, { opacity: 0, duration: 0.32, ease: "power1.out" });
        },
      });
    },
  });

  // 深色画布退成透明，露出页面本身；此刻内容还藏着，所以是一片空白
  tl.to(root, { backgroundColor: "rgba(9, 10, 20, 0)", duration: 0.65, ease: "power1.out" }, 0.05);
  const vignette = root.querySelector<HTMLElement>(".ai-vignette");
  if (vignette) tl.to(vignette, { opacity: 0, duration: 0.65, ease: "power1.out" }, 0.05);

  tl.call(() => { hudText.value = "正在搭骨架"; }, undefined, 0.4);
  tl.call(() => { hudText.value = "正在写内容"; }, undefined, drawEnd * 0.6);

  tl.to(
    cursorEls,
    { x: "+=150", y: "-=115", opacity: 0, duration: 0.42, stagger: 0.045, ease: "power2.in" },
    drawEnd + 0.3,
  );

  // 最后一笔还在写的时候就开始收画布，别让首屏写完还有空等
  const endAt = drawEnd + 0.7;
  const counter = { value: 0 };
  tl.to(
    counter,
    {
      value: 100,
      duration: Math.max(endAt - 0.3, 0.5),
      ease: "none",
      onUpdate: () => { progress.value = Math.round(counter.value); },
    },
    0,
  );

  tl.call(() => {
    progress.value = 100;
    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
    hudText.value = `构建完成 · ${items.length} 个区块 · ${seconds}s`;
  }, undefined, endAt - 0.2);

  tl.to(root, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, endAt);

  tl.eventCallback("onComplete", () => emit("done"));
  timeline = tl;
}

// 首屏路由是异步解析的，得等首页真的挂载出来才量得到位置
function waitForHero(timeout = 1600): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (disposed) return resolve(false);
      if (document.querySelector(".journal-title")) return resolve(true);
      if (Date.now() - started > timeout) return resolve(false);
      window.setTimeout(check, 50);
    };
    check();
  });
}

onMounted(async () => {
  document.documentElement.classList.add("ai-lock");

  await nextTick();
  if (!(await waitForHero()) || disposed) {
    emit("done");
    return;
  }

  // 字体就位再量尺寸，但不能被外部字体请求卡住
  await Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => window.setTimeout(resolve, 800)),
  ]);

  if (disposed) return;

  boxes.value = measureBoxes(BOX_SPECS);
  await nextTick();
  if (disposed) return;

  if (!boxes.value.length) {
    emit("done");
    return;
  }

  play();
});

onBeforeUnmount(() => {
  disposed = true;
  timeline?.kill();
  restoreAll();
  document.documentElement.classList.remove("ai-lock", "ai-measure");
});
</script>

<template>
  <Teleport to="body">
    <div ref="rootRef" class="ai-intro" aria-hidden="true">
      <div class="ai-grid"></div>
      <div class="ai-vignette"></div>

      <AgentWire :boxes="boxes" />

      <div class="ai-hud">
        <span class="ai-dot"></span>
        <span class="ai-hud-text">{{ hudText }}</span>
        <span class="ai-hud-pct">{{ progress }}%</span>
      </div>

      <div class="ai-progress"><span :style="{ width: `${progress}%` }"></span></div>
    </div>
  </Teleport>
</template>

<style scoped>
.ai-intro {
  position: fixed;
  inset: 0;
  z-index: 9000;
  overflow: hidden;
  background: #090a14;
  pointer-events: auto;
}

.ai-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(242, 236, 223, 0.055) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(242, 236, 223, 0.055) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 88% 78% at 50% 45%, #000 38%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 88% 78% at 50% 45%, #000 38%, transparent 100%);
  animation: ai-fade-in 0.75s ease-out both;
}

.ai-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 72% 62% at 50% 48%, transparent 26%, rgba(6, 7, 14, 0.9) 100%);
}

.ai-hud {
  position: absolute;
  left: clamp(18px, 3vw, 34px);
  bottom: clamp(18px, 3vh, 30px);
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(242, 236, 223, 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  animation: ai-fade-in 0.7s ease-out 0.2s both;
}

.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent, #f2a0b5);
  box-shadow: 0 0 10px var(--accent, #f2a0b5);
  animation: ai-pulse 1.1s ease-in-out infinite;
}

.ai-hud-pct {
  color: var(--accent, #f2a0b5);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ai-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgba(242, 236, 223, 0.07);
}

.ai-progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2, #a08cff), var(--accent, #f2a0b5), var(--accent-3, #ffd98e));
  box-shadow: 0 0 14px rgba(242, 160, 181, 0.45);
}

@keyframes ai-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes ai-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

<style>
/* 量取真实页面位置时，临时抵消入场动画留下的 transform */
html.ai-measure *,
html.ai-measure *::before,
html.ai-measure *::after {
  transform: none !important;
  transition: none !important;
}

html.ai-lock,
html.ai-lock body {
  overflow: hidden !important;
}
</style>
