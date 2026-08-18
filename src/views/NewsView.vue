<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api.ts'
import Navbar from '@/components/layout/Navbar.vue'
import BackButton from '@/components/ui/BackButton.vue'
import Select from '@/components/ui/Select.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Footer from '@/components/layout/Footer.vue'
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
const categories = ref<Category[]>([])
const isLoading = ref(true)

// Filter & Pagination States
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const sortOrder = ref<'desc' | 'asc'>('desc')
const currentPage = ref(1)
const totalPage = ref(1)

const LIMIT = 9
let searchDebounce: ReturnType<typeof setTimeout> | undefined

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

    // Cek jika ada query "sort" dari URL
    if (route.query.sort === 'asc' || route.query.sort === 'desc') {
      sortOrder.value = route.query.sort as 'asc' | 'desc'
    }
  } catch (err) {
    console.error('Gagal ambil data kategori berita:', err)
  }
}

// Fetch News
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
  fetchNews()
})
</script>

<template>
  <Navbar />

  <main class="pt-24 pb-16 px-12">
    <BackButton />

    <div class="flex flex-col items-center gap-4 text-center mb-10">
      <h1 class="font-extrabold text-4xl text-text-neutral border-b-4 border-primary pb-2">
        Berita
      </h1>
      <p class="text-lg text-text-neutral max-w-xl">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7
        Semarang
      </p>
    </div>

    <!-- Search, Filter Kategori, & Sort -->
    <div class="flex flex-wrap items-center justify-center gap-4 mb-10">
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

      <!-- Filter Kategori Dropdown -->
      <div class="w-full max-w-50">
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

      <!-- Sort Toggle -->
      <button
        @click="toggleSort"
        class="flex items-center gap-2 border border-text-alt/30 rounded-full px-5 py-3 text-text-neutral hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
      >
        <RiTimeLine class="w-5 h-5" />
        {{ sortOrder === 'desc' ? 'Terbaru' : 'Terlama' }}
      </button>
    </div>

    <!-- Grid berita -->
    <div v-if="isLoading" class="text-center text-text-alt py-16">Memuat...</div>

    <div v-else-if="newsList.length === 0" class="text-center text-text-alt py-16">
      Tidak ada berita ditemukan.
    </div>

    <div v-else class="flex flex-wrap justify-center gap-16 max-w-7xl mx-auto">
      <NewsCard
        v-for="item in newsList"
        :key="item.id"
        :slug="item.slug"
        :title="item.title"
        :content="item.content"
        :img-cover="item.img_cover"
        :author="item.author"
        :created-at="item.created_at"
        :category-name="item.category_name"
      />
    </div>

    <!-- Pagination -->
    <Pagination v-model:current-page="currentPage" :total-page="totalPage" class="mt-12" />
  </main>

  <Footer />
</template>
