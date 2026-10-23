<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import AdminButton from '@/components/ui/AdminButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import Input from '@/components/ui/Input.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiDeleteBinLine } from '@remixicon/vue'

// Halaman bersih lulusan mandiri (pengganti modal): aman dari klik backdrop /
// tertutup tidak sengaja. Alur tetap 2 lapis konfirmasi: 1) pilih tahun +
// pratinjau jumlah (dry_run), 2) ketik ulang tahun lalu eksekusi hapus permanen.
const toastStore = useToastStore()

const purgeYear = ref('')
const purgeConfirmText = ref('')
const isPurgePreviewing = ref(false)
const isPurging = ref(false)
interface PurgeRow {
  id: number
  fullname: string
  username: string
  nis: string | null
  nisn: string | null
  tahun_lulus: number
}

const purgePreview = ref<{
  tahun_lulus: number
  candidates: number
  rows: PurgeRow[]
} | null>(null)
// Tabel kandidat pola VotingDetailView: search + paginasi client-side
// (rows sudah lengkap dari dry_run), nomor urut lanjut antar halaman.
const purgeSearch = ref('')
const purgePage = ref(1)
const purgePageSize = ref('20')
const purgeFilteredRows = computed(() => {
  const q = purgeSearch.value.trim().toLowerCase()
  const rows = purgePreview.value?.rows ?? []
  if (!q) return rows
  return rows.filter((r) =>
    [r.fullname, r.username, r.nis ?? '', r.nisn ?? ''].some((v) =>
      String(v).toLowerCase().includes(q),
    ),
  )
})
const purgeTotal = computed(() => purgeFilteredRows.value.length)
const purgeTotalPage = computed(() =>
  Math.max(1, Math.ceil(purgeTotal.value / Number(purgePageSize.value))),
)
const purgePagedRows = computed(() => {
  const size = Number(purgePageSize.value)
  const start = (purgePage.value - 1) * size
  return purgeFilteredRows.value.slice(start, start + size)
})
const purgeRowNo = (i: number) => (purgePage.value - 1) * Number(purgePageSize.value) + i + 1
const onPurgeSearch = () => {
  purgePage.value = 1
}
const onPurgePageSizeChange = (size: string) => {
  purgePageSize.value = size
  purgePage.value = 1
}
const purgeResult = ref<{ deleted: number; feedbacks_anonymized: number } | null>(null)
const purgeMaxYear = new Date().getFullYear() - 1

const isBusy = computed(() => isPurgePreviewing.value || isPurging.value)
// Tahap alur untuk indikator progres: 1 tahun, 2 pratinjau, 3 selesai
const currentStep = computed(() => {
  if (purgeResult.value) return 3
  if (purgePreview.value) return 2
  return 1
})

const validatePurgeYear = (): number | null => {
  const year = Number(purgeYear.value.trim())
  if (!Number.isInteger(year) || year < 2000 || year > purgeMaxYear) {
    toastStore.show(`Batas tahun lulus harus angka 2000-${purgeMaxYear}.`, 'error')
    return null
  }
  return year
}

const previewPurge = async () => {
  const year = validatePurgeYear()
  if (year === null) return
  isPurgePreviewing.value = true
  purgePreview.value = null
  purgeConfirmText.value = ''
  purgeResult.value = null
  purgeSearch.value = ''
  purgePage.value = 1
  try {
    const response = await api.post('/students/purge-graduates', {
      tahun_lulus: year,
      dry_run: true,
    })
    purgePreview.value = response.data?.data ?? null
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal memuat pratinjau.', 'error')
  } finally {
    isPurgePreviewing.value = false
  }
}

const confirmPurge = async () => {
  if (
    !purgePreview.value ||
    purgeConfirmText.value.trim() !== String(purgePreview.value.tahun_lulus)
  )
    return
  isPurging.value = true
  try {
    const response = await api.post('/students/purge-graduates', {
      tahun_lulus: purgePreview.value?.tahun_lulus,
      dry_run: false,
    })
    purgeResult.value = response.data?.data ?? null
    toastStore.show('Pembersihan selesai!', 'success')
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toastStore.show(err.response?.data?.message || 'Gagal menghapus data.', 'error')
  } finally {
    isPurging.value = false
  }
}

// Ulangi untuk tahun lain tanpa kembali ke tabel
const handleRetry = () => {
  purgePreview.value = null
  purgeConfirmText.value = ''
  purgeResult.value = null
}

// Peringatan bila user pergi saat pratinjau/eksekusi sedang berjalan.
// Catatan: eksekusi hapus per chunk (1 chunk = 1 transaksi), jadi pergi di
// tengah jalan bisa menyisakan sebagian data sudah terhapus.
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (isBusy.value) e.preventDefault()
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave(() => {
  if (!isBusy.value) return true
  return window.confirm('Proses pembersihan sedang berjalan. Yakin ingin meninggalkan halaman ini?')
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <BackButton to="/dashboard/data-siswa" :sticky="false" />

    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold text-text-neutral flex items-center gap-2 mb-4">
        <RiDeleteBinLine class="w-6 h-6 text-error" />
        Bersihkan Lulusan (Hapus Permanen)
      </h1>
      <p class="text-sm text-text-alt leading-relaxed mb-2">
        Menghapus <strong class="text-text-neutral">permanen</strong> akun siswa
        <strong class="text-text-neutral">nonaktif</strong> yang tahun lulusnya (dihitung dari NIS
        + masa studi) ≤ tahun yang dipilih. Akun aktif tidak tersentuh. Maksimal tahun
        {{ purgeMaxYear }} agar lulusan baru yang masih butuh akun tetap aman.
        <strong class="text-text-neutral">Backup database dahulu</strong> sebelum eksekusi — data
        yang terhapus <strong class="text-error">tidak bisa dikembalikan</strong>.
      </p>
    </div>

    <!-- Indikator tahap (geser horizontal di layar kecil agar tidak gepeng) -->
    <div
      class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold overflow-x-auto pb-4 -mx-1 px-1"
    >
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 1 ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-text-alt'"
      >
        1. Pilih Tahun
      </span>
      <span class="text-text-alt shrink-0">→</span>
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 2 ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-text-alt'"
      >
        2. Pratinjau
      </span>
      <span class="text-text-alt shrink-0">→</span>
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 3 ? 'bg-success/15 text-success' : 'bg-secondary/40 text-text-alt'"
      >
        3. Hapus
      </span>
    </div>

    <!-- Langkah 1 : pilih tahun + pratinjau -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-text-neutral">
        Batas Tahun Lulus <RequiredBadge />
      </label>
      <div class="flex gap-2">
        <Input
          v-model="purgeYear"
          type="number"
          variant="semi-rounded"
          min="2000"
          :max="String(purgeMaxYear)"
          placeholder="cth. 2023"
          class="flex-1"
        />
        <AdminButton
          size="sm"
          variant="secondary"
          label="Pratinjau"
          :loading="isPurgePreviewing"
          :disabled="isPurging"
          @click="previewPurge"
        />
      </div>
    </div>

    <!-- Langkah 2 : tabel pratinjau kandidat yang akan dihapus -->
    <!-- Pola VotingDetailView: search + tabel desktop/kartu mobile + Pagination -->
    <div
      v-if="purgePreview"
      class="rounded-xl border border-secondary/40 bg-secondary/20 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 text-sm"
    >
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <p class="font-bold text-text-neutral text-base sm:text-lg">Daftar Akun Dihapus</p>
        <span class="text-xs text-text-alt shrink-0">
          {{ purgePreview.candidates.toLocaleString('id-ID') }} akun lulusan ≤
          {{ purgePreview.tahun_lulus }}
        </span>
      </div>
      <p v-if="purgePreview.candidates === 0" class="text-text-alt">
        Tidak ada yang perlu dihapus.
      </p>
      <template v-else>
        <!-- Pencarian -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1">
            <Input
              v-model="purgeSearch"
              type="text"
              variant="semi-rounded"
              size="mobile"
              placeholder="Cari nama / NIS / NISN / username..."
              @input="onPurgeSearch"
            />
          </div>
        </div>

        <div
          v-if="purgePagedRows.length === 0"
          class="text-sm text-text-alt text-center py-6 border border-dashed border-secondary rounded-xl"
        >
          Tidak ada akun yang cocok dengan pencarian.
        </div>
        <template v-else>
          <!-- Desktop: tabel -->
          <div
            class="hidden md:block max-h-96 overflow-y-auto border border-secondary/40 rounded-lg bg-neutral"
          >
            <table class="w-full text-sm">
              <thead class="bg-secondary sticky top-0">
                <tr class="text-left">
                  <th class="px-3 py-2 w-12 text-center">No</th>
                  <th class="px-3 py-2">Nama Lengkap</th>
                  <th class="px-3 py-2">NIS / NISN</th>
                  <th class="px-3 py-2">Username</th>
                  <th class="px-3 py-2 text-center">Lulus</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in purgePagedRows"
                  :key="row.id"
                  class="border-t border-secondary/20 hover:bg-secondary/20 transition-colors"
                >
                  <td class="px-3 py-2.5 text-center text-text-alt">{{ purgeRowNo(i) }}</td>
                  <td class="px-3 py-2.5 font-medium text-text-neutral">{{ row.fullname }}</td>
                  <td class="px-3 py-2.5 font-mono text-xs text-text-alt">
                    {{ row.nis ?? '-' }} / {{ row.nisn ?? '-' }}
                  </td>
                  <td class="px-3 py-2.5 font-mono text-xs text-text-alt">
                    {{ row.username }}
                  </td>
                  <td class="px-3 py-2.5 text-center text-text-neutral">
                    {{ row.tahun_lulus }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile: kartu -->
          <div class="md:hidden flex flex-col gap-2 max-h-96 overflow-y-auto">
            <div
              v-for="(row, i) in purgePagedRows"
              :key="row.id"
              class="rounded-xl border border-secondary/40 bg-neutral p-3 flex items-center gap-3"
            >
              <span
                class="w-9 h-9 rounded-full bg-secondary text-text-alt flex items-center justify-center text-sm font-bold shrink-0"
              >
                {{ purgeRowNo(i) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-text-neutral text-sm truncate">
                  {{ row.fullname }}
                </p>
                <p class="text-xs text-text-alt font-mono truncate">
                  {{ row.nis ?? '-' }} / {{ row.nisn ?? '-' }} • {{ row.tahun_lulus }}
                </p>
              </div>
              <span
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-secondary text-text-alt font-mono max-w-24 truncate"
                :title="row.username"
              >
                {{ row.username }}
              </span>
            </div>
          </div>
        </template>
        <div class="border-t border-secondary/20 pt-3">
          <Pagination
            :current-page="purgePage"
            :total-page="purgeTotalPage"
            :page-size="purgePageSize"
            :total-data="purgeTotal"
            :item-count="purgePagedRows.length"
            :is-loading="false"
            @update:current-page="purgePage = $event"
            @update:page-size="onPurgePageSizeChange"
          />
        </div>
      </template>
    </div>

    <!-- Langkah 2 lanjutan : ketik ulang tahun sebagai konfirmasi -->
    <div v-if="purgePreview && purgePreview.candidates > 0" class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-text-neutral">
        Ketik ulang tahun
        <strong class="font-mono">{{ purgePreview.tahun_lulus }}</strong> untuk konfirmasi
        <RequiredBadge />
      </label>
      <div class="flex flex-col sm:flex-row gap-2">
        <Input
          v-model="purgeConfirmText"
          type="text"
          inputmode="numeric"
          variant="semi-rounded"
          :placeholder="`Ketik ${purgePreview.tahun_lulus} di sini`"
          class="flex-1"
        />
        <AdminButton
          v-if="!purgeResult"
          size="sm"
          variant="danger"
          label="Hapus Permanen"
          :icon-left="RiDeleteBinLine"
          :loading="isPurging"
          :disabled="purgeConfirmText.trim() !== String(purgePreview.tahun_lulus)"
          class="w-full sm:w-auto justify-center"
          @click="confirmPurge"
        />
      </div>
    </div>

    <!-- Langkah 3 : hasil eksekusi -->
    <div v-if="purgeResult" class="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
      <p class="font-semibold text-success mb-1">Pembersihan Selesai</p>
      <p class="text-text-neutral">
        {{ purgeResult.deleted.toLocaleString('id-ID') }} akun dihapus permanen.
        <span v-if="purgeResult.feedbacks_anonymized > 0" class="text-text-alt">
          ({{ purgeResult.feedbacks_anonymized }} kritik/saran menjadi anonim.)
        </span>
      </p>
      <AdminButton
        size="sm"
        variant="secondary"
        label="Bersihkan Tahun Lain"
        class="mt-3"
        @click="handleRetry"
      />
    </div>

    <!-- Overlay proses: kunci interaksi saat pratinjau/eksekusi berjalan -->
    <Teleport to="body">
      <Transition name="fade">
        <LoadingSpinner
          v-if="isBusy"
          overlay
          size="xl"
          :label="
            isPurging
              ? `Menghapus ${purgePreview?.candidates ?? 'data'} akun, mohon tunggu...`
              : 'Memuat pratinjau...'
          "
        />
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
