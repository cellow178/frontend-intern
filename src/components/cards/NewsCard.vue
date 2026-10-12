<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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

// Format Tanggal: DD/MMM/YYYY (misal: 18 Sep 2026)
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
    class="group flex w-full flex-col overflow-hidden rounded-xl border-2 border-transparent bg-neutral pb-2 transition-all duration-300 hover:border-primary lg:w-80 lg:rounded-2xl"
  >
    <!-- Header: Author & Tanggal -->
    <div
      class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-text-neutral lg:px-5 lg:py-4"
    >
      <span class="min-w-0 truncate">{{ author || '-' }}</span>
      <span class="shrink-0">{{ formattedDate }}</span>
    </div>

    <!-- Gambar Cover -->
    <div
      class="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden bg-text-alt/10 sm:h-32 lg:h-48"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-text-alt/50">
        <i class="ri-image-line text-3xl"></i>
      </div>
    </div>

    <!-- Informasi Berita -->
    <div class="flex flex-col gap-2 p-3 lg:gap-3 lg:p-5">
      <NewsCategoryBadge
        v-if="categoryName"
        :category-name="categoryName"
        variant="primary"
        size="md"
      />

      <h3
        class="line-clamp-2 text-base font-bold leading-snug text-text-neutral lg:line-clamp-3 lg:text-lg"
      >
        {{ title }}
      </h3>

      <p v-if="plainContent" class="line-clamp-3 text-xs leading-relaxed text-text-alt lg:text-sm">
        {{ plainContent }}
      </p>
    </div>
  </RouterLink>
</template>
