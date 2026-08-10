<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    type?: 'text' | 'email' | 'number' | 'textarea'
    placeholder?: string
    disabled?: boolean
    rows?: number
  }>(),
  {
    type: 'text',
    placeholder: '',
    disabled: false,
    rows: 5,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    class="w-full bg-neutral border border-text-alt/30 rounded-2xl px-4 py-3 resize-y disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary transition-colors"
  ></textarea>

  <input
    v-else
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="w-full bg-neutral border border-text-alt/30 rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary transition-colors"
  />
</template>
