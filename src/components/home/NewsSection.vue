<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useRouter } from 'vue-router'
import { RiNewspaperLine } from '@remixicon/vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import NewsCard from '@/components/cards/NewsCard.vue'
import NewsHighlightCard from '@/components/cards/NewsHighlightCard.vue'
import Button from '@/components/ui/Button.vue'

const store = useSiteDataStore()
const { news, highlightNews } = storeToRefs(store)
const router = useRouter()

// Dummy picture
const dummyPic = 'https://picsum.photos/1600/1200'

// Grid 3 kolom (tablet): hitung berapa placeholder dibutuhkan biar baris terakhir rata
const tabletPlaceholderCount = computed(() => {
  const remainder = news.value.length % 3
  return remainder === 0 ? 0 : 3 - remainder
})

// Desktop (flex-wrap): tampilkan placeholder kalau jumlah berita minimal 2 & tidak habis dibagi 3
const showDesktopPlaceholder = computed(() => news.value.length === 1 || news.value.length >= 2 && news.value.length % 3 !== 0)

// Belum ada berita sama sekali
const isNewsEmpty = computed(() => news.value.length === 0)

onMounted(() => {
  store.fetchNews()
})
</script>

<template>
  <section
    id="berita"
    class="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-8 scroll-mt-10 lg:scroll-m-20 lg:px-12 lg:py-16 md:gap-12"
  >
    <div class="flex flex-col items-center gap-3 md:gap-4">
      <SectionTitle title="Berita Terkini" />
      <p class="text-base text-text-neutral text-center max-w-2xl md:text-lg">
        Dapatkan informasi dan kabar terbaru seputar kegiatan, prestasi, dan perkembangan di SMKN 7
        Semarang
      </p>
    </div>

    <NewsHighlightCard
      v-if="highlightNews"
      :title="highlightNews.title"
      :content="highlightNews.content"
      :img-cover="dummyPic"
      :author="highlightNews.author"
      :created-at="highlightNews.created_at"
      :category-name="highlightNews.category_name"
      :slug="highlightNews.slug"
    />

    <!-- State kosong: belum ada berita sama sekali -->
    <div v-if="isNewsEmpty" class="relative w-full min-h-52 md:min-h-64">
      <div
        class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-2 shadow-sm md:rounded-2xl"
      ></div>
      <div
        class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm md:rounded-2xl md:gap-3"
      >
        <RiNewspaperLine class="w-8 h-8 text-text-alt/50 md:w-10 md:h-10" />
        <span class="text-text-alt/60 text-sm text-center px-6 md:text-base"
          >Nantikan kabar terbaru...</span
        >
      </div>
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-12"
    >
      <NewsCard
        v-for="item in news"
        :key="item.id"
        :slug="item.slug"
        :title="item.title"
        :category-name="item.category_name"
        :content="item.content"
        :img-cover="dummyPic"
        :author="item.author"
        :created-at="item.created_at"
      />

      <!-- Placeholder dekoratif: mobile (grid 2 kolom, ganjil) -->
      <div v-if="news.length % 2 !== 0" class="relative h-full min-h-40 sm:hidden">
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-4 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiNewspaperLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4">Nantikan kabar terbaru...</span>
        </div>
      </div>

      <!-- Placeholder dekoratif: tablet (grid 3 kolom, sisa 1 atau 2) -->
      <div
        v-for="n in tabletPlaceholderCount"
        :key="`tablet-placeholder-${n}`"
        class="relative h-full min-h-40 hidden sm:block lg:hidden"
      >
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-4 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiNewspaperLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4">Nantikan kabar terbaru...</span>
        </div>
      </div>

      <!-- Placeholder dekoratif: desktop (flex-wrap) -->
      <div v-if="showDesktopPlaceholder" class="relative h-full min-h-120 hidden lg:block lg:w-80">
        <div
          class="absolute inset-0 bg-neutral border-2 border-secondary rounded-xl -rotate-6 shadow-sm"
        ></div>
        <div
          class="absolute inset-0 bg-neutral border-2 border-dashed border-text-alt/20 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <RiNewspaperLine class="w-5 h-5 text-text-alt/50" />
          <span class="text-text-alt/60 text-xs text-center px-4">Nantikan kabar terbaru...</span>
        </div>
      </div>
    </div>

    <Button label="Selengkapnya" @click="router.push('/berita')" />
  </section>
</template>
