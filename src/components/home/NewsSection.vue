<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import Button from '@/components/ui/Button.vue'

interface News {
  id: number
  slug: string
  title: string
  summary: string
  img_cover: string | null
  author: string
  created_at: string
}

const router = useRouter()
const newsList = ref<News[]>([])

const fetchNews = async () => {
  try {
    const response = await api.get('/no-auth/news')
    // ambil 3 berita paling baru (asumsi id lebih besar = lebih baru)
    newsList.value = [...response.data.data]
      .sort((a: News, b: News) => b.id - a.id)
      .slice(0, 3)
  } catch (err) {
    console.error('Gagal ambil data news:', err)
  }
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <section id="berita" class="max-w-7xl mx-auto px-12 py-16 flex flex-col items-center gap-12 scroll-mt-20">
    <div class="flex flex-col items-center gap-4">
      <SectionTitle title="Berita Terkini" />
      <p class="text-lg text-text-neutral text-center max-w-2xl">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7 Semarang
      </p>
    </div>

    <div class="flex flex-wrap justify-center gap-12">
      <NewsCard
        v-for="news in newsList"
        :key="news.id"
        :slug="news.slug"
        :title="news.title"
        :summary="news.summary"
        :img-cover="null"
        :author="news.author"
        :created-at="news.created_at"
      />
    </div>

    <Button label="Selengkapnya" @click="router.push('/berita')" />
  </section>
</template>