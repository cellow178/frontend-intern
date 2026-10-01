<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RiArrowRightLine } from '@remixicon/vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'

defineProps<{
  imgLogo: FileSource
  code: string
  majorName: string
  summary: string
  slug: string
}>()
</script>

<template>
  <RouterLink
    :to="`/jurusan/${slug}`"
    class="flex flex-col gap-2 sm:gap-4 bg-secondary rounded-xl p-4 sm:p-5 lg:p-6 border border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_0_200px_#FF964440] group active:scale-97"
  >
    <!-- Header Logo & Kode -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <img
        :src="getFullFileUrl(imgLogo) || '/placeholder-logo.png'"
        :alt="majorName"
        class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain"
      />
      <span class="font-extrabold text-base sm:text-xl lg:text-2xl text-text-alt">{{ code }}</span>
    </div>

    <!-- Judul & Deskripsi -->
    <div class="flex-1 flex flex-col">
      <h3 class="font-bold text-xs sm:text-base lg:text-lg text-text-alt mb-2">
        {{ majorName }}
      </h3>
      <p
        class="text-xs font-medium sm:text-sm lg:text-base text-text-alt/80 leading-relaxed line-clamp-3 sm:line-clamp-4 lg:line-clamp-none"
      >
        {{ summary }}
      </p>
    </div>

    <!-- 'Lihat detail' (Tablet ke atas) -->
    <div
      class="hidden lg:flex items-center gap-1 text-accent text-xs lg:text-base font-medium mt-auto pt-2"
    >
      <span>Lihat detail</span>
      <RiArrowRightLine
        class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
      />
    </div>
  </RouterLink>
</template>
