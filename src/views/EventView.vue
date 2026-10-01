<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import EventCard from '@/components/cards/EventCard.vue'
import EventHighlightCard from '@/components/cards/EventHighlightCard.vue'
import EventCardSkeleton from '@/components/skeletons/EventCardSkeleton.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Input from '@/components/ui/Input.vue'
import { RiSearchLine, RiTimeLine } from '@remixicon/vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'

interface EventItem {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  content?: string
  img_cover: string | null
  is_highlight?: boolean
}

const store = useSiteDataStore()
const { highlightEvent } = storeToRefs(store)

const eventListSection = ref<HTMLElement | null>(null)
const eventList = ref<EventItem[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const totalPage = ref(1)

const TARGET_LIMIT = 12
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Dynamic Limit untuk API Request
const apiLimit = computed(() => {
  if (currentPage.value === 1 && highlightEvent.value && !searchQuery.value) {
    return TARGET_LIMIT + 1
  }
  return TARGET_LIMIT
})

// Helper Format Range Tanggal
const formatDateRange = (start: string, end: string) => {
  if (!start) return '-'

  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null

  if (isNaN(startDate.getTime())) return start

  const dayOptions: Intl.DateTimeFormatOptions = { day: 'numeric' }
  const fullOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }

  if (!endDate || isNaN(endDate.getTime()) || startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString('id-ID', fullOptions)
  }

  const sameMonthYear =
    startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()

  if (sameMonthYear) {
    const startDay = startDate.toLocaleDateString('id-ID', dayOptions)
    const endFormatted = endDate.toLocaleDateString('id-ID', fullOptions)
    return `${startDay}-${endFormatted}`
  }

  const startFormatted = startDate.toLocaleDateString('id-ID', fullOptions)
  const endFormatted = endDate.toLocaleDateString('id-ID', fullOptions)

  return `${startFormatted} - ${endFormatted}`
}

// Fetch List Events
const fetchEvents = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/no-auth/events', {
      params: {
        search: searchQuery.value || undefined,
        sort_by: 'start_date',
        sort: sortOrder.value,
        limit: apiLimit.value,
        page: currentPage.value,
      },
    })
    eventList.value = response.data?.data || []

    const totalData = response.data?.totalData || 0
    if (totalData) {
      const adjustedTotalData =
        highlightEvent.value && !searchQuery.value ? Math.max(0, totalData - 1) : totalData
      totalPage.value = Math.ceil(adjustedTotalData / TARGET_LIMIT) || 1
    } else {
      totalPage.value = response.data?.totalPage || 1
    }
  } catch (err) {
    console.error('Gagal ambil data event:', err)
    eventList.value = []
  } finally {
    isLoading.value = false
  }
}

// PERBAIKAN: Filter highlight & pastikan jumlah item yang ditampilkan selalu <= TARGET_LIMIT
const filteredEventList = computed(() => {
  let list = eventList.value

  if (highlightEvent.value) {
    list = list.filter((item) => item.id !== highlightEvent.value?.id)
  }

  // Potong list agar maksimal sesuai TARGET_LIMIT (3)
  return list.slice(0, TARGET_LIMIT)
})

// Search & Sort Handlers
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
  if (eventListSection.value) {
    eventListSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  fetchEvents()
})

onMounted(async () => {
  await store.fetchEvents()
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

    <!-- HIGHLIGHT EVENT SECTION -->
    <div v-if="highlightEvent" class="flex justify-center w-full mb-10">
      <EventHighlightCard
        :title="highlightEvent.title"
        :location="highlightEvent.location"
        :start-date="highlightEvent.start_date"
        :end-date="highlightEvent.end_date"
        :date-label="formatDateRange(highlightEvent.start_date, highlightEvent.end_date)"
        :content="highlightEvent.content"
        :img-cover="highlightEvent.img_cover"
        :slug="highlightEvent.slug"
      />
    </div>

    <!-- Target Scroll ke Search Controls / Awal List Event -->
    <div
      ref="eventListSection"
      class="flex flex-col items-center gap-3 my-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 scroll-mt-28"
    >
      <div class="w-full max-w-md">
        <Input
          v-model="searchQuery"
          type="text"
          variant="rounded-full"
          placeholder="Cari event..."
          :icon="RiSearchLine"
          icon-position="left"
          @input="onSearchInput"
        />
      </div>

      <button
        @click="toggleSort"
        class="flex items-center gap-2 border border-text-alt/30 rounded-full px-3.5 py-1.5 text-sm sm:px-5 sm:py-3 sm:text-base text-text-neutral hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
      >
        <RiTimeLine class="w-4 h-4 sm:w-5 sm:h-5" />
        {{ sortOrder === 'asc' ? 'Terdekat' : 'Terjauh' }}
      </button>
    </div>

    <!-- Grid Event List Skeleton / Content -->
    <div
      v-if="isLoading"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 max-w-7xl mx-auto"
    >
      <EventCardSkeleton v-for="n in TARGET_LIMIT" :key="`skeleton-${n}`" />
    </div>

    <div v-else-if="filteredEventList.length === 0" class="text-center text-text-alt py-16">
      Tidak ada event ditemukan.
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 max-w-7xl mx-auto"
    >
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
    <Pagination
      v-if="totalPage > 1"
      v-model:current-page="currentPage"
      :total-page="totalPage"
      class="mt-12"
    />
  </main>
</template>
