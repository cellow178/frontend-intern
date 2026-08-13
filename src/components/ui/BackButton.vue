<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RiArrowLeftLine } from '@remixicon/vue'

withDefaults(
  defineProps<{
    label?: string
    fallback?: string // path tujuan kalau tidak ada history untuk kembali
  }>(),
  {
    label: 'Kembali',
    fallback: '/',
  },
)

const router = useRouter()

const goBack = () => {
  // window.history.state.back null berarti tidak ada halaman sebelumnya
  // (misal user buka link ini langsung / refresh), jadi arahkan ke fallback
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <button
    @click="goBack"
    class="flex items-center gap-2 text-text-neutral font-medium hover:text-primary transition-colors cursor-pointer"
  >
    <RiArrowLeftLine class="w-5 h-5" />
    {{ label }}
  </button>
</template>