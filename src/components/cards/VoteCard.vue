<script setup lang="ts">
import { RiPushpinLine, RiPercentLine } from '@remixicon/vue'

defineProps<{
  order: number
  title: string
  description: string
  imgCover: string
  voteCount: number
  percentage: number
}>()
</script>

<template>
  <div
    class="w-90 flex flex-col items-center text-center gap-4 bg-neutral rounded-2xl p-8 border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_25px_200px_#FF964440] hover:-translate-y-2"
  >
    <span class="font-semibold text-lg text-text-alt">Pilihan #{{ order }}</span>

    <img :src="imgCover" class="w-50 h-50 object-cover rounded-xl" />

    <h3 class="font-bold text-xl text-text-neutral">{{ title }}</h3>

    <p class="text-text-alt text-sm leading-relaxed flex-1">{{ description }}</p>

    <div class="grid grid-cols-2 gap-4 w-full mt-auto pt-2">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <RiPushpinLine class="w-5 h-5 text-primary" />
        </div>
        <div class="text-left">
          <p class="font-bold text-lg text-text-neutral">{{ voteCount }}</p>
          <p class="text-sm text-text-alt">suara</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <RiPercentLine class="w-5 h-5 text-primary" />
        </div>
        <div class="text-left">
          <p class="font-bold text-lg text-text-neutral">{{ percentage }}%</p>
          <p class="text-sm text-text-alt">persen</p>
        </div>
      </div>
    </div>
  </div>
</template>
