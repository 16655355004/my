<script setup lang="ts">
import { RouterLink } from "vue-router";

const toolLinks = [
  { label: "图片", to: "/image" },
  { label: "生图", to: "/generate-image" },
  { label: "书签", to: "/bookmarks" },
  { label: "短链", to: "/links" },
  { label: "教程", to: "/tutorial" },
  { label: "密钥", to: "/apikeys" },
  { label: "访问", to: "/visits" },
  { label: "后台", to: "/admin" },
];
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <span class="section-kicker">抽屉</span>
      <nav class="footer-links" aria-label="工具入口">
        <RouterLink v-for="link in toolLinks" :key="link.label" class="footer-link" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </nav>
      <p class="footer-sign">—— 空空 · JisooLove</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: 1;
  padding: 44px 0 calc(112px + env(safe-area-inset-bottom));
}

.site-footer .container {
  padding-top: 26px;
  border-top: 1px dashed var(--line-strong);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 16px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px dashed var(--line);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.88rem;
  transition: color var(--transition), border-color var(--transition), background var(--transition);
}

.footer-link:hover,
.footer-link.router-link-active {
  color: var(--text);
  border-color: rgba(242, 160, 181, 0.55);
  background: rgba(242, 160, 181, 0.08);
}

.footer-sign {
  margin-top: 22px;
  color: var(--text-soft);
  font-size: 0.82rem;
  text-align: right;
}
</style>
