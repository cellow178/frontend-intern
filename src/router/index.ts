import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'
import DashboardMenu from '@/components/layout/DashboardMenu.vue'

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
      component: DashboardMenu,
      meta: { requiresAuth: true, hasLayout: false },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardHomeView.vue'),
          meta: { breadcrumb: [] },
        },
        {
          path: 'banner',
          name: 'dashboard-banner',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Banner'] },
        },
        {
          path: 'profil-sekolah',
          name: 'dashboard-profil',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Profil Sekolah'] },
        },
        {
          path: 'visi-misi',
          name: 'dashboard-visi-misi',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Visi Misi'] },
        },
        {
          path: 'video-profile',
          name: 'dashboard-video-profile',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Video Profile'] },
        },
        {
          path: 'jurusan',
          name: 'dashboard-jurusan',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Jurusan'] },
        },
        {
          path: 'event',
          name: 'dashboard-event',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Event'] },
        },
        {
          path: 'berita',
          name: 'dashboard-berita',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Berita'] },
        },
        {
          path: 'voting',
          name: 'dashboard-voting',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Voting'] },
        },
        {
          path: 'kritik-saran',
          name: 'dashboard-kritik-saran',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Kritik & Saran'] },
        },
        {
          path: 'footer',
          name: 'dashboard-footer',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Footer'] },
        },
        {
          path: 'master-data',
          name: 'dashboard-master-data',
          component: () => import('@/views/dashboard/PlaceholderView.vue'),
          meta: { breadcrumb: ['Master Data'] },
        },
      ],
    },

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
