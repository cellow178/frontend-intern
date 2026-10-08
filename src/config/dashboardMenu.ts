import {
  RiDashboardLine,
  RiImageLine,
  RiUser3Line,
  RiCompass3Line,
  RiNavigationLine,
  RiGraduationCapLine,
  RiCalendarEventLine,
  RiNewspaperLine,
  RiChat3Line,
  RiLayoutBottomLine,
  RiListUnordered,
} from '@remixicon/vue'
import type { Component } from 'vue'

export interface MenuItem {
  label: string
  routeName: string
  icon: Component
  permission?: string
}

export interface MenuGroup {
  title: string | null
  items: MenuItem[]
}

export const dashboardMenu: MenuGroup[] = [
  {
    title: null,
    items: [
      {
        label: 'Dashboard',
        routeName: 'dashboard',
        icon: RiDashboardLine,
      },
    ],
  },
  {
    title: 'Konten Website',
    items: [
      {
        label: 'Banner',
        routeName: 'dashboard-banner',
        icon: RiImageLine,
        permission: 'view-banners',
      },
      {
        label: 'Profil Sekolah',
        routeName: 'dashboard-profil',
        icon: RiUser3Line,
        permission: 'view-global-config',
      },
      {
        label: 'Visi & Misi',
        routeName: 'dashboard-visi-misi',
        icon: RiCompass3Line,
        permission: 'view-missions',
      },
      {
        label: 'Video & Lokasi',
        routeName: 'dashboard-video-lokasi',
        icon: RiNavigationLine,
        permission: 'show-global-config',
      },
      {
        label: 'Jurusan',
        routeName: 'dashboard-jurusan',
        icon: RiGraduationCapLine,
        permission: 'view-majors',
      },
      {
        label: 'Event',
        routeName: 'dashboard-event',
        icon: RiCalendarEventLine,
        permission: 'view-events',
      },
      {
        label: 'Berita',
        routeName: 'dashboard-berita',
        icon: RiNewspaperLine,
        permission: 'view-news',
      },
      {
        label: 'Kritik & Saran',
        routeName: 'dashboard-kritik-saran',
        icon: RiChat3Line,
        permission: 'view-feedbacks',
      },
      {
        label: 'Footer',
        routeName: 'dashboard-footer',
        icon: RiLayoutBottomLine,
        permission: 'show-global-config',
      },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      {
        label: 'Daftar Kategori',
        routeName: 'dashboard-daftar-kategori',
        icon: RiListUnordered,
        permission: 'view-news-categories',
      },
    ],
  },
]
