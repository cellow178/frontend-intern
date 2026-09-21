<script setup lang="ts">
import { RiArrowDownSLine } from '@remixicon/vue'

interface Option {
  value: string | number | null
  label: string
}

withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: Option[]
    placeholder?: string
    error?: boolean
    variant?: 'rounded-full' | 'semi-rounded'
    size?: 'large' | 'normal' | 'mobile'
  }>(),
  {
    placeholder: 'Pilih salah satu',
    error: false,
    variant: 'rounded-full',
    size: 'large',
  },
)

defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const sizeStyles = {
  large: {
    select: 'pl-5 pr-10 py-3 text-base',
    icon: 'w-5 h-5 right-4',
  },
  normal: {
    select: 'pl-3.5 pr-8 py-1.5 text-sm',
    icon: 'w-4 h-4 right-3',
  },
  mobile: {
    select: 'pl-3.5 pr-8 py-1.5 text-sm sm:pl-5 sm:pr-10 sm:py-3 sm:text-base',
    icon: 'w-4 h-4 right-3 sm:w-5 sm:h-5 sm:right-4',
  },
}
</script>

<template>
  <div class="relative w-full">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full appearance-none border bg-neutral text-text-neutral cursor-pointer focus:outline-none transition-colors"
      :class="[
        variant === 'rounded-full' ? 'rounded-full' : 'rounded-xl sm:rounded-2xl',
        error ? 'border-red-500' : 'border-text-alt/30 focus:border-primary',
        sizeStyles[size].select,
      ]"
    >
      <option v-if="placeholder" value="" disabled class="text-text-alt bg-neutral">
        {{ placeholder }}
      </option>
      <option
        v-for="opt in options"
        :key="opt.value ?? 'null'"
        :value="opt.value ?? ''"
        class="text-text-neutral bg-neutral"
      >
        {{ opt.label }}
      </option>
    </select>

    <RiArrowDownSLine
      class="text-text-alt absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all"
      :class="sizeStyles[size].icon"
    />
  </div>
</template>
