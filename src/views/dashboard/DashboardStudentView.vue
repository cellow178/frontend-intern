<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import Select from '@/components/ui/Select.vue'
import AdminButton from '@/components/ui/AdminButton.vue'
import Input from '@/components/ui/Input.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import {
  RiUploadLine,
  RiGraduationCapLine,
  RiPrinterLine,
  RiDeleteBinLine,
} from '@remixicon/vue'

// --- Role siswa (backend role id 3) ---
const SISWA_ROLE_ID = 3

// --- Interfaces ---
// Backend Users memakai `nis` (kode sekolah, opsional) + `nisn` (nasional,
// 10 digit, identitas unik utama) + `masa_studi`. Tahun lulus ideal =
// tahun masuk + masa_studi (lihat calcTahunLulus ikut backend).
interface StudentItem {
  id: number
  fullname: string
  username: string
  nis: string | null
  nisn: string | null
  masa_studi: number | null
  role_id: number
  status_code: string
  must_change_password: boolean
  last_login_at: string | null
}

// Ikut Users::calcTahunLulus: tahun lulus = (2000 + 2 digit NIS) + masa studi.
// NIS = kode sekolah (sumber tahun masuk), bukan NISN.
// Cth: NIS 234273345 + masa studi 4 => 2000 + 23 + 4 = 2027.
const calcTahunLulus = (nis: string | null, masaStudi: number | null): number | null => {
  const masa = Number(masaStudi ?? 0)
  if (!masa || masa < 1) return null
  const nisStr = String(nis ?? '')
  if (nisStr.length < 2 || !/^\d{2}/.test(nisStr.slice(0, 2))) return null
  return 2000 + Number(nisStr.slice(0, 2)) + masa
}

// --- Router & Stores ---
const router = useRouter()
const toastStore = useToastStore()

// --- State Data ---
const studentList = ref<StudentItem[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
// Semua filter dikirim ke backend (server-side) agar tabel + paginasi benar.
// Opsi tahun masuk / tahun lulus / masa studi diambil dari SELURUH DB lewat
// GET /users/student-filter-options (bukan dari halaman tabel yang aktif).
const searchQuery = ref('')
const selectedStatus = ref<string>('')
const selectedTahunLulus = ref<string>('')
const selectedTahunMasuk = ref<string>('')
const selectedMasaStudi = ref<string>('')
const tahunMasukOptions = ref<{ value: string; label: string }[]>([])
const tahunLulusOptions = ref<{ value: string; label: string }[]>([])
const masaStudiOptions = ref<{ value: string; label: string }[]>([])
let searchDebounce: ReturnType<typeof setTimeout> | undefined
let fetchAbortController: AbortController | null = null

// --- State Pagination ---
const currentPage = ref(1)
const totalData = ref(0)
const totalPage = ref(1)
const pageSize = ref(20)

// --- State Modals & Actions ---
const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const isResetModalOpen = ref(false)
const selectedResetId = ref<number | null>(null)
const selectedResetName = ref('')
const selectedResetNisn = ref('')
const isResetting = ref(false)

// --- Graduate state ---
const isGraduateModalOpen = ref(false)
const graduateYear = ref('')
const isGraduating = ref(false)

// --- Cetak kredensial (siswa aktif + masih wajib ganti password) ---
// Selalu bulk per angkatan: satu-satunya filter adalah TAHUN MASUK
// (2 digit depan NIS). 1 angkatan bisa beda masa studi / beda tahun lulus.
const isPrinting = ref(false)
const isPrintModalOpen = ref(false)
const printTahunMasuk = ref('')

// Kolom tabel khas siswa: nama, NIS (kode sekolah), NISN (=username awal),
// masa studi, tahun lulus ideal (dihitung), status, wajib-ganti-password
const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-28 text-center' },
  { key: 'fullname', label: 'Nama Lengkap', width: 'min-w-[200px]' },
  { key: 'nis', label: 'NIS', width: 'min-w-[100px]' },
  { key: 'nisn', label: 'NISN', width: 'min-w-[130px]' },
  { key: 'masa_studi', label: 'Masa Studi', width: 'w-24 text-center' },
  { key: 'tahun_lulus', label: 'Tahun Lulus', width: 'w-28 text-center' },
  { key: 'must_change_password', label: 'Ganti PW', width: 'w-24 text-center' },
  { key: 'status_code', label: 'Status', width: 'w-36 text-center' },
]

// Sinkron backend: hanya user_active & user_nonactive yang valid.
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'user_active', label: 'Aktif' },
  { value: 'user_nonactive', label: 'Nonaktif (Lulus)' },
]

const tahunLulusFilterOptions = computed(() => [
  { value: '', label: 'Semua Tahun Kelulusan' },
  ...tahunLulusOptions.value,
])

const tahunMasukFilterOptions = computed(() => [
  { value: '', label: 'Semua Angkatan' },
  ...tahunMasukOptions.value,
])

const masaStudiFilterOptions = computed(() => [
  { value: '', label: 'Semua Masa Studi' },
  ...masaStudiOptions.value,
])

// Opsi filter dari seluruh DB (sekali per buka halaman + sesudah data berubah).
const fetchFilterOptions = async () => {
  try {
    const response = await api.get('/users/student-filter-options')
    tahunMasukOptions.value = response.data?.data?.tahun_masuk ?? []
    tahunLulusOptions.value = response.data?.data?.tahun_lulus ?? []
    masaStudiOptions.value = response.data?.data?.masa_studi ?? []
  } catch {
    // Opsi kosong = dropdown hanya menampilkan pilihan "Semua...", tabel tetap jalan.
  }
}

// --- Fetch Siswa (filter default role_id=3) ---
const fetchStudents = async () => {
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/users', {
      params: {
        search: searchQuery.value.trim() || undefined,
        role_id: SISWA_ROLE_ID,
        status_code: selectedStatus.value || undefined,
        tahun_lulus: selectedTahunLulus.value || undefined,
        tahun_masuk: selectedTahunMasuk.value || undefined,
        masa_studi: selectedMasaStudi.value || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
      signal: fetchAbortController.signal,
    })

    studentList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
  } catch (error) {
    if (axios.isCancel(error)) return
    toastStore.show('Gagal memuat Data Siswa.', 'error')
  } finally {
    if (!fetchAbortController.signal.aborted) {
      isLoading.value = false
    }
  }
}

// --- Handlers & Watchers ---
const onFilterChange = () => {
  currentPage.value = 1
  fetchStudents()
}

const handleResetFilters = () => {
  selectedStatus.value = ''
  selectedTahunLulus.value = ''
  selectedTahunMasuk.value = ''
  selectedMasaStudi.value = ''
  onFilterChange()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => {
  router.push({ name: 'dashboard-siswa-create' })
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-siswa-detail', params: { id } })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-siswa-edit', params: { id } })
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
    toastStore.show('Data siswa berhasil dihapus!', 'success')
    closeDeleteModal()
    fetchStudents()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus data siswa.', 'error')
  } finally {
    isDeleting.value = false
  }
}

// --- Nonaktif manual (POST /users/update-status) ---
const isStatusModalOpen = ref(false)
const selectedStatusId = ref<number | null>(null)
const selectedStatusName = ref('')
const selectedStatusCurrent = ref('')
const isUpdatingStatus = ref(false)

const openStatusModal = (item: StudentItem) => {
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
      toStatus === 'user_active' ? 'Siswa berhasil diaktifkan!' : 'Siswa berhasil dinonaktifkan!',
      'success',
    )
    closeStatusModal()
    fetchStudents()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal mengubah status siswa.', 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// --- Reset password siswa: tanpa input, selalu kembali = NISN ---
// (backend UsersController@resetPassword menanganinya per role).
const openResetModal = (item: StudentItem) => {
  selectedResetId.value = item.id
  selectedResetName.value = item.fullname
  selectedResetNisn.value = item.nisn ?? ''
  isResetModalOpen.value = true
}

const closeResetModal = () => {
  isResetModalOpen.value = false
  selectedResetId.value = null
  selectedResetName.value = ''
  selectedResetNisn.value = ''
}

const confirmResetPassword = async () => {
  if (!selectedResetId.value) return

  isResetting.value = true
  try {
    const response = await api.post('/users/reset-password', {
      id: selectedResetId.value,
    })
    toastStore.show(response.data?.message || 'Password berhasil direset!', 'success')
    closeResetModal()
    fetchStudents()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal mereset password.', 'error')
  } finally {
    isResetting.value = false
  }
}

// Import Excel pindah ke halaman mandiri (StudentImportView) agar tidak
// rawan tertutup seperti modal. Tombol toolbar cukup navigasi ke sana.
const handleImportExcel = () => {
  router.push({ name: 'dashboard-siswa-import' })
}

// --- Luluskan per tahun (POST /students/graduate) ---
const openGraduateModal = () => {
  graduateYear.value = ''
  isGraduateModalOpen.value = true
}

const closeGraduateModal = () => {
  isGraduateModalOpen.value = false
}

const confirmGraduate = async () => {
  // Backend: tanpa tahun_lulus => luluskan semua yang tahun lulusnya <= tahun
  // berjalan; dengan tahun_lulus => batas eksplisit per angkatan.
  const raw = graduateYear.value.trim()
  const year = raw === '' ? undefined : Number(raw)
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
    toastStore.show('Tahun lulus harus angka 2000-2100.', 'error')
    return
  }

  isGraduating.value = true
  try {
    const response = await api.post(
      '/students/graduate',
      year === undefined ? {} : { tahun_lulus: year },
    )
    toastStore.show(response.data?.message || 'Kelulusan berhasil diproses!', 'success')
    closeGraduateModal()
    fetchStudents()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal memproses kelulusan.', 'error')
  } finally {
    isGraduating.value = false
  }
}

// --- Cetak Excel kredensial (reset password massal + unduh xlsx) ---
// Password siswa selalu = NISN, jadi endpoint me-reset tiap siswa kembali
// ke NISN-nya lalu menulis kredensialnya ke Excel.
const openPrintModal = () => {
  printTahunMasuk.value = ''
  isPrintModalOpen.value = true
}

const closePrintModal = () => {
  isPrintModalOpen.value = false
}

const confirmPrint = async () => {
  const rawTahun = printTahunMasuk.value.trim()
  if (rawTahun !== '') {
    const y = Number(rawTahun)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      toastStore.show('Tahun masuk harus angka 2000-2100.', 'error')
      return
    }
  }

  isPrinting.value = true
  try {
    const response = await api.get('/students/print-credentials', {
      params: {
        tahun_masuk: rawTahun !== '' ? Number(rawTahun) : undefined,
      },
      responseType: 'blob',
    })
    // Nama file dibentuk di frontend agar selalu ikut filter angkatan:
    // kredensial_siswa_angkatan-2023_<timestamp>.xlsx (tanpa filter = tanpa suffix).
    // Stamp memakai waktu lokal perangkat (WIB bila dispositivo di zona WIB).
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const suffix = rawTahun !== '' ? `_angkatan-${rawTahun}` : ''
    const fileName = `kredensial_siswa${suffix}_${stamp}.xlsx`
    const url = URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    toastStore.show(
      'File kredensial diunduh. Password siswa terkait sudah di-reset — bagikan file dengan aman.',
      'success',
    )
    closePrintModal()
    fetchStudents()
  } catch (error) {
    const err = error as {
      response?: { data?: Blob | { message?: string }; status?: number }
      message?: string
    }
    // Backend mengembalikan JSON error meski responseType blob.
    let message = err.message || 'Gagal mencetak kredensial.'
    const blobData = err.response?.data
    if (blobData instanceof Blob) {
      try {
        const text = await blobData.text()
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) message = parsed.message
      } catch {
        // biarkan pesan default
      }
    } else if (blobData?.message) {
      message = blobData.message
    }
    toastStore.show(message, 'error')
  } finally {
    isPrinting.value = false
  }
}

// Bersihkan lulusan pindah ke halaman mandiri (StudentPurgeView) agar tidak
// rawan tertutup seperti modal. Tombol toolbar cukup navigasi ke sana.
const handlePurgeGraduates = () => {
  router.push({ name: 'dashboard-siswa-purge' })
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchStudents()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchFilterOptions()
  fetchStudents()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold text-text-neutral">Data Siswa</h1>
      <p class="text-sm text-text-alt">
        Kelola akun siswa: import Excel, kelulusan, dan reset password.
      </p>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="studentList"
      :is-loading="isLoading"
      :show-add-button="true"
      :show-filter-button="true"
      add-button-label="Tambah Siswa"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari nama, username, NISN..."
      empty-message="Tidak ada data siswa ditemukan."
      loading-label="Memuat data siswa..."
      @add="handleAdd"
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <!-- Filters (semua server-side via GET /users) -->
      <template #filters>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedTahunMasuk"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="tahunMasukFilterOptions"
              @update:model-value="onFilterChange"
            />
          </div>
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedMasaStudi"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="masaStudiFilterOptions"
              @update:model-value="onFilterChange"
            />
          </div>
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedTahunLulus"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="tahunLulusFilterOptions"
              @update:model-value="onFilterChange"
            />
          </div>
          <div class="w-full sm:w-fit">
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

      <!-- Toolbar khusus siswa: import & kelulusan (tidak ada di halaman Pengguna) -->
      <template #toolbar-actions>
        <div class="flex items-center gap-2 flex-wrap bg-secondary rounded-lg">
          <AdminButton
            size="sm"
            variant="secondary"
            label="Import Excel"
            :icon-left="RiUploadLine"
            @click="handleImportExcel"
          />
          <AdminButton
            size="sm"
            variant="secondary"
            label="Luluskan"
            :icon-left="RiGraduationCapLine"
            @click="openGraduateModal"
          />
          <AdminButton
            size="sm"
            variant="secondary"
            label="Cetak Kredensial"
            :icon-left="RiPrinterLine"
            @click="openPrintModal"
          />
          <AdminButton
            size="sm"
            variant="danger"
            label="Bersihkan Lulusan"
            :icon-left="RiDeleteBinLine"
            @click="handlePurgeGraduates"
          />
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
            variant="reset"
            label="Reset password"
            class="w-7 h-7"
            @click="openResetModal(item as StudentItem)"
          />
          <DashboardIconButton
            variant="status"
            :active="item.status_code === 'user_active'"
            :label="item.status_code === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
            :title="item.status_code === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
            class="w-7 h-7"
            @click="openStatusModal(item as StudentItem)"
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
        <span class="font-medium text-text-neutral line-clamp-1" :title="item.fullname">
          {{ item.fullname }}
        </span>
      </template>

      <!-- Column: NIS (kode sekolah) -->
      <template #col-nis="{ item }">
        <span class="font-medium text-text-neutral">{{ item.nis || '-' }}</span>
      </template>

      <!-- Column: NISN (+username bila berbeda) -->
      <template #col-nisn="{ item }">
        <div class="flex flex-col">
          <span class="font-medium text-text-neutral">{{ item.nisn || '-' }}</span>
          <span v-if="item.username && item.username !== item.nisn" class="text-xs text-text-alt">
            @{{ item.username }}
          </span>
        </div>
      </template>

      <!-- Column: Masa Studi -->
      <template #col-masa_studi="{ item }">
        <div class="text-center font-medium text-text-neutral">
          {{ item.masa_studi ?? '-' }}
        </div>
      </template>

      <!-- Column: Tahun Lulus (dihitung: 2000 + 2 digit NISN + masa studi) -->
      <template #col-tahun_lulus="{ item }">
        <div class="text-center font-medium text-text-neutral">
          {{ calcTahunLulus(item.nis, item.masa_studi) ?? '-' }}
        </div>
      </template>

      <!-- Column: Wajib ganti password -->
      <template #col-must_change_password="{ item }">
        <div class="flex justify-center">
          <span
            class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold"
            :class="
              item.must_change_password
                ? 'bg-warning/15 text-warning'
                : 'bg-success/15 text-success'
            "
          >
            {{ item.must_change_password ? 'Belum' : 'Sudah' }}
          </span>
        </div>
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
            <DashboardIconButton variant="edit" label="Edit" @click="handleEdit(item.id)" />
            <DashboardIconButton
              variant="reset"
              label="Reset password"
              @click="openResetModal(item as StudentItem)"
            />
            <DashboardIconButton
              variant="status"
              :active="item.status_code === 'user_active'"
              :label="item.status_code === 'user_active' ? 'Nonaktifkan' : 'Aktifkan'"
              @click="openStatusModal(item as StudentItem)"
            />
            <DashboardIconButton variant="delete" label="Hapus" @click="openDeleteModal(item.id)" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-text-neutral wrap-break-word">
              {{ item.fullname }}
            </span>
            <DashboardStatusBadge :active="item.status_code === 'user_active'" class="shrink-0" />
          </div>
          <span class="text-xs text-text-alt"
            >{{ item.nis ? `NIS ${item.nis} • ` : '' }}NISN: {{ item.nisn || '-' }}</span
          >
          <div class="flex items-center gap-2 text-xs">
            <span class="text-text-alt"
              >Studi: {{ item.masa_studi ?? '-' }} th • Lulus:
              {{ calcTahunLulus(item.nis, item.masa_studi) ?? '-' }}</span
            >
            <span
              class="font-bold"
              :class="item.must_change_password ? 'text-warning' : 'text-success'"
            >
              • Ganti PW: {{ item.must_change_password ? 'Belum' : 'Sudah' }}
            </span>
          </div>
        </div>
      </template>
    </TableData>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Data Siswa"
      message="Apakah Anda yakin ingin menghapus data siswa ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <!-- Modal Reset Password (siswa: kembali = NISN, tanpa input) -->
    <ConfirmModal
      :is-open="isResetModalOpen"
      :is-loading="isResetting"
      :title="`Reset Password — ${selectedResetName}`"
      :message="`Password akan dikembalikan ke NISN (${selectedResetNisn || '-'}). Siswa wajib ganti password saat login berikutnya.`"
      confirm-text="Reset ke NISN"
      confirm-variant="primary"
      cancel-text="Batal"
      @confirm="confirmResetPassword"
      @cancel="closeResetModal"
    />

    <!-- Modal Ubah Status -->
    <ConfirmModal
      :is-open="isStatusModalOpen"
      :is-loading="isUpdatingStatus"
      :title="`Ubah Status — ${selectedStatusName}`"
      :message="
        selectedStatusCurrent === 'user_active'
          ? 'Nonaktifkan akun siswa ini? Akun tidak bisa login sampai diaktifkan kembali.'
          : 'Aktifkan kembali akun siswa ini?'
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

    <!-- Modal Luluskan per Tahun (tetap modal: 1 langkah, rusak-kepencet pun aman) -->
    <ConfirmModal
      :is-open="isGraduateModalOpen"
      :is-loading="isGraduating"
      title="Luluskan Siswa per Tahun"
      message="Siswa aktif yang tahun lulusnya (dihitung) sudah lewat akan dinonaktifkan. Kosongkan tahun untuk meluluskan semua yang sudah waktunya, atau isi untuk batas angkatan tertentu. Data tidak dihapus."
      confirm-text="Luluskan"
      confirm-variant="primary"
      cancel-text="Batal"
      @confirm="confirmGraduate"
      @cancel="closeGraduateModal"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-neutral">Batas Tahun Lulus (opsional)</label>
        <Input
          v-model="graduateYear"
          type="number"
          variant="semi-rounded"
          placeholder="Kosongkan = tahun berjalan"
        />
      </div>
    </ConfirmModal>

    <!-- Modal Cetak Kredensial -->
    <ConfirmModal
      :is-open="isPrintModalOpen"
      :is-loading="isPrinting"
      title="Cetak Kredensial Siswa"
      message="Mengunduh Excel berisi kredensial seluruh siswa AKTIF yang masih wajib ganti password pada angkatan tersebut. Password tiap siswa akan dicetak sesuai NISN-nya masing-masing dan tertulis di file — bagikan dengan aman. Kosongkan tahun untuk mencetak semua angkatan."
      confirm-text="Unduh Excel"
      confirm-variant="primary"
      cancel-text="Batal"
      @confirm="confirmPrint"
      @cancel="closePrintModal"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-neutral">Tahun Masuk (angkatan)</label>
        <Input
          v-model="printTahunMasuk"
          type="number"
          variant="semi-rounded"
          placeholder="cth. 2026, kosongkan = semua..."
        />
      </div>
    </ConfirmModal>
  </div>
</template>
