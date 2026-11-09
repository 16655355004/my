<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, ref } from "vue";
import gsap from "gsap";
import AgentWire from "./AgentWire.vue";
import { clearReveal, measureBoxes, playLanes, revealBox, type BoxSpec, type WireBox } from "./agentBuild";

const props = defineProps<{
  sectionSel: string;
  specs: BoxSpec[];
}>();

const host = ref<HTMLElement | null>(null);
const layer = ref<HTMLElement | null>(null);
// 这里存了真实 DOM 引用，用 shallowRef 避免被做成响应式代理
const boxes = shallowRef<WireBox[]>([]);

let section: HTMLElement | null = null;
let observer: IntersectionObserver | null = null;
let timeline: gsap.core.Timeline | null = null;
let pollTimer = 0;
let running: Promise<void> | null = null;
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

async function build(): Promise<void> {
  if (!section || disposed) return;

  const measured = measureBoxes(props.specs, section);
  if (!measured.length) {
    boxes.value = [];
    return;
  }

  // 逐个把真实元素藏起来（visibility 保留布局），填到哪个再露哪个
  measured.forEach((box) => {
    if (box.el.style.visibility !== "hidden") {
      box.el.style.visibility = "hidden";
      hiddenEls.push(box.el);
    }
  });

  boxes.value = measured;
  host.value = section;

  await nextTick();
  if (disposed) {
    restoreAll();
    boxes.value = [];
    return;
  }

  const root = layer.value;
  if (!root) {
    restoreAll();
    boxes.value = [];
    return;
  }

  const { timeline: tl, drawEnd, cursorEls } = playLanes(root, boxes.value, {
    startDelay: 0.18,
    onFilled: (box) => {
      // 框还在的时候，内容就写进框里；写完框才消失
      box.el.style.visibility = "visible";
      const sketch = root.querySelectorAll<HTMLElement>(".wf-box")[box.id];

      // 骨架条先让位，边框和标签留着陪内容写完
      if (sketch) {
        gsap.to(sketch.querySelectorAll(".wf-bar"), { opacity: 0, duration: 0.22, ease: "power1.out" });
      }

      revealBox(box, () => {
        if (sketch) gsap.to(sketch, { opacity: 0, duration: 0.32, ease: "power1.out" });
      });
    },
  });

  tl.to(
    cursorEls,
    { x: "+=80", y: "-=70", opacity: 0, duration: 0.32, stagger: 0.04, ease: "power2.in" },
    drawEnd + 0.05,
  );

  // 等最后一笔写完再收场，避免骨架提前消失
  tl.to({}, { duration: 1.1 }, drawEnd + 0.4);

  const finished = new Promise<void>((resolve) => {
    tl.eventCallback("onComplete", () => {
      restoreAll();
      boxes.value = [];
      resolve();
    });
  });

  timeline = tl;
  await finished;
}

// 幂等：观察器和外部的自动播放都可以调，重复调用共享同一次构建
function run(): Promise<void> {
  if (!running) running = build();
  return running;
}

defineExpose({ run });

function observe() {
  if (disposed || !section) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        observer = null;
        void run();
      }
    },
    // 区块刚露出一点就接管：既不会在屏幕外白演，也赶在标题进入视野前先藏好
    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );
  observer.observe(section);
}

// 首屏开场动画期间先不接管，避免两个构建叠在一起
function startWhenIntroClear() {
  if (disposed) return;
  if (!document.querySelector(".ai-intro")) {
    observe();
    return;
  }
  pollTimer = window.setTimeout(startWhenIntroClear, 150);
}

onMounted(() => {
  section = document.querySelector<HTMLElement>(props.sectionSel);
  if (!section) return;
  section.classList.add("agent-host");
  startWhenIntroClear();
});

onBeforeUnmount(() => {
  disposed = true;
  window.clearTimeout(pollTimer);
  observer?.disconnect();
  timeline?.kill();
  restoreAll();
  section?.classList.remove("agent-host");
});
</script>

<template>
  <Teleport v-if="host" :to="host">
    <div ref="layer" class="agent-layer" aria-hidden="true">
      <AgentWire :boxes="boxes" />
    </div>
  </Teleport>
</template>

<style scoped>
.agent-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
</style>

<style>
.agent-host {
  position: relative;
}
</style>
