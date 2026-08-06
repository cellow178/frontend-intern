<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  slug: string
  title: string
  summary: string // HTML string API
  imgCover: string | null
  author: string
  createdAt: string
}>()

// erase html tag, display as plain text
const plainSummary = computed(() => {
  return props.summary.replace(/<[^>]*>/g, '')
})
</script>

<template>
  <RouterLink
    :to="`/berita/${slug}`"
    class="w-80 flex flex-col bg-neutral rounded-2xl overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_0_100px_#FF964440]"
  >
    <!-- Header: author + tanggal -->
    <div class="flex items-center justify-between px-5 py-4 text-sm text-text-neutral">
      <span>{{ author }}</span>
      <span>{{ createdAt }}</span>
    </div>

    <!-- Gambar / gradient fallback -->
    <div class="h-48 w-full" :class="!imgCover ? 'bg-linear-to-b from-primary to-accent' : ''">
      <img v-if="imgCover" :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex flex-col gap-2 p-5">
      <h3 class="font-bold text-lg text-text-neutral leading-snug line-clamp-3">
        {{ title }}
      </h3>
      <p class="text-sm text-text-alt leading-relaxed line-clamp-4">
        {{ plainSummary }}
      </p>
    </div>
  </RouterLink>
</template>