<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api.ts'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import BackButton from '@/components/ui/BackButton.vue'
import {
  RiSearchLine,
  RiTimeLine,
  RiSkipLeftLine,
  RiSkipRightLine,
  RiArrowDownSLine,
} from '@remixicon/vue'

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
const pageInput = ref<number | string>(1)
const totalPage = ref(1)

const LIMIT = 9
let searchDebounce: ReturnType<typeof setTimeout> | undefined

// Fetch Categories
const fetchCategories = async () => {
  try {
    const response = await api.get('/no-auth/news-categories')
    categories.value = response.data.data
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

// Pagination Logic
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPage.value && page !== currentPage.value) {
    currentPage.value = page
    fetchNews()
  } else {
    pageInput.value = currentPage.value
  }
}

const handlePageInputSubmit = () => {
  let targetPage = Number(pageInput.value)
  if (isNaN(targetPage) || targetPage < 1) {
    targetPage = 1
  } else if (targetPage > totalPage.value) {
    targetPage = totalPage.value
  }
  changePage(targetPage)
}

const goToPrevPage = () => changePage(currentPage.value - 1)
const goToNextPage = () => changePage(currentPage.value + 1)
const goToFirstPage = () => changePage(1)
const goToLastPage = () => changePage(totalPage.value)

// Synchronize pageInput with currentPage
watch(currentPage, (newPage) => {
  pageInput.value = newPage
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(() => {
  fetchCategories()
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
      <div class="relative min-w-50">
        <select
          v-model="selectedCategoryId"
          @change="onCategoryChange"
          class="w-full appearance-none border border-text-alt/30 rounded-full pl-5 pr-10 py-3 bg-neutral text-text-neutral cursor-pointer focus:outline-none focus:border-primary transition-colors"
        >
          <option :value="null">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        <RiArrowDownSLine
          class="w-5 h-5 text-text-alt absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
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

    <div v-else class="grid grid-cols-3 gap-8 max-w-7xl mx-auto">
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
        class="w-full"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPage > 1" class="flex items-center justify-center gap-4 mt-12">
      <!-- First Page -->
      <button
        @click="goToFirstPage"
        :disabled="currentPage === 1"
        class="text-text-neutral disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
      >
        <RiSkipLeftLine class="w-6 h-6" />
      </button>

      <!-- Prev Page -->
      <button
        @click="goToPrevPage"
        :disabled="currentPage === 1"
        class="text-text-neutral font-medium disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
      >
        Sebelumnya
      </button>

      <!-- Editable Page Indicator Input -->
      <div class="flex items-center gap-2">
        <input
          v-model="pageInput"
          type="number"
          min="1"
          :max="totalPage"
          @keyup.enter="handlePageInputSubmit"
          @blur="handlePageInputSubmit"
          class="w-14 h-10 text-center border border-text-alt/30 rounded-lg text-text-neutral focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span class="text-text-alt font-medium">/ {{ totalPage }}</span>
      </div>

      <!-- Next Page -->
      <button
        @click="goToNextPage"
        :disabled="currentPage === totalPage"
        class="text-text-neutral font-medium disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
      >
        Selanjutnya
      </button>

      <!-- Last Page -->
      <button
        @click="goToLastPage"
        :disabled="currentPage === totalPage"
        class="text-text-neutral disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
      >
        <RiSkipRightLine class="w-6 h-6" />
      </button>
    </div>
  </main>

  <Footer />
</template>
