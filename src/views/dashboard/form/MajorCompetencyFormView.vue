<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import AdminButton from '@/components/ui/AdminButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine, RiGraduationCapLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

let isLeaving = false

onBeforeUnmount(() => {
  isLeaving = true
})

// ID Kompetensi jika dalam mode Edit
const competentId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!competentId.value)

// Mengambil nama tab aktif dari URL Query (default ke 'competence')
const activeTab = computed(() => (route.query.tab as string) || 'competence')

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
const majorDetail = ref<{ code?: string; major_name?: string } | null>(null)

const formData = reactive({
  competent_name: '',
  description: '',
  active: 'true',
})

const errors = reactive({
  competent_name: false,
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

const fetchDetail = async () => {
  if (!competentId.value || isLeaving) return

  isLoading.value = true

  try {
    const response = await api.get(`/major-competents/${competentId.value}`)

    // Jangan proses hasil request jika user sudah keluar
    if (isLeaving) return

    const data = response.data.data

    formData.competent_name = data.competent_name || ''
    formData.description = data.description || ''
    formData.active = data.active ? 'true' : 'false'

    // Simpan ID jurusan dari data kompetensi jika belum tersedia
    if (!majorId.value && data.major_id) {
      resolvedMajorId.value = Number(data.major_id)
    }

    // Ambil detail jurusan hanya jika belum tersedia
    if (!majorDetail.value && data.major_id) {
      const respMajor = await api.get(`/majors/${data.major_id}`)

      // Request kedua juga bisa selesai setelah user keluar
      if (isLeaving) return

      majorDetail.value = respMajor.data.data
    }
  } catch (err: any) {
    // Jangan munculkan toast dari request yang sudah tidak relevan
    if (isLeaving) return

    const backendMessage = err.response?.data?.message

    if (backendMessage === 'message.dataNotFound') {
      toastStore.show('Kompetensi Jurusan tidak ditemukan.', 'error')
    } else {
      toastStore.show(backendMessage || 'Gagal memuat Kompetensi Jurusan.', 'error')
    }

    handleCancel()
  } finally {
    if (!isLeaving) {
      isLoading.value = false
    }
  }
}

const validate = () => {
  errors.competent_name = !formData.competent_name.trim()
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
    toastStore.show('Jurusan tidak ditemukan.', 'error')
    return
  }

  isSubmitting.value = true
  const payload = {
    ...(majorId.value && { major_id: majorId.value }),
    competent_name: formData.competent_name,
    description: formData.description,
    active: formData.active === 'true',
  }

  try {
    if (isEditMode.value) {
      await api.put('/major-competents/update', { id: competentId.value, ...payload })
      toastStore.show('Kompetensi Jurusan berhasil diperbarui!', 'success')
    } else {
      await api.post('/major-competents/create', payload)
      toastStore.show('Kompetensi Jurusan berhasil ditambahkan!', 'success')
    }

    // Mengarahkan kembali ke halaman detail beserta query tab
    handleCancel()
  } catch (err: any) {
    const backendMessage = err.response?.data?.message
    toastStore.show(
      backendMessage || 'Terjadi kesalahan saat menyimpan Kompetensi Jurusan.',
      'error',
    )
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  isLeaving = true

  const targetMajorId = resolvedMajorId.value || majorId.value

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
          {{ isEditMode ? 'Edit Kompetensi Jurusan' : 'Tambah Kompetensi Jurusan' }}
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
          {{ isEditMode ? 'Edit Kompetensi Jurusan' : 'Tambah Kompetensi Jurusan' }}
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

      <!-- Field Nama Kompetensi -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Nama Kompetensi</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.competent_name"
          type="text"
          variant="semi-rounded"
          size="large"
          :error="errors.competent_name"
          @input="errors.competent_name = false"
        />
        <p v-if="errors.competent_name" class="text-sm text-error mt-1">
          Nama kompetensi wajib diisi.
        </p>
      </div>

      <!-- Field Deskripsi Kompetensi (Textarea) -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Deskripsi</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="formData.description"
          type="textarea"
          variant="semi-rounded"
          :rows="3"
          :error="errors.description"
          @input="errors.description = false"
        />
        <p v-if="errors.description" class="text-sm text-error mt-1">
          Deskripsi kompetensi wajib diisi.
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
