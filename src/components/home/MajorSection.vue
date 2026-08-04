<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import MajorCard from '@/components/home/MajorCard.vue'

interface Major {
  id: number
  slug: string
  img_logo: string
  code: string
  major_name: string
  summary: string
}

const majors = ref<Major[]>([])

const fetchMajors = async () => {
  try {
    const response = await api.get('/no-auth/majors')
    majors.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil data majors:', err)
  }
}

onMounted(() => {
  fetchMajors()
})
</script>

<template>
  <section id="kompetensi" class="px-12 py-16 flex flex-col items-center gap-16">
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
