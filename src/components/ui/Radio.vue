<script setup lang="ts">
defineProps<{
  modelValue: boolean | string
  value: boolean | string
  label: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean | string]
}>()
</script>

<template>
  <label class="flex items-center gap-2 cursor-pointer sm:gap-3">
    <span
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 sm:w-6 sm:h-6"
      :class="modelValue === value ? 'border-primary' : 'border-text-alt/40'"
    >
      <span
        class="w-3 h-3 rounded-full bg-primary transition-transform duration-150 sm:w-3.5 sm:h-3.5"
        :class="modelValue === value ? 'scale-100' : 'scale-0'"
      ></span>
    </span>
    <input
      type="radio"
      class="hidden"
      :checked="modelValue === value"
      @change="$emit('update:modelValue', value)"
    />
    <span class="text-base text-text-neutral sm:text-lg">{{ label }}</span>
  </label>
</template>
