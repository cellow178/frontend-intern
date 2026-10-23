<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import AdminButton from '@/components/ui/AdminButton.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine, RiGraduationCapLine } from '@remixicon/vue'

interface MajorGalleryDetail {
  id: number
  major_id: number
  img_cover?:
    | {
        field_value?: string
        url?: string
      }
    | string
    | null
  description: string
  active: boolean
  rel_major_code?: string
  rel_major_name?: string
}

interface MajorDetail {
  id: number
  code: string
  major_name: string
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
let isLeaving = false

onBeforeUnmount(() => {
  isLeaving = true
})

// ID Galeri jika dalam mode Edit
const galleryId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!galleryId.value)

// Mengambil nama tab aktif dari URL Query (default ke 'gallery')
const activeTab = computed(() => (route.query.tab as string) || 'gallery')

// Mengambil major_id otomatis dari route param atau query
const majorId = computed(() => {
  const idFromParam = route.params.majorId ? Number(route.params.majorId) : null
  const idFromQuery = route.query.major_id ? Number(route.query.major_id) : null
  return idFromParam || idFromQuery
})

const resolvedMajorId = ref<number | null>(majorId.value)

// Inisialisasi isLoading = true jika dalam mode edit agar form tidak langsung dirender dalam keadaan kosong
const isLoading = ref(isEditMode.value)
const isSubmitting = ref(false)
const majorDetail = ref<MajorDetail | null>(null)

const formData = reactive({
  img_cover: null as string | null,
  description: '',
  active: 'true',
})

const imagePreviewUrl = ref<string | null>(null)

const errors = reactive({
  img_cover: false,
  description: false,
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const fetchMajorDetail = async () => {
  if (!majorId.value || isLeaving) return
  try {
    const response = await api.get(`/majors/${majorId.value}`)
    if (isLeaving) return
    majorDetail.value = response.data.data
  } catch (err) {
    if (isLeaving) return
    console.error('Gagal mengambil informasi jurusan:', err)
  }
}

// Fetch Detail Galeri saat Edit Mode
const fetchDetail = async () => {
  if (!galleryId.value || isLeaving) return

  isLoading.value = true

  try {
    const response = await api.get(`/major-gallery/${galleryId.value}`)

    if (isLeaving) return

    const data: MajorGalleryDetail = response.data.data

    formData.description = data.description || ''
    formData.active = data.active ? 'true' : 'false'

    // Simpan ID jurusan dari data galeri
    if (data.major_id) {
      resolvedMajorId.value = Number(data.major_id)
    }

    // Penanganan img_cover dari API
    if (typeof data.img_cover === 'object' && data.img_cover !== null) {
      formData.img_cover = data.img_cover.field_value || null
      imagePreviewUrl.value = data.img_cover.url ? getFullFileUrl(data.img_cover.url) : null
    } else if (typeof data.img_cover === 'string') {
      formData.img_cover = data.img_cover
      imagePreviewUrl.value = getFullFileUrl(data.img_cover)
    } else {
      formData.img_cover = null
      imagePreviewUrl.value = null
    }

    // Ambil detail jurusan jika belum tersedia
    if (!majorDetail.value && data.major_id) {
      const respMajor = await api.get(`/majors/${data.major_id}`)

      if (isLeaving) return

      majorDetail.value = respMajor.data.data
    }
  } catch (err: any) {
    if (isLeaving) return

    console.error('Gagal memuat foto galeri:', err)

    const backendMessage = err.response?.data?.message

    toastStore.show(backendMessage || 'Gagal memuat foto galeri.', 'error')

    handleCancel()
  } finally {
    if (!isLeaving) {
      isLoading.value = false
    }
  }
}

const validate = () => {
  errors.img_cover = !formData.img_cover
  errors.description = !formData.description.trim()

  const hasError = Object.values(errors).some((e) => e === true)

  if (hasError) {
    toastStore.show('Beberapa field wajib masih kosong, silakan periksa kembali.', 'error')

    nextTick(() => {
      document.querySelector('.border-error')?.scrollIntoView({
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

  if (!majorId.value && !isEditMode.value) {
    toastStore.show('Jurusan tidak terdeteksi.', 'error')
    return
  }

  isSubmitting.value = true
  const payload = {
    ...(majorId.value && { major_id: majorId.value }),
    img_cover: formData.img_cover,
    description: formData.description,
    active: formData.active === 'true',
  }

  try {
    if (isEditMode.value) {
      await api.put('/major-gallery/update', {
        id: galleryId.value,
        ...payload,
      })
    } else {
      await api.post('/major-gallery/create', payload)
    }

    if (isLeaving) return

    toastStore.show(
      isEditMode.value ? 'Foto galeri berhasil diperbarui!' : 'Foto galeri berhasil ditambahkan!',
      'success',
    )

    handleCancel()
  } catch (err) {
    if (isLeaving) return

    console.error('Error saat menyimpan galeri:', err)

    let msg = 'Terjadi kesalahan saat menyimpan Foto Galeri.'

    if (axios.isAxiosError(err) && err.response?.data?.message) {
      msg = err.response.data.message
    }

    toastStore.show(msg, 'error')
  } finally {
    if (!isLeaving) {
      isSubmitting.value = false
    }
  }
}

const handleCancel = () => {
  isLeaving = true

  const targetMajorId = resolvedMajorId.value || majorId.value || majorDetail.value?.id

  if (targetMajorId) {
    router.push({
      name: 'dashboard-jurusan-detail',
      params: { id: targetMajorId },
      query: { tab: activeTab.value },
    })
  } else {
    router.back()
  }
}

onMounted(async () => {
  await fetchMajorDetail()
  if (isLeaving) return
  if (isEditMode.value) {
    await fetchDetail()
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isLoading" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div class="border-b border-text-alt/50 pb-4 mb-8">
        <h1 class="text-xl font-bold text-text-neutral">
          {{ isEditMode ? 'Edit Foto Galeri' : 'Tambah Foto Galeri' }}
        </h1>
      </div>

      <div class="text-text-alt py-16 text-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl flex flex-col gap-5"
    >
      <!-- Card Header -->
      <div class="border-b border-text-alt/50 pb-4">
        <h1 class="text-xl font-bold text-text-neutral">
          {{ isEditMode ? 'Edit Foto Galeri' : 'Tambah Foto Galeri' }}
        </h1>
      </div>
      <!-- Informational Badge Jurusan -->
      <div
        v-if="majorDetail"
        class="flex items-center gap-3 p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-primary"
      >
        <RiGraduationCapLine class="w-5 h-5 shrink-0" />
        <div class="text-sm">
          <span class="font-normal text-text-alt">Jurusan: </span>
          <span class="font-semibold">{{ majorDetail.code }} - {{ majorDetail.major_name }}</span>
        </div>
      </div>

      <!-- Upload Foto Galeri (img_cover) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Foto Galeri</span>
          <RequiredBadge />
        </label>
        <ImageUpload
          v-model="formData.img_cover"
          v-model:preview-url="imagePreviewUrl"
          @update:model-value="errors.img_cover = false"
        />
        <p v-if="errors.img_cover" class="text-sm text-error mt-1">Foto galeri wajib diunggah.</p>
      </div>

      <!-- Field Deskripsi Galeri (description) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Deskripsi Foto</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.description"
          variant="semi-rounded"
          :error="errors.description"
          @input="errors.description = false"
        />
        <p v-if="errors.description" class="text-sm text-error mt-1">
          Deskripsi foto wajib diisi (maksimal 255 karakter).
        </p>
      </div>

      <!-- Field Status Active -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Status</label>
        <div class="flex items-center gap-6">
          <Radio v-model="formData.active" value="true" size="normal" label="Aktif" />
          <Radio v-model="formData.active" value="false" size="normal" label="Nonaktif" />
        </div>
      </div>

      <!-- Tombol Aksi -->
      <div class="flex items-center gap-3 mt-4">
        <AdminButton type="button" size="md" variant="secondary" label="Batal" @click="handleCancel" />
        <AdminButton
          type="submit"
          size="md"
          :label="submitButtonLabel"
          :disabled="isSubmitting"
          :icon-left="RiSaveLine"
        />
      </div>
    </form>
  </div>
</template>
