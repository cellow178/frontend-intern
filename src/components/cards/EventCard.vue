<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RiMapPinLine, RiCalendarEventLine } from '@remixicon/vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'

const props = defineProps<{
  title: string
  location: string
  dateLabel?: string
  startDate?: string
  endDate?: string
  imgCover?: FileSource | null
  slug: string
}>()

const imageUrl = computed(() => {
  return getFullFileUrl(props.imgCover)
})

// Helper konversi ISO String ke format lokal (misal: "23 Sep 2026")
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

const formattedDateLabel = computed(() => {
  // Jika startDate dikirimkan
  if (props.startDate) {
    const startFormatted = formatDate(props.startDate)
    const endFormatted = formatDate(props.endDate)

    if (endFormatted && startFormatted !== endFormatted) {
      return `${startFormatted} - ${endFormatted}`
    }
    return startFormatted
  }

  // Fallback jika menggunakan dateLabel
  if (props.dateLabel) {
    return formatDate(props.dateLabel)
  }

  return '-'
})
</script>

<template>
  <RouterLink
    :to="`/event/${slug}`"
    class="group w-full flex flex-col bg-neutral rounded-xl overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-primary lg:w-72 lg:rounded-2xl"
  >
    <!-- Gambar Cover / Fallback -->
    <div
      class="h-48 w-full sm:h-64 lg:h-72 overflow-hidden flex items-center justify-center"
      :class="!imageUrl ? 'bg-text-alt/20' : ''"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>

    <!-- Konten Informasi Event -->
    <div class="flex flex-col gap-2 p-3 lg:gap-3 lg:p-6">
      <div>
        <h3
          class="font-bold text-sm text-text-neutral leading-snug line-clamp-2 lg:text-xl lg:line-clamp-none"
        >
          {{ title }}
        </h3>
        <div class="w-8 h-0.5 bg-primary mt-1.5 lg:w-12 lg:mt-2"></div>
      </div>

      <div class="flex flex-col gap-1 text-xs font-medium text-text-alt lg:gap-1.5 lg:text-sm">
        <div class="flex items-center gap-1.5 lg:gap-2">
          <RiMapPinLine class="w-3.5 h-3.5 text-accent shrink-0 lg:w-4 lg:h-4" />
          <span class="truncate lg:whitespace-normal lg:wrap-break-word">
            {{ location || '-' }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 lg:gap-2">
          <RiCalendarEventLine class="w-3.5 h-3.5 text-accent shrink-0 lg:w-4 lg:h-4" />
          <span class="truncate">{{ formattedDateLabel }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
