<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import Select from '@/components/ui/Select.vue'

// --- Interfaces ---
interface UserItem {
  id: number
  fullname: string
  username: string
  email: string | null
  nisn: string | null
  angkatan: string | null
  role_id: number
  rel_role_id: string | null
  status_code: string
  must_change_password: boolean
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string | null
}

// --- Router & Stores ---
const router = useRouter()
const toastStore = useToastStore()

// --- State Data ---
const userList = ref<UserItem[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
const searchQuery = ref('')
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

// Kolom tabel
const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-28 text-center' },
  { key: 'fullname', label: 'Nama Lengkap', width: 'min-w-[200px]' },
  { key: 'username', label: 'Username', width: 'min-w-[140px]' },
  { key: 'rel_role_id', label: 'Role', width: 'min-w-[140px]' },
  { key: 'status_code', label: 'Status', width: 'w-40 text-center' },
]

// Opsi filter status (mengikuti validasi backend: user_active, user_nonactive,
// user_rejected, email_unverified, email_verified)
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'user_active', label: 'Aktif' },
  { value: 'user_nonactive', label: 'Nonaktif' },
  { value: 'user_rejected', label: 'Ditolak' },
  { value: 'email_unverified', label: 'Email Belum Verifikasi' },
  { value: 'email_verified', label: 'Email Terverifikasi' },
]

const statusMeta = computed(() => {
  const map: Record<string, { label: string; classes: string }> = {
    user_active: { label: 'Aktif', classes: 'bg-success/15 text-success' },
    user_nonactive: { label: 'Nonaktif', classes: 'bg-error/15 text-error' },
    user_rejected: { label: 'Ditolak', classes: 'bg-error/15 text-error' },
    email_unverified: { label: 'Belum Verifikasi', classes: 'bg-warning/15 text-warning' },
    email_verified: { label: 'Terverifikasi', classes: 'bg-info/15 text-info' },
  }
  return (code: string) => map[code] ?? { label: code || '-', classes: 'bg-secondary/40 text-text-alt' }
})

// --- Fetch User Data ---
const fetchUsers = async () => {
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/users', {
      params: {
        search: searchQuery.value.trim() || undefined,
        status_code: selectedStatus.value || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
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
  onFilterChange()
}

watch(searchQuery, () => {
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
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Daftar Pengguna</h1>
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
      search-placeholder="Cari nama, username, email, NISN..."
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
            @click="handleEdit(item.id)"
          />
          <DashboardIconButton
            variant="delete"
            label="Hapus"
            class="w-7 h-7"
            @click="openDeleteModal(item.id)"
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
        <div class="flex flex-col">
          <span class="font-medium text-text-neutral">{{ item.username }}</span>
          <span v-if="item.nisn" class="text-xs text-text-alt">NISN: {{ item.nisn }}</span>
        </div>
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
          <span
            class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold"
            :class="statusMeta(item.status_code).classes"
          >
            {{ statusMeta(item.status_code).label }}
          </span>
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
            <DashboardIconButton variant="edit" label="Edit" @click="handleEdit(item.id)" />
            <DashboardIconButton variant="delete" label="Hapus" @click="openDeleteModal(item.id)" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-text-neutral wrap-break-word">
              {{ item.fullname }}
            </span>
            <span
              class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold shrink-0"
              :class="statusMeta(item.status_code).classes"
            >
              {{ statusMeta(item.status_code).label }}
            </span>
          </div>
          <span class="text-xs text-text-alt">@{{ item.username }}</span>
          <span v-if="item.email" class="text-xs text-text-alt">{{ item.email }}</span>
          <div class="flex items-center gap-2 mt-1 text-xs">
            <span class="font-medium text-text-neutral">{{ item.rel_role_id || '-' }}</span>
            <span v-if="item.nisn" class="text-text-alt">• NISN: {{ item.nisn }}</span>
          </div>
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
  </div>
</template>
