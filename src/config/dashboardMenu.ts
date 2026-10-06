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
}

export interface MenuGroup {
  title: string | null
  items: MenuItem[]
}

export const dashboardMenu: MenuGroup[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', routeName: 'dashboard', icon: RiDashboardLine }],
  },
  {
    title: 'Konten Website',
    items: [
      { label: 'Banner', routeName: 'dashboard-banner', icon: RiImageLine },
      { label: 'Profil Sekolah', routeName: 'dashboard-profil', icon: RiUser3Line },
      { label: 'Visi & Misi', routeName: 'dashboard-visi-misi', icon: RiCompass3Line },
      { label: 'Video & Lokasi', routeName: 'dashboard-video-lokasi', icon: RiNavigationLine },
      { label: 'Jurusan', routeName: 'dashboard-jurusan', icon: RiGraduationCapLine },
      { label: 'Event', routeName: 'dashboard-event', icon: RiCalendarEventLine },
      { label: 'Berita', routeName: 'dashboard-berita', icon: RiNewspaperLine },
      { label: 'Kritik & Saran', routeName: 'dashboard-kritik-saran', icon: RiChat3Line },
      { label: 'Footer', routeName: 'dashboard-footer', icon: RiLayoutBottomLine },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { label: 'Daftar Kategori', routeName: 'dashboard-daftar-kategori', icon: RiListUnordered },
    ],
  },
]
