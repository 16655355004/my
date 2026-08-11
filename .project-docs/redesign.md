# 全站重构：「空空的深夜手帐」

## 背景
- 原首页是标准落地页模板（Hero + 编号原则卡 + 滚动叙事），文案自我描述，识别度低。
- 目标：让站点有"空空自己的房间"的记忆点，真实内容当主角。

## 概念
把首页做成一页正在写的深夜日记：

1. **版式签名**：衬线中文（Noto Serif SC）+ 竖排文字 kicker（`writing-mode: vertical-rl`），移动端降级横排。
2. **时间感知**：按访问时刻切换问候语（深夜 / 清晨 / 白天 / 傍晚），日记式日期抬头。
3. **活数据织进文案**：今日访客数以叙述句呈现（"你是今天路过的第 N 个人"），统计区做成手帐边注而非仪表盘。
4. **配色**：深夜蓝黑底（#0a0c18）+ 月白文字 + 樱粉（--accent）/ 星紫（--accent-2）/ 暖星黄（--accent-3）。
5. **删除**：原则卡、Flow 叙事区、kinetic 走马灯、proof pills、signal 卡等填充内容。

## 范围
- 重写：`main.css`（设计系统）、`HomeView.vue`、`ProjectLinks.vue`、`WebsiteStatistics.vue`、`Navbar.vue`、`App.vue` 背景。
- 换皮：工具页通过共享类（`page-shell` / `page-hero` / `panel` / `btn`）自动继承新设计系统，仅替换各页写死的旧配色为 CSS 变量。
- 不动：`functions/` 后端、`src/services/`、路由结构、所有功能逻辑。

## 验收
- `npm run lint` 与 `npm run build` 通过。
- 所有页面沿用新设计令牌，无残留旧琥珀色硬编码。
