<script setup lang="ts">
import { RiAlertLine } from '@remixicon/vue'
import AdminButton from '@/components/ui/AdminButton.vue'

defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary'
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
        class="bg-neutral rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 border border-secondary"
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

        <slot />

        <div class="flex items-center justify-end gap-2 mt-2">
          <AdminButton
            size="sm"
            variant="secondary"
            :label="cancelText || 'Batal'"
            :disabled="isLoading"
            @click="emit('cancel')"
          />
          <AdminButton
            size="sm"
            :variant="confirmVariant === 'primary' ? 'primary' : 'danger'"
            :label="confirmText || 'Hapus'"
            :loading="isLoading"
            @click="emit('confirm')"
          />
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
