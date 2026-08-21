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
    class="flex items-center gap-2 transition-shadow duration-300 font-medium rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    :class="[
      size === 'lg'
        ? 'text-base px-5 py-2 shadow-md md:text-xl md:px-8 md:py-2 md:shadow-xl'
        : 'text-sm px-5 py-2 shadow-sm',

      variant === 'primary'
        ? 'bg-primary hover:bg-primary text-neutral hover:shadow-[0_4px_20px_#FF9644]'
        : 'bg-neutral ring-3 ring-inset hover:bg-neutral text-primary hover:shadow-[0_4px_20px_#FF9644]',
    ]"
  >
    <component
      :is="iconLeft"
      v-if="iconLeft"
      :class="size === 'lg' ? 'w-5 h-5 shrink-0 md:w-6 md:h-6' : 'w-4 h-4 shrink-0'"
    />

    {{ label }}

    <component
      :is="iconRight"
      v-if="iconRight"
      :class="size === 'lg' ? 'w-5 h-5 shrink-0 md:w-6 md:h-6' : 'w-4 h-4 shrink-0'"
    />
  </button>
</template>
