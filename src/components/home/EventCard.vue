<script setup lang="ts">
import { RiMapPinLine, RiCalendarLine } from '@remixicon/vue'
import { RouterLink } from 'vue-router'

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
    class="w-72 flex flex-col bg-neutral rounded-2xl overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_0_100px_#FF964440]"
  >
    <!-- Gambar / gradient fallback -->
    <div class="h-72 w-full" :class="!imgCover ? 'bg-linear-to-b from-primary to-accent' : ''">
      <img v-if="imgCover" :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex flex-col gap-3 p-6">
      <div>
        <h3 class="font-bold text-xl text-text-neutral leading-snug">{{ title }}</h3>
        <div class="w-12 h-0.5 bg-primary mt-2"></div>
      </div>

      <div class="flex flex-col gap-1.5 text-sm text-text-alt">
        <div class="flex items-center gap-2">
          <RiMapPinLine class="w-4 h-4 text-accent shrink-0" />
          <span>{{ location }}</span>
        </div>
        <div class="flex items-center gap-2">
          <RiCalendarLine class="w-4 h-4 text-accent shrink-0" />
          <span>{{ dateLabel }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>