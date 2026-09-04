<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import { RiMapPinLine, RiCalendarEventLine } from '@remixicon/vue'

interface EventDetail {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  img_cover: string | null
  description: string
}

const route = useRoute()
const event = ref<EventDetail | null>(null)
const isLoading = ref(true)
const isNotFound = ref(false)

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

const fetchEventDetail = async (slug: string) => {
  isLoading.value = true
  isNotFound.value = false
  try {
    const response = await api.get('/no-auth/events')
    const found = response.data.data.find((item: EventDetail) => item.slug === slug)

    if (found) {
      event.value = found
    } else {
      isNotFound.value = true
    }
  } catch (err) {
    console.error('Gagal ambil detail event:', err)
    isNotFound.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchEventDetail(route.params.slug as string)
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

    <div v-if="isLoading" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt">Memuat...</p>
    </div>

    <div v-else-if="isNotFound" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt">Event tidak ditemukan.</p>
    </div>

    <div v-else-if="event">
      <article class="max-w-4xl mx-auto">
        <h1
          class="font-extrabold text-2xl text-text-neutral text-center leading-snug my-4 sm:text-3xl lg:text-4xl"
        >
          {{ event.title }}
        </h1>

        <div class="flex flex-col items-center gap-1.5 text-text-neutral mb-6 sm:mb-8">
          <div class="flex items-center gap-1.5">
            <RiMapPinLine class="w-4 h-4 text-accent shrink-0" />
            <span>{{ event.location }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <RiCalendarEventLine class="w-4 h-4 text-accent shrink-0" />
            <span>{{ formatDateRange(event.start_date, event.end_date) }}</span>
          </div>
        </div>

        <figure class="mb-6 sm:mb-10">
          <div
            class="w-full max-w-sm mx-auto aspect-3/4 rounded-xl overflow-hidden sm:rounded-2xl"
            :class="!event.img_cover ? 'bg-text-alt/20' : ''"
          >
            <img v-if="event.img_cover" :src="event.img_cover" class="w-full h-full object-cover" />
          </div>
          <figcaption class="text-center text-sm text-text-alt italic mt-2">Poster</figcaption>
        </figure>

        <div
          class="prose prose-sm max-w-none max-sm:text-sm text-text-neutral leading-relaxed sm:prose-base"
          v-html="event.description"
        ></div>
      </article>
    </div>
  </main>
</template>
