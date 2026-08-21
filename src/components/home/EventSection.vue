<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useSiteDataStore } from '@/stores/siteData'
import { RiCalendarEventLine } from '@remixicon/vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import EventCard from '@/components/cards/EventCard.vue'
import EventHighlightCard from '@/components/cards/EventHighlightCard.vue'
import Button from '@/components/ui/Button.vue'

const store = useSiteDataStore()
const router = useRouter()
const { events, highlightEvent } = storeToRefs(store)

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

// Grid 3 kolom (tablet): hitung berapa placeholder dibutuhkan biar baris terakhir rata
const tabletPlaceholderCount = computed(() => {
  const remainder = events.value.length % 3
  return remainder === 0 ? 0 : 3 - remainder
})

// Desktop (flex-wrap): tampilkan 1 placeholder kalau jumlah event ganjil dan minimal 2
const showDesktopPlaceholder = computed(
  () => events.value.length === 1 || (events.value.length >= 2 && events.value.length % 3 !== 0),
)

// Belum ada event sama sekali
const isEventsEmpty = computed(() => events.value.length === 0)

onMounted(() => {
  store.fetchEvents()
})
</script>

<template>
  <section
    id="event"
    class="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-8 scroll-mt-10 lg:px-12 lg:py-16 md:gap-12"
  >
    <div class="flex flex-col items-center gap-3 md:gap-4">
      <SectionTitle title="Event" />
      <p class="text-base text-text-neutral text-center max-w-2xl md:text-lg">
        Ikuti berbagai kegiatan, acara, lomba, dan informasi terbaru yang diselenggarakan oleh SMKN
        7 Semarang
      </p>
    </div>

    <EventHighlightCard
      v-if="highlightEvent"
      :title="highlightEvent.title"
      :location="highlightEvent.location"
      :date-label="formatDateRange(highlightEvent.start_date, highlightEvent.end_date)"
      :img-cover="highlightEvent.img_cover"
      :slug="highlightEvent.slug"
    />

    <!-- State kosong: belum ada event sama sekali -->
    <div v-if="isEventsEmpty" class="relative w-full min-h-52 md:min-h-64">
      <div
        class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-2 shadow-sm md:rounded-2xl"
      ></div>
      <div
        class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm md:rounded-2xl md:gap-3"
      >
        <RiCalendarEventLine class="w-8 h-8 text-text-alt/50 md:w-10 md:h-10" />
        <span class="text-text-alt/60 text-sm text-center px-6 md:text-base"
          >Nantikan event berikutnya...</span
        >
      </div>
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-12"
    >
      <EventCard
        v-for="event in events"
        :key="event.id"
        :title="event.title"
        :location="event.location"
        :date-label="formatDateRange(event.start_date, event.end_date)"
        :img-cover="event.img_cover"
        :slug="event.slug"
      />

      <!-- Placeholder dekoratif: mobile (grid 2 kolom, ganjil) -->
      <div v-if="events.length % 2 !== 0" class="relative h-full min-h-40 sm:hidden">
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-4 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiCalendarEventLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4"
            >Nantikan event berikutnya...</span
          >
        </div>
      </div>

      <!-- Placeholder dekoratif: tablet (grid 3 kolom, sisa 1 atau 2) -->
      <div
        v-for="n in tabletPlaceholderCount"
        :key="`tablet-placeholder-${n}`"
        class="relative h-full min-h-40 hidden sm:block lg:hidden"
      >
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-4 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiCalendarEventLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4"
            >Nantikan event berikutnya...</span
          >
        </div>
      </div>

      <!-- Placeholder dekoratif: desktop (flex-wrap, jumlah ganjil & minimal 2) -->
      <div v-if="showDesktopPlaceholder" class="relative h-full min-h-120 hidden lg:block lg:w-72">
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-6 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiCalendarEventLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4"
            >Nantikan event berikutnya...</span
          >
        </div>
      </div>
    </div>

    <Button label="Selengkapnya" @click="router.push('/event')" />
  </section>
</template>
