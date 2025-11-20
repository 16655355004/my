# 项目概述（滚动性能优化）

## 背景
- 首页（`src/views/HomeView.vue`）在上下滚动时出现明显卡顿。
- 主要原因：多张超大 PNG 背景 + `background-attachment: fixed` 导致滚动时大面积重绘；叠加 `backdrop-filter`、大阴影、全页 `ScrollTrigger scrub` 等持续合成开销。

## 目标
- 在不显著改变视觉风格的前提下，实现顺滑滚动（60fps 目标，至少稳定 > 45fps）。
- 降低滚动期间的重绘与合成开销，优化图片资源大小与加载策略。

## 选型结论
- 主方案：CSS Sticky 视差（替代 `background-attachment: fixed`）。
- 配套：背景资源转 WebP/AVIF + 多尺寸/延迟加载；去除滚动中的 `backdrop-filter`；限制 `ScrollTrigger` 作用范围；事件监听 `passive` 与 rAF 节流。

## 把握度与验证点
- 方案把握度：90%。
- 需验证：
  - 不同浏览器（Chromium/Safari/Firefox）对 sticky 容器的表现。
  - Windows + 部分核显设备在大图与合成叠加下的帧率。

## 影响面
- 主要修改文件：
  - `src/views/HomeView.vue`
  - `src/components/Navbar.vue`
  - `src/App.vue`
  - `src/assets/main.css`（以及局部样式）
- 资源目录：`src/assets/`（多张大图片需转换/替换）。

## 交付物
- 优化后的代码与资源，保留视觉风格。
- 文档与可回滚方案说明。
