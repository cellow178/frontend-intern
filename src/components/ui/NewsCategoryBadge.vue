<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    categoryName?: string | null
    variant?: 'primary' | 'highlight'
    size?: 'sm' | 'md'
  }>(),
  {
    categoryName: '-',
    variant: 'primary',
    size: 'md',
  },
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'highlight':
      return 'bg-secondary text-primary'
    case 'primary':
    default:
      return 'bg-primary/10 text-primary border border-primary/20'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-[10px] px-2 py-0.5 rounded-sm lg:text-xs lg:px-2.5 lg:py-1'
    case 'md':
    default:
      return 'text-xs px-3 py-1 rounded-md'
  }
})
</script>

<template>
  <span
    class="w-fit inline-flex items-center justify-center font-semibold transition-colors shrink-0"
    :class="[variantClasses, sizeClasses]"
  >
    {{ categoryName || '-' }}
  </span>
</template>
