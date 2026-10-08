import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'
import DashboardMenu from '@/components/layout/DashboardMenu.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    hasLayout?: boolean
    transparentNavbar?: boolean
    breadcrumb?: string[]
    permission?: string
  }
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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

    // =========================================================
    // DASHBOARD
    // =========================================================
    {
      path: '/dashboard',
      component: DashboardMenu,
      meta: {
        requiresAuth: true,
        hasLayout: false,
      },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardHomeView.vue'),
          meta: {
            breadcrumb: [],
          },
        },

        // =====================================================
        // BANNER
        // =====================================================
        {
          path: 'banner',
          name: 'dashboard-banner',
          component: () => import('@/views/dashboard/DashboardBannerView.vue'),
          meta: {
            breadcrumb: ['Banner'],
            permission: 'view-banners',
          },
        },
        {
          path: 'banner/:id',
          name: 'dashboard-banner-detail',
          component: () => import('@/views/dashboard/detail/BannerDetailView.vue'),
          meta: {
            breadcrumb: ['Banner', 'Detail'],
            permission: 'show-banners',
          },
        },
        {
          path: 'banner/create',
          name: 'dashboard-banner-create',
          component: () => import('@/views/dashboard/form/BannerFormView.vue'),
          meta: {
            breadcrumb: ['Banner', 'Tambah'],
            permission: 'create-banners',
          },
        },
        {
          path: 'banner/edit/:id',
          name: 'dashboard-banner-edit',
          component: () => import('@/views/dashboard/form/BannerFormView.vue'),
          meta: {
            breadcrumb: ['Banner', 'Edit'],
            permission: 'update-banners',
          },
        },

        // =====================================================
        // PROFIL SEKOLAH
        // =====================================================
        {
          path: 'profil-sekolah',
          name: 'dashboard-profil',
          component: () => import('@/views/dashboard/DashboardProfileView.vue'),
          meta: {
            breadcrumb: ['Profil Sekolah'],
            permission: 'show-global-config',
          },
        },

        // =====================================================
        // VISI & MISI
        // =====================================================
        {
          path: 'visi-misi',
          name: 'dashboard-visi-misi',
          component: () => import('@/views/dashboard/DashboardVisiMisiView.vue'),
          meta: {
            breadcrumb: ['Visi Misi'],
            permission: 'view-missions',
          },
        },
        {
          path: 'visi-misi/misi/:id',
          name: 'dashboard-misi-detail',
          component: () => import('@/views/dashboard/detail/MissionDetailView.vue'),
          meta: {
            breadcrumb: ['Visi Misi', 'Detail Misi'],
            permission: 'show-missions',
          },
        },
        {
          path: 'visi-misi/misi/create',
          name: 'dashboard-misi-create',
          component: () => import('@/views/dashboard/form/MissionFormView.vue'),
          meta: {
            breadcrumb: ['Visi Misi', 'Tambah Misi'],
            permission: 'create-missions',
          },
        },
        {
          path: 'visi-misi/misi/edit/:id',
          name: 'dashboard-misi-edit',
          component: () => import('@/views/dashboard/form/MissionFormView.vue'),
          meta: {
            breadcrumb: ['Visi Misi', 'Edit Misi'],
            permission: 'update-missions',
          },
        },

        // =====================================================
        // VIDEO & LOKASI
        // =====================================================
        {
          path: 'video-lokasi',
          name: 'dashboard-video-lokasi',
          component: () => import('@/views/dashboard/DashboardVideoLocationView.vue'),
          meta: {
            breadcrumb: ['Video & Lokasi'],
            permission: 'show-global-config',
          },
        },

        // =====================================================
        // JURUSAN
        // =====================================================
        {
          path: 'jurusan',
          name: 'dashboard-jurusan',
          component: () => import('@/views/dashboard/DashboardMajorView.vue'),
          meta: {
            breadcrumb: ['Jurusan'],
            permission: 'view-majors',
          },
        },
        {
          path: 'jurusan/create',
          name: 'dashboard-jurusan-create',
          component: () => import('@/views/dashboard/form/MajorFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Tambah'],
            permission: 'create-majors',
          },
        },
        {
          path: 'jurusan/edit/:id',
          name: 'dashboard-jurusan-edit',
          component: () => import('@/views/dashboard/form/MajorFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Edit'],
            permission: 'update-majors',
          },
        },
        {
          path: 'jurusan/:id',
          name: 'dashboard-jurusan-detail',
          component: () => import('@/views/dashboard/detail/MajorDetailView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Detail'],
            permission: 'show-majors',
          },
        },

        // =====================================================
        // KOMPETENSI KEAHLIAN
        // =====================================================
        {
          path: 'jurusan/:majorId/kompetensi/create',
          name: 'dashboard-kompetensi-jurusan-create',
          component: () => import('@/views/dashboard/form/MajorCompetencyFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Kompetensi', 'Tambah'],
            permission: 'create-major-competents',
          },
        },
        {
          path: 'jurusan/:majorId/kompetensi/edit/:id',
          name: 'dashboard-kompetensi-jurusan-edit',
          component: () => import('@/views/dashboard/form/MajorCompetencyFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Kompetensi', 'Edit'],
            permission: 'update-major-competents',
          },
        },

        // =====================================================
        // GALERI JURUSAN
        // =====================================================
        {
          path: 'jurusan/:majorId/galeri/create',
          name: 'dashboard-major-gallery-create',
          component: () => import('@/views/dashboard/form/MajorGalleryFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Galeri', 'Tambah'],
            permission: 'create-major-gallery',
          },
        },
        {
          path: 'jurusan/:majorId/galeri/edit/:id',
          name: 'dashboard-major-gallery-edit',
          component: () => import('@/views/dashboard/form/MajorGalleryFormView.vue'),
          meta: {
            breadcrumb: ['Jurusan', 'Galeri', 'Edit'],
            permission: 'update-major-gallery',
          },
        },

        // =====================================================
        // EVENT
        // =====================================================
        {
          path: 'event',
          name: 'dashboard-event',
          component: () => import('@/views/dashboard/DashboardEventView.vue'),
          meta: {
            breadcrumb: ['Event'],
            permission: 'view-events',
          },
        },
        {
          path: 'event/:id',
          name: 'dashboard-event-detail',
          component: () => import('@/views/dashboard/detail/EventDetailView.vue'),
          meta: {
            breadcrumb: ['Event', 'Detail'],
            permission: 'show-events',
          },
        },
        {
          path: 'event/create',
          name: 'dashboard-event-create',
          component: () => import('@/views/dashboard/form/EventFormView.vue'),
          meta: {
            breadcrumb: ['Event', 'Tambah'],
            permission: 'create-events',
          },
        },
        {
          path: 'event/edit/:id',
          name: 'dashboard-event-edit',
          component: () => import('@/views/dashboard/form/EventFormView.vue'),
          meta: {
            breadcrumb: ['Event', 'Edit'],
            permission: 'update-events',
          },
        },

        // =====================================================
        // BERITA
        // =====================================================
        {
          path: 'berita',
          name: 'dashboard-berita',
          component: () => import('@/views/dashboard/DashboardNewsView.vue'),
          meta: {
            breadcrumb: ['Berita'],
            permission: 'view-news',
          },
        },
        {
          path: 'berita/:id',
          name: 'dashboard-berita-detail',
          component: () => import('@/views/dashboard/detail/NewsDetailView.vue'),
          meta: {
            breadcrumb: ['Berita', 'Detail'],
            permission: 'show-news',
          },
        },
        {
          path: 'berita/create',
          name: 'dashboard-berita-create',
          component: () => import('@/views/dashboard/form/NewsFormView.vue'),
          meta: {
            breadcrumb: ['Berita', 'Tambah'],
            permission: 'create-news',
          },
        },
        {
          path: 'berita/edit/:id',
          name: 'dashboard-berita-edit',
          component: () => import('@/views/dashboard/form/NewsFormView.vue'),
          meta: {
            breadcrumb: ['Berita', 'Edit'],
            permission: 'update-news',
          },
        },

        // =====================================================
        // KRITIK & SARAN
        // =====================================================
        {
          path: 'kritik-saran',
          name: 'dashboard-kritik-saran',
          component: () => import('@/views/dashboard/DashboardFeedbackView.vue'),
          meta: {
            breadcrumb: ['Kritik & Saran'],
            permission: 'view-feedbacks',
          },
        },
        {
          path: 'kritik-saran/:id',
          name: 'dashboard-kritik-saran-detail',
          component: () => import('@/views/dashboard/detail/FeedbackDetailView.vue'),
          meta: {
            breadcrumb: ['Kritik & Saran', 'Detail'],
            permission: 'show-feedbacks',
          },
        },

        // =====================================================
        // FOOTER
        // =====================================================
        {
          path: 'footer',
          name: 'dashboard-footer',
          component: () => import('@/views/dashboard/DashboardFooterView.vue'),
          meta: {
            breadcrumb: ['Footer'],
            permission: 'show-global-config',
          },
        },

        // =====================================================
        // DAFTAR KATEGORI
        // =====================================================
        {
          path: 'daftar-kategori',
          name: 'dashboard-daftar-kategori',
          component: () => import('@/views/dashboard/DashboardDaftarKategoriView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori'],
            permission: 'view-news-categories',
          },
        },

        // =====================================================
        // KATEGORI BERITA
        // =====================================================
        {
          path: 'daftar-kategori/kategori-berita/:id',
          name: 'dashboard-kategori-berita-detail',
          component: () => import('@/views/dashboard/detail/NewsCategoryDetailView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Detail'],
            permission: 'show-news-categories',
          },
        },
        {
          path: 'daftar-kategori/kategori-berita/create',
          name: 'dashboard-kategori-berita-create',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Tambah'],
            permission: 'create-news-categories',
          },
        },
        {
          path: 'daftar-kategori/kategori-berita/edit/:id',
          name: 'dashboard-kategori-berita-edit',
          component: () => import('@/views/dashboard/form/NewsCategoryFormView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Berita', 'Edit'],
            permission: 'update-news-categories',
          },
        },

        // =====================================================
        // KATEGORI KRITIK & SARAN
        // =====================================================
        {
          path: 'daftar-kategori/kategori-kritik-saran/:id',
          name: 'dashboard-kategori-kritik-saran-detail',
          component: () => import('@/views/dashboard/detail/FeedbackCategoryDetailView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Detail'],
            permission: 'show-feedbacks-categories',
          },
        },
        {
          path: 'daftar-kategori/kategori-kritik-saran/create',
          name: 'dashboard-kategori-kritik-saran-create',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Tambah'],
            permission: 'create-feedbacks-categories',
          },
        },
        {
          path: 'daftar-kategori/kategori-kritik-saran/edit/:id',
          name: 'dashboard-kategori-kritik-saran-edit',
          component: () => import('@/views/dashboard/form/FeedbackCategoryFormView.vue'),
          meta: {
            breadcrumb: ['Daftar Kategori', 'Kategori Kritik & Saran', 'Edit'],
            permission: 'update-feedbacks-categories',
          },
        },
      ],
    },

    // =========================================================
    // NOT FOUND
    // =========================================================
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
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Belum login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // Tidak memiliki permission
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
