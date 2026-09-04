<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from '@/components/ui/Button.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 class="text-9xl font-extrabold text-slate-300">404</h1>
    <h2 class="text-3xl font-bold text-slate-800 mt-4">Halaman Tidak Ditemukan</h2>
    <p class="text-slate-600 mt-2 max-w-md">
      Maaf, halaman yang kamu cari tidak ada atau mungkin sudah dipindahkan.
    </p>
    <RouterLink to="/">
      <Button label="Kembali ke Beranda" class="mt-6" variant="primary" />
    </RouterLink>
  </div>
</template>
