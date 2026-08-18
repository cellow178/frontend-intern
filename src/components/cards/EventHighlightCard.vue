<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RiMapPinFill, RiCalendarFill, RiArrowRightLine } from '@remixicon/vue'

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
    class="event-glow w-full max-w-3xl mb-16 flex bg-linear-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-lg outline-3 outline-transparent transition-all duration-300 hover:outline-primary hover:-translate-y-2"
  >
    <!-- Gambar -->
    <div v-if="imgCover" class="w-1/3 shrink-0">
      <img :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex-1 flex flex-col justify-center gap-3 p-6">
      <h3 class="font-bold text-3xl text-neutral leading-snug">{{ title }}</h3>

      <div class="flex flex-col gap-2 text-sm text-secondary">
        <div class="flex items-center gap-1.5">
          <RiMapPinFill class="w-4 h-4 text-primary shrink-0" />
          <span>{{ location }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <RiCalendarFill class="w-4 h-4 text-primary shrink-0" />
          <span>{{ dateLabel }}</span>
        </div>
      </div>

      <span class="flex items-center gap-1 text-sm text-neutral font-semibold w-fit group mt-2">
        Lihat detail
        <RiArrowRightLine class="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
