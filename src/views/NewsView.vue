<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteDataStore } from '@/stores/siteData'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import NewsHighlightCard from '@/components/cards/NewsHighlightCard.vue'
import NewsCardSkeleton from '@/components/skeletons/NewsCardSkeleton.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { RiSearchLine, RiTimeLine } from '@remixicon/vue'

const route = useRoute()
const siteDataStore = useSiteDataStore()

interface NewsItem {
  id: number
  slug: string
  title: string
  category_name: string
  content: string
  img_cover: any
  author: string
  created_at: string
  is_highlight?: boolean
}

interface Category {
  id: number
  name: string
  description: string
}

const newsList = ref<NewsItem[]>([])
const categories = ref<Category[]>([])

const isLoading = ref(true)

// Ambil highlightNews dari Pinia Store
const highlightNews = computed(() => siteDataStore.highlightNews)

// Filter & Pagination States
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const sortOrder = ref<'desc' | 'asc'>('desc')
const currentPage = ref(1)
const totalPage = ref(1)

const LIMIT = 19
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Filter agar berita yang sedang jadi highlight tidak muncul ganda di list utama
const filteredNewsList = computed(() => {
  if (!highlightNews.value) return newsList.value
  return newsList.value.filter((item) => item.id !== highlightNews.value?.id)
})

// Fetch Categories
const fetchCategories = async () => {
  try {
    const response = await api.get('/no-auth/news-categories')
    categories.value = response.data.data

    const categoryQuery = route.query.category as string
    if (categoryQuery) {
      const matchedCategory = categories.value.find((cat) =>
        cat.name.toLowerCase().includes(categoryQuery.toLowerCase()),
      )
      if (matchedCategory) {
        selectedCategoryId.value = matchedCategory.id
      }
    }

    if (route.query.sort === 'asc' || route.query.sort === 'desc') {
      sortOrder.value = route.query.sort as 'asc' | 'desc'
    }
  } catch (err) {
    console.error('Gagal ambil data kategori berita:', err)
  }
}

// Fetch News List Paginasi
const fetchNews = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/no-auth/news', {
      params: {
        search: searchQuery.value || undefined,
        category_id: selectedCategoryId.value || undefined,
        sort_by: 'created_at',
        sort: sortOrder.value,
        limit: LIMIT,
        page: currentPage.value,
      },
    })
    newsList.value = response.data.data
    totalPage.value = response.data.totalPage
  } catch (err) {
    console.error('Gagal ambil data berita:', err)
  } finally {
    isLoading.value = false
  }
}

// Handlers
const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchNews()
  }, 400)
}

const onCategoryChange = (val: string | number | null) => {
  selectedCategoryId.value = val !== null && val !== '' ? Number(val) : null
  currentPage.value = 1
  fetchNews()
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  currentPage.value = 1
  fetchNews()
}

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchNews()
})

onMounted(async () => {
  await fetchCategories()
  await siteDataStore.fetchNews()
  fetchNews()
})
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12">
    <BackButton to="/" class="mb-6 sm:mb-8" />

    <div class="flex flex-col items-center gap-4 text-center mb-10">
      <SectionTitle title="Berita" />
      <p class="text-sm text-text-neutral max-w-xl md:text-lg">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7
        Semarang
      </p>
    </div>

    <div v-if="highlightNews" class="flex justify-center w-full mb-10">
      <NewsHighlightCard
        :slug="highlightNews.slug"
        :title="highlightNews.title"
        :category-name="highlightNews.category_name"
        :content="highlightNews.content"
        :img-cover="highlightNews.img_cover"
        :author="highlightNews.author"
        :created-at="highlightNews.created_at"
      />
    </div>

    <!-- Search, Filter Kategori, & Sort -->
    <div
      class="flex flex-col items-center gap-3 my-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
    >
      <!-- Search Bar -->
      <div class="w-full max-w-md">
        <Input
          v-model="searchQuery"
          type="text"
          variant="rounded-full"
          size="mobile"
          placeholder="Cari berita..."
          :icon="RiSearchLine"
          icon-position="left"
          @input="onSearchInput"
        />
      </div>

      <!-- Filter Kategori Dropdown + Sort Toggle -->
      <div class="flex items-center justify-center gap-3 w-full sm:w-auto sm:gap-4">
        <div class="w-full max-w-50 sm:w-auto">
          <Select
            :model-value="selectedCategoryId"
            placeholder=""
            variant="rounded-full"
            size="mobile"
            :options="[
              { value: null, label: 'Semua Kategori' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]"
            @update:model-value="onCategoryChange"
          />
        </div>

        <button
          @click="toggleSort"
          class="flex items-center gap-2 border border-text-alt/30 rounded-full px-3.5 py-1.5 text-sm sm:px-5 sm:py-3 sm:text-base text-text-neutral hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          <RiTimeLine class="w-4 h-4 sm:w-5 sm:h-5" />
          {{ sortOrder === 'desc' ? 'Terbaru' : 'Terlama' }}
        </button>
      </div>
    </div>

    <!-- Grid Berita Skeleton / Content -->
    <div
      v-if="isLoading"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 max-w-7xl mx-auto"
    >
      <NewsCardSkeleton v-for="n in 6" :key="`skeleton-${n}`" />
    </div>

    <div v-else-if="filteredNewsList.length === 0" class="text-center text-text-alt py-16">
      Tidak ada berita ditemukan.
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 max-w-7xl mx-auto"
    >
      <NewsCard
        v-for="item in filteredNewsList"
        :key="item.id"
        :slug="item.slug"
        :title="item.title"
        :category-name="item.category_name"
        :content="item.content"
        :img-cover="item.img_cover"
        :author="item.author"
        :created-at="item.created_at"
      />
    </div>

    <!-- Pagination -->
    <Pagination v-model:current-page="currentPage" :total-page="totalPage" class="mt-12" />
  </main>
</template>
