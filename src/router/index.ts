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
      path: '/playground',
      name: 'playground',
      component: () => import('../views/PlaygroundView.vue')
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


  ]
})

// 页面转场动画触发
router.beforeEach((to, from, next) => {
  // 如果不是首次加载页面，触发页面转场动画
  if (from.name) {
    document.dispatchEvent(new Event('page-transition'))
    // 给动画一些时间执行
    setTimeout(() => {
      next()
    }, 500)
  } else {
    next()
  }
})

export default router
