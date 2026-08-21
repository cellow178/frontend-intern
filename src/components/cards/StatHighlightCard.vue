<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  logo: Component
  label: string
  description: string
}>()
</script>

<template>
  <div
    class="w-full max-w-96 flex flex-col items-start gap-4 bg-neutral shadow-md rounded-2xl p-4 sm:max-w-none sm:flex-1 sm:min-w-0 sm:p-4 sm:gap-2.5 sm:items-center sm:text-center md:p-5 md:gap-3 lg:w-76 lg:flex-none lg:p-8 lg:gap-4"
  >
    <div class="flex flex-row gap-4 items-center sm:flex-col sm:gap-4 sm:items-center sm:text-center">
      <component
        :is="logo"
        class="w-12 h-12 text-primary sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-18 lg:h-18"
      />

      <p
        class="font-extrabold text-lg text-primary leading-snug whitespace-pre-line sm:text-base md:text-lg lg:text-2xl"
      >
        {{ label }}
      </p>
    </div>

    <p class="text-sm text-text-alt leading-relaxed lg:text-base">
      {{ description }}
    </p>
  </div>
</template>
