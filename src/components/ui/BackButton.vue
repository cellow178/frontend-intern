<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RiArrowLeftLine } from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    label?: string
    fallback?: string // path tujuan kalau tidak ada history untuk kembali
    variant?: 'neutral' | 'white'
    animated?: boolean
  }>(),
  {
    label: 'Kembali',
    fallback: '/',
    variant: 'neutral',
    animated: false, // Default false sesuai permintaan (tanpa animasi hover)
  },
)

const router = useRouter()

const goBack = () => {
  // Jika ada history halaman sebelumnya, gunakan router.back(), jika tidak arahkan ke fallback
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push(props.fallback)
  }
}

// Class warna dasar & hover berdasarkan variant
const colorClasses = computed(() => {
  if (props.variant === 'white') {
    return 'text-neutral hover:text-neutral/70'
  }
  return 'text-text-neutral hover:text-primary'
})
</script>

<template>
  <button
    type="button"
    @click="goBack"
    class="flex items-center gap-2 font-medium cursor-pointer select-none"
    :class="[
      colorClasses,
      animated ? 'transition-colors duration-200' : 'transition-none'
    ]"
  >
    <RiArrowLeftLine class="w-5 h-5 shrink-0" />
    <span>{{ label }}</span>
  </button>
</template>