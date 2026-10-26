<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Radio from '@/components/ui/Radio.vue'
import AdminButton from '@/components/ui/AdminButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { RiSaveLine, RiContactsLine, RiTeamLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const userId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => !!userId.value)
// Mode siswa: route dashboard-siswa-* mengunci role_id=3 + field NISN/masa_studi
// (tahun lulus dihitung backend: (2000 + 2 digit NISN) + masa_studi).
const isStudentMode = computed(() => (route.name as string | undefined)?.startsWith('dashboard-siswa') ?? false)

const isLoading = ref(false)
const isSubmitting = ref(false)

// Role statis dari migrasi DB (tidak ada endpoint /roles di backend):
// -1 developer, 1 super-admin, 2 guru, 3 siswa
const ALL_ROLE_OPTIONS = [
  { value: 1, label: 'Super Admin' },
  { value: 2, label: 'Guru' },
  { value: 3, label: 'Siswa' },
  { value: -1, label: 'Developer' },
]
// Halaman Pengguna/Admin: siswa dikelola di halaman Data Siswa tersendiri
const roleOptions = computed(() =>
  isStudentMode.value
    ? [{ value: 3, label: 'Siswa' }]
    : ALL_ROLE_OPTIONS.filter((r) => r.value !== 3),
)

// Sinkron backend Users::FIELD_VALIDATION: in:user_active,user_nonactive.
const statusOptions = [
  { value: 'user_active', label: 'Aktif' },
  { value: 'user_nonactive', label: 'Nonaktif' },
]

const formData = reactive({
  fullname: '',
  username: '',
  email: '',
  nis: '',
  nisn: '',
  masa_studi: '',
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
  nis: '',
  nisn: '',
  masa_studi: '',
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
    formData.nis = data.nis || ''
    formData.nisn = data.nisn || ''
    formData.masa_studi =
      data.masa_studi !== undefined && data.masa_studi !== null ? String(data.masa_studi) : ''
    formData.role_id = isStudentMode.value ? 3 : (data.role_id ?? null)
    formData.status_code = data.status_code || 'user_active'
    formData.must_change_password = isStudentMode.value ? !!data.must_change_password : false
  } catch {
    toastStore.show(
      isStudentMode.value ? 'Gagal memuat Detail Siswa.' : 'Gagal memuat Detail Pengguna.',
      'error',
    )
    router.push({ name: isStudentMode.value ? 'dashboard-siswa' : 'dashboard-pengguna' })
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

  // Mode siswa: username opsional (kosong => backend isi = NISN).
  if (!isStudentMode.value && !formData.username.trim()) {
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

  // Mode siswa: NIS wajib (sumber tahun masuk: 2 digit depan + masa studi
  // = tahun lulus), NISN nasional selalu 10 digit angka, masa studi wajib 1-10.
  if (isStudentMode.value) {
    if (!formData.nis.trim()) {
      errors.nis = 'NIS wajib diisi.'
      isValid = false
    } else if (!/^\d+$/.test(formData.nis.trim())) {
      errors.nis = 'NIS harus berupa angka.'
      isValid = false
    } else if (formData.nis.trim().length > 20) {
      errors.nis = 'NIS maksimal 20 digit.'
      isValid = false
    } else {
      errors.nis = ''
    }

    if (!formData.nisn.trim()) {
      errors.nisn = 'NISN wajib diisi.'
      isValid = false
    } else if (!/^\d{10}$/.test(formData.nisn.trim())) {
      errors.nisn = 'NISN harus 10 digit angka.'
      isValid = false
    } else {
      errors.nisn = ''
    }

    if (!formData.masa_studi.trim()) {
      errors.masa_studi = 'Masa studi wajib diisi.'
      isValid = false
    } else if (
      !/^\d+$/.test(formData.masa_studi.trim()) ||
      Number(formData.masa_studi) < 1 ||
      Number(formData.masa_studi) > 10
    ) {
      errors.masa_studi = 'Masa studi harus angka 1-10 tahun.'
      isValid = false
    } else {
      errors.masa_studi = ''
    }
  } else {
    errors.nis = ''
    errors.nisn = ''
    errors.masa_studi = ''
  }

  // Password: mode siswa tidak ada input password (selalu = NISN, backend
  // Users::beforeInsert). Mode pengguna: wajib saat create (min 5),
  // opsional saat edit (kosong = tidak ganti).
  if (isStudentMode.value) {
    errors.password = ''
  } else if (!isEditMode.value || formData.password) {
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

  // Mode siswa: username kosong di frontend => kirim = NISN agar lolos
  // validasi required backend (backend juga mengisi otomatis bila kosong).
  const usernameToSend =
    isStudentMode.value && formData.username.trim() === ''
      ? formData.nisn.trim()
      : formData.username.trim()

  const payload: Record<string, unknown> = {
    fullname: formData.fullname.trim(),
    username: usernameToSend,
    email: emptyToNull(formData.email),
    // Pengguna/admin cukup: nama, username, email, role, password, status.
    // Field khas siswa (nis/nisn/masa_studi) selalu null di mode pengguna.
    nis: isStudentMode.value ? emptyToNull(formData.nis) : null,
    nisn: isStudentMode.value ? emptyToNull(formData.nisn) : null,
    masa_studi:
      isStudentMode.value && formData.masa_studi.trim() !== ''
        ? Number(formData.masa_studi)
        : null,
    role_id: isStudentMode.value ? 3 : formData.role_id,
    status_code: formData.status_code,
    must_change_password: formData.must_change_password,
  }

  // Mode siswa: password selalu = NISN (ditentukan backend, jangan kirim).
  // Mode pengguna: kirim password hanya jika diisi (kosong = tidak ganti).
  if (!isStudentMode.value && formData.password) {
    payload.password = formData.password
  }

  try {
    const entityLabel = isStudentMode.value ? 'Siswa' : 'Pengguna'
    const listRoute = isStudentMode.value ? 'dashboard-siswa' : 'dashboard-pengguna'
    if (isEditMode.value) {
      await api.put('/users/update', { id: userId.value, ...payload })
      toastStore.show(`${entityLabel} berhasil diperbarui!`, 'success')
    } else {
      await api.post('/users/create', payload)
      toastStore.show(`${entityLabel} berhasil ditambahkan!`, 'success')
    }
    router.push({ name: listRoute })
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
      if (fieldErrors.nis?.[0]) errors.nis = fieldErrors.nis[0]
      if (fieldErrors.nisn?.[0]) errors.nisn = fieldErrors.nisn[0]
      if (fieldErrors.masa_studi?.[0]) errors.masa_studi = fieldErrors.masa_studi[0]
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
  router.push({ name: isStudentMode.value ? 'dashboard-siswa' : 'dashboard-pengguna' })
}

onMounted(() => {
  if (isStudentMode.value && !isEditMode.value) {
    formData.role_id = 3
    formData.must_change_password = true
  }
  if (isEditMode.value) {
    fetchDetail()
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isLoading" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div>
        <BackButton :to="isStudentMode ? '/dashboard/data-siswa' : '/dashboard/pengguna'" :sticky="false" />
      </div>

      <div class="border-b border-text-alt/50 pb-4 mb-8">
        <h1 class="flex items-center gap-2 text-xl font-bold text-text-neutral">
          <RiContactsLine v-if="isStudentMode" class="w-5 h-5 text-primary shrink-0" />
          <RiTeamLine v-else class="w-5 h-5 text-primary shrink-0" />
          {{ isEditMode ? (isStudentMode ? 'Edit Siswa' : 'Edit Pengguna') : isStudentMode ? 'Tambah Siswa' : 'Tambah Pengguna' }}
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
      <div>
        <BackButton :to="isStudentMode ? '/dashboard/data-siswa' : '/dashboard/pengguna'" :sticky="false" />
      </div>

      <!-- Card Header (ikon beda: siswa vs pengguna) -->
      <div class="border-b border-text-alt/50 pb-4">
        <h1 class="flex items-center gap-2 text-xl font-bold text-text-neutral">
          <RiContactsLine v-if="isStudentMode" class="w-5 h-5 text-primary shrink-0" />
          <RiTeamLine v-else class="w-5 h-5 text-primary shrink-0" />
          {{ isEditMode ? (isStudentMode ? 'Edit Siswa' : 'Edit Pengguna') : isStudentMode ? 'Tambah Siswa' : 'Tambah Pengguna' }}
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

      <!-- Username & Email (berlaku untuk siswa & pengguna) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between mb-1.5">
            <label class="flex items-center text-sm font-medium text-text-neutral">
              <span>Username</span>
              <RequiredBadge v-if="!isStudentMode" />
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
            :placeholder="isStudentMode ? 'Default: NISN...' : 'Masukkan username...'"
            :error="!!errors.username"
            @input="errors.username = ''"
          />
          <p v-if="errors.username" class="text-sm text-error mt-1">{{ errors.username }}</p>
        </div>

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
      </div>

      <!-- Khusus siswa: NISN + NIS + Masa Studi -->
      <template v-if="isStudentMode">
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>NISN (nasional, 10 digit)</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="formData.nisn"
            variant="semi-rounded"
            maxlength="10"
            placeholder="cth: 0082345678..."
            :error="!!errors.nisn"
            @input="errors.nisn = ''"
          />
          <p v-if="errors.nisn" class="text-sm text-error mt-1">{{ errors.nisn }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
              <span>NIS</span>
              <RequiredBadge />
            </label>
            <Input
              v-model="formData.nis"
              variant="semi-rounded"
              maxlength="20"
              placeholder="cth: 234273345..."
              :error="!!errors.nis"
              @input="errors.nis = ''"
            />
            <p v-if="errors.nis" class="text-sm text-error mt-1">{{ errors.nis }}</p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
              <span>Masa Studi (tahun)</span>
              <RequiredBadge />
            </label>
            <Input
              v-model="formData.masa_studi"
              type="number"
              min="1"
              variant="semi-rounded"
              placeholder="Contoh: 3..."
              :error="!!errors.masa_studi"
              @input="errors.masa_studi = ''"
            />
            <p v-if="errors.masa_studi" class="text-sm text-error mt-1">
              {{ errors.masa_studi }}
            </p>
          </div>
        </div>
      </template>

      <!-- Role (disembunyikan di mode siswa: selalu Siswa) -->
      <div v-if="!isStudentMode" class="flex flex-col gap-1.5">
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

      <!-- Info password otomatis (mode siswa: selalu = NISN) -->
      <div
        v-if="isStudentMode"
        class="rounded-xl border border-info/30 bg-info/5 px-4 py-3 text-sm text-text-neutral"
      >
        Password siswa otomatis sama dengan NISN dan tidak perlu diisi.
      </div>

      <!-- Password & Konfirmasi (hanya mode pengguna/admin) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
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

      <!-- Wajib Ganti Password (khusus siswa; pengguna atur via reset) -->
      <div v-if="isStudentMode" class="flex flex-col gap-2">
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
        <AdminButton type="button" size="md" variant="secondary" label="Batal" @click="handleCancel" />
        <AdminButton
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
