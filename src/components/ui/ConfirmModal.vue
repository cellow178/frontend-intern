<script setup lang="ts">
import { RiAlertLine } from '@remixicon/vue'

defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-neutral/50 backdrop-blur-sm"
      @click.self="emit('cancel')"
    >
      <div
        class="bg-neutral rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 border border-secondary"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0"
          >
            <RiAlertLine class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-text-neutral">
            {{ title || 'Konfirmasi Tindakan' }}
          </h3>
        </div>

        <p class="text-sm text-text-alt leading-relaxed">
          {{ message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?' }}
        </p>

        <div class="flex items-center justify-end gap-3 mt-2">
          <button
            type="button"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl text-sm font-medium text-text-neutral bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
            @click="emit('cancel')"
          >
            {{ cancelText || 'Batal' }}
          </button>
          <button
            type="button"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl text-sm font-medium bg-error text-neutral hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            @click="emit('confirm')"
          >
            <span v-if="isLoading">Proses...</span>
            <span v-else>{{ confirmText || 'Hapus' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
