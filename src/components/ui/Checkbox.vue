<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label: string
    size?: 'normal' | 'large'
    disabled?: boolean
  }>(),
  {
    size: 'normal',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Kotak selalu putih (bg-neutral); status hanya lewat border + centang primary.
// Native checkbox (accent-*) tampil hitam di sebagian browser, jadi digambar manual.
const boxClasses = computed(() => {
  return props.size === 'normal'
    ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2'
    : 'w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2'
})

const iconClasses = computed(() => {
  return props.size === 'normal' ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
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
    <!-- Custom Checkbox Box (selalu putih) -->
    <span
      class="bg-neutral flex items-center justify-center transition-colors shrink-0"
      :class="[boxClasses, modelValue ? 'border-primary' : 'border-text-alt/40']"
    >
      <!-- Centang custom: stroke tebal + ujung rounded (glyph remix terlalu tipis) -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-primary transition-transform duration-150"
        :class="[iconClasses, modelValue ? 'scale-100' : 'scale-0']"
      >
        <path d="M4.5 12.75l5 5 10-11" />
      </svg>
    </span>

    <!-- Native Checkbox Input (Hidden) -->
    <input
      type="checkbox"
      class="hidden"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />

    <!-- Label Text -->
    <span :class="['text-text-neutral font-medium', labelTextClasses]">
      {{ label }}
    </span>
  </label>
</template>
