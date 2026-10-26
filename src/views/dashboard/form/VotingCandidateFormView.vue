<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import AdminButton from '@/components/ui/AdminButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import BackButton from '@/components/ui/BackButton.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import Input from '@/components/ui/Input.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'
import { RiSaveLine, RiTeamLine } from '@remixicon/vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

// votingId dari param (tambah: /voting/12/kandidat/tambah, edit: /voting/12/kandidat/34),
// kandidatId hanya ada di mode edit.
const votingId = computed(() => Number(route.params.votingId))
const candidateId = computed(() => (route.params.candidateId ? Number(route.params.candidateId) : null))
const isEditMode = computed(() => !!candidateId.value)

const isLoading = ref(isEditMode.value)
const isSubmitting = ref(false)
const votingTitle = ref('')

const form = reactive({
  title: '',
  description: '',
  order: '1',
})

const errors = reactive({
  title: '',
  order: '',
  description: '',
  img: '',
})

const candidateImg = ref<string | null>(null)
const candidateImgPreview = ref<string | null>(null)

const isRichTextEmpty = (html: string) =>
  !html.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/gi, '').trim()

// --- Deteksi perubahan (peringatan keluar halaman) ---
const isFormDirty = ref(false)
const initialSnapshot = ref<string>('')
const pendingTarget = ref<string | null>(null)
const isLeaveModalOpen = ref(false)

const snapshotOf = () =>
  JSON.stringify({ ...form, img: candidateImg.value ?? null })

const takeSnapshot = () => {
  initialSnapshot.value = snapshotOf()
  isFormDirty.value = false
}

// Kembali ke detail dengan tab terakhir (?tab=kandidat) agar user mendarat
// di tab yang sama, bukan selalu tab Peserta.
const backToDetail = () =>
  router.push({
    name: 'dashboard-voting-detail',
    params: { id: votingId.value },
    query: { tab: 'kandidat' },
  })

const fetchVotingTitle = async () => {
  try {
    const response = await api.get(`/votings/${votingId.value}`)
    votingTitle.value = response.data?.data?.title ?? ''
  } catch {
    // Judul voting hanya label tambahan — abaikan bila gagal.
  }
}

// Mode tambah: nomor urut otomatis = max(order) + 1 dari kandidat yang
// sudah ada di voting ini (tidak mengandalkan urutan insert / id).
const fetchNextOrder = async () => {
  try {
    const response = await api.get(`/votings/${votingId.value}`)
    const list = (response.data?.data?.candidates ?? []) as { order?: number }[]
    const max = list.reduce((m, c) => Math.max(m, Number(c.order) || 0), 0)
    form.order = String(max + 1)
  } catch {
    form.order = '1'
  }
}

const fetchDetail = async () => {
  if (!candidateId.value) return
  isLoading.value = true
  try {
    const response = await api.get(`/voting-candidates/${candidateId.value}`)
    const data = response.data?.data
    if (!data || Number(data.voting_id) !== votingId.value) {
      throw new Error('not-found')
    }
    form.title = data.title ?? ''
    form.description = data.description ?? ''
    form.order = String(data.order ?? 1)
    // Object file Find: { field_value: "tmp/xxx.jpg" } = path mentah yang VALID.
    // Preview via route temp-file publik; NAMA FILE UTUH (termasuk ekstensi)
    // karena route hanya menambah prefix "tmp/" (tanpa ekstensi = 200 kosong!).
    const obj = typeof data.img_cover === 'string' ? null : (data.img_cover as { field_value?: string; path?: string } | null)
    const raw = obj ? (obj.field_value ?? obj.path ?? null) : (data.img_cover as string | null)
    candidateImg.value = raw && raw !== 'x' ? raw : null
    if (candidateImg.value) {
      const filename = candidateImg.value.replace(/^\/+/, '').split('/').pop() ?? candidateImg.value
      const ext = filename.match(/\.([^./]+)$/)?.[1] ?? 'jpg'
      candidateImgPreview.value = getFullFileUrl(`api/temp-file/${filename}/${Date.now()}/${ext}`)
    } else {
      candidateImgPreview.value = null
    }
    takeSnapshot()
  } catch {
    toastStore.show('Kandidat tidak ditemukan.', 'error')
    backToDetail()
  } finally {
    isLoading.value = false
  }
}

const validate = (): boolean => {
  errors.title = ''
  errors.order = ''
  errors.description = ''
  errors.img = ''
  let ok = true
  if (!form.title.trim()) {
    errors.title = 'Nama kandidat wajib diisi.'
    ok = false
  }
  const orderNum = Number(form.order)
  if (!Number.isInteger(orderNum) || orderNum < 1) {
    errors.order = 'Nomor urut harus angka ≥ 1.'
    ok = false
  }
  if (isRichTextEmpty(form.description)) {
    errors.description = 'Visi / deskripsi kandidat wajib diisi.'
    ok = false
  }
  if (!candidateImg.value) {
    errors.img = 'Foto kandidat wajib diunggah.'
    ok = false
  }
  if (!ok) {
    toastStore.show('Beberapa field wajib masih kosong, silakan periksa kembali.', 'error')
    nextTick(() => {
      document.querySelector('.border-error, .text-error')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }
  return ok
}

const handleSubmit = async () => {
  if (!validate()) return
  isSubmitting.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description,
      img_cover: candidateImg.value,
      order: Number(form.order),
      active: true,
    }
    if (isEditMode.value) {
      await api.put('/voting-candidates/update', {
        id: candidateId.value,
        voting_id: votingId.value,
        ...payload,
      })
      toastStore.show('Kandidat berhasil diperbarui!', 'success')
    } else {
      await api.post('/voting-candidates/create', {
        voting_id: votingId.value,
        ...payload,
      })
      toastStore.show('Kandidat berhasil ditambahkan!', 'success')
    }
    isFormDirty.value = false
    backToDetail()
  } catch (err: unknown) {
    const apiErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = apiErr.response?.data?.errors
    if (fieldErrors?.title?.[0]) errors.title = fieldErrors.title[0]
    if (fieldErrors?.order?.[0]) errors.order = fieldErrors.order[0]
    toastStore.show(apiErr.response?.data?.message || 'Gagal menyimpan kandidat.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  backToDetail()
}

const confirmLeave = () => {
  isFormDirty.value = false
  isLeaveModalOpen.value = false
  if (pendingTarget.value) {
    router.push(pendingTarget.value)
  } else {
    backToDetail()
  }
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
  fetchVotingTitle()
  if (isEditMode.value) {
    await fetchDetail()
  } else {
    await fetchNextOrder()
    takeSnapshot()
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isLoading" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div>
        <BackButton :to="`/dashboard/voting/${votingId}?tab=kandidat`" :sticky="false" />
      </div>

      <div class="border-b border-text-alt/50 pb-4 mb-8">
        <h1 class="flex items-center gap-2 text-xl font-bold text-text-neutral"><RiTeamLine class="w-5 h-5 text-primary shrink-0" />
          {{ isEditMode ? 'Edit Kandidat' : 'Tambah Kandidat' }}
        </h1>
      </div>
      <div class="text-text-alt py-16 text-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl flex flex-col gap-5"
    >
      <div>
        <BackButton :to="`/dashboard/voting/${votingId}?tab=kandidat`" :sticky="false" />
      </div>

      <div class="border-b border-text-alt/50 pb-4">
        <h1 class="flex items-center gap-2 text-xl font-bold text-text-neutral"><RiTeamLine class="w-5 h-5 text-primary shrink-0" />
          {{ isEditMode ? 'Edit Kandidat' : 'Tambah Kandidat' }}
        </h1>
        <p v-if="votingTitle" class="text-sm text-text-alt mt-1">Voting: {{ votingTitle }}</p>
      </div>

      <!-- Foto -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral">
          <span>Foto Kandidat</span>
          <RequiredBadge />
        </label>
        <ImageUpload
          v-model="candidateImg"
          v-model:previewUrl="candidateImgPreview"
          aspectRatio="square"
          :maxSizeMB="5"
        />
        <p v-if="errors.img" class="text-sm text-error mt-1">{{ errors.img }}</p>
      </div>

      <!-- Nama -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral">
          <span>Nama Kandidat</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="form.title"
          type="text"
          variant="semi-rounded"
          size="large"
          placeholder="Masukkan nama kandidat..."
          :error="!!errors.title"
          @input="errors.title = ''"
        />
        <p v-if="errors.title" class="text-sm text-error mt-1">{{ errors.title }}</p>
      </div>

      <!-- Visi / deskripsi -->
      <div class="flex flex-col gap-1.5">
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Deskripsi</span>
          <RequiredBadge />
        </label>
        <div :class="{ 'border border-error rounded-xl': errors.description }">
          <RichTextEditor v-model="form.description" />
        </div>
        <p v-if="errors.description" class="text-sm text-error mt-1">{{ errors.description }}</p>
      </div>

      <!-- Nomor urut -->
      <div class="flex flex-col gap-1.5 max-w-44">
        <label class="flex items-center text-sm font-medium text-text-neutral">
          <span>Nomor Urut</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="form.order"
          type="number"
          variant="semi-rounded"
          min="1"
          size="large"
          :error="!!errors.order"
          @input="errors.order = ''"
        />
        <p v-if="errors.order" class="text-sm text-error mt-1">{{ errors.order }}</p>
      </div>

      <div class="flex items-center gap-3 mt-4">
        <AdminButton type="button" size="md" variant="secondary" label="Batal" @click="handleCancel" />
        <AdminButton
          type="submit"
          size="md"
          variant="primary"
          :label="isSubmitting ? 'Menyimpan...' : 'Simpan'"
          :disabled="isSubmitting"
          :icon-left="RiSaveLine"
        />
      </div>
    </form>
  </div>

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
</template>
