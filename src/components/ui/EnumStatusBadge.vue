<script setup lang="ts">
import { computed } from 'vue'

export type NewsStatus = 'draft' | 'publish' | 'archive' | string

export interface NewsStatusBadgeProps {
  status?: NewsStatus
}

const props = withDefaults(defineProps<NewsStatusBadgeProps>(), {
  status: 'draft',
})

const statusConfig = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'publish':
      return {
        label: 'Diterbitkan',
        class: 'bg-success/15 text-success',
      }
    case 'archive':
      return {
        label: 'Diarsipkan',
        class: 'bg-slate-200/70 text-slate-600',
      }
    case 'draft':
    default:
      return {
        label: 'Draft',
        class: 'bg-info/15 text-info',
      }
  }
})
</script>

<template>
  <span
    class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold"
    :class="statusConfig.class"
  >
    {{ statusConfig.label }}
  </span>
</template>
