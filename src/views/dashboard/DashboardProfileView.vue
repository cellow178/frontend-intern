<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

interface ImageField {
  field_value?: string
  url?: string
}

interface GlobalConfigData {
  school_name?: string
  motto?: string
  profile_title?: string
  profile_description?: string
  img_profile_1?: ImageField | null
  img_profile_2?: ImageField | null
  [key: string]: unknown
}

const toastStore = useToastStore()

const isLoading = ref(true)
const isSaving = ref(false)

const schoolName = ref('')
const motto = ref('')
const profileTitle = ref('')
const profileDescription = ref('')

const imgProfile1 = ref<string | null>(null)
const imgProfile2 = ref<string | null>(null)

const previewImg1 = ref<string | null>(null)
const previewImg2 = ref<string | null>(null)

const rawConfigData = ref<GlobalConfigData>({})

const errors = reactive({
  schoolName: false,
  motto: false,
  profileTitle: false,
  profileDescription: false,
  imgProfile1: false,
})

const submitButtonLabel = computed(() => (isSaving.value ? 'Menyimpan...' : 'Simpan'))

const fetchProfileData = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/global-config/show')
    const data: GlobalConfigData = response.data?.data ?? {}

    rawConfigData.value = data
    schoolName.value = data.school_name ?? ''
    motto.value = data.motto ?? ''
    profileTitle.value = data.profile_title ?? ''
    profileDescription.value = data.profile_description ?? ''

    if (data.img_profile_1) {
      imgProfile1.value = data.img_profile_1.field_value ?? null
      previewImg1.value = data.img_profile_1.url ? getFullFileUrl(data.img_profile_1.url) : null
    } else {
      imgProfile1.value = null
      previewImg1.value = null
    }

    if (data.img_profile_2 && data.img_profile_2.field_value) {
      imgProfile2.value = data.img_profile_2.field_value
      previewImg2.value = data.img_profile_2.url ? getFullFileUrl(data.img_profile_2.url) : null
    } else {
      imgProfile2.value = null
      previewImg2.value = null
    }
  } catch (err) {
    console.error('Gagal memuat profil sekolah:', err)
    toastStore.show('Gagal memuat data profil sekolah.', 'error')
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.schoolName = !schoolName.value.trim()
  errors.motto = !motto.value.trim()
  errors.profileTitle = !profileTitle.value.trim()
  errors.profileDescription = !profileDescription.value.trim()
  errors.imgProfile1 = !imgProfile1.value

  if (
    errors.schoolName ||
    errors.motto ||
    errors.profileTitle ||
    errors.profileDescription ||
    errors.imgProfile1
  ) {
    toastStore.show('Beberapa field wajib masih kosong, silakan periksa kembali.', 'error')

    nextTick(() => {
      document.querySelector('.border-error, .text-error')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })

    return false
  }
  return true
}

const handleSave = async () => {
  if (!validate()) return

  isSaving.value = true

  const payload = {
    ...rawConfigData.value,
    school_name: schoolName.value,
    motto: motto.value,
    profile_title: profileTitle.value,
    profile_description: profileDescription.value,
    img_profile_1: imgProfile1.value,
    img_profile_2: imgProfile2.value || null,
  }

  let isSuccess = false

  try {
    await api.put('/global-config/update', payload)
    toastStore.show('Profil sekolah berhasil disimpan.', 'success')
    isSuccess = true
  } catch (err) {
    console.error('Error saat update:', err)
    const errorResponse = err as { response?: { data?: { message?: string } } }
    toastStore.show(
      errorResponse.response?.data?.message || 'Gagal menyimpan profil sekolah.',
      'error',
    )
  } finally {
    isSaving.value = false
  }

  if (isSuccess) {
    await fetchProfileData()
  }
}

onMounted(() => {
  fetchProfileData()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold text-text-neutral">Profil Sekolah</h1>

    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8 max-w-4xl">
      <div v-if="isLoading" class="text-text-alt py-16 text-center">
        <LoadingSpinner size="lg" label="Memuat profil sekolah..." />
      </div>

      <div v-else class="flex flex-col gap-8">
        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Nama Sekolah</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="schoolName"
            type="text"
            placeholder="Masukkan nama sekolah"
            :error="errors.schoolName"
            @input="errors.schoolName = false"
          />
          <p v-if="errors.schoolName" class="text-sm text-error mt-1">Nama sekolah wajib diisi.</p>
        </div>

        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Motto Sekolah</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="motto"
            type="text"
            placeholder="Masukkan motto sekolah"
            maxlength="100"
            :error="errors.motto"
            @input="errors.motto = false"
          />
          <p v-if="errors.motto" class="text-sm text-error mt-1">Motto sekolah wajib diisi.</p>
        </div>

        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Judul Profil</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="profileTitle"
            type="text"
            placeholder="Masukkan judul profil"
            :error="errors.profileTitle"
            @input="errors.profileTitle = false"
          />
          <p v-if="errors.profileTitle" class="text-sm text-error mt-1">
            Judul profil wajib diisi.
          </p>
        </div>

        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Deskripsi Profil</span>
            <RequiredBadge />
          </label>
          <RichTextEditor
            v-model="profileDescription"
            @update:modelValue="errors.profileDescription = false"
          />
          <p v-if="errors.profileDescription" class="text-sm text-error mt-1">
            Deskripsi profil wajib diisi.
          </p>
        </div>

        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Gambar Profil 1</span>
            <RequiredBadge />
          </label>
          <ImageUpload
            v-model="imgProfile1"
            v-model:previewUrl="previewImg1"
            aspectRatio="rectangle"
            :maxSizeMB="5"
            @update:modelValue="errors.imgProfile1 = false"
          />
          <p v-if="errors.imgProfile1" class="text-sm text-error mt-1">
            Gambar profil 1 wajib diisi.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-neutral mb-1.5">
            Gambar Profil 2
          </label>
          <ImageUpload
            v-model="imgProfile2"
            v-model:previewUrl="previewImg2"
            aspectRatio="rectangle"
            :maxSizeMB="5"
          />
        </div>

        <div>
          <Button
            type="button"
            size="md"
            :label="submitButtonLabel"
            :disabled="isSaving"
            :icon-left="RiSaveLine"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </div>
</template>
