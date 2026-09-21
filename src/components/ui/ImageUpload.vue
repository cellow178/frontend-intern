<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { RiImageAddLine, RiCloseLine, RiLoader4Line, RiZoomInLine } from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | File | null
    previewUrl?: string | null
    aspectRatio?: 'rectangle' | 'square'
    maxSizeMB?: number
  }>(),
  {
    previewUrl: null,
    aspectRatio: 'rectangle',
    maxSizeMB: 5,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'update:previewUrl': [value: string | null]
}>()

const toastStore = useToastStore()
const isUploading = ref(false)
const isZoomOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Pengecekan apakah gambar sedang ada (baik dari previewUrl ATAU modelValue)
const hasImage = computed(() => {
  return !!(props.previewUrl || props.modelValue)
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    toastStore.show('Format file harus JPEG, JPG, atau PNG.', 'error')
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }

  const maxSizeBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    toastStore.show(`Ukuran file maksimal ${props.maxSizeMB} MB.`, 'error')
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const result = response.data.data ?? response.data

    // Emit path untuk modelValue dan url untuk previewUrl
    emit('update:modelValue', result.path || result.field_value || null)
    emit('update:previewUrl', result.url || null)
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal mengunggah gambar.', 'error')
  } finally {
    isUploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const handleRemove = () => {
  // Reset input file fisik jika ada
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  // Paksa emit null ke parent
  emit('update:modelValue', null)
  emit('update:previewUrl', null)
}

const openZoomModal = () => {
  isZoomOpen.value = true
}

const closeZoomModal = () => {
  isZoomOpen.value = false
}
</script>

<template>
  <div class="flex flex-col gap-2 max-w-sm">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg, image/jpg, image/png"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Menggunakan hasImage bukan hanya previewUrl -->
    <div
      v-if="hasImage"
      class="group relative overflow-hidden rounded-xl border border-text-alt/20 bg-secondary/10"
      :class="[aspectRatio === 'square' ? 'aspect-square w-48' : 'aspect-video w-full']"
    >
      <img
        :src="previewUrl || (typeof modelValue === 'string' ? modelValue : '')"
        alt="Preview"
        class="w-full h-full object-cover"
      />

      <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
        <button
          type="button"
          class="w-7 h-7 rounded-full bg-neutral/80 text-text-neutral flex items-center justify-center hover:bg-neutral transition-colors shadow-md backdrop-blur-sm cursor-pointer"
          title="Perbesar Gambar"
          @click="openZoomModal"
        >
          <RiZoomInLine class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="w-7 h-7 rounded-full bg-error text-neutral flex items-center justify-center hover:bg-error/90 transition-colors shadow-md cursor-pointer"
          title="Hapus Gambar"
          @click="handleRemove"
        >
          <RiCloseLine class="w-4 h-4" />
        </button>
      </div>
    </div>

    <button
      v-else
      type="button"
      :disabled="isUploading"
      class="flex flex-col items-center justify-center p-4 border-2 border-dashed border-text-alt/30 rounded-xl text-text-alt hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-secondary/5 cursor-pointer"
      :class="[aspectRatio === 'square' ? 'aspect-square w-48' : 'aspect-video w-full']"
      @click="triggerFileInput"
    >
      <RiLoader4Line v-if="isUploading" class="w-8 h-8 animate-spin" />
      <RiImageAddLine v-else class="w-8 h-8 mb-1" />
      <span class="text-sm font-medium">
        {{ isUploading ? 'Mengunggah...' : 'Unggah Gambar' }}
      </span>
    </button>

    <p class="text-xs text-text-alt leading-normal">
      Format yang diperbolehkan: <strong class="text-text-neutral">PNG, JPG, JPEG</strong>.<br />
      Ukuran maksimal: <strong class="text-text-neutral">{{ maxSizeMB }} MB</strong>.
    </p>

    <Teleport to="body">
      <div
        v-if="isZoomOpen && (previewUrl || modelValue)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8 backdrop-blur-sm"
        @click.self="closeZoomModal"
      >
        <div class="relative flex items-center justify-center max-w-full max-h-full">
          <button
            type="button"
            class="absolute -top-12 right-0 sm:-right-8 text-white hover:text-gray-300 transition-colors p-1 rounded-full bg-black/40 sm:bg-transparent cursor-pointer"
            title="Tutup"
            @click="closeZoomModal"
          >
            <RiCloseLine class="w-8 h-8" />
          </button>

          <img
            :src="previewUrl || (typeof modelValue === 'string' ? modelValue : '')"
            alt="Zoom Preview"
            class="w-auto h-auto max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
