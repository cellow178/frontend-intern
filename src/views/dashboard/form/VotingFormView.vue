<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import AdminButton from '@/components/ui/AdminButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import BackButton from '@/components/ui/BackButton.vue'
import Input from '@/components/ui/Input.vue'
import Radio from '@/components/ui/Radio.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Switch from '@/components/ui/Switch.vue'
import { RiSaveLine, RiChatPollLine } from '@remixicon/vue'

const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()

// Mode edit (route dashboard-voting-edit) vs create — pola UserFormView.
const votingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => votingId.value !== null)
const isSubmitting = ref(false)
const isLoading = ref(false)
// DPT terkunci => blok peserta read-only (backend menolak 422 bila dikirim).
const isDptFrozen = ref(false)

// --- Form state ---
const form = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  mode: 'tps',
  include_siswa: true,
  include_teachers: false,
  tahun_masuk_text: '',
  include_tingkat_13: true,
})

const errors = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  voters: '',
})

const showDptHint = computed(() => form.include_siswa)

// --- Deteksi perubahan (peringatan keluar halaman) ---
const isFormDirty = ref(false)
const initialSnapshot = ref<string>('')
const pendingTarget = ref<string | null>(null)
const isLeaveModalOpen = ref(false)

const takeSnapshot = () => {
  initialSnapshot.value = JSON.stringify(form)
  isFormDirty.value = false
}

watch(
  form,
  () => {
    if (initialSnapshot.value) {
      isFormDirty.value = JSON.stringify(form) !== initialSnapshot.value
    }
  },
  { deep: true },
)

watch(
  () => form.start_date,
  (start) => {
    if (start && (!form.end_date || form.end_date < start)) {
      form.end_date = start
    }
    if (errors.start_date) errors.start_date = ''
  },
)

// --- Validasi ---
const validate = (): boolean => {
  let ok = true
  errors.title = ''
  errors.description = ''
  errors.start_date = ''
  errors.end_date = ''
  errors.voters = ''

  if (!form.title.trim()) {
    errors.title = 'Judul voting wajib diisi.'
    ok = false
  } else if (form.title.trim().length < 10) {
    errors.title = 'Judul voting minimal 10 karakter.'
    ok = false
  }

  if (!form.description.trim()) {
    errors.description = 'Deskripsi voting wajib diisi.'
    ok = false
  }

  if (!form.start_date) {
    errors.start_date = 'Tanggal mulai wajib diisi.'
    ok = false
  }

  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    errors.end_date = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
    ok = false
  } else if (form.start_date && !form.end_date) {
    errors.end_date = ''
  }

  if (!form.include_siswa && !form.include_teachers) {
    errors.voters = 'Pilih minimal siswa atau guru sebagai pemilih.'
    ok = false
  }

  if (!ok) {
    toastStore.show('Beberapa field wajib masih kosong atau tidak valid.', 'error')
    nextTick(() => {
      document.querySelector('.border-error, .text-error')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }
  return ok
}

// "YYYY-MM-DDTHH:mm" (datetime-local) -> "YYYY-MM-DD HH:mm:00" (backend).
// Toleran: bila user mengetik manual pakai spasi, tetap diterima.
const toBackendDate = (s: string) => {
  const t = s.trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t)) return `${t}:00`
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t)) return t
  return s
}

// "YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DD HH:mm" (backend) -> "YYYY-MM-DDTHH:mm"
// (datetime-local). Kosong/null => ''.
const fromBackendDate = (s: string | null | undefined): string => {
  if (!s) return ''
  const t = String(s).trim().replace(' ', 'T').slice(0, 16)
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t) ? t : ''
}

// GET /votings/{id} untuk isi form edit + status kunci DPT.
const fetchVotingDetail = async () => {
  if (!isEditMode.value) return
  isLoading.value = true
  try {
    const response = await api.get(`/votings/${votingId.value}`)
    const d = response.data?.data
    if (!d) throw new Error('Voting tidak ditemukan.')
    form.title = d.title ?? ''
    form.description = d.description ?? ''
    form.start_date = fromBackendDate(d.start_date)
    form.end_date = fromBackendDate(d.end_date)
    form.mode = d.mode ?? 'tps'
    form.include_siswa = d.include_siswa ?? true
    form.include_teachers = d.include_teachers ?? false
    form.tahun_masuk_text = Array.isArray(d.tahun_masuk_list) ? d.tahun_masuk_list.join(', ') : ''
    form.include_tingkat_13 = d.include_tingkat_13 ?? true
    isDptFrozen.value = !!d.dpt_frozen_at
    takeSnapshot()
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toastStore.show(apiErr.response?.data?.message || 'Gagal memuat data voting.', 'error')
    router.push({ name: 'dashboard-voting' })
  } finally {
    isLoading.value = false
  }
}

const buildPayload = () => {
  // Tanpa filter masa studi: seluruh siswa aktif ikut memilih.
  // masa_studi_list dikirim null agar DptBuilder tidak memfilter.
  const tahunMasuk = form.tahun_masuk_text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 2000 && n <= 2100)
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    start_date: toBackendDate(form.start_date),
    end_date: form.end_date ? toBackendDate(form.end_date) : toBackendDate(form.start_date),
    mode: form.mode,
    include_siswa: form.include_siswa,
    include_teachers: form.include_teachers,
    masa_studi_list: null,
    tahun_masuk_list: tahunMasuk,
    include_tingkat_13: form.include_tingkat_13,
  }
}

const handleSubmit = async () => {
  if (!validate()) return
  isSubmitting.value = true
  try {
    // Field peserta (mode/DPT) hanya dikirim bila DPT belum dikunci —
    // backend menolak 422 bila ikut dikirim setelah freeze.
    const payload = buildPayload() as Record<string, unknown>
    let response
    if (isEditMode.value) {
      if (isDptFrozen.value) {
        for (const k of [
          'mode',
          'include_siswa',
          'include_teachers',
          'masa_studi_list',
          'tahun_masuk_list',
          'include_tingkat_13',
        ]) {
          delete payload[k]
        }
      }
      response = await api.put('/votings/update', { id: votingId.value, ...payload })
      toastStore.show(response.data?.message || 'Voting berhasil diperbarui.', 'success')
    } else {
      response = await api.post('/votings/create', payload)
      toastStore.show(
        'Voting dibuat! Kunci daftar pemilih di halaman detail sebelum hari-H.',
        'success',
      )
    }
    isFormDirty.value = false
    const id = response.data?.data?.id ?? votingId.value
    if (id) {
      router.push({ name: 'dashboard-voting-detail', params: { id } })
    } else {
      router.push({ name: 'dashboard-voting' })
    }
  } catch (err: unknown) {
    const apiErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = apiErr.response?.data?.errors
    if (fieldErrors) {
      if (fieldErrors.title?.[0]) errors.title = fieldErrors.title[0]
      if (fieldErrors.description?.[0]) errors.description = fieldErrors.description[0]
      if (fieldErrors.start_date?.[0]) errors.start_date = fieldErrors.start_date[0]
      if (fieldErrors.end_date?.[0]) errors.end_date = fieldErrors.end_date[0]
    }
    toastStore.show(
      apiErr.response?.data?.message ||
        (isEditMode.value ? 'Gagal memperbarui voting.' : 'Gagal membuat voting.'),
      'error',
    )
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && votingId.value) {
    router.push({ name: 'dashboard-voting-detail', params: { id: votingId.value } })
  } else {
    router.push({ name: 'dashboard-voting' })
  }
}

const confirmLeave = () => {
  isFormDirty.value = false
  isLeaveModalOpen.value = false
  router.push(pendingTarget.value ?? { name: 'dashboard-voting' })
}

const cancelLeave = () => {
  isLeaveModalOpen.value = false
  pendingTarget.value = null
}

onBeforeRouteLeave((to) => {
  if (isFormDirty.value) {
    pendingTarget.value = to.fullPath
    isLeaveModalOpen.value = true
    return false
  }
  return true
})

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isFormDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(async () => {
  takeSnapshot()
  window.addEventListener('beforeunload', handleBeforeUnload)
  if (isEditMode.value) await fetchVotingDetail()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isLoading" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div>
        <BackButton :to="isEditMode && votingId ? `/dashboard/voting/${votingId}` : '/dashboard/voting'" :sticky="false" />
      </div>

      <div class="text-text-alt py-16 text-center">
        <LoadingSpinner size="lg" label="Memuat data voting..." />
      </div>
    </div>
    <form
      v-else
    @submit.prevent="handleSubmit"
    class="bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 max-w-4xl flex flex-col gap-4 sm:gap-5"
  >
    <div>
      <BackButton :to="isEditMode && votingId ? `/dashboard/voting/${votingId}` : '/dashboard/voting'" :sticky="false" />
    </div>

    <!-- Header -->
    <div class="border-b border-text-alt/50 pb-4">
      <h1 class="text-lg sm:text-xl font-bold text-text-neutral flex items-center gap-2">
        <RiChatPollLine class="w-5 h-5 text-primary shrink-0" />
        {{ isEditMode ? 'Edit Ruang Voting' : 'Buat Ruang Voting' }}
      </h1>
      <p class="text-xs sm:text-sm text-text-alt mt-1">
        <template v-if="isEditMode">
          Judul, deskripsi & jadwal selalu bisa diubah.
          <template v-if="isDptFrozen">
            Daftar pemilih sudah dikunci dan tidak bisa diubah lagi.
          </template>
          <template v-else> Daftar pemilih masih bisa diubah sebelum dikunci. </template>
        </template>
        <template v-else>
          Setelah dibuat, kunci daftar pemilih di halaman detail sebelum hari-H.
        </template>
      </p>
    </div>

    <!-- Judul -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between mb-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral">
          <span>Judul Voting</span>
          <RequiredBadge />
        </label>
        <span
          class="text-xs transition-colors"
          :class="form.title.length >= 255 ? 'text-error font-semibold' : 'text-text-alt'"
        >
          {{ form.title.length }}/255
        </span>
      </div>
      <Input
        v-model="form.title"
        variant="semi-rounded"
        maxlength="255"
        type="text"
        placeholder="Masukkan judul voting (min. 10 karakter)..."
        :error="!!errors.title"
        @input="errors.title = ''"
      />
      <p v-if="errors.title" class="text-sm text-error mt-1">{{ errors.title }}</p>
    </div>

    <!-- Deskripsi -->
    <div class="flex flex-col gap-1.5">
      <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
        <span>Deskripsi Voting</span>
        <RequiredBadge />
      </label>
      <Input
        v-model="form.description"
        variant="semi-rounded"
        type="textarea"
        :rows="3"
        placeholder="Masukkan deskripsi voting..."
        :error="!!errors.description"
        @input="errors.description = ''"
      />
      <p v-if="errors.description" class="text-sm text-error mt-1">{{ errors.description }}</p>
    </div>

    <!-- Periode (tetap 2 kolom berdampingan di HP: mulai & selesai sejajar) -->
    <div class="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-xl">
      <div class="flex flex-col gap-1">
        <label class="flex items-center text-xs sm:text-sm font-medium text-text-neutral mb-0.5">
          <span>Tanggal Mulai</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="form.start_date"
          variant="semi-rounded"
          size="normal"
          type="datetime-local"
          :error="!!errors.start_date"
          @input="errors.start_date = ''"
        />
        <p v-if="errors.start_date" class="text-xs text-error mt-0.5">{{ errors.start_date }}</p>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs sm:text-sm font-medium text-text-neutral mb-0.5">
          Tanggal Selesai
          <RequiredBadge />
        </label>
        <Input
          v-model="form.end_date"
          variant="semi-rounded"
          size="normal"
          type="datetime-local"
          :min="form.start_date"
          :error="!!errors.end_date"
          @input="errors.end_date = ''"
        />
        <p v-if="errors.end_date" class="text-xs text-error mt-0.5">{{ errors.end_date }}</p>
      </div>
    </div>

    <!-- Mode (terkunci setelah DPT dikunci) -->
    <div class="flex flex-col gap-2" :class="isDptFrozen ? 'opacity-60' : ''">
      <label class="text-sm font-medium text-text-neutral sm:text-base">
        Mode <RequiredBadge />
        <span v-if="isDptFrozen" class="ml-1 text-xs font-semibold text-warning"> (terkunci) </span>
      </label>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Radio
          v-model="form.mode"
          value="tps"
          size="normal"
          label="TPS — di tempat"
          :disabled="isDptFrozen"
        />
        <Radio
          v-model="form.mode"
          value="remote"
          size="normal"
          label="Jarak Jauh"
          :disabled="isDptFrozen"
        />
      </div>
    </div>

    <!-- Cakupan pemilih (terkunci setelah DPT dikunci) -->
    <fieldset :disabled="isDptFrozen" class="contents">
      <div
        class="rounded-xl border border-secondary/40 p-4 sm:p-0 sm:border-0 flex flex-col gap-3"
        :class="isDptFrozen ? 'opacity-60' : ''"
      >
        <p class="text-sm sm:text-base font-bold text-text-neutral">
          Peserta Voting
          <span v-if="isDptFrozen" class="ml-1 text-xs font-semibold text-warning">
            (terkunci — daftar sudah dikunci)
          </span>
        </p>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-text-neutral">Sertakan siswa aktif</span>
          <Switch v-model="form.include_siswa" />
        </div>
        <div v-if="showDptHint" class="flex flex-col gap-2 sm:pl-1">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-text-alt">
              Batasi atau khususkan angkatan dari tahun masuk (opsional)
            </label>
            <Input
              v-model="form.tahun_masuk_text"
              type="text"
              variant="semi-rounded"
              placeholder="cth: 2024, 2025, 2026"
            />
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-text-neutral">Kelas 13 ikut memilih</span>
            <Switch v-model="form.include_tingkat_13" />
          </div>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-text-neutral">Sertakan guru aktif</span>
          <Switch v-model="form.include_teachers" />
        </div>
        <p v-if="errors.voters" class="text-sm text-error">{{ errors.voters }}</p>
        <p class="text-xs text-text-alt leading-relaxed">
          <template v-if="isEditMode && isDptFrozen">
            Daftar pemilih sudah dikunci — mode & cakupan peserta tidak bisa diubah lagi.
          </template>
          <template v-else>
            Setelah dibuat, kunci daftar pemilih di halaman detail sebelum hari-H. Mode & daftar
            pemilih tidak bisa diubah setelah dikunci.
          </template>
        </p>
      </div>
    </fieldset>

    <!-- Actions (tumpuk penuh di HP agar gampang dijempol, sejajar di desktop) -->
    <div class="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3 sm:mt-4">
      <AdminButton
        type="button"
        size="md"
        variant="secondary"
        label="Batal"
        class="w-full sm:w-auto justify-center"
        @click="handleCancel"
      />
      <AdminButton
        type="submit"
        size="md"
        variant="primary"
        :label="isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Buat Voting'"
        :disabled="isSubmitting"
        :icon-left="RiSaveLine"
        class="w-full sm:w-auto justify-center"
      />
    </div>
  </form>

  <ConfirmModal
    :is-open="isLeaveModalOpen"
    title="Tinggalkan Halaman?"
    message="Perubahan yang Anda buat belum disimpan. Apakah Anda yakin ingin keluar dari halaman ini?"
    confirm-text="Ya, Tinggalkan"
    confirm-variant="primary"
    cancel-text="Lanjut Mengedit"
    @confirm="confirmLeave"
    @cancel="cancelLeave"
    />
  </div>
</template>
