<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Radio from '@/components/ui/Radio.vue'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const userId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!userId.value)

const isLoading = ref(false)
const isSubmitting = ref(false)

// Role statis dari migrasi DB (tidak ada endpoint /roles di backend):
// -1 developer, 1 super-admin, 2 guru, 3 siswa
const roleOptions = [
  { value: 1, label: 'Super Admin' },
  { value: 2, label: 'Guru' },
  { value: 3, label: 'Siswa' },
  { value: -1, label: 'Developer' },
]

const statusOptions = [
  { value: 'user_active', label: 'Aktif' },
  { value: 'user_nonactive', label: 'Nonaktif' },
  { value: 'user_rejected', label: 'Ditolak' },
  { value: 'email_unverified', label: 'Email Belum Verifikasi' },
  { value: 'email_verified', label: 'Email Terverifikasi' },
]

const formData = reactive({
  fullname: '',
  username: '',
  email: '',
  nisn: '',
  angkatan: '',
  role_id: null as number | null,
  password: '',
  password_confirmation: '',
  status_code: 'user_active',
  must_change_password: false,
})

const errors = reactive({
  fullname: '',
  username: '',
  email: '',
  password: '',
  role_id: '',
})

const submitButtonLabel = computed(() => {
  if (isSubmitting.value) return 'Menyimpan...'
  return 'Simpan'
})

const fetchDetail = async () => {
  if (!userId.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/users/${userId.value}`)
    const data = response.data.data
    formData.fullname = data.fullname || ''
    formData.username = data.username || ''
    formData.email = data.email || ''
    formData.nisn = data.nisn || ''
    formData.angkatan = data.angkatan || ''
    formData.role_id = data.role_id ?? null
    formData.status_code = data.status_code || 'user_active'
    formData.must_change_password = !!data.must_change_password
  } catch {
    toastStore.show('Gagal memuat Detail Pengguna.', 'error')
    router.push({ name: 'dashboard-pengguna' })
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  let isValid = true

  if (!formData.fullname.trim()) {
    errors.fullname = 'Nama lengkap wajib diisi.'
    isValid = false
  } else if (formData.fullname.trim().length > 255) {
    errors.fullname = 'Nama lengkap maksimal 255 karakter.'
    isValid = false
  } else {
    errors.fullname = ''
  }

  if (!formData.username.trim()) {
    errors.username = 'Username wajib diisi.'
    isValid = false
  } else if (formData.username.trim().length > 100) {
    errors.username = 'Username maksimal 100 karakter.'
    isValid = false
  } else {
    errors.username = ''
  }

  if (formData.email.trim()) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email.trim().length > 255) {
      errors.email = 'Email maksimal 255 karakter.'
      isValid = false
    } else if (!emailRe.test(formData.email.trim())) {
      errors.email = 'Format email tidak valid.'
      isValid = false
    } else {
      errors.email = ''
    }
  } else {
    errors.email = ''
  }

  if (formData.role_id === null || formData.role_id === undefined) {
    errors.role_id = 'Role wajib dipilih.'
    isValid = false
  } else {
    errors.role_id = ''
  }

  // Password: wajib saat create (min 5, backend Users::beforeInsert),
  // opsional saat edit (kosong = tidak ganti).
  if (!isEditMode.value || formData.password) {
    if (!formData.password) {
      errors.password = 'Password wajib diisi.'
      isValid = false
    } else if (formData.password.length < 5) {
      errors.password = 'Password minimal 5 karakter.'
      isValid = false
    } else if (formData.password !== formData.password_confirmation) {
      errors.password = 'Konfirmasi password tidak cocok.'
      isValid = false
    } else {
      errors.password = ''
    }
  } else {
    errors.password = ''
  }

  if (!isValid) {
    toastStore.show('Beberapa field wajib masih belum terisi dengan benar.', 'error')
    nextTick(() => {
      document.querySelector('.border-error')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  return isValid
}

const emptyToNull = (val: string) => (val.trim() === '' ? null : val.trim())

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  const payload: Record<string, unknown> = {
    fullname: formData.fullname.trim(),
    username: formData.username.trim(),
    email: emptyToNull(formData.email),
    nisn: emptyToNull(formData.nisn),
    angkatan: emptyToNull(formData.angkatan),
    role_id: formData.role_id,
    status_code: formData.status_code,
    must_change_password: formData.must_change_password,
  }

  // Kirim password hanya jika diisi (backend: kosong = tidak ganti).
  if (formData.password) {
    payload.password = formData.password
  }

  try {
    if (isEditMode.value) {
      await api.put('/users/update', { id: userId.value, ...payload })
      toastStore.show('Pengguna berhasil diperbarui!', 'success')
    } else {
      await api.post('/users/create', payload)
      toastStore.show('Pengguna berhasil ditambahkan!', 'success')
    }
    router.push({ name: 'dashboard-pengguna' })
  } catch (err: unknown) {
    const apiErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = apiErr.response?.data?.errors
    if (fieldErrors) {
      if (fieldErrors.fullname?.[0]) errors.fullname = fieldErrors.fullname[0]
      if (fieldErrors.username?.[0]) errors.username = fieldErrors.username[0]
      if (fieldErrors.email?.[0]) errors.email = fieldErrors.email[0]
      if (fieldErrors.password?.[0]) errors.password = fieldErrors.password[0]
      if (fieldErrors.role_id?.[0]) errors.role_id = fieldErrors.role_id[0]
    }
    toastStore.show(
      apiErr.response?.data?.message || 'Terjadi kesalahan saat menyimpan Pengguna.',
      'error',
    )
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'dashboard-pengguna' })
}

onMounted(() => {
  if (isEditMode.value) {
    fetchDetail()
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isLoading" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div class="border-b border-text-alt/50 pb-4 mb-8">
        <h1 class="text-xl font-bold text-text-neutral">
          {{ isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna' }}
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
          {{ isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna' }}
        </h1>
      </div>

      <!-- Nama Lengkap -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral">
            <span>Nama Lengkap</span>
            <RequiredBadge />
          </label>
          <span
            class="text-xs transition-colors"
            :class="formData.fullname.length >= 255 ? 'text-error font-semibold' : 'text-text-alt'"
          >
            {{ formData.fullname.length }}/255
          </span>
        </div>
        <Input
          v-model="formData.fullname"
          variant="semi-rounded"
          maxlength="255"
          placeholder="Masukkan nama lengkap..."
          :error="!!errors.fullname"
          @input="errors.fullname = ''"
        />
        <p v-if="errors.fullname" class="text-sm text-error mt-1">{{ errors.fullname }}</p>
      </div>

      <!-- Username & NISN -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between mb-1.5">
            <label class="flex items-center text-sm font-medium text-text-neutral">
              <span>Username</span>
              <RequiredBadge />
            </label>
            <span
              class="text-xs transition-colors"
              :class="
                formData.username.length >= 100 ? 'text-error font-semibold' : 'text-text-alt'
              "
            >
              {{ formData.username.length }}/100
            </span>
          </div>
          <Input
            v-model="formData.username"
            variant="semi-rounded"
            maxlength="100"
            placeholder="Masukkan username..."
            :error="!!errors.username"
            @input="errors.username = ''"
          />
          <p v-if="errors.username" class="text-sm text-error mt-1">{{ errors.username }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-neutral mb-1.5">NISN</label>
          <Input
            v-model="formData.nisn"
            variant="semi-rounded"
            maxlength="20"
            placeholder="Masukkan NISN (opsional)..."
          />
        </div>
      </div>

      <!-- Email & Angkatan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-neutral mb-1.5">Email</label>
          <Input
            v-model="formData.email"
            type="email"
            variant="semi-rounded"
            maxlength="255"
            placeholder="Masukkan email (opsional)..."
            :error="!!errors.email"
            @input="errors.email = ''"
          />
          <p v-if="errors.email" class="text-sm text-error mt-1">{{ errors.email }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-neutral mb-1.5">Angkatan</label>
          <Input
            v-model="formData.angkatan"
            variant="semi-rounded"
            maxlength="20"
            placeholder="Contoh: 2024 (opsional)..."
          />
        </div>
      </div>

      <!-- Role -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Role</span>
          <RequiredBadge />
        </label>
        <Select
          v-model="formData.role_id"
          variant="semi-rounded"
          size="large"
          placeholder="Pilih role..."
          :options="roleOptions"
          :error="!!errors.role_id"
          @update:model-value="errors.role_id = ''"
        />
        <p v-if="errors.role_id" class="text-sm text-error mt-1">{{ errors.role_id }}</p>
      </div>

      <!-- Password & Konfirmasi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Password</span>
            <RequiredBadge v-if="!isEditMode" />
          </label>
          <Input
            v-model="formData.password"
            type="password"
            variant="semi-rounded"
            :placeholder="
              isEditMode ? 'Kosongkan jika tidak ganti...' : 'Masukkan password (min. 5)...'
            "
            :error="!!errors.password"
            @input="errors.password = ''"
          />
          <p v-if="errors.password" class="text-sm text-error mt-1">{{ errors.password }}</p>
          <p v-else-if="isEditMode" class="text-xs text-text-alt mt-1">
            Kosongkan jika tidak ingin mengganti password.
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-neutral mb-1.5">Konfirmasi Password</label>
          <Input
            v-model="formData.password_confirmation"
            type="password"
            variant="semi-rounded"
            placeholder="Ulangi password..."
            :error="!!errors.password"
            @input="errors.password = ''"
          />
        </div>
      </div>

      <!-- Status -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-neutral mb-1.5">Status</label>
        <Select
          v-model="formData.status_code"
          variant="semi-rounded"
          size="large"
          placeholder=""
          :options="statusOptions"
        />
      </div>

      <!-- Wajib Ganti Password -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-neutral sm:text-base">
          Wajib Ganti Password Saat Login Berikutnya
        </label>
        <div class="flex items-center gap-6">
          <Radio
            v-model="formData.must_change_password"
            :value="true"
            size="normal"
            label="Ya"
          />
          <Radio
            v-model="formData.must_change_password"
            :value="false"
            size="normal"
            label="Tidak"
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
  </div>
</template>
