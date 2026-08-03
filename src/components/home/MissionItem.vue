<script setup lang="ts">
defineProps<{
  order: number
  content: string
}>()
</script>

<template>
  <div class="flex gap-8 items-center">
    <span class="text-primary font-light text-4xl leading-none shrink-0 w-8 text-center">
      {{ order }}
    </span>
    <p class="text-lg text-text-neutral leading-relaxed pt-1">
      {{ content }}
    </p>
  </div>
</template>