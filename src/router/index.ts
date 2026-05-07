import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: () => import('../views/BookmarksView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue')
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../views/MessagesView.vue')
    },
    {
      path: '/tutorial',
      name: 'tutorial',
      component: () => import('../views/TutorialView.vue')
    },
    {
      path: '/apikeys',
      name: 'apikeys',
      component: () => import('../views/ApiKeysView.vue')
    },
  ]
})

// 页面转场动画 - 使用更现代的方式
router.beforeEach((to, from, next) => {
  // 为页面添加转场方向信息
  if (from.name && to.name) {
    // 根据路由顺序确定转场方向
    const routeOrder = ['home', 'bookmarks', 'messages', 'tutorial', 'apikeys', 'admin'];
    const fromIndex = routeOrder.indexOf(from.name as string);
    const toIndex = routeOrder.indexOf(to.name as string);

    // 设置转场方向
    const direction = toIndex > fromIndex ? 'forward' : 'backward';
    document.documentElement.setAttribute('data-transition-direction', direction);

    // 触发转场开始事件
    document.dispatchEvent(new CustomEvent('page-transition-start', {
      detail: { from: from.name, to: to.name, direction }
    }));
  }

  next();
});

// 转场完成后的处理
router.afterEach((to, from) => {
  // 转场完成事件
  document.dispatchEvent(new CustomEvent('page-transition-end', {
    detail: { from: from?.name, to: to.name }
  }));
});

export default router
