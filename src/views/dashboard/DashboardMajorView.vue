<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { getFullFileUrl } from '@/utils/file'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import { RiImageLine } from '@remixicon/vue'

// --- Interfaces ---
interface MajorLogo {
  ext?: string
  url?: string
  tumbnail_url?: string
  filename?: string
  field_value?: string
}

interface MajorItem {
  id: number
  slug: string
  img_logo: MajorLogo | null
  code: string
  major_name: string
  summary: string
  total_classes: number
  major_duration: number
  full_description: string
  active: boolean
  created_by: number
  updated_by: number
  created_at: string
  updated_at?: string
  rel_created_by: string
  rel_updated_by?: string
  class_model_name: string
}

// --- Router & Stores ---
const router = useRouter()
const toastStore = useToastStore()

// --- State Data ---
const majorList = ref<MajorItem[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
const searchQuery = ref('')
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

// Track image load errors berdasarkan ID item
const imageErrors = ref<Record<number, boolean>>({})

// Kolom tabel
const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-28 text-center' },
  { key: 'img_logo', label: 'Logo', width: 'w-20 text-center' },
  { key: 'code', label: 'Kode', width: 'w-24 text-center' },
  { key: 'major_name', label: 'Keterangan', width: 'min-w-[220px]' },
  { key: 'active', label: 'Status', width: 'w-32 text-center' },
]

// --- Fetch Major Data ---
const fetchMajors = async () => {
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/majors', {
      params: {
        search: searchQuery.value.trim() || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
      signal: fetchAbortController.signal,
    })

    majorList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
    imageErrors.value = {}
  } catch (error) {
    if (axios.isCancel(error)) return
    toastStore.show('Gagal memuat data jurusan.', 'error')
  } finally {
    if (!fetchAbortController.signal.aborted) {
      isLoading.value = false
    }
  }
}

// --- Handlers & Watchers ---
const onFilterChange = () => {
  currentPage.value = 1
  fetchMajors()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => {
  router.push({ name: 'dashboard-jurusan-create' })
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-jurusan-detail', params: { id } })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-jurusan-edit', params: { id } })
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
    await api.delete('/majors/delete', { data: { id: selectedDeleteId.value } })
    toastStore.show('Jurusan berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchMajors()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus jurusan.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchMajors()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

// --- Helpers ---
const getImageUrl = (imgLogo: MajorLogo | null | undefined): string => {
  if (!imgLogo) return ''
  return getFullFileUrl(imgLogo) || imgLogo.field_value || ''
}

const handleImageError = (id: number) => {
  imageErrors.value[id] = true
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchMajors()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Kelola Jurusan</h1>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="majorList"
      :is-loading="isLoading"
      :show-add-button="true"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari jurusan..."
      empty-message="Tidak ada jurusan ditemukan."
      @add="handleAdd"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
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

      <!-- Column: Logo -->
      <template #col-img_logo="{ item }">
        <div class="flex justify-center my-1">
          <div class="w-10 h-10 flex items-center justify-center shrink-0">
            <a
              v-if="getImageUrl(item.img_logo)"
              :href="getImageUrl(item.img_logo)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full flex items-center justify-center"
            >
              <img
                :src="getImageUrl(item.img_logo)"
                :alt="item.major_name || ''"
                class="w-full h-full object-contain logo-img hover:opacity-80 transition-opacity cursor-pointer"
              />
            </a>
            <div v-else class="flex items-center justify-center text-text-alt">
              <RiImageLine class="w-5 h-5" />
            </div>
          </div>
        </div>
      </template>

      <!-- Column: Kode -->
      <template #col-code="{ item }">
        <div class="text-center font-semibold text-text-neutral">
          {{ item.code || '-' }}
        </div>
      </template>

      <!-- Column: Keterangan / Nama Jurusan -->
      <template #col-major_name="{ item }">
        <div class="flex flex-col">
          <span class="font-medium text-text-neutral line-clamp-1" :title="item.major_name">
            {{ item.major_name }}
          </span>
          <span
            v-if="item.summary"
            class="text-xs text-text-alt line-clamp-1"
            :title="item.summary"
          >
            {{ item.summary }}
          </span>
        </div>
      </template>

      <!-- Column: Status -->
      <template #col-active="{ item }">
        <div class="flex justify-center">
          <DashboardStatusBadge :active="item.active" />
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

        <div class="flex gap-3 items-center my-2">
          <div class="w-12 h-12 flex items-center justify-center shrink-0">
            <a
              v-if="getImageUrl(item.img_logo)"
              :href="getImageUrl(item.img_logo)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full flex items-center justify-center"
            >
              <img
                :src="getImageUrl(item.img_logo)"
                :alt="item.major_name || ''"
                class="w-full h-full object-contain logo-img hover:opacity-80 transition-opacity cursor-pointer"
              />
            </a>
            <div v-else class="flex items-center justify-center text-text-alt">
              <RiImageLine class="w-6 h-6" />
            </div>
          </div>

          <div class="flex flex-col min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-text-neutral wrap-break-word">
                {{ item.major_name }}
              </span>
              <DashboardStatusBadge :active="item.active" />
            </div>
            <span class="text-xs font-bold text-primary mt-0.5">
              Kode: {{ item.code || '-' }}
            </span>
            <p v-if="item.summary" class="text-xs text-text-alt line-clamp-2 mt-1">
              {{ item.summary }}
            </p>
          </div>
        </div>
      </template>
    </TableData>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Jurusan"
      message="Apakah Anda yakin ingin menghapus jurusan ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
