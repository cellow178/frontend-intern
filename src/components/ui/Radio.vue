<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean | string
    value: boolean | string
    label: string
    size?: 'normal' | 'large'
    disabled?: boolean
  }>(),
  {
    size: 'large', // Default menggunakan ukuran besar
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string]
}>()

// Class styling berdasarkan ukuran (size)
const circleOuterClasses = computed(() => {
  return props.size === 'normal'
    ? 'w-4 h-4 border-2 sm:w-5 sm:h-5'
    : 'w-5 h-5 border-2 sm:w-6 sm:h-6'
})

const circleInnerClasses = computed(() => {
  return props.size === 'normal' ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'
})

const labelTextClasses = computed(() => {
  return props.size === 'normal' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
})
</script>

<template>
  <label
    class="flex items-center gap-2 sm:gap-3 shrink-0 select-none"
    :class="[disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer']"
  >
    <!-- Custom Radio Circle -->
    <span
      class="rounded-full flex items-center justify-center transition-colors shrink-0"
      :class="[circleOuterClasses, modelValue === value ? 'border-primary' : 'border-text-alt/40']"
    >
      <span
        class="rounded-full bg-primary transition-transform duration-150"
        :class="[circleInnerClasses, modelValue === value ? 'scale-100' : 'scale-0']"
      ></span>
    </span>

    <!-- Native Radio Input (Hidden) -->
    <input
      type="radio"
      class="hidden"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="$emit('update:modelValue', value)"
    />

    <!-- Label Text -->
    <span :class="['text-text-neutral font-medium', labelTextClasses]">
      {{ label }}
    </span>
  </label>
</template>
