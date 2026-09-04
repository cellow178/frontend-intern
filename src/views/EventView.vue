<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import EventCard from '@/components/cards/EventCard.vue'
import EventHighlightCard from '@/components/cards/EventHighlightCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { RiSearchLine, RiTimeLine } from '@remixicon/vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'

interface EventItem {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  img_cover: string | null
}

const eventList = ref<EventItem[]>([])
const EventHighlight = ref<EventItem | null>(null)
const isLoading = ref(true)
const isHighlightLoading = ref(true)

const searchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc') // asc = terdekat duluan
const currentPage = ref(1)
const totalPage = ref(1)

const LIMIT = 18
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Format Date Logic
const formatDateRange = (start: string, end: string) => {
  if (!end || start === end) return start

  const startParts = start.split(' ')
  const endParts = end.split(' ')

  const sameMonthYear = startParts[1] === endParts[1] && startParts[2] === endParts[2]

  if (sameMonthYear) {
    return `${startParts[0]}-${endParts[0]} ${endParts[1]} ${endParts[2]}`
  }

  return `${start} - ${end}`
}

const fetchEventHighlight = async () => {
  isHighlightLoading.value = true
  try {
    const response = await api.get('/no-auth/events', {
      params: {
        limit: 1,
        sort_by: 'start_date',
        sort: 'asc',
      },
    })
    if (response.data.data && response.data.data.length > 0) {
      EventHighlight.value = response.data.data[0]
    }
  } catch (err) {
    console.error('Gagal ambil data highlight event:', err)
  } finally {
    isHighlightLoading.value = false
  }
}

const filteredEventList = computed(() => {
  if (!EventHighlight.value) return eventList.value

  return eventList.value.filter((item) => item.id !== EventHighlight.value?.id)
})

const fetchEvents = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/no-auth/events', {
      params: {
        search: searchQuery.value || undefined,
        sort_by: 'start_date',
        sort: sortOrder.value,
        limit: LIMIT,
        page: currentPage.value,
      },
    })
    eventList.value = response.data.data
    totalPage.value = response.data.totalPage
  } catch (err) {
    console.error('Gagal ambil data event:', err)
  } finally {
    isLoading.value = false
  }
}

// Handlers
const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchEvents()
  }, 400)
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
  fetchEvents()
}

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchEvents()
})

onMounted(() => {
  fetchEventHighlight()
  fetchEvents()
})
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12">
    <BackButton class="mb-6 sm:mb-8" />

    <div class="flex flex-col items-center gap-4 text-center mb-10">
      <SectionTitle title="Event" />
      <p class="text-sm text-text-neutral max-w-xl md:text-lg">
        Ikuti berbagai kegiatan, acara, lomba, dan informasi terbaru yang diselenggarakan oleh SMKN
        7 Semarang.
      </p>
    </div>

    <!-- ================= HIGHLIGHT EVENT SECTION ================= -->
    <div class="flex justify-center w-full">
      <!-- Loading Skeleton -->
      <div
        v-if="isHighlightLoading"
        class="w-full max-w-3xl h-64 mb-10 md:mb-16 bg-slate-200/60 animate-pulse rounded-2xl flex items-center justify-center text-text-alt"
      >
        Memuat Highlight Event...
      </div>

      <!-- Komponen Highlight Kamu -->
      <EventHighlightCard
        v-else-if="EventHighlight"
        :title="EventHighlight.title"
        :location="EventHighlight.location"
        :date-label="formatDateRange(EventHighlight.start_date, EventHighlight.end_date)"
        :img-cover="EventHighlight.img_cover"
        :slug="EventHighlight.slug"
      />
    </div>
    <!-- ================= END HIGHLIGHT SECTION ================= -->

    <!-- Search & Sort -->
    <div
      class="flex flex-col items-center gap-3 mb-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
    >
      <div class="relative w-full max-w-md">
        <RiSearchLine class="w-5 h-5 text-text-alt absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Cari event..."
          class="w-full border border-text-alt/30 rounded-full pl-11 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <button
        @click="toggleSort"
        class="flex items-center gap-2 border border-text-alt/30 rounded-full px-5 py-3 text-text-neutral hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
      >
        <RiTimeLine class="w-5 h-5" />
        {{ sortOrder === 'asc' ? 'Terdekat' : 'Terjauh' }}
      </button>
    </div>

    <!-- Grid event -->
    <div v-if="isLoading" class="text-center text-text-alt py-16">Memuat...</div>

    <!-- Ubah eventList.length menjadi filteredEventList.length -->
    <div v-else-if="filteredEventList.length === 0" class="text-center text-text-alt py-16">
      Tidak ada event ditemukan.
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 max-w-7xl mx-auto"
    >
      <!-- Ubah item in eventList menjadi item in filteredEventList -->
      <EventCard
        v-for="item in filteredEventList"
        :key="item.id"
        :slug="item.slug"
        :title="item.title"
        :location="item.location"
        :date-label="formatDateRange(item.start_date, item.end_date)"
        :img-cover="item.img_cover"
      />
    </div>

    <!-- Pagination -->
    <Pagination v-model:current-page="currentPage" :total-page="totalPage" class="mt-12" />
  </main>
</template>
