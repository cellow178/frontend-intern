<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RiArrowRightLine } from '@remixicon/vue'
import NewsCategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'

const props = defineProps<{
  slug: string
  title: string
  categoryName?: string
  content?: string
  imgCover?: FileSource | null
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

// Format Tanggal: DD MMM YYYY (misal: 18 Sep 2026)
const formattedDate = computed(() => {
  if (!props.createdAt) return '-'
  const date = new Date(props.createdAt)
  if (isNaN(date.getTime())) return props.createdAt

  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
})
</script>

<template>
  <RouterLink
    :to="`/berita/${slug}`"
    class="news-glow group relative w-full max-w-3xl mb-10 flex flex-col bg-linear-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-lg outline-2 outline-transparent transition-all duration-300 hover:outline-primary md:mb-16 md:flex-row md:items-stretch"
  >
    <!-- Gambar Cover untuk Desktop & Mobile -->
    <div
      v-if="imageUrl"
      class="w-full h-52 sm:h-60 md:h-auto md:w-80 lg:w-88 md:shrink-0 overflow-hidden flex items-center justify-center bg-black/10 relative"
    >
      <img
        :src="imageUrl"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>

    <!-- Dekorasi Latar Belakang (Jika Tanpa Gambar) -->
    <div v-else class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"
      ></div>
    </div>

    <!-- Konten Berita Highlight -->
    <div
      class="relative z-10 flex-1 flex flex-col justify-between transition-all"
      :class="imageUrl ? 'p-5 md:p-7 lg:p-8' : 'p-6 md:p-10'"
    >
      <div class="flex flex-col" :class="imageUrl ? 'gap-2.5 md:gap-3' : 'gap-3 md:gap-4'">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span
            class="inline-flex items-center justify-center rounded-md font-semibold bg-white/20 text-neutral border border-white/20 px-3 py-1.5 text-xs leading-none shrink-0"
          >
            Highlight Berita
          </span>

          <div v-if="categoryName" class="flex items-center">
            <NewsCategoryBadge :category-name="categoryName" variant="highlight" size="md" />
          </div>
        </div>

        <!-- Wrapper Teks Utama -->
        <div class="flex flex-col" :class="imageUrl ? 'gap-2' : 'gap-2.5'">
          <!-- Judul -->
          <h3
            class="font-bold text-neutral leading-snug line-clamp-2"
            :class="imageUrl ? 'text-lg md:text-xl lg:text-2xl' : 'text-xl md:text-2xl lg:text-3xl'"
          >
            {{ title }}
          </h3>

          <!-- Deskripsi/Konten -->
          <p
            v-if="plainContent"
            class="text-secondary/90 leading-relaxed line-clamp-3 text-xs"
            :class="imageUrl ? 'lg:text-sm' : 'md:text-sm'"
          >
            {{ plainContent }}
          </p>
        </div>
      </div>

      <!-- Bagian Bawah: Penulis, Tanggal, & Action Link -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3.5 mt-3.5 border-t border-white/10"
      >
        <div class="flex items-center gap-2.5 text-secondary text-xs">
          <span>{{ author || '-' }}</span>
          <span>•</span>
          <span>{{ formattedDate }}</span>
        </div>

        <span
          class="flex items-center gap-1.5 font-semibold text-neutral text-xs group-hover:translate-x-1 transition-transform w-fit"
        >
          Lihat detail
          <RiArrowRightLine class="w-3.5 h-3.5" />
        </span>
      </div>
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
