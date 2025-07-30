# 🚀 空空的个人作品集网站

一个现代化的个人作品集网站，使用 Vue 3 + TypeScript + GSAP 构建，具有精美的动画效果和丰富的交互体验。

## ✨ 主要特性

### 🎨 精美设计

- **现代化深色主题** - 优雅的深色配色方案
- **响应式布局** - 完美适配桌面端和移动端
- **流畅动画** - 使用 GSAP 打造丝滑的动画效果
- **主题切换** - 支持深色/浅色/自动主题切换

### 📱 核心页面

- **首页** - 个人介绍、技能展示、统计数据
- **动画实验室** - 在线 GSAP 代码编辑器和预览
- **技能专长** - 详细的技能树和项目经验展示
- **技术博客** - 技术文章分享和学习心得
- **网站收藏** - 精选实用工具和网站推荐，支持动态管理
- **管理后台** - 无需重新部署即可添加、编辑、删除书签

### 🔧 实用功能

- **全站搜索** - 快速搜索页面、技能、文章内容 (Ctrl+K)
- **元素检查器** - 实时查看页面元素的样式和属性
- **动态书签管理** - 基于 Cloudflare KV 的书签存储，支持在线管理
- **性能优化** - 懒加载、防抖节流、硬件加速
- **无障碍访问** - 键盘导航、屏幕阅读器支持

### 🛠️ 技术栈

- **前端框架**: Vue 3 (组合式 API)
- **类型系统**: TypeScript
- **动画库**: GSAP (ScrollTrigger, TextPlugin, SplitText)
- **样式**: SCSS + CSS Variables
- **构建工具**: Vite
- **后端服务**: Cloudflare Workers + KV 存储
- **代码规范**: ESLint + Prettier

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

项目将在 `http://localhost:5173` 启动

### 🔧 Cloudflare KV 设置（可选）

如果你想使用动态书签管理功能，请参考 [Cloudflare 设置指南](./CLOUDFLARE_SETUP.md)。

不设置的话，网站会使用默认的静态书签数据。

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 📁 项目结构

```
src/
├── components/          # 组件
│   ├── Navbar.vue      # 导航栏
│   ├── Loader.vue      # 加载动画
│   ├── ThemeToggle.vue # 主题切换
│   ├── GlobalSearch.vue # 全站搜索
│   └── ElementInspector.vue # 元素检查器
├── views/              # 页面
│   ├── HomeView.vue    # 首页
│   ├── PlaygroundView.vue # 动画实验室
│   ├── SkillsDetailView.vue # 技能详情
│   ├── BlogView.vue    # 技术博客
│   └── BookmarksView.vue # 网站收藏
├── composables/        # 组合式函数
│   ├── useTheme.ts     # 主题管理
│   └── useIntersectionObserver.ts # 交叉观察器
├── utils/              # 工具函数
│   └── performance.ts  # 性能优化工具
├── router/             # 路由配置
└── assets/             # 静态资源
```

## 🎯 核心功能详解

### 动画实验室

- 在线 GSAP 代码编辑器
- 实时预览动画效果
- 预设动画模板
- 代码语法高亮

### 全站搜索 (Ctrl+K)

- 快速搜索所有内容
- 键盘导航支持
- 智能结果分类
- 实时搜索建议

### 主题系统

- 深色/浅色主题切换
- 自动跟随系统主题
- 平滑过渡动画
- 本地存储偏好设置

### 元素检查器

- 实时查看元素样式
- 详细的 CSS 属性信息
- 盒模型可视化
- 响应式信息展示

### 性能优化

- 图片懒加载
- 动画硬件加速
- 防抖节流处理
- 内存使用监控

## 🎨 自定义配置

### 主题颜色

在 `src/assets/main.css` 中修改 CSS 变量：

```css
:root {
  --primary-color: #00d4ff;
  --accent-color: #ff3366;
  --success-color: #00ff88;
  --purple-accent: #8b5cf6;
}
```

### 添加新页面

1. 在 `src/views/` 创建新的 Vue 组件
2. 在 `src/router/index.ts` 添加路由配置
3. 在 `src/components/Navbar.vue` 添加导航链接

### 添加新的搜索内容

在 `src/components/GlobalSearch.vue` 的 `searchData` 数组中添加新项目。

## 📱 响应式设计

网站完全响应式，支持以下断点：

- **桌面端**: > 768px
- **平板端**: 768px - 1024px
- **移动端**: < 768px

## 🔧 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🚀 部署到 Cloudflare Pages

### 方法 1: GitHub 集成部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Pages 控制台中连接 GitHub 仓库
3. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **Node.js 版本**: `18` 或更高

### 方法 2: 直接上传

1. 运行构建命令：
   ```bash
   npm run build
   ```
2. 将 `dist` 目录中的所有文件上传到 Cloudflare Pages

### 重要配置文件

- `public/_headers`: 配置正确的 MIME 类型，解决模块加载问题
- `public/_redirects`: 配置 SPA 路由重定向
- `vite.config.ts`: Vite 构建配置，优化了 Cloudflare Pages 部署

### 故障排除

如果遇到 "Failed to load module script" 错误：

1. 确保 `public/_headers` 文件存在并正确配置
2. 检查构建输出的文件名是否与 HTML 中的引用匹配
3. 清理缓存后重新构建：
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   ```

## 📞 联系方式

- 作者：空空
- 项目地址：[GitHub Repository]

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
