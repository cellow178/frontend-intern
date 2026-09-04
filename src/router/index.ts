import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { transparentNavbar: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { requiresAuth: false, hasLayout: false },
    },
    {
      path: '/jurusan/:slug',
      name: 'jurusan-detail',
      component: () => import('../views/MajorDetailView.vue'),
    },
    {
      path: '/event',
      name: 'event',
      component: () => import('../views/EventView.vue'),
    },
    {
      path: '/event/:slug',
      name: 'event-detail',
      component: () => import('../views/EventDetailView.vue'),
    },
    {
      path: '/berita',
      name: 'berita',
      component: () => import('../views/NewsView.vue'),
    },
    {
      path: '/berita/:slug',
      name: 'berita-detail',
      component: () => import('../views/NewsDetailView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true, hasLayout: false },
    },
    // ----------------------------------------------------
    // Tambahkan Rute 404 di Paling Bawah
    // ----------------------------------------------------
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
