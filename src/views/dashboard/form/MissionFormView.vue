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

const missionId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!missionId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  content: '',
  order: '',
  active: 'true',
})

const errors = reactive({
  content: false,
  order: false,
})

const submitButtonLabel = computed(() => (isSubmitting.value ? 'Menyimpan...' : 'Simpan'))

const fetchDetail = async () => {
  if (!missionId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/missions/${missionId.value}`)
    const data = response.data.data
    formData.content = data.content || ''
    formData.order = data.order != null ? String(data.order) : ''
    formData.active = data.active ? 'true' : 'false'
  } catch {
    toastStore.show('Gagal memuat detail misi.', 'error')
    router.push({ name: 'dashboard-visi-misi' })
  } finally {
    isLoading.value = false
  }
}

const fetchNextOrder = async () => {
  try {
    const response = await api.get('/missions', {
      params: { limit: 1, sort_by: 'missions."order"', sort: 'desc' },
    })
    const missions = response.data.data
    const maxOrder = missions.length > 0 ? (missions[0].order ?? 0) : 0
    formData.order = String(maxOrder + 1)
  } catch {
    console.error('Gagal menghitung urutan otomatis.')
  }
}

const validate = () => {
  errors.content = !formData.content.trim()
  errors.order = !formData.order.trim()

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
    content: formData.content,
    order: formData.order ? Number(formData.order) : null,
    active: formData.active === 'true',
  }

  try {
    if (isEditMode.value) {
      await api.put(`/missions/update`, { id: missionId.value, ...payload })
      toastStore.show('Misi berhasil diperbarui!', 'success')
    } else {
      await api.post('/missions/create', payload)
      toastStore.show('Misi berhasil ditambahkan!', 'success')
    }

    router.push({ name: 'dashboard-visi-misi' })
  } catch (err: any) {
    const backendMessage = err.response?.data?.message

    if (backendMessage === 'message.alreadyExist') {
      errors.order = true
      toastStore.show(
        'Urutan tersebut sudah digunakan misi lain, silakan pilih urutan lain.',
        'error',
      )
      nextTick(() => {
        document.querySelector('.border-error')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
    } else {
      toastStore.show(backendMessage || 'Terjadi kesalahan saat menyimpan data.', 'error')
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-visi-misi' })
}

onMounted(() => {
  if (isEditMode.value) {
    fetchDetail()
  } else {
    fetchNextOrder()
  }
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-xl font-bold text-text-neutral">
      {{ isEditMode ? 'Edit Misi Sekolah' : 'Tambah Misi Sekolah' }}
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
          <span>Judul Misi</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.content"
          type="textarea"
          variant="semi-rounded"
          :rows="3"
          :error="errors.content"
          @input="errors.content = false"
        />
        <p v-if="errors.content" class="text-sm text-error mt-1">Judul misi wajib diisi.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Urutan</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.order"
          type="number"
          variant="semi-rounded"
          size="mobile"
          :error="errors.order"
          @input="errors.order = false"
        />
        <p v-if="errors.order" class="text-sm text-error mt-1">Urutan wajib diisi.</p>
        <p v-else-if="!isEditMode" class="text-xs text-text-alt mt-1">
          Terisi otomatis dari urutan terakhir — bisa diubah manual jika perlu.
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
