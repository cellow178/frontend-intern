<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const router = useRouter()
const toastStore = useToastStore()

// --- Visi Sekolah ---
const isVisionLoading = ref(true)
const isSavingVision = ref(false)
const vision = ref('')
const rawConfigData = ref<Record<string, any>>({})

const fetchVision = async () => {
  isVisionLoading.value = true
  try {
    const response = await api.get('/global-config/show')
    const data = response.data?.data ?? {}
    rawConfigData.value = data
    vision.value = data.school_vision ?? ''
  } catch {
    toastStore.show('Gagal memuat visi sekolah.', 'error')
  } finally {
    isVisionLoading.value = false
  }
}

const handleSaveVision = async () => {
  if (!vision.value.trim()) {
    toastStore.show('Visi sekolah wajib diisi.', 'error')
    return
  }

  isSavingVision.value = true
  try {
    await api.put('/global-config/update', {
      hero_description: rawConfigData.value.hero_description,
      profile_title: rawConfigData.value.profile_title,
      profile_description: rawConfigData.value.profile_description,
      img_profile_1: rawConfigData.value.img_profile_1,
      img_profile_2: rawConfigData.value.img_profile_2,
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
      school_vision: vision.value,
    })
    toastStore.show('Visi sekolah berhasil diperbarui.', 'success')
    fetchVision()
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal memperbarui visi sekolah.', 'error')
  } finally {
    isSavingVision.value = false
  }
}

// --- Misi Sekolah ---
interface Mission {
  id: number
  content: string
  order: number | null
  active: boolean
}

const missions = ref<Mission[]>([])
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
  { key: 'action', label: 'Aksi', width: 'w-20 text-center' },
  { key: 'content', label: 'Konten Misi' },
  { key: 'order', label: 'Urutan', width: 'w-24 text-center' },
  { key: 'active', label: 'Status', width: 'w-28 text-center' },
]

const fetchMissions = async () => {
  // Batalkan request sebelumnya jika masih berjalan
  if (fetchAbortController) {
    fetchAbortController.abort()
  }
  fetchAbortController = new AbortController()

  isLoading.value = true
  try {
    const response = await api.get('/missions', {
      params: {
        limit: pageSize.value,
        page: currentPage.value,
        search: searchQuery.value.trim() || undefined,
      },
      signal: fetchAbortController.signal,
    })
    missions.value = response.data?.data ?? []
    totalPage.value = response.data?.totalPage ?? 1
    totalData.value = response.data?.total ?? 0
  } catch (error: any) {
    if (error.name === 'CanceledError' || error.message === 'canceled') return
    toastStore.show('Gagal memuat data misi.', 'error')
  } finally {
    isLoading.value = false
  }
}

// Watcher untuk pencarian dengan Debounce (500ms)
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)

  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchMissions()
  }, 500)
})

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchMissions()
}

const handlePerPageChange = (newLimit: number) => {
  pageSize.value = newLimit
  currentPage.value = 1
  fetchMissions()
}

const handleDetail = (id: number) => {
  router.push({ name: 'dashboard-misi-detail', params: { id } })
}

const handleAdd = () => {
  router.push({ name: 'dashboard-misi-create' })
}

const handleEdit = (id: number) => {
  router.push({ name: 'dashboard-misi-edit', params: { id } })
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
    const response = await api.delete('/missions/delete', { data: { id: selectedDeleteId.value } })

    if (response.data?.success === false) {
      toastStore.show(response.data.message || 'Gagal menghapus data.', 'error')
      return
    }

    toastStore.show('Misi berhasil dihapus.', 'success')
    closeDeleteModal()
    fetchMissions()
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal menghapus misi.', 'error')
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchVision()
  fetchMissions()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbortController) fetchAbortController.abort()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <h1 class="text-xl font-bold text-text-neutral mb-6">Visi Sekolah</h1>

      <div v-if="isVisionLoading" class="text-text-alt py-8 text-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <div v-else class="flex flex-col gap-4">
        <Input v-model="vision" type="textarea" :rows="2" />
        <div>
          <Button
            type="button"
            size="md"
            :icon-left="RiSaveLine"
            :label="isSavingVision ? 'Menyimpan...' : 'Simpan'"
            :disabled="isSavingVision"
            @click="handleSaveVision"
          />
        </div>
      </div>
    </div>

    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-neutral">Misi Sekolah</h1>
      </div>

      <TableData
        v-model:search="searchQuery"
        :columns="columns"
        :items="missions"
        :is-loading="isLoading"
        :show-add-button="true"
        add-button-label="Tambah Baru"
        search-placeholder="Cari Misi..."
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

        <template #col-order="{ item }">
          <div class="text-center">
            {{ item.order ?? '-' }}
          </div>
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
              <DashboardIconButton variant="info" label="Detail" @click="handleDetail(item.id)" />
              <DashboardIconButton variant="edit" label="Edit" @click="handleEdit(item.id)" />
              <DashboardIconButton
                variant="delete"
                label="Hapus"
                @click="openDeleteModal(item.id)"
              />
            </div>
          </div>
          <p class="text-sm text-text-neutral">{{ item.content }}</p>
          <div class="flex items-center justify-between pt-2 border-t border-secondary/10">
            <span class="text-xs text-text-alt">Urutan: {{ item.order ?? '-' }}</span>
            <DashboardStatusBadge :active="item.active" />
          </div>
        </template>
      </TableData>
    </div>

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      title="Hapus Misi"
      message="Apakah Anda yakin ingin menghapus misi ini? Data yang dihapus tidak dapat dikembalikan."
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
