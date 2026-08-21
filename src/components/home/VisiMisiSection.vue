<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import MissionItem from '@/components/home/MissionItem.vue'
import StatHighlightCard from '@/components/cards/StatHighlightCard.vue'
import { RiGraduationCapFill, RiTrophyFill, RiCharacterRecognitionFill } from '@remixicon/vue'

const store = useSiteDataStore()
const { vision, missions } = storeToRefs(store)

interface Mission {
  id: number
  order: number
  content: string
}

// susun ulang jadi berpasangan per baris: [1,4,2,5,3,6]
const orderedMissions = computed(() => {
  const half = Math.ceil(missions.value.length / 2)
  const left = missions.value.slice(0, half)
  const right = missions.value.slice(half)
  const result: Mission[] = []
  for (let i = 0; i < half; i++) {
    const leftItem = left[i]
    const rightItem = right[i]
    if (leftItem) result.push(leftItem)
    if (rightItem) result.push(rightItem)
  }
  return result
})

onMounted(() => {
  store.fetchVisionMission()
})
</script>

<template>
  <section class="p-6 flex flex-col gap-10 sm:px-8 sm:gap-12 md:px-12 lg:py-16 lg:gap-16">
    <!-- Visi -->
    <div class="flex flex-col items-center gap-4 text-center sm:gap-5 lg:gap-6">
      <SectionTitle title="Visi" />
      <p class="text-lg text-text-neutral sm:text-xl lg:text-2xl">{{ vision }}</p>
    </div>

    <!-- Misi -->
    <div class="flex flex-col items-center gap-8 lg:gap-12">
      <SectionTitle title="Misi" />

      <!-- Mobile & tablet: 1 kolom, urutan asli -->
      <div class="flex flex-col w-full max-w-6xl gap-6 sm:gap-7 lg:hidden">
        <MissionItem
          v-for="mission in missions"
          :key="mission.id"
          :order="mission.order"
          :content="mission.content"
        />
      </div>

      <!-- Desktop (lg+): 2 kolom, urutan interleaved -->
      <div class="relative hidden w-full max-w-6xl gap-x-24 gap-y-10 lg:grid lg:grid-cols-2">
        <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-text-alt/30"></div>

        <MissionItem
          v-for="mission in orderedMissions"
          :key="mission.id"
          :order="mission.order"
          :content="mission.content"
          :class="mission.order % 2 !== 0 ? 'pr-12' : ''"
        />
      </div>
    </div>
    <!-- Statistik -->
    <div
      class="flex flex-col items-start gap-6 sm:flex-row sm:flex-nowrap sm:items-stretch sm:justify-center sm:gap-4 md:gap-6 lg:flex-wrap lg:gap-16 xl:gap-30"
    >
      <StatHighlightCard
        :logo="RiGraduationCapFill"
        label="2.000+&#10;Siswa Akitf"
        description="Bergabung dalam lingkungan belajar yang positif"
      />

      <StatHighlightCard
        :logo="RiCharacterRecognitionFill"
        label="Akreditasi&#10;Sekolah"
        description="Memberikan kualitas pendidikan terbaik dengan standar unggulan"
      />

      <StatHighlightCard
        :logo="RiTrophyFill"
        label="100+&#10;Prestasi Siswa"
        description="Meraih berbagai penghargaan akademik dan non-akademik setiap tahunnya"
      />
    </div>
  </section>
</template>
