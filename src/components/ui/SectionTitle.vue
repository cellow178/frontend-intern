<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <h2 class="font-extrabold text-5xl text-text-neutral text-center">
      {{ title }}
    </h2>
    <div class="w-30 h-1 bg-primary rounded-full"></div>
  </div>
</template>