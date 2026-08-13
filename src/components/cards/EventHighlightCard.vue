<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RiMapPinLine, RiCalendarLine, RiArrowRightLine } from '@remixicon/vue'

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
    class="event-glow w-full max-w-3xl flex bg-neutral rounded-2xl overflow-hidden shadow-lg outline-2 outline-transparent transition-all duration-300 hover:outline-primary"
  >
    <!-- Gambar / gradient fallback -->
    <div class="w-1/3 shrink-0" :class="!imgCover ? 'bg-linear-to-br from-primary to-accent' : ''">
      <img v-if="imgCover" :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex-1 flex flex-col justify-center gap-3 p-6">
      <span class="w-fit text-lg font-bold text-primary bg-secondary px-3 py-1 rounded-md">
        Highlight Event
      </span>

      <h3 class="font-bold text-3xl text-text-neutral leading-snug">{{ title }}</h3>

      <div class="flex flex-col gap-2 text-sm text-text-alt">
        <div class="flex items-center gap-1.5">
          <RiMapPinLine class="w-4 h-4 text-accent shrink-0" />
          <span>{{ location }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <RiCalendarLine class="w-4 h-4 text-accent shrink-0" />
          <span>{{ dateLabel }}</span>
        </div>
      </div>

      <span class="flex items-center gap-1 text-sm text-primary font-semibold w-fit group">
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
    box-shadow: 0 0px 100px rgba(225, 150, 68, 50%);
  }
}
</style>
