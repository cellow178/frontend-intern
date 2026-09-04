<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api.ts'
import BackButton from '@/components/ui/BackButton.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import Select from '@/components/ui/Select.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import NewsHighlightCard from '@/components/cards/NewsHighlightCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { RiSearchLine, RiTimeLine } from '@remixicon/vue'

const route = useRoute()

interface NewsItem {
  id: number
  slug: string
  title: string
  category_name: string
  content: string
  img_cover: string | null
  author: string
  created_at: string
}

interface Category {
  id: number
  name: string
  description: string
}

const newsList = ref<NewsItem[]>([])
const highlightNews = ref<NewsItem | null>(null)
const categories = ref<Category[]>([])

const isLoading = ref(true)
const isHighlightLoading = ref(true)

// Filter & Pagination States
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const sortOrder = ref<'desc' | 'asc'>('desc')
const currentPage = ref(1)
const totalPage = ref(1)

const LIMIT = 18
const dummyPic = 'https://picsum.photos/1600/1200'
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Computed filter: Menyaring newsList agar berita highlight tidak muncul ganda
const filteredNewsList = computed(() => {
  if (!highlightNews.value) return newsList.value
  return newsList.value.filter((item) => item.id !== highlightNews.value?.id)
})

// Fetch Highlight News (Berita terbaru)
const fetchHighlightNews = async () => {
  isHighlightLoading.value = true
  try {
    const response = await api.get('/no-auth/news', {
      params: {
        limit: 1,
        sort_by: 'created_at',
        sort: 'desc',
      },
    })
    if (response.data.data && response.data.data.length > 0) {
      highlightNews.value = response.data.data[0]
    }
  } catch (err) {
    console.error('Gagal ambil data highlight berita:', err)
  } finally {
    isHighlightLoading.value = false
  }
}

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

// Fetch News List
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

const onCategoryChange = () => {
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
  await fetchHighlightNews()
  fetchNews()
})
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12">
    <BackButton class="mb-6 sm:mb-8" />

    <div class="flex flex-col items-center gap-4 text-center mb-10">
      <SectionTitle title="Berita" />
      <p class="text-sm text-text-neutral max-w-xl md:text-lg">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7
        Semarang
      </p>
    </div>

    <!-- ================= HIGHLIGHT NEWS SECTION ================= -->
    <div class="flex justify-center w-full">
      <!-- Loading Skeleton -->
      <div
        v-if="isHighlightLoading"
        class="w-full max-w-3xl h-64 mb-10 md:mb-16 bg-slate-200/60 animate-pulse rounded-2xl flex items-center justify-center text-text-alt"
      >
        Memuat Highlight Berita...
      </div>

      <!-- Komponen Highlight Berita -->
      <NewsHighlightCard
        v-else-if="highlightNews"
        :title="highlightNews.title"
        :content="highlightNews.content"
        :category-name="highlightNews.category_name"
        :author="highlightNews.author"
        :created-at="highlightNews.created_at"
        :img-cover="dummyPic"
        :slug="highlightNews.slug"
      />
    </div>
    <!-- ================= END HIGHLIGHT SECTION ================= -->

    <!-- Search, Filter Kategori, & Sort -->
    <div
      class="flex flex-col items-center gap-3 mb-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
    >
      <!-- Search Bar -->
      <div class="relative w-full max-w-md">
        <RiSearchLine class="w-5 h-5 text-text-alt absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Cari berita..."
          class="w-full border border-text-alt/30 rounded-full pl-11 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <!-- Filter Kategori Dropdown + Sort Toggle -->
      <div class="flex items-center justify-center gap-3 w-full sm:w-auto sm:gap-4">
        <div class="w-full max-w-50 sm:w-auto">
          <Select
            v-model="selectedCategoryId"
            placeholder="Pilih Kategori"
            :options="[
              { value: null, label: 'Semua Kategori' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]"
            @update:model-value="onCategoryChange"
          />
        </div>

        <button
          @click="toggleSort"
          class="flex items-center gap-2 border border-text-alt/30 rounded-full px-4 py-3 sm:px-5 text-sm text-text-neutral hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          <RiTimeLine class="w-5 h-5" />
          {{ sortOrder === 'desc' ? 'Terbaru' : 'Terlama' }}
        </button>
      </div>
    </div>

    <!-- Grid Berita -->
    <div v-if="isLoading" class="text-center text-text-alt py-16">Memuat...</div>

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
        :content="item.content"
        :img-cover="dummyPic"
        :author="item.author"
        :created-at="item.created_at"
        :category-name="item.category_name"
      />
    </div>

    <!-- Pagination -->
    <Pagination v-model:current-page="currentPage" :total-page="totalPage" class="mt-12" />
  </main>
</template>
