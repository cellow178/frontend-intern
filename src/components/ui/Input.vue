<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Component } from 'vue'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'tel' | 'url' | 'date'
    placeholder?: string
    disabledPlaceholder?: string
    disabled?: boolean
    rows?: number
    error?: boolean
    icon?: Component
    iconPosition?: 'left' | 'right'
    variant?: 'rounded-full' | 'semi-rounded'
    size?: 'large' | 'normal' | 'mobile'
    min?: string
    max?: string
  }>(),
  {
    id: undefined,
    type: 'text',
    placeholder: '',
    disabledPlaceholder: '',
    disabled: false,
    rows: 5,
    error: false,
    icon: undefined,
    iconPosition: 'left',
    variant: 'semi-rounded',
    size: 'large',
    min: undefined,
    max: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isPasswordVisible = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

// Buka date picker bawaan browser ketika area input diklik
const handleInputClick = () => {
  if (props.type === 'date' && inputRef.value && 'showPicker' in inputRef.value) {
    try {
      inputRef.value.showPicker()
    } catch {
      // Fallback jika browser tidak mendukung showPicker()
    }
  }
}

watch(
  () => props.disabled,
  (isDisabled) => {
    if (isDisabled) {
      emit('update:modelValue', '')
    }
  },
)

const sizeStyles = {
  large: {
    input: 'py-2.5 sm:py-3 text-sm sm:text-base',
    padX: 'px-3.5 sm:px-4',
    padXIconLeft: 'pl-11 pr-4',
    padXIconRight: 'pl-4 pr-11',
    icon: 'w-5 h-5',
    iconPos: { left: 'left-4', right: 'right-4' },
  },
  normal: {
    input: 'py-1.5 sm:py-2 text-xs sm:text-sm',
    padX: 'px-3 sm:px-3.5',
    padXIconLeft: 'pl-8 pr-3.5',
    padXIconRight: 'pl-3.5 pr-8',
    icon: 'w-4 h-4',
    iconPos: { left: 'left-3', right: 'right-3' },
  },
  mobile: {
    input: 'py-1.5 text-xs sm:py-2 sm:text-sm',
    padX: 'px-2.5 sm:px-3',
    padXIconLeft: 'pl-8 pr-3.5 sm:pl-9 sm:pr-4',
    padXIconRight: 'pl-3.5 pr-8 sm:pl-4 sm:pr-9',
    icon: 'w-4 h-4',
    iconPos: { left: 'left-2.5 sm:left-3', right: 'right-2.5 sm:right-3' },
  },
}

const currentSize = computed(() => sizeStyles[props.size])

const inputPaddingClass = computed(() => {
  if (props.type === 'password') {
    return props.icon && props.iconPosition === 'left'
      ? currentSize.value.padXIconLeft
      : currentSize.value.padXIconRight
  }

  if (!props.icon) return currentSize.value.padX
  return props.iconPosition === 'right'
    ? currentSize.value.padXIconRight
    : currentSize.value.padXIconLeft
})

const iconPositionClass = computed(() => currentSize.value.iconPos[props.iconPosition])

const radiusClass = computed(() =>
  props.variant === 'rounded-full' ? 'rounded-full' : 'rounded-lg sm:rounded-xl',
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
    class="w-full bg-neutral border px-3 py-2.5 text-sm resize-y disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors sm:px-4 sm:py-3 sm:text-base"
    :class="[
      error ? 'border-error' : 'border-text-alt/30 focus:border-primary',
      variant === 'rounded-full' ? 'rounded-2xl' : 'rounded-xl sm:rounded-2xl',
    ]"
  />

  <div v-else class="relative w-full">
    <!-- Icon Left/Right bawaan -->
    <component
      :is="icon"
      v-if="icon && type !== 'password'"
      class="text-text-alt absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all"
      :class="[currentSize.icon, iconPositionClass]"
    />

    <!-- Icon Left khusus jika type="password" & ada custom icon -->
    <component
      :is="icon"
      v-if="icon && type === 'password' && iconPosition === 'left'"
      class="text-text-alt absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all"
      :class="[currentSize.icon, currentSize.iconPos.left]"
    />

    <input
      ref="inputRef"
      :id="id"
      :type="computedType"
      :value="modelValue"
      :placeholder="disabled ? disabledPlaceholder : placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      @click="handleInputClick"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full appearance-none border bg-neutral text-text-neutral disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors"
      :class="[
        radiusClass,
        error ? 'border-error' : 'border-text-alt/30 focus:border-primary',
        currentSize.input,
        inputPaddingClass,
        type === 'date' ? 'cursor-pointer date-input-picker' : '',
      ]"
    />

    <!-- Toggle Password Eye Button -->
    <button
      v-if="type === 'password'"
      type="button"
      @click="togglePasswordVisibility"
      class="absolute top-1/2 -translate-y-1/2 text-text-alt hover:text-primary transition-colors cursor-pointer"
      :class="currentSize.iconPos.right"
      tabindex="-1"
    >
      <RiEyeLine v-if="isPasswordVisible" :class="currentSize.icon" />
      <RiEyeOffLine v-else :class="currentSize.icon" />
    </button>
  </div>
</template>

<style scoped>
.date-input-picker::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: opacity(0.6);
  transition: filter 0.2s ease;
}

.date-input-picker::-webkit-calendar-picker-indicator:hover {
  filter: opacity(1);
}
</style>
