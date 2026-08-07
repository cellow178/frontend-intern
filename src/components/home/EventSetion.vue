<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useSiteDataStore } from '@/stores/siteData'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import EventCard from '@/components/cards/EventCard.vue'
import Button from '@/components/ui/Button.vue'

const store = useSiteDataStore()
const router = useRouter()
const { events } = storeToRefs(store)

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

onMounted(() => {
  store.fetchEvents()
})
</script>

<template>
  <section id="event" class="max-w-7xl mx-auto px-12 py-16 flex flex-col items-center gap-12 scroll-mt-20">
    <div class="flex flex-col items-center gap-4">
      <SectionTitle title="Event" />
      <p class="text-lg text-text-neutral text-center max-w-2xl">
        Ikuti berbagai kegiatan, acara, lomba, dan informasi terbaru yang diselenggarakan oleh SMKN
        7 Semarang
      </p>
    </div>

    <div class="flex flex-wrap justify-center gap-12">
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