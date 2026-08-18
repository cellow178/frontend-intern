<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api.ts'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import BackButton from '@/components/ui/BackButton.vue'

interface NewsDetail {
  id: number
  slug: string
  title: string
  content: string
  img_cover: string | null
  author: string
  created_at: string
}

const route = useRoute()
const news = ref<NewsDetail | null>(null)
const isLoading = ref(true)
const isNotFound = ref(false)

const fetchNewsDetail = async (slug: string) => {
  isLoading.value = true
  isNotFound.value = false
  try {
    const response = await api.get('/no-auth/news')
    const found = response.data.data.find((item: NewsDetail) => item.slug === slug)

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
  fetchNewsDetail(route.params.slug as string)
})

watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) fetchNewsDetail(newSlug as string)
  },
)
</script>

<template>
  <Navbar />

  <main class="pt-24 pb-16 px-12">
    <BackButton />

    <div v-if="isLoading" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt">Memuat...</p>
    </div>

    <div v-else-if="isNotFound" class="min-h-[50vh] flex items-center justify-center">
      <p class="text-text-alt">Berita tidak ditemukan.</p>
    </div>

    <div v-else-if="news" class="px-12">
      <article class="max-w-4xl mx-auto">
        <h1 class="font-extrabold text-4xl text-text-neutral text-center leading-snug my-4">
          {{ news.title }}
        </h1>

        <div class="text-center mb-8">
          <p class="font-medium text-text-neutral">{{ news.author }}</p>
          <p class="text-sm text-text-alt">{{ news.created_at }}</p>
        </div>

        <div
          class="w-full aspect-video rounded-2xl overflow-hidden mb-10"
          :class="!news.img_cover ? 'bg-linear-to-b from-primary to-accent' : ''"
        >
          <img v-if="news.img_cover" :src="news.img_cover" class="w-full h-full object-cover" />
        </div>

        <div class="prose max-w-none text-text-neutral leading-relaxed" v-html="news.content"></div>
      </article>
    </div>
  </main>

  <Footer />
</template>
