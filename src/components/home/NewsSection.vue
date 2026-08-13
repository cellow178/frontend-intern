<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useRouter } from 'vue-router'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import Button from '@/components/ui/Button.vue'

const store = useSiteDataStore()
const { news } = storeToRefs(store)
const router = useRouter()

onMounted(() => {
  store.fetchNews()
})
</script>

<template>
  <section
    id="berita"
    class="max-w-7xl mx-auto px-12 py-16 flex flex-col items-center gap-12 scroll-mt-20"
  >
    <div class="flex flex-col items-center gap-4">
      <SectionTitle title="Berita Terkini" />
      <p class="text-lg text-text-neutral text-center max-w-2xl">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7
        Semarang
      </p>
    </div>

    <div class="flex flex-wrap justify-center gap-12">
      <NewsCard
        v-for="item in news"
        :key="item.id"
        :slug="item.slug"
        :title="item.title"
        :category-name="item.category_name"
        :content="item.content"
        :img-cover="null"
        :author="item.author"
        :created-at="item.created_at"
      />
    </div>

    <Button label="Selengkapnya" @click="router.push('/berita')" />
  </section>
</template>
