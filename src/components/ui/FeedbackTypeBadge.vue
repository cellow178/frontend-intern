<script setup lang="ts">
import { computed } from 'vue'

export interface TypeBadgeProps {
  type: boolean
}

const props = defineProps<TypeBadgeProps>()

const classes = computed(() => (props.type ? 'bg-info/15 text-info' : 'bg-error/15 text-error'))

const label = computed(() => (props.type ? 'Saran' : 'Kritik'))
</script>

<template>
  <span class="inline-flex px-3 py-1 rounded-full text-xs font-bold" :class="classes">
    {{ label }}
  </span>
</template>
