import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
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
  ],
})

export default router
