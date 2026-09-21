<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

interface ImgCover {
  ext: string
  url: string
  tumbnail_url: string
  filename: string
  field_value: string
}

interface BannerDetail {
  id: number
  title: string
  img_cover: ImgCover | null
  url: string | null
  active: boolean
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
}

const route = useRoute()
const toastStore = useToastStore()

const banner = ref<BannerDetail | null>(null)
const isLoading = ref(true)

const getImageUrl = (urlPath: string | undefined) => {
  if (!urlPath) return ''
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const cleanBase = baseUrl.replace(/\/+$/, '')

  const cleanPath = urlPath.replace(/^\/+/, '').replace(/^api\//, '')

  return `${cleanBase}/${cleanPath}`
}

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

const fetchDetail = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/banners/${route.params.id}`)
    banner.value = response.data.data
  } catch (err) {
    console.error('Gagal mengambil detail banner:', err)
    toastStore.show('Gagal memuat detail data.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <BackButton to="/dashboard/banner" :sticky="false" />

      <div class="border-t border-text-alt/50 mt-2 mb-6"></div>

      <h1 class="text-xl font-bold text-text-neutral mb-4">Detail Banner</h1>

      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <div v-else-if="!banner" class="text-center text-text-alt py-8">Data tidak ditemukan.</div>

      <dl v-else class="flex flex-col">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Judul</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">{{ banner.title }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Gambar Banner</dt>
          <dd class="sm:col-span-2 text-text-neutral">
            <a
              v-if="banner.img_cover?.url"
              :href="getImageUrl(banner.img_cover.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ getImageUrl(banner.img_cover.url) }}
            </a>
            <span v-else class="text-text-alt">-</span>
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Tautan (URL Target)</dt>
          <dd class="sm:col-span-2 text-text-neutral">
            <a
              v-if="banner.url"
              :href="banner.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ banner.url }}
            </a>
            <span v-else class="text-text-alt">-</span>
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Status</dt>
          <dd class="sm:col-span-2 flex items-center gap-2">
            <DashboardStatusBadge :active="banner.active" />
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(banner.created_at) }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(banner.updated_at) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
