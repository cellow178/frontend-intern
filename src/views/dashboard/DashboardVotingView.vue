<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import Select from '@/components/ui/Select.vue'
import TableData, { type Column } from '@/components/ui/TableData.vue'
import { RiChatPollLine } from '@remixicon/vue'

interface VotingItem {
  id: number
  slug: string
  title: string
  description: string
  start_date: string | null
  end_date: string | null
  active: boolean
  is_highlight: boolean
  mode?: string
  candidate_count: number
  closed_at?: string | null
}

const router = useRouter()
const toastStore = useToastStore()

const votingList = ref<VotingItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedMode = ref<string>('')
const currentPage = ref(1)
const totalData = ref(0)
const totalPage = ref(1)
const pageSize = ref(20)
let searchDebounce: ReturnType<typeof setTimeout> | undefined
let fetchAbort: AbortController | null = null

const columns: Column[] = [
  { key: 'no', label: 'No', width: 'w-12 text-center' },
  { key: 'action', label: 'Aksi', width: 'w-32 text-center' },
  { key: 'title', label: 'Judul', width: 'min-w-[220px]' },
  { key: 'mode', label: 'Mode', width: 'w-32 text-center' },
  { key: 'periode', label: 'Periode', width: 'min-w-[200px] text-center' },
  { key: 'candidate_count', label: 'Kandidat', width: 'w-24 text-center' },
  { key: 'status', label: 'Status', width: 'w-28 text-center' },
]

const modeOptions = [
  { value: '', label: 'Semua Mode' },
  { value: 'tps', label: 'TPS (di tempat)' },
  { value: 'remote', label: 'Jarak Jauh' },
]

const modeBadge = (mode?: string) =>
  mode === 'remote'
    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
    : 'bg-sky-500/10 text-sky-600 border border-sky-500/30'
const modeLabel = (mode?: string) => (mode === 'remote' ? 'Jarak Jauh' : 'TPS')

const votingStatus = (item: VotingItem) => {
  if (!item.active) return { label: 'Nonaktif', cls: 'bg-secondary text-text-alt' }
  // Sama seperti headerStatus di detail: tutup manual (closed_at) dianggap
  // selesai walau jadwal belum lewat.
  if (item.closed_at)
    return { label: 'Selesai', cls: 'bg-success/10 text-success border border-success/30' }
  const now = Date.now()
  const start = item.start_date ? new Date(item.start_date).getTime() : 0
  const end = item.end_date ? new Date(item.end_date).getTime() : 0
  if (start && now < start) return { label: 'Terjadwal', cls: 'bg-warning/10 text-warning' }
  if (end && now > end) return { label: 'Selesai', cls: 'bg-success/10 text-success' }
  return { label: 'Berjalan', cls: 'bg-primary/10 text-primary' }
}

const fmtDate = (s: string | null) => {
  if (!s) return '-'
  const d = new Date(s)
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchVotings = async () => {
  if (fetchAbort) fetchAbort.abort()
  fetchAbort = new AbortController()
  isLoading.value = true
  try {
    const response = await api.get('/votings', {
      params: {
        search: searchQuery.value.trim() || undefined,
        mode: selectedMode.value || undefined,
        limit: pageSize.value,
        page: currentPage.value,
      },
      signal: fetchAbort.signal,
    })
    votingList.value = response.data?.data ?? []
    totalData.value = response.data?.total ?? 0
    totalPage.value = response.data?.totalPage ?? 1
  } catch (error) {
    if (axios.isCancel(error)) return
    toastStore.show('Gagal memuat Voting.', 'error')
  } finally {
    if (!fetchAbort.signal.aborted) isLoading.value = false
  }
}

const onFilterChange = () => {
  currentPage.value = 1
  fetchVotings()
}

const handleResetFilters = () => {
  selectedMode.value = ''
  onFilterChange()
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(onFilterChange, 400)
})

const handleAdd = () => {
  router.push({ name: 'dashboard-voting-create' })
}

const handlePageChange = (p: number) => {
  currentPage.value = p
  fetchVotings()
}
const handlePerPageChange = (n: number) => {
  pageSize.value = n
  onFilterChange()
}

// --- Hapus ---
const isDeleteOpen = ref(false)
const deleteId = ref<number | null>(null)
const isDeleting = ref(false)
const openDelete = (id: number) => {
  deleteId.value = id
  isDeleteOpen.value = true
}
const confirmDelete = async () => {
  if (!deleteId.value) return
  isDeleting.value = true
  try {
    await api.delete('/votings/delete', { data: { id: deleteId.value } })
    toastStore.show('Voting dihapus.', 'success')
    isDeleteOpen.value = false
    fetchVotings()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus.', 'error')
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchVotings()
})
onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (fetchAbort) fetchAbort.abort()
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold text-text-neutral flex items-center gap-2">
        <RiChatPollLine class="w-5 h-5 text-primary" />
        Voting
      </h1>
      <p class="text-sm text-text-alt">
        Kelola ruang voting TPS (di tempat) &amp; Jarak Jauh. Hasil akhir tampil setelah voting selesai.
      </p>
    </div>

    <TableData
      v-model:search="searchQuery"
      :columns="columns"
      :items="votingList"
      :is-loading="isLoading"
      :show-add-button="true"
      :show-filter-button="true"
      add-button-label="Buat Voting"
      :total-items="totalData"
      :current-page="currentPage"
      :total-page="totalPage"
      :items-per-page="pageSize"
      search-placeholder="Cari judul voting..."
      empty-message="Belum ada voting."
      loading-label="Memuat voting..."
      @add="handleAdd"
      @reset-filters="handleResetFilters"
      @update:current-page="handlePageChange"
      @update:items-per-page="handlePerPageChange"
    >
      <template #filters>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div class="w-full sm:w-fit sm:min-w-44">
            <Select
              v-model="selectedMode"
              size="normal"
              variant="semi-rounded"
              placeholder=""
              :options="modeOptions"
              @update:model-value="onFilterChange"
            />
          </div>
        </div>
      </template>

      <template #col-no="{ index }">
        <div class="text-center font-medium">{{ (currentPage - 1) * pageSize + index + 1 }}</div>
      </template>

      <template #col-action="{ item }">
        <div class="flex items-center justify-center gap-1.5">
          <DashboardIconButton
            variant="info"
            label="Detail & Kelola"
            class="w-7 h-7"
            @click="router.push({ name: 'dashboard-voting-detail', params: { id: (item as VotingItem).id } })"
          />
          <DashboardIconButton
            variant="edit"
            label="Edit"
            class="w-7 h-7"
            @click="router.push({ name: 'dashboard-voting-edit', params: { id: (item as VotingItem).id } })"
          />
          <DashboardIconButton
            variant="delete"
            label="Hapus"
            class="w-7 h-7"
            @click="openDelete((item as VotingItem).id)"
          />
        </div>
      </template>

      <template #col-title="{ item }">
        <span class="font-medium text-text-neutral line-clamp-1" :title="(item as VotingItem).title">
          {{ (item as VotingItem).title }}
        </span>
      </template>

      <template #col-mode="{ item }">
        <span
          class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
          :class="modeBadge((item as VotingItem).mode)"
        >
          {{ modeLabel((item as VotingItem).mode) }}
        </span>
      </template>

      <template #col-periode="{ item }">
        <span class="text-xs text-text-alt">
          {{ fmtDate((item as VotingItem).start_date) }} — {{ fmtDate((item as VotingItem).end_date) }}
        </span>
      </template>

      <template #col-candidate_count="{ item }">
        <div class="text-center font-medium">{{ (item as VotingItem).candidate_count }}</div>
      </template>

      <template #col-status="{ item }">
        <span
          class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
          :class="votingStatus(item as VotingItem).cls"
        >
          {{ votingStatus(item as VotingItem).label }}
        </span>
      </template>

      <!-- Mobile: kartu ringkas (TableData otomatis pakai slot ini di <md) -->
      <template #mobile-card="{ item, index }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-alt font-medium">
            #{{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <div class="flex items-center gap-1.5">
            <DashboardIconButton
              variant="info"
              label="Detail & Kelola"
              @click="
                router.push({
                  name: 'dashboard-voting-detail',
                  params: { id: (item as VotingItem).id },
                })
              "
            />
            <DashboardIconButton
              variant="edit"
              label="Edit"
              @click="
                router.push({
                  name: 'dashboard-voting-edit',
                  params: { id: (item as VotingItem).id },
                })
              "
            />
            <DashboardIconButton
              variant="delete"
              label="Hapus"
              @click="openDelete((item as VotingItem).id)"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-text-neutral wrap-break-word">
              {{ (item as VotingItem).title }}
            </span>
            <span
              class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              :class="votingStatus(item as VotingItem).cls"
            >
              {{ votingStatus(item as VotingItem).label }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs flex-wrap">
            <span
              class="inline-block font-semibold px-2 py-0.5 rounded-full"
              :class="modeBadge((item as VotingItem).mode)"
            >
              {{ modeLabel((item as VotingItem).mode) }}
            </span>
            <span class="text-text-alt"
              >{{ (item as VotingItem).candidate_count }} kandidat</span
            >
          </div>
          <span class="text-xs text-text-alt">
            {{ fmtDate((item as VotingItem).start_date) }} —
            {{ fmtDate((item as VotingItem).end_date) }}
          </span>
        </div>
      </template>
    </TableData>

    <!-- Modal hapus -->
    <ConfirmModal
      :is-open="isDeleteOpen"
      :is-loading="isDeleting"
      title="Hapus Voting"
      message="Voting beserta daftar pemilih, kode, dan suaranya akan dihapus permanen."
      confirm-text="Hapus"
      @confirm="confirmDelete"
      @cancel="isDeleteOpen = false"
    />
  </div>
</template>
