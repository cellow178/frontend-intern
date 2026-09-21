<script setup lang="ts">
import { ref, watch } from 'vue'

export interface Tab {
  key: string
  label: string
}

const props = defineProps<{
  tabs: Tab[]
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab = ref(props.modelValue ?? props.tabs[0]?.key)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) activeTab.value = val
  },
)

const selectTab = (key: string) => {
  activeTab.value = key
  emit('update:modelValue', key)
}
</script>

<template>
  <div>
    <!-- Tab header -->
    <div
      class="flex items-center gap-1 border-b border-secondary px-4 sm:px-5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="selectTab(tab.key)"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer shrink-0"
        :class="
          activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-text-alt hover:text-text-neutral'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Konten tiap tab, lewat named slot sesuai tab.key -->
    <div v-for="tab in tabs" :key="tab.key" v-show="activeTab === tab.key">
      <slot :name="tab.key" />
    </div>
  </div>
</template>
