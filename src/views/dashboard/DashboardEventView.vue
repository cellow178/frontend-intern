<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios, { type AxiosError } from 'axios'
import api from '@/services/api'
import { getFullFileUrl, type FileSource } from '@/utils/file'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import EnumStatusBadge from '@/components/ui/EnumStatusBadge.vue'
import Select from '@/components/ui/Select.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiImageLine, RiMapPinFill, RiExternalLinkLine } from '@remixicon/vue'

// --- Interfaces ---
interface EventItem {
  id: number
  slug: string
  title: string
  content: string
  location: string
  start_date: string
  end_date: string
  img_cover: FileSource | null
  status: string
  is_highlight: boolean
  created_at: string
}

// --- Router & Stores ---
const router = useRouter()
const toastStore = useToastStore()

// --- State Data ---
const eventList = ref<EventItem[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
const searchQuery = ref('')
const selectedStatus = ref<string>('')
const selectedSortOrder = ref<string>('asc')

let searchDebounce: ReturnType<typeof setTimeout> | undefined
let fetchAbortController: AbortController | null = null

// --- State Pagination ---
const currentPage = ref(1)
const totalData = ref(0)
const totalPage = ref(1)
const pageSize = ref(10)

// --- State Modals & Actions ---
const updatingHighlightId = ref<number | null>(null)
const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

// Track image load errors berdasarkan ID item
const imageErrors = ref<Record<number, boolean>>({})

// Priority sort Client-side: Item highlight ditaruh paling atas di halaman aktif
const sortedEventList = computed(() => {
  return [...eventList.value].sort((a, b) => {
    if (a.is_highlight === b.is_highlight) return 0
    return a.is_highlight ? -1 : 1
  })
})

// Configuration Tabel Column
const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-36 text-center' },
  { key: 'img_cover', label: 'Gambar', width: 'w-32 text-center' },
  { key: 'title', label: 'Judul', width: 'min-w-[220px]' },
  { key: 'event_date', label: 'Tanggal Event', width: 'min-w-[180px] text-center' },
  { key: 'status', label: 'Status', width: 'w-28 text-center' },
]

// --- Fetch Event Data ---
const fetchEvents = async () => {
  if (fetchAbortController) fetchAbortController.abort()
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/events', {
      params: {
        search: searchQuery.value.trim() || undefined,
        status: selectedStatus.value || undefined,
        sort_by: 'start_date',
        sort: selectedSortOrder.value,
        limit: pageSize.value,
        page: currentPage.value,
      },
      signal: fetchAbortController.signal,
    })

    eventList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
    imageErrors.value = {}
  } catch (error) {
    if (axios.isCancel(error) || (error as Error).name === 'CanceledError') return
    toastStore.show('Gagal memuat data event.', 'error')
  } finally {
    if (!fetchAbortController.signal.aborted) {
      isLoading.value = false
    }
  }
}

// --- Handlers & Watchers ---
const onFilterChange = () => {
  currentPage.value = 1
  fetchEvents()
}

const handleResetFilters = () => {
  selectedStatus.value = ''
  selectedSortOrder.value = 'asc'
  onFilterChange()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => router.push({ name: 'dashboard-event-create' })
const handleDetail = (id: number) => router.push({ name: 'dashboard-event-detail', params: { id } })
const handleEdit = (id: number) => router.push({ name: 'dashboard-event-edit', params: { id } })

const handleToggleHighlight = async (id: number) => {
  const item = eventList.value.find((e) => e.id === id)
  if (!item || updatingHighlightId.value === id) return

  updatingHighlightId.value = id
  try {
    await api.post('/events/update-highlight', {
      id: item.id,
      is_highlight: !item.is_highlight,
    })
    toastStore.show('Status highlight berhasil diperbarui.', 'success')
    await fetchEvents()
  } catch (err) {
    const error = err as AxiosError<{ message?: string; errors?: { id?: string[] } }>
    const resData = error.response?.data
    const errorMessage =
      resData?.errors?.id?.[0] || resData?.message || 'Gagal memperbarui status highlight.'

    toastStore.show(errorMessage, 'error')
  } finally {
    updatingHighlightId.value = null
  }
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
    await api.delete('/events/delete', { data: { id: selectedDeleteId.value } })
    toastStore.show('Event berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchEvents()
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>
    toastStore.show(error.response?.data?.message || 'Gagal menghapus event.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchEvents()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

// --- Helpers ---
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

const formatEventRange = (startDate?: string, endDate?: string) => {
  if (!startDate) return '-'
  if (!endDate || startDate === endDate) return formatDate(startDate)
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

const handleImageError = (id: number) => {
  imageErrors.value[id] = true
}

// --- Lifecycle Hooks ---
onMounted(fetchEvents)

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Kelola Event</h1>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="sortedEventList"
      :is-loading="isLoading"
      :show-add-button="true"
      :show-filter-button="true"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari event..."
      empty-message="Tidak ada event ditemukan."
      @add="handleAdd"
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <template #filters>
        <div class="flex items-center gap-3">
          <div class="w-fit">
            <Select
              v-model="selectedSortOrder"
              size="normal"
              placeholder=""
              :options="[
                { value: 'asc', label: 'Terlama ke Terbaru' },
                { value: 'desc', label: 'Terbaru ke Terlama' },
              ]"
              @update:model-value="onFilterChange"
            />
          </div>

          <div class="w-fit">
            <Select
              v-model="selectedStatus"
              size="normal"
              placeholder=""
              :options="[
                { value: '', label: 'Semua Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'publish', label: 'Diterbitkan' },
                { value: 'archive', label: 'Diarsipkan' },
              ]"
              @update:model-value="onFilterChange"
            />
          </div>
        </div>
      </template>

      <!-- Column 1: No -->
      <template #col-no="{ index }">
        <div class="text-center font-medium">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>
      </template>

      <!-- Column 2: Action -->
      <template #col-action="{ item }">
        <div class="flex items-center justify-center gap-1.5">
          <div
            v-if="updatingHighlightId === item.id"
            class="w-7 h-7 flex items-center justify-center"
          >
            <LoadingSpinner size="sm" />
          </div>
          <DashboardIconButton
            v-else
            variant="highlight"
            :active="item.is_highlight"
            :label="item.is_highlight ? 'Batal Highlight' : 'Jadikan Highlight'"
            class="w-7 h-7"
            @click="handleToggleHighlight(item.id)"
          />
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

      <!-- Column 3: Image Cover -->
      <template #col-img_cover="{ item }">
        <div class="flex items-center justify-center my-1">
          <div
            class="w-16 h-22 rounded-md border border-neutral/20 bg-gray-100 overflow-hidden shadow-sm shrink-0 flex items-center justify-center"
          >
            <a
              v-if="getFullFileUrl(item.img_cover) && !imageErrors[item.id]"
              :href="getFullFileUrl(item.img_cover)!"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full block relative cursor-pointer group"
              title="Klik untuk membuka gambar di tab baru"
            >
              <img
                :src="getFullFileUrl(item.img_cover)!"
                :alt="item.title || ''"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                @error="handleImageError(item.id)"
              />
              <div
                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white"
              >
                <RiExternalLinkLine class="w-5 h-5" />
              </div>
            </a>
            <div v-else class="flex flex-col items-center justify-center text-text-alt">
              <RiImageLine />
              <span class="text-[10px] font-medium mt-0.5">No Image</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Column 4: Title -->
      <template #col-title="{ item }">
        <div class="flex flex-col">
          <span class="font-medium text-text-neutral line-clamp-2 break-all" :title="item.title">
            {{ item.title }}
          </span>
          <span
            v-if="item.location"
            class="flex items-center gap-1 text-[11px] text-text-alt mt-0.5 line-clamp-1"
          >
            <RiMapPinFill class="w-3.5 h-3.5 shrink-0" />
            <span>{{ item.location }}</span>
          </span>
        </div>
      </template>

      <!-- Column 5: Start & End Date -->
      <template #col-event_date="{ item }">
        <div class="text-center text-xs whitespace-nowrap text-text-neutral font-medium">
          {{ formatEventRange(item.start_date, item.end_date) }}
        </div>
      </template>

      <!-- Column 6: Status -->
      <template #col-status="{ item }">
        <div class="flex justify-center">
          <EnumStatusBadge :status="item.status" />
        </div>
      </template>

      <!-- Mobile View Card -->
      <template #mobile-card="{ item, index }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-alt font-medium">
            #{{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <div class="flex items-center gap-1.5">
            <div
              v-if="updatingHighlightId === item.id"
              class="w-7 h-7 flex items-center justify-center"
            >
              <LoadingSpinner size="sm" />
            </div>
            <DashboardIconButton
              v-else
              variant="highlight"
              :active="item.is_highlight"
              :label="item.is_highlight ? 'Batal Highlight' : 'Jadikan Highlight'"
              @click="handleToggleHighlight(item.id)"
            />
            <DashboardIconButton variant="info" label="Detail" @click="handleDetail(item.id)" />
            <DashboardIconButton variant="edit" label="Edit" @click="handleEdit(item.id)" />
            <DashboardIconButton variant="delete" label="Hapus" @click="openDeleteModal(item.id)" />
          </div>
        </div>

        <div class="flex gap-3 items-start my-1">
          <div
            class="w-16 aspect-3/4 rounded-md border border-neutral/20 bg-gray-100 overflow-hidden shrink-0 shadow-sm flex items-center justify-center"
          >
            <a
              v-if="getFullFileUrl(item.img_cover) && !imageErrors[item.id]"
              :href="getFullFileUrl(item.img_cover)!"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full block relative cursor-pointer group"
              title="Klik untuk membuka gambar di tab baru"
            >
              <img
                :src="getFullFileUrl(item.img_cover)!"
                :alt="item.title || ''"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                @error="handleImageError(item.id)"
              />
              <div
                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white"
              >
                <RiExternalLinkLine class="w-4 h-4" />
              </div>
            </a>
            <div v-else class="flex flex-col items-center justify-center text-text-alt">
              <RiImageLine />
              <span class="text-[9px] font-medium mt-0.5">No Image</span>
            </div>
          </div>

          <div class="flex flex-col gap-1 min-w-0 flex-1">
            <p class="text-sm font-semibold text-text-neutral line-clamp-2 break-all">
              {{ item.title }}
            </p>
            <p
              v-if="item.location"
              class="flex items-center gap-1 text-xs text-text-alt line-clamp-1"
            >
              <RiMapPinFill class="w-3.5 h-3.5 shrink-0" />
              <span>{{ item.location }}</span>
            </p>
            <div class="flex items-center gap-2 flex-wrap mt-0.5">
              <EnumStatusBadge :status="item.status" />
            </div>
          </div>
        </div>

        <div class="flex flex-col text-xs text-text-alt border-t border-secondary/20 pt-2 gap-0.5">
          <p>
            Tanggal:
            <span class="font-semibold text-text-neutral">
              {{ formatEventRange(item.start_date, item.end_date) }}
            </span>
          </p>
        </div>
      </template>
    </TableData>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Event"
      message="Apakah Anda yakin ingin menghapus event ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
