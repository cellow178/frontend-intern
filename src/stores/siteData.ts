import { defineStore } from 'pinia'
import api from '@/services/api.ts'

interface Major {
  id: number
  slug: string
  img_logo: string
  code: string
  major_name: string
  summary: string
}

interface Banner {
  id: number
  title: string
  img_cover: string
  url: string
}

interface Mission {
  id: number
  order: number
  content: string
}

interface Event {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  img_cover: string | null
  is_highlight: boolean
}

interface News {
  id: number
  slug: string
  title: string
  category_name: string
  content: string
  img_cover: string | null
  author: string
  created_at: string
  is_highlight: boolean
}

export const useSiteDataStore = defineStore('siteData', {
  state: () => ({
    // global-config
    schoolName: '',
    motto: '',
    heroDescription: '',
    profile: { title: '', description: '', img_1: '', img_2: null as string | null },
    videoProfile: '',
    highlightVoting: null as any,
    footer: {
      description: '',
      school_email: '',
      school_telephone: '',
      ig: '',
      yt: '',
      fb: '',
      linkedin: '',
    },

    // data lain
    majors: [] as Major[],
    banners: [] as Banner[],
    vision: '',
    missions: [] as Mission[],
    events: [] as Event[],
    highlightEvent: null as Event | null,
    news: [] as News[],
    highlightNews: null as News | null,

    // flag biar fetch cuma sekali per endpoint
    loaded: {
      globalConfig: false,
      majors: false,
      banners: false,
      visionMission: false,
      events: false,
      news: false,
    },
  }),

  actions: {
    async fetchGlobalConfig() {
      if (this.loaded.globalConfig) return
      try {
        const response = await api.get('/no-auth/global-config')
        const data = response.data.data
        this.schoolName = data.school_name
        this.motto = data.motto
        this.heroDescription = data.hero_description
        this.profile = data.profile
        this.videoProfile = data.video_profile
        this.highlightVoting = data.highlight_voting
        this.footer = data.footer
        this.loaded.globalConfig = true
      } catch (err) {
        console.error('Gagal ambil global-config:', err)
      }
    },

    async fetchMajors() {
      if (this.loaded.majors) return
      try {
        const response = await api.get('/no-auth/majors')
        this.majors = response.data.data
        this.loaded.majors = true
      } catch (err) {
        console.error('Gagal ambil majors:', err)
      }
    },

    async fetchBanners() {
      if (this.loaded.banners) return
      try {
        const response = await api.get('/no-auth/banners')
        this.banners = response.data.data
        this.loaded.banners = true
      } catch (err) {
        console.error('Gagal ambil banners:', err)
      }
    },

    async fetchVisionMission() {
      if (this.loaded.visionMission) return
      try {
        const response = await api.get('/no-auth/vision-mission')
        this.vision = response.data.data.vision
        this.missions = response.data.data.missions
        this.loaded.visionMission = true
      } catch (err) {
        console.error('Gagal ambil vision-mission:', err)
      }
    },

    async fetchEvents() {
      if (this.loaded.events) return
      try {
        const response = await api.get('/no-auth/events', {
          params: { sort_by: 'start_date', sort: 'asc' },
        })
        const allEvents: Event[] = response.data.data

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
        const response = await api.get('/no-auth/news')
        const allNews: News[] = response.data.data

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
