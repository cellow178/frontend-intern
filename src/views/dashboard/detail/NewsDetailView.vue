<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import NewsStatusBadge from '@/components/ui/NewsStatusBadge.vue'
import CategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'

interface ImgCover {
  ext: string
  url: string
  tumbnail_url: string
  filename: string
  field_value: string
}

interface NewsDetail {
  id: number
  category_id: number
  slug: string
  title: string
  content: string
  img_cover: ImgCover | null
  status: string
  is_highlight: boolean
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
  rel_category_id?: string
  rel_created_by?: string
  rel_updated_by?: string
}

const route = useRoute()
const toastStore = useToastStore()

const news = ref<NewsDetail | null>(null)
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
    const response = await api.get(`/news/${route.params.id}`)
    news.value = response.data.data
  } catch (err) {
    console.error('Gagal mengambil detail berita:', err)
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
    <!-- Kartu Metadata / Detail Data -->
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <BackButton to="/dashboard/berita" :sticky="false" />

      <div class="border-t border-text-alt/50 mt-2 mb-6"></div>

      <h1 class="text-xl font-bold text-text-neutral mb-4">Detail Berita</h1>

      <!-- State Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <!-- State Data Tidak Ditemukan -->
      <div v-else-if="!news" class="text-center text-text-alt py-8">Data tidak ditemukan.</div>

      <!-- Detail Data -->
      <dl v-else class="flex flex-col">
        <!-- Judul -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Judul</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium break-all">
            {{ news.title }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Kategori -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Kategori</dt>
          <dd class="sm:col-span-2 flex items-center">
            <CategoryBadge :categoryName="news.rel_category_id" />
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Cover Berita -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Cover Berita</dt>
          <dd class="sm:col-span-2 text-text-neutral">
            <a
              v-if="news.img_cover?.url"
              :href="getImageUrl(news.img_cover.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ getImageUrl(news.img_cover.url) }}
            </a>
            <span v-else class="text-text-alt">-</span>
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Status</dt>
          <dd class="sm:col-span-2 flex items-center gap-2">
            <NewsStatusBadge :status="news.status" />
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Dibuat Oleh -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Dibuat Oleh</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ news.rel_created_by || '-' }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(news.created_at) }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Diubah Terakhir Oleh -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Diubah Terakhir Oleh</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ news.rel_updated_by || '-' }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Tanggal Diubah -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(news.updated_at) }}</dd>
        </div>
      </dl>
    </div>

    <!-- Kartu Konten Berita -->
    <div v-if="!isLoading && news" class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <h2 class="text-text-neutral font-semibold pb-3 mb-4 border-b border-text-alt/50">
        Konten Berita
      </h2>
      <RichTextContent :content="news.content" class="max-w-4xl"/>
    </div>
  </div>
</template>
