<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

// Interface Data
interface QuickStat {
  title: string
  value: number
  icon: any
  bgColor: string
  textColor: string
  route: string
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
  [key: string]: any
}

// State Data
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
  },
  {
    title: 'Event Terbit',
    value: 0,
    icon: RiCalendarEventLine,
    bgColor: 'bg-primary/10 hover:bg-primary/20',
    textColor: 'text-primary',
    route: '/dashboard/event',
  },
  {
    title: 'Kritik & Saran Masuk',
    value: 0,
    icon: RiChat3Line,
    bgColor: 'bg-success/10 hover:bg-success/20',
    textColor: 'text-success',
    route: '/dashboard/kritik-saran',
  },
  {
    title: 'Jurusan Aktif',
    value: 0,
    icon: RiGraduationCapLine,
    bgColor: 'bg-primary/10 hover:bg-primary/20',
    textColor: 'text-accent',
    route: '/dashboard/jurusan',
  },
])

const recentFeedbacks = ref<ApiFeedback[]>([])
const upcomingEvents = ref<ApiEvent[]>([])
const bannerActiveCount = ref(0)
const hasVideo = ref(false)
const hasMap = ref(false)

const navigateTo = (path: string) => {
  router.push(path)
}

// Navigasi ke detail spesifik
const goToFeedbackDetail = (id: number) => {
  router.push({ name: 'dashboard-kritik-saran-detail', params: { id } })
}

const goToEventDetail = (id: number) => {
  router.push({ name: 'dashboard-event-detail', params: { id } })
}

const openPublicSite = () => {
  window.open('/', '_blank')
}

// Helper untuk format tanggal yang rapi
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

// Helper untuk format tanggal event (tanpa jam)
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
      const data = response.data.data

      if (stats.value[0]) stats.value[0].value = data.total_news || 0
      if (stats.value[1]) stats.value[1].value = data.active_events || 0
      if (stats.value[2]) stats.value[2].value = data.unread_feedbacks || 0
      if (stats.value[3]) stats.value[3].value = data.total_majors || 0

      bannerActiveCount.value = data.active_banners || 0
      hasVideo.value = Boolean(data.has_video)
      hasMap.value = Boolean(data.has_map)
    }
  } catch (error) {
    console.error('Gagal mengambil data statistik dashboard:', error)
  } finally {
    isLoadingStats.value = false
  }
}

const fetchRecentFeedbacks = async () => {
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
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-secondary/30 min-h-screen">
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
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="stat in stats"
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

    <!-- 2. Section Akses Cepat (Quick Actions) -->
    <div class="bg-neutral p-4 sm:p-5 rounded-2xl border border-secondary shadow-sm">
      <h2 class="text-sm sm:text-base font-bold text-text-neutral mb-3">Akses Cepat Edit Konten</h2>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
        <!-- 1. Banner -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/banner')"
        >
          <RiImageLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Atur Banner</span>
        </button>

        <!-- 2. Profil Sekolah -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/profil-sekolah')"
        >
          <RiUser3Line class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Profil Sekolah</span>
        </button>

        <!-- 3. Visi & Misi -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/visi-misi')"
        >
          <RiCompass3Line class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Visi & Misi</span>
        </button>

        <!-- 4. Video & Lokasi -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/video-profil')"
        >
          <RiVideoLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Video & Lokasi</span>
        </button>

        <!-- 5. Tambah Event -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/event/create')"
        >
          <RiCalendarEventLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Tambah Event</span>
        </button>

        <!-- 6. Tambah Berita -->
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border border-secondary bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 text-text-neutral hover:text-primary transition-all text-xs sm:text-sm font-medium text-left cursor-pointer"
          @click="navigateTo('/dashboard/berita/create')"
        >
          <RiNewspaperLine class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-alt" />
          <span class="truncate">Tambah Berita</span>
        </button>
      </div>
    </div>

    <!-- 3. Grid Dua Kolom: Kritik & Saran vs Event Mendatang -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Kolom Kiri: Kritik & Saran Terbaru -->
      <div
        class="lg:col-span-2 bg-neutral p-4 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-3 sm:space-y-4"
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

        <!-- Skeleton Loading Feedbacks -->
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

        <!-- Feedback Empty State -->
        <div
          v-else-if="recentFeedbacks.length === 0"
          class="text-center py-6 sm:py-8 text-xs sm:text-sm text-text-alt"
        >
          Belum ada kritik atau saran masuk.
        </div>

        <!-- Feedbacks List -->
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

                <!-- Category Badge -->
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

      <!-- Kolom Kanan: Event & Status Konten -->
      <div class="space-y-4 sm:space-y-6">
        <!-- Event Terdekat -->
        <div
          class="bg-neutral p-4 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-3 sm:space-y-4"
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

          <!-- Skeleton Loading Events -->
          <div v-if="isLoadingEvents" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="p-3.5 sm:p-4 rounded-xl border border-secondary bg-secondary/30 animate-pulse space-y-2"
            >
              <div class="h-3.5 bg-secondary rounded w-3/4"></div>
            </div>
          </div>

          <!-- Event Empty State -->
          <div
            v-else-if="upcomingEvents.length === 0"
            class="text-center py-6 text-xs text-text-alt"
          >
            Belum ada event terdekat.
          </div>

          <!-- Event List -->
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
                  <!-- Tanggal -->
                  <div v-if="event.start_date" class="flex items-center gap-1 shrink-0">
                    <RiCalendarEventLine class="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span>{{ formatEventDate(event.start_date) }}</span>
                  </div>

                  <!-- Lokasi -->
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

        <!-- Status Konten Utama -->
        <div class="bg-neutral p-5 sm:p-6 rounded-2xl border border-secondary shadow-sm space-y-4">
          <h2 class="font-bold text-text-neutral border-b border-text-alt/20 pb-3 text-base">
            Status Media Landing Page
          </h2>

          <div class="space-y-3">
            <!-- Status Banner -->
            <div class="flex items-center justify-between text-sm py-1">
              <span class="font-medium text-text-neutral/80">Banner Aktif</span>
              <span>
                <template v-if="isLoadingStats">...</template>
                <template v-else>
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

            <!-- Status Video Profil -->
            <div class="flex items-center justify-between text-sm py-1">
              <span class="font-medium text-text-neutral/80">Video</span>
              <span>
                <template v-if="isLoadingStats">...</template>
                <template v-else>
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

            <!-- Status Peta Lokasi -->
            <div class="flex items-center justify-between text-sm py-1">
              <span class="font-medium text-text-neutral/80">Peta Lokasi</span>
              <span>
                <template v-if="isLoadingStats">...</template>
                <template v-else>
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
