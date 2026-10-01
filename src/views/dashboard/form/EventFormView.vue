<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import Button from '@/components/ui/Button.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { RiSaveLine } from '@remixicon/vue'

interface EventCoverImage {
  field_value?: string
  url?: string
}

interface EventDetailResponse {
  id: number
  title?: string
  location?: string
  start_date?: string | null
  end_date?: string | null
  content?: string
  status?: string
  img_cover?: EventCoverImage | string | null
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const eventId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!eventId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  content: '',
  status: 'draft',
})

const imgCover = ref<string | null>(null)
const previewImgCover = ref<string | null>(null)

// Synchronize preview URL jika imgCover di-set ke null / kosong
watch(imgCover, (newVal) => {
  if (!newVal) {
    previewImgCover.value = null
  }
})

// --- State Deteksi Perubahan Data ---
const isFormDirty = ref(false)
const initialFormData = ref<string>('')
const pendingNavigationTarget = ref<string | null>(null)
const isLeaveModalOpen = ref(false)

const errors = reactive({
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  content: false,
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'publish', label: 'Diterbitkan' },
  { value: 'archive', label: 'Diarsipkan' },
]

const takeSnapshot = () => {
  initialFormData.value = JSON.stringify({
    ...formData,
    imgCover: imgCover.value ?? null,
  })
  isFormDirty.value = false
}

watch(
  [formData, imgCover],
  () => {
    if (initialFormData.value) {
      const currentSnap = JSON.stringify({
        ...formData,
        imgCover: imgCover.value ?? null,
      })
      isFormDirty.value = currentSnap !== initialFormData.value
    }
  },
  { deep: true },
)

watch(
  () => formData.start_date,
  (newStartDate) => {
    if (newStartDate && (!formData.end_date || formData.end_date < newStartDate)) {
      formData.end_date = newStartDate
    }
    if (errors.start_date) errors.start_date = ''
  },
)

const fetchDetail = async () => {
  if (!eventId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/events/${eventId.value}`)
    const data: EventDetailResponse = response.data?.data ?? {}

    formData.title = data.title ?? ''
    formData.location = data.location ?? ''

    // Aman dari TS2322: Selalu mengembalikan tipe string
    formData.start_date = data.start_date ? (data.start_date.split('T')[0] ?? '') : ''
    formData.end_date = data.end_date ? (data.end_date.split('T')[0] ?? '') : ''

    formData.content = data.content ?? ''
    formData.status = data.status ?? 'draft'

    // --- Penanganan Gambar Cover dari Backend menggunakan getFullFileUrl ---
    const coverData = data.img_cover

    if (coverData && typeof coverData === 'object' && coverData.field_value) {
      imgCover.value = coverData.field_value
      previewImgCover.value = getFullFileUrl(coverData.url || coverData.field_value)
    } else if (typeof coverData === 'string' && coverData.trim() !== '' && coverData !== 'null') {
      imgCover.value = coverData
      previewImgCover.value = getFullFileUrl(coverData)
    } else {
      imgCover.value = null
      previewImgCover.value = null
    }

    takeSnapshot()
  } catch (err) {
    console.error('Gagal memuat detail event:', err)
    toastStore.show('Gagal memuat detail event.', 'error')
    router.push({ name: 'dashboard-event' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  let isValid = true

  if (!formData.title.trim()) {
    errors.title = 'Judul event wajib diisi.'
    isValid = false
  } else if (formData.title.length < 5) {
    errors.title = 'Judul event minimal 5 karakter.'
    isValid = false
  } else {
    errors.title = ''
  }

  if (!formData.location.trim()) {
    errors.location = 'Lokasi event wajib diisi.'
    isValid = false
  } else {
    errors.location = ''
  }

  if (!formData.start_date) {
    errors.start_date = 'Tanggal mulai wajib diisi.'
    isValid = false
  } else {
    errors.start_date = ''
  }

  if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
    errors.end_date = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
    isValid = false
  } else {
    errors.end_date = ''
  }

  const strippedContent = formData.content.replace(/<[^>]*>/g, '').trim()
  errors.content = !strippedContent
  if (errors.content) isValid = false

  if (!isValid) {
    toastStore.show(
      'Beberapa field wajib masih kosong atau tidak valid, silakan periksa kembali.',
      'error',
    )

    nextTick(() => {
      document.querySelector('.border-error, .text-error')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })

    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  const payload = {
    slug: '',
    title: formData.title,
    location: formData.location.trim(),
    start_date: formData.start_date,
    end_date: formData.end_date || formData.start_date,
    content: formData.content,
    status: formData.status,
    img_cover: imgCover.value ? imgCover.value : null,
  }
  let isSuccess = false

  try {
    if (isEditMode.value) {
      await api.put('/events/update', { id: eventId.value, ...payload })
      toastStore.show('Event berhasil diperbarui!', 'success')
    } else {
      await api.post('/events/create', payload)
      toastStore.show('Event berhasil ditambahkan!', 'success')
    }
    isSuccess = true
  } catch (err) {
    console.error('Error saat menyimpan event:', err)
    let msg = 'Terjadi kesalahan saat menyimpan data.'
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      msg = err.response.data.message
    }
    toastStore.show(msg, 'error')
  } finally {
    isSubmitting.value = false
  }

  if (isSuccess) {
    isFormDirty.value = false
    router.push({ name: 'dashboard-event' }).catch((err) => {
      console.error('Navigasi router gagal:', err)
    })
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-event' })
}

const confirmLeave = () => {
  isFormDirty.value = false
  isLeaveModalOpen.value = false
  if (pendingNavigationTarget.value) {
    router.push(pendingNavigationTarget.value)
  } else {
    router.push({ name: 'dashboard-event' })
  }
}

const cancelLeave = () => {
  isLeaveModalOpen.value = false
  pendingNavigationTarget.value = null
}

onBeforeRouteLeave((to) => {
  if (isFormDirty.value) {
    pendingNavigationTarget.value = to.fullPath
    isLeaveModalOpen.value = true
    return false
  }
  return true
})

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isFormDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  if (isEditMode.value) {
    fetchDetail()
  } else {
    takeSnapshot()
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-xl font-bold text-text-neutral">
      {{ isEditMode ? 'Edit Event' : 'Tambah Event' }}
    </h1>

    <div
      v-if="isLoading"
      class="p-16 flex justify-center items-center bg-neutral rounded-2xl border border-text-alt/20 max-w-4xl"
    >
      <LoadingSpinner size="lg" label="Memuat data..." />
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="p-6 bg-neutral rounded-2xl border border-text-alt/20 flex flex-col gap-8 max-w-4xl"
    >
      <!-- Judul Event -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Judul Event</span>
            <RequiredBadge />
          </label>
          <span
            class="text-xs transition-colors"
            :class="formData.title.length >= 255 ? 'text-error font-semibold' : 'text-text-alt'"
          >
            {{ formData.title.length }}/255
          </span>
        </div>

        <Input
          v-model="formData.title"
          variant="semi-rounded"
          maxlength="255"
          type="textarea"
          :rows="2"
          placeholder="Masukkan judul event (min. 5 karakter)..."
          :error="!!errors.title"
          @input="errors.title = ''"
        />
        <p v-if="errors.title" class="text-sm text-error mt-1">{{ errors.title }}</p>
      </div>

      <!-- Lokasi Event -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral">
          <span>Lokasi Event</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.location"
          variant="semi-rounded"
          type="text"
          size="large"
          placeholder="Masukkan lokasi event..."
          :error="!!errors.location"
          @input="errors.location = ''"
        />
        <p v-if="errors.location" class="text-sm text-error mt-1">{{ errors.location }}</p>
      </div>

      <!-- Tanggal Mulai dan Tanggal Selesai -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div class="flex flex-col gap-1">
          <label class="flex items-center text-xs sm:text-sm font-medium text-text-neutral mb-0.5">
            <span>Tanggal Mulai</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="formData.start_date"
            variant="semi-rounded"
            size="normal"
            type="date"
            :error="!!errors.start_date"
          />
          <p v-if="errors.start_date" class="text-xs text-error mt-0.5">{{ errors.start_date }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs sm:text-sm font-medium text-text-neutral mb-0.5">
            Tanggal Selesai
          </label>
          <Input
            v-model="formData.end_date"
            variant="semi-rounded"
            size="normal"
            type="date"
            :min="formData.start_date"
            :error="!!errors.end_date"
            @input="errors.end_date = ''"
          />
          <p v-if="errors.end_date" class="text-xs text-error mt-0.5">{{ errors.end_date }}</p>
        </div>
      </div>

      <!-- Deskripsi Event (Rich Text Editor) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Deskripsi Event</span>
          <RequiredBadge />
        </label>
        <div :class="{ 'border border-error rounded-xl': errors.content }">
          <RichTextEditor
            v-model="formData.content"
            placeholder="Tuliskan deskripsi atau rincian event..."
            @update:model-value="
              (val) => {
                if (errors.content) {
                  const stripped = val.replace(/<[^>]*>/g, '').trim()
                  if (stripped) errors.content = false
                }
              }
            "
          />
        </div>
        <p v-if="errors.content" class="text-sm text-error mt-1">Deskripsi event wajib diisi.</p>
      </div>

      <!-- Gambar Sampul -->
      <div class="flex flex-col gap-1.5">
        <label class="block text-sm font-medium text-text-neutral mb-1.5">
          Gambar Sampul Event
        </label>
        <ImageUpload
          v-model="imgCover"
          v-model:previewUrl="previewImgCover"
          aspectRatio="portrait"
          :maxSizeMB="5"
        />
      </div>

      <!-- Status Event (Radio) -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Status</label>
        <div class="flex items-center gap-6">
          <Radio
            v-for="opt in statusOptions"
            :key="opt.value"
            v-model="formData.status"
            :value="opt.value"
            size="normal"
            :label="opt.label"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center gap-3 mt-4">
        <Button type="button" size="md" variant="neutral" label="Batal" @click="handleCancel" />
        <Button
          type="submit"
          size="md"
          variant="primary"
          :label="submitButtonLabel"
          :disabled="isSubmitting"
          :icon-left="RiSaveLine"
        />
      </div>
    </form>

    <ConfirmModal
      :is-open="isLeaveModalOpen"
      title="Tinggalkan Halaman?"
      message="Perubahan yang Anda buat belum disimpan. Apakah Anda yakin ingin keluar dari halaman ini?"
      confirm-text="Ya, Tinggalkan"
      cancel-text="Lanjut Mengedit"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
