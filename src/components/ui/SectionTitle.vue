<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-2 md:gap-3">
    <h2 class="font-extrabold text-3xl text-text-neutral text-center sm:text-4xl lg:text-5xl">
      {{ title }}
    </h2>
    <div class="w-20 h-1 bg-primary rounded-full lg:w-30"></div>
  </div>
</template>
