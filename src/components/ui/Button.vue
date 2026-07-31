<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    iconLeft?: Component
    iconRight?: Component
    variant?: 'primary' | 'neutral'
  }>(),
  {
    iconLeft: undefined,
    iconRight: undefined,
    variant: 'primary',
  },
)
</script>

<template>
  <button
    class="flex items-center gap-2 transition-shadow duration-300 font-medium text-2xl px-8 py-2 rounded-full shadow-xl cursor-pointer"
    :class="
      variant === 'primary'
        ? 'bg-primary hover:bg-primary text-neutral hover:shadow-[0_4px_20px_#FF9644]'
        : 'bg-neutral ring-3 ring-inset hover:bg-neutral text-primary hover:shadow-[0_4px_20px_#FF9644]'
    "
  >
    <component :is="iconLeft" v-if="iconLeft" class="w-6 h-6" />
    {{ label }}
    <component :is="iconRight" v-if="iconRight" class="w-6 h-6" />
  </button>
</template>
