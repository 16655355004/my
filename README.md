# JisooLove

<p align="center">
  <strong>A personal Pages site built with Vue 3, Vite and TypeScript.</strong>
</p>

<p align="center">
  <a href="#中文">中文</a> ·
  <a href="#english">English</a> ·
  <a href="#한국어">한국어</a> ·
  <a href="#日本語">日本語</a>
</p>

---

## 中文

### 项目简介

JisooLove 是一个部署在 Pages 上的个人主页与工具集合，使用 Vue 3、TypeScript 和 Vite 构建。项目包含图片展示、收藏夹、留言、教程、API 密钥管理、短链接管理以及站点访问统计等功能。

### 功能特性

- **个人主页**：展示项目、入口和基础信息。
- **图片页面**：用于图片展示与相关内容承载。
- **收藏夹**：管理和展示常用链接。
- **留言页面**：提供留言展示与交互入口。
- **教程页面**：整理教程、说明和使用资料。
- **API 密钥管理**：通过 KV 保存和管理服务密钥信息。
- **短链接中心**：创建 `/s/:code` 短链接，并查看点击、今日访问和独立访客统计。
- **站点统计**：记录总访问、今日访问、响应时间和运行时间。
- **Pages Functions**：提供后端 API 和 KV 数据读写能力。

### 技术栈

| 类型 | 技术 |
| --- | --- |
| 前端框架 | Vue 3 |
| 开发语言 | TypeScript |
| 构建工具 | Vite 6 |
| 路由 | Vue Router 4 |
| 动画 | GSAP |
| 样式 | CSS / SCSS |
| 部署 | Pages |
| 后端接口 | Pages Functions |
| 存储 | KV |

### 目录结构

```text
.
├── functions/                 # Pages Functions
│   ├── _shared/               # Functions 共享工具
│   ├── api/                   # API 路由
│   │   ├── apikeys/           # API 密钥管理
│   │   ├── shortlinks/        # 短链接管理
│   │   └── statistics/        # 站点统计
│   └── s/                     # 短链接跳转入口
├── public/                    # 静态资源
├── src/
│   ├── assets/                # 全局样式和资源
│   ├── components/            # 公共组件
│   ├── composables/           # 组合式逻辑
│   ├── router/                # 路由配置
│   ├── services/              # 前端 API 服务
│   └── views/                 # 页面视图
├── cf-pages.cjs               # Pages 构建辅助脚本
├── package.json               # 项目脚本与依赖
├── vite.config.ts             # Vite 配置
└── wrangler.toml              # 部署配置
```

### 本地开发

```bash
npm install
npm run dev
```

### 构建

```bash
npm run build
```

### Pages 本地预览

```bash
npm run cf-preview
```

### 部署说明

项目已配置 Pages，可通过 GitHub 集成自动部署。推送到 `main` 分支后，Pages 会自动构建并发布。

建议在 Pages 环境变量中配置：

| 变量 | 说明 |
| --- | --- |
| `ADMIN_PASSWORD` | 管理页面和受保护 API 的管理员密码 |
| `STATS_SALT` | 访问统计中访客哈希的盐值 |
| `SITE_STARTED_AT` | 站点运行时间起始时间 |

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:cf` | Pages 构建命令 |
| `npm run preview` | 预览构建结果 |
| `npm run cf-preview` | 本地预览 Pages 与 Functions |
| `npm run lint` | 运行代码检查 |

---

## English

### Overview

JisooLove is a personal homepage and toolbox deployed on Pages. It is built with Vue 3, TypeScript and Vite, and includes image pages, bookmarks, messages, tutorials, API key management, short link management and site analytics.

### Features

- **Personal homepage**: presents projects, links and basic information.
- **Image page**: displays images and related content.
- **Bookmarks**: manages frequently used links.
- **Messages**: provides a message display and interaction area.
- **Tutorials**: organizes tutorials, notes and usage guides.
- **API key management**: stores and manages service key records with KV.
- **Short link center**: creates `/s/:code` short links and tracks clicks, today's visits and unique visitors.
- **Site analytics**: records total visits, today's visits, response time and uptime.
- **Pages Functions**: provides backend APIs and KV access.

### Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | Vue 3 |
| Language | TypeScript |
| Build Tool | Vite 6 |
| Router | Vue Router 4 |
| Animation | GSAP |
| Styling | CSS / SCSS |
| Hosting | Pages |
| Backend APIs | Pages Functions |
| Storage | KV |

### Project Structure

```text
.
├── functions/                 # Pages Functions
│   ├── _shared/               # Shared utilities for Functions
│   ├── api/                   # API routes
│   │   ├── apikeys/           # API key management
│   │   ├── shortlinks/        # Short link management
│   │   └── statistics/        # Site analytics
│   └── s/                     # Short link redirect routes
├── public/                    # Static assets
├── src/
│   ├── assets/                # Global styles and assets
│   ├── components/            # Shared components
│   ├── composables/           # Composables
│   ├── router/                # Router configuration
│   ├── services/              # Frontend API services
│   └── views/                 # Page views
├── cf-pages.cjs               # Pages build helper
├── package.json               # Scripts and dependencies
├── vite.config.ts             # Vite configuration
└── wrangler.toml              # deployment configuration
```

### Local Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Pages Preview

```bash
npm run cf-preview
```

### Deployment

The project is configured for Pages and can be deployed automatically through the GitHub integration. Pushing to the `main` branch triggers a Pages build and production deployment.

Recommended Pages environment variables:

| Variable | Description |
| --- | --- |
| `ADMIN_PASSWORD` | Admin password for protected pages and APIs |
| `STATS_SALT` | Salt used for visitor hashing in analytics |
| `SITE_STARTED_AT` | Start time used for uptime calculation |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run build:cf` | Build command for Pages |
| `npm run preview` | Preview the production build |
| `npm run cf-preview` | Preview Pages and Functions locally |
| `npm run lint` | Run lint checks |

---

## 한국어

### 소개

JisooLove는 Pages에 배포되는 개인 홈페이지이자 도구 모음입니다. Vue 3, TypeScript, Vite로 구축되었으며 이미지 페이지, 북마크, 메시지, 튜토리얼, API 키 관리, 짧은 링크 관리, 사이트 통계 기능을 포함합니다.

### 주요 기능

- **개인 홈페이지**: 프로젝트, 링크, 기본 정보를 보여줍니다.
- **이미지 페이지**: 이미지와 관련 콘텐츠를 표시합니다.
- **북마크**: 자주 사용하는 링크를 관리합니다.
- **메시지 페이지**: 메시지 표시 및 상호작용 영역을 제공합니다.
- **튜토리얼 페이지**: 튜토리얼, 메모, 사용 가이드를 정리합니다.
- **API 키 관리**: KV를 사용해 서비스 키 정보를 저장하고 관리합니다.
- **짧은 링크 센터**: `/s/:code` 형식의 짧은 링크를 만들고 클릭 수, 오늘 방문 수, 고유 방문자를 확인합니다.
- **사이트 통계**: 전체 방문 수, 오늘 방문 수, 응답 시간, 운영 시간을 기록합니다.
- **Pages Functions**: 백엔드 API와 KV 데이터 접근을 제공합니다.

### 기술 스택

| 구분 | 기술 |
| --- | --- |
| 프론트엔드 | Vue 3 |
| 언어 | TypeScript |
| 빌드 도구 | Vite 6 |
| 라우터 | Vue Router 4 |
| 애니메이션 | GSAP |
| 스타일 | CSS / SCSS |
| 배포 | Pages |
| 백엔드 API | Pages Functions |
| 저장소 | KV |

### 프로젝트 구조

```text
.
├── functions/                 # Pages Functions
│   ├── _shared/               # Functions 공용 유틸리티
│   ├── api/                   # API 라우트
│   │   ├── apikeys/           # API 키 관리
│   │   ├── shortlinks/        # 짧은 링크 관리
│   │   └── statistics/        # 사이트 통계
│   └── s/                     # 짧은 링크 리다이렉트 라우트
├── public/                    # 정적 리소스
├── src/
│   ├── assets/                # 전역 스타일과 리소스
│   ├── components/            # 공용 컴포넌트
│   ├── composables/           # 컴포저블 로직
│   ├── router/                # 라우터 설정
│   ├── services/              # 프론트엔드 API 서비스
│   └── views/                 # 페이지 뷰
├── cf-pages.cjs               # Pages 빌드 보조 스크립트
├── package.json               # 스크립트와 의존성
├── vite.config.ts             # Vite 설정
└── wrangler.toml              # 배포 설정
```

### 로컬 개발

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

### Pages 로컬 미리보기

```bash
npm run cf-preview
```

### 배포

이 프로젝트는 Pages에 맞게 설정되어 있으며 GitHub 연동을 통해 자동 배포할 수 있습니다. `main` 브랜치에 push하면 Pages가 자동으로 빌드하고 배포합니다.

권장 Pages 환경 변수:

| 변수 | 설명 |
| --- | --- |
| `ADMIN_PASSWORD` | 보호된 페이지와 API에 사용하는 관리자 비밀번호 |
| `STATS_SALT` | 방문자 해시에 사용하는 salt 값 |
| `SITE_STARTED_AT` | 운영 시간 계산에 사용하는 시작 시간 |

### 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm run build:cf` | Pages용 빌드 명령 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run cf-preview` | Pages와 Functions를 로컬에서 미리보기 |
| `npm run lint` | 코드 검사 실행 |

---

## 日本語

### 概要

JisooLove は Pages にデプロイされる個人ホームページ兼ツール集です。Vue 3、TypeScript、Vite で構築されており、画像ページ、ブックマーク、メッセージ、チュートリアル、API キー管理、短縮リンク管理、サイト統計機能を含みます。

### 主な機能

- **個人ホームページ**：プロジェクト、リンク、基本情報を表示します。
- **画像ページ**：画像や関連コンテンツを表示します。
- **ブックマーク**：よく使うリンクを管理します。
- **メッセージページ**：メッセージ表示とインタラクション領域を提供します。
- **チュートリアルページ**：チュートリアル、メモ、利用ガイドを整理します。
- **API キー管理**：KV を使ってサービスキー情報を保存・管理します。
- **短縮リンクセンター**：`/s/:code` 形式の短縮リンクを作成し、クリック数、本日のアクセス数、ユニーク訪問者を確認できます。
- **サイト統計**：総アクセス数、本日のアクセス数、レスポンスタイム、稼働時間を記録します。
- **Pages Functions**：バックエンド API と KV データアクセスを提供します。

### 技術スタック

| 区分 | 技術 |
| --- | --- |
| フロントエンド | Vue 3 |
| 言語 | TypeScript |
| ビルドツール | Vite 6 |
| ルーター | Vue Router 4 |
| アニメーション | GSAP |
| スタイル | CSS / SCSS |
| ホスティング | Pages |
| バックエンド API | Pages Functions |
| ストレージ | KV |

### プロジェクト構成

```text
.
├── functions/                 # Pages Functions
│   ├── _shared/               # Functions 共通ユーティリティ
│   ├── api/                   # API ルート
│   │   ├── apikeys/           # API キー管理
│   │   ├── shortlinks/        # 短縮リンク管理
│   │   └── statistics/        # サイト統計
│   └── s/                     # 短縮リンクのリダイレクトルート
├── public/                    # 静的アセット
├── src/
│   ├── assets/                # グローバルスタイルとリソース
│   ├── components/            # 共通コンポーネント
│   ├── composables/           # Composable ロジック
│   ├── router/                # ルーター設定
│   ├── services/              # フロントエンド API サービス
│   └── views/                 # ページビュー
├── cf-pages.cjs               # Pages ビルド補助スクリプト
├── package.json               # スクリプトと依存関係
├── vite.config.ts             # Vite 設定
└── wrangler.toml              # デプロイ設定
```

### ローカル開発

```bash
npm install
npm run dev
```

### ビルド

```bash
npm run build
```

### Pages ローカルプレビュー

```bash
npm run cf-preview
```

### デプロイ

このプロジェクトは Pages 用に設定されており、GitHub 連携により自動デプロイできます。`main` ブランチに push すると、Pages が自動的にビルドして本番環境へデプロイします。

推奨 Pages 環境変数：

| 変数 | 説明 |
| --- | --- |
| `ADMIN_PASSWORD` | 保護されたページと API 用の管理者パスワード |
| `STATS_SALT` | 訪問者ハッシュに使用する salt |
| `SITE_STARTED_AT` | 稼働時間計算に使用する開始時刻 |

### コマンド

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | ローカル開発サーバーを起動 |
| `npm run build` | 本番用ビルドを作成 |
| `npm run build:cf` | Pages 用のビルドコマンド |
| `npm run preview` | ビルド結果をプレビュー |
| `npm run cf-preview` | Pages と Functions をローカルでプレビュー |
| `npm run lint` | コードチェックを実行 |

---

## License

MIT
