# 实施计划（编号检查清单）

把握度：90%

## A. 资源侧（优先级最高）
1. 图片资产清理与转换（需生成多尺寸）：
   - 待转换为 WebP：`src/assets/66.png`、`88.png`、`77.png`、`4.png`、`2.png`
   - 目标：桌面大图（~1920w, q=0.7）、中图（~1280w, q=0.7）、移动小图（~768w, q=0.7）
   - 如 AVIF 可用，优先 AVIF，WebP 作为兜底，PNG 作为最终兜底
2. 使用 `<picture>`/`image-set()` 或按 section 懒加载背景：
   - Hero/Features/Skills 分别在进入视口前设置背景（IntersectionObserver）

## B. 布局与样式侧（CSS Sticky 视差）
3. 移除 `background-attachment: fixed`：
   - 文件：`src/views/HomeView.vue`
   - 区块：`.features-section`（light/dark 主题），必要时 `.skills-progress`、`.hero-section`
4. 为有背景的 section 增加 DOM 层级：
   - 结构：
     - `.section`
       - `.section-sticky`（`position: sticky; top: 0; height: 100vh; overflow: hidden;`）
         - `.bg-layer`（`position: absolute; inset: 0; will-change: transform;`）
       - `.section-content`（原有内容）
5. 视差实现：
   - 优先使用纯 CSS：`sticky` 固定背景容器，`.bg-layer` 通过 `transform: translateY(var(--parallax-offset, 0px))`，由父容器基于滚动区间设置 CSS 变量（可用少量 JS/ScrollTrigger 局部设置）
6. 去除滚动中使用的 `backdrop-filter`：
   - 改为半透明遮罩：`background: rgba(0,0,0,.2~.35)`；保留视觉层次但减少 GPU 模糊
7. 大阴影与大范围渐变减重：
   - 降低阴影半径/透明度；在滚动主通道上的大卡片（如 `.feature-card`）弱化阴影

## C. 动画与 JS 侧
8. 限定 ScrollTrigger 作用范围：
   - 移除对 `trigger: "body"` + `scrub: true` 的全局绑定，改为对单个 `.section-sticky` 绑定，`start: "top bottom"`, `end: "bottom top"`
   - 仅驱动 `.bg-layer` 的 `y`/`scale`（transform）
9. 裁剪无限循环动画：
   - 保留关键视觉元素，减少数量或在滚动时暂停（可选）
10. 事件监听优化：
   - `window.addEventListener('scroll', handler, { passive: true })`
   - 每帧更新统一走 `requestAnimationFrame`，避免读写交错
11. `ElementInspector`：确保默认关闭，不随页面加载自动开启；调试时使用

## D. 代码级变更点（逐文件）
12. `src/views/HomeView.vue`
   - 模板：为 `hero`、`features`（必要时 `skills`）加入 `.section-sticky` 与 `.bg-layer`
   - 样式：删除 `background-attachment: fixed`；为 `.bg-layer` 加 `will-change: transform`
   - JS：如需轻量视差，使用 IntersectionObserver 设置 CSS 变量，或局部 ScrollTrigger
13. `src/components/Navbar.vue`
   - 移除/替换 `.nav-background` 中的 `backdrop-filter`，用半透明遮罩
   - 保留滚动变换（仅在阈值切换时动画，不在每帧执行）
14. `src/App.vue`
   - `handleScroll`/返回顶部逻辑保持；监听改为 `passive`；避免频繁 GSAP 调用
15. `src/assets/main.css`
   - 移除对全局滚动行为的强制 `scroll-behavior: smooth`（可改为仅在需要的滚动调用时指定）
   - 确保不引入新的 `backdrop-filter`

## E. 回退与开关
16. 若 CSS Sticky 表现异常：切到局部 ScrollTrigger 方案（保留 `.bg-layer`）
17. 增加 `data-perf-mode="low"` 条件类，低性能设备下关闭部分无限动画

## F. 时间预估
- 资源转换与接入：2~3 小时（不含设计回审）
- 布局改造与 CSS：2 小时
- 动画与监听治理：1.5 小时
- 自测与调优：1 小时

---

# 验收清单（摘要）
- 不同设备与浏览器滚动流畅，主路径 FPS 稳定
- 首屏合成层数量适中，无持续大面积重绘
- 资源请求量与大小下降（图片总体积显著降低）
