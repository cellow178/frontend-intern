<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import { RiInformationLine, RiEditBoxLine, RiDeleteBinLine, RiSaveLine } from '@remixicon/vue'

const router = useRouter()
const toastStore = useToastStore()

// --- Headline Title State ---
const isHeadlineLoading = ref(true)
const isSavingHeadline = ref(false)
const headlineTitle = ref('')
const rawConfigData = ref<Record<string, any>>({})

const fetchHeroTagline = async () => {
  isHeadlineLoading.value = true
  try {
    const response = await api.get('/global-config/show')
    const data = response.data?.data ?? {}
    rawConfigData.value = data
    headlineTitle.value = data.hero_description ?? ''
  } catch {
    toastStore.show('Gagal memuat headline title.', 'error')
  } finally {
    isHeadlineLoading.value = false
  }
}

const handleSaveHeadline = async () => {
  if (!headlineTitle.value.trim()) {
    toastStore.show('Headline title wajib diisi.', 'error')
    return
  }

  isSavingHeadline.value = true
  try {
    await api.put('/global-config/update', {
      profile_title: rawConfigData.value.profile_title,
      profile_description: rawConfigData.value.profile_description,
      img_profile_1: rawConfigData.value.img_profile_1,
      img_profile_2: rawConfigData.value.img_profile_2,
      school_vision: rawConfigData.value.school_vision,
      video_profile: rawConfigData.value.video_profile,
      school_name: rawConfigData.value.school_name,
      motto: rawConfigData.value.motto,
      footer_description: rawConfigData.value.footer_description,
      school_telephone: rawConfigData.value.school_telephone,
      school_email: rawConfigData.value.school_email,
      footer_ig: rawConfigData.value.footer_ig,
      footer_yt: rawConfigData.value.footer_yt,
      footer_fb: rawConfigData.value.footer_fb,
      footer_linkedin: rawConfigData.value.footer_linkedin,
      hero_description: headlineTitle.value,
    })
    toastStore.show('Headline title berhasil diperbarui.', 'success')
    fetchHeroTagline()
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal memperbarui headline title.', 'error')
  } finally {
    isSavingHeadline.value = false
  }
}

// --- Daftar Banner State ---
interface Banner {
  id: number
  title: string
  url: string | null
  img_cover: {
    url: string
    tumbnail_url: string
    filename: string
    field_value: string
    ext: string
  } | null
  active: boolean
}

const banners = ref<Banner[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const totalPage = ref(1)
const totalData = ref(0)
const pageSize = ref(10)

// Search State, Debounce Timer & Abort Controller
const searchQuery = ref('')
let searchDebounce: ReturnType<typeof setTimeout> | undefined
let fetchAbortController: AbortController | null = null

const isDeleteModalOpen = ref(false)
const selectedDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-24 text-center' },
  { key: 'img_cover', label: 'Gambar', width: 'w-32 text-center' },
  { key: 'title', label: 'Judul', width: 'min-w-48 max-w-xs' },
  { key: 'url', label: 'URL', width: 'min-w-45 max-w-xs' },
  { key: 'active', label: 'Status', width: 'w-28 text-center' },
]

// --- Fetch API Data ---
const fetchBanners = async () => {
  // Batalkan HTTP request sebelumnya jika masih berlangsung
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/banners', {
      params: {
        limit: pageSize.value,
        page: currentPage.value,
        search: searchQuery.value.trim() || undefined,
      },
      signal: fetchAbortController.signal,
    })

    banners.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
  } catch (error: any) {
    if (error.name === 'CanceledError' || error.message === 'canceled') return
    console.error('Error fetching banners:', error)
  } finally {
    isLoading.value = false
  }
}

// Watcher untuk Search dengan Delay Debounce (500ms)
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)

  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchBanners()
  }, 500)
})

// Handlers Pagination
const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchBanners()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  currentPage.value = 1
  fetchBanners()
}

// Handlers CRUD Routing & Modal
const handleAdd = () => {
  router.push({ name: 'dashboard-banner-create' })
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-banner-detail', params: { id } })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-banner-edit', params: { id } })
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
    const response = await api.delete('/banners/delete', { data: { id: selectedDeleteId.value } })

    if (response.data?.success === false) {
      toastStore.show('Gagal menghapus data banner.', 'error')
      return
    }

    // Gunakan pesan custom bahasa Indonesia, bukan pesan raw dari backend
    toastStore.show('Banner berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchBanners()
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal menghapus banner.', 'error')
  } finally {
    isDeleting.value = false
  }
}

// Lifecycle Hooks
onMounted(() => {
  fetchHeroTagline()
  fetchBanners()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Hero Tagline Section -->
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <h1 class="text-xl font-bold text-text-neutral mb-6">
        Hero Tagline <span><RequiredBadge /></span>
      </h1>

      <div v-if="isHeadlineLoading" class="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <div v-else class="flex flex-col gap-4">
        <Input v-model="headlineTitle" type="textarea" :rows="2" />
        <div>
          <Button
            type="button"
            size="md"
            :icon-left="RiSaveLine"
            :label="isSavingHeadline ? 'Menyimpan...' : 'Simpan'"
            :disabled="isSavingHeadline"
            @click="handleSaveHeadline"
          />
        </div>
      </div>
    </div>

    <!-- Daftar Banner Section -->
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-neutral">Daftar Banner</h1>
      </div>

      <TableData
        v-model:search="searchQuery"
        :columns="columns"
        :items="banners"
        :is-loading="isLoading"
        :show-add-button="true"
        search-placeholder="Cari Banner..."
        add-button-label="Tambah Banner"
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
          <div class="flex items-center gap-1.5">
            <DashboardIconButton
              :icon="RiInformationLine"
              variant="info"
              label="Detail"
              @click="handleDetail(item.id)"
            />
            <DashboardIconButton
              :icon="RiEditBoxLine"
              variant="edit"
              label="Edit"
              @click="handleEdit(item.id)"
            />
            <DashboardIconButton
              :icon="RiDeleteBinLine"
              variant="delete"
              label="Hapus"
              @click="openDeleteModal(item.id)"
            />
          </div>
        </template>

        <template #col-img_cover="{ item }">
          <img
            v-if="item.img_cover?.url"
            :src="getFullFileUrl(item.img_cover.url)!"
            alt=""
            class="w-24 h-16 object-cover rounded-lg"
          />
          <span v-else class="text-text-alt text-xs">Tidak ada gambar</span>
        </template>

        <template #col-title="{ item }">
          <span class="font-medium text-text-neutral block truncate max-w-xs" :title="item.title">
            {{ item.title }}
          </span>
        </template>

        <template #col-url="{ item }">
          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline"
            :title="item.url"
          >
            {{ item.url }}
          </a>
          <span v-else class="text-text-alt text-xs">-</span>
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
                :icon="RiInformationLine"
                variant="info"
                label="Detail"
                @click="handleDetail(item.id)"
              />
              <DashboardIconButton
                :icon="RiEditBoxLine"
                variant="edit"
                label="Edit"
                @click="handleEdit(item.id)"
              />
              <DashboardIconButton
                :icon="RiDeleteBinLine"
                variant="delete"
                label="Hapus"
                @click="openDeleteModal(item.id)"
              />
            </div>
          </div>

          <img
            v-if="item.img_cover?.url"
            :src="getFullFileUrl(item.img_cover.url)!"
            alt=""
            class="w-full h-32 object-cover rounded-lg"
          />

          <p v-if="item.title" class="text-sm font-semibold text-text-neutral">{{ item.title }}</p>

          <div v-if="item.url" class="text-xs">
            <span class="font-medium text-text-alt">URL: </span>
            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ item.url }}
            </a>
          </div>

          <div class="w-fit">
            <DashboardStatusBadge :active="item.active" />
          </div>
        </template>
      </TableData>
    </div>

    <!-- Confirm Modal Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Banner"
      message="Apakah Anda yakin ingin menghapus banner ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
