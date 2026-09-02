<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    iconLeft?: Component
    iconRight?: Component
    variant?: 'primary' | 'neutral'
    size?: 'lg' | 'sm'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    iconLeft: undefined,
    iconRight: undefined,
    variant: 'primary',
    size: 'lg',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="btn-press-anim flex items-center justify-center gap-2 font-medium rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    :class="[
      size === 'lg'
        ? 'text-base px-5 py-2.5 shadow-md md:text-lg md:px-8 md:py-3 md:shadow-xl'
        : 'text-sm px-4 py-2 shadow-sm',

      variant === 'primary'
        ? 'bg-primary hover:bg-primary text-neutral hover:shadow-[0_4px_20px_#FF9644]'
        : 'bg-neutral ring-3 ring-inset ring-primary hover:bg-neutral text-primary hover:shadow-[0_4px_20px_#FF9644]',
    ]"
  >
    <component
      :is="iconLeft"
      v-if="iconLeft"
      :class="size === 'lg' ? 'w-5 h-5 shrink-0 md:w-6 md:h-6' : 'w-4 h-4 shrink-0'"
    />

    <span>{{ label }}</span>

    <component
      :is="iconRight"
      v-if="iconRight"
      :class="size === 'lg' ? 'w-5 h-5 shrink-0 md:w-6 md:h-6' : 'w-4 h-4 shrink-0'"
    />
  </button>
</template>
