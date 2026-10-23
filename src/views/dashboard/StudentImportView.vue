<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import AdminButton from '@/components/ui/AdminButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Input from '@/components/ui/Input.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiUploadLine, RiDownloadLine, RiFileExcelLine } from '@remixicon/vue'

// Halaman import mandiri (pengganti modal): aman dari klik backdrop / tertutup
// tidak sengaja. Alur tetap 3 tahap: upload -> preview -> commit, per sheet.
const toastStore = useToastStore()

interface SheetOption {
  index: number
  name: string
}

interface PreviewRow {
  line: number
  sheet?: string
  fullname: string
  nis: string | null
  nisn: string
  masa_studi: number | null
  tahun_lulus: number | null
  mode?: string
  errors?: string[]
}

interface PreviewSummary {
  total: number
  valid: number
  invalid: number
  will_create: number
  will_update: number
}

interface Credential {
  fullname: string
  nis: string | null
  nisn: string
  username: string
  password: string
  masa_studi: number | null
  tahun_lulus: number | null
  status_code: string
}

const importFile = ref<File | null>(null)
const importPath = ref('')
const importSheets = ref<SheetOption[]>([])
const importActiveSheet = ref<string | null>(null)
// Sheet terpilih (jamak) + masa studi per sheet — cth sheet 1-4 = 4 thn,
// sheet 5-7 = 3 thn. Key = nama sheet.
const selectedSheets = ref<string[]>([])
const sheetMasaStudi = ref<Record<string, string>>({})
const bulkMasaStudi = ref('')
const isUploading = ref(false)
const isCommitting = ref(false)
// Pesan overlay per tahap agar user tahu proses apa yang sedang berjalan
const busyLabel = ref('')
// Progress commit per sheet (komit berurutan agar progress terlihat nyata)
const commitProgress = ref({ done: 0, total: 0, currentSheet: '' })
const commitProgressPercent = computed(() =>
  commitProgress.value.total > 0
    ? Math.round((commitProgress.value.done / commitProgress.value.total) * 100)
    : 0,
)
const previewSummary = ref<PreviewSummary | null>(null)
const previewValidCount = ref(0)
const previewInvalidRows = ref<PreviewRow[]>([])
const previewSheetSummaries = ref<{ sheet: string; masa_studi: number; summary: PreviewSummary }[]>(
  [],
)
const showInvalidRows = ref(false)
const commitResult = ref<{
  message: string
  created_count: number
  created_inactive_count: number
  updated_count: number
  credentials: Credential[]
} | null>(null)

const isBusy = computed(() => isUploading.value || isCommitting.value)
// Tahap alur untuk indikator progres: 1 file, 2 preview, 3 selesai
const currentStep = computed(() => {
  if (commitResult.value) return 3
  if (previewSummary.value) return 2
  return 1
})

// Centang/hapus sheet => preview/commit sebelumnya tidak berlaku lagi
const toggleSheet = (name: string) => {
  const i = selectedSheets.value.indexOf(name)
  if (i >= 0) {
    selectedSheets.value.splice(i, 1)
  } else {
    selectedSheets.value.push(name)
    if (!sheetMasaStudi.value[name]) sheetMasaStudi.value[name] = ''
  }
  previewSummary.value = null
  previewValidCount.value = 0
  previewInvalidRows.value = []
  showInvalidRows.value = false
  commitResult.value = null
}
const selectAllSheets = () => {
  selectedSheets.value = importSheets.value.map((s) => s.name)
  for (const n of selectedSheets.value) {
    if (!sheetMasaStudi.value[n]) sheetMasaStudi.value[n] = ''
  }
  previewSummary.value = null
  commitResult.value = null
}
const deselectAllSheets = () => {
  selectedSheets.value = []
  previewSummary.value = null
  commitResult.value = null
}
// Terapkan 1 masa studi ke semua sheet terpilih sekaligus
const applyBulkMasaStudi = () => {
  const v = bulkMasaStudi.value.trim()
  if (!v) {
    toastStore.show('Isi masa studi massal terlebih dahulu.', 'error')
    return
  }
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    toastStore.show('Masa studi harus angka 1-10 tahun.', 'error')
    return
  }
  for (const name of selectedSheets.value) {
    sheetMasaStudi.value[name] = v
  }
  previewSummary.value = null
  commitResult.value = null
}
const onSheetMasaStudiChange = () => {
  previewSummary.value = null
  previewValidCount.value = 0
  previewInvalidRows.value = []
  showInvalidRows.value = false
  commitResult.value = null
}

const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  importFile.value = files && files.length > 0 ? (files[0] as File) : null
  // file baru => upload ulang, daftar sheet + preview lama tidak valid lagi
  importPath.value = ''
  importSheets.value = []
  importActiveSheet.value = null
  selectedSheets.value = []
  sheetMasaStudi.value = {}
  bulkMasaStudi.value = ''
  previewSummary.value = null
  previewValidCount.value = 0
  previewInvalidRows.value = []
  showInvalidRows.value = false
  commitResult.value = null
}

const handleDownloadTemplate = async () => {
  try {
    const response = await api.get('/students/import-template', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_siswa.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toastStore.show('Gagal mengunduh template.', 'error')
  }
}

const handlePreview = async () => {
  if (!importFile.value && !importPath.value) {
    toastStore.show('Pilih file Excel terlebih dahulu.', 'error')
    return
  }

  isUploading.value = true
  busyLabel.value = 'Mengunggah file...'
  try {
    // Tahap 1: upload bila file baru dipilih (sekaligus ambil daftar sheet)
    // Timeout 3 menit: file besar (banyak sheet) butuh waktu baca di server.
    if (importFile.value && !importPath.value) {
      const form = new FormData()
      form.append('file', importFile.value)
      const uploadRes = await api.post('/students/import-upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      })
      importPath.value = uploadRes.data?.data?.path ?? ''
      if (!importPath.value) throw new Error('Upload gagal.')
      importSheets.value = uploadRes.data?.data?.sheets ?? []
      importActiveSheet.value = uploadRes.data?.data?.active_sheet ?? null
      // Default: centang semua sheet agar user tinggal atur masa studi
      selectAllSheets()
    }

    // Minimal 1 sheet terpilih, tiap sheet wajib punya masa studi 1-10.
    // Bila belum lengkap (baru upload, belum isi masa studi), jangan tembak
    // toast error — cukup kembalikan ke tahap 1 agar user isi dulu.
    if (selectedSheets.value.length === 0) {
      isUploading.value = false
      busyLabel.value = ''
      return
    }
    const sheetPayload: { sheet: string; masa_studi: number }[] = []
    for (const name of selectedSheets.value) {
      const raw = (sheetMasaStudi.value[name] ?? '').trim()
      const n = Number(raw)
      if (!raw || !Number.isInteger(n) || n < 1 || n > 10) {
        toastStore.show(
          `Masa studi sheet "${name}" belum diisi — mohon isi dengan jarak 1-10 (tahun).`,
          'info',
        )
        isUploading.value = false
        busyLabel.value = ''
        return
      }
      sheetPayload.push({ sheet: name, masa_studi: n })
    }

    // Tahap 2: preview SEMUA sheet terpilih sekaligus (tiap sheet boleh
    // beda masa studi). Timeout 5 menit: file besar butuh waktu baca + validasi.
    busyLabel.value = `Membaca ${sheetPayload.length} sheet & validasi data...`
    const previewRes = await api.post(
      '/students/import-preview',
      { path: importPath.value, sheets: sheetPayload },
      { timeout: 300000 },
    )
    const data = previewRes.data?.data
    previewSummary.value = data?.summary ?? null
    previewValidCount.value = data?.summary?.valid ?? 0
    previewInvalidRows.value = data?.invalid_rows ?? []
    previewSheetSummaries.value = data?.sheets ?? []
    showInvalidRows.value = false
    if (data?.sheet) importActiveSheet.value = data.sheet
  } catch (error) {
    const err = error as {
      response?: { data?: { message?: string } }
      message?: string
      code?: string
    }
    const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')
    toastStore.show(
      isTimeout
        ? 'Server terlalu lama memproses file. File besar: pecah per sheet/kelas atau hubungi admin.'
        : err.response?.data?.message || err.message || 'Gagal memproses file.',
      'error',
    )
  } finally {
    isUploading.value = false
    busyLabel.value = ''
  }
}

const handleCommit = async () => {
  if (!importPath.value || previewValidCount.value === 0) return

  // Commit per sheet berurutan (bukan sekaligus) agar progress bar bergerak
  // nyata: tiap sheet = 1 request. keep_file=true kecuali sheet terakhir
  // agar file tmp tetap ada untuk sheet berikutnya.
  const names = [...selectedSheets.value]
  commitProgress.value = { done: 0, total: names.length, currentSheet: '' }

  isCommitting.value = true
  const agg = {
    created: 0,
    createdInactive: 0,
    updated: 0,
    invalid: 0,
    totalValid: 0,
    credentials: [] as Credential[],
    invalidRows: [] as PreviewRow[],
    sheetSummaries: [] as { sheet: string; masa_studi: number; summary: PreviewSummary }[],
  }
  try {
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!
      const last = i === names.length - 1
      commitProgress.value.currentSheet = name
      busyLabel.value = `Menyimpan sheet "${name}" (${i + 1}/${names.length})...`
      // Timeout 5 menit per sheet: 1 sheet = puluhan baris bcrypt.
      const response = await api.post(
        '/students/import-commit',
        {
          path: importPath.value,
          sheets: [{ sheet: name, masa_studi: Number(sheetMasaStudi.value[name]) }],
          keep_file: !last,
        },
        { timeout: 300000 },
      )
      const data = response.data?.data ?? {}
      agg.created += data.created_count ?? 0
      agg.createdInactive += data.created_inactive_count ?? 0
      agg.updated += data.updated_count ?? 0
      agg.totalValid += data.summary?.valid ?? 0
      agg.invalid += (data.invalid_rows ?? []).length
      agg.credentials.push(...(data.credentials ?? []))
      agg.invalidRows.push(...(data.invalid_rows ?? []))
      if (data.sheets?.[0]) agg.sheetSummaries.push(data.sheets[0])
      commitProgress.value.done = i + 1
    }
    const data = {
      message: `Import selesai: ${agg.totalValid} valid, ${agg.invalid} ditolak. ${agg.created} dibuat (${agg.createdInactive} langsung nonaktif karena sudah lulus), ${agg.updated} diperbarui.`,
      created_count: agg.created,
      created_inactive_count: agg.createdInactive,
      updated_count: agg.updated,
      credentials: agg.credentials,
    }
    previewInvalidRows.value = agg.invalidRows
    previewSheetSummaries.value = agg.sheetSummaries
    commitResult.value = {
      message: data.message,
      created_count: data.created_count,
      created_inactive_count: data.created_inactive_count,
      updated_count: data.updated_count,
      credentials: data.credentials,
    }
    toastStore.show('Import siswa selesai!', 'success')
    // Sheet terakhir dikirim tanpa keep_file => backend sudah menghapus file
    // tmp. Kosongkan path agar import berikutnya mulai dari upload baru.
    importPath.value = ''
  } catch (error) {
    const err = error as {
      response?: { data?: { message?: string } }
      message?: string
      code?: string
    }
    const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')
    toastStore.show(
      isTimeout
        ? 'Server terlalu lama menyimpan data. Cek tabel siswa — sebagian mungkin sudah tersimpan — lalu ulangi untuk sisanya.'
        : err.response?.data?.message || 'Gagal menyimpan hasil import.',
      'error',
    )
  } finally {
    isCommitting.value = false
    busyLabel.value = ''
    commitProgress.value = { done: 0, total: 0, currentSheet: '' }
  }
}

// File baru untuk import berikutnya tanpa kembali ke tabel
const handleNewFile = () => {
  importFile.value = null
  importPath.value = ''
  importSheets.value = []
  importActiveSheet.value = null
  selectedSheets.value = []
  sheetMasaStudi.value = {}
  bulkMasaStudi.value = ''
  previewSummary.value = null
  previewValidCount.value = 0
  previewInvalidRows.value = []
  previewSheetSummaries.value = []
  showInvalidRows.value = false
  commitResult.value = null
}

// Peringatan bila user pergi saat upload/preview/commit sedang berjalan
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
  return window.confirm('Proses import sedang berjalan. Yakin ingin meninggalkan halaman ini?')
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
    <BackButton to="/dashboard/data-siswa" :sticky="false" />

    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold text-text-neutral flex items-center gap-2">
        <RiFileExcelLine class="w-6 h-6 text-primary" />
        Import Data Siswa (Excel)
      </h1>
      <p class="text-sm text-text-alt leading-relaxed">
        Kolom file <code class="font-mono text-xs">fullname | nis | nisn</code> — ketiganya wajib, 1
        file untuk 1 angkatan, tiap sheet = 1 Kelas atau Jurusan. Centang sheet yang diproses
        sekaligus, lalu isi <strong class="text-text-neutral">masa studi per sheet</strong> (boleh
        beda — cth sheet 1-4 = 4 tahun, sheet 5-7 = 3 tahun). Username otomatis = NISN, tahun lulus
        dihitung otomatis, password siswa baru otomatis = NISN.
      </p>
    </div>

    <!-- Indikator tahap (geser horizontal di layar kecil agar tidak gepeng) -->
    <div
      class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold overflow-x-auto pb-1 -mx-1 px-1"
    >
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 1 ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-text-alt'"
      >
        1. Pilih File
      </span>
      <span class="text-text-alt shrink-0">→</span>
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 2 ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-text-alt'"
      >
        2. Cek / Preview
      </span>
      <span class="text-text-alt shrink-0">→</span>
      <span
        class="px-3 py-1 rounded-full shrink-0 whitespace-nowrap"
        :class="currentStep >= 3 ? 'bg-success/15 text-success' : 'bg-secondary/40 text-text-alt'"
      >
        3. Simpan
      </span>
    </div>

    <!-- Langkah 1 : file -->
    <div class="flex flex-col sm:flex-row gap-2">
      <label
        class="flex-1 flex items-center gap-2 border border-dashed border-text-alt/40 rounded-xl px-3.5 py-2 text-sm cursor-pointer hover:border-primary transition-colors"
      >
        <RiUploadLine class="w-4 h-4 text-text-alt shrink-0" />
        <span
          class="truncate"
          :class="importFile ? 'text-text-neutral font-medium' : 'text-text-alt'"
        >
          {{ importFile ? importFile.name : 'Unggah file xlsx / xls / csv (maks 10MB)...' }}
        </span>
        <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileChange" />
      </label>
      <AdminButton
        size="sm"
        variant="secondary"
        label="Unduh Template"
        :icon-left="RiDownloadLine"
        class="w-full sm:w-auto justify-center"
        @click="handleDownloadTemplate"
      />
    </div>

    <!-- Langkah 1 lanjutan : centang sheet jamak + masa studi per sheet -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <label class="text-sm font-medium text-text-neutral">
          Sheet / Jurusan <span class="text-text-alt">({{ selectedSheets.length }} dipilih)</span>
        </label>
        <div v-if="importSheets.length > 0" class="flex gap-2 shrink-0">
          <button
            type="button"
            class="text-xs text-primary font-semibold hover:underline cursor-pointer"
            @click="selectAllSheets"
          >
            Pilih semua
          </button>
          <span class="text-text-alt text-xs">•</span>
          <button
            type="button"
            class="text-xs text-text-alt font-semibold hover:underline cursor-pointer"
            @click="deselectAllSheets"
          >
            Hapus semua
          </button>
        </div>
      </div>
      <p v-if="importSheets.length === 0" class="text-xs text-text-alt">
        Mohon upload file dahulu — daftar sheet muncul di sini.
      </p>
      <div
        v-if="importSheets.length > 0"
        class="rounded-xl border border-secondary/40 divide-y divide-secondary/20 max-h-72 overflow-y-auto"
      >
        <div
          v-for="s in importSheets"
          :key="s.name"
          class="flex items-center gap-2 sm:gap-3 px-3 py-2 hover:bg-secondary/20 transition-colors border-y-text-alt/30"
        >
          <Checkbox
            :model-value="selectedSheets.includes(s.name)"
            :label="s.name"
            @update:model-value="toggleSheet(s.name)"
          />
          <div v-if="selectedSheets.includes(s.name)" class="ml-auto w-28 sm:w-36 shrink-0">
            <Input
              :model-value="sheetMasaStudi[s.name] ?? ''"
              type="number"
              min="1"
              max="10"
              variant="semi-rounded"
              size="mobile"
              placeholder="Studi (thn)"
              @update:model-value="
                (v: string) => {
                  sheetMasaStudi[s.name] = v
                  onSheetMasaStudiChange()
                }
              "
            />
          </div>
        </div>
      </div>
      <!-- Isi massal: satu nilai untuk semua sheet terpilih -->
      <div v-if="selectedSheets.length > 0" class="flex gap-2">
        <Input
          v-model="bulkMasaStudi"
          type="number"
          min="1"
          max="10"
          variant="semi-rounded"
          size="mobile"
          placeholder="cth. 3 — terapkan ke semua sheet terpilih"
          class="flex-1"
        />
        <AdminButton
          size="sm"
          variant="secondary"
          label="Terapkan ke Semua"
          class="shrink-0"
          @click="applyBulkMasaStudi"
        />
      </div>
    </div>

    <!-- Langkah 2 & 3 : aksi -->
    <div class="flex items-center gap-2 flex-wrap">
      <AdminButton
        size="sm"
        variant="secondary"
        label="Cek / Preview"
        :disabled="isUploading || (!importFile && !importPath)"
        class="w-full sm:w-auto justify-center"
        @click="handlePreview"
      />
      <AdminButton
        v-if="previewSummary && !commitResult"
        size="sm"
        variant="primary"
        :label="`Simpan ${previewValidCount} Data Valid`"
        :disabled="isCommitting || previewValidCount === 0"
        :icon-left="RiUploadLine"
        class="w-full sm:w-auto justify-center"
        @click="handleCommit"
      />
      <AdminButton
        v-if="commitResult"
        size="sm"
        variant="secondary"
        label="Import File Lain"
        class="w-full sm:w-auto justify-center"
        @click="handleNewFile"
      />
      <LoadingSpinner v-if="isUploading" size="sm" />
      <div
        v-if="isCommitting && commitProgress.total > 1"
        class="flex items-center gap-2 flex-1 min-w-40"
      >
        <div class="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: commitProgressPercent + '%' }"
          />
        </div>
        <span class="text-xs font-semibold text-text-neutral whitespace-nowrap">
          {{ commitProgress.done }}/{{ commitProgress.total }} sheet
        </span>
      </div>
    </div>

    <!-- Hasil preview -->
    <div v-if="previewSummary" class="rounded-xl border border-secondary/40 p-4 text-sm">
      <p class="font-semibold text-text-neutral mb-1">
        Hasil Preview — {{ selectedSheets.length }} sheet
      </p>
      <p class="text-text-alt">
        Total: <strong class="text-text-neutral">{{ previewSummary.total }}</strong> • Valid:
        <strong class="text-success">{{ previewSummary.valid }}</strong> (baru:
        {{ previewSummary.will_create }}, update: {{ previewSummary.will_update }}) • Ditolak:
        <strong class="text-error">{{ previewSummary.invalid }}</strong>
      </p>
      <!-- Rincian per sheet -->
      <ul v-if="previewSheetSummaries.length > 1" class="mt-2 flex flex-col gap-1">
        <li v-for="ps in previewSheetSummaries" :key="ps.sheet" class="text-xs text-text-alt">
          • <strong class="text-text-neutral">{{ ps.sheet }}</strong> ({{ ps.masa_studi }} thn):
          {{ ps.summary.valid }} valid, {{ ps.summary.invalid }} ditolak
        </li>
      </ul>
      <button
        v-if="previewInvalidRows.length > 0"
        type="button"
        class="text-primary text-xs font-semibold mt-2 hover:underline cursor-pointer"
        @click="showInvalidRows = !showInvalidRows"
      >
        {{ showInvalidRows ? 'Sembunyikan' : `Lihat ${previewInvalidRows.length} baris ditolak` }}
      </button>
      <ul v-if="showInvalidRows" class="mt-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        <li
          v-for="row in previewInvalidRows"
          :key="`${row.sheet ?? ''}-${row.line}`"
          class="text-xs bg-error/5 border border-error/20 rounded-lg px-2.5 py-1.5"
        >
          <span class="font-semibold">{{ row.sheet ?? '' }} — Baris {{ row.line }}</span>
          ({{ row.fullname || '-' }} / {{ row.nis || '-' }} / {{ row.nisn || '-' }}):
          {{ (row.errors || []).join('; ') }}
        </li>
      </ul>
    </div>

    <!-- Hasil commit -->
    <div v-if="commitResult" class="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
      <p class="font-semibold text-success mb-1">Import Selesai</p>
      <p class="text-text-neutral">{{ commitResult.message }}</p>
      <p class="text-text-alt mt-1">
        Dibuat: {{ commitResult.created_count }} ({{ commitResult.created_inactive_count }} langsung
        nonaktif) • Diperbarui: {{ commitResult.updated_count }}
      </p>
      <div v-if="commitResult.credentials.length > 0" class="mt-3">
        <p class="font-semibold text-text-neutral text-xs mb-1.5">Data siswa yang ditambahkan:</p>
        <!-- Desktop: tabel -->
        <div class="hidden md:block max-h-64 overflow-auto border border-secondary/40 rounded-lg">
          <table class="w-full text-xs">
            <thead class="top-0">
              <tr class="text-left">
                <th class="px-2.5 py-1.5">Nama</th>
                <th class="px-2.5 py-1.5">NIS</th>
                <th class="px-2.5 py-1.5">NISN / Username</th>
                <th class="px-2.5 py-1.5">Password</th>
                <th class="px-2.5 py-1.5">Studi</th>
                <th class="px-2.5 py-1.5">Lulus</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in commitResult.credentials"
                :key="c.nisn"
                class="border-t border-secondary/20"
              >
                <td class="px-2.5 py-1.5">{{ c.fullname }}</td>
                <td class="px-2.5 py-1.5 font-mono">{{ c.nis || '-' }}</td>
                <td class="px-2.5 py-1.5 font-mono">{{ c.nisn }}</td>
                <td class="px-2.5 py-1.5 font-mono font-bold">{{ c.password }}</td>
                <td class="px-2.5 py-1.5">{{ c.masa_studi }} th</td>
                <td class="px-2.5 py-1.5">{{ c.tahun_lulus }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile: kartu ringkas (nama + NISN + password) -->
        <div class="md:hidden flex flex-col gap-2 max-h-64 overflow-y-auto">
          <div
            v-for="c in commitResult.credentials"
            :key="c.nisn"
            class="rounded-xl border border-secondary/40 bg-neutral p-2.5 flex items-center gap-2.5"
          >
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-text-neutral text-xs truncate">{{ c.fullname }}</p>
              <p class="text-[11px] text-text-alt font-mono truncate">
                {{ c.nisn }} • {{ c.masa_studi }} th • Lulus {{ c.tahun_lulus }}
              </p>
            </div>
            <span
              class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 bg-success/10 text-success"
            >
              {{ c.password }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay proses: kunci seluruh interaksi + info jelas saat upload/preview/commit -->
    <!-- Commit menampilkan progress bar per sheet (nyata, bukan animasi). -->
    <!-- Teleport ke body agar tidak terpotong stacking context konten dashboard -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isBusy"
          class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
          <div
            class="flex flex-col items-center gap-3 p-6 bg-neutral rounded-2xl shadow-xl w-full max-w-xs text-center"
          >
            <template v-if="isCommitting && commitProgress.total > 1">
              <p class="text-3xl font-bold text-primary">{{ commitProgressPercent }}%</p>
              <div class="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-300"
                  :style="{ width: commitProgressPercent + '%' }"
                />
              </div>
              <p class="text-sm font-medium text-text-neutral">
                Sheet {{ commitProgress.done }}/{{ commitProgress.total }}
                <span
                  v-if="commitProgress.currentSheet"
                  class="block text-xs text-text-alt mt-0.5 truncate max-w-full"
                >
                  {{ commitProgress.currentSheet }}
                </span>
              </p>
              <p class="text-xs text-text-alt animate-pulse">{{ busyLabel }}</p>
            </template>
            <LoadingSpinner v-else size="xl" :label="busyLabel" />
          </div>
        </div>
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
