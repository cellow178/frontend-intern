<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import { RiSearchLine } from '@remixicon/vue'

// --- Role non-siswa (backend: -1 developer, 1 super-admin, 2 guru) ---
const NON_SISWA_ROLE_FILTER = JSON.stringify({ operator: 'in', value: [-1, 1, 2] })

// --- Interfaces ---
interface UserItem {
  id: number
  fullname: string
  username: string
  email: string | null
  role_id: number
  rel_role_id: string | null
  status_code: string
  must_change_password: boolean
  last_login_at: string | null
  created_at: string | null
}

// --- Router & Stores ---
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

// --- State Data ---
const userList = ref<UserItem[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
const searchQuery = ref('')
const globalSearchQuery = ref('')
const selectedStatus = ref<string>('')
let searchDebounce: ReturnType<typeof setTimeout> | undefined
let fetchAbortController: AbortController | null = null

// --- State Pagination ---
const currentPage = ref(1)
const totalData = ref(0)
const totalPage = ref(1)
const pageSize = ref(10)

// --- State Modals & Actions ---
const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const isResetModalOpen = ref(false)
const selectedResetId = ref<number | null>(null)
const selectedResetName = ref('')
const selectedResetUsername = ref('')
const resetPassword = ref('')
const resetPasswordConfirm = ref('')
const isResetting = ref(false)

const isStatusModalOpen = ref(false)
const selectedStatusId = ref<number | null>(null)
const selectedStatusName = ref('')
const selectedStatusCurrent = ref('')
const isUpdatingStatus = ref(false)

// Kolom tabel (tanpa NISN/tahun lulus — itu milik halaman Data Siswa)
const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-36 text-center' },
  { key: 'fullname', label: 'Nama Lengkap', width: 'min-w-[200px]' },
  { key: 'username', label: 'Username', width: 'min-w-[140px]' },
  { key: 'rel_role_id', label: 'Role', width: 'min-w-[140px]' },
  { key: 'status_code', label: 'Status', width: 'w-40 text-center' },
]

// Backend Users::FIELD_VALIDATION + UsersController::updateStatus hanya mengenal:
// user_active & user_nonactive (DoLogin pun hanya meloloskan user_active).
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'user_active', label: 'Aktif' },
  { value: 'user_nonactive', label: 'Nonaktif' },
]

const isSelf = (id: number) => authStore.user?.id === id

// Akun developer (role_id -1) hanya boleh dikelola sesama developer
// (backend: Users::beforeUpdate/beforeDelete + resetPassword menolak non-developer).
const isCurrentDeveloper = computed(() => authStore.user?.role_id === -1)
const isDeveloperRowLocked = (roleId: unknown) => Number(roleId) === -1 && !isCurrentDeveloper.value
const developerLockTitle = 'Hanya developer yang dapat mengelola akun ini'

// --- Fetch User Data (non-siswa; global search mengabaikan filter role) ---
const fetchUsers = async () => {
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const isGlobal = globalSearchQuery.value.trim() !== ''
    const params: Record<string, unknown> = {
      search: (isGlobal ? globalSearchQuery.value.trim() : searchQuery.value.trim()) || undefined,
      status_code: selectedStatus.value || undefined,
      limit: pageSize.value,
      page: currentPage.value,
    }
    if (!isGlobal) {
      params.role_id = NON_SISWA_ROLE_FILTER
    }

    const response = await api.get('/users', {
      params,
      signal: fetchAbortController.signal,
    })

    userList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
  } catch (error) {
    if (axios.isCancel(error)) return
    toastStore.show('Gagal memuat Pengguna.', 'error')
  } finally {
    if (!fetchAbortController.signal.aborted) {
      isLoading.value = false
    }
  }
}

// --- Handlers & Watchers ---
const onFilterChange = () => {
  currentPage.value = 1
  fetchUsers()
}

const handleResetFilters = () => {
  selectedStatus.value = ''
  globalSearchQuery.value = ''
  onFilterChange()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

watch(globalSearchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => {
  router.push({ name: 'dashboard-pengguna-create' })
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-pengguna-detail', params: { id } })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-pengguna-edit', params: { id } })
}

// --- Hapus ---
const openDeleteModal = (id: number) => {
  selectedDeleteId.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  selectedDeleteId.value = null
}

const confirmDelete = async () => {
  if (!selectedDeleteId.value) return

  isDeleting.value = true
  try {
    await api.delete('/users/delete', { data: { id: selectedDeleteId.value } })
    toastStore.show('Pengguna berhasil dihapus!', 'success')
    closeDeleteModal()
    fetchUsers()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus pengguna.', 'error')
  } finally {
    isDeleting.value = false
  }
}

// --- Nonaktif / Aktifkan (POST /users/update-status) ---
const openStatusModal = (item: UserItem) => {
  selectedStatusId.value = item.id
  selectedStatusName.value = item.fullname
  selectedStatusCurrent.value = item.status_code
  isStatusModalOpen.value = true
}

const closeStatusModal = () => {
  isStatusModalOpen.value = false
  selectedStatusId.value = null
  selectedStatusName.value = ''
  selectedStatusCurrent.value = ''
}

const confirmStatusChange = async (toStatus: 'user_active' | 'user_nonactive') => {
  if (!selectedStatusId.value) return

  isUpdatingStatus.value = true
  try {
    await api.post('/users/update-status', {
      id: selectedStatusId.value,
      status_code: toStatus,
    })
    toastStore.show(
      toStatus === 'user_active'
        ? 'Pengguna berhasil diaktifkan!'
        : 'Pengguna berhasil dinonaktifkan!',
      'success',
    )
    closeStatusModal()
    fetchUsers()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal mengubah status pengguna.', 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// --- Reset password non-siswa: password baru WAJIB = username + konfirmasi ---
// (backend UsersController@resetPassword memvalidasinya per role).
const openResetModal = (item: UserItem) => {
  selectedResetId.value = item.id
  selectedResetName.value = item.fullname
  selectedResetUsername.value = item.username
  resetPassword.value = ''
  resetPasswordConfirm.value = ''
  isResetModalOpen.value = true
}

const closeResetModal = () => {
  isResetModalOpen.value = false
  selectedResetId.value = null
  selectedResetName.value = ''
  selectedResetUsername.value = ''
  resetPassword.value = ''
  resetPasswordConfirm.value = ''
}

const confirmResetPassword = async () => {
  if (!selectedResetId.value) return
  if (resetPassword.value.length < 5) {
    toastStore.show('Password baru minimal 5 karakter.', 'error')
    return
  }
  if (resetPassword.value !== selectedResetUsername.value) {
    toastStore.show('Password baru harus sama dengan username.', 'error')
    return
  }
  if (resetPassword.value !== resetPasswordConfirm.value) {
    toastStore.show('Konfirmasi password tidak cocok.', 'error')
    return
  }

  isResetting.value = true
  try {
    const response = await api.post('/users/reset-password', {
      id: selectedResetId.value,
      new_password: resetPassword.value,
      new_password_confirmation: resetPasswordConfirm.value,
    })
    toastStore.show(response.data?.message || 'Password berhasil direset!', 'success')
    closeResetModal()
    fetchUsers()
  } catch (error) {
    const err = error as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = err.response?.data?.errors
    if (fieldErrors?.new_password?.[0]) {
      toastStore.show(fieldErrors.new_password[0], 'error')
    } else if (fieldErrors?.new_password_confirmation?.[0]) {
      toastStore.show(fieldErrors.new_password_confirmation[0], 'error')
    } else {
      toastStore.show(err.response?.data?.message || 'Gagal mereset password.', 'error')
    }
  } finally {
    isResetting.value = false
  }
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchUsers()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchUsers()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold text-text-neutral">Pengguna / Admin</h1>
      <p class="text-sm text-text-alt">Kelola akun developer, super admin, dan guru.</p>
    </div>

    <!-- Search global lintas role (siswa + non-siswa) -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
      <div class="flex-1 max-w-md">
        <Input
          v-model="globalSearchQuery"
          type="text"
          size="mobile"
          variant="semi-rounded"
          tone="warning"
          placeholder="Cari seluruh pengguna..."
          :icon="RiSearchLine"
        />
      </div>
      <span v-if="globalSearchQuery.trim()" class="text-xs text-warning font-medium">
        Mode pencarian global: menampilkan semua role.
      </span>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="userList"
      :is-loading="isLoading"
      :show-add-button="true"
      :show-filter-button="true"
      add-button-label="Tambah Pengguna"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari pengguna (non-siswa)..."
      empty-message="Tidak ada pengguna ditemukan."
      loading-label="Memuat data pengguna..."
      @add="handleAdd"
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <!-- Filters -->
      <template #filters>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div class="w-full sm:w-fit sm:min-w-52">
            <Select
              v-model="selectedStatus"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="statusOptions"
              @update:model-value="onFilterChange"
            />
          </div>
        </div>
      </template>

      <!-- Column: No -->
      <template #col-no="{ index }">
        <div class="text-center font-medium">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>
      </template>

      <!-- Column: Action -->
      <template #col-action="{ item }">
        <div class="flex items-center justify-center gap-1.5">
          <DashboardIconButton
            variant="info"
            label="Detail"
            class="w-7 h-7"
            @click="handleDetail(item.id)"
          />
          <DashboardIconButton
            variant="edit"
            label="Edit"
            class="w-7 h-7"
            :disabled="isDeveloperRowLocked(item.role_id)"
            :title="isDeveloperRowLocked(item.role_id) ? developerLockTitle : 'Edit'"
            @click="!isDeveloperRowLocked(item.role_id) && handleEdit(item.id)"
          />
          <DashboardIconButton
            variant="reset"
            label="Reset password"
            class="w-7 h-7"
            :disabled="isDeveloperRowLocked(item.role_id)"
            :title="isDeveloperRowLocked(item.role_id) ? developerLockTitle : 'Reset password'"
            @click="!isDeveloperRowLocked(item.role_id) && openResetModal(item as UserItem)"
          />
          <DashboardIconButton
            variant="status"
            :active="item.status_code === 'user_active'"
            :label="item.status_code === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
            :title="
              isDeveloperRowLocked(item.role_id)
                ? developerLockTitle
                : isSelf(item.id)
                  ? 'Tidak dapat mengubah status akun sendiri'
                  : item.status_code === 'user_active'
                    ? 'Nonaktifkan'
                    : 'Aktifkan'
            "
            class="w-7 h-7"
            :disabled="isSelf(item.id) || isDeveloperRowLocked(item.role_id)"
            @click="
              !isSelf(item.id) &&
              !isDeveloperRowLocked(item.role_id) &&
              openStatusModal(item as UserItem)
            "
          />
          <DashboardIconButton
            variant="delete"
            label="Hapus"
            class="w-7 h-7"
            :disabled="isSelf(item.id) || isDeveloperRowLocked(item.role_id)"
            :title="
              isDeveloperRowLocked(item.role_id)
                ? developerLockTitle
                : isSelf(item.id)
                  ? 'Tidak dapat menghapus akun sendiri'
                  : 'Hapus'
            "
            @click="
              !isSelf(item.id) && !isDeveloperRowLocked(item.role_id) && openDeleteModal(item.id)
            "
          />
        </div>
      </template>

      <!-- Column: Nama Lengkap -->
      <template #col-fullname="{ item }">
        <div class="flex flex-col">
          <span class="font-medium text-text-neutral line-clamp-1" :title="item.fullname">
            {{ item.fullname }}
          </span>
          <span v-if="item.email" class="text-xs text-text-alt line-clamp-1" :title="item.email">
            {{ item.email }}
          </span>
        </div>
      </template>

      <!-- Column: Username -->
      <template #col-username="{ item }">
        <span class="font-medium text-text-neutral">{{ item.username }}</span>
      </template>

      <!-- Column: Role -->
      <template #col-rel_role_id="{ item }">
        <span class="font-medium text-text-neutral">
          {{ item.rel_role_id || '-' }}
        </span>
      </template>

      <!-- Column: Status -->
      <template #col-status_code="{ item }">
        <div class="flex justify-center">
          <DashboardStatusBadge :active="item.status_code === 'user_active'" />
        </div>
      </template>

      <!-- Mobile View Card -->
      <template #mobile-card="{ item, index }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-alt font-medium">
            #{{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <div class="flex items-center gap-1.5">
            <DashboardIconButton variant="info" label="Detail" @click="handleDetail(item.id)" />
            <DashboardIconButton
              variant="edit"
              label="Edit"
              :disabled="isDeveloperRowLocked(item.role_id)"
              :title="isDeveloperRowLocked(item.role_id) ? developerLockTitle : 'Edit'"
              @click="!isDeveloperRowLocked(item.role_id) && handleEdit(item.id)"
            />
            <DashboardIconButton
              variant="reset"
              label="Reset password"
              :disabled="isDeveloperRowLocked(item.role_id)"
              :title="isDeveloperRowLocked(item.role_id) ? developerLockTitle : 'Reset password'"
              @click="!isDeveloperRowLocked(item.role_id) && openResetModal(item as UserItem)"
            />
            <DashboardIconButton
              variant="status"
              :active="item.status_code === 'user_active'"
              :label="item.status_code === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
              :disabled="isSelf(item.id) || isDeveloperRowLocked(item.role_id)"
              @click="
                !isSelf(item.id) &&
                !isDeveloperRowLocked(item.role_id) &&
                openStatusModal(item as UserItem)
              "
            />
            <DashboardIconButton
              variant="delete"
              label="Hapus"
              :disabled="isSelf(item.id) || isDeveloperRowLocked(item.role_id)"
              @click="
                !isSelf(item.id) && !isDeveloperRowLocked(item.role_id) && openDeleteModal(item.id)
              "
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-text-neutral wrap-break-word">
              {{ item.fullname }}
            </span>
            <DashboardStatusBadge :active="item.status_code === 'user_active'" class="shrink-0" />
          </div>
          <span class="text-xs text-text-alt">@{{ item.username }}</span>
          <span v-if="item.email" class="text-xs text-text-alt">{{ item.email }}</span>
          <span class="text-xs font-medium text-text-neutral">{{ item.rel_role_id || '-' }}</span>
        </div>
      </template>
    </TableData>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Pengguna"
      message="Apakah Anda yakin ingin menghapus pengguna ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <!-- Modal Reset Password (non-siswa: password baru = username) -->
    <ConfirmModal
      :is-open="isResetModalOpen"
      :is-loading="isResetting"
      :title="`Reset Password — ${selectedResetName}`"
      :message="`Password baru wajib sama dengan username (${selectedResetUsername || '-'}). Pengguna wajib ganti password saat login berikutnya.`"
      confirm-text="Reset"
      confirm-variant="primary"
      cancel-text="Batal"
      @confirm="confirmResetPassword"
      @cancel="closeResetModal"
    >
      <div class="flex flex-col gap-3">
        <input
          v-model="resetPassword"
          type="password"
          :placeholder="`Ketik username: ${selectedResetUsername || '...'}`"
          class="w-full border border-text-alt/30 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <input
          v-model="resetPasswordConfirm"
          type="password"
          placeholder="Konfirmasi password baru"
          class="w-full border border-text-alt/30 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
    </ConfirmModal>

    <!-- Modal Ubah Status -->
    <ConfirmModal
      :is-open="isStatusModalOpen"
      :is-loading="isUpdatingStatus"
      :title="`Ubah Status — ${selectedStatusName}`"
      :message="
        selectedStatusCurrent === 'user_active'
          ? 'Nonaktifkan akun ini? Akun tidak bisa login sampai diaktifkan kembali.'
          : 'Aktifkan kembali akun ini?'
      "
      :confirm-text="selectedStatusCurrent === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
      confirm-variant="primary"
      cancel-text="Batal"
      @confirm="
        confirmStatusChange(
          selectedStatusCurrent === 'user_active' ? 'user_nonactive' : 'user_active',
        )
      "
      @cancel="closeStatusModal"
    />
  </div>
</template>
