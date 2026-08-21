<script setup lang="ts">
import { ref } from 'vue'
import { RiPushpinLine, RiPercentLine, RiArrowDownSLine } from '@remixicon/vue'

defineProps<{
  order: number
  title: string
  description: string
  imgCover: string
  voteCount: number
  percentage: number
}>()

const isDescriptionOpen = ref(false)

const toggleDescription = () => {
  isDescriptionOpen.value = !isDescriptionOpen.value
}
</script>

<template>
  <div
    class="w-full flex flex-col gap-2 text-left bg-neutral rounded-2xl p-4 border-2 border-transparent transition-all duration-300 hover:border-primary hover:shadow-[0_25px_200px_#FF964440] lg:items-center lg:text-center lg:gap-4 lg:p-8 lg:w-90"
  >
    <span class="font-semibold text-sm text-text-alt sm:text-base lg:text-lg"
      >Pilihan #{{ order }}</span
    >

    <div class="flex flex-row items-start gap-4 lg:contents">
      <img
        :src="imgCover"
        class="w-24 h-24 object-cover rounded-xl shrink-0 sm:w-36 sm:h-36 lg:w-56 lg:h-56"
      />

      <div class="flex flex-col gap-1.5 flex-1 min-w-0 lg:contents">
        <h3 class="font-bold text-base text-text-neutral sm:text-2xl">{{ title }}</h3>

        <div class="lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
          <p
            class="text-text-alt text-xs leading-relaxed lg:text-sm lg:leading-relaxed"
            :class="isDescriptionOpen ? '' : 'line-clamp-2 sm:line-clamp-none lg:line-clamp-2'"
          >
            {{ description }}
          </p>

          <button
            type="button"
            class="items-center gap-1 text-primary text-xs font-semibold mt-1 -mx-2 -my-1.5 px-2 py-1.5 rounded-lg hover:bg-primary/10 active:bg-primary/15 transition-colors flex sm:hidden lg:flex lg:text-sm lg:mx-auto lg:mt-1.5"
            @click.stop="toggleDescription"
          >
            {{ isDescriptionOpen ? 'Sembunyikan' : 'Selengkapnya' }}
            <RiArrowDownSLine
              class="w-3.5 h-3.5 transition-transform duration-200 lg:w-4 lg:h-4"
              :class="isDescriptionOpen ? 'rotate-180' : ''"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 w-full pt-1 lg:gap-4 lg:pt-2 lg:mt-auto">
      <div class="flex items-center gap-2 lg:gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 lg:w-11 lg:h-11 lg:rounded-xl"
        >
          <RiPushpinLine class="w-4 h-4 text-primary lg:w-5 lg:h-5" />
        </div>
        <div class="text-left">
          <p class="font-bold text-sm text-text-neutral lg:text-lg">{{ voteCount }}</p>
          <p class="text-xs text-text-alt lg:text-sm">suara</p>
        </div>
      </div>

      <div class="flex items-center gap-2 lg:gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 lg:w-11 lg:h-11 lg:rounded-xl"
        >
          <RiPercentLine class="w-4 h-4 text-primary lg:w-5 lg:h-5" />
        </div>
        <div class="text-left">
          <p class="font-bold text-sm text-text-neutral lg:text-lg">{{ percentage }}%</p>
          <p class="text-xs text-text-alt lg:text-sm">persen</p>
        </div>
      </div>
    </div>
  </div>
</template>
