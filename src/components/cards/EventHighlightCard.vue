<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RiMapPinFill, RiCalendarEventFill, RiArrowRightLine } from '@remixicon/vue'

defineProps<{
  title: string
  location: string
  dateLabel: string
  imgCover: string | null
  slug: string
}>()
</script>

<template>
  <RouterLink
    :to="`/event/${slug}`"
    class="event-glow w-full max-w-3xl mb-10 flex flex-col bg-linear-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-lg outline-3 outline-transparent transition-all duration-300 hover:outline-primary hover:-translate-y-2 md:mb-16 md:flex-row"
  >
    <!-- Gambar -->
    <div v-if="imgCover" class="w-full sm:h-100 md:h-auto md:w-[40%] md:aspect-auto md:shrink-0">
      <img :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex-1 flex flex-col justify-center gap-2 p-5 md:gap-3 md:p-6">
      <h3 class="font-bold text-xl text-neutral leading-snug md:text-3xl">{{ title }}</h3>

      <div class="flex flex-col gap-1.5 text-xs text-secondary md:gap-2 md:text-sm">
        <div class="flex items-center gap-1.5">
          <RiMapPinFill class="w-3.5 h-3.5 text-primary shrink-0 md:w-4 md:h-4" />
          <span>{{ location }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <RiCalendarEventFill class="w-3.5 h-3.5 text-primary shrink-0 md:w-4 md:h-4" />
          <span>{{ dateLabel }}</span>
        </div>
      </div>

      <span
        class="flex items-center gap-1 text-xs text-neutral font-semibold w-fit group mt-1 md:text-sm md:mt-2"
      >
        Lihat detail
        <RiArrowRightLine
          class="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 md:w-4 md:h-4"
        />
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.event-glow {
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    filter: brightness(1);
    box-shadow: 0 0px 25px rgba(0, 0, 0, 0.08);
  }
  50% {
    filter: brightness(1.05);
    box-shadow: 0 0px 100px rgba(225, 150, 68, 70%);
  }
}
</style>
