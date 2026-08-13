<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    type?: 'text' | 'email' | 'number' | 'password' | 'textarea'
    placeholder?: string
    disabledPlaceholder?: string
    disabled?: boolean
    rows?: number
    error?: boolean
  }>(),
  {
    id: undefined,
    type: 'text',
    placeholder: '',
    disabledPlaceholder: '',
    disabled: false,
    rows: 5,
    error: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

watch(
  () => props.disabled,
  (isDisabled) => {
    if (isDisabled) {
      emit('update:modelValue', '')
    }
  },
)
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    :id="id"
    :value="modelValue"
    :placeholder="disabled ? disabledPlaceholder : placeholder"
    :disabled="disabled"
    :rows="rows"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    class="w-full bg-neutral border rounded-2xl px-4 py-3 resize-y disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors"
    :class="error ? 'border-red-500' : 'border-text-alt/30 focus:border-primary'"
  />

  <input
    v-else
    :id="id"
    :type="type"
    :value="modelValue"
    :placeholder="disabled ? disabledPlaceholder : placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="w-full bg-neutral border rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors"
    :class="error ? 'border-red-500' : 'border-text-alt/30 focus:border-primary'"
  />
</template>
