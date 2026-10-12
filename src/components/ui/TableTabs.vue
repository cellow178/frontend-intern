<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

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
const tabHeader = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateScrollIndicators = () => {
  const el = tabHeader.value
  if (!el) return

  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

const selectTab = (key: string) => {
  activeTab.value = key
  emit('update:modelValue', key)
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) activeTab.value = val
  },
)

watch(
  () => props.tabs,
  async () => {
    await nextTick()
    updateScrollIndicators()
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  updateScrollIndicators()
  window.addEventListener('resize', updateScrollIndicators)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollIndicators)
})
</script>

<template>
  <div>
    <!-- Tab Header -->
    <div class="relative border-b border-secondary">
      <!-- Indikator Fade Kiri -->
      <div
        v-show="canScrollLeft"
        class="absolute left-0 top-0 bottom-0 z-10 w-6 bg-linear-to-r from-neutral to-transparent pointer-events-none"
      />

      <div
        ref="tabHeader"
        @scroll="updateScrollIndicators"
        class="flex items-center gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
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

      <!-- Indikator Fade Kanan -->
      <div
        v-show="canScrollRight"
        class="absolute right-0 top-0 bottom-0 z-10 w-8 bg-linear-to-l from-neutral to-transparent pointer-events-none"
      />
    </div>

    <!-- Konten Tiap Tab -->
    <div v-for="tab in tabs" :key="tab.key" v-show="activeTab === tab.key">
      <slot :name="tab.key" />
    </div>
  </div>
</template>
