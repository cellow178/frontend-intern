<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RiArrowLeftLine } from '@remixicon/vue'

export interface BackButtonProps {
  label?: string
  fallback?: string
  to?: string
  variant?: 'neutral' | 'white'
  animated?: boolean
  sticky?: boolean
}

const props = withDefaults(defineProps<BackButtonProps>(), {
  label: 'Kembali',
  fallback: '/',
  to: undefined,
  variant: 'neutral',
  animated: false,
  sticky: true,
})

const router = useRouter()

const goBack = () => {
  if (props.to) {
    router.push(props.to)
    return
  }

  if (window.history.length > 1 && window.history.state?.back) {
    router.back()
  } else {
    router.push(props.fallback)
  }
}

const colorClasses = computed(() => {
  if (props.variant === 'white') {
    return 'text-white hover:text-white/80 active:text-white/60'
  }
  return 'text-text-neutral hover:text-primary active:text-primary/80'
})

const positionClasses = computed(() => (props.sticky ? 'lg:sticky lg:top-24 lg:z-10' : ''))
</script>

<template>
  <button
    type="button"
    @click="goBack"
    :aria-label="label"
    class="btn-slide-left-anim inline-flex items-center gap-2 text-sm md:text-base font-medium cursor-pointer py-2 px-1 -ml-1 rounded-lg"
    :class="[colorClasses, positionClasses]"
  >
    <RiArrowLeftLine class="w-5 h-5 shrink-0" />
    <span>{{ label }}</span>
  </button>
</template>
