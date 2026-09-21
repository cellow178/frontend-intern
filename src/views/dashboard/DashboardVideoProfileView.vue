<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSaveLine } from '@remixicon/vue'

const toastStore = useToastStore()

const isLoading = ref(true)
const isSaving = ref(false)

const videoUrl = ref('')
const rawConfigData = ref<Record<string, any>>({})

const errors = reactive({
  videoUrl: false,
})

const submitButtonLabel = computed(() => (isSaving.value ? 'Menyimpan...' : 'Simpan'))

const youtubeEmbedUrl = computed(() => {
  const url = videoUrl.value.trim()
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }

  return null
})

const fetchVideoProfile = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/global-config/show')
    const data = response.data?.data ?? {}

    rawConfigData.value = data
    videoUrl.value = data.video_profile ?? ''
  } catch (err) {
    console.error('Gagal ambil data video profile:', err)
    toastStore.show('Gagal memuat data video profile.', 'error')
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.videoUrl = !videoUrl.value.trim()

  if (errors.videoUrl) {
    toastStore.show('Link video wajib diisi.', 'error')

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
      school_name: rawConfigData.value.school_name,
      motto: rawConfigData.value.motto,
      footer_description: rawConfigData.value.footer_description,
      school_telephone: rawConfigData.value.school_telephone,
      school_email: rawConfigData.value.school_email,
      footer_ig: rawConfigData.value.footer_ig,
      footer_yt: rawConfigData.value.footer_yt,
      footer_fb: rawConfigData.value.footer_fb,
      footer_linkedin: rawConfigData.value.footer_linkedin,

      video_profile: videoUrl.value,
    })
    toastStore.show('Video profile berhasil disimpan.', 'success')
    fetchVideoProfile()
  } catch (err: any) {
    console.error('Gagal simpan video profile:', err)
    toastStore.show(err.response?.data?.message || 'Gagal menyimpan video profile.', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchVideoProfile()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold text-text-neutral">Video Profile</h1>

    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <div v-if="isLoading" class="text-text-alt py-16 text-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <div v-else class="flex flex-col gap-6">
        <div>
          <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
            <span>Link Youtube Video Profil</span>
            <RequiredBadge />
          </label>
          <Input
            v-model="videoUrl"
            type="url"
            size="mobile"
            placeholder="https://www.youtube.com/watch?v=..."
            :error="errors.videoUrl"
            @input="errors.videoUrl = false"
          />
          <p v-if="errors.videoUrl" class="text-sm text-error mt-1">Link video wajib diisi.</p>
        </div>

        <div v-if="youtubeEmbedUrl">
          <label class="block text-sm font-medium text-text-neutral mb-2">Preview Video</label>
          <div class="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              :src="youtubeEmbedUrl"
              class="w-full h-full"
              frameborder="0"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
              "
              allowfullscreen
            />
          </div>
        </div>

        <div v-else-if="videoUrl">
          <p class="text-sm text-text-alt">
            Link video tidak dikenali sebagai URL YouTube yang valid — preview tidak dapat
            ditampilkan.
          </p>
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
