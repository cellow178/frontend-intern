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
    class="w-76 h-82 flex flex-col items-center text-center gap-4 bg-neutral shadow-lg rounded-2xl p-8"
  >
    <component :is="logo" class="w-18 h-18 text-primary" />

    <p class="font-extrabold text-[20px] text-primary leading-snug whitespace-pre-line">
      {{ label }}
    </p>

    <p class="text-text-alt leading-relaxed">
      {{ description }}
    </p>
  </div>
</template>
