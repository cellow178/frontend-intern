<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import FeedbackTypeBadge from '@/components/ui/FeedbackTypeBadge.vue'
import {
  RiNewspaperLine,
  RiCalendarEventLine,
  RiMapPinLine,
  RiChat3Line,
  RiGraduationCapLine,
  RiImageLine,
  RiVideoLine,
  RiUser3Line,
  RiArrowRightLine,
  RiCompass3Line,
  RiEyeLine,
} from '@remixicon/vue'

const router = useRouter()
const authStore = useAuthStore()

interface QuickStat {
  title: string
  value: number
  icon: any
  bgColor: string
  textColor: string
  route: string
  permission: string
}

interface ApiFeedback {
  id: number
  sender_name?: string | null
  type: boolean
  category_id?: number
  rel_category_id?: string
  category_name?: string
  message: string
  created_at: string
}

interface ApiEvent {
  id: number
  title: string
  status: string
  start_date: string
  end_date: string
  location?: string
  [key: string]: any
}

interface DashboardStats {
  total_news: number | null
  active_events: number | null
  unread_feedbacks: number | null
  total_majors: number | null
  active_banners: number | null
  has_video: boolean | null
  has_map: boolean | null
}

const isLoadingStats = ref(true)
const isLoadingFeedbacks = ref(true)
const isLoadingEvents = ref(true)

const stats = ref<QuickStat[]>([
  {
    title: 'Berita Terbit',
    value: 0,
    icon: RiNewspaperLine,
    bgColor: 'bg-info/10 hover:bg-info/20',
    textColor: 'text-info',
    route: '/dashboard/berita',
    permission: 'view-news',
  },
  {
    title: 'Event Terbit',
    value: 0,
    icon: RiCalendarEventLine,
    bgColor: 'bg-primary/10 hover:bg-primary/20',
    textColor: 'text-primary',
    route: '/dashboard/event',
    permission: 'view-events',
  },
  {
    title: 'Kritik & Saran Masuk',
    value: 0,
    icon: RiChat3Line,
    bgColor: 'bg-success/10 hover:bg-success/20',
    textColor: 'text-success',
    route: '/dashboard/kritik-saran',
    permission: 'view-feedbacks',
  },
  {
    title: 'Jurusan Aktif',
    value: 0,
    icon: RiGraduationCapLine,
    bgColor: 'bg-primary/10 hover:bg-primary/20',
    textColor: 'text-accent',
    route: '/dashboard/jurusan',
    permission: 'view-majors',
  },
])

const visibleStats = computed(() => {
  return stats.value.filter((stat) => authStore.hasPermission(stat.permission))
})

const recentFeedbacks = ref<ApiFeedback[]>([])
const upcomingEvents = ref<ApiEvent[]>([])

const bannerActiveCount = ref<number | null>(null)
const hasVideo = ref<boolean | null>(null)
const hasMap = ref<boolean | null>(null)

const hasBannerPermission = computed(() => authStore.hasPermission('view-banners'))

const hasGlobalConfigPermission = computed(() => authStore.hasPermission('show-global-config'))

const hasFeedbackPermission = computed(() => authStore.hasPermission('view-feedbacks'))

const hasEventPermission = computed(() => authStore.hasPermission('view-events'))

const hasNewsPermission = computed(() => authStore.hasPermission('view-news'))

const isDeveloperOrSuperAdmin = computed(() => {
  const roleId = authStore.user?.role_id

  return roleId === -1 || roleId === 1
})

const navigateTo = (path: string) => {
  router.push(path)
}

const goToFeedbackDetail = (id: number) => {
  router.push({
    name: 'dashboard-kritik-saran-detail',
    params: { id },
  })
}

const goToEventDetail = (id: number) => {
  router.push({
    name: 'dashboard-event-detail',
    params: { id },
  })
}

const openPublicSite = () => {
  window.open('/', '_blank')
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'

  const date = new Date(dateStr)

  if (isNaN(date.getTime())) return dateStr

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatEventDate = (dateStr: string) => {
  if (!dateStr) return '-'

  const date = new Date(dateStr)

  if (isNaN(date.getTime())) return dateStr

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const fetchStats = async () => {
  isLoadingStats.value = true

  try {
    const response = await api.get('/dashboard/stats')

    if (response.data?.success) {
      const data: DashboardStats = response.data.data

      const newsStat = stats.value.find((stat) => stat.permission === 'view-news')

      const eventStat = stats.value.find((stat) => stat.permission === 'view-events')

      const feedbackStat = stats.value.find((stat) => stat.permission === 'view-feedbacks')

      const majorStat = stats.value.find((stat) => stat.permission === 'view-majors')

      if (newsStat && data.total_news !== null) {
        newsStat.value = data.total_news
      }

      if (eventStat && data.active_events !== null) {
        eventStat.value = data.active_events
      }

      if (feedbackStat && data.unread_feedbacks !== null) {
        feedbackStat.value = data.unread_feedbacks
      }

      if (majorStat && data.total_majors !== null) {
        majorStat.value = data.total_majors
      }

      bannerActiveCount.value = data.active_banners
      hasVideo.value = data.has_video
      hasMap.value = data.has_map
    }
  } catch (error) {
    console.error('Gagal mengambil data statistik dashboard:', error)
  } finally {
    isLoadingStats.value = false
  }
}

const fetchRecentFeedbacks = async () => {
  if (!hasFeedbackPermission.value) {
    isLoadingFeedbacks.value = false
    return
  }

  isLoadingFeedbacks.value = true

  try {
    const response = await api.get('/feedbacks', {
      params: { limit: 5 },
    })

    const feedbackData = response.data?.data || response.data || []

    recentFeedbacks.value = feedbackData.map((item: any) => ({
      ...item,
      type: Boolean(Number(item.type)),
    }))
  } catch (error) {
    console.error('Gagal mengambil daftar feedback:', error)
  } finally {
    isLoadingFeedbacks.value = false
  }
}

const fetchUpcomingEvents = async () => {
  if (!hasEventPermission.value) {
    isLoadingEvents.value = false
    return
  }

  isLoadingEvents.value = true

  try {
    const response = await api.get('/events', {
      params: {
        status: 'publish',
        sort_by: 'start_date',
        order: 'asc',
        limit: 3,
      },
    })

    const eventData: ApiEvent[] = response.data?.data || response.data || []

    upcomingEvents.value = eventData
      .filter((event) => event.status === 'publish')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5)
  } catch (error) {
    console.error('Gagal mengambil daftar event:', error)
  } finally {
    isLoadingEvents.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentFeedbacks()
  fetchUpcomingEvents()
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6 min-h-screen">
    <!-- Header Welcome & Preview Link -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-text-neutral">Dashboard</h1>
        <p class="text-xs sm:text-sm text-text-alt mt-0.5 sm:mt-1">
          Ringkasan aktivitas dan pengelolaan konten website sekolah.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-neutral border border-secondary text-text-neutral font-medium text-xs sm:text-sm rounded-xl shadow-sm hover:bg-secondary transition-colors cursor-pointer w-full sm:w-auto"
        @click="openPublicSite"
      >
        <RiEyeLine class="w-4 h-4 text-text-alt shrink-0" />
        <span>Lihat Website Utama</span>
      </button>
    </div>

    <!-- 1. Cards Statistik Ringkas -->
    <div :class="['grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4']">
      <div
        v-for="stat in visibleStats"
        :key="stat.title"
        class="p-3.5 sm:p-5 rounded-2xl bg-neutral border border-secondary shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
        @click="navigateTo(stat.route)"
      >
        <div class="space-y-0.5 sm:space-y-1">
          <span
            class="text-[10px] sm:text-xs font-semibold text-text-alt uppercase tracking-wider line-clamp-1"
          >
            {{ stat.title }}
          </span>

          <div class="text-2xl sm:text-3xl font-extrabold text-text-neutral">
            <template v-if="isLoadingStats">
              <span
                class="inline-block w-10 sm:w-12 h-6 sm:h-7 bg-secondary animate-pulse rounded"
              ></span>
            </template>

            <template v-else>
              {{ stat.value }}
            </template>
          </div>
        </div>

        <div
          :class="[
            'p-2 sm:p-3 rounded-xl transition-colors self-end sm:self-auto shrink-0',
            stat.bgColor,
            stat.textColor,
          ]"
        >
          <component :is="stat.icon" class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>

    <!-- 2. Section Akses Cepat -->
    <div class="bg-neutral p-4 sm:p-5 rounded-2xl border border-secondary shadow-sm">
      <h2 class="text-sm sm:text-base font-bold text-text-neutral mb-3">Akses Cepat Edit Konten</h2>

      <div
        :class="[
          'grid grid-cols-2 gap-2.5 sm:gap-3',
          isDeveloperOrSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2',
        ]"
      >
        <!-- 1. Banner -->
        <button
          v-if="hasBannerPermission"
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/banner')"
        >
          <RiImageLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Atur Banner</span>
        </button>

        <!-- 2. Profil Sekolah -->
        <button
          v-if="hasGlobalConfigPermission"
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/profil-sekolah')"
        >
          <RiUser3Line class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Profil Sekolah</span>
        </button>

        <!-- 3. Visi & Misi -->
        <button
          v-if="isDeveloperOrSuperAdmin"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/visi-misi')"
        >
          <RiCompass3Line class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Visi & Misi</span>
        </button>

        <!-- 4. Video & Lokasi -->
        <button
          v-if="hasGlobalConfigPermission"
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/video-profil')"
        >
          <RiVideoLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Video & Lokasi</span>
        </button>

        <!-- 5. Tambah Event -->
        <button
          v-if="hasEventPermission"
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/event/create')"
        >
          <RiCalendarEventLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Tambah Event</span>
        </button>

        <!-- 6. Tambah Berita -->
        <button
          v-if="hasNewsPermission"
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/berita/create')"
        >
          <RiNewspaperLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span>Tambah Berita</span>
        </button>
      </div>
    </div>

    <!-- Kritik & Saran + Event -->
    <div
      :class="[
        'grid grid-cols-1 gap-4 sm:gap-6',
        hasFeedbackPermission && hasEventPermission
          ? isDeveloperOrSuperAdmin
            ? 'lg:grid-cols-3'
            : 'lg:grid-cols-2'
          : '',
      ]"
    >
      <!-- Kritik & Saran -->
      <div
        v-if="hasFeedbackPermission"
        :class="[
          'bg-neutral p-4 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-3 sm:space-y-4',
          hasFeedbackPermission && hasEventPermission
            ? isDeveloperOrSuperAdmin
              ? 'lg:col-span-2 lg:h-full'
              : 'lg:col-span-1 lg:h-full'
            : '',
        ]"
      >
        <div class="flex items-center justify-between pb-1 sm:pb-2">
          <div class="flex items-center gap-2">
            <RiChat3Line class="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h2 class="text-base sm:text-xl font-bold text-text-neutral">Kritik & Saran Terbaru</h2>
          </div>

          <button
            type="button"
            class="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0 group"
            @click="navigateTo('/dashboard/kritik-saran')"
          >
            <span>Lihat Semua</span>
            <RiArrowRightLine
              class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>

        <!-- Skeleton -->
        <div v-if="isLoadingFeedbacks" class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="p-3.5 sm:p-4 rounded-xl border border-secondary bg-secondary/30 animate-pulse space-y-2"
          >
            <div class="h-4 bg-secondary rounded w-1/4"></div>
            <div class="h-3 bg-secondary rounded w-3/4"></div>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="recentFeedbacks.length === 0"
          class="text-center py-6 sm:py-8 text-xs sm:text-sm text-text-alt"
        >
          Belum ada kritik atau saran masuk.
        </div>

        <!-- List -->
        <div v-else class="space-y-2.5 sm:space-y-3">
          <div
            v-for="item in recentFeedbacks"
            :key="item.id"
            class="p-3.5 sm:p-4 rounded-xl bg-secondary/60 border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 cursor-pointer hover:bg-secondary hover:shadow-sm transition-all"
            @click="goToFeedbackDetail(item.id)"
          >
            <div class="space-y-1.5 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span class="font-bold text-sm text-text-neutral truncate max-w-37.5:max-w-none">
                  {{ item.sender_name || 'Anonim' }}
                </span>

                <FeedbackTypeBadge :type="item.type" />

                <span
                  v-if="item.rel_category_id || item.category_id"
                  class="px-2 py-1 text-xs font-semibold bg-accent/10 text-accent rounded-full truncate max-w-30"
                >
                  {{ item.rel_category_id || `Kategori #${item.category_id}` }}
                </span>
              </div>

              <p class="text-sm text-text-neutral line-clamp-2">"{{ item.message }}"</p>
            </div>

            <span class="text-[10px] sm:text-xs text-text-alt shrink-0 self-end sm:self-center">
              {{ formatDate(item.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Kolom Kanan -->
      <div
        v-if="hasEventPermission || hasBannerPermission || hasGlobalConfigPermission"
        :class="[
          'space-y-4 sm:space-y-6',
          hasFeedbackPermission && hasEventPermission
            ? isDeveloperOrSuperAdmin
              ? 'lg:col-span-1 lg:h-full lg:flex lg:flex-col'
              : 'lg:col-span-1 lg:h-full'
            : '',
        ]"
      >
        <!-- Event Terdekat -->
        <div
          v-if="hasEventPermission"
          :class="[
            'bg-neutral p-4 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-3 sm:space-y-4',
            hasFeedbackPermission
              ? isDeveloperOrSuperAdmin
                ? 'lg:flex-1 lg:min-h-0'
                : 'lg:h-full'
              : '',
          ]"
        >
          <div class="flex items-center justify-between pb-1 sm:pb-2">
            <div class="flex items-center gap-2">
              <RiCalendarEventLine class="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h2 class="text-base sm:text-xl font-bold text-text-neutral">Event Terdekat</h2>
            </div>

            <button
              type="button"
              class="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0 group"
              @click="navigateTo('/dashboard/event')"
            >
              <span>Kelola</span>
              <RiArrowRightLine
                class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>

          <!-- Skeleton -->
          <div v-if="isLoadingEvents" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="p-3.5 sm:p-4 rounded-xl border border-secondary bg-secondary/30 animate-pulse space-y-2"
            >
              <div class="h-3.5 bg-secondary rounded w-3/4"></div>
            </div>
          </div>

          <!-- Empty -->
          <div
            v-else-if="upcomingEvents.length === 0"
            class="text-center py-6 text-xs text-text-alt"
          >
            Belum ada event terdekat.
          </div>

          <!-- List -->
          <div v-else class="space-y-2.5 sm:space-y-3">
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="p-3.5 sm:p-4 rounded-xl bg-secondary/70 border border-secondary flex items-start justify-between gap-3 cursor-pointer hover:bg-secondary hover:shadow-sm transition-all"
              @click="goToEventDetail(event.id)"
            >
              <div class="space-y-1.5 min-w-0 flex-1">
                <span class="font-bold text-sm text-text-neutral block truncate">
                  {{ event.title }}
                </span>

                <div class="flex flex-col gap-x-3 gap-y-1 text-[11px] sm:text-xs text-text-alt">
                  <div v-if="event.start_date" class="flex items-center gap-1 shrink-0">
                    <RiCalendarEventLine class="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span>{{ formatEventDate(event.start_date) }}</span>
                  </div>

                  <div class="flex items-center gap-1 min-w-0">
                    <RiMapPinLine class="w-3.5 h-3.5 shrink-0 text-accent" />
                    <span>
                      {{ event.location }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Media Landing Page -->
        <div
          v-if="hasBannerPermission || hasGlobalConfigPermission"
          class="bg-neutral p-5 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-4"
        >
          <h2 class="font-bold text-text-neutral border-b border-text-alt/20 pb-3 text-base">
            Status Media Landing Page
          </h2>

          <div class="space-y-3">
            <!-- Banner -->
            <div v-if="hasBannerPermission" class="flex items-center justify-between text-sm py-1">
              <span class="font-medium text-text-neutral/80"> Banner Aktif </span>

              <span>
                <template v-if="isLoadingStats"> ... </template>

                <template v-else-if="bannerActiveCount !== null">
                  <span
                    v-if="bannerActiveCount > 0"
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success"
                  >
                    {{ bannerActiveCount }} Slide Tersedia
                  </span>

                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error/10 text-error"
                  >
                    Belum Ada
                  </span>
                </template>
              </span>
            </div>

            <!-- Video -->
            <div
              v-if="hasGlobalConfigPermission"
              class="flex items-center justify-between text-sm py-1"
            >
              <span class="font-medium text-text-neutral/80"> Video </span>

              <span>
                <template v-if="isLoadingStats"> ... </template>

                <template v-else-if="hasVideo !== null">
                  <span
                    v-if="hasVideo"
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success"
                  >
                    Tersedia
                  </span>

                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error/10 text-error"
                  >
                    Belum Ada
                  </span>
                </template>
              </span>
            </div>

            <!-- Peta -->
            <div
              v-if="hasGlobalConfigPermission"
              class="flex items-center justify-between text-sm py-1"
            >
              <span class="font-medium text-text-neutral/80"> Peta Lokasi </span>

              <span>
                <template v-if="isLoadingStats"> ... </template>

                <template v-else-if="hasMap !== null">
                  <span
                    v-if="hasMap"
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success"
                  >
                    Tersedia
                  </span>

                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error/10 text-error"
                  >
                    Belum Ada
                  </span>
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
