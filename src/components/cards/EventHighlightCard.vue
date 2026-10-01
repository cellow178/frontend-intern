<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { RiMapPinFill, RiCalendarEventFill, RiArrowRightLine } from '@remixicon/vue'
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

// State untuk mendeteksi apakah gambar gagal dimuat
const imageError = ref(false)

// Reset state error jika prop imgCover berubah
watch(
  () => props.imgCover,
  () => {
    imageError.value = false
  },
)

// Helper format tanggal tunggal (contoh: "23 Sep 2026")
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

// Computed rentang / tunggal tanggal
const formattedDateLabel = computed(() => {
  if (props.startDate) {
    const startFormatted = formatDate(props.startDate)
    const endFormatted = formatDate(props.endDate)

    if (endFormatted && startFormatted !== endFormatted) {
      return `${startFormatted} - ${endFormatted}`
    }
    return startFormatted
  }

  if (props.dateLabel) {
    return formatDate(props.dateLabel)
  }

  return '-'
})

// Dapatkan URL gambar valid
const imageUrl = computed(() => {
  if (imageError.value) return null
  const url = getFullFileUrl(props.imgCover)
  return url && url.trim() !== '' ? url : null
})

// Handler jika elemen <img> gagal memuat file
const handleImageError = () => {
  imageError.value = true
}
</script>

<template>
  <RouterLink
    :to="`/event/${slug}`"
    class="event-glow group relative w-full max-w-2xl mb-8 flex flex-col bg-linear-to-br from-primary to-accent rounded-xl overflow-hidden shadow-md outline-2 outline-transparent transition-all duration-300 hover:outline-primary md:mb-12 md:h-80"
    :class="{ 'md:flex-row': imageUrl }"
  >
    <!-- Gambar Cover -->
    <div
      v-if="imageUrl"
      class="w-full h-96 md:h-full md:w-56 md:shrink-0 overflow-hidden flex items-center justify-center bg-black/10"
    >
      <img
        :src="imageUrl"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        @error="handleImageError"
      />
    </div>

    <!-- Dekorasi Latar Belakang (Jika Tanpa Gambar) -->
    <div v-else class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"
      ></div>
    </div>

    <!-- Wrapper Konten Utama -->
    <div
      class="relative z-10 flex-1 flex flex-col justify-center transition-all"
      :class="imageUrl ? 'p-5 md:p-7' : 'p-6 md:p-8'"
    >
      <div :class="imageUrl ? 'flex flex-col gap-3' : 'flex flex-col gap-3.5'">
        <!-- Badge Label -->
        <div class="flex items-center">
          <span
            class="inline-flex items-center gap-1.5 rounded-md font-semibold bg-white/20 text-neutral border border-white/20 px-3 py-1 text-xs md:text-sm"
          >
            Highlight Event
          </span>
        </div>

        <!-- Detail Event -->
        <div class="flex flex-col" :class="imageUrl ? 'gap-2.5' : 'gap-2'">
          <h3
            class="font-bold text-neutral leading-snug line-clamp-2"
            :class="imageUrl ? 'text-xl md:text-2xl' : 'text-xl md:text-2xl lg:text-3xl'"
          >
            {{ title }}
          </h3>

          <div class="flex flex-col text-secondary gap-1.5 text-sm md:text-base">
            <div class="flex items-center gap-2">
              <RiMapPinFill class="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
              <span class="line-clamp-1">{{ location || '-' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <RiCalendarEventFill class="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
              <span>{{ formattedDateLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Action Link -->
        <span
          class="flex items-center gap-1.5 font-semibold text-neutral w-fit pt-1 text-sm md:text-base"
        >
          Lihat detail
          <RiArrowRightLine
            class="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
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
    box-shadow: 0 0px 20px rgba(0, 0, 0, 0.06);
  }
  50% {
    filter: brightness(1.03);
    box-shadow: 0 0px 40px rgba(225, 150, 68, 0.35);
  }
}
</style>
