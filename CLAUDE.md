# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Development Commands

### Core Development
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build production version with type checking
- `npm run build-only` - Build without type checking
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Code Quality
- `npm run lint` - Run all linters (ESLint + oxlint)
- `npm run lint:eslint` - Run ESLint only
- `npm run lint:oxlint` - Run oxlint only

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS + CSS Variables
- **Animation**: GSAP (ScrollTrigger, TextPlugin, SplitText)
- **Backend**: Cloudflare Workers + KV Storage
- **Routing**: Vue Router 4

### Key Directories
- `src/components/` - Reusable Vue components
- `src/views/` - Page-level Vue components
- `src/composables/` - Composition API utilities
- `src/services/` - API and business logic services
- `src/router/` - Vue Router configuration
- `src/assets/` - Static assets and global styles

### Core Services
- `bookmarkService.ts` - Cloudflare KV bookmark management
- `statisticsService.ts` - Website analytics and visitor tracking
- `emailService.ts` - Email functionality (recently added)
- `tutorialService.ts` - Tutorial content management

### Important Configuration Files
- `vite.config.ts` - Vite build configuration with Cloudflare proxy
- `wrangler.toml` - Cloudflare Workers deployment configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.ts` - ESLint configuration

## 🎯 Development Patterns

### Vue 3 Composition API
All components use Composition API with `<script setup>` syntax. State management is handled via reactive refs and composables.

### TypeScript Strictness
Project uses strict TypeScript mode. All new code should include proper type annotations.

### CSS Architecture
- CSS Variables for theming (`--primary-color`, `--accent-color`, etc.)
- SCSS for component styling
- Responsive design with mobile-first approach

### Animation Patterns
- GSAP for complex animations
- CSS transitions for simple effects
- Hardware acceleration optimized

## 🔧 Cloudflare Integration

### KV Storage
Bookmarks are stored in Cloudflare KV. Development uses local proxy to production API.

### Worker Deployment
- Build output: `dist` directory
- Configuration: `wrangler.toml`
- API proxy configured in `vite.config.ts`

## 📱 Responsive Design
Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

## 🚨 Common Issues & Solutions

### Module Loading Errors
Ensure `public/_headers` file exists with correct MIME types for Cloudflare Pages deployment.

### Type Errors
Run `npm run type-check` to identify TypeScript issues before building.

### Linting Issues
Use `npm run lint` to automatically fix formatting and code style issues.

### Cloudflare KV Access
Development mode proxies API calls to production. For local KV testing, set up local Cloudflare Workers dev environment.