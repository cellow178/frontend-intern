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
    toastStore.show('Gagal memuat Detail Banner.', 'error')
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
    <div class="bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="flex flex-col gap-4">
        <span><BackButton to="/dashboard/banner" :sticky="false" /></span>

        <div class="border-t border-text-alt/50"></div>
        <h1 class="text-xl lg:text-2xl font-bold text-text-neutral">Detail Banner</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!banner" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Judul -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Judul</dt>
          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ banner.title || '-' }}
          </dd>
        </div>

        <!-- Gambar Banner -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Gambar Banner</dt>
          <dd class="sm:col-span-2 min-w-0">
            <a
              v-if="banner.img_cover?.url"
              :href="getImageUrl(banner.img_cover.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm lg:text-base text-primary hover:underline break-all"
            >
              {{ getImageUrl(banner.img_cover.url) }}
            </a>
            <span v-else class="text-sm lg:text-base text-text-alt">-</span>
          </dd>
        </div>

        <!-- URL Target -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tautan (URL Target)</dt>
          <dd class="sm:col-span-2 min-w-0">
            <a
              v-if="banner.url"
              :href="banner.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm lg:text-base text-primary hover:underline break-all"
            >
              {{ banner.url }}
            </a>
            <span v-else class="text-sm lg:text-base text-text-alt">-</span>
          </dd>
        </div>

        <!-- Status -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Status</dt>
          <dd class="sm:col-span-2 flex items-center">
            <DashboardStatusBadge :active="banner.active" />
          </dd>
        </div>

        <!-- Tanggal Diubah -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(banner.updated_at) }}
          </dd>
        </div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(banner.created_at) }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
