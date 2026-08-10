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
  <label class="flex items-center gap-3 cursor-pointer">
    <span
      class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
      :class="modelValue === value ? 'border-primary' : 'border-text-alt/40'"
    >
      <span
        class="w-3.5 h-3.5 rounded-full bg-primary transition-transform duration-150"
        :class="modelValue === value ? 'scale-100' : 'scale-0'"
      ></span>
    </span>
    <input
      type="radio"
      class="hidden"
      :checked="modelValue === value"
      @change="$emit('update:modelValue', value)"
    />
    <span class="text-lg text-text-neutral">{{ label }}</span>
  </label>
</template>
