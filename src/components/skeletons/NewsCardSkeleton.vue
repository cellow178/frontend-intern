<script setup lang="ts">
// Komponen Skeleton untuk kartu berita tunggal
</script>

<template>
  <div
    class="w-full flex flex-col bg-text-alt/5 rounded-xl overflow-hidden border border-text-alt/10 animate-pulse lg:w-80 lg:rounded-2xl"
  >
    <!-- Header Skeleton (Author & Date) -->
    <div class="flex items-center justify-between px-3 py-2.5 lg:px-5 lg:py-4">
      <div class="h-3 w-1/3 bg-text-alt/15 rounded lg:h-4"></div>
      <div class="h-3 w-1/4 bg-text-alt/15 rounded lg:h-4"></div>
    </div>

    <!-- Image Cover Skeleton -->
    <div class="h-32 w-full bg-text-alt/15 sm:h-40 lg:h-48"></div>

    <!-- Content Body Skeleton -->
    <div class="flex flex-col gap-2 p-3 lg:p-5">
      <!-- Category Badge Skeleton -->
      <div class="h-4 w-16 bg-text-alt/15 rounded-md lg:h-6 lg:w-20"></div>

      <!-- Title Skeleton -->
      <div class="space-y-1 pt-1">
        <div class="h-4 w-full bg-text-alt/15 rounded lg:h-5"></div>
        <div class="h-4 w-3/4 bg-text-alt/15 rounded lg:h-5"></div>
      </div>

      <!-- Description Skeleton -->
      <div class="space-y-1.5 pt-1">
        <div class="h-3 w-full bg-text-alt/15 rounded lg:h-3.5"></div>
        <div class="h-3 w-4/5 bg-text-alt/15 rounded lg:h-3.5"></div>
      </div>
    </div>
  </div>
</template>
