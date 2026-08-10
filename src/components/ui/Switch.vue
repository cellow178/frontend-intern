<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
    class="w-12 h-7 rounded-full transition-colors duration-300 relative shrink-0"
    :class="modelValue ? 'bg-primary' : 'bg-text-alt/30'"
  >
    <span
      class="absolute top-1 left-1 w-5 h-5 rounded-full bg-neutral transition-transform duration-300"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    ></span>
  </button>
</template>
