<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api.ts'
import Navbar from '@/components/layout/Navbar.vue'
import BackButton from '@/components/ui/BackButton.vue'
import EventCard from '@/components/cards/EventCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Footer from '@/components/layout/Footer.vue'
import { RiSearchLine, RiTimeLine } from '@remixicon/vue'

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
const isLoading = ref(true)

const searchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc') // asc = terdekat duluan
const currentPage = ref(1)
const totalPage = ref(1)

const LIMIT = 9
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Format Date Logic
// Start: 2024-06-01, End: 2024-06-02 => 2024-06-01 - 02
// Start: 2024-06-01, End: 2024-07-01 => 2024-06-01 - 2024-07-01

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
  fetchEvents()
})
</script>

<template>
  <Navbar />

  <main class="pt-24 pb-16 px-12">
    <BackButton />

    <div class="flex flex-col items-center gap-4 text-center mb-10">
      <h1 class="font-extrabold text-4xl text-text-neutral border-b-4 border-primary pb-2">
        Event
      </h1>
      <p class="text-lg text-text-neutral max-w-xl">
        Ikuti berbagai kegiatan, acara, lomba, dan informasi terbaru yang diselenggarakan oleh SMKN
        7 Semarang.
      </p>
    </div>

    <!-- Search & Sort -->
    <div class="flex flex-wrap items-center justify-center gap-4 mb-10">
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

    <div v-else-if="eventList.length === 0" class="text-center text-text-alt py-16">
      Tidak ada event ditemukan.
    </div>

    <div v-else class="flex flex-wrap justify-center gap-16 max-w-7xl mx-auto">
      <EventCard
        v-for="item in eventList"
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

  <Footer />
</template>
