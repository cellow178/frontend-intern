<script setup lang="ts">
</script>

<template>
  <div class="max-w-4xl mx-auto animate-pulse">
    <!-- Skeleton Judul -->
    <div class="h-8 bg-neutral-200 rounded-lg w-3/4 mx-auto my-4 sm:h-10"></div>

    <!-- Skeleton Metadata (Lokasi & Waktu) -->
    <div class="flex flex-col items-center gap-2.5 my-6 sm:mb-8">
      <div class="h-4 bg-neutral-200 rounded-md w-48"></div>
      <div class="h-4 bg-neutral-200 rounded-md w-56"></div>
    </div>

    <!-- Skeleton Gambar Cover -->
    <div class="mb-8 sm:mb-12 flex justify-center">
      <div
        class="w-full max-w-2xl sm:max-w-3xl h-64 sm:h-96 bg-neutral-200 rounded-xl sm:rounded-2xl"
      ></div>
    </div>

    <!-- Skeleton Paragraf / Konten -->
    <div class="space-y-3 max-w-3xl mx-auto">
      <div class="h-4 bg-neutral-200 rounded-md w-full"></div>
      <div class="h-4 bg-neutral-200 rounded-md w-11/12"></div>
      <div class="h-4 bg-neutral-200 rounded-md w-4/5"></div>
      <div class="h-4 bg-neutral-200 rounded-md w-9/12"></div>
    </div>
  </div>
</template>
