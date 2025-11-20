# 技术架构与选型（滚动性能优化）

## 架构总览
- 前端框架：Vue 3 + Vite。
- 动画：GSAP + ScrollTrigger（局部使用）。
- 路由：`vue-router`。
- 样式：全局 CSS + 组件 Scoped CSS。

## 优化后核心思路
- 以 CSS Sticky 视差替代 `background-attachment: fixed`。
- 统一将背景图从 `background-image` 转为独立 DOM 的 `.bg-layer`，使用 `transform` 做位移/缩放，`will-change: transform`。
- 下沉重滤镜与大阴影：滚动中不再使用 `backdrop-filter`，改为半透明遮罩或预处理图。
- 限制 ScrollTrigger：如需 JS 驱动，仅绑定在局部容器，并缩小作用区间，避免绑定 `body` 全程刷新。

## 关键设计点
- DOM 分层：区块结构
  - `.section`（内容层，正常文档流）
  - `.section-sticky`（`position: sticky; top: 0;`，承载背景）
  - `.bg-layer`（绝对定位于 sticky 内，负责视觉背景，transform 动画）
- 资源策略：
  - 将大 PNG 转为 WebP/AVIF（保持同名/同目录，使用 `<picture>` 或 `image-set()` 响应式）
  - 移动端使用较小尺寸；非首屏懒加载。
- 动画策略：
  - Hero/Feature 等入场动画保持；视差改为 CSS/轻量 JS。
  - 无限循环动画数量减半或在滚动时暂停（可选）。
- 监听策略：
  - `passive: true` 滚动监听；每帧工作统一 `requestAnimationFrame` 合并。

## 备选方案（回退）
- 若某些浏览器 Sticky 视差表现不稳定：
  - 回退为最小化 ScrollTrigger transform 方案。
- 若资源转换受限：
  - 先按 PNG 响应式多尺寸 + 压缩执行，再逐步替换 WebP。
