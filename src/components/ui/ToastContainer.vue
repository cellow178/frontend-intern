<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'
import { RiCheckboxCircleFill, RiCloseCircleFill, RiInformationFill } from '@remixicon/vue'

const route = useRoute()
const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

const topPositionClass = computed(() => (route.meta.hasNavbar === false ? 'top-4 sm:top-6' : 'top-20 sm:top-24'))

const borderClass = {
  success: 'border-success',
  error: 'border-error',
  info: 'border-primary',
}

const iconClass = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-primary',
}
</script>

<template>
  <!-- Wrapper dibuat fleksibel: rata tengah & lebar penuh di mobile, kanan atas di desktop -->
  <div 
    class="fixed inset-x-4 sm:inset-x-auto sm:right-6 lg:right-8 z-200 flex flex-col items-center sm:items-end gap-2.5 sm:gap-3 pointer-events-none"
    :class="topPositionClass"
  >
    <TransitionGroup name="toast" tag="div" class="w-full flex flex-col items-center sm:items-end gap-2.5 sm:gap-3">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto bg-neutral border-2 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-lg w-full sm:w-auto max-w-full sm:max-w-sm"
        :class="borderClass[toast.type]"
      >
        <RiCheckboxCircleFill
          v-if="toast.type === 'success'"
          class="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
          :class="iconClass[toast.type]"
        />
        <RiCloseCircleFill
          v-else-if="toast.type === 'error'"
          class="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
          :class="iconClass[toast.type]"
        />
        <RiInformationFill v-else class="w-5 h-5 sm:w-6 sm:h-6 shrink-0" :class="iconClass[toast.type]" />

        <p class="text-text-neutral text-xs sm:text-sm font-medium leading-snug wrap-break-word">
          {{ toast.message }}
        </p>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

/* Animasi slide dari atas di mobile, slide dari kanan di desktop */
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (min-width: 640px) {
  .toast-enter-from,
  .toast-leave-to {
    transform: translateX(20px);
  }
}
</style>