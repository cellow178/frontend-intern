<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import Button from '@/components/ui/Button.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const bannerId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!bannerId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  title: '',
  url: '',
  img_cover: null as string | null,
  active: 'true',
})

const imagePreviewUrl = ref<string | null>(null)

const errors = reactive({
  title: false,
  img_cover: false,
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const fetchDetail = async () => {
  if (!bannerId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/banners/${bannerId.value}`)
    const data = response.data.data
    formData.title = data.title || ''
    formData.url = data.url || ''
    formData.img_cover = data.img_cover?.field_value || null
    formData.active = data.active ? 'true' : 'false'

    imagePreviewUrl.value = getFullFileUrl(data.img_cover?.url)
  } catch {
    toastStore.show('Gagal memuat detail banner.', 'error')
    router.push({ name: 'dashboard-banner' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.title = !formData.title.trim()
  errors.img_cover = !formData.img_cover

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

  isSubmitting.value = true
  const payload = {
    title: formData.title,
    url: formData.url || null,
    img_cover: formData.img_cover,
    active: formData.active === 'true',
  }

  try {
    if (isEditMode.value) {
      await api.put('/banners/update', { id: bannerId.value, ...payload })
      toastStore.show('Banner berhasil diperbarui!', 'success')
    } else {
      await api.post('/banners/create', payload)
      toastStore.show('Banner berhasil ditambahkan!', 'success')
    }

    router.push({ name: 'dashboard-banner' })
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
    toastStore.show(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-banner' })
}

onMounted(() => {
  if (isEditMode.value) {
    fetchDetail()
  }
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-xl font-bold text-text-neutral">
      {{ isEditMode ? 'Edit Banner' : 'Tambah Banner' }}
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
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Gambar Banner</span>
          <RequiredBadge />
        </label>
        <ImageUpload
          v-model="formData.img_cover"
          v-model:preview-url="imagePreviewUrl"
          @update:model-value="errors.img_cover = false"
        />
        <p v-if="errors.img_cover" class="text-sm text-error mt-1">Gambar banner wajib diunggah.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Judul</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.title"
          variant="semi-rounded"
          size="mobile"
          :error="errors.title"
          @input="errors.title = false"
        />
        <p v-if="errors.title" class="text-sm text-error mt-1">Judul wajib diisi.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-neutral sm:text-base">
          Tautan (URL Target)
        </label>
        <Input v-model="formData.url" type="url" variant="semi-rounded" size="mobile" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Status</label>
        <div class="flex items-center gap-6">
          <Radio v-model="formData.active" value="true" size="normal" label="Aktif" />
          <Radio v-model="formData.active" value="false" size="normal" label="Tidak Aktif" />
        </div>
      </div>

      <div class="flex items-center gap-3 mt-4">
        <Button type="button" size="md" variant="neutral" label="Batal" @click="handleCancel" />
        <Button
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
