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
          component: () => import('@/views/dashboard/DashboardBannerView.vue'),
          meta: { breadcrumb: ['Banner'] },
        },
        {
          path: 'banner/:id',
          name: 'dashboard-banner-detail',
          component: () => import('@/views/dashboard/detail/BannerDetailView.vue'),
          meta: { breadcrumb: ['Banner', 'Detail'] },
        },
        {
          path: 'banner/create',
          name: 'dashboard-banner-create',
          component: () => import('@/views/dashboard/form/BannerFormView.vue'),
          meta: { breadcrumb: ['Banner', 'Tambah'] },
        },
        {
          path: 'banner/edit/:id',
          name: 'dashboard-banner-edit',
          component: () => import('@/views/dashboard/form/BannerFormView.vue'),
          meta: { breadcrumb: ['Banner', 'Edit'] },
        },
        {
          path: 'profil-sekolah',
          name: 'dashboard-profil',
          component: () => import('@/views/dashboard/DashboardProfileView.vue'),
          meta: { breadcrumb: ['Profil Sekolah'] },
        },
        {
          path: 'visi-misi',
          name: 'dashboard-visi-misi',
          component: () => import('@/views/dashboard/DashboardVisiMisiView.vue'),
          meta: { breadcrumb: ['Visi Misi'] },
        },
        {
          path: 'visi-misi/misi/:id',
          name: 'dashboard-misi-detail',
          component: () => import('@/views/dashboard/detail/MissionDetailView.vue'),
          meta: { breadcrumb: ['Visi Misi', 'Detail Misi'] },
        },
        {
          path: 'visi-misi/misi/create',
          name: 'dashboard-misi-create',
          component: () => import('@/views/dashboard/form/MissionFormView.vue'),
          meta: { breadcrumb: ['Visi Misi', 'Tambah Misi'] },
        },
        {
          path: 'visi-misi/misi/edit/:id',
          name: 'dashboard-misi-edit',
          component: () => import('@/views/dashboard/form/MissionFormView.vue'),
          meta: { breadcrumb: ['Visi Misi', 'Edit Misi'] },
        },
        {
          path: 'video-profile',
          name: 'dashboard-video-profile',
          component: () => import('@/views/dashboard/DashboardVideoProfileView.vue'),
          meta: { breadcrumb: ['Video Profil'] },
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
          component: () => import('@/views/dashboard/DashboardNewsView.vue'),
          meta: { breadcrumb: ['Berita'] },
        },
        {
          path: 'berita/:id',
          name: 'dashboard-berita-detail',
          component: () => import('@/views/dashboard/detail/NewsDetailView.vue'),
          meta: { breadcrumb: ['Berita', 'Detail'] },
        },
        {
          path: 'berita/create',
          name: 'dashboard-berita-create',
          component: () => import('@/views/dashboard/form/NewsFormView.vue'),
          meta: { breadcrumb: ['Berita', 'Tambah'] },
        },
        {
          path: 'berita/edit/:id',
          name: 'dashboard-berita-edit',
          component: () => import('@/views/dashboard/form/NewsFormView.vue'),
          meta: { breadcrumb: ['Berita', 'Edit'] },
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
          component: () => import('@/views/dashboard/DashboardFeedbackView.vue'),
          meta: { breadcrumb: ['Kritik & Saran'] },
        },
        {
          path: 'kritik-saran/:id',
          name: 'dashboard-kritik-saran-detail',
          component: () => import('@/views/dashboard/detail/FeedbackDetailView.vue'),
          meta: { breadcrumb: ['Kritik & Saran', 'Detail'] },
        },
        {
          path: 'footer',
          name: 'dashboard-footer',
          component: () => import('@/views/dashboard/DashboardFooterView.vue'),
          meta: { breadcrumb: ['Footer'] },
        },
        {
          path: 'master-data',
          name: 'dashboard-master-data',
          component: () => import('@/views/dashboard/DashboardMasterDataView.vue'),
          meta: { breadcrumb: ['Master Data'] },
        },
        {
          path: 'master-data/kategori-berita/:id',
          name: 'dashboard-kategori-berita-detail',
          component: () => import('@/views/dashboard/detail/NewsCategoryDetailView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Berita', 'Detail'] },
        },
        {
          path: 'master-data/kategori-berita/create',
          name: 'dashboard-kategori-berita-create',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Berita', 'Tambah'] },
        },
        {
          path: 'master-data/kategori-berita/edit/:id',
          name: 'dashboard-kategori-berita-edit',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Berita', 'Edit'] },
        },
        {
          path: 'master-data/kategori-kritik-saran/:id',
          name: 'dashboard-kategori-kritik-saran-detail',
          component: () => import('@/views/dashboard/detail/FeedbackCategoryDetailView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Kritik & Saran', 'Detail'] },
        },
        {
          path: 'master-data/kategori-kritik-saran/create',
          name: 'dashboard-kategori-kritik-saran-create',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Kritik & Saran', 'Tambah'] },
        },
        {
          path: 'master-data/kategori-kritik-saran/edit/:id',
          name: 'dashboard-kategori-kritik-saran-edit',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: { breadcrumb: ['Master Data', 'Kategori Kritik & Saran', 'Edit'] },
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
