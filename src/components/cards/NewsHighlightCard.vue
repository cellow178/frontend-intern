<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RiArrowRightLine } from '@remixicon/vue'
import NewsCategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import { getFullFileUrl } from '@/utils/file'

interface ImgCoverObj {
  ext?: string
  url?: string
  tumbnail_url?: string
  filename?: string
  field_value?: string
}

const props = defineProps<{
  slug: string
  title: string
  categoryName?: string
  content?: string
  imgCover: string | ImgCoverObj | null
  author?: string
  createdAt?: string
}>()

// Format teks polos tanpa tag HTML
const plainContent = computed(() => {
  if (!props.content) return ''
  return props.content.replace(/<[^>]*>/g, '').trim()
})

// Dapatkan URL gambar dari objek atau string imgCover
const imageUrl = computed(() => {
  return getFullFileUrl(props.imgCover)
})

// Format Tanggal: DD/MMM/YYYY (misal: 18/Sep/2026)
const formattedDate = computed(() => {
  if (!props.createdAt) return '-'
  const date = new Date(props.createdAt)
  if (isNaN(date.getTime())) return props.createdAt

  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
})
</script>

<template>
  <RouterLink
    :to="`/berita/${slug}`"
    class="news-glow w-full max-w-3xl mb-10 flex flex-col bg-linear-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-lg outline-2 outline-transparent transition-all duration-300 hover:outline-primary hover:-translate-y-2 md:mb-16"
    :class="{ 'md:flex-row': imageUrl }"
  >
    <!-- Gambar Cover (Hanya tampil jika imageUrl ada) -->
    <div
      v-if="imageUrl"
      class="w-full h-48 sm:h-64 md:h-auto md:w-[40%] md:aspect-auto md:shrink-0 overflow-hidden flex items-center justify-center bg-black/10"
    >
      <img :src="imageUrl" :alt="title" class="w-full h-full object-cover" />
    </div>

    <!-- Konten Berita Highlight -->
    <div class="flex-1 flex flex-col justify-center gap-2 p-5 md:gap-3 md:p-6">
      <div v-if="categoryName" class="flex items-center gap-2">
        <NewsCategoryBadge :category-name="categoryName" variant="highlight" size="md" />
      </div>

      <h3 class="font-bold text-xl text-neutral leading-snug line-clamp-2 md:text-3xl">
        {{ title }}
      </h3>

      <p
        v-if="plainContent"
        class="text-xs text-secondary/80 leading-relaxed line-clamp-2 md:text-sm"
      >
        {{ plainContent }}
      </p>

      <div class="flex items-center gap-3 text-xs text-secondary md:gap-4 md:text-sm">
        <span>{{ author || '-' }}</span>
        <span>•</span>
        <span>{{ formattedDate }}</span>
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
.news-glow {
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
    box-shadow: 0 0px 100px rgba(225, 150, 68, 0.7);
  }
}
</style>
