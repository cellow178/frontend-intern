<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import NewsCategoryBadge from '@/components/ui/NewsCategoryBadge.vue'
import NewsDetailSkeleton from '@/components/skeletons/NewsDetailSkeleton.vue'
import { getFullFileUrl } from '@/utils/file'

interface ImgCoverObj {
  ext?: string
  url?: string
  tumbnail_url?: string
  filename?: string
  field_value?: string
}

interface NewsDetail {
  id: number
  slug: string
  title: string
  category_name?: string
  content: string
  img_cover: string | ImgCoverObj | null
  is_highlight?: boolean
  author: string
  created_at: string
}

const route = useRoute()
const news = ref<NewsDetail | null>(null)
const isLoading = ref(true)
const isNotFound = ref(false)
const imageLoadError = ref(false)

const handleImageError = () => {
  imageLoadError.value = true
}

// Helper untuk format Tanggal + Jam
const formatPublishedDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)

  if (isNaN(date.getTime())) return dateStr

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

const fetchNewsDetail = async (slug: string) => {
  isLoading.value = true
  isNotFound.value = false
  imageLoadError.value = false

  try {
    const response = await api.get('/no-auth/news')
    const listData = response.data?.data || []
    const found = listData.find((item: NewsDetail) => item.slug === slug)

    if (found) {
      news.value = found
    } else {
      isNotFound.value = true
    }
  } catch (err) {
    console.error('Gagal ambil detail berita:', err)
    isNotFound.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.params.slug) {
    fetchNewsDetail(route.params.slug as string)
  }
})

watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) fetchNewsDetail(newSlug as string)
  },
)
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12">
    <BackButton class="mb-6 sm:mb-8" />

    <!-- Loading State menggunakan Skeleton -->
    <NewsDetailSkeleton v-if="isLoading" />

    <!-- State Berita Tidak Ditemukan -->
    <div v-else-if="isNotFound" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt">Berita tidak ditemukan.</p>
    </div>

    <!-- Tampilan Utama Berita -->
    <div v-else-if="news">
      <article class="max-w-4xl mx-auto">
        <!-- Judul Berita -->
        <h1
          class="font-extrabold text-2xl text-text-neutral text-center leading-snug my-4 sm:text-3xl lg:text-4xl wrap-break-word overflow-wrap-anywhere"
        >
          {{ news.title }}
        </h1>

        <!-- Badge Kategori -->
        <div v-if="news.category_name" class="flex justify-center mb-3">
          <NewsCategoryBadge :categoryName="news.category_name" size="md" />
        </div>

        <!-- Penulis & Tanggal + Jam -->
        <div class="text-center mb-6 sm:mb-8">
          <p class="font-medium text-text-neutral">{{ news.author || '-' }}</p>
          <p class="text-sm text-text-alt">{{ formatPublishedDate(news.created_at) }}</p>
        </div>

        <!-- Image Cover -->
        <div
          class="w-full aspect-video overflow-hidden mb-6 sm:mb-10 bg-linear-to-b from-primary to-accent flex items-center justify-center"
        >
          <img
            v-if="getFullFileUrl(news.img_cover) && !imageLoadError"
            :src="getFullFileUrl(news.img_cover)!"
            class="w-full h-full object-cover"
            alt="Cover Berita"
            @error="handleImageError"
          />
        </div>

        <!-- Konten Berita -->
        <RichTextContent :content="news.content" empty-message="Konten berita belum tersedia." />
      </article>
    </div>
  </main>
</template>
