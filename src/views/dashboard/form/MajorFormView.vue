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

interface MajorLogo {
  field_value?: string
  url?: string
}

interface MajorDetailResponse {
  id: number
  code?: string
  major_name?: string
  summary?: string
  total_classes?: number | string | null
  major_duration?: number | string | null
  full_description?: string
  img_logo?: MajorLogo | string | null
  active?: boolean
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const majorId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!majorId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  code: '',
  major_name: '',
  summary: '',
  total_classes: '',
  major_duration: '',
  full_description: '',
  active: true,
})

const imgLogo = ref<string | null>(null)
const previewImgLogo = ref<string | null>(null)

// Synchronize preview URL jika imgLogo di-set ke null / kosong
watch(imgLogo, (newVal) => {
  if (!newVal) {
    previewImgLogo.value = null
  }
})

// --- State Deteksi Perubahan Data (Unsaved Changes) ---
const isFormDirty = ref(false)
const initialFormData = ref<string>('')
const pendingNavigationTarget = ref<string | null>(null)
const isLeaveModalOpen = ref(false)

const errors = reactive({
  code: '',
  major_name: '',
  summary: '',
  total_classes: '',
  major_duration: '',
  full_description: false,
  img_logo: '',
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const activeOptions = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Non-Aktif' },
]

// Snapshot data awal untuk mendeteksi perubahan
const takeSnapshot = () => {
  initialFormData.value = JSON.stringify({
    ...formData,
    imgLogo: imgLogo.value ?? null,
  })
  isFormDirty.value = false
}

// Watcher untuk membandingkan data sekarang dengan data awal
watch(
  [formData, imgLogo],
  () => {
    if (initialFormData.value) {
      const currentSnap = JSON.stringify({
        ...formData,
        imgLogo: imgLogo.value ?? null,
      })
      isFormDirty.value = currentSnap !== initialFormData.value
    }
  },
  { deep: true },
)

const fetchDetail = async () => {
  if (!majorId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/majors/${majorId.value}`)
    const data: MajorDetailResponse = response.data?.data ?? {}

    formData.code = data.code ?? ''
    formData.major_name = data.major_name ?? ''
    formData.summary = data.summary ?? ''
    formData.total_classes =
      data.total_classes !== undefined && data.total_classes !== null
        ? String(data.total_classes)
        : ''
    formData.major_duration =
      data.major_duration !== undefined && data.major_duration !== null
        ? String(data.major_duration)
        : ''
    formData.full_description = data.full_description ?? ''
    formData.active = data.active ?? true

    const logoData = data.img_logo

    if (logoData && typeof logoData === 'object' && logoData.field_value) {
      imgLogo.value = logoData.field_value
      previewImgLogo.value = getFullFileUrl(logoData.url || logoData.field_value)
    } else if (typeof logoData === 'string' && logoData.trim() !== '' && logoData !== 'null') {
      imgLogo.value = logoData
      previewImgLogo.value = getFullFileUrl(logoData)
    } else {
      imgLogo.value = null
      previewImgLogo.value = null
    }

    takeSnapshot()
  } catch (err) {
    console.error('Gagal memuat detail jurusan:', err)
    toastStore.show('Gagal memuat detail jurusan.', 'error')
    router.push({ name: 'dashboard-jurusan' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  let isValid = true

  // Validasi Kode
  if (!formData.code.trim()) {
    errors.code = 'Kode jurusan wajib diisi.'
    isValid = false
  } else if (formData.code.length > 10) {
    errors.code = 'Kode jurusan maksimal 10 karakter.'
    isValid = false
  } else {
    errors.code = ''
  }

  // Validasi Nama Jurusan
  if (!formData.major_name.trim()) {
    errors.major_name = 'Nama jurusan wajib diisi.'
    isValid = false
  } else if (formData.major_name.length > 100) {
    errors.major_name = 'Nama jurusan maksimal 100 karakter.'
    isValid = false
  } else {
    errors.major_name = ''
  }

  // Validasi Summary
  if (!formData.summary.trim()) {
    errors.summary = 'Ringkasan jurusan wajib diisi.'
    isValid = false
  } else if (formData.summary.length > 255) {
    errors.summary = 'Ringkasan maksimal 255 karakter.'
    isValid = false
  } else {
    errors.summary = ''
  }

  // Validasi Total Kelas
  if (formData.total_classes === '' || formData.total_classes === null) {
    errors.total_classes = 'Jumlah kelas wajib diisi.'
    isValid = false
  } else if (isNaN(Number(formData.total_classes)) || Number(formData.total_classes) < 0) {
    errors.total_classes = 'Jumlah kelas harus berupa angka valid.'
    isValid = false
  } else {
    errors.total_classes = ''
  }

  // Validasi Durasi Jurusan
  if (formData.major_duration === '' || formData.major_duration === null) {
    errors.major_duration = 'Durasi jurusan wajib diisi.'
    isValid = false
  } else if (isNaN(Number(formData.major_duration)) || Number(formData.major_duration) <= 0) {
    errors.major_duration = 'Durasi jurusan harus berupa angka valid.'
    isValid = false
  } else {
    errors.major_duration = ''
  }

  // Validasi Logo Jurusan
  if (!imgLogo.value) {
    errors.img_logo = 'Logo jurusan wajib diunggah.'
    isValid = false
  } else {
    errors.img_logo = ''
  }

  // Validasi Deskripsi Lengkap
  const strippedDescription = formData.full_description.replace(/<[^>]*>/g, '').trim()
  errors.full_description = !strippedDescription
  if (errors.full_description) isValid = false

  if (!isValid) {
    toastStore.show('Beberapa field wajib masih belum terisi dengan benar.', 'error')

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
    code: formData.code.trim(),
    slug: null,
    major_name: formData.major_name.trim(),
    summary: formData.summary.trim(),
    total_classes: Number(formData.total_classes),
    major_duration: Number(formData.major_duration),
    full_description: formData.full_description,
    img_logo: imgLogo.value ? imgLogo.value : null,
    active: formData.active,
  }

  let isSuccess = false

  try {
    if (isEditMode.value) {
      await api.put('/majors/update', { id: majorId.value, ...payload })
      toastStore.show('Jurusan berhasil diperbarui!', 'success')
    } else {
      await api.post('/majors/create', payload)
      toastStore.show('Jurusan berhasil ditambahkan!', 'success')
    }
    isSuccess = true
  } catch (err) {
    console.error('Error saat menyimpan jurusan:', err)
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
    router.push({ name: 'dashboard-jurusan' }).catch((err) => {
      console.error('Navigasi router gagal:', err)
    })
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-jurusan' })
}

// Konfirmasi keluar halaman dari modal
const confirmLeave = () => {
  isFormDirty.value = false
  isLeaveModalOpen.value = false
  if (pendingNavigationTarget.value) {
    router.push(pendingNavigationTarget.value)
  } else {
    router.push({ name: 'dashboard-jurusan' })
  }
}

const cancelLeave = () => {
  isLeaveModalOpen.value = false
  pendingNavigationTarget.value = null
}

// Interseptor Navigasi Vue Router
onBeforeRouteLeave((to) => {
  if (isFormDirty.value) {
    pendingNavigationTarget.value = to.fullPath
    isLeaveModalOpen.value = true
    return false
  }
  return true
})

// Peringatan jika user me-refresh atau menutup tab browser
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
      {{ isEditMode ? 'Edit Jurusan' : 'Tambah Jurusan' }}
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
      <!-- Kode Jurusan -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Kode Jurusan</span>
            <RequiredBadge />
          </label>
          <span
            class="text-xs transition-colors"
            :class="formData.code.length >= 10 ? 'text-error font-semibold' : 'text-text-alt'"
          >
            {{ formData.code.length }}/10
          </span>
        </div>

        <Input
          v-model="formData.code"
          variant="semi-rounded"
          maxlength="10"
          placeholder="Masukkan kode jurusan..."
          :error="!!errors.code"
          @input="errors.code = ''"
        />
        <p v-if="errors.code" class="text-sm text-error mt-1">{{ errors.code }}</p>
      </div>

      <!-- Nama Jurusan -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Nama Jurusan</span>
            <RequiredBadge />
          </label>
          <span
            class="text-xs transition-colors"
            :class="
              formData.major_name.length >= 100 ? 'text-error font-semibold' : 'text-text-alt'
            "
          >
            {{ formData.major_name.length }}/100
          </span>
        </div>

        <Input
          v-model="formData.major_name"
          variant="semi-rounded"
          maxlength="100"
          placeholder="Masukkan nama jurusan..."
          :error="!!errors.major_name"
          @input="errors.major_name = ''"
        />
        <p v-if="errors.major_name" class="text-sm text-error mt-1">{{ errors.major_name }}</p>
      </div>

      <!-- Ringkasan (Summary) -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Ringkasan (Summary)</span>
            <RequiredBadge />
          </label>
          <span
            class="text-xs transition-colors"
            :class="formData.summary.length >= 255 ? 'text-error font-semibold' : 'text-text-alt'"
          >
            {{ formData.summary.length }}/255
          </span>
        </div>

        <Input
          v-model="formData.summary"
          variant="semi-rounded"
          type="textarea"
          placeholder="Masukkan ringkasan jurusan..."
          :rows="3"
          maxlength="255"
          :error="!!errors.summary"
          @input="errors.summary = ''"
        />
        <p v-if="errors.summary" class="text-sm text-error mt-1">{{ errors.summary }}</p>
      </div>

      <!-- Jumlah Kelas & Durasi Jurusan (Grid 2 Kolom) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Jumlah Kelas -->
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Jumlah Kelas</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="formData.total_classes"
            type="number"
            min="1"
            variant="semi-rounded"
            placeholder="0"
            :error="!!errors.total_classes"
            @input="errors.total_classes = ''"
          />
          <p v-if="errors.total_classes" class="text-sm text-error mt-1">
            {{ errors.total_classes }}
          </p>
        </div>

        <!-- Durasi Jurusan (Tahun) -->
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Durasi Jurusan (Tahun)</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="formData.major_duration"
            type="number"
            min="1"
            variant="semi-rounded"
            placeholder="0"
            :error="!!errors.major_duration"
            @input="errors.major_duration = ''"
          />
          <p v-if="errors.major_duration" class="text-sm text-error mt-1">
            {{ errors.major_duration }}
          </p>
        </div>
      </div>

      <!-- Deskripsi Lengkap (Rich Text Editor) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Deskripsi Lengkap</span>
          <RequiredBadge />
        </label>
        <div :class="{ 'border border-error rounded-xl': errors.full_description }">
          <RichTextEditor
            v-model="formData.full_description"
            @update:model-value="
              (val) => {
                if (errors.full_description) {
                  const stripped = val.replace(/<[^>]*>/g, '').trim()
                  if (stripped) errors.full_description = false
                }
              }
            "
          />
        </div>
        <p v-if="errors.full_description" class="text-sm text-error mt-1">
          Deskripsi lengkap jurusan wajib diisi.
        </p>
      </div>

      <!-- Logo Jurusan -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Logo Jurusan</span>
          <RequiredBadge />
        </label>
        <ImageUpload
          v-model="imgLogo"
          v-model:previewUrl="previewImgLogo"
          aspectRatio="square"
          :maxSizeMB="5"
          @update:model-value="errors.img_logo = ''"
        />
        <p v-if="errors.img_logo" class="text-sm text-error mt-1">{{ errors.img_logo }}</p>
      </div>

      <!-- Status Aktif (Radio) -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Status</label>
        <div class="flex items-center gap-6">
          <Radio
            v-for="opt in activeOptions"
            :key="String(opt.value)"
            v-model="formData.active"
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

    <!-- Modal Konfirmasi Meninggalkan Halaman -->
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
