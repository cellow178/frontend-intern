<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    iconLeft?: Component
    iconRight?: Component
  }>(),
  {
    iconLeft: undefined,
    iconRight: undefined,
  }
)
</script>

<template>
  <button
    class="flex items-center gap-2 bg-primary hover:bg-primary transition-shadow duration-300 text-neutral font-semibold text-2xl px-8 py-2 rounded-full shadow-xl hover:shadow-[0_4px_20px_#FF9644] cursor-pointer"
  >
    <component :is="iconLeft" v-if="iconLeft" class="w-6 h-6" />
    {{ label }}
    <component :is="iconRight" v-if="iconRight" class="w-6 h-6" />
  </button>
</template>