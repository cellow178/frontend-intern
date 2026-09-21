<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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
    class="w-full flex flex-col bg-neutral rounded-xl overflow-hidden border-2 border-transparent shadow-sm transition-all duration-300 hover:border-primary hover:shadow-[0_0_100px_#FF964440] lg:w-80 lg:rounded-2xl"
  >
    <!-- Header: Author & Tanggal -->
    <div
      class="flex items-center justify-between px-3 py-2.5 text-xs text-text-neutral lg:px-5 lg:py-4 lg:text-sm"
    >
      <span class="truncate">{{ author || '-' }}</span>
      <span class="shrink-0">{{ formattedDate }}</span>
    </div>

    <!-- Gambar Cover -->
    <div
      class="h-32 w-full sm:h-40 lg:h-48 overflow-hidden flex items-center justify-center bg-linear-to-b from-primary to-accent"
    >
      <img v-if="imageUrl" :src="imageUrl" :alt="title" class="w-full h-full object-cover" />
    </div>

    <!-- Informasi Berita -->
    <div class="flex flex-col gap-2 p-3 lg:p-5">
      <NewsCategoryBadge
        v-if="categoryName"
        :category-name="categoryName"
        variant="primary"
        size="sm"
      />

      <h3
        class="font-bold text-sm text-text-neutral leading-snug line-clamp-2 lg:text-lg lg:line-clamp-3"
      >
        {{ title }}
      </h3>

      <p v-if="plainContent" class="text-xs text-text-alt leading-relaxed line-clamp-3 lg:text-sm">
        {{ plainContent }}
      </p>
    </div>
  </RouterLink>
</template>
