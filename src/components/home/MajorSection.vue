<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import MajorCard from '@/components/cards/MajorCard.vue'

const store = useSiteDataStore()
const { majors, schoolName } = storeToRefs(store)

onMounted(() => {
  store.fetchMajors()
})
</script>

<template>
  <section
    id="kompetensi"
    class="scroll-mt-20 flex flex-col items-center gap-8 px-6 py-10 sm:gap-10 sm:px-8 sm:py-12 md:gap-12 md:px-12 md:py-16"
  >
    <!-- Judul -->
    <div class="flex flex-col items-center gap-3 text-center md:gap-4">
      <SectionTitle title="Kompetensi Keahlian" />
      <p class="text-base text-text-neutral md:text-lg">Kompetensi Keahlian di {{ schoolName }}</p>
    </div>

    <!-- Grid Jurusan -->
    <div
      class="grid w-full grid-cols-1 auto-rows-fr items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:flex lg:flex-wrap lg:justify-center lg:gap-16 lg:max-w-14xl"
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
