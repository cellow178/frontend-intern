<script setup lang="ts">
import { RiLoginBoxLine } from '@remixicon/vue'

withDefaults(
  defineProps<{
    label: string
    icon?: boolean
  }>(),
  {
    icon: false,
  }
)
</script>

<template>
  <button
    class="flex items-center gap-2 bg-primary hover:bg-primary transition-shadow duration-300 text-neutral font-semibold text-2xl px-8 py-2 rounded-full shadow-lg hover:shadow-[0_4px_20px_#FF9644] cursor-pointer"
  >
    {{ label }}
    <RiLoginBoxLine v-if="icon" class="w-6 h-6" />
  </button>
</template>