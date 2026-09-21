<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import TableTabs, { type Tab } from '@/components/ui/TableTabs.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'

interface NewsCategory {
  id: number
  name: string
  description: string
  active: boolean
  created_at: string
}

interface FeedbackCategory {
  id: number
  category_name: string
  active: boolean
  feedbacks_count?: number
  created_at: string
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const tabs: Tab[] = [
  { key: 'news-categories', label: 'Kategori Berita' },
  { key: 'feedback-categories', label: 'Kategori Kritik & Saran' },
]

const activeTab = ref((route.query.tab as string) || 'news-categories')

const newsCategories = ref<NewsCategory[]>([])
const feedbackCategories = ref<FeedbackCategory[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const currentPage = ref(1)
const totalPage = ref(1)
const totalData = ref(0)
const pageSize = ref(10)

const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const newsColumns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-24 text-center' },
  { key: 'name', label: 'Nama Kategori', width: 'min-w-37' },
  { key: 'description', label: 'Deskripsi', width: 'min-w-50' },
  { key: 'active', label: 'Status', width: 'w-32 text-center' },
]

const feedbackColumns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-24 text-center' },
  { key: 'category_name', label: 'Nama Kategori', width: 'min-w-45' },
  { key: 'feedbacks_count', label: 'Jumlah Feedback', width: 'w-36 text-center' },
  { key: 'active', label: 'Status', width: 'w-32 text-center' },
]

const addButtonLabel = computed(() =>
  activeTab.value === 'news-categories'
    ? 'Tambah Kategori Berita'
    : 'Tambah Kategori Kritik & Saran',
)

const searchPlaceholder = computed(() =>
  activeTab.value === 'news-categories'
    ? 'Cari Kategori Berita...'
    : 'Cari Kategori Kritik & Saran...',
)

const fetchMasterData = async () => {
  isLoading.value = true
  const endpoint =
    activeTab.value === 'news-categories' ? '/news-categories' : '/feedbacks-categories'

  try {
    const response = await api.get(endpoint, {
      params: {
        search: searchQuery.value || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
    })

    if (activeTab.value === 'news-categories') {
      newsCategories.value = response.data.data
    } else {
      feedbackCategories.value = response.data.data
    }

    totalPage.value = response.data.totalPage ?? 1
    totalData.value = response.data.total ?? 0
  } catch {
    toastStore.show('Gagal memuat master data.', 'error')
  } finally {
    isLoading.value = false
  }
}

const onTabChange = (newTab: string) => {
  activeTab.value = newTab
  currentPage.value = 1
  searchQuery.value = ''
  router.replace({ query: { ...route.query, tab: newTab } })
  fetchMasterData()
}

const onFilterChange = () => {
  currentPage.value = 1
  fetchMasterData()
}

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchMasterData()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  onFilterChange()
}

const handleDetail = (id: number) => {
  if (activeTab.value === 'news-categories') {
    router.push({
      name: 'dashboard-kategori-berita-detail',
      params: { id },
    })
  } else {
    router.push({
      name: 'dashboard-kategori-kritik-saran-detail',
      params: { id },
    })
  }
}

const handleAdd = () => {
  if (activeTab.value === 'news-categories') {
    router.push({ name: 'dashboard-kategori-berita-create', query: { tab: activeTab.value } })
  } else {
    router.push({ name: 'dashboard-kategori-kritik-saran-create', query: { tab: activeTab.value } })
  }
}

const handleEdit = (id: number) => {
  if (activeTab.value === 'news-categories') {
    router.push({
      name: 'dashboard-kategori-berita-edit',
      params: { id },
      query: { tab: activeTab.value },
    })
  } else {
    router.push({
      name: 'dashboard-kategori-kritik-saran-edit',
      params: { id },
      query: { tab: activeTab.value },
    })
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
  const endpoint =
    activeTab.value === 'news-categories'
      ? '/news-categories/delete'
      : '/feedbacks-categories/delete'

  try {
    const response = await api.delete(endpoint, { data: { id: selectedDeleteId.value } })

    if (response.data.success === false) {
      toastStore.show(response.data.message || 'Gagal menghapus data.', 'error')
      return
    }

    toastStore.show(response.data.message || 'Data berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchMasterData()
  } catch (err: any) {
    const message = err.response?.data?.message || 'Gagal menghapus data.'
    toastStore.show(message, 'error')
  } finally {
    isDeleting.value = false
  }
}

watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(onFilterChange, 400)
})

onMounted(() => {
  fetchMasterData()
})

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <h1 class="text-xl font-bold text-text-neutral">Master Data</h1>
    </div>

    <TableTabs :tabs="tabs" v-model="activeTab" @update:model-value="onTabChange">
      <template #news-categories>
        <TableData
          v-model:search="searchQuery"
          :columns="newsColumns"
          :items="newsCategories"
          :is-loading="isLoading"
          :search-placeholder="searchPlaceholder"
          :add-button-label="addButtonLabel"
          :current-page="currentPage"
          :total-page="totalPage"
          :items-per-page="pageSize"
          :total-items="totalData"
          @add="handleAdd"
          @update:current-page="handlePageChange"
          @update:items-per-page="handlePerPageChange"
        >
          <template #col-no="{ index }">
            <div class="text-center font-medium">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </div>
          </template>

          <template #col-action="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <DashboardIconButton
                variant="info"
                label="detail"
                class="w-7 h-7"
                @click.stop="handleDetail(item.id)"
              />
              <DashboardIconButton
                variant="edit"
                label="Edit"
                class="w-7 h-7"
                @click.stop="handleEdit(item.id)"
              />
              <DashboardIconButton
                variant="delete"
                label="Hapus"
                class="w-7 h-7"
                @click.stop="openDeleteModal(item.id)"
              />
            </div>
          </template>

          <template #col-description="{ item }">
            <span :title="item.description">
              {{ item.description || '-' }}
            </span>
          </template>

          <template #col-active="{ item }">
            <div class="flex justify-center">
              <DashboardStatusBadge :active="item.active" />
            </div>
          </template>

          <template #mobile-card="{ item, index }">
            <div class="flex items-center justify-between">
              <span class="text-xs text-text-alt font-medium">
                #{{ (currentPage - 1) * pageSize + index + 1 }}
              </span>
              <div class="flex items-center gap-2">
                <DashboardIconButton
                  variant="info"
                  label="detail"
                  @click.stop="handleDetail(item.id)"
                />
                <DashboardIconButton
                  variant="edit"
                  label="Edit"
                  @click.stop="handleEdit(item.id)"
                />
                <DashboardIconButton
                  variant="delete"
                  label="Hapus"
                  @click.stop="openDeleteModal(item.id)"
                />
              </div>
            </div>
            <p class="text-sm font-semibold text-text-neutral">{{ item.name }}</p>
            <p class="text-xs text-text-alt leading-relaxed">{{ item.description }}</p>
            <div>
              <DashboardStatusBadge :active="item.active" />
            </div>
          </template>
        </TableData>
      </template>

      <!-- Tab 2: Kategori Feedback -->
      <template #feedback-categories>
        <TableData
          v-model:search="searchQuery"
          :columns="feedbackColumns"
          :items="feedbackCategories"
          :is-loading="isLoading"
          :search-placeholder="searchPlaceholder"
          :add-button-label="addButtonLabel"
          :current-page="currentPage"
          :total-page="totalPage"
          :items-per-page="pageSize"
          :total-items="totalData"
          @add="handleAdd"
          @update:current-page="handlePageChange"
          @update:items-per-page="handlePerPageChange"
        >
          <!-- Column No -->
          <template #col-no="{ index }">
            <div class="text-center font-medium">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </div>
          </template>

          <!-- Column Action -->
          <template #col-action="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <DashboardIconButton
                variant="info"
                label="Detail"
                class="w-7 h-7"
                @click.stop="handleDetail(item.id)"
              />
              <DashboardIconButton
                variant="edit"
                label="Edit"
                class="w-7 h-7"
                @click.stop="handleEdit(item.id)"
              />
              <!-- Tombol Hapus di-disable jika feedbacks_count > 0 -->
              <DashboardIconButton
                variant="delete"
                label="Hapus"
                class="w-7 h-7 transition-opacity"
                :class="{ 'opacity-30 cursor-not-allowed': (item.feedbacks_count ?? 0) > 0 }"
                :title="
                  (item.feedbacks_count ?? 0) > 0
                    ? 'Kategori tidak bisa dihapus karena masih digunakan'
                    : 'Hapus Kategori'
                "
                @click.stop="(item.feedbacks_count ?? 0) === 0 && openDeleteModal(item.id)"
              />
            </div>
          </template>

          <!-- Column Jumlah Feedback (KOLOM BARU) -->
          <template #col-feedbacks_count="{ item }">
            <div class="flex justify-center">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold"
                :class="
                  (item.feedbacks_count ?? 0) > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary/20 text-text-alt'
                "
              >
                {{ item.feedbacks_count ?? 0 }} Feedback
              </span>
            </div>
          </template>

          <!-- Column Status -->
          <template #col-active="{ item }">
            <div class="flex justify-center">
              <DashboardStatusBadge :active="item.active" />
            </div>
          </template>

          <!-- Card View Mobile -->
          <template #mobile-card="{ item, index }">
            <div class="flex items-center justify-between">
              <span class="text-xs text-text-alt font-medium">
                #{{ (currentPage - 1) * pageSize + index + 1 }}
              </span>
              <div class="flex items-center gap-2">
                <DashboardIconButton
                  variant="info"
                  label="Detail"
                  @click.stop="handleDetail(item.id)"
                />
                <DashboardIconButton
                  variant="edit"
                  label="Edit"
                  @click.stop="handleEdit(item.id)"
                />
                <DashboardIconButton
                  variant="delete"
                  label="Hapus"
                  :class="{ 'opacity-30 cursor-not-allowed': (item.feedbacks_count ?? 0) > 0 }"
                  @click.stop="(item.feedbacks_count ?? 0) === 0 && openDeleteModal(item.id)"
                />
              </div>
            </div>
            <div class="flex items-center justify-between gap-2 my-1">
              <p class="text-sm font-semibold text-text-neutral">{{ item.category_name }}</p>
              <span
                class="px-2 py-0.5 rounded-full text-sm font-semibold shrink-0"
                :class="
                  (item.feedbacks_count ?? 0) > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary/20 text-text-alt'
                "
              >
                {{ item.feedbacks_count ?? 0 }} Feedback
              </span>
            </div>
            <div>
              <DashboardStatusBadge :active="item.active" />
            </div>
          </template>
        </TableData>
      </template>
    </TableTabs>

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Kategori"
      message="Apakah Anda yakin ingin menghapus kategori ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
