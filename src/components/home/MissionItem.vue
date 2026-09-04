<script setup lang="ts">
defineProps<{
  order: number
  content: string
}>()
</script>

<template>
  <div class="border-b border-text-alt/20 lg:border-none pb-6 lg:pb-0 flex gap-4 items-center sm:gap-6 md:gap-8">
    <span
      class="text-primary font-light text-2xl leading-none shrink-0 w-6 text-center sm:text-3xl sm:w-7 lg:text-4xl lg:w-8"
    >
      {{ order }}
    </span>
    <p class="text-sm text-text-neutral leading-relaxed pt-1 sm:text-base lg:text-lg">
      {{ content }}
    </p>
  </div>
</template>
