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
  <section
    id="kompetensi"
    class="px-6 py-10 flex flex-col items-center gap-10 scroll-mt-10 md:px-12 md:py-16 md:gap-16"
  >
    <div class="flex flex-col items-center gap-3 text-center md:gap-4">
      <SectionTitle title="Kompetensi Keahlian" />
      <p class="text-base text-text-neutral md:text-lg">Kompetensi Keahlian di SMKN 7 Semarang</p>
    </div>

    <div
      class="grid grid-cols-2 gap-4 w-full sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-14 lg:max-w-14xl"
    >
      <MajorCard
        v-for="major in majors"
        :key="major.id"
        :img-logo="major.img_logo"
        :code="major.code"
        :major-name="major.major_name"
        :summary="major.summary"
        :slug="major.slug"
        class="w-full lg:w-90"
      />
    </div>
  </section>
</template>
