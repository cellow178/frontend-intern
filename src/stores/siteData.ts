import { defineStore } from 'pinia'
import api from '@/services/api'
import type { FileObjectInput } from '@/utils/file'

export type FileProperty = FileObjectInput | string | null

export interface Major {
  id: number
  slug: string
  img_logo: FileProperty
  code: string
  major_name: string
  summary: string
}

export interface Banner {
  id: number
  title: string
  img_cover: FileProperty
  url: string
}

export interface Mission {
  id: number
  order: number
  content: string
}

export interface Event {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  content?: string
  img_cover: FileProperty
  is_highlight: boolean
}

export interface News {
  id: number
  slug: string
  title: string
  category_name: string
  content: string
  img_cover: FileProperty
  author: string
  created_at: string
  is_highlight: boolean
}

export interface ProfileConfig {
  title: string
  description: string
  img_1: FileProperty
  img_2: FileProperty
}

export const useSiteDataStore = defineStore('siteData', {
  state: () => ({
    // Global Config
    schoolName: '',
    motto: '',
    heroDescription: '',
    profile: {
      title: '',
      description: '',
      img_1: null,
      img_2: null,
    } as ProfileConfig,
    videoProfile: '',
    footer: {
      description: '',
      school_email: '',
      school_telephone: '',
      ig: '',
      yt: '',
      fb: '',
      linkedin: '',
    },

    // Dynamic Lists
    majors: [] as Major[],
    banners: [] as Banner[],
    vision: '',
    missions: [] as Mission[],
    events: [] as Event[],
    highlightEvent: null as Event | null,
    news: [] as News[],
    highlightNews: null as News | null,

    // Cache Flags
    loaded: {
      globalConfig: false,
      majors: false,
      banners: false,
      visionMission: false,
      events: false,
      news: false,
    },
  }),

  getters: {
    isFullyLoaded: (state) => Object.values(state.loaded).every(Boolean),
  },

  actions: {
    async fetchGlobalConfig() {
      if (this.loaded.globalConfig) return
      try {
        const { data } = await api.get('/no-auth/global-config')
        this.schoolName = data.data.school_name
        this.motto = data.data.motto
        this.heroDescription = data.data.hero_description
        this.profile = data.data.profile
        this.videoProfile = data.data.video_profile
        this.footer = data.data.footer
        this.loaded.globalConfig = true
      } catch (err) {
        console.error('Gagal ambil global-config:', err)
      }
    },

    async fetchMajors() {
      if (this.loaded.majors) return
      try {
        const { data } = await api.get('/no-auth/majors')
        this.majors = data.data
        this.loaded.majors = true
      } catch (err) {
        console.error('Gagal ambil majors:', err)
      }
    },

    async fetchBanners() {
      if (this.loaded.banners) return
      try {
        const { data } = await api.get('/no-auth/banners')
        this.banners = data.data
        this.loaded.banners = true
      } catch (err) {
        console.error('Gagal ambil banners:', err)
      }
    },

    async fetchVisionMission() {
      if (this.loaded.visionMission) return
      try {
        const { data } = await api.get('/no-auth/vision-mission')
        this.vision = data.data.vision
        this.missions = data.data.missions
        this.loaded.visionMission = true
      } catch (err) {
        console.error('Gagal ambil vision-mission:', err)
      }
    },

    async fetchEvents() {
      if (this.loaded.events) return
      try {
        const { data } = await api.get('/no-auth/events', {
          params: { sort_by: 'start_date', sort: 'asc' },
        })
        const allEvents: Event[] = data.data

        this.highlightEvent = allEvents.find((e) => e.is_highlight) ?? null
        this.events = allEvents.filter((e) => !e.is_highlight).slice(0, 3)
        this.loaded.events = true
      } catch (err) {
        console.error('Gagal ambil events:', err)
      }
    },

    async fetchNews() {
      if (this.loaded.news) return
      try {
        const { data } = await api.get('/no-auth/news')
        const allNews: News[] = data.data

        this.highlightNews = allNews.find((n) => n.is_highlight) ?? null
        this.news = allNews
          .filter((n) => !n.is_highlight)
          .sort((a, b) => b.id - a.id)
          .slice(0, 3)

        this.loaded.news = true
      } catch (err) {
        console.error('Gagal ambil news:', err)
      }
    },
  },
})
