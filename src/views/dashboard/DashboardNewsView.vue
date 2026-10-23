<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { getFullFileUrl } from '@/utils/file'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import EnumStatusBadge from '@/components/ui/EnumStatusBadge.vue'
import Select from '@/components/ui/Select.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import NewsCategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiImageLine, RiExternalLinkLine } from '@remixicon/vue'

// --- Interfaces ---
interface NewsImageCover {
  ext: string
  url: string
  tumbnail_url: string
  filename: string
  field_value: string
}

interface NewsItem {
  id: number
  slug: string
  title: string
  img_cover: NewsImageCover | null
  status: string
  is_highlight: boolean
  created_at: string
  updated_at?: string
  rel_category_id: string
  rel_created_by: string
  rel_updated_by?: string
  class_model_name: string
}

interface Category {
  id: number
  name: string
  active: boolean
}

// --- Router & Stores ---
const router = useRouter()
const toastStore = useToastStore()

// --- State Data ---
const newsList = ref<NewsItem[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)

// --- State Filter & Search ---
const searchQuery = ref('')
const selectedCategoryId = ref<string>('')
const selectedStatus = ref<string>('')

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

const sortedNewsList = computed(() => {
  return [...newsList.value].sort((a, b) => {
    if (a.is_highlight === b.is_highlight) return 0
    return a.is_highlight ? -1 : 1
  })
})

const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-36 text-center' },
  { key: 'img_cover', label: 'Gambar', width: 'w-32 text-center' },
  { key: 'title', label: 'Judul Berita', width: 'min-w-[220px]' },
  { key: 'rel_category_id', label: 'Kategori', width: 'min-w-[160px] text-center' },
  { key: 'status', label: 'Status', width: 'w-28 text-center' },
  { key: 'rel_created_by', label: 'Penulis & Pengedit', width: 'min-w-[120px]' },
  { key: 'created_at', label: 'Waktu / Tanggal', width: 'w-36 text-center' },
]

// --- Fetch Categories ---
const fetchCategories = async () => {
  try {
    const response = await api.get('/news-categories/dataset')
    categories.value = response.data?.data ?? []
  } catch {
    toastStore.show('Gagal memuat Kategori Berita.', 'error')
  }
}

// --- Fetch News Data ---
const fetchNews = async () => {
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/news', {
      params: {
        search: searchQuery.value.trim() || undefined,
        category_id: selectedCategoryId.value ? Number(selectedCategoryId.value) : undefined,
        status: selectedStatus.value || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
      signal: fetchAbortController.signal,
    })

    newsList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
    imageErrors.value = {}
  } catch (error) {
    if (axios.isCancel(error)) return
    toastStore.show('Gagal memuat Berita.', 'error')
  } finally {
    if (!fetchAbortController.signal.aborted) {
      isLoading.value = false
    }
  }
}

// --- Handlers & Watchers ---
const onFilterChange = () => {
  currentPage.value = 1
  fetchNews()
}

const handleResetFilters = () => {
  selectedCategoryId.value = ''
  selectedStatus.value = ''
  onFilterChange()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => {
  router.push({ name: 'dashboard-berita-create' })
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-berita-detail', params: { id } })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-berita-edit', params: { id } })
}

const handleToggleHighlight = async (id: number) => {
  if (!id || updatingHighlightId.value === id) return

  const item = newsList.value.find((news) => news.id === id)
  if (!item) return

  updatingHighlightId.value = id

  try {
    await api.post('/news/update-highlight', {
      id: item.id,
      is_highlight: !item.is_highlight,
    })

    toastStore.show('Status Highlight Berita berhasil diperbarui!', 'success')
    await fetchNews()
  } catch (error) {
    const err = error as {
      response?: { data?: { message?: string } }
    }

    const errorMessage = err.response?.data?.message || 'Gagal memperbarui status Highlight Berita.'

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
    await api.delete('/news/delete', { data: { id: selectedDeleteId.value } })
    toastStore.show('Berita berhasil dihapus!', 'success')
    closeDeleteModal()
    fetchNews()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus berita.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchNews()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

// --- Helpers ---
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const isEdited = (createdAt: string, updatedAt?: string) => {
  if (!updatedAt) return false
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60000
}

const getImageUrl = (imgCover: NewsImageCover | null | undefined): string => {
  if (!imgCover) return ''
  return getFullFileUrl(imgCover) || imgCover.field_value || ''
}

const handleImageError = (id: number) => {
  imageErrors.value[id] = true
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  await fetchCategories()
  fetchNews()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Kelola Berita</h1>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="sortedNewsList"
      :is-loading="isLoading"
      :show-add-button="true"
      :show-filter-button="true"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      add-button-label="Tambah Berita"
      search-placeholder="Cari berita..."
      empty-message="Tidak ada berita ditemukan."
      loading-label="Memuat berita..."
      @add="handleAdd"
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <template #filters>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedCategoryId"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="[
                { value: '', label: 'Semua Kategori' },
                ...categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]"
              @update:model-value="onFilterChange"
            />
          </div>

          <!-- Filter Status -->
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedStatus"
              size="normal"
              variant="semi-rounded"
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

      <!-- Column: No -->
      <template #col-no="{ index }">
        <div class="text-center font-medium">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>
      </template>

      <!-- Column: Action -->
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

      <!-- Column: Image Cover -->
      <template #col-img_cover="{ item }">
        <div class="flex justify-center my-1">
          <div
            class="w-24 h-16 rounded-md border border-neutral/20 bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0"
          >
            <a
              v-if="getImageUrl(item.img_cover) && !imageErrors[item.id]"
              :href="getImageUrl(item.img_cover)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full block relative cursor-pointer group"
              title="Klik untuk membuka gambar di tab baru"
            >
              <img
                :src="getImageUrl(item.img_cover)"
                :alt="item.title || ''"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                @error="handleImageError(item.id)"
              />
              <!-- Overlay dengan Remixicon saat di-hover -->
              <div
                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-neutral"
              >
                <RiExternalLinkLine class="w-5 h-5" />
              </div>
            </a>
            <div v-else class="flex flex-col items-center justify-center text-text-alt">
              <RiImageLine />
              <span class="text-[10px] font-medium mt-0.5 text-text-alt">No Image</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Column: Title -->
      <template #col-title="{ item }">
        <span
          class="font-medium text-text-neutral line-clamp-2 wrap-break-word"
          :title="item.title"
        >
          {{ item.title }}
        </span>
      </template>

      <!-- Column: Category Badge -->
      <template #col-rel_category_id="{ item }">
        <div class="flex justify-center items-center whitespace-nowrap">
          <NewsCategoryBadge
            :category-name="item.rel_category_id || '-'"
            variant="primary"
            size="sm"
          />
        </div>
      </template>

      <!-- Column: Status -->
      <template #col-status="{ item }">
        <div class="flex justify-center">
          <EnumStatusBadge :status="item.status" />
        </div>
      </template>

      <!-- Column: Creator & Editor -->
      <template #col-rel_created_by="{ item }">
        <div class="flex flex-col text-xs">
          <span class="text-text-neutral font-medium">
            {{ item.rel_updated_by || item.rel_created_by || '-' }}
          </span>
          <span
            v-if="item.rel_updated_by && item.rel_updated_by !== item.rel_created_by"
            class="text-[10px] text-text-alt"
          >
            Pembuat: {{ item.rel_created_by }}
          </span>
        </div>
      </template>

      <!-- Column: Created At & Updated At -->
      <template #col-created_at="{ item }">
        <div class="flex flex-col text-center text-xs whitespace-nowrap">
          <span class="text-text-neutral font-medium">
            {{ formatDate(item.updated_at || item.created_at) }}
          </span>
          <span v-if="isEdited(item.created_at, item.updated_at)" class="text-[10px] text-text-alt">
            Dibuat: {{ formatDate(item.created_at) }}
          </span>
        </div>
      </template>

      <!-- Mobile View Card -->
      <template #mobile-card="{ item, index }">
        <!-- Nomor dan Aksi -->
        <div class="flex items-center justify-between gap-2">
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

        <!-- Informasi Berita -->
        <div class="flex flex-col gap-2 my-3 min-w-0">
          <!-- Judul -->
          <p
            class="text-sm font-semibold leading-snug text-text-neutral line-clamp-2 wrap-break-word"
            :title="item.title"
          >
            {{ item.title }}
          </p>

          <!-- Kategori dan Status -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <NewsCategoryBadge
              :category-name="item.rel_category_id || '-'"
              variant="primary"
              size="sm"
            />
            <EnumStatusBadge :status="item.status" />
          </div>

          <!-- Gambar di Bawah Informasi Berita -->
          <div
            class="w-full h-40 rounded-lg border border-neutral/20 bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm"
          >
            <a
              v-if="getImageUrl(item.img_cover) && !imageErrors[item.id]"
              :href="getImageUrl(item.img_cover)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full block relative cursor-pointer group"
              title="Klik untuk membuka gambar di tab baru"
            >
              <img
                :src="getImageUrl(item.img_cover)"
                :alt="item.title || ''"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                @error="handleImageError(item.id)"
              />

              <!-- Overlay Ikon -->
              <div
                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-neutral"
              >
                <RiExternalLinkLine class="w-5 h-5" />
              </div>
            </a>

            <!-- Placeholder Jika Tidak Ada Gambar -->
            <div v-else class="flex flex-col items-center justify-center text-text-alt">
              <RiImageLine class="w-6 h-6" />
              <span class="text-xs font-medium mt-1">No Image</span>
            </div>
          </div>
        </div>

        <!-- Detail Pembuat dan Waktu -->
        <div
          class="flex flex-col text-xs text-text-alt border-t border-secondary/20 pt-2 gap-1 leading-relaxed"
        >
          <p>
            Terakhir diubah:
            <span class="font-semibold text-text-neutral">
              {{ formatDate(item.updated_at || item.created_at) }}
            </span>
            oleh
            <span class="font-semibold text-text-neutral">
              {{ item.rel_updated_by || item.rel_created_by || '-' }}
            </span>
          </p>

          <p v-if="isEdited(item.created_at, item.updated_at)">
            Dibuat:
            <span class="font-semibold text-text-neutral">
              {{ formatDate(item.created_at) }}
            </span>
            oleh
            <span class="font-semibold text-text-neutral">
              {{ item.rel_created_by ?? '-' }}
            </span>
          </p>
        </div>
      </template>
    </TableData>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Berita"
      message="Apakah Anda yakin ingin menghapus berita ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
