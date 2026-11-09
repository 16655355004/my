import gsap from "gsap";

export type FillKind = "none" | "rail" | "line" | "lines" | "title" | "pills";

export interface BoxSpec {
  sel: string;
  label: string;
  fill: FillKind;
  all?: boolean;
}

export interface WireBox {
  id: number;
  label: string;
  fill: FillKind;
  x: number;
  y: number;
  w: number;
  h: number;
  agent: number;
  inside: boolean;
  el: HTMLElement;
}

export interface FillBar {
  top: string;
  left: string;
  width: string;
  height: string;
  radius: string;
}

export const AGENTS = [
  { name: "agent.01", role: "排版", color: "#f2a0b5" },
  { name: "agent.02", role: "文案", color: "#a08cff" },
  { name: "agent.03", role: "细节", color: "#ffd98e" },
];

const FILL_BARS: Record<Exclude<FillKind, "none">, FillBar[]> = {
  rail: [{ top: "5%", left: "32%", width: "36%", height: "90%", radius: "4px" }],
  line: [{ top: "33%", left: "0%", width: "82%", height: "34%", radius: "999px" }],
  lines: [
    { top: "8%", left: "0%", width: "96%", height: "23%", radius: "999px" },
    { top: "41%", left: "0%", width: "88%", height: "23%", radius: "999px" },
    { top: "74%", left: "0%", width: "56%", height: "23%", radius: "999px" },
  ],
  title: [
    { top: "3%", left: "0%", width: "86%", height: "37%", radius: "8px" },
    { top: "53%", left: "0%", width: "67%", height: "37%", radius: "8px" },
  ],
  pills: [
    { top: "30%", left: "0%", width: "18%", height: "42%", radius: "999px" },
    { top: "30%", left: "27%", width: "18%", height: "42%", radius: "999px" },
    { top: "30%", left: "54%", width: "18%", height: "42%", radius: "999px" },
    { top: "30%", left: "81%", width: "18%", height: "42%", radius: "999px" },
  ],
};

// 骨架条的行数/形状跟着框的尺寸走，短一行文案不会被塞进三根条
export function barsFor(box: WireBox): FillBar[] {
  if (box.fill === "none") return [];

  if (box.fill === "lines") {
    if (box.h < 44) return [{ top: "32%", left: "0%", width: "92%", height: "36%", radius: "999px" }];
    if (box.h < 88) {
      return [
        { top: "16%", left: "0%", width: "96%", height: "30%", radius: "999px" },
        { top: "58%", left: "0%", width: "72%", height: "30%", radius: "999px" },
      ];
    }
    return FILL_BARS.lines;
  }

  if (box.fill === "title" && box.h < 80) {
    return [{ top: "22%", left: "0%", width: "78%", height: "56%", radius: "8px" }];
  }

  return FILL_BARS[box.fill];
}

/**
 * 量取真实 DOM 的骨架位置。
 * scope 为空时以视口为坐标原点；传入元素时以该元素的盒子为原点（用于区块内的构建）。
 */
export function measureBoxes(specs: BoxSpec[], scope?: HTMLElement | null): WireBox[] {
  const out: WireBox[] = [];
  const origin = scope ? scope.getBoundingClientRect() : null;
  const boundHeight = origin ? origin.height : window.innerHeight;

  // 真实页面可能还在跑入场动画（transform 会改变 getBoundingClientRect），
  // 量取时临时抹掉 transform，拿到稳定的布局位置。
  document.documentElement.classList.add("ai-measure");

  specs.forEach((spec) => {
    const searchRoot: ParentNode = scope ?? document;
    const found = Array.from(searchRoot.querySelectorAll<HTMLElement>(spec.sel));
    const list = spec.all ? found : found.slice(0, 1);

    list.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;

      const x = rect.left - (origin ? origin.left : 0);
      const y = rect.top - (origin ? origin.top : 0);
      if (y + rect.height < 4 || y > boundHeight - 4) return;

      out.push({
        id: out.length,
        label: spec.label,
        fill: spec.fill,
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        agent: 0,
        inside: y < 34,
        el,
      });
    });
  });

  document.documentElement.classList.remove("ai-measure");

  const total = out.length || 1;
  out.forEach((box, index) => {
    box.agent = Math.min(AGENTS.length - 1, Math.floor((index / total) * AGENTS.length));
  });

  return out;
}

export interface LaneOptions {
  startDelay?: number;
  /** 每个框开始填内容时调用，用来把真实元素逐块露出来 */
  onFilled?: (box: WireBox) => void;
}

export interface LaneResult {
  timeline: gsap.core.Timeline;
  drawEnd: number;
  boxEls: HTMLElement[];
  cursorEls: HTMLElement[];
}

/**
 * 三个 agent 各领一段、并行走完整套「拖框 + 填内容」。
 * 时间轴以 0 为起点、绝对时间排布，调用方在后面接自己的收尾。
 */
export function playLanes(root: HTMLElement, boxes: WireBox[], options: LaneOptions = {}): LaneResult {
  const pick = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const boxEls = pick(".wf-box");
  const cursorEls = pick(".ai-cursor");
  const guideEls = pick(".ai-guide");

  gsap.set(boxEls, { opacity: 0 });
  gsap.set(pick(".wf-bar"), { opacity: 0, scaleX: 0.55, transformOrigin: "left center" });
  gsap.set(pick(".wf-tag"), { opacity: 0, y: 4 });
  gsap.set(cursorEls, { opacity: 0, scale: 0.85 });

  // 光标和它的名字标签不能冲出所在舞台
  const stageWidth = root.clientWidth || window.innerWidth;
  const stageHeight = root.clientHeight || window.innerHeight;
  const clampX = (value: number) => Math.min(Math.max(value, 2), stageWidth - 20);
  const clampY = (value: number) => Math.min(Math.max(value, 2), stageHeight - 24);

  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  const lanes: gsap.core.Timeline[] = [];
  const startDelay = options.startDelay ?? 0.4;
  // 挑一个框演一次「先画歪、再改回来」，整场太顺反而假
  const mistakeId = boxes.length > 5 ? boxes[Math.floor(boxes.length * 0.62)].id : -1;

  AGENTS.forEach((_, agentIndex) => {
    const lane = boxes.filter((box) => box.agent === agentIndex);
    const cursor = cursorEls[agentIndex];
    if (!lane.length || !cursor) return;

    const first = lane[0];
    gsap.set(cursor, { x: clampX(first.x - 120), y: clampY(first.y + 96) });

    const laneTl = gsap.timeline();
    let t = startDelay + agentIndex * 0.09;

    // 每个 agent 一组定位线，跟着它当前测量的框走
    const guide = guideEls[agentIndex];
    const guideH = guide?.querySelector<HTMLElement>(".ai-guide-h") ?? null;
    const guideV = guide?.querySelector<HTMLElement>(".ai-guide-v") ?? null;

    laneTl.to(cursor, { opacity: 1, scale: 1, duration: 0.3 }, t);
    t += 0.13;

    lane.forEach((box) => {
      const el = boxEls[box.id];
      if (!el) return;
      const tag = el.querySelector<HTMLElement>(".wf-tag");
      const flipTag = box.x + box.w - 8 > stageWidth - 150;

      laneTl.call(() => { cursor.classList.toggle("flip", flipTag); }, undefined, t);

      // 光标挪到框的左上角，然后拖着框往右擦出来
      laneTl.to(
        cursor,
        { x: clampX(box.x - 2), y: clampY(box.y - 3), duration: 0.15, ease: "power2.inOut" },
        t,
      );
      t += 0.09;

      if (guide && guideH && guideV) {
        laneTl.set(guideH, { top: box.y }, t);
        laneTl.set(guideV, { left: box.x }, t);
        laneTl.set(guide, { opacity: 0.42 }, t);
        laneTl.to(guide, { opacity: 0, duration: 0.3, ease: "power1.out" }, t + 0.34);
      }

      laneTl
        .fromTo(
          el,
          { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" },
          { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power1.inOut" },
          t,
        )
        .to(cursor, { x: clampX(box.x + box.w - 8), duration: 0.2, ease: "none" }, t)
        .set(el, { clipPath: "none" }, t + 0.2);

      if (tag) laneTl.to(tag, { opacity: 1, y: 0, duration: 0.18 }, t + 0.14);
      t += 0.17;

      // 画歪一次：尺寸差一截，停一下再改回正确尺寸
      if (box.id === mistakeId) {
        const wrongW = Math.max(40, Math.round(box.w * 0.62));
        const wrongH = Math.max(24, Math.round(box.h * 0.78));
        laneTl.to(el, { width: wrongW, height: wrongH, duration: 0.16, ease: "power2.in" }, t);
        laneTl.to(cursor, { x: clampX(box.x + wrongW), duration: 0.16, ease: "power2.in" }, t);
        laneTl.to(el, { width: box.w, height: box.h, duration: 0.24, ease: "back.out(1.6)" }, t + 0.46);
        laneTl.to(cursor, { x: clampX(box.x + box.w - 8), duration: 0.24, ease: "power2.out" }, t + 0.46);
        t += 0.72;
      }

      // 填内容：骨架条一根一根长出来，同时把真实元素逐块露出来
      const bars = Array.from(el.querySelectorAll<HTMLElement>(".wf-bar"));
      // 骨架条先长出来，稍等一下再落笔写真实内容
      if (options.onFilled) laneTl.call(() => options.onFilled?.(box), undefined, t + 0.16);
      if (bars.length) {
        laneTl.to(
          bars,
          { opacity: 1, scaleX: 1, duration: 0.16, stagger: 0.07, ease: "back.out(1.6)" },
          t,
        );
        t += 0.15;
      }
    });

    lanes.push(laneTl);
    timeline.add(laneTl, 0);
  });

  const drawEnd = Math.max(...lanes.map((lane) => lane.duration()), 1);
  return { timeline, drawEnd, boxEls, cursorEls };
}

export const SETTLED_BOX = {
  borderColor: "rgba(242, 160, 181, 0.45)",
  backgroundColor: "rgba(242, 160, 181, 0.045)",
};

interface LineBox {
  top: number;
  left: number;
  right: number;
  height: number;
}

/** 用 Range 量出每个文字元素真实的行框（支持内部有 span/em 等嵌套） */
function measureLineBoxes(el: HTMLElement, base: DOMRect): LineBox[] {
  const lines: LineBox[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;

  while (node) {
    const text = node.textContent ?? "";
    for (let i = 0; i < text.length; i += 1) {
      if (!text[i].trim()) continue;

      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect || rect.height <= 0) continue;

      const top = rect.top - base.top;
      const left = rect.left - base.left;
      const right = rect.right - base.left;
      const last = lines[lines.length - 1];

      if (last && Math.abs(last.top - top) < 2) {
        last.left = Math.min(last.left, left);
        last.right = Math.max(last.right, right);
        last.height = Math.max(last.height, rect.height);
      } else {
        lines.push({ top, left, right, height: rect.height });
      }
    }
    node = walker.nextNode() as Text | null;
  }

  return lines;
}

/**
 * 像被一笔一笔写上去：笔迹沿行从左到右推进，写完一行才写下一行。
 * 布局不动，只用一个由行框拼出来的 clip-path 控制「写到哪了」。
 */
export interface WriteOptions {
  /** 元素在舞台坐标系里的左上角，用来定位笔尖 */
  originX?: number;
  originY?: number;
  caret?: HTMLElement | null;
  onDone?: () => void;
}

/**
 * 像被一笔一笔写上去：笔迹沿行从左到右推进，写完一行才写下一行。
 * 布局不动，只用一个由行框拼出来的 clip-path 控制「写到哪了」。
 */
export function writeIn(el: HTMLElement, options: WriteOptions = {}): void {
  const { originX = 0, originY = 0, caret = null, onDone } = options;
  const base = el.getBoundingClientRect();
  const lines = measureLineBoxes(el, base);

  if (!lines.length) {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", clearProps: "opacity", onComplete: onDone });
    return;
  }

  const totalWidth = lines.reduce((sum, line) => sum + (line.right - line.left), 0);
  const state = { p: 0 };

  const moveCaret = (x: number, y: number, height: number) => {
    if (!caret) return;
    caret.style.transform = `translate3d(${originX + x}px, ${originY + y - 2}px, 0)`;
    caret.style.height = `${height + 5}px`;
    caret.style.opacity = "1";
  };

  const apply = () => {
    let remaining = totalWidth * state.p;
    const parts: string[] = [];
    let penX = lines[0].left;
    let penY = lines[0].top;
    let penH = lines[0].height;

    for (const line of lines) {
      const width = line.right - line.left;
      const shown = Math.min(width, remaining);
      remaining -= shown;
      penX = line.left + shown;
      penY = line.top;
      penH = line.height;

      if (shown > 0.5) {
        const top = line.top - 2;
        const height = line.height + 5;
        parts.push(
          `M${line.left.toFixed(1)} ${top.toFixed(1)}h${shown.toFixed(1)}v${height.toFixed(1)}h${(-shown).toFixed(1)}Z`,
        );
      }
      if (remaining <= 0) break;
    }

    el.style.clipPath = parts.length ? `path("${parts.join(" ")}")` : "inset(0% 100% 0% 0%)";
    moveCaret(penX, penY, penH);
  };

  apply();
  gsap.to(state, {
    p: 1,
    duration: Math.min(1.25, 0.25 + totalWidth * 0.00075),
    ease: "none",
    onUpdate: apply,
    onComplete: () => {
      el.style.removeProperty("clip-path");
      if (caret) caret.style.opacity = "0";
      onDone?.();
    },
  });
}

export function clearReveal(el: HTMLElement) {
  el.style.removeProperty("clip-path");
  el.style.removeProperty("-webkit-clip-path");
  el.style.removeProperty("mask-image");
  el.style.removeProperty("-webkit-mask-image");
}

/** 文字块写字，整块容器（卡片/面板）直接淡入 */
export function revealBox(box: WireBox, options: WriteOptions = {}): void {
  if (box.fill === "none" || box.fill === "rail" || box.fill === "pills") {
    gsap.fromTo(box.el, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "power1.out", clearProps: "opacity", onComplete: options.onDone });
    return;
  }
  writeIn(box.el, { ...options, originX: box.x, originY: box.y });
}
