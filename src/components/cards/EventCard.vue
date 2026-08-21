<script setup lang="ts">
import { RiMapPinLine, RiCalendarEventLine } from '@remixicon/vue'
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
    class="w-full flex flex-col bg-neutral rounded-xl overflow-hidden border-2 border-transparent shadow-sm transition-all duration-300 hover:border-primary hover:shadow-[0_0_100px_#FF964440] lg:w-72 lg:rounded-2xl"
  >
    <!-- Gambar / gradient fallback -->
    <div class="h-48 w-full sm:h-64 lg:h-72" :class="!imgCover ? 'bg-text-alt/20' : ''">
      <img v-if="imgCover" :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex flex-col gap-2 p-3 lg:gap-3 lg:p-6">
      <div>
        <h3
          class="font-bold text-sm text-text-neutral leading-snug line-clamp-2 lg:text-xl lg:line-clamp-none"
        >
          {{ title }}
        </h3>
        <div class="w-8 h-0.5 bg-primary mt-1.5 lg:w-12 lg:mt-2"></div>
      </div>

      <div class="flex flex-col gap-1 text-xs text-text-alt lg:gap-1.5 lg:text-sm">
        <div class="flex items-center gap-1.5 lg:gap-2">
          <RiMapPinLine class="w-3.5 h-3.5 text-accent shrink-0 lg:w-4 lg:h-4" />
          <span class="truncate lg:whitespace-normal lg:wrap-break-word">{{ location }}</span>
        </div>
        <div class="flex items-center gap-1.5 lg:gap-2">
          <RiCalendarEventLine class="w-3.5 h-3.5 text-accent shrink-0 lg:w-4 lg:h-4" />
          <span class="truncate">{{ dateLabel }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
