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
    variant?: 'full' | 'square'
  }>(),
  {
    placeholder: 'Pilih salah satu',
    error: false,
    variant: 'full',
  },
)

defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()
</script>

<template>
  <div class="relative w-full">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full appearance-none border pl-5 pr-10 py-3 bg-neutral text-text-neutral cursor-pointer focus:outline-none transition-colors"
      :class="[
        variant === 'full' ? 'rounded-full' : 'rounded-2xl',
        error ? 'border-red-500' : 'border-text-alt/30 focus:border-primary',
      ]"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value ?? 'null'" :value="opt.value ?? ''">
        {{ opt.label }}
      </option>
    </select>

    <RiArrowDownSLine
      class="w-5 h-5 text-text-alt absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
    />
  </div>
</template>