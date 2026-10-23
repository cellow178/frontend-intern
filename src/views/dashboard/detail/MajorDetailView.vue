<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl, type FileSource } from '@/utils/file'
import BackButton from '@/components/ui/BackButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import TableTabs, { type Tab } from '@/components/ui/TableTabs.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { RiExternalLinkLine } from '@remixicon/vue'

// Interfaces
interface MajorCompetent {
  id: number
  competent_name: string
  description: string
  active: boolean
}

interface MajorGallery {
  id: number
  title?: string
  description?: string
  img_cover: FileSource
  active: boolean
  url?: string | null
}

interface MajorDetail {
  id: number
  slug: string
  img_logo: FileSource
  code: string
  major_name: string
  summary: string
  total_classes: number
  major_duration: number
  full_description: string
  active: boolean
  created_at: string
  updated_at: string
  rel_created_by?: string
  rel_updated_by?: string
  child_data_major_competent?: MajorCompetent[]
  child_data_major_gallery?: MajorGallery[]
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const major = ref<MajorDetail | null>(null)
const isLoading = ref(true)

// Ambil tab aktif dari URL Query atau default ke 'detail'
const activeTab = ref((route.query.tab as string) || 'detail')

// Handler Perubahan Tab
const handleTabChange = (key: string) => {
  activeTab.value = key
  router.replace({
    query: { ...route.query, tab: key },
  })
}

// Tabs
const detailTabs: Tab[] = [
  { key: 'detail', label: 'Detail Jurusan' },
  { key: 'competence', label: 'Kompetensi Jurusan' },
  { key: 'gallery', label: 'Galeri Jurusan' },
]

// Modal Delete State
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const deleteType = ref<'competence' | 'gallery' | null>(null)
const selectedDeleteId = ref<number | null>(null)

const modalTitle = computed(() => {
  if (deleteType.value === 'competence') return 'Hapus Kompetensi Jurusan'
  if (deleteType.value === 'gallery') return 'Hapus Foto Galeri'
  return 'Konfirmasi Hapus'
})

const modalMessage = computed(() => {
  if (deleteType.value === 'competence') {
    return 'Apakah Anda yakin ingin menghapus kompetensi ini? Data yang dihapus tidak dapat dikembalikan.'
  }
  if (deleteType.value === 'gallery') {
    return 'Apakah Anda yakin ingin menghapus foto galeri ini? Data yang dihapus tidak dapat dikembalikan.'
  }
  return 'Apakah Anda yakin ingin menghapus data ini?'
})

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  selectedDeleteId.value = null
  deleteType.value = null
}

// Kompetensi
const competenceSearch = ref('')
const competenceColumns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-24 text-center' },
  { key: 'competent_name', label: 'Nama Kompetensi', width: 'min-w-40' },
  { key: 'description', label: 'Deskripsi', width: 'min-w-50' },
  { key: 'active', label: 'Status', width: 'w-28 text-center' },
]

const filteredCompetences = computed(() => {
  const list = major.value?.child_data_major_competent || []
  if (!competenceSearch.value.trim()) return list

  const q = competenceSearch.value.toLowerCase()
  return list.filter(
    (item) =>
      item.competent_name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
  )
})

// Gallery
const galleryColumns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-24 text-center' },
  { key: 'img_cover', label: 'Preview Foto', width: 'w-36' },
  { key: 'description', label: 'Deskripsi', width: 'min-w-40' },
  { key: 'active', label: 'Status', width: 'w-28 text-center' },
]

const gallerySearch = ref('')
const filteredGalleries = computed(() => {
  const list = major.value?.child_data_major_gallery || []
  if (!gallerySearch.value.trim()) return list

  const q = gallerySearch.value.toLowerCase()
  return list.filter(
    (item) => item.description?.toLowerCase().includes(q) || item.title?.toLowerCase().includes(q),
  )
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.')

  return `${formattedDate} • ${formattedTime} WIB`
}

let fetchRequestId = 0

const fetchDetail = async () => {
  const requestId = ++fetchRequestId
  const majorId = route.params.id

  if (!majorId) {
    major.value = null
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const response = await api.get(`/majors/${majorId}`)

    // Abaikan respons dari request yang sudah tidak relevan
    if (requestId !== fetchRequestId) return

    major.value = response.data.data
  } catch (err) {
    // Jangan tampilkan error dari request lama
    if (requestId !== fetchRequestId) return

    console.error('Gagal mengambil detail jurusan:', err)
    toastStore.show('Gagal memuat Detail Jurusan.', 'error')
  } finally {
    // Jangan matikan loading milik request yang lebih baru
    if (requestId === fetchRequestId) {
      isLoading.value = false
    }
  }
}

// Handler Navigasi & Aksi CRUD Kompetensi
const handleAddCompetence = () => {
  router.push({
    name: 'dashboard-kompetensi-jurusan-create',
    params: { majorId: route.params.id },
    query: { tab: 'competence' },
  })
}

const handleEditCompetence = (item: MajorCompetent) => {
  router.push({
    name: 'dashboard-kompetensi-jurusan-edit',
    params: {
      majorId: route.params.id,
      id: item.id,
    },
    query: { tab: 'competence' },
  })
}

const openDeleteCompetenceModal = (id: number) => {
  selectedDeleteId.value = id
  deleteType.value = 'competence'
  isDeleteModalOpen.value = true
}

// Handler Navigasi & Aksi CRUD Galeri
const handleAddGallery = () => {
  router.push({
    name: 'dashboard-major-gallery-create',
    params: { majorId: route.params.id },
    query: { tab: 'gallery' },
  })
}

const handleEditGallery = (item: MajorGallery) => {
  router.push({
    name: 'dashboard-major-gallery-edit',
    params: {
      majorId: route.params.id,
      id: item.id,
    },
    query: { tab: 'gallery' },
  })
}

const openDeleteGalleryModal = (id: number) => {
  selectedDeleteId.value = id
  deleteType.value = 'gallery'
  isDeleteModalOpen.value = true
}

// Handler Eksekusi Hapus
const handleConfirmDelete = async () => {
  if (!selectedDeleteId.value || !deleteType.value) return

  isDeleting.value = true
  try {
    if (deleteType.value === 'competence') {
      await api.delete('/major-competents/delete', { data: { id: selectedDeleteId.value } })
      toastStore.show('Kompetensi berhasil dihapus!', 'success')
    } else if (deleteType.value === 'gallery') {
      await api.delete('/major-gallery/delete', { data: { id: selectedDeleteId.value } })
      toastStore.show('Foto galeri berhasil dihapus!', 'success')
    }
    closeDeleteModal()
    fetchDetail()
  } catch (err) {
    console.error(`Gagal menghapus ${deleteType.value}:`, err)
    const apiErr = err as { response?: { data?: { message?: string } } }
    toastStore.show(
      apiErr.response?.data?.message ||
        `Gagal menghapus ${deleteType.value === 'competence' ? 'Kompetensi' : 'Foto Galeri'}.`,
      'error',
    )
  } finally {
    isDeleting.value = false
  }
}

// Pantau perubahan ID jurusan
watch(
  () => route.params.id,
  () => {
    fetchDetail()
  },
  { immediate: true },
)

watch(
  () => route.query.tab,
  (tab) => {
    const tabKey = typeof tab === 'string' ? tab : 'detail'

    activeTab.value = detailTabs.some((item) => item.key === tabKey) ? tabKey : 'detail'
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Card Utama -->
    <div class="bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="flex flex-col gap-4">
        <BackButton to="/dashboard/jurusan" :sticky="false" />

        <div class="border-t border-text-alt/50"></div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 class="text-xl lg:text-2xl font-bold text-text-neutral wrap-break-word">
            {{ major ? major.major_name : 'Detail Jurusan' }}
          </h1>

          <div v-if="major" class="flex items-center">
            <DashboardStatusBadge :active="major.active" />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Data Tidak Ditemukan -->
      <div v-else-if="!major" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data jurusan tidak ditemukan.
      </div>
    </div>

    <!-- Detail Jurusan dan Tab -->
    <div
      v-if="!isLoading && major"
      class="bg-neutral rounded-2xl pt-2 shadow-sm overflow-hidden px-4 sm:px-5"
    >
      <TableTabs :tabs="detailTabs" :model-value="activeTab" @update:model-value="handleTabChange">
        <!-- TAB 1: DETAIL JURUSAN -->
        <template #detail>
          <div class="p-4 flex flex-col gap-6 lg:gap-8">
            <dl class="flex flex-col">
              <!-- Kode Jurusan -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Kode Jurusan</dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
                >
                  {{ major.code || '-' }}
                </dd>
              </div>

              <!-- Nama Jurusan -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Nama Jurusan</dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
                >
                  {{ major.major_name || '-' }}
                </dd>
              </div>

              <!-- Logo Jurusan -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Logo Jurusan</dt>
                <dd class="sm:col-span-2 min-w-0">
                  <a
                    v-if="major.img_logo"
                    :href="getFullFileUrl(major.img_logo) || '#'"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm lg:text-base text-primary hover:underline wrap-break-word"
                  >
                    {{ getFullFileUrl(major.img_logo) }}
                  </a>
                  <span v-else class="text-sm lg:text-base text-text-alt"> - </span>
                </dd>
              </div>

              <!-- Ringkasan -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Ringkasan</dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral leading-relaxed wrap-break-word"
                >
                  {{ major.summary || '-' }}
                </dd>
              </div>

              <!-- Jumlah Kelas / Durasi -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">
                  Jumlah Kelas / Durasi
                </dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
                >
                  {{ major.total_classes ?? '-' }} Indeks Kelas /
                  {{ major.major_duration ?? '-' }} Tahun
                </dd>
              </div>

              <!-- Diubah Terakhir Oleh -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">
                  Diubah Terakhir Oleh
                </dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
                >
                  {{ major.rel_updated_by || '-' }}
                </dd>
              </div>

              <!-- Tanggal Diubah -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>
                <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
                  {{ formatDate(major.updated_at) }}
                </dd>
              </div>

              <!-- Dibuat Oleh -->
              <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
              >
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Dibuat Oleh</dt>
                <dd
                  class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
                >
                  {{ major.rel_created_by || '-' }}
                </dd>
              </div>

              <!-- Tanggal Dibuat -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
                <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>
                <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
                  {{ formatDate(major.created_at) }}
                </dd>
              </div>
            </dl>

            <!-- Deskripsi Lengkap -->
            <div>
              <h2
                class="text-base lg:text-lg text-text-neutral font-semibold pb-3 mb-4 border-b border-text-alt/20"
              >
                Deskripsi Lengkap Jurusan
              </h2>

              <RichTextContent :content="major.full_description" class="max-w-4xl" />
            </div>
          </div>
        </template>

        <!-- TAB 2: KOMPETENSI JURUSAN -->
        <template #competence>
          <div class="py-4">
            <TableData
              :columns="competenceColumns"
              :items="filteredCompetences"
              v-model:search="competenceSearch"
              add-button-label="Tambah Kompetensi"
              search-placeholder="Cari kompetensi..."
              empty-message="Belum ada data kompetensi jurusan."
              loading-label="Memuat data kompetensi jurusan..."
              @add="handleAddCompetence"
            >
              <!-- Slot Nomor -->
              <template #col-no="{ index }">
                <div class="text-center font-medium">
                  {{ index + 1 }}
                </div>
              </template>

              <!-- Slot Status -->
              <template #col-active="{ item }">
                <div class="flex justify-center">
                  <DashboardStatusBadge :active="(item as MajorCompetent).active" />
                </div>
              </template>

              <!-- Slot Deskripsi -->
              <template #col-description="{ item }">
                <span :title="item.description">
                  {{ item.description || '-' }}
                </span>
              </template>

              <!-- Slot Kolom Aksi Desktop -->
              <template #col-action="{ item }">
                <div class="flex items-center justify-center gap-1.5">
                  <DashboardIconButton
                    variant="edit"
                    label="Edit"
                    class="w-7 h-7"
                    @click="handleEditCompetence(item as MajorCompetent)"
                  />
                  <DashboardIconButton
                    variant="delete"
                    label="Hapus"
                    class="w-7 h-7"
                    @click="openDeleteCompetenceModal(item.id)"
                  />
                </div>
              </template>

              <!-- Slot Mobile Card -->
              <template #mobile-card="{ item, index }">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-alt font-medium">#{{ index + 1 }}</span>
                    <DashboardStatusBadge :active="(item as MajorCompetent).active" />
                  </div>
                  <div class="flex items-center gap-1.5">
                    <DashboardIconButton
                      variant="edit"
                      label="Edit"
                      @click="handleEditCompetence(item as MajorCompetent)"
                    />
                    <DashboardIconButton
                      variant="delete"
                      label="Hapus"
                      @click="openDeleteCompetenceModal(item.id)"
                    />
                  </div>
                </div>
                <p class="text-sm font-semibold text-text-neutral">{{ item.competent_name }}</p>
                <p class="text-sm text-text-alt">{{ item.description || '-' }}</p>
              </template>
            </TableData>
          </div>
        </template>

        <!-- TAB 3: GALERI JURUSAN -->
        <template #gallery>
          <div class="py-4">
            <TableData
              v-model:search="gallerySearch"
              :columns="galleryColumns"
              :items="filteredGalleries"
              search-placeholder="Cari foto galeri..."
              add-button-label="Tambah Foto Galeri"
              empty-message="Belum ada data foto galeri."
              loading-label="Memuat data galeri jurusan..."
              @add="handleAddGallery"
            >
              <!-- Slot Nomor -->
              <template #col-no="{ index }">
                <div class="text-center font-medium">
                  {{ index + 1 }}
                </div>
              </template>

              <!-- Slot Status -->
              <template #col-active="{ item }">
                <div class="flex justify-center">
                  <DashboardStatusBadge :active="(item as MajorGallery).active" />
                </div>
              </template>

              <!-- Slot Akses / Tombol Aksi -->
              <template #col-action="{ item }">
                <div class="flex items-center justify-center gap-1.5">
                  <DashboardIconButton
                    variant="edit"
                    label="Edit"
                    class="w-7 h-7"
                    @click.stop="handleEditGallery(item as MajorGallery)"
                  />
                  <DashboardIconButton
                    variant="delete"
                    label="Hapus"
                    class="w-7 h-7"
                    @click.stop="openDeleteGalleryModal(item.id)"
                  />
                </div>
              </template>

              <!-- Slot Gambar Preview Desktop (Di-wrap dengan <a> tag target="_blank") -->
              <template #col-img_cover="{ item }">
                <a
                  v-if="getFullFileUrl(item.img_cover)"
                  :href="getFullFileUrl(item.img_cover)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-28 h-18 rounded-lg overflow-hidden bg-neutral-100 border border-secondary/30 shrink-0 my-1 block group relative cursor-pointer"
                  title="Klik untuk membuka gambar di tab baru"
                >
                  <img
                    :src="getFullFileUrl(item.img_cover)!"
                    :alt="item.description || 'Foto Galeri'"
                    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div
                    class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-neutral"
                  >
                    <RiExternalLinkLine class="w-5 h-5" />
                  </div>
                </a>
                <div
                  v-else
                  class="w-28 h-18 rounded-lg bg-neutral-100 border border-secondary/30 flex items-center justify-center text-xs text-text-alt"
                >
                  Tidak ada foto
                </div>
              </template>

              <!-- Slot Mobile Card View -->
              <template #mobile-card="{ item, index }">
                <div class="flex flex-col gap-3">
                  <!-- Nomor dan Aksi -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-text-alt font-medium"> #{{ index + 1 }} </span>

                      <DashboardStatusBadge :active="(item as MajorGallery).active" />
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <DashboardIconButton
                        variant="edit"
                        label="Edit"
                        class="w-7 h-7"
                        @click.stop="handleEditGallery(item as MajorGallery)"
                      />

                      <DashboardIconButton
                        variant="delete"
                        label="Hapus"
                        class="w-7 h-7"
                        @click.stop="openDeleteGalleryModal(item.id)"
                      />
                    </div>
                  </div>

                  <!-- Informasi Galeri -->
                  <div class="flex flex-col gap-2 min-w-0">
                    <p class="text-sm font-semibold leading-snug text-text-neutral wrap-break-word">
                      {{ item.description || '-' }}
                    </p>

                    <!-- Foto Galeri -->
                    <div
                      class="w-full h-40 rounded-lg border border-neutral/20 bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm"
                    >
                      <a
                        v-if="getFullFileUrl(item.img_cover)"
                        :href="getFullFileUrl(item.img_cover)!"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="w-full h-full block relative cursor-pointer group"
                        title="Klik untuk membuka foto resolusi penuh"
                      >
                        <img
                          :src="getFullFileUrl(item.img_cover)!"
                          :alt="item.description || 'Foto Galeri'"
                          class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
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
                        <span class="text-xs font-medium mt-1">Tidak ada foto</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </TableData>
          </div>
        </template>
      </TableTabs>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      :is-loading="isDeleting"
      :title="modalTitle"
      :message="modalMessage"
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="handleConfirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
