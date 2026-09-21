<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const categoryId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!categoryId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  category_name: '',
  active: 'true',
})

const errors = reactive({
  category_name: false,
})

const submitButtonLabel = computed(() => {
  if (isSubmitting.value) return 'Menyimpan...'
  return 'Simpan'
})

const fetchDetail = async () => {
  if (!categoryId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/feedbacks-categories/${categoryId.value}`)
    const data = response.data.data
    formData.category_name = data.category_name || ''
    formData.active = data.active ? 'true' : 'false'
  } catch {
    toastStore.show('Gagal memuat detail kategori.', 'error')
    router.push({ name: 'dashboard-master-data' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.category_name = !formData.category_name.trim()

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
    category_name: formData.category_name,
    active: formData.active === 'true',
  }

  try {
    if (isEditMode.value) {
      await api.put(`/feedbacks-categories/${categoryId.value}`, payload)
      toastStore.show('Kategori kritik & saran berhasil diperbarui!', 'success')
    } else {
      await api.post('/feedbacks-categories', payload)
      toastStore.show('Kategori kritik & saran berhasil ditambahkan!', 'success')
    }

    router.push({ name: 'dashboard-master-data', query: { tab: route.query.tab } })
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
    toastStore.show(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-master-data', query: { tab: route.query.tab } })
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
      {{ isEditMode ? 'Edit Kategori Kritik & Saran' : 'Tambah Kategori Kritik & Saran' }}
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
          <span>Nama Kategori</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.category_name"
          variant="semi-rounded"
          size="mobile"
          :error="errors.category_name"
          @input="errors.category_name = false"
        />
        <p v-if="errors.category_name" class="text-sm text-error mt-1">
          Nama kategori wajib diisi.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">Status</label>
        <div class="flex items-center gap-6">
          <Radio v-model="formData.active" value="true" size="normal" label="Aktif" />
          <Radio v-model="formData.active" value="false" size="normal" label="Nonaktif" />
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
