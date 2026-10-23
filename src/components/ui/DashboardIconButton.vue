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
  RiLockPasswordLine,
  RiUserUnfollowLine,
  RiUserFollowLine,
} from '@remixicon/vue'

export interface IconButtonProps {
  icon?: Component
  variant?: 'info' | 'edit' | 'delete' | 'filter' | 'highlight' | 'reset' | 'status'
  label?: string
  active?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<IconButtonProps>(), {
  variant: 'info',
  label: 'Aksi',
  active: false,
  disabled: false,
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
    case 'reset':
      return RiLockPasswordLine
    case 'status':
      return props.active ? RiUserFollowLine : RiUserUnfollowLine
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
        ? 'bg-primary text-neutral hover:bg-primary/90'
        : 'bg-secondary text-text-neutral hover:bg-secondary/30'
    case 'highlight':
      return props.active
        ? 'bg-warning text-primary hover:bg-warning/90'
        : 'bg-warning/15 text-warning hover:bg-warning/25'
    case 'reset':
      return 'bg-warning/15 text-warning hover:bg-warning/25'
    case 'status':
      return props.active
        ? 'bg-success/15 text-success hover:bg-success/25'
        : 'bg-text-alt/15 text-text-alt hover:bg-text-alt/25'
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
    :disabled="disabled"
    @click="$emit('click', $event)"
    class="w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0"
    :class="[variantClasses, disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer']"
  >
    <component :is="activeIcon" class="w-4 h-4 pointer-events-none" />
  </button>
</template>
