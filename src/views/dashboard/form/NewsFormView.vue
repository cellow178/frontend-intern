<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import Select from '@/components/ui/Select.vue'
import Button from '@/components/ui/Button.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { RiSaveLine } from '@remixicon/vue'

interface Category {
  id: number
  name: string
  active: boolean
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const newsId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!newsId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)
const categories = ref<Category[]>([])

const formData = reactive({
  title: '',
  category_id: '',
  content: '',
  img_cover: null as string | null,
  status: 'draft',
})

const imagePreviewUrl = ref<string | null>(null)
const initialImgCover = ref<string | null>(null)

// --- State Deteksi Perubahan Data (Unsaved Changes) ---
const isFormDirty = ref(false)
const initialFormData = ref<string>('')
const pendingNavigationTarget = ref<string | null>(null)
const isLeaveModalOpen = ref(false)

const errors = reactive({
  title: '',
  content: false,
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'publish', label: 'Diterbitkan' },
  { value: 'archive', label: 'Diarsipkan' },
]

// Snapshot data awal untuk mendeteksi perubahan
const takeSnapshot = () => {
  initialFormData.value = JSON.stringify(formData)
  isFormDirty.value = false
}

// Watcher untuk membandingkan data sekarang dengan data awal
watch(
  formData,
  () => {
    if (initialFormData.value) {
      isFormDirty.value = JSON.stringify(formData) !== initialFormData.value
    }
  },
  { deep: true },
)

const fetchCategories = async () => {
  try {
    const response = await api.get('/news-categories/dataset', {
      params: { active: true },
    })
    categories.value = response.data.data
  } catch (err) {
    console.error('Gagal mengambil dataset kategori', err)
  }
}

const fetchDetail = async () => {
  if (!newsId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/news/${newsId.value}`)
    const data = response.data.data

    formData.title = data.title || ''
    formData.category_id = data.category_id ? String(data.category_id) : ''
    formData.content = data.content || ''
    formData.img_cover = data.img_cover?.field_value || null
    initialImgCover.value = data.img_cover?.field_value || null
    formData.status = data.status || 'draft'

    imagePreviewUrl.value = getFullFileUrl(data.img_cover?.url)

    takeSnapshot()
  } catch {
    toastStore.show('Gagal memuat detail berita.', 'error')
    router.push({ name: 'dashboard-berita' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  if (!formData.title.trim()) {
    errors.title = 'Judul wajib diisi.'
  } else if (formData.title.length < 10) {
    errors.title = 'Judul berita minimal 10 karakter.'
  } else {
    errors.title = ''
  }

  const strippedContent = formData.content.replace(/<[^>]*>/g, '').trim()
  errors.content = !strippedContent

  const hasError = !!errors.title || errors.content

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

  isSubmitting.value = true

  const payload: Record<string, any> = {
    title: formData.title,
    slug: null,
    category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
    content: formData.content,
    status: formData.status,
  }

  if (isEditMode.value) {
    if (formData.img_cover !== initialImgCover.value) {
      payload.img_cover = formData.img_cover || null
    }
  } else {
    payload.img_cover = formData.img_cover || null
  }

  let isSuccess = false

  try {
    if (isEditMode.value) {
      await api.put('/news/update', { id: newsId.value, ...payload })
      toastStore.show('Berita berhasil diperbarui!', 'success')
    } else {
      await api.post('/news/create', payload)
      toastStore.show('Berita berhasil ditambahkan!', 'success')
    }
    isSuccess = true
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
    toastStore.show(msg, 'error')
  } finally {
    isSubmitting.value = false
  }

  if (isSuccess) {
    isFormDirty.value = false // Matikan penanda dirty agar tidak memicu modal keluar
    router.push({ name: 'dashboard-berita' }).catch((err) => {
      console.error('Navigasi router gagal:', err)
    })
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-berita' })
}

// Konfirmasi keluar halaman dari modal
const confirmLeave = () => {
  isFormDirty.value = false
  isLeaveModalOpen.value = false
  if (pendingNavigationTarget.value) {
    router.push(pendingNavigationTarget.value)
  } else {
    router.push({ name: 'dashboard-berita' })
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
    return false // Batalkan navigasi langsung
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
  fetchCategories()
  if (isEditMode.value) {
    fetchDetail()
  } else {
    takeSnapshot()
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-xl font-bold text-text-neutral">
      {{ isEditMode ? 'Edit Berita' : 'Tambah Berita' }}
    </h1>

    <div
      v-if="isLoading"
      class="p-16 flex justify-center items-center bg-neutral rounded-2xl border border-text-alt/20"
    >
      <LoadingSpinner size="lg" label="Memuat data..." />
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="p-6 bg-neutral rounded-2xl border border-text-alt/20 flex flex-col gap-5"
    >
      <!-- Judul Berita -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Judul Berita</span>
            <RequiredBadge />
          </label>
          <!-- Indikator Karakter -->
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
          :rows="3"
          placeholder="Masukkan judul berita (min. 10 karakter)..."
          :error="!!errors.title"
          @input="errors.title = ''"
        />
        <p v-if="errors.title" class="text-sm text-error mt-1">{{ errors.title }}</p>
      </div>

      <!-- Kategori Berita -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Kategori</label>
        <Select
          variant="semi-rounded"
          size="mobile"
          v-model="formData.category_id"
          placeholder="Pilih Kategori"
          :options="[
            { value: 'null', label: 'Tanpa Kategori' },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]"
        />
      </div>

      <!-- Content (Rich Text Editor) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Isi Berita</span>
          <RequiredBadge />
        </label>
        <div :class="{ 'border border-error rounded-xl': errors.content }">
          <RichTextEditor
            v-model="formData.content"
            placeholder="Tuliskan isi berita..."
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
        <p v-if="errors.content" class="text-sm text-error mt-1">Isi berita wajib diisi.</p>
      </div>

      <!-- Gambar Sampul -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Gambar Sampul Berita</span>
        </label>
        <ImageUpload v-model="formData.img_cover" v-model:preview-url="imagePreviewUrl" />
      </div>

      <!-- Status Berita (Radio) -->
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
