<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  slug: string
  title: string
  categoryName: string
  content: string
  imgCover: string | null
  author: string
  createdAt: string
}>()

const plainContent = computed(() => {
  return props.content.replace(/<[^>]*>/g, '')
})
</script>

<template>
  <RouterLink
    :to="`/berita/${slug}`"
    class="w-full flex flex-col bg-neutral rounded-xl overflow-hidden border-2 border-transparent shadow-sm transition-all duration-300 hover:border-primary hover:shadow-[0_0_100px_#FF964440] lg:w-80 lg:rounded-2xl"
  >
    <!-- Header: author + tanggal -->
    <div
      class="flex items-center justify-between px-3 py-2.5 text-xs text-text-neutral lg:px-5 lg:py-4 lg:text-sm"
    >
      <span class="truncate">{{ author }}</span>
      <span class="shrink-0">{{ createdAt }}</span>
    </div>

    <!-- Gambar -->
    <div
      class="h-32 w-full sm:h-40 lg:h-48"
      :class="!imgCover ? 'bg-linear-to-b from-primary to-accent' : ''"
    >
      <img v-if="imgCover" :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex flex-col gap-2 p-3 lg:p-5">
      <span
        class="w-fit text-[10px] font-semibold text-primary bg-secondary px-2 py-1 rounded-md lg:text-xs lg:p-2"
      >
        {{ categoryName }}
      </span>

      <h3
        class="font-bold text-sm text-text-neutral leading-snug line-clamp-2 lg:text-lg lg:line-clamp-3"
      >
        {{ title }}
      </h3>
      <p class="text-xs text-text-alt leading-relaxed line-clamp-2 lg:text-sm lg:line-clamp-3">
        {{ plainContent }}
      </p>
    </div>
  </RouterLink>
</template>
