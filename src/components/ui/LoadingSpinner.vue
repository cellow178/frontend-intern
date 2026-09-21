<script setup lang="ts">
import { computed } from 'vue'
import { RiLoader4Line } from '@remixicon/vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'neutral'
  label?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  label: '',
  overlay: false,
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-4 h-4'
    case 'lg':
      return 'w-8 h-8'
    case 'xl':
      return 'w-12 h-12'
    case 'md':
    default:
      return 'w-6 h-6'
  }
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'white':
      return 'text-white'
    case 'neutral':
      return 'text-text-alt'
    case 'primary':
    default:
      return 'text-primary'
  }
})

const labelSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
    case 'xl':
      return 'text-base'
    case 'md':
    default:
      return 'text-sm'
  }
})
</script>

<template>
  <div
    v-if="overlay"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm p-4 transition-all"
  >
    <div
      class="flex flex-col items-center justify-center gap-3 p-6 bg-neutral rounded-2xl shadow-xl max-w-xs text-center"
    >
      <RiLoader4Line class="animate-spin shrink-0" :class="[sizeClasses, colorClasses]" />
      <span
        v-if="label"
        class="font-medium text-text-neutral animate-pulse"
        :class="labelSizeClasses"
      >
        {{ label }}
      </span>
    </div>
  </div>

  <div
    v-else
    class="inline-flex items-center justify-center gap-2.5"
    :class="{ 'flex-col': size === 'xl' || size === 'lg' }"
  >
    <RiLoader4Line class="animate-spin shrink-0" :class="[sizeClasses, colorClasses]" />
    <span v-if="label" class="font-medium text-text-neutral" :class="labelSizeClasses">
      {{ label }}
    </span>
  </div>
</template>
