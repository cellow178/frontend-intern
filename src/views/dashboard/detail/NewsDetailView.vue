<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import EnumStatusBadge from '@/components/ui/EnumStatusBadge.vue'
import CategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import { RiNewspaperLine } from '@remixicon/vue'

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
  img_description?: string | null
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
    toastStore.show('Gagal memuat Detail Berita.', 'error')
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
        <span>
          <BackButton to="/dashboard/berita" :sticky="false" />
        </span>

        <div class="border-t border-text-alt/50"></div>

        <h1 class="flex items-center gap-2 text-xl lg:text-2xl font-bold text-text-neutral"><RiNewspaperLine class="w-6 h-6 text-primary shrink-0" />Detail Berita</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!news" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data berita tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Judul -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Judul Berita</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ news.title || '-' }}
          </dd>
        </div>

        <!-- Kategori -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Kategori</dt>

          <dd class="sm:col-span-2 flex items-center">
            <CategoryBadge :categoryName="news.rel_category_id" />
          </dd>
        </div>

        <!-- Cover Berita -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Cover Berita</dt>

          <dd class="sm:col-span-2 min-w-0 text-sm lg:text-base text-text-neutral">
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

        <!-- Deskripsi Cover Berita -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">
            Deskripsi Cover Berita
          </dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ news.img_description || '-' }}
          </dd>
        </div>

        <!-- Status -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Status</dt>

          <dd class="sm:col-span-2 flex items-center">
            <EnumStatusBadge :status="news.status" />
          </dd>
        </div>

        <!-- Diubah Terakhir Oleh -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Diubah Terakhir Oleh</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ news.rel_updated_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Diubah -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(news.updated_at) }}
          </dd>
        </div>

        <!-- Dibuat Oleh -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Dibuat Oleh</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ news.rel_created_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(news.created_at) }}
          </dd>
        </div>

        <!-- Deskripsi Berita -->
        <div class="border-t border-text-alt/15 py-6 lg:py-8">
          <h2
            class="text-sm lg:text-base font-semibold text-text-neutral pb-3 mb-4 border-b border-text-alt/20"
          >
            Konten Berita
          </h2>

          <RichTextContent :content="news.content" class="max-w-4xl text-sm lg:text-base" />
        </div>
      </dl>
    </div>
  </div>
</template>
