<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import AdminButton from '@/components/ui/AdminButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import Input from '@/components/ui/Input.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Select from '@/components/ui/Select.vue'
import { getFullFileUrl } from '@/utils/file'
import { RiAddLine, RiChatPollLine, RiEditLine, RiErrorWarningLine, RiLockLine, RiQrCodeLine } from '@remixicon/vue'

interface Candidate {
  id: number
  title: string
  description: string
  img_cover: string | { path?: string; url?: string; field_value?: string } | null
  order: number
  active: boolean
}

// Label ringkas filter siswa, cth: "3 & 4 tahun • angkatan 2023, 2024 • tanpa kelas 13".
const siswaFilterLabel = computed(() => {
  if (!detail.value?.include_siswa) return '—'
  const parts: string[] = []
  const masa = detail.value.masa_studi_list ?? []
  parts.push(masa.length > 0 ? `${masa.join(' & ')} Tahun` : 'Semua masa studi')
  const angkatan = detail.value.tahun_masuk_list ?? []
  parts.push(angkatan.length > 0 ? `Angkatan ${angkatan.join(', ')}` : 'Semua Angkatan')
  if (!detail.value.include_tingkat_13) parts.push('Tanpa kelas 13')
  return parts.join(' • ')
})

interface DptRow {
  user_id: number | null
  fullname: string
  username: string
  nis?: string | null
  role_id: number | null
  tahun_masuk: number | null
  masa_studi: number | null
  voted_at: string | null
}

interface VotingDetail {
  id: number
  slug: string
  title: string
  description: string
  start_date: string | null
  end_date: string | null
  active: boolean
  mode: string
  include_siswa: boolean
  include_teachers: boolean
  masa_studi_list: number[] | null
  tahun_masuk_list: number[] | null
  include_tingkat_13: boolean
  dpt_frozen_at: string | null
  closed_at: string | null
  // "Daftar Pemilih" = istilah ramah-siswa untuk DPT (backend tetap memakai dpt_*).
  participation: { dpt_total: number; dpt_frozen: boolean; voted: number; not_voted: number }
}

interface ResultCandidate {
  id: number
  title: string
  img_cover: string | { path?: string; url?: string; field_value?: string } | null
  votes: number
  percent: number
}

// Palet pie chart hasil (diulang bila kandidat > palet). Urutan sama
// dengan daftar kandidat agar warna konsisten dengan bar.
const PIE_COLORS = [
  '#ff9644',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#eab308',
  '#ef4444',
  '#14b8a6',
  '#f472b6',
]
const pieColorOf = (i: number) => PIE_COLORS[i % PIE_COLORS.length]!

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const votingId = Number(route.params.id)

const detail = ref<VotingDetail | null>(null)
const candidates = ref<Candidate[]>([])
const isLoading = ref(true)

type VotingTab = 'dpt' | 'kandidat' | 'checkin' | 'hasil'
const VALID_TABS: VotingTab[] = ['dpt', 'kandidat', 'checkin', 'hasil']
// Tab terakhir dibuka disimpan di query (?tab=kandidat) agar kembali dari
// form kandidat (tambah/edit) mendarat di tab yang sama.
const queryTab = route.query.tab
const activeTab = ref<VotingTab>(
  typeof queryTab === 'string' && (VALID_TABS as string[]).includes(queryTab)
    ? (queryTab as VotingTab)
    : 'dpt',
)

const setActiveTab = (tab: VotingTab) => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  if (tab === 'hasil') fetchResult()
}

// --- DPT ---
interface DptPreviewRow {
  fullname: string
  username: string
  nis?: string | null
  role_id: number
  tahun_masuk?: number | null
}
const dptPreview = ref<{
  total: number
  rows: DptPreviewRow[]
  sample: { fullname: string; username: string; role_id: number }[]
  warnings?: string[]
} | null>(null)

// Label kelas utk baris pratinjau (tanpa voted_at).
const previewTingkatLabel = (s: DptPreviewRow) => {
  if ((s.role_id ?? 3) !== 3 || !s.tahun_masuk) return '—'
  return `Kelas ${new Date().getFullYear() - s.tahun_masuk + 10}`
}
const dptWarningsDismissed = ref(false)
const isPreviewing = ref(false)
const isFreezing = ref(false)

// --- Check-in TPS ---
const checkinIdentifier = ref('')
const checkinResult = ref<{
  fullname: string
  username: string
  nis?: string | null
  pass: string
} | null>(null)
const isCheckingIn = ref(false)

// --- Countdown + durasi voting ---
const nowTick = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | undefined

const votingWindow = computed(() => {
  if (!detail.value) return { phase: 'unknown' as const, ms: 0 }
  const now = nowTick.value
  const start = detail.value.start_date ? new Date(detail.value.start_date).getTime() : 0
  const end = detail.value.end_date ? new Date(detail.value.end_date).getTime() : 0
  if (detail.value.closed_at) return { phase: 'finished' as const, ms: 0 }
  if (start && now < start) return { phase: 'upcoming' as const, ms: start - now }
  if (end && now < end) return { phase: 'running' as const, ms: end - now }
  if (end && now >= end) return { phase: 'finished' as const, ms: 0 }
  return { phase: 'unknown' as const, ms: 0 }
})

const pad2 = (n: number) => String(n).padStart(2, '0')
const countdownParts = computed(() => {
  const ms = Math.max(0, votingWindow.value.ms)
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours: pad2(hours), minutes: pad2(minutes), seconds: pad2(seconds) }
})

const countdownBoxCls =
  'min-w-14 rounded-xl bg-primary/10 border border-primary/20 px-2 py-1.5 text-center'

// Durasi voting dalam format ringkas (cth. "2 jam 30 mnt" / "3 hari").
const durationLabel = computed(() => {
  if (!detail.value?.start_date || !detail.value?.end_date) return '-'
  const diff =
    new Date(detail.value.end_date).getTime() - new Date(detail.value.start_date).getTime()
  if (diff <= 0) return '-'
  const mins = Math.floor(diff / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d} hari`)
  if (h > 0) parts.push(`${h} jam`)
  if (m > 0 && d === 0) parts.push(`${m} mnt`)
  return parts.join(' ') || '-'
})

// --- Daftar DPT (snapshot terkunci) ---
const dptRows = ref<DptRow[]>([])
const dptSearch = ref('')
const dptVotedFilter = ref<string>('')
const isLoadingDpt = ref(false)
const dptPage = ref(1)
const dptTotal = ref(0)
const dptTotalPage = ref(1)
const dptPageSize = ref('20')

// --- Kandidat (form halaman sendiri: tambah / edit via route) ---
// Object Find { field_value: "tmp/xxx.jpg" (VALID, file fisik masih ada) }.
// Route temp-file: api/temp-file/{nama-file-UTUH}/{time}/{ekstensi}.
// Timestamp fixed per render agar tidak kedip.
const CANDIDATE_IMG_TS = Date.now()
const candidateImgUrl = (img: Candidate['img_cover']): string | null => {
  if (!img) return null
  const obj = typeof img === 'string' ? null : img
  const raw: unknown = obj ? (obj.field_value ?? obj.path ?? null) : img
  if (typeof raw !== 'string' || !raw || raw === 'x' || raw.trim() === '') return null
  const clean = raw.replace(/^\/+/, '')
  if (/^https?:\/\//.test(clean)) return clean
  // field_value utuh (cth "tmp/1792394869.jpeg"): nama file UTUH (termasuk
  // ekstensi) karena route hanya menambah prefix "tmp/".
  const filename = clean.split('/').pop() ?? clean
  const ext = filename.match(/\.([^./]+)$/)?.[1] ?? 'jpg'
  return getFullFileUrl(`api/temp-file/${filename}/${CANDIDATE_IMG_TS}/${ext}`)
}

// Kandidat tampil urut nomor urut (bukan urutan insert DB).
const sortedCandidates = computed(() =>
  [...candidates.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
)

// Ringkasan teks polos dari HTML rich text (untuk kartu kandidat).
const plainDescription = (html: string): string => {
  if (!html) return 'Belum ada visi.'
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || 'Belum ada visi.'
}

// Nomor urut surat suara per kandidat (untuk label hasil; hasil diurut
// perolehan, jadi peringkat ≠ nomor urut).
const candidateOrderOf = (id: number): number | string =>
  candidates.value.find((c) => c.id === id)?.order ?? '—'

// --- Hasil ---
const result = ref<{
  valid_votes: number
  participation_rate: number
  participation: { dpt_total: number; voted: number; not_voted: number }
  candidates: ResultCandidate[]
} | null>(null)
const isLoadingResult = ref(false)
const resultError = ref('')

const isTps = computed(() => (detail.value?.mode ?? 'tps') === 'tps')
const isFrozen = computed(() => !!detail.value?.dpt_frozen_at)

// Status keseluruhan voting untuk badge header.
const headerStatus = computed(() => {
  if (!detail.value) return { label: '-', cls: 'bg-secondary text-text-alt' }
  if (!detail.value.active) return { label: 'Nonaktif', cls: 'bg-secondary text-text-alt' }
  if (detail.value.closed_at)
    return { label: 'Selesai', cls: 'bg-success/10 text-success border border-success/30' }
  const now = Date.now()
  const start = detail.value.start_date ? new Date(detail.value.start_date).getTime() : 0
  const end = detail.value.end_date ? new Date(detail.value.end_date).getTime() : 0
  if (start && now < start)
    return { label: 'Terjadwal', cls: 'bg-warning/10 text-warning border border-warning/30' }
  if (end && now < end)
    return { label: 'Berjalan', cls: 'bg-primary/10 text-primary border border-primary/30' }
  if (end && now >= end)
    return { label: 'Selesai', cls: 'bg-success/10 text-success border border-success/30' }
  return { label: 'Berjalan', cls: 'bg-primary/10 text-primary border border-primary/30' }
})
const isFinished = computed(() => {
  if (!detail.value) return false
  if (detail.value.closed_at) return true
  if (!detail.value.end_date) return false
  return new Date(detail.value.end_date).getTime() < Date.now()
})

// --- Tutup voting lebih awal (hasil final langsung tampil) ---
const isCloseOpen = ref(false)
const isClosing = ref(false)
const confirmClose = async () => {
  isClosing.value = true
  try {
    const response = await api.post('/votings/close', { id: votingId })
    toastStore.show(response.data?.message || 'Voting ditutup.', 'success')
    isCloseOpen.value = false
    await fetchDetail()
    if (activeTab.value === 'hasil') fetchResult()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menutup voting.', 'error')
  } finally {
    isClosing.value = false
  }
}

const tabs = computed(() => {
  const base = [
    { key: 'dpt', label: 'Peserta' },
    { key: 'kandidat', label: `Kandidat (${candidates.value.length})` },
    // Check-in hanya untuk TPS; remote langsung dari akun (tanpa tab).
    ...(isTps.value ? [{ key: 'checkin', label: 'Check-in TPS' }] : []),
    { key: 'hasil', label: 'Hasil' },
  ] as { key: VotingTab; label: string }[]
  return base
})

const fetchDetail = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/votings/${votingId}`)
    detail.value = response.data?.data ?? null
    candidates.value = (response.data?.data?.candidates ?? []).map((c: Candidate) => c)
  } catch {
    toastStore.show('Gagal memuat detail voting.', 'error')
  } finally {
    isLoading.value = false
  }
}

// Muat ulang ringkasan partisipasi saja (dipakai setelah check-in / token
// diterbitkan) tanpa memuat ulang seluruh halaman.
const refreshParticipation = async () => {
  try {
    const response = await api.get(`/votings/${votingId}`)
    if (detail.value && response.data?.data?.participation) {
      detail.value.participation = response.data.data.participation
    }
  } catch {
    // Abaikan — angka partisipasi akan diperbarui saat refresh berikutnya.
  }
}

const previewDpt = async () => {
  isPreviewing.value = true
  dptWarningsDismissed.value = false
  try {
    const response = await api.get(`/votings/${votingId}/dpt-preview`)
    dptPreview.value = response.data?.data ?? null
  } catch {
    toastStore.show('Gagal menghitung DPT.', 'error')
  } finally {
    isPreviewing.value = false
  }
}

const dismissDptWarnings = () => {
  dptWarningsDismissed.value = true
}

const freezeDpt = async () => {
  isFreezing.value = true
  try {
    const response = await api.post('/votings/freeze-dpt', { id: votingId })
    toastStore.show(response.data?.message || 'DPT dikunci!', 'success')
    dptPreview.value = null
    await fetchDetail()
    dptPage.value = 1
    fetchDpt()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal mengunci DPT.', 'error')
  } finally {
    isFreezing.value = false
  }
}

const handleCheckin = async () => {
  if (!checkinIdentifier.value.trim()) {
    toastStore.show('Isi NIS / NISN / username / nama pemilih.', 'error')
    return
  }
  isCheckingIn.value = true
  checkinResult.value = null
  try {
    const response = await api.post('/booth/checkin', {
      voting_id: votingId,
      identifier: checkinIdentifier.value.trim(),
    })
    checkinResult.value = response.data?.data ?? null
    checkinIdentifier.value = ''
    refreshParticipation()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Check-in gagal.', 'error')
  } finally {
    isCheckingIn.value = false
  }
}

const openCandidateCreate = () => {
  router.push({
    name: 'dashboard-voting-candidate-create',
    params: { votingId: String(votingId) },
  })
}

const openCandidateEdit = (c: Candidate) => {
  router.push({
    name: 'dashboard-voting-candidate-edit',
    params: { votingId: String(votingId), candidateId: String(c.id) },
  })
}

const fetchResult = async () => {
  isLoadingResult.value = true
  resultError.value = ''
  result.value = null
  try {
    const response = await api.get(`/votings/${votingId}/result`)
    result.value = response.data?.data ?? null
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    resultError.value = err.response?.data?.message || 'Gagal memuat hasil.'
  } finally {
    isLoadingResult.value = false
  }
}

const fmtDate = (s: string | null) => {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dptVotedOptions = [
  { value: '', label: 'Semua peserta' },
  { value: 'voted', label: 'Sudah hadir' },
  { value: 'not_voted', label: 'Belum hadir' },
]

// Format persen Indonesia: selalu 2 desimal, koma sebagai pemisah
// (cth. 0,25%). Backend mengirim number (bisa 0 / 12.5 / 33.33).
const fmtPercent = (v: number | null | undefined): string =>
  (Number(v) || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const dptProgressPercent = computed(() => {
  const total = detail.value?.participation.dpt_total ?? 0
  if (total <= 0) return 0
  return Math.round(((detail.value?.participation.voted ?? 0) / total) * 100)
})

const fetchDpt = async () => {
  isLoadingDpt.value = true
  try {
    const response = await api.get(`/votings/${votingId}/dpt`, {
      params: {
        search: dptSearch.value.trim() || undefined,
        voted: dptVotedFilter.value || undefined,
        page: dptPage.value,
        limit: dptPageSize.value,
      },
    })
    dptRows.value = response.data?.data ?? []
    dptTotal.value = response.data?.total ?? 0
    dptTotalPage.value = response.data?.totalPage ?? 1
  } catch {
    toastStore.show('Gagal memuat DPT.', 'error')
  } finally {
    isLoadingDpt.value = false
  }
}

const onDptFilterChange = () => {
  dptPage.value = 1
  fetchDpt()
}

const onDptPageSizeChange = (size: string) => {
  dptPageSize.value = size
  dptPage.value = 1
  fetchDpt()
}

let dptDebounce: ReturnType<typeof setTimeout> | undefined
const onDptSearch = () => {
  if (dptDebounce) clearTimeout(dptDebounce)
  dptDebounce = setTimeout(onDptFilterChange, 400)
}

const tingkatLabel = (row: DptRow) => {
  if ((row.role_id ?? 3) !== 3 || !row.tahun_masuk) return '—'
  return `Kelas ${new Date().getFullYear() - row.tahun_masuk + 10}`
}

onMounted(async () => {
  countdownTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
  await fetchDetail()
  // Samakan tab aktif dengan ?tab= (mis. kembali dari form kandidat).
  // Tab check-in hanya untuk TPS; remote tanpa tab -> fallback Peserta.
  const available = tabs.value.map((t) => t.key)
  if (!available.includes(activeTab.value)) {
    setActiveTab('dpt')
  } else if (activeTab.value === 'hasil') {
    fetchResult()
  }
  if (isFrozen.value) fetchDpt()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (dptDebounce) clearTimeout(dptDebounce)
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <div class="shrink-0">
      <BackButton to="/dashboard/voting" label="Kembali" :sticky="false" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <LoadingSpinner size="lg" label="Memuat detail voting..." />
    </div>

    <template v-else-if="detail">
      <!-- Header ringkas: judul + badge status/mode + jadwal + aksi tutup -->
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex flex-col gap-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="flex items-center gap-2 text-xl font-bold text-text-neutral"><RiChatPollLine class="w-5 h-5 text-primary shrink-0" />{{ detail.title }}</h1>
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                :class="
                  isTps
                    ? 'bg-sky-500/10 text-sky-600 border border-sky-500/30'
                    : 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
                "
              >
                {{ isTps ? 'TPS' : 'Jarak Jauh' }}
              </span>
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                :class="headerStatus.cls"
              >
                {{ headerStatus.label }}
              </span>
            </div>
            <p class="text-sm text-text-alt line-clamp-2">{{ detail.description }}</p>
            <p class="text-xs text-text-alt">
              {{ fmtDate(detail.start_date) }} — {{ fmtDate(detail.end_date) }}
              <span class="font-semibold text-text-neutral">• {{ durationLabel }}</span>
            </p>
          </div>
          <div v-if="!isFinished" class="flex items-center gap-2 shrink-0">
            <AdminButton
              size="sm"
              variant="secondary"
              label="Edit"
              :icon-left="RiEditLine"
              @click="router.push({ name: 'dashboard-voting-edit', params: { id: votingId } })"
            />
            <AdminButton
              size="sm"
              variant="warning"
              label="Tutup Voting"
              :icon-left="RiLockLine"
              @click="isCloseOpen = true"
            />
          </div>
        </div>

        <!-- Countdown + kehadiran: 2 kartu highlight -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-alt">
              {{ votingWindow.phase === 'upcoming' ? 'Dibuka dalam' : 'Ditutup dalam' }}
            </p>
            <template v-if="votingWindow.phase === 'finished'">
              <p class="mt-1 text-lg font-bold text-success">Voting selesai</p>
              <p class="mt-0.5 text-xs text-text-alt">Hasil akhir tampil di tab Hasil.</p>
            </template>
            <template v-else-if="votingWindow.phase === 'unknown'">
              <p class="mt-1 text-lg font-bold text-text-neutral">—</p>
              <p class="mt-0.5 text-xs text-text-alt">Jadwal belum lengkap.</p>
            </template>
            <template v-else>
              <div class="mt-1.5 flex items-center gap-1.5">
                <div v-if="countdownParts.days > 0" :class="countdownBoxCls">
                  <p class="text-lg font-bold text-primary leading-none">
                    {{ countdownParts.days }}
                  </p>
                  <p class="text-[10px] text-text-alt mt-0.5">hari</p>
                </div>
                <div :class="countdownBoxCls">
                  <p class="text-lg font-bold text-primary leading-none">
                    {{ countdownParts.hours }}
                  </p>
                  <p class="text-[10px] text-text-alt mt-0.5">jam</p>
                </div>
                <span class="font-bold text-primary">:</span>
                <div :class="countdownBoxCls">
                  <p class="text-lg font-bold text-primary leading-none">
                    {{ countdownParts.minutes }}
                  </p>
                  <p class="text-[10px] text-text-alt mt-0.5">mnt</p>
                </div>
                <span class="font-bold text-primary">:</span>
                <div :class="countdownBoxCls">
                  <p class="text-lg font-bold text-primary leading-none">
                    {{ countdownParts.seconds }}
                  </p>
                  <p class="text-[10px] text-text-alt mt-0.5">dtk</p>
                </div>
              </div>
            </template>
          </div>
          <div class="rounded-2xl border border-success/30 bg-success/5 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-alt">
              Kehadiran Peserta
            </p>
            <div class="mt-1 flex items-baseline gap-2">
              <p class="text-2xl font-bold text-text-neutral">
                {{ detail.participation.voted
                }}<span class="text-sm font-medium text-text-alt"
                  >/{{ detail.participation.dpt_total }}</span
                >
              </p>
              <p class="text-sm font-bold text-success">
                {{
                  fmtPercent(
                    (detail.participation.voted / Math.max(1, detail.participation.dpt_total)) *
                      100,
                  )
                }}%
              </p>
            </div>
            <div class="mt-2 h-2 rounded-full bg-secondary/70 overflow-hidden">
              <div
                class="h-full rounded-full bg-success transition-all"
                :style="{ width: dptProgressPercent + '%' }"
              />
            </div>
            <p class="mt-1 text-xs text-text-alt">
              {{ detail.participation.not_voted }} peserta belum hadir
            </p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-secondary">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="px-4 py-2.5 text-sm font-medium cursor-pointer"
          :class="
            activeTab === t.key
              ? 'font-bold text-primary border-b-2 border-primary'
              : 'text-text-alt hover:text-text-neutral'
          "
          @click="setActiveTab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- TAB PEMILIH -->
      <div v-if="activeTab === 'dpt'" class="flex flex-col gap-4">
        <div class="rounded-xl border border-secondary/40 flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <p class="font-bold text-text-neutral text-base sm:text-lg">Peserta Voting</p>
            <span
              class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              :class="
                isFrozen
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-warning/10 text-warning border border-warning/30'
              "
            >
              {{ isFrozen ? 'Terkunci' : 'Belum dikunci' }}
            </span>
          </div>

          <!-- Ringkasan cakupan peserta -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
            <div
              class="rounded-xl px-3.5 py-3 transition-colors"
              :class="detail.include_siswa ? 'bg-primary/5 border border-primary/20' : ''"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-text-alt">Siswa</p>
              <p class="mt-0.5 font-bold text-text-neutral">
                {{ detail.include_siswa ? 'Mengikuti' : 'Tidak Mengikuti' }}
              </p>
              <p v-if="detail.include_siswa" class="mt-0.5 text-xs text-text-alt leading-relaxed">
                {{ siswaFilterLabel }}
              </p>
            </div>
            <div
              class="rounded-xl px-3.5 py-3 transition-colors"
              :class="detail.include_teachers ? 'bg-primary/5 border border-primary/20' : ''"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-text-alt">Guru</p>
              <p class="mt-0.5 font-bold text-text-neutral">
                {{ detail.include_teachers ? 'Mengikuti' : 'Tidak Mengikuti' }}
              </p>
              <p class="mt-0.5 text-xs text-text-alt">
                {{ detail.include_teachers ? 'Seluruh guru aktif' : '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-text-alt">
                Total Peserta
              </p>
              <p class="mt-0.5 text-xl font-bold text-text-neutral">
                {{ isFrozen ? detail.participation.dpt_total : (dptPreview?.total ?? '—') }}
              </p>
              <p class="mt-0.5 text-xs text-text-alt">
                {{ isFrozen ? 'Daftar sudah dikunci' : '' }}
              </p>
            </div>
          </div>
          <div
            v-if="!isFrozen"
            class="rounded-xl bg-warning/5 border border-warning/30 px-3.5 py-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2.5"
          >
            <RiErrorWarningLine class="w-5 h-5 text-warning shrink-0" />
            <p class="text-text-neutral flex-1">
              Mohon hitung dan cek daftar pesertanya, baru kunci. Setelah dikunci, mode &amp; daftar
              peserta tidak bisa diubah.
            </p>
            <AdminButton
              size="sm"
              variant="secondary"
              label="Hitung Jumlah Peserta"
              :loading="isPreviewing"
              @click="previewDpt"
            />
          </div>
          <div
            v-if="dptPreview"
            class="rounded-xl bg-secondary/20 p-3 sm:p-4 text-sm flex flex-col gap-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-text-neutral">
                Hasil hitung: {{ dptPreview.total }} peserta.
              </p>
              <AdminButton
                size="sm"
                variant="primary"
                label="Kunci Daftar Peserta"
                :icon-left="RiLockLine"
                :loading="isFreezing"
                :disabled="(dptPreview.warnings?.length ?? 0) > 0 && !dptWarningsDismissed"
                @click="freezeDpt"
              />
            </div>
            <!-- Tabel pratinjau: semua baris hasil hitung (desktop) / kartu (mobile) -->
            <div
              v-if="dptPreview.rows.length > 0"
              class="hidden md:block max-h-72 overflow-y-auto border border-secondary/40 rounded-lg bg-neutral"
            >
              <table class="w-full text-xs">
                <thead class="bg-secondary sticky top-0">
                  <tr class="text-left">
                    <th class="px-2.5 py-1.5 w-12 text-center">No</th>
                    <th class="px-2.5 py-1.5">Nama Peserta</th>
                    <th class="px-2.5 py-1.5">NIS</th>
                    <th class="px-2.5 py-1.5">NISN / Username</th>
                    <th class="px-2.5 py-1.5 text-center">Kelas</th>
                    <th class="px-2.5 py-1.5 text-center">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(s, i) in dptPreview.rows"
                    :key="i"
                    class="border-t border-secondary/20"
                  >
                    <td class="px-2.5 py-1.5 text-center text-text-alt">{{ i + 1 }}</td>
                    <td class="px-2.5 py-1.5 font-medium text-text-neutral">{{ s.fullname }}</td>
                    <td class="px-2.5 py-1.5 font-mono text-text-neutral">
                      {{ s.nis ?? '-' }}
                    </td>
                    <td class="px-2.5 py-1.5 font-mono text-text-alt">{{ s.username }}</td>
                    <td class="px-2.5 py-1.5 text-center text-text-neutral">
                      {{ previewTingkatLabel(s) }}
                    </td>
                    <td class="px-2.5 py-1.5 text-center">
                      <span
                        class="inline-block px-2 py-0.5 rounded-full font-semibold"
                        :class="
                          s.role_id === 2 ? 'bg-info/10 text-info' : 'bg-secondary text-text-alt'
                        "
                      >
                        {{ s.role_id === 2 ? 'Guru' : 'Siswa' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              v-if="dptPreview.rows.length > 0"
              class="md:hidden flex flex-col gap-2 max-h-72 overflow-y-auto"
            >
              <div
                v-for="(s, i) in dptPreview.rows"
                :key="i"
                class="rounded-xl border border-secondary/40 bg-neutral p-2.5 flex items-center gap-2.5"
              >
                <span
                  class="w-8 h-8 rounded-full bg-secondary text-text-alt flex items-center justify-center text-xs font-bold shrink-0"
                >
                  {{ i + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-text-neutral text-xs truncate">{{ s.fullname }}</p>
                  <p class="text-[11px] text-text-alt font-mono truncate">
                    {{ s.nis ?? '-' }} • {{ s.username }} • {{ previewTingkatLabel(s) }}
                  </p>
                </div>
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  :class="s.role_id === 2 ? 'bg-info/10 text-info' : 'bg-secondary text-text-alt'"
                >
                  {{ s.role_id === 2 ? 'Guru' : 'Siswa' }}
                </span>
              </div>
            </div>
            <div
              v-if="(dptPreview.warnings?.length ?? 0) > 0 && !dptWarningsDismissed"
              class="rounded-lg border border-warning/40 bg-warning/5 p-2.5 text-xs flex items-start gap-2"
            >
              <RiErrorWarningLine class="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div class="flex-1">
                <ul class="text-text-neutral">
                  <li v-for="(w, i) in dptPreview.warnings" :key="i">• {{ w }}</li>
                </ul>
                <button
                  type="button"
                  class="mt-1.5 text-primary font-semibold hover:underline cursor-pointer"
                  @click="dismissDptWarnings"
                >
                  Saya mengerti, lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Daftar peserta + progres kehadiran (hanya setelah dikunci) -->
        <div
          v-if="isFrozen"
          class="rounded-xl border border-secondary/40 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="font-bold text-text-neutral text-base sm:text-lg">Daftar Peserta</p>
            <span class="text-xs text-text-alt shrink-0">{{ dptTotal }} peserta</span>
          </div>

          <!-- Pencarian + filter -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex-1">
              <Input
                v-model="dptSearch"
                type="text"
                variant="semi-rounded"
                size="mobile"
                placeholder="Cari nama / NIS / NISN / username..."
                @input="onDptSearch"
              />
            </div>
            <div class="w-full sm:w-48">
              <Select
                v-model="dptVotedFilter"
                size="normal"
                variant="semi-rounded"
                placeholder=""
                :options="dptVotedOptions"
                @update:model-value="onDptFilterChange"
              />
            </div>
          </div>

          <!-- Loading awal (belum ada data sama sekali) -->
          <div
            v-if="isLoadingDpt && dptRows.length === 0"
            class="flex flex-col items-center justify-center py-16"
          >
            <LoadingSpinner size="lg" label="Memuat peserta..." />
          </div>
          <div
            v-else-if="dptRows.length === 0"
            class="text-sm text-text-alt text-center py-6 border border-dashed border-secondary rounded-xl"
          >
            Tidak ada peserta yang cocok dengan pencarian.
          </div>
          <template v-else>
            <!-- Desktop: tabel (redup saat pindah halaman, seperti Data Siswa) -->
            <div
              class="hidden md:block max-h-96 overflow-y-auto border border-secondary/40 rounded-lg transition-opacity duration-200"
              :class="isLoadingDpt ? 'opacity-60 pointer-events-none select-none' : 'opacity-100'"
            >
              <table class="w-full text-sm">
                <thead class="bg-secondary sticky top-0">
                  <tr class="text-left">
                    <th class="px-3 py-2 w-12 text-center">No</th>
                    <th class="px-3 py-2">Nama Peserta</th>
                    <th class="px-3 py-2">NIS</th>
                    <th class="px-3 py-2">NISN / Username</th>
                    <th class="px-3 py-2 text-center">Kelas</th>
                    <th class="px-3 py-2 text-center">Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(r, i) in dptRows"
                    :key="r.user_id ?? i"
                    class="border-t border-secondary/20 hover:bg-secondary/20 transition-colors"
                    :class="r.voted_at ? 'bg-success/5' : ''"
                  >
                    <td class="px-3 py-2.5 text-center text-text-alt">
                      {{ (dptPage - 1) * Number(dptPageSize) + i + 1 }}
                    </td>
                    <td class="px-3 py-2.5 font-medium text-text-neutral">{{ r.fullname }}</td>
                    <td class="px-3 py-2.5 font-mono text-xs text-text-neutral">
                      {{ r.nis ?? '-' }}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-xs text-text-alt">{{ r.username }}</td>
                    <td class="px-3 py-2.5 text-center text-text-neutral">{{ tingkatLabel(r) }}</td>
                    <td class="px-3 py-2.5 text-center">
                      <span
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        :class="
                          r.voted_at
                            ? 'bg-success/10 text-success'
                            : 'bg-secondary text-text-alt border border-secondary'
                        "
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          :class="r.voted_at ? 'bg-success' : 'bg-text-alt/50'"
                        />
                        {{ r.voted_at ? 'Sudah hadir' : 'Belum hadir' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Mobile: kartu (redup saat pindah halaman, seperti Data Siswa) -->
            <div
              class="md:hidden flex flex-col gap-2 max-h-96 overflow-y-auto transition-opacity duration-200"
              :class="isLoadingDpt ? 'opacity-60 pointer-events-none select-none' : 'opacity-100'"
            >
              <div
                v-for="(r, i) in dptRows"
                :key="r.user_id ?? i"
                class="rounded-xl border p-3 flex items-center gap-3"
                :class="
                  r.voted_at ? 'border-success/40 bg-success/5' : 'border-secondary/40 bg-neutral'
                "
              >
                <span
                  class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  :class="r.voted_at ? 'bg-success text-neutral' : 'bg-secondary text-text-alt'"
                >
                  {{ r.voted_at ? '✓' : (dptPage - 1) * Number(dptPageSize) + i + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-text-neutral text-sm truncate">{{ r.fullname }}</p>
                  <p class="text-xs text-text-alt font-mono truncate">
                    {{ r.nis ?? '-' }} • {{ r.username }} • {{ tingkatLabel(r) }}
                  </p>
                </div>
                <span
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  :class="r.voted_at ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
                >
                  {{ r.voted_at ? 'Hadir' : 'Belum' }}
                </span>
              </div>
            </div>
          </template>
          <div class="border-t border-secondary/20 pt-3">
            <Pagination
              :current-page="dptPage"
              :total-page="dptTotalPage"
              :page-size="dptPageSize"
              :total-data="dptTotal"
              :item-count="dptRows.length"
              :is-loading="isLoadingDpt"
              @update:current-page="
                (p: number) => {
                  dptPage = p
                  fetchDpt()
                }
              "
              @update:page-size="onDptPageSizeChange"
            />
          </div>
        </div>
      </div>

      <!-- TAB KANDIDAT -->
      <div v-if="activeTab === 'kandidat'" class="flex flex-col gap-4">
        <div class="rounded-xl border border-secondary/40 p-4 sm:p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <p class="font-bold text-text-neutral text-base sm:text-lg">Daftar Kandidat</p>
            <AdminButton
              size="sm"
              variant="secondary"
              label="Tambah Kandidat"
              :icon-left="RiAddLine"
              @click="openCandidateCreate()"
            />
          </div>
          <div
            v-if="candidates.length === 0"
            class="text-sm text-text-alt border border-dashed border-secondary rounded-xl p-6 text-center"
          >
            Belum ada kandidat. Tambahkan minimal 2 kandidat sebelum hari-H.
          </div>
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="(c, i) in sortedCandidates"
              :key="c.id"
              class="border border-secondary/40 rounded-xl p-4 flex gap-3 sm:gap-4 hover:border-primary/40 transition-colors"
            >
              <div class="flex flex-col items-center gap-1 shrink-0">
                <span class="text-xs font-bold text-text-alt">No. Urut</span>
                <span
                  class="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center text-base font-bold"
                >
                  {{ c.order }}
                </span>
              </div>
              <img
                v-if="candidateImgUrl(c.img_cover)"
                :src="candidateImgUrl(c.img_cover)!"
                :alt="c.title"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 bg-secondary/20"
              />
              <div
                v-else
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0 bg-secondary/40 flex items-center justify-center text-[10px] text-text-alt text-center px-1"
              >
                Belum ada foto
              </div>
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-bold text-text-neutral">{{ c.title }}</p>
                  <DashboardIconButton
                    variant="edit"
                    label="Edit"
                    class="w-7 h-7 shrink-0"
                    @click="openCandidateEdit(c)"
                  />
                </div>
                <p class="text-xs text-text-alt line-clamp-3">
                  {{ plainDescription(c.description) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB CHECK-IN TPS -->
      <div v-if="activeTab === 'checkin'" class="flex flex-col gap-4">
        <div class="rounded-xl border border-secondary/40 p-4 flex flex-col gap-3">
          <p class="font-bold text-text-neutral text-sm">Check-in Peserta</p>
          <div class="flex gap-2">
            <Input
              v-model="checkinIdentifier"
              type="text"
              variant="semi-rounded"
              placeholder="Masukkan NIS..."
              class="flex-1"
              @keyup.enter="handleCheckin"
            />
            <AdminButton
              size="sm"
              variant="primary"
              label="Check-in"
              :icon-left="RiQrCodeLine"
              :loading="isCheckingIn"
              @click="handleCheckin"
            />
          </div>
          <div
            v-if="checkinResult"
            class="rounded-xl border border-success/40 bg-success/10 p-4 text-center"
          >
            <p class="text-xs text-text-alt">
              {{ checkinResult.fullname }} ({{ checkinResult.username }})
            </p>
            <p class="text-4xl font-mono font-bold tracking-widest text-text-neutral my-2">
              {{ checkinResult.pass }}
            </p>
            <p class="text-xs text-text-alt">Berlaku 10 menit, sekali pakai.</p>
          </div>
        </div>
        <div
          class="rounded-xl border border-secondary/40 p-4 text-xs text-text-alt leading-relaxed"
        >
          Alur bilik: siswa ketik NIS + pass di <strong class="text-text-neutral">/bilik</strong> →
          kandidat muncul → pilih → otomatis kembali ke halaman login untuk siswa berikutnya. Buka
          <strong class="text-text-neutral">/bilik</strong> di tiap laptop bilik (mode tamu).
        </div>
      </div>

      <!-- TAB HASIL -->
      <div v-if="activeTab === 'hasil'" class="flex flex-col gap-4">
        <div v-if="isLoadingResult" class="flex justify-center py-8">
          <LoadingSpinner size="md" label="Memuat hasil..." />
        </div>
        <div
          v-else-if="resultError"
          class="rounded-xl border border-warning/40 bg-warning/5 p-4 text-center text-sm text-text-neutral"
        >
          {{ resultError }}
        </div>
        <div v-else-if="result" class="flex flex-col gap-3">
          <!-- Pie chart donat perolehan suara (murni SVG + Tailwind, tanpa lib) -->
          <div
            class="rounded-xl border border-secondary/40 p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          >
            <div class="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0">
              <svg viewBox="0 0 42 42" class="w-full h-full -rotate-90">
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  class="stroke-secondary"
                  stroke-width="6"
                />
                <circle
                  v-for="(c, i) in result.candidates"
                  :key="c.id"
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  :stroke="pieColorOf(i)"
                  stroke-width="6"
                  :stroke-dasharray="`${c.percent} ${100 - c.percent}`"
                  :stroke-dashoffset="
                    -result.candidates.slice(0, i).reduce((s, x) => s + x.percent, 0)
                  "
                  stroke-linecap="butt"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <p class="text-2xl sm:text-3xl font-bold text-text-neutral">
                  {{ result.valid_votes }}
                </p>
                <p class="text-[11px] sm:text-xs text-text-alt">Suara sah</p>
              </div>
            </div>
            <div class="flex flex-col gap-2 w-full min-w-0">
              <div
                v-for="(c, i) in result.candidates"
                :key="c.id"
                class="flex items-center gap-2 text-sm"
              >
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: pieColorOf(i) }"
                />
                <span class="font-semibold text-text-neutral truncate flex-1" :title="c.title">
                  {{ c.title }}
                </span>
                <span class="font-bold text-text-neutral shrink-0"
                  >{{ fmtPercent(c.percent) }}%</span
                >
                <span class="text-xs text-text-alt shrink-0">({{ c.votes }})</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="rounded-xl border border-secondary/40 p-3">
              <p class="text-2xl font-bold text-text-neutral">
                {{ fmtPercent(result.participation_rate) }}%
              </p>
              <p class="text-xs text-text-alt">Partisipasi</p>
            </div>
            <div class="rounded-xl border border-secondary/40 p-3">
              <p class="text-2xl font-bold text-text-neutral">
                {{ result.participation.voted }}/{{ result.participation.dpt_total }}
              </p>
              <p class="text-xs text-text-alt">Total Suara Masuk / Peserta Tetap</p>
            </div>
          </div>
          <div
            v-for="(c, i) in result.candidates"
            :key="c.id"
            class="rounded-xl border border-secondary/40 p-4 flex gap-3 sm:gap-4 border-l-4"
            :style="{ borderLeftColor: pieColorOf(i) }"
          >
            <!-- Nomor urut surat suara (tetap, bukan peringkat) -->
            <div class="flex flex-col items-center gap-1 shrink-0">
              <span class="text-xs font-bold text-text-alt">No. Urut</span>
              <span
                class="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center text-base font-bold"
              >
                {{ candidateOrderOf(c.id) }}
              </span>
            </div>
            <img
              v-if="candidateImgUrl(c.img_cover)"
              :src="candidateImgUrl(c.img_cover)!"
              :alt="c.title"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-secondary/20"
            />
            <div
              v-else
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0 bg-secondary/40 flex items-center justify-center text-[10px] text-text-alt text-center px-1"
            >
              Belum ada foto
            </div>
            <div class="flex flex-col gap-2 flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="font-bold text-text-neutral">
                  {{ c.title }}
                  <span class="ml-1 text-xs font-semibold text-text-alt"
                    >(Peringkat {{ i + 1 }})</span
                  >
                </p>
                <p class="text-sm font-bold text-primary shrink-0">{{ fmtPercent(c.percent) }}%</p>
              </div>
              <div class="h-2.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: c.percent + '%', backgroundColor: pieColorOf(i) }"
                />
              </div>
              <p class="text-xs text-text-alt">{{ c.votes }} suara</p>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <p class="text-sm text-text-alt py-8 text-center">Voting tidak ditemukan.</p>
      <AdminButton
        size="sm"
        variant="secondary"
        label="Kembali"
        @click="router.push({ name: 'dashboard-voting' })"
      />
    </template>

    <!-- Modal tutup voting -->
    <ConfirmModal
      :is-open="isCloseOpen"
      :is-loading="isClosing"
      title="Tutup Voting Sekarang?"
      message="Voting langsung dianggap selesai dan hasil akhir langsung bisa dilihat semua pihak. Pemilih yang belum memilih tidak bisa lagi mencoblos."
      confirm-text="Ya, Tutup"
      @confirm="confirmClose"
      @cancel="isCloseOpen = false"
    />
  </div>
</template>
