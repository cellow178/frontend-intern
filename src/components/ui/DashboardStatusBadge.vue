<script setup lang="ts">
import { computed } from 'vue'

export interface StatusBadgeProps {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}

const props = withDefaults(defineProps<StatusBadgeProps>(), {
  activeLabel: 'Aktif',
  inactiveLabel: 'Nonaktif',
})

const classes = computed(() =>
  props.active ? 'bg-success/15 text-success' : 'bg-error/15 text-error',
)

const label = computed(() => (props.active ? props.activeLabel : props.inactiveLabel))
</script>

<template>
  <span
    class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold"
    :class="classes"
  >
    {{ label }}
  </span>
</template>
