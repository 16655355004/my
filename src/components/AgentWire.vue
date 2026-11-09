<script setup lang="ts">
import { AGENTS, barsFor, type WireBox } from "./agentBuild";

defineProps<{ boxes: WireBox[] }>();

const boxStyle = (box: WireBox) => ({
  left: `${box.x}px`,
  top: `${box.y}px`,
  width: `${box.w}px`,
  height: `${box.h}px`,
});

const barStyle = (bar: ReturnType<typeof barsFor>[number]) => ({
  top: bar.top,
  left: bar.left,
  width: bar.width,
  height: bar.height,
  borderRadius: bar.radius,
});
</script>

<template>
  <div class="ai-stage">
    <div
      v-for="box in boxes"
      :key="box.id"
      class="wf-box"
      :class="{ 'tag-inside': box.inside }"
      :style="boxStyle(box)"
    >
      <span class="wf-tag">{{ box.label }}</span>
      <span v-if="box.w > 120" class="wf-dim">{{ box.w }} × {{ box.h }}</span>
      <span v-for="(bar, bi) in barsFor(box)" :key="bi" class="wf-bar" :style="barStyle(bar)"></span>
    </div>

    <div
      v-for="agent in AGENTS"
      :key="`guide-${agent.name}`"
      class="ai-guide"
      :style="{ color: agent.color }"
    >
      <span class="ai-guide-h"></span>
      <span class="ai-guide-v"></span>
    </div>

    <div
      v-for="agent in AGENTS"
      :key="`caret-${agent.name}`"
      class="ai-caret"
      :style="{ color: agent.color }"
    >
      <span class="ai-caret-bar"></span>
    </div>

    <div v-for="agent in AGENTS" :key="agent.name" class="ai-cursor" :style="{ color: agent.color }">
      <svg class="ai-cursor-arrow" width="20" height="22" viewBox="0 0 20 22" fill="none">
        <path
          d="M2.5 1.5 L2.5 18.2 L6.9 14.1 L10 20.4 L13.1 18.9 L10.1 12.8 L16.6 12.4 Z"
          fill="currentColor"
          stroke="rgba(9, 10, 20, 0.9)"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
      </svg>
      <span class="ai-cursor-tag" :style="{ background: agent.color }">{{ agent.name }} · {{ agent.role }}</span>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.ai-stage {
  position: absolute;
  inset: 0;
}

.wf-box {
  position: absolute;
  border: 1px dashed rgba(242, 236, 223, 0.3);
  border-radius: 6px;
}

/* 四角留两个 L 形角标，图纸那种感觉 */
.wf-box::before,
.wf-box::after {
  content: "";
  position: absolute;
  width: 5px;
  height: 5px;
  border-style: solid;
  border-color: rgba(242, 236, 223, 0.45);
}

.wf-box::before {
  top: -1px;
  left: -1px;
  border-width: 1px 0 0 1px;
}

.wf-box::after {
  right: -1px;
  bottom: -1px;
  border-width: 0 1px 1px 0;
}

.wf-tag {
  position: absolute;
  bottom: calc(100% + 5px);
  left: -1px;
  padding: 1px 6px;
  border: 1px solid rgba(242, 236, 223, 0.16);
  border-radius: 4px;
  background: rgba(9, 10, 20, 0.92);
  color: rgba(242, 236, 223, 0.52);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  line-height: 1.6;
  white-space: nowrap;
}

.wf-dim {
  position: absolute;
  right: 0;
  bottom: calc(100% + 5px);
  color: rgba(242, 236, 223, 0.34);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
  line-height: 1.75;
  white-space: nowrap;
}

.tag-inside .wf-tag {
  top: 2px;
  bottom: auto;
  left: 6px;
}

.tag-inside .wf-dim {
  top: 2px;
  bottom: auto;
  right: 6px;
}

.wf-bar {
  position: absolute;
  display: block;
  background: linear-gradient(
    90deg,
    rgba(242, 236, 223, 0.1),
    rgba(242, 236, 223, 0.22),
    rgba(242, 236, 223, 0.1)
  );
  background-size: 220% 100%;
  animation: wf-shimmer 1.9s linear infinite;
}

/* 设计工具那种定位线：跟着当前正在测量的框走 */
.ai-guide {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.ai-guide-h {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px);
}

.ai-guide-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  background: repeating-linear-gradient(180deg, currentColor 0 6px, transparent 6px 12px);
}

.ai-cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  will-change: transform;
}

.ai-cursor-arrow {
  position: absolute;
  top: -2px;
  left: -2px;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.6));
}

.ai-cursor-tag {
  position: absolute;
  top: 17px;
  left: 15px;
  padding: 2px 9px;
  border-radius: 999px;
  color: #0b0c16;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.7;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
}

.ai-cursor.flip .ai-cursor-tag {
  right: 15px;
  left: auto;
}

/* 写字时的笔尖 */
.ai-caret {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 16px;
  opacity: 0;
  will-change: transform;
}

.ai-caret-bar {
  display: block;
  width: 100%;
  height: 100%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
  animation: ai-caret-blink 0.9s steps(1) infinite;
}

/* 触屏没有鼠标，光标和定位线只会碍事 */
@media (pointer: coarse) {
  .ai-cursor,
  .ai-guide {
    display: none;
  }
}

@keyframes ai-caret-blink {
  0%,
  62% {
    opacity: 1;
  }
  63%,
  100% {
    opacity: 0.14;
  }
}

@keyframes wf-shimmer {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
}
</style>
