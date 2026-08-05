<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import EventCard from '@/components/home/EventCard.vue'
import Button from '@/components/ui/Button.vue'
import router from '@/router'

interface Event {
  id: number
  slug: string
  title: string
  location: string
  start_date: string
  end_date: string
  img_cover: string | null
}

const events = ref<Event[]>([])

// gabungin start_date & end_date jadi label ringkas
// contoh: "25 Mei 2026" & "27 Mei 2026" -> "25-27 Mei 2026"
// kalau tanggal sama -> tampilkan sekali aja
const formatDateRange = (start: string, end: string) => {
  if (!end || start === end) return start

  const startParts = start.split(' ') // ["25", "Mei", "2026"]
  const endParts = end.split(' ') // ["27", "Mei", "2026"]

  const sameMonthYear = startParts[1] === endParts[1] && startParts[2] === endParts[2]

  if (sameMonthYear) {
    return `${startParts[0]}-${endParts[0]} ${endParts[1]} ${endParts[2]}`
  }

  return `${start} - ${end}`
}

const fetchEvents = async () => {
  try {
    const response = await api.get('/no-auth/events', {
      params: { sort_by: 'start_date', sort: 'asc', limit: 3 },
    })
    events.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil data events:', err)
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <section id="event" class="max-w-7xl mx-auto px-12 py-16 flex flex-col items-center gap-12">
    <div class="flex flex-col items-center gap-4">
      <SectionTitle title="Event" />
      <p class="text-lg text-text-neutral text-center max-w-2xl">
        Ikuti berbagai kegiatan, acara, lomba, dan informasi terbaru yang diselenggarakan oleh SMKN
        7 Semarang
      </p>
    </div>

    <div class="flex flex-wrap justify-center gap-16">
      <EventCard
        v-for="event in events"
        :key="event.id"
        :title="event.title"
        :location="event.location"
        :date-label="formatDateRange(event.start_date, event.end_date)"
        :img-cover="event.img_cover"
        :slug="event.slug"
      />
    </div>

    <Button label="Selengkapnya" @click="router.push('/event')" />
  </section>
</template>
