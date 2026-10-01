<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import BackButton from '@/components/ui/BackButton.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import EventDetailSkeleton from '@/components/skeletons/EventDetailSkeleton.vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'
import { RiMapPinLine, RiCalendarEventLine } from '@remixicon/vue'

interface EventDetail {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  img_cover?: FileSource | null
  description?: string
  content?: string
}

const route = useRoute()
const event = ref<EventDetail | null>(null)
const isLoading = ref(true)
const isNotFound = ref(false)
const imageLoadError = ref(false)

const handleImageError = () => {
  imageLoadError.value = true
}

// Formatting Tanggal Tunggal
const formatDate = (dateStr: string) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })
  const year = date.getFullYear()

  return { day, month, year, full: `${day} ${month} ${year}` }
}

// Formatting Rentang Tanggal Event
const formatDateRange = (start: string, end: string) => {
  if (!start) return '-'
  const startDate = formatDate(start)
  const endDate = formatDate(end)

  if (!startDate) return start
  if (!endDate || start === end) return startDate.full

  // Jika Bulan & Tahun Sama (Contoh: 29 - 30 Sep 2026)
  if (startDate.month === endDate.month && startDate.year === endDate.year) {
    return `${startDate.day} - ${endDate.day} ${endDate.month} ${endDate.year}`
  }

  // Jika Tahun Sama (Contoh: 29 Sep - 10 Okt 2026)
  if (startDate.year === endDate.year) {
    return `${startDate.day} ${startDate.month} - ${endDate.day} ${endDate.month} ${endDate.year}`
  }

  // Jika Beda Tahun
  return `${startDate.full} - ${endDate.full}`
}

// URL Gambar
const imageUrl = computed(() => {
  return getFullFileUrl(event.value?.img_cover)
})

// Deskripsi / Content
const eventContent = computed(() => {
  return event.value?.description || event.value?.content || ''
})

// Fetch Detail Event
const fetchEventDetail = async (slug: string) => {
  isLoading.value = true
  isNotFound.value = false
  imageLoadError.value = false

  try {
    const response = await api.get(`/no-auth/events/${slug}`)
    if (response.data && response.data.data) {
      event.value = response.data.data
    } else {
      isNotFound.value = true
    }
  } catch (err) {
    // Fallback pencarian manual dari list event jika endpoint per-slug tidak ada
    try {
      const responseList = await api.get('/no-auth/events')
      const eventsList = responseList.data?.data || []
      const found = eventsList.find((item: EventDetail) => item.slug === slug)

      if (found) {
        event.value = found
      } else {
        isNotFound.value = true
      }
    } catch (fallbackErr) {
      console.error('Gagal mengambil detail event:', fallbackErr)
      isNotFound.value = true
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.params.slug) {
    fetchEventDetail(route.params.slug as string)
  }
})

watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) fetchEventDetail(newSlug as string)
  },
)
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12">
    <BackButton class="mb-6 sm:mb-8" />

    <EventDetailSkeleton v-if="isLoading" />

    <div v-else-if="isNotFound" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt font-medium">Event tidak ditemukan.</p>
    </div>

    <div v-else-if="event">
      <article class="max-w-4xl mx-auto">
        <!-- Judul Event -->
        <h1
          class="font-extrabold text-2xl text-text-neutral text-center leading-snug my-4 sm:text-3xl lg:text-4xl wrap-break-word overflow-wrap-anywhere"
        >
          {{ event.title }}
        </h1>

        <div
          class="flex flex-col items-center gap-2 text-text-neutral mb-6 sm:mb-8 text-sm md:text-base"
        >
          <div v-if="event.location" class="flex items-center gap-1.5">
            <RiMapPinLine class="w-4 h-4 text-accent shrink-0" />
            <span>{{ event.location }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <RiCalendarEventLine class="w-4 h-4 text-accent shrink-0" />
            <span>{{ formatDateRange(event.start_date, event.end_date) }}</span>
          </div>
        </div>

        <figure class="mb-8 sm:mb-12 flex justify-center">
          <div
            class="relative w-full max-w-2xl sm:max-w-3xl overflow-hidden shadow-md border border-black/10 flex items-center justify-center bg-text-alt/20"
          >
            <img
              v-if="imageUrl && !imageLoadError"
              :src="imageUrl"
              :alt="event.title"
              class="w-full h-auto max-h-125 object-contain"
              @error="handleImageError"
            />

            <div
              v-else
              class="w-full aspect-video flex flex-col items-center justify-center text-text-neutral/50 p-6 text-center"
            >
              <span class="text-sm sm:text-base font-medium">Gambar event tidak tersedia</span>
            </div>
          </div>
        </figure>

        <RichTextContent
          :content="eventContent"
          empty-message="Tidak ada deskripsi untuk event ini."
        />
      </article>
    </div>
  </main>
</template>
