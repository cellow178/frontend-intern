<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import MajorCard from '@/components/cards/MajorCard.vue'

const store = useSiteDataStore()
const { majors } = storeToRefs(store)

onMounted(() => {
  store.fetchMajors()
})
</script>

<template>
  <section id="kompetensi" class="px-12 py-16 flex flex-col items-center gap-16 scroll-mt-20">
    <div class="flex flex-col items-center gap-4">
      <SectionTitle title="Kompetensi Keahlian" />
      <p class="text-lg text-text-neutral">Kompetensi Keahlian di SMKN 7 Semarang</p>
    </div>

    <div class="flex flex-wrap justify-center gap-14 max-w-14xl">
      <MajorCard
        v-for="major in majors"
        :key="major.id"
        :img-logo="major.img_logo"
        :code="major.code"
        :major-name="major.major_name"
        :summary="major.summary"
        :slug="major.slug"
        class="w-90"
      />
    </div>
  </section>
</template>
