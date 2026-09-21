<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import FeedbackTypeBadge from '@/components/ui/FeedbackTypeBadge.vue'
import Select from '@/components/ui/Select.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'

interface Feedback {
  id: number
  sender_name: string | null
  type: boolean
  message: string
  rel_category_id: string
  created_at: string
}

interface Category {
  id: number
  category_name: string
  active: boolean
}

const router = useRouter()
const toastStore = useToastStore()

const feedbackList = ref<Feedback[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const selectedCategoryId = ref<string>('')
const selectedType = ref<string>('')

const currentPage = ref(1)
const totalData = ref(0)
const pageSize = ref(10)

const totalPage = computed(() => Math.max(1, Math.ceil(totalData.value / pageSize.value)))

let searchDebounce: ReturnType<typeof setTimeout> | undefined

const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-20 text-center' },
  { key: 'sender_name', label: 'Nama Pengirim', width: 'min-w-[150px]' },
  { key: 'type', label: 'Tipe', width: 'w-24 text-center' },
  { key: 'rel_category_id', label: 'Kategori', width: 'min-w-[140px]' },
  { key: 'message', label: 'Kritik / Saran', width: 'min-w-[200px]' },
]

const fetchCategories = async () => {
  try {
    const response = await api.get('/feedbacks-categories/dataset')
    categories.value = response.data.data
  } catch {
    toastStore.show('Gagal memuat kategori feedback.', 'error')
  }
}

const fetchFeedback = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/feedbacks', {
      params: {
        search: searchQuery.value || undefined,
        category_id: selectedCategoryId.value ? Number(selectedCategoryId.value) : undefined,
        type: selectedType.value === '' ? undefined : selectedType.value === '1',
        limit: pageSize.value,
        page: currentPage.value,
      },
    })
    feedbackList.value = response.data.data
    totalData.value = response.data.total ?? 0
  } catch {
    toastStore.show('Gagal memuat data kritik & saran.', 'error')
  } finally {
    isLoading.value = false
  }
}

const onFilterChange = () => {
  currentPage.value = 1
  fetchFeedback()
}

const handleResetFilters = () => {
  selectedCategoryId.value = ''
  selectedType.value = ''
  onFilterChange()
}

watch(searchQuery, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

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
    await api.delete('/feedbacks/delete', { data: { id: selectedDeleteId.value } })
    toastStore.show('Pesan berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchFeedback()
  } catch {
    toastStore.show('Gagal menghapus Pesan.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-kritik-saran-detail', params: { id } })
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchFeedback()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

onMounted(async () => {
  await fetchCategories()
  fetchFeedback()
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Kritik & Saran</h1>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="feedbackList"
      :is-loading="isLoading"
      :show-add-button="false"
      :show-filter-button="true"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari Kritik & Saran..."
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <!-- Filters -->
      <template #filters>
        <div class="w-44">
          <Select
            v-model="selectedCategoryId"
            size="normal"
            placeholder=""
            :options="[
              { value: '', label: 'Semua Kategori' },
              ...categories.map((c) => ({ value: String(c.id), label: c.category_name })),
            ]"
            @update:model-value="onFilterChange"
          />
        </div>
        <div class="w-36">
          <Select
            v-model="selectedType"
            size="normal"
            placeholder=""
            :options="[
              { value: '', label: 'Semua Tipe' },
              { value: '0', label: 'Kritik' },
              { value: '1', label: 'Saran' },
            ]"
            @update:model-value="onFilterChange"
          />
        </div>
      </template>

      <template #col-no="{ index }">
        <div class="text-center font-medium">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>
      </template>

      <template #col-action="{ item }">
        <div class="flex items-center justify-center gap-1.5">
          <DashboardIconButton
            variant="info"
            label="Detail"
            class="w-7 h-7"
            @click="handleDetail(item.id)"
          />
          <DashboardIconButton
            variant="delete"
            label="Hapus"
            class="w-7 h-7"
            @click="openDeleteModal(item.id)"
          />
        </div>
      </template>

      <template #col-sender_name="{ item }">
        <span class="font-medium text-text-neutral">
          {{ item.sender_name ?? 'Anonim' }}
        </span>
      </template>

      <template #col-type="{ item }">
        <div class="flex justify-center">
          <FeedbackTypeBadge :type="item.type" />
        </div>
      </template>

      <template #col-message="{ item }">
        <span :title="item.message">
          {{ item.message }}
        </span>
      </template>

      <template #mobile-card="{ item, index }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-alt font-medium">
            #{{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <div class="flex items-center gap-2">
            <DashboardIconButton variant="info" label="Detail" @click="handleDetail(item.id)" />
            <DashboardIconButton variant="delete" label="Hapus" @click="openDeleteModal(item.id)" />
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <FeedbackTypeBadge :type="item.type" />
          <span class="text-xs text-text-alt">{{ item.rel_category_id }}</span>
        </div>

        <p class="text-sm text-text-neutral">{{ item.message }}</p>

        <p class="text-xs text-text-alt border-t border-secondary/20 pt-2">
          Dari: {{ item.sender_name ?? 'Anonim' }}
        </p>
      </template>
    </TableData>

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Kritik & Saran"
      message="Apakah Anda yakin ingin menghapus pesan ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
