import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routeOrder = ["home", "image", "bookmarks", "messages", "tutorial", "apikeys", "admin"];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/bookmarks",
      name: "bookmarks",
      component: () => import("../views/BookmarksView.vue"),
    },
    {
      path: "/image",
      name: "image",
      component: () => import("../views/ImageView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
    },
    {
      path: "/messages",
      name: "messages",
      component: () => import("../views/MessagesView.vue"),
    },
    {
      path: "/tutorial",
      name: "tutorial",
      component: () => import("../views/TutorialView.vue"),
    },
    {
      path: "/apikeys",
      name: "apikeys",
      component: () => import("../views/ApiKeysView.vue"),
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (from.name && to.name) {
    const fromIndex = routeOrder.indexOf(from.name as string);
    const toIndex = routeOrder.indexOf(to.name as string);
    const direction = toIndex > fromIndex ? "forward" : "backward";
    document.documentElement.setAttribute("data-transition-direction", direction);
    document.dispatchEvent(new CustomEvent("page-transition-start", {
      detail: { from: from.name, to: to.name, direction },
    }));
  }

  next();
});

router.afterEach((to, from) => {
  document.dispatchEvent(new CustomEvent("page-transition-end", {
    detail: { from: from?.name, to: to.name },
  }));
});

export default router;
