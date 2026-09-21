<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  RiInformationLine,
  RiEditBoxLine,
  RiDeleteBinLine,
  RiFilter3Line,
  RiStarLine,
  RiStarFill,
} from '@remixicon/vue'

export interface IconButtonProps {
  icon?: Component
  variant?: 'info' | 'edit' | 'delete' | 'filter' | 'highlight'
  label?: string
  active?: boolean
}

const props = withDefaults(defineProps<IconButtonProps>(), {
  variant: 'info',
  label: 'Aksi',
  active: false,
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const activeIcon = computed(() => {
  if (props.icon) return props.icon

  switch (props.variant) {
    case 'edit':
      return RiEditBoxLine
    case 'delete':
      return RiDeleteBinLine
    case 'filter':
      return RiFilter3Line
    case 'highlight':
      return props.active ? RiStarFill : RiStarLine
    case 'info':
    default:
      return RiInformationLine
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'edit':
      return 'bg-primary/15 text-primary hover:bg-primary/25'
    case 'delete':
      return 'bg-error/15 text-error hover:bg-error/25'
    case 'filter':
      return props.active
        ? 'bg-primary text-white hover:bg-primary/90'
        : 'bg-secondary/20 text-text-neutral hover:bg-secondary/40'
    case 'highlight':
      return props.active
        ? 'bg-warning text-primary hover:bg-warning/90'
        : 'bg-warning/15 text-warning hover:bg-warning/25'
    case 'info':
    default:
      return 'bg-info/15 text-info hover:bg-info/25'
  }
})
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    @click="$emit('click', $event)"
    class="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
    :class="variantClasses"
  >
    <component :is="activeIcon" class="w-4 h-4 pointer-events-none" />
  </button>
</template>
