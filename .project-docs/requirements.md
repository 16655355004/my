# 需求与问题分析

## 当前问题
- 首页 `src/views/HomeView.vue` 上下滚动卡顿。
- 大图背景 + `background-attachment: fixed` 导致重绘开销大。
- 多处 `backdrop-filter`、大阴影、渐变在滚动中参与合成，增加 GPU 负载。
- `GSAP ScrollTrigger` 绑定全页（`trigger: "body"`）并 `scrub: true`，滚动每帧都在更新。
- 元素检查器 `src/components/ElementInspector.vue` 若开启，会在滚动中进行定位与动画更新。

## 业务目标
- 保持原有视觉风格与动效氛围。
- 滚动流畅度显著提升（目标 60fps，至少稳定 >45fps）。
- 首屏加载与滚动期间的内存占用、合成层数量合理。

## 非功能性要求
- 兼容现代浏览器（Chromium、Firefox、Safari）。
- 移动端滚动性能可接受（Android/低配机型不明显掉帧）。
- 改动易于回退；不引入复杂依赖。

## 约束
- 不改变网站的主基调、色彩与主要动效风格。
- 不涉及后端变更；仅前端静态资源与代码。
