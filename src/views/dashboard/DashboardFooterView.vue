<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const toastStore = useToastStore()

const isLoading = ref(true)
const isSaving = ref(false)

const description = ref('')
const schoolTelephone = ref('')
const schoolEmail = ref('')
const yt = ref('')
const ig = ref('')
const fb = ref('')
const linkedin = ref('')

const rawConfigData = ref<Record<string, any>>({})

const errors = reactive({
  schoolTelephone: false,
  schoolEmail: false,
})

const submitButtonLabel = computed(() => (isSaving.value ? 'Menyimpan...' : 'Simpan'))

const fetchFooter = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/global-config/show')
    const data = response.data?.data ?? {}

    rawConfigData.value = data

    description.value = data.footer_description ?? ''
    schoolTelephone.value = data.school_telephone ?? ''
    schoolEmail.value = data.school_email ?? ''
    ig.value = data.footer_ig ?? ''
    yt.value = data.footer_yt ?? ''
    fb.value = data.footer_fb ?? ''
    linkedin.value = data.footer_linkedin ?? ''
  } catch (err) {
    console.error('Gagal ambil konfigurasi footer:', err)
    toastStore.show('Gagal memuat data footer.', 'error')
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.schoolTelephone = !schoolTelephone.value.trim()
  errors.schoolEmail = !schoolEmail.value.trim()

  const hasError = Object.values(errors).some((e) => e === true)

  if (hasError) {
    toastStore.show('Beberapa field wajib masih kosong, silakan periksa kembali.', 'error')

    nextTick(() => {
      document.querySelector('.border-error')?.scrollIntoView({
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
  try {
    await api.put('/global-config/update', {
      hero_description: rawConfigData.value.hero_description,
      profile_title: rawConfigData.value.profile_title,
      profile_description: rawConfigData.value.profile_description,
      img_profile_1: rawConfigData.value.img_profile_1,
      img_profile_2: rawConfigData.value.img_profile_2,
      school_vision: rawConfigData.value.school_vision,
      video_profile: rawConfigData.value.video_profile,
      school_name: rawConfigData.value.school_name,
      motto: rawConfigData.value.motto,

      footer_description: description.value || null,
      school_telephone: schoolTelephone.value,
      school_email: schoolEmail.value,
      footer_ig: ig.value || null,
      footer_yt: yt.value || null,
      footer_fb: fb.value || null,
      footer_linkedin: linkedin.value || null,
    })
    toastStore.show('Konfigurasi footer berhasil disimpan.', 'success')
    fetchFooter()
  } catch (err: any) {
    console.error('Gagal simpan konfigurasi footer:', err)
    toastStore.show(err.response?.data?.message || 'Gagal menyimpan konfigurasi footer.', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchFooter()
})
</script>

<template>
  <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
    <h1 class="text-xl font-bold text-text-neutral mb-6">Konfigurasi Footer Website</h1>

    <div v-if="isLoading" class="text-text-alt py-16 text-center">
      <LoadingSpinner size="lg" label="Memuat data..." />
    </div>

    <form v-else @submit.prevent="handleSave" class="flex flex-col gap-6">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-sm font-medium text-text-neutral">Deskripsi Footer</label>
          <span class="text-xs text-text-alt" :class="{ 'text-error': description.length >= 255 }">
            {{ description.length }}/255
          </span>
        </div>
        <Input v-model="description" type="textarea" />
      </div>

      <div>
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>No Kontak Sekolah</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="schoolTelephone"
          type="text"
          size="mobile"
          :error="errors.schoolTelephone"
          @input="errors.schoolTelephone = false"
        />
        <p v-if="errors.schoolTelephone" class="text-sm text-error mt-1">
          No Kontak Sekolah wajib diisi.
        </p>
      </div>

      <div>
        <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
          <span>Email</span>
          <RequiredBadge />
        </label>
        <Input
          v-model="schoolEmail"
          type="email"
          size="mobile"
          :error="errors.schoolEmail"
          @input="errors.schoolEmail = false"
        />
        <p v-if="errors.schoolEmail" class="text-sm text-error mt-1">Email wajib diisi.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-text-neutral mb-1.5">Link Youtube</label>
        <Input v-model="yt" type="url" size="mobile" />
      </div>

      <div>
        <label class="block text-sm font-medium text-text-neutral mb-1.5">Link Instagram</label>
        <Input v-model="ig" type="url" size="mobile" />
      </div>

      <div>
        <label class="block text-sm font-medium text-text-neutral mb-1.5">Link Facebook</label>
        <Input v-model="fb" type="url" size="mobile" />
      </div>

      <div>
        <label class="block text-sm font-medium text-text-neutral mb-1.5">Link LinkedIn</label>
        <Input v-model="linkedin" type="url" size="mobile" />
      </div>

      <div class="pt-4">
        <Button
          type="submit"
          size="md"
          :label="submitButtonLabel"
          :disabled="isSaving"
          :icon-left="RiSaveLine"
        />
      </div>
    </form>
  </div>
</template>
