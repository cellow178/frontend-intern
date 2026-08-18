<script setup lang="ts">
import { RiArrowRightLine } from '@remixicon/vue'
import { RouterLink } from 'vue-router'

defineProps<{
  imgLogo: string
  code: string
  majorName: string
  summary: string
  slug: string
}>()
</script>

<template>
  <RouterLink
    :to="`/jurusan/${slug}`"
    class="flex flex-col gap-4 bg-secondary rounded-2xl p-6 border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_0_200px_#FF964440]"
  >
    <div class="flex items-center gap-3">
      <img :src="imgLogo" class="w-10 h-10 object-contain" />
      <span class="font-extrabold text-2xl text-text-alt">{{ code }}</span>
    </div>

    <div>
      <h3 class="font-bold text-lg text-text-alt mb-2">{{ majorName }}</h3>
      <p class="text-text-alt/80 leading-relaxed">{{ summary }}</p>
    </div>

    <div class="flex items-center gap-1 text-accent font-medium mt-auto pt-2 group">
      Lihat detail
      <RiArrowRightLine class="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </div>
  </RouterLink>
</template>
