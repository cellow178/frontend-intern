<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RiArrowRightLine } from '@remixicon/vue'

const props = defineProps<{
  title: string
  content: string
  imgCover: string | null
  author: string
  createdAt: string
  categoryName: string
  slug: string
}>()

const plainContent = computed(() => {
  return props.content.replace(/<[^>]*>/g, '')
})
</script>

<template>
  <RouterLink
    :to="`/berita/${slug}`"
    class="news-glow w-full max-w-3xl mb-10 flex flex-col bg-linear-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-lg outline-2 outline-transparent transition-all duration-300 hover:outline-primary hover:-translate-y-2 md:mb-16 md:flex-row"
  >
    <!-- Gambar -->
    <div v-if="imgCover" class="w-full sm:h-100 md:h-auto md:w-[40%] md:aspect-auto md:shrink-0">
      <img :src="imgCover" class="w-full h-full object-cover" />
    </div>

    <!-- Konten -->
    <div class="flex-1 flex flex-col justify-center gap-2 p-5 md:gap-3 md:p-6">
      <div class="flex items-center gap-2">
        <span
          class="w-fit text-xs font-semibold text-primary bg-secondary px-3 py-1 rounded-md"
        >
          {{ categoryName }}
        </span>
      </div>

      <h3 class="font-bold text-xl text-neutral leading-snug line-clamp-2 md:text-3xl">
        {{ title }}
      </h3>

      <p class="text-xs text-secondary/70 leading-relaxed line-clamp-2 md:text-sm">
        {{ plainContent }}
      </p>

      <div class="flex items-center gap-3 text-xs text-secondary md:gap-4 md:text-sm">
        <span>{{ author }}</span>
        <span>{{ createdAt }}</span>
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
    box-shadow: 0 0px 100px rgba(225, 150, 68, 70%);
  }
}
</style>