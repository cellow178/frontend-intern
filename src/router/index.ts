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
          path: 'video-profil',
          name: 'dashboard-video-profil',
          component: () => import('@/views/dashboard/DashboardVideoProfileView.vue'),
          meta: { breadcrumb: ['Video Profil'] },
        },

        // --- Jurusan ---
        {
          path: 'jurusan',
          name: 'dashboard-jurusan',
          component: () => import('@/views/dashboard/DashboardMajorView.vue'),
          meta: { breadcrumb: ['Jurusan'] },
        },
        {
          path: 'jurusan/create',
          name: 'dashboard-jurusan-create',
          component: () => import('@/views/dashboard/form/MajorFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Tambah'] },
        },
        {
          path: 'jurusan/edit/:id',
          name: 'dashboard-jurusan-edit',
          component: () => import('@/views/dashboard/form/MajorFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Edit'] },
        },
        {
          path: 'jurusan/:id',
          name: 'dashboard-jurusan-detail',
          component: () => import('@/views/dashboard/detail/MajorDetailView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Detail'] },
        },

        // --- Form Kompetensi Keahlian ---
        {
          path: 'jurusan/:majorId/kompetensi/create',
          name: 'dashboard-kompetensi-jurusan-create',
          component: () => import('@/views/dashboard/form/MajorCompetencyFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Kompetensi', 'Tambah'] },
        },
        {
          path: 'jurusan/:majorId/kompetensi/edit/:id',
          name: 'dashboard-kompetensi-jurusan-edit',
          component: () => import('@/views/dashboard/form/MajorCompetencyFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Kompetensi', 'Edit'] },
        },

        // --- Form Galeri Jurusan ---
        {
          path: 'jurusan/:majorId/galeri/create',
          name: 'dashboard-major-gallery-create',
          component: () => import('@/views/dashboard/form/MajorGalleryFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Galeri', 'Tambah'] },
        },
        {
          path: 'jurusan/:majorId/galeri/edit/:id',
          name: 'dashboard-major-gallery-edit',
          component: () => import('@/views/dashboard/form/MajorGalleryFormView.vue'),
          meta: { breadcrumb: ['Jurusan', 'Galeri', 'Edit'] },
        },

        {
          path: 'event',
          name: 'dashboard-event',
          component: () => import('@/views/dashboard/DashboardEventView.vue'),
          meta: { breadcrumb: ['Event'] },
        },
        {
          path: 'event/:id',
          name: 'dashboard-event-detail',
          component: () => import('@/views/dashboard/detail/EventDetailView.vue'),
          meta: { breadcrumb: ['Event', 'Detail'] },
        },
        {
          path: 'event/create',
          name: 'dashboard-event-create',
          component: () => import('@/views/dashboard/form/EventFormView.vue'),
          meta: { breadcrumb: ['Event', 'Tambah'] },
        },
        {
          path: 'event/edit/:id',
          name: 'dashboard-event-edit',
          component: () => import('@/views/dashboard/form/EventFormView.vue'),
          meta: { breadcrumb: ['Event', 'Edit'] },
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
          path: 'daftar-kategori',
          name: 'dashboard-daftar-kategori',
          component: () => import('@/views/dashboard/DashboardDaftarKategoriView.vue'),
          meta: { breadcrumb: ['Daftar Kategori'] },
        },
        {
          path: 'daftar-kategori/kategori-berita/:id',
          name: 'dashboard-kategori-berita-detail',
          component: () => import('@/views/dashboard/detail/NewsCategoryDetailView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Detail'] },
        },
        {
          path: 'daftar-kategori/kategori-berita/create',
          name: 'dashboard-kategori-berita-create',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Tambah'] },
        },
        {
          path: 'daftar-kategori/kategori-berita/edit/:id',
          name: 'dashboard-kategori-berita-edit',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Edit'] },
        },
        {
          path: 'daftar-kategori/kategori-kritik-saran/:id',
          name: 'dashboard-kategori-kritik-saran-detail',
          component: () => import('@/views/dashboard/detail/FeedbackCategoryDetailView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Detail'] },
        },
        {
          path: 'daftar-kategori/kategori-kritik-saran/create',
          name: 'dashboard-kategori-kritik-saran-create',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Tambah'] },
        },
        {
          path: 'daftar-kategori/kategori-kritik-saran/edit/:id',
          name: 'dashboard-kategori-kritik-saran-edit',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: { breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Edit'] },
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
